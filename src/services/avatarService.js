import { USERS } from '../data/users.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const AVATAR_PREFIX = 'avatar_';
const AVATARS_STORAGE_KEY = 'gm_user_avatars_v1';

// Avatares base por defecto (SVGs institucionales oficiales)
export const DEFAULT_AVATARS = {
  induccion_rectora: '/images/avatars/rectora.svg',
  induccion: '/images/avatars/rectora.svg',
  admin: '/images/avatars/admin.svg',
  claudia: '/images/avatars/rectora.svg',
  coordinacion: '/images/avatars/coordinacion.svg',
  liliana: '/images/avatars/profe1.svg',
  yuri: '/images/avatars/yuri.svg',
  elcy: '/images/avatars/elcy.svg',
  blanca: '/images/avatars/profe2.svg',
  nicolle: '/images/avatars/profe3.svg',
  jessica: '/images/avatars/jessica.svg',
};

/**
 * Convierte un código SVG en una data URI en Base64 segura y compatible con todos los navegadores
 */
function svgToBase64Uri(svgString) {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    try {
      return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgString)))}`;
    } catch {
      // Fallback
    }
  }
  if (typeof Buffer !== 'undefined') {
    return `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

/**
 * Normaliza cualquier data URI de SVG antigua (utf8) a Base64 estándar para evitar bloqueos en <img>
 */
export function normalizeAvatarUri(uri) {
  if (!uri || typeof uri !== 'string') return uri;
  if (uri.startsWith('data:image/svg+xml;utf8,')) {
    try {
      const decodedSvg = decodeURIComponent(uri.slice('data:image/svg+xml;utf8,'.length));
      return svgToBase64Uri(decodedSvg);
    } catch {
      return uri;
    }
  }
  return uri;
}

// Generador de SVGs vectoriales profesionales para la galería de predefinidos
function createPresetSvgUri(id, bg, iconSvg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="grad_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        ${bg}
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="60" fill="url(#grad_${id})" />
    <g transform="translate(24, 24) scale(0.6)">
      ${iconSvg}
    </g>
  </svg>`;
  return svgToBase64Uri(svg);
}

// Galería de Logos y Avatares institucionales de alta calidad (100% Base64 compatible)
export const PRESET_AVATARS = [
  {
    id: 'logo_gmg',
    name: 'Escudo Gimnasio Martin Galeano',
    category: 'Institucional',
    url: '/images/logos/logo.svg',
    description: 'Emblema oficial del colegio',
  },
  {
    id: 'rectora_oficial',
    name: 'Claudia • Rectora Directiva',
    category: 'Directivo',
    url: '/images/avatars/rectora.svg',
    description: 'Sello institucional de Rectoría',
  },
  {
    id: 'docente_primaria',
    name: 'Docente Primaria • Acompañamiento',
    category: 'Docente',
    url: createPresetSvgUri(
      'docente_primaria',
      '<stop offset="0%" stop-color="#059669"/><stop offset="100%" stop-color="#047857"/>',
      '<circle cx="60" cy="40" r="28" fill="#ffffff"/><path d="M15 105 C15 75 40 68 60 68 C80 68 105 75 105 105 Z" fill="#ffffff"/><circle cx="95" cy="30" r="14" fill="#fbbf24"/><path d="M92 25 L98 25 L95 20 Z" fill="#b45309"/>'
    ),
    description: 'Icono de maestra y pedagogía infantil',
  },
  {
    id: 'docente_matematicas',
    name: 'Docente Matemáticas & Ciencias',
    category: 'Docente',
    url: createPresetSvgUri(
      'docente_matematicas',
      '<stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#1d4ed8"/>',
      '<rect x="25" y="25" width="70" height="70" rx="14" fill="#ffffff"/><path d="M45 42 L75 42 M60 27 L60 57" stroke="#2563eb" stroke-width="7" stroke-linecap="round"/><path d="M45 78 L75 78 M45 88 L75 88" stroke="#2563eb" stroke-width="6" stroke-linecap="round"/>'
    ),
    description: 'Enfoque cuantitativo y ciencias lógicas',
  },
  {
    id: 'docente_lenguaje',
    name: 'Docente Lenguaje & Lectoescritura',
    category: 'Docente',
    url: createPresetSvgUri(
      'docente_lenguaje',
      '<stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#6d28d9"/>',
      '<path d="M20 30 Q60 20 60 40 L60 95 Q60 80 20 85 Z" fill="#ffffff"/><path d="M100 30 Q60 20 60 40 L60 95 Q60 80 100 85 Z" fill="#ede9fe"/><circle cx="60" cy="22" r="10" fill="#fbbf24"/>'
    ),
    description: 'Literatura, comprensión y expresión escrita',
  },
  {
    id: 'docente_artes',
    name: 'Docente Artes & Creatividad',
    category: 'Docente',
    url: createPresetSvgUri(
      'docente_artes',
      '<stop offset="0%" stop-color="#d97706"/><stop offset="100%" stop-color="#b45309"/>',
      '<path d="M60 20 C35 20 20 35 20 60 C20 85 35 100 60 100 C75 100 85 92 85 82 C85 75 78 72 78 65 C78 58 84 55 90 55 C100 55 100 45 100 40 C100 28 82 20 60 20 Z" fill="#ffffff"/><circle cx="38" cy="45" r="7" fill="#ef4444"/><circle cx="58" cy="35" r="7" fill="#3b82f6"/><circle cx="78" cy="45" r="7" fill="#10b981"/><circle cx="42" cy="72" r="7" fill="#f59e0b"/>'
    ),
    description: 'Expresión plástica, lúdica y artística',
  },
  {
    id: 'buho_sabio',
    name: 'Búho Sabio Institucional',
    category: 'Académico',
    url: createPresetSvgUri(
      'buho_sabio',
      '<stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/>',
      '<ellipse cx="60" cy="65" rx="35" ry="40" fill="#ffffff"/><circle cx="45" cy="55" r="14" fill="#fbbf24"/><circle cx="75" cy="55" r="14" fill="#fbbf24"/><circle cx="45" cy="55" r="7" fill="#0f172a"/><circle cx="75" cy="55" r="7" fill="#0f172a"/><polygon points="60,65 54,75 66,75" fill="#f97316"/><polygon points="60,20 25,35 60,42 95,35" fill="#facc15"/><line x1="90" y1="38" x2="95" y2="55" stroke="#facc15" stroke-width="4"/>'
    ),
    description: 'Símbolo universal de la sabiduría y el estudio',
  },
  {
    id: 'birrete_excelencia',
    name: 'Birrete de Excelencia Académica',
    category: 'Académico',
    url: createPresetSvgUri(
      'birrete_excelencia',
      '<stop offset="0%" stop-color="#047857"/><stop offset="100%" stop-color="#064e3b"/>',
      '<polygon points="60,25 15,45 60,62 105,45" fill="#ffffff"/><path d="M35 56 L35 80 Q60 95 85 80 L85 56" fill="#f8fafc" stroke="#ffffff" stroke-width="2"/><line x1="100" y1="47" x2="105" y2="78" stroke="#fbbf24" stroke-width="5" stroke-linecap="round"/><circle cx="105" cy="80" r="5" fill="#fbbf24"/>'
    ),
    description: 'Grados, superación y logros escolares',
  },
  {
    id: 'admin_soporte',
    name: 'Administrador de Sistemas & TI',
    category: 'Tecnología',
    url: createPresetSvgUri(
      'admin_soporte',
      '<stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#1e293b"/>',
      '<rect x="25" y="30" width="70" height="48" rx="8" fill="#ffffff"/><line x1="45" y1="88" x2="75" y2="88" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/><line x1="60" y1="78" x2="60" y2="88" stroke="#ffffff" stroke-width="6"/><circle cx="60" cy="54" r="10" fill="#10b981"/><path d="M35 40 L45 40 M35 48 L50 48" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>'
    ),
    description: 'Soporte de plataforma, bóveda y bases de datos',
  },
];

// Suscriptores en memoria
const listeners = new Set();

function notifyListeners(userKey, avatar) {
  const clean = normalizeAvatarUri(avatar);
  listeners.forEach((fn) => {
    try {
      fn({ userKey, avatar: clean });
    } catch (err) {
      console.warn('[AvatarService] Error en suscriptor:', err);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('gmg_avatar_updated', {
        detail: { userKey, avatar: clean },
      })
    );
  }
}

/**
 * Lee la memoria caché local de avatares
 */
export function getStoredAvatars() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(AVATARS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Guarda en caché local
 */
export function saveStoredAvatars(map) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AVATARS_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[AvatarService] Error guardando avatares en caché local:', err);
  }
}

/**
 * Inicializa y aplica avatares desde la caché local en memoria al arrancar
 */
export function initLocalAvatars() {
  const cache = getStoredAvatars();
  let changed = false;

  Object.entries(cache).forEach(([key, avatarUrl]) => {
    if (USERS[key] && avatarUrl) {
      const normalized = normalizeAvatarUri(avatarUrl);
      USERS[key].avatar = normalized;
      if (normalized !== avatarUrl) {
        cache[key] = normalized;
        changed = true;
      }
    }
  });

  if (changed) {
    saveStoredAvatars(cache);
  }
}

// Ejecutar inicialización inmediata al cargar módulo
initLocalAvatars();

/**
 * Obtiene el avatar activo de un usuario (personalizado, por defecto o inicial)
 */
export function getUserAvatar(userKey) {
  if (!userKey) return null;
  const key = String(userKey).trim();
  const lowerKey = key.toLowerCase();
  const normalizedKey = lowerKey.replace(/\s+/g, '');

  const cache = getStoredAvatars();
  if (cache[key]) return normalizeAvatarUri(cache[key]);
  if (cache[lowerKey]) return normalizeAvatarUri(cache[lowerKey]);
  if (cache[normalizedKey]) return normalizeAvatarUri(cache[normalizedKey]);

  // Buscar en USERS por clave directa, clave normalizada o nombre
  const userObj = USERS[key] || USERS[lowerKey] || USERS[normalizedKey] ||
    Object.values(USERS).find(u => u.name?.toLowerCase() === lowerKey);

  const defaultSvg = DEFAULT_AVATARS[key] || DEFAULT_AVATARS[lowerKey] || DEFAULT_AVATARS[normalizedKey] ||
    (userObj?.role ? DEFAULT_AVATARS[userObj.role] : null);

  const userVal = userObj?.avatar || defaultSvg || null;
  return normalizeAvatarUri(userVal);
}

/**
 * Procesa y optimiza un archivo de imagen subido por el usuario (Canvas)
 * Redimensiona a máximo 256x256 con recorte circular centrado y compresión WebP
 */
export async function processAvatarImageFile(file, maxDimension = 256, quality = 0.85) {
  if (!file) {
    throw new Error('No se seleccionó ningún archivo de imagen.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen válida (debe ser JPG, PNG, WEBP o SVG).');
  }

  // Si el archivo supera 10 MB antes de procesar, rechazar
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('La imagen original excede los 10 MB. Por favor seleccione una imagen más liviana.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar el formato de la imagen.'));

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Dimensiones de corte cuadrado centrado
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;

          const targetSize = Math.min(minSide, maxDimension);
          canvas.width = targetSize;
          canvas.height = targetSize;

          // Suavizado de imagen de alta calidad
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Dibujar centrado
          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, targetSize, targetSize);

          // Exportar como WebP liviano (~15-25 KB); fallback a JPEG si el navegador no soporta WebP
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(dataUrl);
        } catch (err) {
          reject(new Error('Error al procesar y recortar la imagen en el lienzo: ' + err.message));
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Guarda o actualiza el logo/avatar de un usuario en la nube (Supabase) y localmente
 */
export async function saveUserAvatar(userKey, avatarUrlOrDataUri, updatedBy = 'Usuario') {
  if (!userKey || !USERS[userKey]) {
    throw new Error(`Usuario institucional '${userKey}' no válido.`);
  }

  if (!avatarUrlOrDataUri) {
    throw new Error('El contenido del logo o avatar no puede estar vacío.');
  }

  const cleanAvatar = normalizeAvatarUri(avatarUrlOrDataUri);
  const nowIso = new Date().toISOString();

  // 1. Guardar en memoria de USERS
  USERS[userKey].avatar = cleanAvatar;

  // 2. Guardar en caché local
  const cache = getStoredAvatars();
  cache[userKey] = cleanAvatar;
  saveStoredAvatars(cache);

  // 3. Notificar a componentes locales y pestañas
  notifyListeners(userKey, cleanAvatar);

  // 4. Sincronizar en la Nube con Supabase (institutional_vault)
  let cloudSynced = false;
  let cloudError = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        user_key: `${AVATAR_PREFIX}${userKey}`,
        cipher: cleanAvatar,
        default_invalidated: true,
        updated_at: nowIso,
      };

      const { error } = await supabase
        .from('institutional_vault')
        .upsert(payload, { onConflict: 'user_key' });

      if (error) {
        console.warn(`[AvatarService] Advertencia al sincronizar logo de ${userKey} en Supabase:`, error);
        cloudError = error.message;
      } else {
        cloudSynced = true;
      }
    } catch (err) {
      console.warn(`[AvatarService] Error de red al persistir avatar en la nube:`, err);
      cloudError = err.message;
    }
  }

  return {
    success: true,
    userKey,
    avatar: cleanAvatar,
    cloudSynced,
    cloudError,
    updatedAt: nowIso,
  };
}

/**
 * Restaura el logo/avatar por defecto del usuario
 */
export async function resetUserAvatar(userKey) {
  if (!userKey || !USERS[userKey]) {
    throw new Error(`Usuario institucional '${userKey}' no válido.`);
  }

  const defaultAvatar = DEFAULT_AVATARS[userKey] || null;

  // 1. En memoria
  USERS[userKey].avatar = defaultAvatar;

  // 2. En caché local
  const cache = getStoredAvatars();
  delete cache[userKey];
  saveStoredAvatars(cache);

  // 3. Notificar
  notifyListeners(userKey, defaultAvatar);

  // 4. En la Nube (borrar registro o dejar vacío)
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('institutional_vault')
        .delete()
        .eq('user_key', `${AVATAR_PREFIX}${userKey}`);
    } catch (err) {
      console.warn('[AvatarService] Advertencia al eliminar avatar en Supabase:', err);
    }
  }

  return {
    success: true,
    userKey,
    avatar: defaultAvatar,
  };
}

/**
 * Descarga y sincroniza todos los logos/avatares guardados en Supabase institucional
 */
export async function syncAvatarsFromCloud() {
  if (!isSupabaseConfigured || !supabase) {
    return { synced: false, count: 0 };
  }

  try {
    const { data, error } = await supabase
      .from('institutional_vault')
      .select('user_key, cipher, updated_at')
      .ilike('user_key', `${AVATAR_PREFIX}%`);

    if (error) {
      console.warn('[AvatarService] Error al consultar avatares en la nube:', error);
      return { synced: false, error };
    }

    if (!Array.isArray(data)) {
      return { synced: true, count: 0 };
    }

    const cache = getStoredAvatars();
    let updatedCount = 0;

    data.forEach((row) => {
      if (!row?.user_key || !row.user_key.toLowerCase().startsWith(AVATAR_PREFIX)) return;
      const uKey = row.user_key.slice(AVATAR_PREFIX.length);
      const normalizedCipher = normalizeAvatarUri(row.cipher);

      if (USERS[uKey] && normalizedCipher) {
        USERS[uKey].avatar = normalizedCipher;
        cache[uKey] = normalizedCipher;
        updatedCount++;
        notifyListeners(uKey, normalizedCipher);
      }
    });

    saveStoredAvatars(cache);
    return { synced: true, count: updatedCount };
  } catch (err) {
    console.warn('[AvatarService] Excepción sincronizando avatares:', err);
    return { synced: false, error: err };
  }
}

/**
 * Suscripción en tiempo real a cambios de logos/avatares desde cualquier dispositivo
 */
export function subscribeToAvatarChanges(callback) {
  if (typeof callback === 'function') {
    listeners.add(callback);
  }

  // Escuchar eventos en la ventana (multi-pestaña)
  const handleWindowStorage = (e) => {
    if (e.key === AVATARS_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        Object.entries(parsed).forEach(([k, av]) => {
          const cleanAv = normalizeAvatarUri(av);
          if (USERS[k]) {
            USERS[k].avatar = cleanAv;
            if (callback) callback({ userKey: k, avatar: cleanAv });
          }
        });
      } catch {}
    }
  };

  const handleCustomEvent = (e) => {
    if (e?.detail && callback) {
      const clean = normalizeAvatarUri(e.detail.avatar);
      callback({ ...e.detail, avatar: clean });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleWindowStorage);
    window.addEventListener('gmg_avatar_updated', handleCustomEvent);
  }

  // Suscripción Realtime en Supabase
  let supabaseChannel = null;
  if (isSupabaseConfigured && supabase) {
    try {
      supabaseChannel = supabase
        .channel('institutional_avatar_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'institutional_vault' },
          (payload) => {
            const row = payload.new || payload.old;
            if (row?.user_key && row.user_key.toLowerCase().startsWith(AVATAR_PREFIX)) {
              const uKey = row.user_key.slice(AVATAR_PREFIX.length);
              const rawAvatar = payload.eventType === 'DELETE' ? (DEFAULT_AVATARS[uKey] || null) : (payload.new?.cipher || null);
              const avatar = normalizeAvatarUri(rawAvatar);

              if (USERS[uKey]) {
                USERS[uKey].avatar = avatar;
                const cache = getStoredAvatars();
                if (avatar) cache[uKey] = avatar;
                else delete cache[uKey];
                saveStoredAvatars(cache);
                notifyListeners(uKey, avatar);
              }
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[AvatarService] Error suscribiendo a Realtime de avatares:', err);
    }
  }

  return () => {
    if (typeof callback === 'function') {
      listeners.delete(callback);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleWindowStorage);
      window.removeEventListener('gmg_avatar_updated', handleCustomEvent);
    }
    if (supabaseChannel && supabase) {
      supabase.removeChannel(supabaseChannel);
    }
  };
}
