import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  initPresenceTracker, 
  fetchPresenceOverview, 
  recordUserLogout 
} from '../services/presenceService.js';

export function useUserPresence(currentUser) {
  const isPrivileged = Boolean(
    currentUser && 
    ['admin', 'rectora', 'induccion_rectora'].includes(currentUser.role)
  );

  const [presenceData, setPresenceData] = useState({
    users: [],
    onlineCount: 0,
    offlineCount: 0,
    logs: [],
  });
  const [loading, setLoading] = useState(false);

  // Mapa rápido de usuario -> está en línea (true/false) para el Sidebar y badges
  const onlineMap = useMemo(() => {
    const map = {};
    if (Array.isArray(presenceData.users)) {
      presenceData.users.forEach((u) => {
        map[u.key] = Boolean(u.isOnline);
        if (u.name) map[u.name] = Boolean(u.isOnline);
      });
    }
    return map;
  }, [presenceData.users]);

  // Función para forzar actualización manual
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPresenceOverview();
      setPresenceData(data);
    } catch (err) {
      console.warn('[useUserPresence] Error refrescando presencia:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser || !currentUser.key) return;

    // Inicializar tracker para emitir presencia del usuario actual y recibir actualizaciones
    const cleanup = initPresenceTracker(currentUser, (updatedOverview) => {
      setPresenceData(updatedOverview);
    });

    // Carga inicial
    fetchPresenceOverview().then((initial) => {
      setPresenceData(initial);
    });

    return () => {
      cleanup();
    };
  }, [currentUser?.key, currentUser?.name, currentUser?.role]);

  // Manejador seguro para registrar desconexión al cerrar sesión
  const handleLogout = useCallback(async () => {
    if (currentUser) {
      await recordUserLogout(currentUser);
    }
  }, [currentUser]);

  return {
    presenceData,
    onlineMap,
    onlineCount: presenceData.onlineCount,
    offlineCount: presenceData.offlineCount,
    users: presenceData.users,
    logs: presenceData.logs,
    loading,
    refresh,
    isPrivileged,
    handleLogout,
  };
}
