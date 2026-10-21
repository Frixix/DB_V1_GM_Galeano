import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { initialDocuments } from '../data/initialDocs';
import { deleteDocumentFile } from '../services/storageService';

export function mapDbToDoc(row) {
  return {
    id: row.id,
    title: row.title,
    folder: row.folder,
    grade: row.grade,
    subject: row.subject,
    teacher: row.teacher,
    period: row.period,
    isPublic: Boolean(row.is_public),
    fileName: row.file_name,
    fileSize: row.file_size,
    compressedSize: row.compressed_size,
    rawBytes: Number(row.raw_bytes || 0),
    ratio: row.ratio,
    isCompressed: Boolean(row.is_compressed),
    notes: row.notes,
    bovedaYear: row.boveda_year,
    bovedaSubfolder: row.boveda_subfolder,
    storageKey: row.storage_key,
    uploadedAt: row.uploaded_at,
    createdAt: row.created_at,
  };
}

export function mapDocToDb(doc) {
  return {
    id: doc.id,
    title: doc.title,
    folder: doc.folder,
    grade: doc.grade,
    subject: doc.subject,
    teacher: doc.teacher,
    period: doc.period,
    is_public: Boolean(doc.isPublic),
    file_name: doc.fileName,
    file_size: doc.fileSize,
    compressed_size: doc.compressedSize,
    raw_bytes: doc.rawBytes || 0,
    ratio: doc.ratio,
    is_compressed: Boolean(doc.isCompressed),
    notes: doc.notes,
    boveda_year: doc.bovedaYear || null,
    boveda_subfolder: doc.bovedaSubfolder || null,
    storage_key: doc.storageKey || null,
    uploaded_at: doc.uploadedAt,
  };
}

export function useDocuments() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);

  // Cargar y suscribir en tiempo real
  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchErr }) => {
        if (!isMounted) return;
        setLoading(false);
        if (fetchErr) {
          console.warn('Error al cargar de Supabase, usando locales:', fetchErr);
          setError(fetchErr.message);
        } else if (data) {
          const validDocs = data
            .map(mapDbToDoc)
            .filter(d => d.folder !== 'calificaciones' && d.id !== 'MG-PRI-004');
          setDocuments(validDocs);
        }
      });

    const channel = supabase
      .channel('realtime:documents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            const newDoc = mapDbToDoc(payload.new);
            if (newDoc.folder === 'calificaciones' || newDoc.id === 'MG-PRI-004') return;
            setDocuments(prev => {
              const existingIndex = prev.findIndex(d => d.id === newDoc.id);
              if (existingIndex >= 0) {
                const localDoc = prev[existingIndex];
                const updatedList = [...prev];
                updatedList[existingIndex] = { ...newDoc, fileBlob: localDoc.fileBlob || null };
                return updatedList;
              }
              return [newDoc, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setDocuments(prev => prev.filter(d => d.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = mapDbToDoc(payload.new);
            setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? { ...updatedDoc, fileBlob: d.fileBlob || null } : d));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Agregar nuevo documento
  const addDocument = useCallback(async (newDoc) => {
    // Actualización optimista local inmediata
    setDocuments(prev => [newDoc, ...prev]);

    if (!isSupabaseConfigured || !supabase) return { success: true };

    try {
      const dbPayload = mapDocToDb(newDoc);
      const { data, error: insertErr } = await supabase
        .from('documents')
        .insert([dbPayload])
        .select();

      if (insertErr) throw insertErr;

      // Consolidar con los datos persistidos en la base de datos
      if (data && data[0]) {
        const persisted = mapDbToDoc(data[0]);
        setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...persisted, fileBlob: newDoc.fileBlob || null } : d));
      }
      return { success: true };
    } catch (err) {
      console.error('Error guardando en Supabase:', err);
      setError(err.message);
      // Revertir estado optimista si falló la persistencia en la base de datos
      setDocuments(prev => prev.filter(d => d.id !== newDoc.id));
      throw err;
    }
  }, []);

  // Eliminar documento
  const deleteDocument = useCallback(async (id) => {
    let targetDoc = null;

    // Actualización optimista local inmediata y captura de storageKey sin depender de documents
    setDocuments(prev => {
      targetDoc = prev.find(doc => doc.id === id);
      return prev.filter(doc => doc.id !== id);
    });

    if (!isSupabaseConfigured || !supabase) return { success: true };

    try {
      if (targetDoc?.storageKey) {
        await deleteDocumentFile(targetDoc.storageKey);
      }

      const { error: deleteErr } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;
      return { success: true };
    } catch (err) {
      console.error('Error eliminando de Supabase:', err);
      setError(err.message);
      // Revertir optimismo si falló
      if (targetDoc) {
        setDocuments(prev => [targetDoc, ...prev]);
      }
      throw err;
    }
  }, []);

  return {
    documents,
    loading,
    error,
    addDocument,
    deleteDocument,
    isRealtimeReady: isSupabaseConfigured,
  };
}
