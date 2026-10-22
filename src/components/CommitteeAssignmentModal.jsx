import { useState, useEffect } from 'react';
import { committeeService } from '../services/committeeService.js';
import { USERS } from '../data/users.js';

// Lista de docentes elegibles para representación institucional
const ELIGIBLE_TEACHERS = [
  { key: 'profe0', name: 'Profe Pre-Jardín', grade: 'Pre-Jardín' },
  { key: 'profe1', name: 'Profe 1', grade: 'Transición' },
  { key: 'jessica', name: 'Jessica', grade: '1° Primaria' },
  { key: 'yuri', name: 'Yuri', grade: '2° Primaria' },
  { key: 'profe2', name: 'Profe 2', grade: '3° Primaria' },
  { key: 'elcy', name: 'Elcy', grade: '4° Primaria' },
  { key: 'profe3', name: 'Profe 3', grade: '5° Primaria' }
];

export default function CommitteeAssignmentModal({
  isOpen,
  onClose,
  currentUser,
  onAssignmentsUpdated
}) {
  const [committees, setCommittees] = useState(() => committeeService.getCommittees());
  const [selectedTeachers, setSelectedTeachers] = useState({
    comite_convivencia: committeeService.getAssignedTeachers('comite_convivencia'),
    comision_evaluacion: committeeService.getAssignedTeachers('comision_evaluacion'),
    consejo_academico: committeeService.getAssignedTeachers('consejo_academico')
  });
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fresh = committeeService.getCommittees();
      setCommittees(fresh);
      setSelectedTeachers({
        comite_convivencia: committeeService.getAssignedTeachers('comite_convivencia'),
        comision_evaluacion: committeeService.getAssignedTeachers('comision_evaluacion'),
        consejo_academico: committeeService.getAssignedTeachers('consejo_academico')
      });
      setToast('');
    }
  }, [isOpen]);

  // Atajo de teclado: Cerrar modal con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleTeacher = (committeeId, teacherKey) => {
    setSelectedTeachers(prev => {
      const currentList = prev[committeeId] || [];
      const isAlreadySelected = currentList.includes(teacherKey);

      if (isAlreadySelected) {
        // Desmarcar
        return {
          ...prev,
          [committeeId]: currentList.filter(k => k !== teacherKey)
        };
      } else {
        // Máximo 2 docentes por comité
        if (currentList.length >= 2) {
          setToast('⚠️ Máximo 2 docentes representantes permitidas por comité escolar.');
          setTimeout(() => setToast(''), 3500);
          return prev;
        }
        return {
          ...prev,
          [committeeId]: [...currentList, teacherKey]
        };
      }
    });
  };

  const handleSave = async () => {
    await committeeService.setAssignedTeachers('comite_convivencia', selectedTeachers.comite_convivencia, currentUser);
    await committeeService.setAssignedTeachers('comision_evaluacion', selectedTeachers.comision_evaluacion, currentUser);
    await committeeService.setAssignedTeachers('consejo_academico', selectedTeachers.consejo_academico, currentUser);

    if (onAssignmentsUpdated) {
      onAssignmentsUpdated(committeeService.getCommittees());
    }
    onClose();
  };

  return (
    <div className="obs-modal-overlay" onClick={onClose}>
      <div 
        className="obs-modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '640px', width: '92%' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del Modal */}
        <div className="obs-modal-header" style={{ borderBottom: '1px solid #ccfbf1', background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)' }}>
          <div className="obs-modal-brand-box">
            <div className="obs-modal-shield" style={{ background: '#ccfbf1', color: '#0f766e' }}>
              <i className="ph-bold ph-user-gear" style={{ fontSize: '1.35rem' }}></i>
            </div>
            <div>
              <h3 className="obs-modal-institution" style={{ color: '#0f766e' }}>ASIGNACIÓN DIRECTIVA DE COMITÉS</h3>
              <p className="obs-modal-subinstitution">
                Facultad exclusiva de Rectoría • Asigne 1 o máximo 2 docentes por comité
              </p>
            </div>
          </div>

          <button 
            type="button" 
            className="obs-modal-close-btn" 
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Contenido / Cuerpo del Modal */}
        <div className="obs-modal-body" style={{ padding: '1.25rem' }}>
          {toast && (
            <div className="obs-form-error" style={{ marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
              <i className="ph-bold ph-warning-circle"></i>
              <span>{toast}</span>
            </div>
          )}

          <div className="obs-assignment-intro" style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '8px', padding: '0.75rem 0.95rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <i className="ph-bold ph-shield-check" style={{ color: '#0f766e', fontSize: '1.15rem', marginTop: '2px' }}></i>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#115e59', lineHeight: 1.45 }}>
              <strong>Regla de Bloqueo Convivencial:</strong> La docente asignada al <em>Comité de Convivencia</em> no podrá alterar actas de la <em>Comisión de Evaluación</em>, y viceversa. Solo las docentes designadas y Rectoría tienen potestad de edición.
            </p>
          </div>

          {/* Comité 1: Comité de Convivencia Escolar */}
          <div className="obs-committee-assign-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ph-bold ph-scales" style={{ color: '#7c3aed', fontSize: '1.15rem' }}></i>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 }}>Comité de Convivencia Escolar</h4>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Ley 1620 de 2013 • Protocolos Tipo I, II y III</span>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: selectedTeachers.comite_convivencia?.length === 2 ? '#fef3c7' : '#f0fdfa', color: selectedTeachers.comite_convivencia?.length === 2 ? '#b45309' : '#0f766e', border: '1px solid #cbd5e1' }}>
                {selectedTeachers.comite_convivencia?.length || 0} / 2 asignadas
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.65rem' }}>
              {ELIGIBLE_TEACHERS.map(t => {
                const isSelected = (selectedTeachers.comite_convivencia || []).includes(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleToggleTeacher('comite_convivencia', t.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                      background: isSelected ? '#f5f3ff' : '#ffffff',
                      color: isSelected ? '#5b21b6' : '#334155',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <i className={`ph-bold ${isSelected ? 'ph-check-circle' : 'ph-circle'}`} style={{ color: isSelected ? '#7c3aed' : '#94a3b8' }}></i>
                    <span>{t.name}</span>
                    <span style={{ fontSize: '0.66rem', opacity: 0.75 }}>({t.grade})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comité 2: Comisión de Evaluación y Promoción */}
          <div className="obs-committee-assign-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ph-bold ph-chart-pie-slice" style={{ color: '#059669', fontSize: '1.15rem' }}></i>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 }}>Comisión de Evaluación y Promoción</h4>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Decreto 1290 de 2009 • Análisis académico y planes de apoyo</span>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: selectedTeachers.comision_evaluacion?.length === 2 ? '#fef3c7' : '#f0fdfa', color: selectedTeachers.comision_evaluacion?.length === 2 ? '#b45309' : '#0f766e', border: '1px solid #cbd5e1' }}>
                {selectedTeachers.comision_evaluacion?.length || 0} / 2 asignadas
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.65rem' }}>
              {ELIGIBLE_TEACHERS.map(t => {
                const isSelected = (selectedTeachers.comision_evaluacion || []).includes(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleToggleTeacher('comision_evaluacion', t.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #059669' : '1px solid #cbd5e1',
                      background: isSelected ? '#ecfdf5' : '#ffffff',
                      color: isSelected ? '#065f46' : '#334155',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <i className={`ph-bold ${isSelected ? 'ph-check-circle' : 'ph-circle'}`} style={{ color: isSelected ? '#059669' : '#94a3b8' }}></i>
                    <span>{t.name}</span>
                    <span style={{ fontSize: '0.66rem', opacity: 0.75 }}>({t.grade})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comité 3: Consejo Académico */}
          <div className="obs-committee-assign-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ph-bold ph-graduation-cap" style={{ color: '#be123c', fontSize: '1.15rem' }}></i>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 }}>Consejo Académico</h4>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Ley 115 de 1994 • Articulación curricular y transversalidad</span>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: selectedTeachers.consejo_academico?.length === 2 ? '#fef3c7' : '#f0fdfa', color: selectedTeachers.consejo_academico?.length === 2 ? '#b45309' : '#0f766e', border: '1px solid #cbd5e1' }}>
                {selectedTeachers.consejo_academico?.length || 0} / 2 asignadas
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.65rem' }}>
              {ELIGIBLE_TEACHERS.map(t => {
                const isSelected = (selectedTeachers.consejo_academico || []).includes(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleToggleTeacher('consejo_academico', t.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #be123c' : '1px solid #cbd5e1',
                      background: isSelected ? '#fff1f2' : '#ffffff',
                      color: isSelected ? '#9f1239' : '#334155',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <i className={`ph-bold ${isSelected ? 'ph-check-circle' : 'ph-circle'}`} style={{ color: isSelected ? '#be123c' : '#94a3b8' }}></i>
                    <span>{t.name}</span>
                    <span style={{ fontSize: '0.66rem', opacity: 0.75 }}>({t.grade})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="obs-modal-footer" style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            className="obs-btn-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="obs-btn-primary"
            onClick={handleSave}
            style={{
              background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.55rem 1.2rem',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <i className="ph-bold ph-check"></i>
            <span>Guardar Asignaciones</span>
          </button>
        </div>
      </div>
    </div>
  );
}
