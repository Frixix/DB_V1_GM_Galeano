import { USERS } from '../data/users.js';
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
