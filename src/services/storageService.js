import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'documentos-galeano';

/**
 * Sanitiza el nombre del archivo para evitar caracteres inválidos en Storage de Supabase.
 */
function sanitizeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // Reemplaza caracteres no alfanuméricos
}

/**
 * Sube un archivo binario directamente al bucket de Supabase Storage.
 * @param {File|Blob} file 
 * @param {string} folder 
 * @param {string} radicado 
 * @returns {Promise<{ storageKey: string|null, error: any }>}
 */
export async function uploadDocumentFile(file, folder = 'general', radicado = 'DOC') {
  if (!isSupabaseConfigured || !supabase || !file) {
    return { storageKey: null, error: null };
  }

  try {
    const rawName = file.name || 'documento.bin';
    const cleanName = sanitizeFileName(rawName);
    const cleanFolder = (folder || 'general').toLowerCase();
    const filePath = `${cleanFolder}/${radicado}_${cleanName}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Advertencia al subir archivo a Supabase Storage:', error);
      return { storageKey: null, error };
    }

    return { storageKey: data?.path || filePath, error: null };
  } catch (err) {
    console.error('Error inesperado al subir archivo:', err);
    return { storageKey: null, error: err };
  }
}

/**
 * Descarga el archivo desde Supabase Storage como Blob para asegurar
 * descarga local fiable independientemente de CORS.
 * @param {string} storageKey 
 * @returns {Promise<Blob|null>}
 */
export async function downloadDocumentBlob(storageKey) {
  if (!isSupabaseConfigured || !supabase || !storageKey) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(storageKey);

    if (error) {
      console.warn('Error descargando Blob de Supabase Storage:', error);
      return null;
    }

    return data; // Retorna Blob
  } catch (err) {
    console.error('Fallo de red al descargar Blob de Storage:', err);
    return null;
  }
}

/**
 * Obtiene la URL pública directa del archivo almacenado.
 * @param {string} storageKey 
 * @returns {string|null}
 */
export function getDocumentPublicUrl(storageKey) {
  if (!isSupabaseConfigured || !supabase || !storageKey) {
    return null;
  }

  try {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storageKey);

    return data?.publicUrl || null;
  } catch (err) {
    console.error('Error obteniendo URL pública de Supabase:', err);
    return null;
  }
}

/**
 * Elimina un archivo de Supabase Storage.
 * @param {string} storageKey 
 */
export async function deleteDocumentFile(storageKey) {
  if (!isSupabaseConfigured || !supabase || !storageKey) {
    return;
  }

  try {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storageKey]);
  } catch (err) {
    console.warn('Error al eliminar archivo de Supabase Storage:', err);
  }
}
