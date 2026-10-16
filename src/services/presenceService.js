import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { USERS } from '../data/users.js';
import { getUserAvatar } from './avatarService.js';

// Prefijo único: exactamente 1 registro por usuario (se sobrescribe en cada conexión)
const PRESENCE_USER_PREFIX = 'presence_user_';
const PRESENCE_CHANNEL_NAME = 'gm_presence_room';
const PRESENCE_LOCAL_CACHE_KEY = 'gm_presence_cache_v1';

// Límite de inactividad (3.5 minutos) tras el cual se considera desconectado automáticamente
const HEARTBEAT_OFFLINE_THRESHOLD_MS = 3.5 * 60 * 1000;

/**
 * Detecta dispositivo y navegador de forma amigable para la Rectora
 */
export function getDeviceSummary() {
  if (typeof window === 'undefined' || !navigator) return 'Navegador Web';
  const ua = navigator.userAgent || '';
  
  let browser = 'Navegador';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';

  let os = 'Dispositivo';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'Mac';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  return `${browser} (${os}${isMobile ? ' Móvil' : ''})`;
}

/**
 * Lee caché local de estados
 */
export function getStoredPresenceCache() {
  try {
    const raw = localStorage.getItem(PRESENCE_LOCAL_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Guarda caché local de estados
 */
export function saveStoredPresenceCache(data) {
  try {
    localStorage.setItem(PRESENCE_LOCAL_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignorar errores de cuota local
  }
}

/**
 * Registra o SOBRESCRIBE la última conexión del usuario.
 * Solo almacena la última fecha y hora, reemplazando cualquier conexión anterior.
 */
export async function recordUserLogin(currentUser) {
  if (!currentUser || !currentUser.key) return null;

  const nowIso = new Date().toISOString();
  const device = getDeviceSummary();

  const userStatus = {
    userKey: currentUser.key,
    name: currentUser.name,
    role: currentUser.role,
    isOnline: true,
    lastConnectedAt: nowIso,
    lastSeenAt: nowIso,
    disconnectedAt: null,
    device,
  };

  // Actualizar caché local
  const cache = getStoredPresenceCache();
  cache[currentUser.key] = userStatus;
  saveStoredPresenceCache(cache);

  // Sobrescribir en Supabase: Reemplaza la fecha anterior dejando solo la última
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('institutional_vault').upsert({
        user_key: `${PRESENCE_USER_PREFIX}${currentUser.key}`,
        cipher: JSON.stringify(userStatus),
        default_invalidated: false,
        updated_at: nowIso,
      }, { onConflict: 'user_key' });
    } catch (err) {
      console.warn('[Presence] Advertencia al actualizar estado en Supabase:', err);
    }
  }

  return userStatus;
}

/**
 * Actualiza el latido de actividad (heartbeat) para mantener el estado "En línea"
 */
export async function recordUserHeartbeat(currentUser) {
  if (!currentUser || !currentUser.key) return;

  const nowIso = new Date().toISOString();
  const cache = getStoredPresenceCache();
  if (cache[currentUser.key]) {
    cache[currentUser.key].lastSeenAt = nowIso;
    cache[currentUser.key].isOnline = true;
    saveStoredPresenceCache(cache);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const current = cache[currentUser.key] || {
        userKey: currentUser.key,
        name: currentUser.name,
        role: currentUser.role,
        isOnline: true,
        lastConnectedAt: nowIso,
        lastSeenAt: nowIso,
        device: getDeviceSummary(),
      };
      current.lastSeenAt = nowIso;
      current.isOnline = true;

      await supabase.from('institutional_vault').upsert({
        user_key: `${PRESENCE_USER_PREFIX}${currentUser.key}`,
        cipher: JSON.stringify(current),
        default_invalidated: false,
        updated_at: nowIso,
      }, { onConflict: 'user_key' });
    } catch {
      // Silencioso en latidos periódicos
    }
  }
}

/**
 * Registra el cierre de sesión voluntario (actualiza el mismo registro único)
 */
export async function recordUserLogout(currentUser) {
  if (!currentUser || !currentUser.key) return;

  const nowIso = new Date().toISOString();
  const cache = getStoredPresenceCache();
  if (cache[currentUser.key]) {
    cache[currentUser.key].isOnline = false;
    cache[currentUser.key].disconnectedAt = nowIso;
    cache[currentUser.key].lastSeenAt = nowIso;
    saveStoredPresenceCache(cache);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const finalStatus = {
        userKey: currentUser.key,
        name: currentUser.name,
        role: currentUser.role,
        isOnline: false,
        lastConnectedAt: cache[currentUser.key]?.lastConnectedAt || nowIso,
        lastSeenAt: nowIso,
        disconnectedAt: nowIso,
        device: getDeviceSummary(),
      };

      await supabase.from('institutional_vault').upsert({
        user_key: `${PRESENCE_USER_PREFIX}${currentUser.key}`,
        cipher: JSON.stringify(finalStatus),
        default_invalidated: false,
        updated_at: nowIso,
      }, { onConflict: 'user_key' });
    } catch (err) {
      console.warn('[Presence] Error registrando salida:', err);
    }
  }
}

/**
 * Obtiene el estado actual del personal institucional (exactamente 1 fila por usuario)
 */
export async function fetchPresenceOverview(activeRealtimeKeys = new Set()) {
  const localCache = getStoredPresenceCache();
  let remoteStatusMap = { ...localCache };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('institutional_vault')
        .select('user_key, cipher, updated_at')
        .like('user_key', `${PRESENCE_USER_PREFIX}%`);

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const key = row.user_key.replace(PRESENCE_USER_PREFIX, '');
          try {
            const parsed = JSON.parse(row.cipher);
            remoteStatusMap[key] = {
              ...parsed,
              updatedAt: row.updated_at,
            };
          } catch {
            // Ignorar formato inválido
          }
        }
        saveStoredPresenceCache(remoteStatusMap);
      }
    } catch (err) {
      console.warn('[Presence] Error consultando presencia en Supabase:', err);
    }
  }

  const nowMs = Date.now();

  // Mapear cada usuario del sistema institucional
  const usersOverview = Object.entries(USERS).map(([userKey, userInfo]) => {
    const statusData = remoteStatusMap[userKey];
    
    // Está en línea si:
    // 1. Está activo en WebSockets Realtime (activeRealtimeKeys.has(userKey)), Ó
    // 2. Marca isOnline=true y su último latido fue hace menos de 3.5 minutos
    const isWebSocketOnline = activeRealtimeKeys.has(userKey);
    const lastSeenMs = statusData?.lastSeenAt ? new Date(statusData.lastSeenAt).getTime() : 0;
    const isHeartbeatActive = Boolean(statusData?.isOnline && (nowMs - lastSeenMs < HEARTBEAT_OFFLINE_THRESHOLD_MS));
    const isOnline = isWebSocketOnline || isHeartbeatActive;

    return {
      key: userKey,
      name: userInfo.name,
      role: userInfo.role,
      label: userInfo.label,
      initial: userInfo.initial,
      avatar: getUserAvatar(userKey) || userInfo.avatar || null,
      isOnline,
      lastConnectedAt: statusData?.lastConnectedAt || statusData?.connectedAt || null,
      lastSeenAt: statusData?.lastSeenAt || null,
      disconnectedAt: statusData?.disconnectedAt || null,
      device: statusData?.device || null,
    };
  });

  // Ordenar: primero los que están en línea, luego por última conexión
  usersOverview.sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    const timeA = a.lastConnectedAt ? new Date(a.lastConnectedAt).getTime() : 0;
    const timeB = b.lastConnectedAt ? new Date(b.lastConnectedAt).getTime() : 0;
    return timeB - timeA;
  });

  return {
    users: usersOverview,
    onlineCount: usersOverview.filter((u) => u.isOnline).length,
    offlineCount: usersOverview.filter((u) => !u.isOnline).length,
  };
}

/**
 * Inicializa el canal de presencia en tiempo real con Supabase y ciclo de latidos
 */
export function initPresenceTracker(currentUser, onPresenceChange) {
  if (!currentUser || !currentUser.key) {
    return () => {};
  }

  let isMounted = true;
  let heartbeatTimer = null;
  let presenceChannel = null;
  const activeRealtimeKeys = new Set();

  // 1. Sobrescribir última conexión
  recordUserLogin(currentUser).then(() => {
    if (isMounted && onPresenceChange) {
      fetchPresenceOverview(activeRealtimeKeys).then(onPresenceChange);
    }
  });

  // 2. Conectar a Supabase Realtime WebSockets (0 bytes en disco)
  if (isSupabaseConfigured && supabase) {
    try {
      presenceChannel = supabase.channel(PRESENCE_CHANNEL_NAME, {
        config: {
          presence: {
            key: currentUser.key,
          },
        },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          if (!isMounted) return;
          const presenceState = presenceChannel.presenceState();
          activeRealtimeKeys.clear();
          Object.keys(presenceState).forEach((k) => activeRealtimeKeys.add(k));
          
          if (onPresenceChange) {
            fetchPresenceOverview(activeRealtimeKeys).then(onPresenceChange);
          }
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          if (!isMounted) return;
          activeRealtimeKeys.add(key);
          if (onPresenceChange) {
            fetchPresenceOverview(activeRealtimeKeys).then(onPresenceChange);
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          if (!isMounted) return;
          activeRealtimeKeys.delete(key);
          if (onPresenceChange) {
            fetchPresenceOverview(activeRealtimeKeys).then(onPresenceChange);
          }
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'institutional_vault' },
          (payload) => {
            if (!isMounted) return;
            const key = payload.new?.user_key || payload.old?.user_key || '';
            if (key.startsWith(PRESENCE_USER_PREFIX)) {
              fetchPresenceOverview(activeRealtimeKeys).then((overview) => {
                if (isMounted && onPresenceChange) onPresenceChange(overview);
              });
            }
          }
        )
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && isMounted) {
            await presenceChannel.track({
              userKey: currentUser.key,
              name: currentUser.name,
              role: currentUser.role,
              lastConnectedAt: new Date().toISOString(),
              device: getDeviceSummary(),
            });
          }
        });
    } catch (err) {
      console.warn('[Presence] Error inicializando canal realtime:', err);
    }
  }

  // 3. Heartbeat periódico cada 40 segundos
  heartbeatTimer = setInterval(() => {
    if (!isMounted) return;
    recordUserHeartbeat(currentUser);
  }, 40000);

  // 4. Salida al cerrar ventana
  const handleBeforeUnload = () => {
    const cache = getStoredPresenceCache();
    if (cache[currentUser.key]) {
      cache[currentUser.key].isOnline = false;
      cache[currentUser.key].disconnectedAt = new Date().toISOString();
      saveStoredPresenceCache(cache);
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Función de limpieza
  return () => {
    isMounted = false;
    window.removeEventListener('beforeunload', handleBeforeUnload);
    if (heartbeatTimer) clearInterval(heartbeatTimer);

    if (presenceChannel && supabase) {
      try {
        presenceChannel.untrack();
        supabase.removeChannel(presenceChannel);
      } catch {
        // Ignorar
      }
    }
  };
}
