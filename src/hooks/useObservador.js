import { useState, useEffect } from 'react';
import { initialObservadorRecords } from '../data/initialObservador';

const STORAGE_KEY = 'gmg_observador_records_v1';

export function useObservador() {
  const [records, setRecords] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Error reading observador records from localStorage:', err);
    }
    return initialObservadorRecords;
  });

  // Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
      console.warn('Error saving observador records to localStorage:', err);
    }
  }, [records]);

  // Radicar nuevo registro u acta
  const addRecord = (newRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
  };

  // Modificar o actualizar registro existente
  const updateRecord = (id, updatedFields) => {
    setRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, ...updatedFields } : rec))
    );
  };

  // Eliminar registro
  const deleteRecord = (id) => {
    setRecords((prev) => prev.filter((rec) => rec.id !== id));
  };

  // Restablecer valores de prueba iniciales
  const resetToDefaults = () => {
    setRecords(initialObservadorRecords);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    resetToDefaults
  };
}
