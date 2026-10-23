import { useState, useEffect } from 'react';
import gradesService from '../services/gradesService';
import { USERS } from '../data/users';
import { GRADES_LIST } from '../data/gradesTreeData';
import './AdminReemplazosTab.css';

export default function AdminReemplazosTab({ currentUser, onCurriculumUpdated }) {
  const [selectedGrade, setSelectedGrade] = useState('5° Primaria');
  const [previousDocenteKey, setPreviousDocenteKey] = useState('');
  const [newDocenteKey, setNewDocenteKey] = useState('');
  const [replaceDirector, setReplaceDirector] = useState(true);
  const [replaceSubjects, setReplaceSubjects] = useState(true);
  const [reason, setReason] = useState('Incapacidad médica EPS');
  const [customReason, setCustomReason] = useState('');
  
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Datos dinámicos de la matriz curricular e historial
  const [matrix, setMatrix] = useState([]);
  const [logs, setLogs] = useState([]);

  // Lista de todas las docentes disponibles para reemplazo
  const teacherOptions = Object.entries(USERS)
    .filter(([key, u]) => u.role === 'docente' || key === 'jessica' || key === 'yuri' || key === 'elcy' || key.startsWith('profe'))
    .map(([key, u]) => ({ key, name: u.name, label: u.label }));

  const loadData = () => {
    setMatrix(gradesService.getCurriculumMatrix());
    setLogs(gradesService.getReplacementLogs());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('gmg_curriculum_updated', handleUpdate);
    return () => window.removeEventListener('gmg_curriculum_updated', handleUpdate);
  }, []);

  // Grado actualmente seleccionado en la matriz
  const currentGradeData = matrix.find(m => m.grade === selectedGrade) || matrix[0];

  // Auto-seleccionar docente titular a reemplazar al cambiar de grado
  useEffect(() => {
    if (currentGradeData) {
      setPreviousDocenteKey(currentGradeData.director.docente_id || 'jessica');
      // Seleccionar un reemplazante diferente por defecto
      const differentTeacher = teacherOptions.find(t => t.key !== currentGradeData.director.docente_id);
      if (differentTeacher) {
        setNewDocenteKey(differentTeacher.key);
      }
    }
  }, [selectedGrade, matrix]);

  const handleSubmitReplacement = (e) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (!selectedGrade) {
      setErrorMessage('Por favor seleccione el grado a intervenir.');
      return;
    }
    if (!newDocenteKey) {
      setErrorMessage('Por favor seleccione el nuevo docente asignado.');
      return;
    }
    if (previousDocenteKey === newDocenteKey) {
      setErrorMessage('El docente de reemplazo debe ser diferente al docente saliente.');
      return;
    }

    const finalReason = reason === 'Otro' ? (customReason.trim() || 'Novedad administrativa') : reason;

    setIsSubmitting(true);
    try {
      const result = gradesService.executeTeacherReplacement({
        grade: selectedGrade,
        previousDocenteKey,
        newDocenteKey,
        replaceDirector,
        replaceSubjects,
        reason: finalReason,
        adminUser: currentUser
      });

      setStatusMessage(result.message);
      loadData();
      if (onCurriculumUpdated) onCurriculumUpdated();
    } catch (err) {
      setErrorMessage(err.message || 'Error al aplicar el reemplazo docente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevert = (logId) => {
    if (!window.confirm('¿Desea finalizar este reemplazo y restituir al docente titular original a sus planillas?')) {
      return;
    }

    try {
      const result = gradesService.revertReplacement(logId, currentUser);
      setStatusMessage(result.message);
      loadData();
      if (onCurriculumUpdated) onCurriculumUpdated();
    } catch (err) {
      setErrorMessage(err.message || 'Error al revertir el reemplazo.');
    }
  };

  return (
    <div className="admin-reemplazos-container">
      {/* Encabezado del Panel de Novedades */}
      <div className="reemplazos-header-card">
        <div className="reemplazos-header-icon">
          <i className="ph-bold ph-arrows-left-right"></i>
        </div>
        <div>
          <h4>Gestión de Novedades y Reemplazos Docentes de Emergencia</h4>
          <p>
            Permite nombrar a un nuevo docente ante <strong>incapacidades médicas, permisos o contingencias de último momento</strong>.
            El docente de reemplazo <strong>heredará automáticamente</strong> las planillas de calificaciones, observaciones y el seguimiento de los estudiantes.
          </p>
        </div>
      </div>

      {/* Alertas de Notificación */}
      {statusMessage && (
        <div className="reemplazos-alert alert-success">
          <i className="ph-bold ph-check-circle"></i>
          <div>
            <strong>¡Cambio Aplicado Exitosamente!</strong>
            <p>{statusMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="reemplazos-alert alert-danger">
          <i className="ph-bold ph-warning-circle"></i>
          <div>
            <strong>Atención:</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Formulario de Reemplazo Inmediato */}
      <div className="reemplazos-form-card">
        <div className="card-section-title">
          <i className="ph-bold ph-user-switch"></i>
          <span>Registrar Novedad o Cambio de Docente</span>
        </div>

        <form onSubmit={handleSubmitReplacement} className="reemplazos-grid-form">
          {/* Grado Académico */}
          <div className="form-group">
            <label><i className="ph-bold ph-student"></i> Grado Afectado</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="reemplazos-select"
            >
              {GRADES_LIST.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {currentGradeData && (
              <span className="form-hint">
                Director actual: <strong>{currentGradeData.director.teacherName}</strong>
                {currentGradeData.director.isReplaced && <span className="tag-reemplazo-hint"> (En reemplazo)</span>}
              </span>
            )}
          </div>

          {/* Docente Saliente / Incapacitado */}
          <div className="form-group">
            <label><i className="ph-bold ph-user-minus"></i> Docente Incapacitado / Saliente</label>
            <select 
              value={previousDocenteKey} 
              onChange={(e) => setPreviousDocenteKey(e.target.value)}
              className="reemplazos-select"
            >
              {teacherOptions.map(t => (
                <option key={t.key} value={t.key}>{t.name} ({t.label})</option>
              ))}
            </select>
            <span className="form-hint">Docente que no puede asistir temporalmente</span>
          </div>

          {/* Docente Entrante / Reemplazante */}
          <div className="form-group">
            <label><i className="ph-bold ph-user-plus"></i> Docente Nombrado (Reemplazo)</label>
            <select 
              value={newDocenteKey} 
              onChange={(e) => setNewDocenteKey(e.target.value)}
              className="reemplazos-select select-highlight"
            >
              {teacherOptions.map(t => (
                <option key={t.key} value={t.key}>{t.name} ({t.label})</option>
              ))}
            </select>
            <span className="form-hint">Tendrá acceso inmediato a las planillas y notas</span>
          </div>

          {/* Motivo de la Novedad */}
          <div className="form-group">
            <label><i className="ph-bold ph-first-aid"></i> Motivo de la Contingencia</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="reemplazos-select"
            >
              <option value="Incapacidad médica EPS">Incapacidad médica EPS</option>
              <option value="Licencia de maternidad / paternidad">Licencia de maternidad / paternidad</option>
              <option value="Permiso institucional urgente">Permiso institucional urgente</option>
              <option value="Calamidad doméstica">Calamidad doméstica</option>
              <option value="Reorganización curricular de rectoría">Reorganización curricular de rectoría</option>
              <option value="Otro">Otro motivo personalizado...</option>
            </select>
          </div>

          {reason === 'Otro' && (
            <div className="form-group form-group-full">
              <label>Especifique el motivo de la novedad:</label>
              <input 
                type="text" 
                placeholder="Ej. Incapacidad por 5 días hábiles..." 
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="reemplazos-input"
                required
              />
            </div>
          )}

          {/* Alcance del Reemplazo */}
          <div className="form-group-full alcances-box">
            <span className="alcance-title">Alcance de la transferencia de permisos:</span>
            <div className="alcance-checkboxes">
              <label className="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={replaceDirector} 
                  onChange={(e) => setReplaceDirector(e.target.checked)} 
                />
                <span>Nombrar también como <strong>Director(a) de Curso</strong> de {selectedGrade}</span>
              </label>

              <label className="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={replaceSubjects} 
                  onChange={(e) => setReplaceSubjects(e.target.checked)} 
                />
                <span>Transferir <strong>todas las asignaturas</strong> y notas ya registradas del docente saliente</span>
              </label>
            </div>
          </div>

          {/* Botón de Enviar */}
          <div className="form-group-full form-actions-row">
            <button 
              type="submit" 
              className="btn-submit-reemplazo"
              disabled={isSubmitting}
            >
              <i className="ph-bold ph-swap"></i>
              <span>{isSubmitting ? 'Aplicando Novedad...' : 'Confirmar Reemplazo y Transferir Planillas'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Matriz Curricular en Tiempo Real */}
      <div className="reemplazos-matrix-card">
        <div className="card-section-title">
          <i className="ph-bold ph-table"></i>
          <span>Matriz de Asignaciones y Directores de Curso Activos</span>
        </div>

        <div className="table-responsive">
          <table className="reemplazos-table">
            <thead>
              <tr>
                <th>Grado</th>
                <th>Director(a) de Curso</th>
                <th>Docentes Asignados</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.grade} className={row.director.isReplaced ? 'row-reemplazado' : ''}>
                  <td>
                    <strong>{row.grade}</strong>
                  </td>
                  <td>
                    <div className="director-cell">
                      <span className="director-name">{row.director.teacherName}</span>
                      {row.director.isReplaced ? (
                        <span className="badge-reemplazo-activo" title={`Reemplazo de ${row.director.originalDocenteName}`}>
                          <i className="ph-bold ph-arrows-clockwise"></i> Reemplazo Activo
                        </span>
                      ) : (
                        <span className="badge-titular">Titular Oficial</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="subjects-tags-wrap">
                      {row.subjects.map(s => (
                        <span 
                          key={s.subject} 
                          className={`subject-tag ${s.isReplaced ? 'subject-tag-replaced' : ''}`}
                          title={`${s.subject} - Docente: ${s.teacherName}${s.isReplaced ? ` (Reemplazo por: ${s.reason})` : ''}`}
                        >
                          {s.subject}: <strong>{s.teacherName}</strong>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {row.director.isReplaced ? (
                      <span className="status-pill status-novedad">Novedad Activa</span>
                    ) : (
                      <span className="status-pill status-normal">Normal</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      type="button" 
                      className="btn-quick-reassign"
                      onClick={() => {
                        setSelectedGrade(row.grade);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      title="Reasignar o editar reemplazo para este grado"
                    >
                      <i className="ph-bold ph-pencil-simple-line"></i> Reasignar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Novedades Registradas */}
      {logs.length > 0 && (
        <div className="reemplazos-history-card">
          <div className="card-section-title">
            <i className="ph-bold ph-clock-counter-clockwise"></i>
            <span>Historial de Novedades y Reemplazos Registrados</span>
          </div>

          <div className="history-list">
            {logs.map((log) => {
              const dateStr = new Date(log.timestamp).toLocaleString('es-CO', {
                dateStyle: 'medium',
                timeStyle: 'short'
              });

              const isActive = log.status === 'activo';

              return (
                <div key={log.id} className={`history-item ${isActive ? 'history-active' : 'history-reverted'}`}>
                  <div className="history-item-left">
                    <div className="history-icon-circle">
                      <i className={`ph-bold ${isActive ? 'ph-user-switch' : 'ph-check'}`}></i>
                    </div>
                    <div className="history-details">
                      <div className="history-title-row">
                        <strong>{log.grade}</strong>
                        <span className="history-transfer">
                          {log.previousDocenteName} <i className="ph-bold ph-arrow-right"></i> {log.newDocenteName}
                        </span>
                        <span className={`history-status-badge ${isActive ? 'badge-act' : 'badge-rev'}`}>
                          {isActive ? 'Reemplazo Activo' : 'Finalizado / Revertido'}
                        </span>
                      </div>
                      <p className="history-meta">
                        <span><strong>Motivo:</strong> {log.reason}</span> • 
                        <span><strong>Registrado por:</strong> {log.registeredBy}</span> • 
                        <span><i className="ph-bold ph-clock"></i> {dateStr}</span>
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="history-item-right">
                      <button 
                        type="button" 
                        className="btn-revert-replacement"
                        onClick={() => handleRevert(log.id)}
                        title="Finalizar el reemplazo y reincorporar al docente titular original"
                      >
                        <i className="ph-bold ph-arrow-u-up-left"></i>
                        <span>Reincorporar Docente Titular</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
