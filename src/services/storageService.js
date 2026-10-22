import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { 
  r2Client, 
  isR2Configured, 
  R2_BUCKET_NAME, 
  R2_PUBLIC_DOMAIN, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from '../lib/r2Client.js';

export const STORAGE_BUCKET = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SUPABASE_STORAGE_BUCKET) || (typeof process !== 'undefined' && process?.env?.VITE_SUPABASE_STORAGE_BUCKET) || 'documentos-galeano';

/**
 * Sanitiza el nombre del archivo para evitar caracteres inválidos en Storage.
 */
function sanitizeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
    .replace(/[^a-zA-Z0-9._-]/g, '_'); // Reemplaza caracteres no alfanuméricos
}

/**
 * Deduce el tipo MIME exacto a partir del nombre o tipo de archivo.
 */
export function getMimeType(fileName = '', fallbackType = '') {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeMap = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    jfif: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    txt: 'text/plain',
    csv: 'text/csv',
    zip: 'application/zip',
  };
  return mimeMap[ext] || fallbackType || 'application/octet-stream';
}

/**
 * Sube un archivo binario directamente a Cloudflare R2 (con respaldo en Supabase Storage).
 * @param {File|Blob} file 
 * @param {string} folder 
 * @param {string} radicado 
 * @returns {Promise<{ storageKey: string|null, error: any, provider?: string }>}
 */
export async function uploadDocumentFile(file, folder = 'general', radicado = 'DOC') {
  if (!file) {
    return { storageKey: null, error: null };
  }

  const rawName = file.name || 'documento.bin';
  const cleanName = sanitizeFileName(rawName);
  const cleanFolder = (folder || 'general').toLowerCase();
  const filePath = `${cleanFolder}/${radicado}_${cleanName}`;
  const resolvedContentType = getMimeType(cleanName, file.type);

  // 1. Prioridad: Cloudflare R2 (10 GB gratis, $0 Egress)
  if (isR2Configured && r2Client) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filePath,
        Body: new Uint8Array(arrayBuffer),
        ContentType: resolvedContentType,
      });

      await r2Client.send(command);
      return { storageKey: filePath, error: null, provider: 'cloudflare-r2' };
    } catch (r2Err) {
      console.warn('[R2 Storage] Advertencia al subir a Cloudflare R2, intentando respaldo con Supabase:', r2Err);
    }
  }

  // 2. Respaldo: Supabase Storage
  if (isSupabaseConfigured && supabase) {
    try {
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

      return { storageKey: data?.path || filePath, error: null, provider: 'supabase' };
    } catch (err) {
      console.error('Error inesperado al subir archivo:', err);
      return { storageKey: null, error: err };
    }
  }

  return { storageKey: null, error: null };
}

/**
 * Descarga el archivo desde Cloudflare R2 o Supabase Storage como Blob
 * para asegurar descarga fiable independientemente del navegador.
 * @param {string} storageKey 
 * @returns {Promise<Blob|null>}
 */
export async function downloadDocumentBlob(storageKey) {
  if (!storageKey) return null;

  // 1. Intentar descargar desde Cloudflare R2
  if (isR2Configured && r2Client) {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storageKey,
      });

      const response = await r2Client.send(command);
      if (response && response.Body) {
        const effectiveType = (!response.ContentType || response.ContentType === 'application/octet-stream')
          ? getMimeType(storageKey, response.ContentType)
          : response.ContentType;

        if (response.Body instanceof Blob) {
          return response.Body.type && response.Body.type !== 'application/octet-stream'
            ? response.Body
            : new Blob([response.Body], { type: effectiveType });
        }
        if (typeof response.Body.transformToByteArray === 'function') {
          const byteArray = await response.Body.transformToByteArray();
          return new Blob([byteArray], { type: effectiveType });
        }
        // Fallback estándar de navegador con Web Streams API
        try {
          const res = new Response(response.Body);
          const rawBlob = await res.blob();
          return new Blob([rawBlob], { type: effectiveType });
        } catch {
          // Si falla Response wrapper, retornar null para que continúe
        }
      }
    } catch (r2Err) {
      console.warn('[R2 Storage] No se pudo obtener de R2 o no existe allí, intentando Supabase:', r2Err);
    }
  }

  // 2. Respaldo: Supabase Storage
  if (isSupabaseConfigured && supabase) {
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
      console.error('Fallo de red al descargar Blob de Supabase:', err);
      return null;
    }
  }

  return null;
}

/**
 * Obtiene la URL pública directa del archivo almacenado.
 * @param {string} storageKey 
 * @returns {string|null}
 */
export function getDocumentPublicUrl(storageKey) {
  if (!storageKey) return null;

  // Si se configuró dominio público en R2 (r2.dev o subdominio propio)
  if (R2_PUBLIC_DOMAIN) {
    const base = R2_PUBLIC_DOMAIN.endsWith('/') ? R2_PUBLIC_DOMAIN.slice(0, -1) : R2_PUBLIC_DOMAIN;
    return `${base}/${storageKey}`;
  }

  // Respaldo con URL de Supabase Storage
  if (isSupabaseConfigured && supabase) {
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

  return null;
}

/**
 * Elimina un archivo de Cloudflare R2 y de Supabase Storage.
 * @param {string} storageKey 
 */
export async function deleteDocumentFile(storageKey) {
  if (!storageKey) return;

  if (isR2Configured && r2Client) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storageKey,
      });
      await r2Client.send(command);
    } catch (r2Err) {
      console.warn('[R2 Storage] Advertencia al eliminar archivo de R2:', r2Err);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storageKey]);
    } catch (err) {
      console.warn('Error al eliminar archivo de Supabase Storage:', err);
    }
  }
}
