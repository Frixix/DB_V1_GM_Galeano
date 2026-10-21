import { useState, useEffect, useCallback, useRef } from 'react';
import { initialObservadorRecords } from '../data/initialObservador';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY = 'gmg_observador_records_v1';

// Mapeo bidireccional entre camelCase (React) y snake_case (PostgreSQL Supabase)
function toDbRecord(rec) {
  return {
    id: rec.id,
    route: rec.route,
    title: rec.title,
    date: rec.date,
    period: rec.period || null,
    grade: rec.grade || null,
    teacher: rec.teacher,
    student_id: rec.studentId || null,
    student_name: rec.studentName || null,
    guardian_name: rec.guardianName || null,
    session_type: rec.sessionType || null,
    attendees: rec.attendees || null,
    type: rec.type || 'ordinaria',
    semaforo: rec.semaforo || 'amarillo',
    status: rec.status || 'en_seguimiento',
    description: rec.description || null,
    agreements: rec.agreements || null,
    follow_up_date: rec.followUpDate || null,
    follow_up_date_iso: rec.followUpDateISO || null,
    file_name: rec.fileName || null,
    storage_key: rec.storageKey || null,
    notes: rec.notes || null,
    resolution_notes: rec.resolutionNotes || null,
    resolution_image: rec.resolutionImage || null,
    resolved_at: rec.resolvedAt || null,
    resolved_by: rec.resolvedBy || null,
    updated_at: new Date().toISOString()
  };
}

function fromDbRecord(row) {
  return {
    id: row.id,
    route: row.route,
    title: row.title,
    date: row.date,
    period: row.period,
    grade: row.grade,
    teacher: row.teacher,
    studentId: row.student_id,
    studentName: row.student_name,
    guardianName: row.guardian_name,
    sessionType: row.session_type,
    attendees: row.attendees,
    type: row.type,
    semaforo: row.semaforo,
    status: row.status,
    description: row.description,
    agreements: row.agreements,
    followUpDate: row.follow_up_date,
    followUpDateISO: row.follow_up_date_iso,
    fileName: row.file_name,
    storageKey: row.storage_key,
    notes: row.notes,
    resolutionNotes: row.resolution_notes,
    resolutionImage: row.resolution_image,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapUpdatedFieldsToDb(fields) {
  const mapped = {};
  if (fields.route !== undefined) mapped.route = fields.route;
  if (fields.title !== undefined) mapped.title = fields.title;
  if (fields.date !== undefined) mapped.date = fields.date;
  if (fields.period !== undefined) mapped.period = fields.period;
  if (fields.grade !== undefined) mapped.grade = fields.grade;
  if (fields.teacher !== undefined) mapped.teacher = fields.teacher;
  if (fields.studentId !== undefined) mapped.student_id = fields.studentId;
  if (fields.studentName !== undefined) mapped.student_name = fields.studentName;
  if (fields.guardianName !== undefined) mapped.guardian_name = fields.guardianName;
  if (fields.sessionType !== undefined) mapped.session_type = fields.sessionType;
  if (fields.attendees !== undefined) mapped.attendees = fields.attendees;
  if (fields.type !== undefined) mapped.type = fields.type;
  if (fields.semaforo !== undefined) mapped.semaforo = fields.semaforo;
  if (fields.status !== undefined) mapped.status = fields.status;
  if (fields.description !== undefined) mapped.description = fields.description;
  if (fields.agreements !== undefined) mapped.agreements = fields.agreements;
  if (fields.followUpDate !== undefined) mapped.follow_up_date = fields.followUpDate;
  if (fields.followUpDateISO !== undefined) mapped.follow_up_date_iso = fields.followUpDateISO;
  if (fields.fileName !== undefined) mapped.file_name = fields.fileName;
  if (fields.storageKey !== undefined) mapped.storage_key = fields.storageKey;
  if (fields.notes !== undefined) mapped.notes = fields.notes;
  if (fields.resolutionNotes !== undefined) mapped.resolution_notes = fields.resolutionNotes;
  if (fields.resolutionImage !== undefined) mapped.resolution_image = fields.resolutionImage;
  if (fields.resolvedAt !== undefined) mapped.resolved_at = fields.resolvedAt;
  if (fields.resolvedBy !== undefined) mapped.resolved_by = fields.resolvedBy;
  mapped.updated_at = new Date().toISOString();
  return mapped;
}

export function useObservador() {
  const [records, setRecords] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
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

  const recordsRef = useRef(records);
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  // 1. Sincronización inicial y Realtime con Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let isMounted = true;

    // A. Consultar registros remotos desde Supabase
    const fetchRemoteRecords = async () => {
      try {
        const { data, error } = await supabase
          .from('observador_records')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const remoteMapped = data.map(fromDbRecord);
          if (isMounted) {
            setRecords(prev => {
              const remoteIds = new Set(remoteMapped.map(r => r.id));
              const localUnsynced = prev.filter(r => !remoteIds.has(r.id));
              const merged = [...remoteMapped, ...localUnsynced];
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('[useObservador] Advertencia al sincronizar con Supabase:', err);
      }
    };

    fetchRemoteRecords();

    // B. Suscripción en Tiempo Real para actualización instantánea
    const channel = supabase
      .channel('observador_records_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'observador_records' },
        (payload) => {
          if (!isMounted) return;

          if (payload.eventType === 'INSERT') {
            const newRec = fromDbRecord(payload.new);
            setRecords(prev => {
              if (prev.some(r => r.id === newRec.id)) return prev;
              const updated = [newRec, ...prev];
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRec = fromDbRecord(payload.new);
            setRecords(prev => {
              const updated = prev.map(r => (r.id === updatedRec.id ? { ...r, ...updatedRec } : r));
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setRecords(prev => {
                const updated = prev.filter(r => r.id !== deletedId);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Escuchar sincronización reactiva local entre instancias/pestañas
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRecords(e.detail);
      }
    };
    window.addEventListener('gmg_observador_sync', handleSync);
    return () => window.removeEventListener('gmg_observador_sync', handleSync);
  }, []);

  // 3. Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
      console.warn('Error saving observador records to localStorage:', err);
    }
  }, [records]);

  // 4. Radicar nuevo registro u acta
  const addRecord = useCallback(async (newRecord) => {
    setRecords((prev) => {
      const updated = [newRecord, ...prev];
      window.dispatchEvent(new CustomEvent('gmg_observador_sync', { detail: updated }));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = toDbRecord(newRecord);
        await supabase
          .from('observador_records')
          .upsert([payload], { onConflict: 'id' });
      } catch (err) {
        console.warn('[useObservador] Advertencia al respaldar registro en Supabase:', err);
      }
    }
  }, []);

  // 5. Modificar o actualizar registro existente
  const updateRecord = useCallback(async (id, updatedFields) => {
    setRecords((prev) => {
      const updated = prev.map((rec) => (rec.id === id ? { ...rec, ...updatedFields } : rec));
      window.dispatchEvent(new CustomEvent('gmg_observador_sync', { detail: updated }));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = mapUpdatedFieldsToDb(updatedFields);
        await supabase
          .from('observador_records')
          .update(dbPayload)
          .eq('id', id);
      } catch (err) {
        console.warn('[useObservador] Advertencia al actualizar en Supabase:', err);
      }
    }
  }, []);

  // 6. Eliminar registro
  const deleteRecord = useCallback(async (id) => {
    setRecords((prev) => {
      const updated = prev.filter((rec) => rec.id !== id);
      window.dispatchEvent(new CustomEvent('gmg_observador_sync', { detail: updated }));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('observador_records')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('[useObservador] Advertencia al eliminar en Supabase:', err);
      }
    }
  }, []);

  // 7. Restablecer valores iniciales
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
export default useObservador;
