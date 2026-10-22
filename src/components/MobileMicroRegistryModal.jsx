import { useState, useMemo, useEffect, useRef } from 'react';
import { subjectHasFinalExam } from '../data/gradesTreeData';
import './MobileMicroRegistryModal.css';

/**
 * MobileMicroRegistryModal: Micro-registro Rápido Táctil para Dispositivos Móviles
 * Diseñado específicamente para que los docentes califiquen una actividad continua
 * o la evaluación final en menos de 5 minutos desde su smartphone o tablet.
 *
 * Características:
 * - Selector directo de actividad (Taller, Quiz, Exposición, EF 20%).
 * - Teclado numérico directo y botonera táctil rápida (1.0 a 5.0).
 * - Auto-avance reactivo al pulsar una calificación (secuencia con 1 toque por alumno).
 * - Entrada manual con inputMode="decimal" para desplegar teclado numérico nativo.
 * - Modo Lista Rápida vertical y Modo Tarjeta Secuencial 1 a 1.
 */
export default function MobileMicroRegistryModal({
  isOpen = false,
  onClose,
  students = [],
  activities = [],
  selectedSubject,
  selectedGrade,
  selectedPeriod,
  canEdit = true,
  onUpdateScore,
  onBatchUpdate
}) {
  // Actividad seleccionada actualmente para calificar
  // 'act_1', 'act_2', ... o 'evaluacionFinal'
  const [activeActivityId, setActiveActivityId] = useState(() => {
    return activities[0]?.id || 'act_1';
  });

  // Índice del estudiante activo en el modo tarjeta 1 a 1
  const [currentStudentIdx, setCurrentStudentIdx] = useState(0);

  // Modo de visualización: 'card' (1 a 1 auto-avance) o 'list' (lista vertical táctil)
  const [viewMode, setViewMode] = useState('card');

  // Input de teclado numérico manual
  const [customInputVal, setCustomInputVal] = useState('');
  const [justGradedFeedback, setJustGradedFeedback] = useState(false);
  const manualInputRef = useRef(null);

  // Sincronizar actividad si la lista de actividades cambia
  useEffect(() => {
    if (activeActivityId !== 'evaluacionFinal' && !activities.some(a => a.id === activeActivityId)) {
      if (activities.length > 0) {
        setActiveActivityId(activities[0].id);
      }
    }
  }, [activities, activeActivityId]);

  // Actualizar el valor del input manual al cambiar de estudiante o actividad
  useEffect(() => {
    const student = students[currentStudentIdx];
    if (student) {
      const currentScore = getStudentScore(student, activeActivityId);
      setCustomInputVal(currentScore !== undefined && currentScore !== null && currentScore !== '' ? String(currentScore) : '');
    }
  }, [currentStudentIdx, activeActivityId, students]);

  // Obtener la nota de un estudiante para la actividad activa
  function getStudentScore(student, activityId) {
    if (!student) return '';
    if (activityId === 'evaluacionFinal') {
      return student.evaluacionFinal !== undefined && student.evaluacionFinal !== null
        ? student.evaluacionFinal
        : (student.c3 || '');
    }
    if (student.scores && student.scores[activityId] !== undefined) {
      return student.scores[activityId];
    }
    return student[activityId] || '';
  }

  const isSubjectWithFinalExam = useMemo(() => subjectHasFinalExam(selectedSubject), [selectedSubject]);

  // Nombre de la actividad seleccionada
  const activeActivityMeta = useMemo(() => {
    if (activeActivityId === 'evaluacionFinal') {
      return { 
        id: 'evaluacionFinal', 
        name: isSubjectWithFinalExam ? 'Evaluación Final / Bimestral' : 'Otras Actividades Formativas', 
        weight: '20%', 
        isFinal: isSubjectWithFinalExam 
      };
    }
    const act = activities.find(a => a.id === activeActivityId);
    return act ? { ...act, weight: '80% Aula', isFinal: false } : { id: 'act_1', name: 'Actividad', weight: '80%', isFinal: false };
  }, [activeActivityId, activities, isSubjectWithFinalExam]);

  // Estadísticas de completitud de la actividad actual
  const stats = useMemo(() => {
    let graded = 0;
    students.forEach(st => {
      const s = getStudentScore(st, activeActivityId);
      if (s !== '' && s !== null && s !== undefined && !isNaN(Number(s))) {
        graded++;
      }
    });
    const total = students.length;
    const percent = total > 0 ? Math.round((graded / total) * 100) : 0;
    return { graded, total, percent };
  }, [students, activeActivityId]);

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

  const currentStudent = students[currentStudentIdx] || students[0];

  // Asignar nota y ejecutar auto-avance al siguiente estudiante
  const applyScoreAndAdvance = (val) => {
    if (!canEdit || !currentStudent) return;

    let num = parseFloat(String(val).replace(',', '.'));
    if (isNaN(num)) num = '';
    else num = Math.min(5.0, Math.max(1.0, Number(num.toFixed(1))));

    onUpdateScore(currentStudent.id, activeActivityId, num);

    // Feedback visual táctil
    setJustGradedFeedback(true);
    setTimeout(() => setJustGradedFeedback(false), 300);

    // Auto-avance al siguiente estudiante tras un breve retardo perceptible
    setTimeout(() => {
      if (currentStudentIdx < students.length - 1) {
        setCurrentStudentIdx(prev => prev + 1);
      }
    }, 220);
  };

  // Botonera de notas rápidas preconfiguradas
  const QUICK_SCORES = [1.0, 2.0, 2.8, 3.0, 3.2, 3.5, 3.8, 4.0, 4.2, 4.5, 4.8, 5.0];

  const handleManualKeypadPress = (key) => {
    if (!canEdit) return;

    if (key === 'CLEAR') {
      setCustomInputVal('');
      onUpdateScore(currentStudent.id, activeActivityId, '');
      return;
    }

    if (key === 'ENTER') {
      if (customInputVal !== '') {
        applyScoreAndAdvance(customInputVal);
      } else {
        if (currentStudentIdx < students.length - 1) {
          setCurrentStudentIdx(prev => prev + 1);
        }
      }
      return;
    }

    let nextVal = customInputVal;
    if (key === '.') {
      if (!nextVal.includes('.')) {
        nextVal = nextVal === '' ? '0.' : nextVal + '.';
      }
    } else {
      // Si ya tiene un punto y un decimal, o si empieza con número
      if (nextVal.length < 3) {
        if (nextVal === '' && Number(key) > 5) {
          nextVal = '5.0';
        } else {
          nextVal += key;
        }
      }
    }

    setCustomInputVal(nextVal);
    const parsed = parseFloat(nextVal);
    if (!isNaN(parsed) && parsed >= 1.0 && parsed <= 5.0) {
      onUpdateScore(currentStudent.id, activeActivityId, parsed);
    }
  };

  const currentScoreDisplay = getStudentScore(currentStudent, activeActivityId);

  return (
    <div className="micro-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="micro-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Cabecera del Micro-registro */}
        <div className="micro-header">
          <div className="micro-header-top">
            <div className="micro-title-box">
              <span className="micro-badge-pulse">
                <i className="ph-bold ph-lightning"></i> Micro-registro &lt; 5 min
              </span>
              <h3>Planilla Rápida Móvil</h3>
              <p>{selectedSubject} • {selectedGrade}</p>
            </div>
            <button type="button" className="micro-btn-close" onClick={onClose} aria-label="Cerrar">
              <i className="ph-bold ph-x"></i>
            </button>
          </div>

          {/* Barra selectora deslizable horizontal de Actividades */}
          <div className="micro-activities-scroll">
            {activities.map((act, idx) => (
              <button
                key={act.id}
                type="button"
                className={`micro-act-chip ${activeActivityId === act.id ? 'active' : ''}`}
                onClick={() => setActiveActivityId(act.id)}
              >
                <span className="micro-act-num">#{idx + 1}</span>
                <span className="micro-act-name">{act.name}</span>
                <span className="micro-act-weight">80%</span>
              </button>
            ))}

            {/* Chip especial para Evaluación Final (20%) o Componente Otras Actividades (20%) */}
            <button
              type="button"
              className={`micro-act-chip chip-final-exam ${activeActivityId === 'evaluacionFinal' ? 'active' : ''}`}
              onClick={() => setActiveActivityId('evaluacionFinal')}
            >
              <i className={`ph-bold ${isSubjectWithFinalExam ? 'ph-exam' : 'ph-sparkle'}`}></i>
              <span className="micro-act-name">{isSubjectWithFinalExam ? 'Examen Bimestral' : 'Otras Actividades'}</span>
              <span className={`micro-act-weight final-tag ${!isSubjectWithFinalExam ? 'formative-tag' : ''}`}>20%</span>
            </button>
          </div>

          {/* Barra de Progreso de Calificación del Salón */}
          <div className="micro-progress-bar-wrap">
            <div className="micro-progress-info">
              <span>Progreso de {activeActivityMeta.name}:</span>
              <strong>{stats.graded} de {stats.total} calificados ({stats.percent}%)</strong>
            </div>
            <div className="micro-progress-track">
              <div 
                className="micro-progress-fill" 
                style={{ width: `${stats.percent}%` }}
              ></div>
            </div>
          </div>

          {/* Switch de Modo: Tarjeta 1 a 1 vs Lista Rápida */}
          <div className="micro-view-toggle">
            <button
              type="button"
              className={`micro-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
            >
              <i className="ph-bold ph-cards"></i>
              <span>Táctil 1 a 1 (Auto-avance)</span>
            </button>
            <button
              type="button"
              className={`micro-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <i className="ph-bold ph-list-numbers"></i>
              <span>Lista Rápida</span>
            </button>
          </div>
        </div>

        {/* CUERPO MODO 1: TARJETA 1 A 1 CON AUTO-AVANCE TÁCTIL */}
        {viewMode === 'card' && currentStudent && (
          <div className="micro-card-body">
            
            {/* Tarjeta del Estudiante Activo */}
            <div className={`micro-student-card ${justGradedFeedback ? 'flash-success' : ''}`}>
              <div className="micro-student-header">
                <div className="micro-student-avatar">
                  {currentStudent.name.charAt(0)}
                </div>
                <div className="micro-student-meta">
                  <span className="micro-student-counter">
                    Estudiante {currentStudentIdx + 1} de {students.length}
                  </span>
                  <h4 className="micro-student-name">{currentStudent.name}</h4>
                  <span className="micro-student-code">Rad: <code>{currentStudent.id}</code></span>
                </div>
              </div>

              {/* Casilla de Nota Actual */}
              <div className="micro-current-score-box">
                <span className="micro-score-label">Nota {activeActivityMeta.name}:</span>
                <div className="micro-score-display-wrap">
                  <span className={`micro-score-badge ${currentScoreDisplay ? 'has-score' : 'empty'}`}>
                    {currentScoreDisplay !== '' && currentScoreDisplay !== null ? Number(currentScoreDisplay).toFixed(1) : '—'}
                  </span>
                  {activeActivityId === 'evaluacionFinal' && !currentScoreDisplay && (
                    <span className="micro-simulated-note" title="Simulando 1.0 mientras no se presente">
                      <i className="ph-bold ph-chart-line-up"></i> Simulando con 1.0
                    </span>
                  )}
                </div>
              </div>

              {/* Input Nativo con inputMode="decimal" para Smartphones */}
              <div className="micro-input-native-wrap">
                <label htmlFor="microMobileInput">
                  <i className="ph-bold ph-keyboard"></i> Teclado Numérico Directo:
                </label>
                <div className="micro-native-row">
                  <input
                    id="microMobileInput"
                    ref={manualInputRef}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    autoComplete="off"
                    value={customInputVal}
                    placeholder="1.0 - 5.0"
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomInputVal(val);
                      const parsed = parseFloat(val.replace(',', '.'));
                      if (!isNaN(parsed) && parsed >= 1.0 && parsed <= 5.0) {
                        onUpdateScore(currentStudent.id, activeActivityId, parsed);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (currentStudentIdx < students.length - 1) {
                          setCurrentStudentIdx(prev => prev + 1);
                        }
                      }
                    }}
                    className="micro-input-native"
                    disabled={!canEdit}
                  />
                  <button
                    type="button"
                    className="micro-btn-next-inline"
                    onClick={() => {
                      if (currentStudentIdx < students.length - 1) {
                        setCurrentStudentIdx(prev => prev + 1);
                      }
                    }}
                  >
                    <span>Siguiente</span>
                    <i className="ph-bold ph-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* BOTONERA TÁCTIL DE NOTAS RÁPIDAS (1 TOQUE = CALIFICA Y AVANZA) */}
            <div className="micro-quick-pad-section">
              <div className="micro-quick-pad-header">
                <span><i className="ph-bold ph-hand-tap"></i> Toca una nota para calificar y avanzar:</span>
              </div>
              <div className="micro-quick-buttons-grid">
                {QUICK_SCORES.map((scoreVal) => {
                  const isSelected = Number(currentScoreDisplay) === scoreVal;
                  return (
                    <button
                      key={scoreVal}
                      type="button"
                      className={`micro-quick-score-btn ${isSelected ? 'selected' : ''} ${scoreVal < 3.0 ? 'low' : scoreVal >= 4.5 ? 'superior' : 'pass'}`}
                      onClick={() => applyScoreAndAdvance(scoreVal)}
                      disabled={!canEdit}
                    >
                      {scoreVal.toFixed(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Barra de Navegación Inferior entre Alumnos */}
            <div className="micro-nav-bar">
              <button
                type="button"
                className="micro-nav-btn prev"
                onClick={() => setCurrentStudentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentStudentIdx === 0}
              >
                <i className="ph-bold ph-arrow-left"></i>
                <span>Anterior</span>
              </button>

              <span className="micro-nav-indicator">
                {currentStudentIdx + 1} / {students.length}
              </span>

              <button
                type="button"
                className="micro-nav-btn next"
                onClick={() => setCurrentStudentIdx(prev => Math.min(students.length - 1, prev + 1))}
                disabled={currentStudentIdx === students.length - 1}
              >
                <span>Siguiente</span>
                <i className="ph-bold ph-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* CUERPO MODO 2: LISTA RÁPIDA VERTICAL */}
        {viewMode === 'list' && (
          <div className="micro-list-body">
            <div className="micro-list-header-hint">
              <i className="ph-bold ph-info"></i>
              <span>Calificando <strong>{activeActivityMeta.name}</strong> para todo el grupo:</span>
            </div>

            <div className="micro-students-list">
              {students.map((st, idx) => {
                const score = getStudentScore(st, activeActivityId);
                return (
                  <div key={st.id} className="micro-list-row">
                    <div className="micro-list-row-student">
                      <span className="micro-list-idx">#{idx + 1}</span>
                      <div className="micro-list-names">
                        <strong>{st.name}</strong>
                        <small>{st.id}</small>
                      </div>
                    </div>

                    <div className="micro-list-row-input">
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        value={score !== '' && score !== null && score !== undefined ? score : ''}
                        placeholder="—"
                        onChange={(e) => {
                          const val = e.target.value.replace(',', '.');
                          let num = parseFloat(val);
                          if (isNaN(num)) num = '';
                          else if (num > 5.0) num = 5.0;
                          else if (num < 1.0 && val.length >= 3) num = 1.0;
                          onUpdateScore(st.id, activeActivityId, num);
                        }}
                        className={`micro-list-score-input ${Number(score) >= 3.0 ? 'pass' : Number(score) > 0 ? 'low' : ''}`}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pie del Modal con Guardado y Confirmación */}
        <div className="micro-footer">
          <div className="micro-footer-info">
            <i className="ph-bold ph-check-circle"></i>
            <span>Sincronización en tiempo real</span>
          </div>
          <button type="button" className="micro-btn-done" onClick={onClose}>
            <span>Guardar y Ver Planilla</span>
            <i className="ph-bold ph-check"></i>
          </button>
        </div>

      </div>
    </div>
  );
}
