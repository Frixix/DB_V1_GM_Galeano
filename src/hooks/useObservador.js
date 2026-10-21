import { useState, useEffect, useCallback } from 'react';
import { initialObservadorRecords } from '../data/initialObservador';

const STORAGE_KEY = 'gmg_observador_records_v1';

export function useObservador() {
  const [records, setRecords] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Asegurar que registros base iniciales no falten si se actualizaron en código
          const existingIds = new Set(parsed.map((r) => r.id));
          const missingDefaults = initialObservadorRecords.filter((r) => !existingIds.has(r.id));
          if (missingDefaults.length > 0) {
            const merged = [...parsed, ...missingDefaults];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Error reading observador records from localStorage:', err);
    }
    return initialObservadorRecords;
  });

  // Escuchar sincronización reactiva entre instancias y pestañas
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRecords(e.detail);
      }
    };
    window.addEventListener('gmg_observador_sync', handleSync);
    return () => window.removeEventListener('gmg_observador_sync', handleSync);
  }, []);

  // Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
      console.warn('Error saving observador records to localStorage:', err);
    }
  }, [records]);

  // Radicar nuevo registro u acta
  const addRecord = useCallback((newRecord) => {
    setRecords((prev) => {
      const updated = [newRecord, ...prev];
      window.dispatchEvent(new CustomEvent('gmg_observador_sync', { detail: updated }));
      return updated;
    });
  }, []);

  // Modificar o actualizar registro existente
  const updateRecord = useCallback((id, updatedFields) => {
    setRecords((prev) => {
      const updated = prev.map((rec) => (rec.id === id ? { ...rec, ...updatedFields } : rec));
      window.dispatchEvent(new CustomEvent('gmg_observador_sync', { detail: updated }));
      return updated;
    });
  }, []);

  // Eliminar registro
  const deleteRecord = useCallback((id) => {
    setRecords((prev) => {
      const updated = prev.filter((rec) => rec.id !== id);
      window.dispatchEvent(new CustomEvent('gmg_observador_sync', { detail: updated }));
      return updated;
    });
  }, []);

  // Restablecer valores de prueba iniciales
  const resetToDefaults = useCallback(() => {
    setRecords(initialObservadorRecords);
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('gmg_observador_sync', { detail: initialObservadorRecords }));
  }, []);

  return {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    resetToDefaults
  };
}
