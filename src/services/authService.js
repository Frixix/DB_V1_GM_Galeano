import { USERS, BOVEDA_PASSWORD } from '../data/users.js';
import { obfuscatePassword, deobfuscatePassword } from '../utils/security.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const STORAGE_VAULT_KEY = 'gm_galeano_auth_sec_vault';

/**
 * Obtiene el almacén seguro de credenciales desde localStorage
 */
export function getStoredCredentials() {
  try {
    const raw = localStorage.getItem(STORAGE_VAULT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Error al leer credenciales del almacenamiento:', err);
    return {};
  }
}

/**
 * Guarda el mapa de credenciales ofuscadas en localStorage
 */
export function saveStoredCredentials(credentials) {
  try {
    localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(credentials));
  } catch (err) {
    console.error('Error al guardar credenciales en el almacenamiento:', err);
  }
}

/**
 * Sube o actualiza una clave ofuscada individual en la tabla institutional_vault de Supabase
 */
export async function upsertVaultKey(userKey, cipher, defaultInvalidated = true, updatedAt = new Date().toISOString()) {
  if (!isSupabaseConfigured || !supabase || !userKey || !cipher) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('institutional_vault')
      .upsert(
        {
          user_key: userKey,
          cipher,
          default_invalidated: defaultInvalidated,
          updated_at: updatedAt,
        },
        { onConflict: 'user_key' }
      );

    if (error) {
      console.warn(`[Vault] Advertencia al sincronizar clave de '${userKey}' en Supabase:`, error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`[Vault] Error de conexión al sincronizar '${userKey}':`, err);
    return null;
  }
}

/**
 * Sincroniza bidireccionalmente el almacén local con la tabla institutional_vault en Supabase:
 * 1. Descarga todas las claves ofuscadas de Supabase y las almacena en memoria y localStorage.
 * 2. Si existen credenciales locales previas que aún no estén en Supabase, las sube automáticamente.
 */
export async function syncVaultWithSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    return { synced: false, reason: 'Supabase no configurado' };
  }

  try {
    const { data, error } = await supabase
      .from('institutional_vault')
      .select('user_key, cipher, default_invalidated, updated_at');

    if (error) {
      console.warn('[Vault] Error al consultar institutional_vault en Supabase:', error);
      return { synced: false, error };
    }

    const creds = getStoredCredentials();
    let localChanged = false;
    const remoteKeys = new Set();

    if (Array.isArray(data)) {
      for (const row of data) {
        if (!row?.user_key || row.user_key.startsWith('presence_') || row.user_key.startsWith('session_') || row.user_key.startsWith('avatar_')) {
          continue;
        }
        remoteKeys.add(row.user_key);

        if (row.user_key === 'boveda_rectora') {
          if (!creds.boveda) creds.boveda = {};
          creds.boveda.rectoraCipher = row.cipher;
          creds.boveda.isRectoraCustom = true;
          creds.boveda.rectoraUpdatedAt = row.updated_at;
          localChanged = true;
        } else if (row.user_key === 'boveda_admin') {
          if (!creds.boveda) creds.boveda = {};
          creds.boveda.adminCipher = row.cipher;
          creds.boveda.isAdminCustom = true;
          creds.boveda.adminUpdatedAt = row.updated_at;
          localChanged = true;
        } else {
          creds[row.user_key] = {
            cipher: row.cipher,
            defaultInvalidated: row.default_invalidated !== false,
            updatedAt: row.updated_at,
          };
          localChanged = true;

          // Actualizar contraseña en memoria si es descifrable por el motor
          const deciphered = deobfuscatePassword(row.cipher);
          if (deciphered && USERS[row.user_key]) {
            USERS[row.user_key].pass = deciphered;
          }
        }
      }
    }

    // Migración automática de credenciales locales previas que aún no estén en Supabase
    const toPush = [];
    for (const [key, val] of Object.entries(creds)) {
      if (key === 'boveda') {
        if (val.rectoraCipher && !remoteKeys.has('boveda_rectora')) {
          toPush.push({
            user_key: 'boveda_rectora',
            cipher: val.rectoraCipher,
            default_invalidated: true,
            updated_at: val.rectoraUpdatedAt || new Date().toISOString(),
          });
        }
        if (val.adminCipher && !remoteKeys.has('boveda_admin')) {
          toPush.push({
            user_key: 'boveda_admin',
            cipher: val.adminCipher,
            default_invalidated: true,
            updated_at: val.adminUpdatedAt || new Date().toISOString(),
          });
        }
      } else if (val && val.cipher && !remoteKeys.has(key)) {
        toPush.push({
          user_key: key,
          cipher: val.cipher,
          default_invalidated: Boolean(val.defaultInvalidated),
          updated_at: val.updatedAt || new Date().toISOString(),
        });
      }
    }

    if (toPush.length > 0) {
      await supabase.from('institutional_vault').upsert(toPush, { onConflict: 'user_key' });
    }

    if (localChanged) {
      saveStoredCredentials(creds);
    }

    return { synced: true, count: data?.length || 0, migrated: toPush.length };
  } catch (err) {
    console.warn('[Vault] Excepción al sincronizar bóveda con Supabase:', err);
    return { synced: false, error: err };
  }
}

/**
 * Suscripción en tiempo real a cambios en la tabla institutional_vault de Supabase
 */
export function subscribeToVaultChanges(callback) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel('institutional_vault_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'institutional_vault' },
        async (payload) => {
          const rowKey = payload?.new?.user_key || payload?.old?.user_key;
          if (rowKey && (rowKey.startsWith('avatar_') || rowKey.startsWith('presence_'))) {
            return;
          }
          await syncVaultWithSupabase();
          if (callback) callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Vault] No se pudo activar suscripción en tiempo real:', err);
    return () => {};
  }
}

// Auto-sincronización inicial no bloqueante en navegador
if (typeof window !== 'undefined') {
  syncVaultWithSupabase().catch(() => {});
}

/**
 * Resuelve la clave de usuario en el diccionario USERS (ej: 'claudia')
 */
export function resolveUserKey(userOrKey) {
  if (!userOrKey) return null;
  if (typeof userOrKey === 'string') {
    if (USERS[userOrKey]) return userOrKey;
    const foundEntry = Object.entries(USERS).find(([, u]) => u.name === userOrKey);
    return foundEntry ? foundEntry[0] : null;
  }
  if (typeof userOrKey === 'object') {
    if (userOrKey.key && USERS[userOrKey.key]) return userOrKey.key;
    const foundEntry = Object.entries(USERS).find(
      ([k, u]) => u.name === userOrKey.name || (userOrKey.role && u.role === userOrKey.role && k === userOrKey.role)
    );
    return foundEntry ? foundEntry[0] : null;
  }
  return null;
}

/**
 * Obtiene la contraseña activa y descifrada para un usuario.
 * Si el usuario cambió la contraseña por defecto, esta última queda eliminada.
 */
export function getActiveUserPassword(userKey) {
  const creds = getStoredCredentials();
  const entry = creds[userKey];

  if (entry && entry.cipher) {
    const deciphered = deobfuscatePassword(entry.cipher);
    if (deciphered) return deciphered;
  }

  // Si se marcó que la clave por defecto fue invalidada/eliminada y no hay clave válida, denegar
  if (entry && entry.defaultInvalidated) {
    return null;
  }

  // Clave institucional inicial predeterminada (boveda2026) o registrada en USERS
  return 'boveda2026';
}

/**
 * Verifica si el usuario ya eliminó la contraseña por defecto y tiene una ofuscada
 */
export function hasCustomPassword(userKey) {
  const creds = getStoredCredentials();
  return Boolean(creds[userKey]?.cipher && creds[userKey]?.defaultInvalidated);
}

/**
 * Obtiene la fecha en que se actualizó la contraseña
 */
export function getPasswordUpdatedAt(userKey) {
  const creds = getStoredCredentials();
  return creds[userKey]?.updatedAt || null;
}

/**
 * Valida si las credenciales ingresadas son correctas para el inicio de sesión:
 * - Si el usuario ya cambió su clave: solo acepta su clave personalizada descifrada.
 * - Si es primer ingreso (no cambiada aún): acepta 'boveda2026' y la clave inicial de USERS.
 */
export function verifyCredentials(userKey, inputPassword) {
  if (!userKey || !inputPassword) return false;
  const cleanInput = (inputPassword || '').trim();

  // 1. Si ya tiene clave personalizada, validar exclusivamente contra ella
  if (hasCustomPassword(userKey)) {
    const activePass = getActiveUserPassword(userKey);
    return Boolean(activePass && activePass === cleanInput);
  }

  // 2. Si es su primer ingreso (aún no cambiada), acepta 'boveda2026' o la predeterminada de USERS
  if (cleanInput === 'boveda2026' || cleanInput === BOVEDA_PASSWORD) {
    return true;
  }
  const defaultUserPass = USERS[userKey]?.pass;
  if (defaultUserPass && cleanInput === defaultUserPass) {
    return true;
  }

  return false;
}

/**
 * Ejecuta el cambio de contraseña:
 * - Valida la contraseña actual
 * - Elimina la anterior (la que venía por defecto)
 * - Ofusca la nueva contraseña para que no quede legible ni expuesta en el repositorio
 * - Guarda el registro cifrado en el almacén de la aplicación
 */
export async function changeUserPassword(userKey, currentPassword, newPassword) {
  if (!userKey || !USERS[userKey]) {
    throw new Error('Usuario institucional no válido.');
  }

  // 1. Validar contraseña actual
  if (!verifyCredentials(userKey, currentPassword)) {
    throw new Error('La contraseña actual ingresada es incorrecta.');
  }

  // 2. Validar longitud y seguridad básica de la nueva contraseña
  const cleanNewPass = (newPassword || '').trim();
  if (cleanNewPass.length < 5) {
    throw new Error('La nueva contraseña debe tener al menos 5 caracteres.');
  }

  if (cleanNewPass === currentPassword) {
    throw new Error('La nueva contraseña debe ser distinta a la actual.');
  }

  // 3. Ofuscar la nueva contraseña (cifrado reversible exclusivo de la app)
  const obfuscatedCipher = obfuscatePassword(cleanNewPass);

  // 4. Guardar en almacenamiento seguro eliminando la contraseña por defecto
  const creds = getStoredCredentials();
  creds[userKey] = {
    cipher: obfuscatedCipher,
    updatedAt: new Date().toISOString(),
    defaultInvalidated: true, // La anterior contraseña por defecto queda formalmente eliminada
  };
  saveStoredCredentials(creds);

  // 5. Actualizar en memoria para la sesión activa
  if (USERS[userKey]) {
    USERS[userKey].pass = cleanNewPass;
  }

  // 6. Respaldar en la nube con Supabase de forma segura
  try {
    await upsertVaultKey(userKey, obfuscatedCipher, true, creds[userKey].updatedAt);
  } catch (syncErr) {
    console.warn('[Vault] No se pudo respaldar de inmediato en Supabase:', syncErr);
  }

  return {
    success: true,
    message: 'Contraseña actualizada y protegida con éxito.',
    updatedAt: creds[userKey].updatedAt,
  };
}

// =====================================================================
// GESTIÓN DE SEGURIDAD DE LA BÓVEDA (DOBLE CONTRASEÑA CONCURRENTE)
// =====================================================================

/**
 * Obtiene las contraseñas activas y descifradas para acceder a la Bóveda.
 * Soporta dos llaves concurrentes: la de Rectoría y la de Administración.
 */
export function getBovedaCredentials() {
  const creds = getStoredCredentials();
  const bovedaData = creds.boveda || {};

  // Llave de Administración (por defecto 'boveda2026' o personalizada)
  let adminPass = BOVEDA_PASSWORD;
  if (bovedaData.adminCipher) {
    const dec = deobfuscatePassword(bovedaData.adminCipher);
    if (dec) adminPass = dec;
  }

  // Llave de Rectoría (por defecto 'boveda2026' o la personalizada que modifique la rectora)
  let rectoraPass = BOVEDA_PASSWORD;
  if (bovedaData.rectoraCipher) {
    const dec = deobfuscatePassword(bovedaData.rectoraCipher);
    if (dec) rectoraPass = dec;
  }

  return {
    adminPass,
    rectoraPass,
    isAdminCustom: Boolean(bovedaData.isAdminCustom),
    isRectoraCustom: Boolean(bovedaData.isRectoraCustom),
    adminUpdatedAt: bovedaData.adminUpdatedAt || null,
    rectoraUpdatedAt: bovedaData.rectoraUpdatedAt || null,
  };
}

/**
 * Verifica si la clave ingresada coincide con CUALQUIERA de las dos llaves
 * autorizadas de la Bóveda (la del Administrador o la de la Rectora).
 */
export function verifyBovedaPassword(inputPassword) {
  if (!inputPassword || typeof inputPassword !== 'string') {
    return { valid: false, error: 'Ingrese una contraseña válida.' };
  }

  const cleanInput = inputPassword.trim();
  const { adminPass, rectoraPass } = getBovedaCredentials();

  if (cleanInput === rectoraPass) {
    return { valid: true, unlockedBy: 'rectora' };
  }

  if (cleanInput === adminPass) {
    return { valid: true, unlockedBy: 'admin' };
  }

  return { valid: false, error: 'Clave de seguridad incorrecta. Acceso a la bóveda denegado.' };
}

/**
 * Permite cambiar la clave de la Bóveda (solo accesible una vez dentro de la Bóveda).
 * Permite actualizar la clave según el perfil solicitante (rectora o admin),
 * manteniendo activas ambas llaves de forma concurrente.
 */
export async function changeBovedaPassword({ keyRole = 'rectora', currentAuthPassword, newPassword, currentUser }) {
  const cleanNew = (newPassword || '').trim();
  if (cleanNew.length < 5) {
    throw new Error('La nueva clave de la Bóveda debe tener al menos 5 caracteres.');
  }

  const { adminPass, rectoraPass } = getBovedaCredentials();
  const cleanAuth = (currentAuthPassword || '').trim();

  // Validación de autorización:
  // Puede autorizarse con la clave actual de bóveda (rectora o admin) o con la clave institucional del usuario
  const isAuthByBoveda = cleanAuth === rectoraPass || cleanAuth === adminPass;
  let isAuthByUser = false;
  if (currentUser) {
    const userKey = resolveUserKey(currentUser);
    if (userKey && verifyCredentials(userKey, cleanAuth)) {
      isAuthByUser = true;
    }
  }

  if (!isAuthByBoveda && !isAuthByUser) {
    throw new Error('La contraseña de autorización ingresada es incorrecta.');
  }

  if (keyRole === 'rectora' && cleanNew === rectoraPass) {
    throw new Error('La nueva clave de la Bóveda debe ser diferente a la clave actual de Rectoría.');
  }
  if (keyRole === 'admin' && cleanNew === adminPass) {
    throw new Error('La nueva clave de la Bóveda debe ser diferente a la clave actual de Administración.');
  }

  // Ofuscar con algoritmo interno de la app (nunca guardada en texto plano)
  const obfuscatedCipher = obfuscatePassword(cleanNew);

  const creds = getStoredCredentials();
  if (!creds.boveda) {
    creds.boveda = {};
  }

  const now = new Date().toISOString();
  if (keyRole === 'admin') {
    creds.boveda.adminCipher = obfuscatedCipher;
    creds.boveda.isAdminCustom = true;
    creds.boveda.adminUpdatedAt = now;
  } else {
    creds.boveda.rectoraCipher = obfuscatedCipher;
    creds.boveda.isRectoraCustom = true;
    creds.boveda.rectoraUpdatedAt = now;
  }

  saveStoredCredentials(creds);

  // Sincronizar en la nube con Supabase de forma segura
  try {
    await upsertVaultKey(
      keyRole === 'admin' ? 'boveda_admin' : 'boveda_rectora',
      obfuscatedCipher,
      true,
      now
    );
  } catch (syncErr) {
    console.warn('[Vault] No se pudo sincronizar de inmediato la Bóveda con Supabase:', syncErr);
  }

  return {
    success: true,
    message: `Clave de Bóveda para ${keyRole === 'admin' ? 'Administrador' : 'Rectoría'} actualizada y protegida con éxito. Ambas llaves permanecen aceptadas concurrentemente.`,
    updatedAt: now,
  };
}

