/**
 * Utilidades de Cifrado y Ofuscación — Gimnasio Martin Galeano
 * 
 * Este módulo provee funciones de ofuscación bidireccional segura para que
 * las contraseñas actualizadas se almacenen protegidas y nunca queden en
 * texto plano en el repositorio, ni sean legibles a simple vista en storage.
 */

// Semilla interna de ofuscación institucional
const CIPHER_SIGNATURE = 'GM_SEC_v1$';
const CIPHER_SALT = 'GaleanoPrimaria#2026!SecKey_Directiva9981';

/**
 * Ofusca una cadena de texto (contraseña) para que sea ilegible
 * fuera de la aplicación.
 * @param {string} plaintext 
 * @returns {string} Texto ofuscado con firma institucional
 */
export function obfuscatePassword(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return '';

  const encoder = new TextEncoder();
  const textBytes = encoder.encode(plaintext);
  const saltBytes = encoder.encode(CIPHER_SALT);

  // Transformación combinada: doble XOR rotativo con máscaras dependientes de posición
  const obfuscatedBytes = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    const saltVal = saltBytes[(i * 11 + 19) % saltBytes.length];
    const posMask = ((i + 1) * 23) & 0xff;
    obfuscatedBytes[i] = (textBytes[i] ^ saltVal ^ posMask) & 0xff;
  }

  // Convertir bytes a formato Hexadecimal
  const hex = Array.from(obfuscatedBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Empacar con Base64 y prefijo único
  return `${CIPHER_SIGNATURE}${btoa(hex)}`;
}

/**
 * Descifra u desofusca una contraseña previamente protegida por la aplicación.
 * @param {string} cipherText 
 * @returns {string|null} Contraseña original en texto plano
 */
export function deobfuscatePassword(cipherText) {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith(CIPHER_SIGNATURE)) {
    return null;
  }

  try {
    const rawB64 = cipherText.slice(CIPHER_SIGNATURE.length);
    const hex = atob(rawB64);
    const bytes = new Uint8Array(hex.length / 2);

    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }

    const saltBytes = new TextEncoder().encode(CIPHER_SALT);
    const decryptedBytes = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      const saltVal = saltBytes[(i * 11 + 19) % saltBytes.length];
      const posMask = ((i + 1) * 23) & 0xff;
      decryptedBytes[i] = (bytes[i] ^ saltVal ^ posMask) & 0xff;
    }

    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    console.error('Error al desofuscar credencial:', error);
    return null;
  }
}
