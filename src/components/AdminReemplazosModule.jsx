import { useState, useEffect } from 'react';
import PortalNavbar from './PortalNavbar';
import gradesService from '../services/gradesService';
import { USERS } from '../data/users';
import { GRADES_LIST } from '../data/gradesTreeData';
import './AdminReemplazosModule.css';

/**
 * MÓDULO EXCLUSIVO DE ADMINISTRADOR:
 * Consola Completa de Gestión Curricular, Novedades y Reemplazos Docentes
 * Pantalla dedicada, espaciosa, rigurosa y estructurada con transferencia inmediata de planillas.
 */
export default function AdminReemplazosModule({
  currentUser,
  onBackToModules,
  onNavigateToGrades,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineCount,
  circularesCount = 0,
  onOpenCirculares,
  onOpenTour,
  onLogout
}) {
  const [selectedGrade, setSelectedGrade] = useState('5° Primaria');
  const [previousDocenteKey, setPreviousDocenteKey] = useState('');
  const [newDocenteKey, setNewDocenteKey] = useState('');
  const [replaceDirector, setReplaceDirector] = useState(true);
  const [replaceSubjects, setReplaceSubjects] = useState(true);
  const [reason, setReason] = useState('Incapacidad médica EPS');
  const [customReason, setCustomReason] = useState('');
  const [actaNumber, setActaNumber] = useState(`ACTA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Datos dinámicos de la matriz curricular e historial
  const [matrix, setMatrix] = useState([]);
  const [logs, setLogs] = useState([]);
  const [curriculumTick, setCurriculumTick] = useState(0);

  // Lista de todas las docentes disponibles para reemplazo
  const teacherOptions = Object.entries(USERS)
    .filter(([key, u]) => u.role === 'docente' || key === 'jessica' || key === 'yuri' || key === 'elcy' || key.startsWith('profe'))
    .map(([key, u]) => ({ key, name: u.name, label: u.label, avatar: u.avatar, initial: u.initial }));

  const loadData = () => {
    setMatrix(gradesService.getCurriculumMatrix());
    setLogs(gradesService.getReplacementLogs());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
      setCurriculumTick(t => t + 1);
    };

    window.addEventListener('gmg_curriculum_updated', handleUpdate);
    return () => window.removeEventListener('gmg_curriculum_updated', handleUpdate);
  }, []);

  // Grado actualmente seleccionado en la matriz
  const currentGradeData = matrix.find(m => m.grade === selectedGrade) || matrix[0];

  // Auto-seleccionar docente titular a reemplazar al cambiar de grado
  useEffect(() => {
    if (currentGradeData) {
      setPreviousDocenteKey(currentGradeData.director.docente_id || 'profe3');
      const differentTeacher = teacherOptions.find(t => t.key !== currentGradeData.director.docente_id);
      if (differentTeacher) {
        setNewDocenteKey(differentTeacher.key);
      }
    }
  }, [selectedGrade, matrix]);

  // Contadores de resumen
  const activeReplacementsCount = logs.filter(l => l.status === 'activo').length;
  const totalSubjectsCount = matrix.reduce((acc, curr) => acc + (curr.subjects?.length || 0), 0);

  const handleSubmitReplacement = (e) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (!selectedGrade) {
      setErrorMessage('Por favor seleccione el grado académico.');
      return;
    }
    if (!newDocenteKey) {
      setErrorMessage('Por favor seleccione el nuevo docente asignado para el reemplazo.');
      return;
    }
    if (previousDocenteKey === newDocenteKey) {
      setErrorMessage('El docente de reemplazo debe ser una persona diferente a la saliente.');
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
        reason: `${finalReason} (${actaNumber})`,
        adminUser: currentUser
      });

      setStatusMessage(result.message);
      setActaNumber(`ACTA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      loadData();
    } catch (err) {
      setErrorMessage(err.message || 'Error al aplicar el reemplazo docente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevert = (logId) => {
    if (!window.confirm('¿Confirmas que deseas finalizar este reemplazo y restituir al docente titular original a sus cursos y planillas?')) {
      return;
    }

    try {
      const result = gradesService.revertReplacement(logId, currentUser);
      setStatusMessage(result.message);
      loadData();
    } catch (err) {
      setErrorMessage(err.message || 'Error al revertir el reemplazo.');
    }
  };

  return (
    <div className="admin-reemplazos-page">
      {/* Header Superior Institucional Unificado */}
      <PortalNavbar
        currentUser={currentUser}
        moduleTitle="Consola de Asignaciones"
        moduleSubtitle="Supervisión Institucional • Asignaciones & Reemplazos Docentes"
        onBackToModules={onBackToModules}
        extraLeftActions={
          onNavigateToGrades && (
            <button 
              type="button" 
              className="btn-portal-back-modules" 
              onClick={onNavigateToGrades}
              title="Abrir Módulo de Notas y Calificaciones"
              style={{ borderColor: '#fde68a', backgroundColor: '#fef3c7', color: '#b45309' }}
            >
              <i className="ph-bold ph-chart-line-up"></i>
              <span>Ir a Notas</span>
            </button>
          )
        }
        onOpenConnectionsModal={onOpenConnectionsModal}
        onlineCount={onlineCount}
        circularesCount={circularesCount}
        onOpenCirculares={onOpenCirculares}
        onOpenTour={onOpenTour}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      {/* Contenido Principal Espacioso */}
      <main className="admin-page-content">
        {/* Banner de Bienvenida y Métricas */}
        <section className="admin-overview-banner">
          <div className="admin-overview-info">
            <div className="admin-title-row">
              <div className="admin-title-badge">
                <i className="ph-bold ph-sliders"></i>
              </div>
              <div>
                <h2>Gestión de Asignaciones Curriculares & Novedades Docentes</h2>
                <p>
                  Espacio administrativo formal para atender <strong>incapacidades médicas, licencias o contingencias docentes</strong>. 
                  Al efectuar un reemplazo, el nuevo docente nombrado adquiere de forma inmediata el acceso legal a las planillas y evaluaciones acumuladas.
                </p>
              </div>
            </div>
          </div>

          <div className="admin-stats-grid">
            <div className="admin-stat-card stat-grados">
              <span className="stat-label"><i className="ph-bold ph-student"></i> Grados Activos</span>
              <span className="stat-val">{GRADES_LIST.length}</span>
              <span className="stat-sub">Transición a 5°</span>
            </div>

            <div className="admin-stat-card stat-directores">
              <span className="stat-label"><i className="ph-bold ph-shield-star"></i> Dir. de Curso</span>
              <span className="stat-val">6</span>
              <span className="stat-sub">1 por Grado (SIEE)</span>
            </div>

            <div className={`admin-stat-card ${activeReplacementsCount > 0 ? 'stat-contingencia' : 'stat-normal'}`}>
              <span className="stat-label"><i className="ph-bold ph-arrows-clockwise"></i> Novedades Activas</span>
              <span className="stat-val">{activeReplacementsCount}</span>
              <span className="stat-sub">{activeReplacementsCount > 0 ? 'Reemplazos vigentes' : 'Planta normal'}</span>
            </div>

            <div className="admin-stat-card stat-asignaturas">
              <span className="stat-label"><i className="ph-bold ph-book-open"></i> Asignaturas</span>
              <span className="stat-val">{totalSubjectsCount || 48}</span>
              <span className="stat-sub">100% Cubiertas</span>
            </div>
          </div>
        </section>

        {/* Notificaciones de Estado */}
        {statusMessage && (
          <div className="admin-alert-banner alert-success-banner">
            <i className="ph-bold ph-check-circle"></i>
            <div className="alert-text">
              <strong>¡Novedad Aplicada y Sincronizada!</strong>
              <span>{statusMessage}</span>
            </div>
            <button type="button" className="btn-close-alert" onClick={() => setStatusMessage(null)}>
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="admin-alert-banner alert-danger-banner">
            <i className="ph-bold ph-warning-circle"></i>
            <div className="alert-text">
              <strong>Atención Administrativa:</strong>
              <span>{errorMessage}</span>
            </div>
            <button type="button" className="btn-close-alert" onClick={() => setErrorMessage(null)}>
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
        )}

        {/* Layout en 2 Columnas Estructurado */}
        <div className="admin-workstation-grid">
          {/* Columna Izquierda: Formulario Riguroso de Asignación y Reemplazo */}
          <section className="admin-work-card form-work-card">
            <div className="work-card-header">
              <div className="work-card-icon icon-emerald">
                <i className="ph-bold ph-user-switch"></i>
              </div>
              <div>
                <h3>Acta de Reasignación Docente & Reemplazo Inmediato</h3>
                <p>Configura la sustitución y transfiere las planillas de los estudiantes.</p>
              </div>
              <span className="acta-pill">{actaNumber}</span>
            </div>

            <form onSubmit={handleSubmitReplacement} className="admin-form-body">
              {/* Paso 1: Grado Académico */}
              <div className="form-row-2">
                <div className="form-field">
                  <label htmlFor="selectAdminGrade">
                    <i className="ph-bold ph-student"></i> 1. Grado a Intervenir:
                  </label>
                  <select 
                    id="selectAdminGrade"
                    value={selectedGrade} 
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="admin-select"
                  >
                    {GRADES_LIST.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="selectAdminReason">
                    <i className="ph-bold ph-first-aid"></i> 2. Causa de la Contingencia:
                  </label>
                  <select 
                    id="selectAdminReason"
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    className="admin-select"
                  >
                    <option value="Incapacidad médica EPS">Incapacidad médica EPS</option>
                    <option value="Licencia de maternidad / paternidad">Licencia de maternidad / paternidad</option>
                    <option value="Permiso institucional urgente">Permiso institucional urgente</option>
                    <option value="Calamidad doméstica">Calamidad doméstica</option>
                    <option value="Reorganización curricular de rectoría">Reorganización curricular de rectoría</option>
                    <option value="Otro">Otro motivo personalizado...</option>
                  </select>
                </div>
              </div>

              {reason === 'Otro' && (
                <div className="form-field" style={{ marginTop: '0.75rem' }}>
                  <label>Especifique la causa detallada:</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Incapacidad por 10 días hábiles autorizada por EPS Sura..." 
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="admin-input"
                    required
                  />
                </div>
              )}

              {/* Paso 2: Selección de Docentes */}
              <div className="form-transfer-box">
                <div className="transfer-participant-col">
                  <span className="participant-badge badge-saliente">
                    <i className="ph-bold ph-user-minus"></i> Docente Saliente / Incapacitado
                  </span>
                  <select 
                    value={previousDocenteKey} 
                    onChange={(e) => setPreviousDocenteKey(e.target.value)}
                    className="admin-select"
                  >
                    {teacherOptions.map(t => (
                      <option key={t.key} value={t.key}>{t.name} ({t.label})</option>
                    ))}
                  </select>
                  <span className="transfer-hint">Dejará temporalmente la gestión de sus cursos</span>
                </div>

                <div className="transfer-arrow-icon">
                  <i className="ph-bold ph-arrow-right"></i>
                </div>

                <div className="transfer-participant-col">
                  <span className="participant-badge badge-entrante">
                    <i className="ph-bold ph-user-plus"></i> Docente Nombrado (Reemplazo)
                  </span>
                  <select 
                    value={newDocenteKey} 
                    onChange={(e) => setNewDocenteKey(e.target.value)}
                    className="admin-select select-highlight"
                  >
                    {teacherOptions.map(t => (
                      <option key={t.key} value={t.key}>{t.name} ({t.label})</option>
                    ))}
                  </select>
                  <span className="transfer-hint">Heredará las planillas de los estudiantes</span>
                </div>
              </div>

              {/* Paso 3: Alcance de los Permisos */}
              <div className="form-scope-card">
                <span className="scope-title">
                  <i className="ph-bold ph-shield-check"></i> Alcance de la delegación de funciones en {selectedGrade}:
                </span>
                <div className="scope-options">
                  <label className="scope-item">
                    <input 
                      type="checkbox" 
                      checked={replaceDirector} 
                      onChange={(e) => setReplaceDirector(e.target.checked)} 
                    />
                    <div>
                      <strong>Asumir Dirección de Curso de {selectedGrade}</strong>
                      <span>Permite supervisión integral de todas las notas del grado con reporte a padres.</span>
                    </div>
                  </label>

                  <label className="scope-item">
                    <input 
                      type="checkbox" 
                      checked={replaceSubjects} 
                      onChange={(e) => setReplaceSubjects(e.target.checked)} 
                    />
                    <div>
                      <strong>Transferir todas las asignaturas y calificaciones acumuladas</strong>
                      <span>El nuevo docente podrá modificar y agregar notas sobre las ya existentes sin pérdida de información.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Aviso de Rigor SIEE */}
              <div className="siee-rigor-box">
                <i className="ph-bold ph-info"></i>
                <p>
                  <strong>Garantía de Rigor SIEE:</strong> La plataforma migra los registros existentes en modo seguro. 
                  El historial previo de calificaciones no se elimina ni se sobreescribe; el docente sustituto continúa sobre la misma planilla oficial.
                </p>
              </div>

              {/* Botón de Confirmación */}
              <div className="form-submit-row">
                <button 
                  type="submit" 
                  className="btn-confirm-replacement"
                  disabled={isSubmitting}
                >
                  <i className="ph-bold ph-swap"></i>
                  <span>{isSubmitting ? 'Aplicando Acta...' : 'Confirmar Reemplazo y Transferir Planillas'}</span>
                </button>
              </div>
            </form>
          </section>

          {/* Columna Derecha: Matriz Curricular en Vivo de los 6 Grados */}
          <section className="admin-work-card matrix-work-card">
            <div className="work-card-header">
              <div className="work-card-icon icon-cyan">
                <i className="ph-bold ph-chalkboard-teacher"></i>
              </div>
              <div>
                <h3>Matriz Curricular en Tiempo Real (Básica Primaria)</h3>
                <p>Directores de curso y asignaciones vigentes en el Gimnasio Martin Galeano.</p>
              </div>
            </div>

            <div className="matrix-grades-list">
              {matrix.map((row) => {
                const isSelected = row.grade === selectedGrade;
                const isDirectorReplaced = row.director.isReplaced;

                return (
                  <div 
                    key={row.grade} 
                    className={`grade-matrix-item ${isSelected ? 'grade-matrix-selected' : ''} ${isDirectorReplaced ? 'grade-has-novedad' : ''}`}
                  >
                    <div className="grade-item-header">
                      <div className="grade-name-badge">
                        <i className="ph-bold ph-graduation-cap"></i>
                        <span>{row.grade}</span>
                      </div>

                      <div className="grade-director-info">
                        <span className="dir-label">Director(a) de Curso:</span>
                        <span className="dir-name">{row.director.teacherName}</span>
                        {isDirectorReplaced ? (
                          <span className="pill-reemplazo-live" title={`Reemplazo activo de ${row.director.originalDocenteName}`}>
                            <i className="ph-bold ph-arrows-clockwise"></i> Reemplazo Activo
                          </span>
                        ) : (
                          <span className="pill-titular-live">Titular</span>
                        )}
                      </div>

                      <button 
                        type="button" 
                        className="btn-select-grade-reassign"
                        onClick={() => setSelectedGrade(row.grade)}
                        title={`Seleccionar ${row.grade} para gestionar reemplazo`}
                      >
                        <i className="ph-bold ph-pencil-simple"></i> Reasignar
                      </button>
                    </div>

                    <div className="grade-subjects-grid">
                      {row.subjects.map((s) => (
                        <div 
                          key={s.subject} 
                          className={`grade-subj-chip ${s.isReplaced ? 'subj-chip-replaced' : ''}`}
                          title={`${s.subject} a cargo de ${s.teacherName}${s.isReplaced ? ` (Reemplazo por: ${s.reason})` : ''}`}
                        >
                          <span className="subj-title">{s.subject}</span>
                          <span className="subj-teacher">
                            <i className="ph-bold ph-user"></i> {s.teacherName}
                            {s.isReplaced && <span className="chip-rep-star">★</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sección Inferior: Libro de Actas e Historial de Novedades */}
        <section className="admin-work-card history-work-card">
          <div className="work-card-header">
            <div className="work-card-icon icon-purple">
              <i className="ph-bold ph-clock-counter-clockwise"></i>
            </div>
            <div>
              <h3>Libro de Actas & Auditoría de Reemplazos Docentes</h3>
              <p>Registro histórico inmutable de novedades académicas y reincorporaciones de personal.</p>
            </div>
            <span className="badge-audit-count">{logs.length} registros</span>
          </div>

          {logs.length === 0 ? (
            <div className="empty-history-box">
              <i className="ph-bold ph-file-text"></i>
              <p>No se han registrado novedades de reemplazo hasta el momento. La planta docente opera con normalidad.</p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="admin-history-table">
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Grado</th>
                    <th>Docente Sustituido</th>
                    <th>Docente Sustituto</th>
                    <th>Alcance</th>
                    <th>Motivo / Acta</th>
                    <th>Autorizado Por</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const dateFormatted = new Date(log.timestamp).toLocaleString('es-CO', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    });
                    const isActive = log.status === 'activo';

                    return (
                      <tr key={log.id} className={isActive ? 'tr-active-replacement' : 'tr-reverted-replacement'}>
                        <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.8rem' }}>
                          <i className="ph-bold ph-calendar-blank"></i> {dateFormatted}
                        </td>
                        <td>
                          <strong>{log.grade}</strong>
                        </td>
                        <td>
                          <span className="teacher-pill teacher-prev">{log.previousDocenteName}</span>
                        </td>
                        <td>
                          <span className="teacher-pill teacher-new">{log.newDocenteName}</span>
                        </td>
                        <td>
                          <span className="scope-tag">
                            {log.replaceDirector ? 'Dirección + Materias' : 'Materias asignadas'}
                          </span>
                        </td>
                        <td>
                          <span className="reason-text">{log.reason}</span>
                        </td>
                        <td style={{ color: '#475569', fontSize: '0.8rem' }}>
                          {log.registeredBy}
                        </td>
                        <td>
                          {isActive ? (
                            <span className="pill-status-active">
                              <span className="pulse-dot-green"></span> Vigente
                            </span>
                          ) : (
                            <span className="pill-status-reverted">Reincorporado</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isActive ? (
                            <button 
                              type="button" 
                              className="btn-revert-action"
                              onClick={() => handleRevert(log.id)}
                              title="Finalizar reemplazo y reincorporar a la docente titular original"
                            >
                              <i className="ph-bold ph-arrow-u-up-left"></i>
                              <span>Reincorporar Titular</span>
                            </button>
                          ) : (
                            <span className="action-closed-label">Finalizada</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
