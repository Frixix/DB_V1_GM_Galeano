import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY = 'read_circulares_v2';

export function useCircularReads(currentUser) {
  const currentUserKey = currentUser 
    ? `${currentUser.role}_${currentUser.name.replace(/\s+/g, '_').toLowerCase()}`
    : null;

  const [readCircularIds, setReadCircularIds] = useState(() => {
    if (!currentUserKey) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      return parsed[currentUserKey] || [];
    } catch {
      return [];
    }
  });

  // Carga inicial desde Supabase y sincronización con localStorage
  useEffect(() => {
    if (!currentUserKey) {
      setReadCircularIds([]);
      return;
    }

    // Carga rápida inicial desde localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      if (parsed[currentUserKey]) {
        setReadCircularIds(parsed[currentUserKey]);
      }
    } catch {
      // Ignorar
    }

    if (!isSupabaseConfigured || !supabase) return;

    let isMounted = true;

    // Obtener lecturas guardadas en la base de datos para este usuario
    supabase
      .from('circular_reads')
      .select('document_id')
      .eq('user_key', currentUserKey)
      .then(({ data, error }) => {
        if (!isMounted || error || !data) return;

        const remoteIds = data.map(r => r.document_id);
        setReadCircularIds(prev => {
          const merged = Array.from(new Set([...prev, ...remoteIds]));
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : {};
            parsed[currentUserKey] = merged;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch {
            // Ignorar
          }
          return merged;
        });
      });

    // Suscripción Realtime para reflejar lecturas en tiempo real
    const channel = supabase
      .channel(`realtime:circular_reads:${currentUserKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'circular_reads',
          filter: `user_key=eq.${currentUserKey}`,
        },
        (payload) => {
          if (!isMounted || !payload.new?.document_id) return;
          const newDocId = payload.new.document_id;
          setReadCircularIds(prev => {
            if (prev.includes(newDocId)) return prev;
            return [...prev, newDocId];
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentUserKey]);

  // Marcar circular como leída
  const markAsRead = useCallback(async (documentId) => {
    if (!currentUserKey || !documentId) return;

    // Actualización optimista local inmediata
    setReadCircularIds(prev => {
      if (prev.includes(documentId)) return prev;
      const updated = [...prev, documentId];
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[currentUserKey] = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // Ignorar
      }
      return updated;
    });

    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase
        .from('circular_reads')
        .upsert(
          { document_id: documentId, user_key: currentUserKey },
          { onConflict: 'document_id,user_key' }
        );
    } catch (err) {
      console.warn('Error sincronizando lectura de circular con Supabase:', err);
    }
  }, [currentUserKey]);

  // Marcar múltiples circulares como leídas de forma masiva
  const markAllAsRead = useCallback(async (documentIds = []) => {
    if (!currentUserKey || !Array.isArray(documentIds) || !documentIds.length) return;

    setReadCircularIds(prev => {
      const merged = Array.from(new Set([...prev, ...documentIds]));
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[currentUserKey] = merged;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // Ignorar
      }
      return merged;
    });

    if (!isSupabaseConfigured || !supabase) return;

    try {
      const rows = documentIds.map(id => ({ document_id: id, user_key: currentUserKey }));
      await supabase
        .from('circular_reads')
        .upsert(rows, { onConflict: 'document_id,user_key' });
    } catch (err) {
      console.warn('Error sincronizando lecturas masivas con Supabase:', err);
    }
  }, [currentUserKey]);

  return {
    readCircularIds,
    markAsRead,
    markAllAsRead,
  };
}
