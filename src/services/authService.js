import { USERS, BOVEDA_PASSWORD } from '../data/users.js';
import { obfuscatePassword, deobfuscatePassword } from '../utils/security.js';

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

  // Si no se ha modificado, devuelve la predeterminada del sistema
  return USERS[userKey]?.pass || null;
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
 * Valida si las credenciales ingresadas son correctas para el inicio de sesión
 */
export function verifyCredentials(userKey, inputPassword) {
  if (!userKey || !inputPassword) return false;
  const activePass = getActiveUserPassword(userKey);
  if (!activePass) return false;
  return activePass === inputPassword;
}

/**
 * Ejecuta el cambio de contraseña:
 * - Valida la contraseña actual
 * - Elimina la anterior (la que venía por defecto)
 * - Ofusca la nueva contraseña para que no quede legible ni expuesta en el repositorio
 * - Guarda el registro cifrado en el almacén de la aplicación
 */
export function changeUserPassword(userKey, currentPassword, newPassword) {
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
export function changeBovedaPassword({ keyRole = 'rectora', currentAuthPassword, newPassword, currentUser }) {
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

  return {
    success: true,
    message: `Clave de Bóveda para ${keyRole === 'admin' ? 'Administrador' : 'Rectoría'} actualizada y protegida con éxito. Ambas llaves permanecen aceptadas concurrentemente.`,
    updatedAt: now,
  };
}

