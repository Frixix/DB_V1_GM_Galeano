import { useState, useEffect } from 'react';
import PortalNavbar from './PortalNavbar';
import teacherService from '../services/teacherService';
import { getUserAvatar } from '../services/avatarService';
import { resetUserPasswordToDefault } from '../services/authService';
import './GestionDocenteModule.css';

// Helper para iconos temáticos de materias
const getSubjectIcon = (subj) => {
  if (!subj) return 'ph-book-bookmark';
  const s = subj.toLowerCase();
  if (s.includes('lengua') || s.includes('español')) return 'ph-book-open';
  if (s.includes('mate')) return 'ph-calculator';
  if (s.includes('natural')) return 'ph-leaf';
  if (s.includes('social')) return 'ph-globe';
  if (s.includes('inglés') || s.includes('ingles')) return 'ph-translate';
  if (s.includes('art')) return 'ph-palette';
  if (s.includes('física') || s.includes('fisica')) return 'ph-barbell';
  if (s.includes('ética') || s.includes('etica') || s.includes('valor')) return 'ph-heart';
  if (s.includes('relig')) return 'ph-cross';
  return 'ph-book-bookmark';
};

export default function GestionDocenteModule({ 
  currentUser, 
  onBackToModules,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineCount = 0,
  circularesCount = 0,
  onOpenCirculares,
  onOpenTour,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('directores'); // 'directores', 'malla', 'perfiles', 'auditoria'
  const [teachers, setTeachers] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [directorsMap, setDirectorsMap] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedMallaGrade, setSelectedMallaGrade] = useState('1° Primaria');
  const [toastMessage, setToastMessage] = useState(null);

  // Estados para asignación masiva de materia
  const [batchSubject, setBatchSubject] = useState('Inglés');
  const [batchTeacherKey, setBatchTeacherKey] = useState('elcy');

  // Estados para edición de perfiles docentes
  const [editingProfiles, setEditingProfiles] = useState({});

  // Cargar datos del servicio
  const loadData = () => {
    const teacherList = teacherService.getTeachers();
    setTeachers(teacherList);
    setMatrix(teacherService.getCurriculumMatrix());
    setDirectorsMap(teacherService.getGradeDirectorsMap());
    setAuditLogs(teacherService.getAuditLogs());

    // Inicializar estado de edición de perfiles
    const profiles = {};
    teacherList.forEach(t => {
      profiles[t.key] = {
        name: t.name,
        label: t.label || '',
        status: t.status || 'activa'
      };
    });
    setEditingProfiles(profiles);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = teacherService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Manejo de cambio de Director de Curso
  const handleDirectorChange = (grade, newTeacherKey, linkDirectorSubjects = true) => {
    try {
      const res = teacherService.setGradeDirector(grade, newTeacherKey, {
        linkDirectorSubjects,
        adminUser: currentUser
      });
      loadData();
      showToast(`¡Director de ${grade} actualizado! Se asignó a ${res.newDirector.teacherName} y se sincronizó en toda la plataforma.`);
    } catch (err) {
      alert(`Error al actualizar director: ${err.message}`);
    }
  };

  // Manejo de cambio de Docente en una materia
  const handleSubjectTeacherChange = (grade, subject, newTeacherKey) => {
    try {
      teacherService.setSubjectTeacher(grade, subject, newTeacherKey, currentUser);
      loadData();
      const teacherObj = teachers.find(t => t.key === newTeacherKey);
      showToast(`¡Materia actualizada! ${subject} en ${grade} ahora está a cargo de ${teacherObj?.name || newTeacherKey}.`);
    } catch (err) {
      alert(`Error al actualizar materia: ${err.message}`);
    }
  };

  // Asignación masiva de una materia en todos los grados
  const handleApplyBatchSubject = () => {
    try {
      teacherService.setSubjectAcrossGrades(batchSubject, batchTeacherKey, null, currentUser);
      loadData();
      const teacherObj = teachers.find(t => t.key === batchTeacherKey);
      showToast(`¡Asignación masiva aplicada! ${batchSubject} quedó a cargo de ${teacherObj?.name} en todos los grados.`);
    } catch (err) {
      alert(`Error en asignación masiva: ${err.message}`);
    }
  };

  // Guardar perfil individual
  const handleSaveProfile = (teacherKey) => {
    const profile = editingProfiles[teacherKey];
    if (!profile) return;
    try {
      teacherService.updateTeacherProfile(teacherKey, profile, currentUser);
      loadData();
      showToast(`¡Perfil de ${profile.name} guardado con éxito! Se refleja en Login, Calificaciones y Evaluaciones.`);
    } catch (err) {
      alert(`Error al actualizar perfil: ${err.message}`);
    }
  };

  // Restablecer clave a fábrica
  const handleResetPassword = async (teacherKey, teacherName) => {
    if (!window.confirm(`¿Desea restablecer la contraseña inicial por defecto de ${teacherName}?`)) {
      return;
    }
    try {
      await resetUserPasswordToDefault(teacherKey);
      showToast(`Contraseña de ${teacherName} restablecida a su valor inicial de fábrica.`);
    } catch (err) {
      alert(`Error al restablecer contraseña: ${err.message}`);
    }
  };

  // Aplicar Preset Institucional Galeano 2026
  const handleApplyPresetGaleano = () => {
    if (!window.confirm('¿Desea aplicar el Preset Institucional Galeano 2026?\n\n• Elcy: Inglés (Todos los grados)\n• Jessica: Español (Todos los grados)\n• Yuri: Ciencias Naturales y Sociales (Todos los grados)\n• Profe 2: Matemáticas (1° a 5°)\n• Directoras de Curso: Artes, Religión, Educación Física y Ética')) {
      return;
    }
    try {
      teacherService.applyGaleanoOfficialPreset(currentUser);
      loadData();
      showToast('¡Preset Oficial Galeano 2026 aplicado con éxito en toda la plataforma!');
    } catch (err) {
      alert(`Error al aplicar preset: ${err.message}`);
    }
  };

  // Vincular materias formativas a directoras
  const handleBindFormativas = () => {
    try {
      const res = teacherService.applyDirectorSubjectsRule(currentUser);
      loadData();
      showToast(`¡Materias formativas vinculadas! Se sincronizaron ${res.count} asignaturas con sus Directoras de Curso.`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Restablecer valores de fábrica
  const handleResetDefaults = () => {
    if (!window.confirm('¿Está seguro de restablecer todas las asignaciones a los valores iniciales de fábrica?')) {
      return;
    }
    try {
      teacherService.resetToFactoryDefaults(currentUser);
      loadData();
      showToast('Se restablecieron todas las asignaciones a la configuración institucional de fábrica.');
    } catch (err) {
      alert(`Error al restablecer: ${err.message}`);
    }
  };

  const currentMallaGradeData = matrix.find(m => m.grade === selectedMallaGrade) || matrix[0];

  return (
    <div className="gestion-docente-page">
      {/* 1. Barra Superior Institucional Unificada */}
      <PortalNavbar
        currentUser={currentUser}
        moduleTitle="Gestión Docente"
        moduleSubtitle="Planta Curricular & Directores de Curso"
        onBackToModules={onBackToModules}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onlineCount={onlineCount}
        circularesCount={circularesCount}
        onOpenCirculares={onOpenCirculares}
        onOpenTour={onOpenTour}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      {/* 2. Barra de Herramientas y Navegación del Módulo */}
      <div className="gd-subnav-container">
        <div className="gd-header-top">
          <div className="gd-title-area">
            <h1 className="gd-main-title">
              <i className="ph-bold ph-chalkboard-teacher" style={{ color: '#4f46e5' }}></i>
              Gestión Docente & Planta Curricular
              <span className="gd-badge-privilege">
                <i className="ph-bold ph-shield-check"></i> Directivo & Coordinación
              </span>
            </h1>
            <p className="gd-subtitle">
              Asignación de directores de curso, titularidad de materias y perfiles con impacto en tiempo real en todo el sistema.
            </p>
          </div>

          <div className="gd-header-actions">
            <button 
              type="button" 
              className="gd-btn-preset-galeano" 
              onClick={handleApplyPresetGaleano}
              title="Aplica la distribución oficial: Elcy Inglés, Jessica Español, Yuri Ciencias, Profe 2 Matemáticas"
            >
              <i className="ph-bold ph-magic-wand"></i>
              <span>Preset Galeano 2026</span>
            </button>

            <button 
              type="button" 
              className="gd-btn-bind-formativas" 
              onClick={handleBindFormativas}
              title="Asegura que Artes, Religión y Educación Física pertenezcan a la Directora de Curso en cada grado"
            >
              <i className="ph-bold ph-link"></i>
              <span>Vincular Formativas a Directoras</span>
            </button>

            <button 
              type="button" 
              className="gd-btn-reset" 
              onClick={handleResetDefaults}
              title="Restablece las asignaciones y directores por defecto"
            >
              <i className="ph-bold ph-arrow-counter-clockwise"></i>
              <span>Fábrica</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación Interna */}
        <nav className="gd-nav-tabs">
          <button 
            type="button" 
            className={`gd-tab-btn ${activeTab === 'directores' ? 'active' : ''}`}
            onClick={() => setActiveTab('directores')}
          >
            <i className="ph-bold ph-identification-badge"></i>
            <span>Dirección de Cursos</span>
            <span className="gd-tab-badge">6 Grados</span>
          </button>

          <button 
            type="button" 
            className={`gd-tab-btn ${activeTab === 'malla' ? 'active' : ''}`}
            onClick={() => setActiveTab('malla')}
          >
            <i className="ph-bold ph-books"></i>
            <span>Malla Curricular & Materias</span>
            <span className="gd-tab-badge">9 Materias</span>
          </button>

          <button 
            type="button" 
            className={`gd-tab-btn ${activeTab === 'perfiles' ? 'active' : ''}`}
            onClick={() => setActiveTab('perfiles')}
          >
            <i className="ph-bold ph-users"></i>
            <span>Perfiles de la Planta Docente</span>
            <span className="gd-tab-badge">{teachers.length} Docentes</span>
          </button>

          <button 
            type="button" 
            className={`gd-tab-btn ${activeTab === 'auditoria' ? 'active' : ''}`}
            onClick={() => setActiveTab('auditoria')}
          >
            <i className="ph-bold ph-clock-counter-clockwise"></i>
            <span>Historial & Auditoría</span>
            <span className="gd-tab-badge">{auditLogs.length}</span>
          </button>
        </nav>
      </div>

      {/* Contenido Principal */}
      <main className="gd-body-container">
        {/* Banner Informativo */}
        <div className="gd-info-banner">
          <i className="ph-bold ph-info"></i>
          <p>
            <strong>Sincronización Global en Tiempo Real:</strong> Cualquier cambio en la dirección de curso o titularidad de materias actualiza instantáneamente el <strong>Inicio de Sesión (Login)</strong>, las planillas y permisos de <strong>Calificaciones (SIEE)</strong>, el repositorio de <strong>Evaluaciones Finales</strong> y el <strong>Observador del Estudiante</strong>.
          </p>
        </div>

        {/* =====================================================================
            PESTAÑA 1: DIRECCIÓN DE CURSOS
            ===================================================================== */}
        {activeTab === 'directores' && (
          <section className="gd-tab-pane">
            <div className="gd-directors-grid">
              {Object.entries(directorsMap).map(([grade, dirInfo]) => {
                const assignedTeacher = teachers.find(t => t.key === dirInfo.docente_id) || {
                  name: dirInfo.teacherName,
                  label: 'Docente Titular',
                  avatar: null,
                  initial: dirInfo.teacherName?.slice(0, 2) || 'DC'
                };
                const avatarUrl = assignedTeacher.avatar || getUserAvatar(dirInfo.docente_id);

                return (
                  <article key={grade} className="gd-director-card">
                    <div>
                      <div className="gd-dc-header">
                        <h3 className="gd-dc-grade-title">
                          <i className="ph-bold ph-student"></i>
                          {grade}
                        </h3>
                        <span className="gd-dc-badge">Básica Primaria</span>
                      </div>

                      <div className="gd-dc-current-teacher">
                        <div className="gd-teacher-avatar-box">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={assignedTeacher.name} />
                          ) : (
                            assignedTeacher.initial || 'DC'
                          )}
                        </div>
                        <div className="gd-dc-teacher-info">
                          <span className="gd-dc-teacher-name">{assignedTeacher.name}</span>
                          <span className="gd-dc-teacher-label">{assignedTeacher.label || 'Directora de Curso'}</span>
                        </div>
                      </div>

                      <div className="gd-dc-change-group">
                        <label htmlFor={`select-dir-${grade}`}>Cambiar Directora de Curso:</label>
                        <select 
                          id={`select-dir-${grade}`}
                          className="gd-select-styled"
                          value={dirInfo.docente_id}
                          onChange={(e) => handleDirectorChange(grade, e.target.value, true)}
                        >
                          {teachers.map(t => (
                            <option key={t.key} value={t.key}>
                              {t.name} ({t.label || t.key})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="gd-dc-formativas-notice">
                      <i className="ph-bold ph-check-circle"></i>
                      <span>Artes, Religión y Ed. Física vinculadas automáticamente a esta Directora.</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* =====================================================================
            PESTAÑA 2: MALLA CURRICULAR Y ASIGNACIÓN DE MATERIAS
            ===================================================================== */}
        {activeTab === 'malla' && (
          <section className="gd-tab-pane">
            <div className="gd-curriculum-panel">
              {/* Barra de Selección de Grados */}
              <div className="gd-grade-selector-bar">
                {Object.keys(directorsMap).map(grade => (
                  <button 
                    key={grade}
                    type="button"
                    className={`gd-grade-btn ${selectedMallaGrade === grade ? 'active' : ''}`}
                    onClick={() => setSelectedMallaGrade(grade)}
                  >
                    <i className="ph-bold ph-graduation-cap"></i>
                    <span>{grade}</span>
                  </button>
                ))}
              </div>

              {/* Barra de Asignación Masiva */}
              <div className="gd-batch-bar">
                <span className="gd-batch-title">
                  <i className="ph-bold ph-lightning"></i>
                  Asignación Rápida Masiva:
                </span>
                <div className="gd-batch-controls">
                  <select 
                    className="gd-select-styled" 
                    style={{ maxWidth: '200px' }}
                    value={batchSubject}
                    onChange={(e) => setBatchSubject(e.target.value)}
                  >
                    <option value="Inglés">Inglés</option>
                    <option value="Lengua Castellana">Lengua Castellana (Español)</option>
                    <option value="Ciencias Naturales">Ciencias Naturales</option>
                    <option value="Ciencias Sociales">Ciencias Sociales</option>
                    <option value="Matemáticas">Matemáticas</option>
                  </select>

                  <select 
                    className="gd-select-styled" 
                    style={{ maxWidth: '220px' }}
                    value={batchTeacherKey}
                    onChange={(e) => setBatchTeacherKey(e.target.value)}
                  >
                    {teachers.map(t => (
                      <option key={t.key} value={t.key}>
                        {t.name} ({t.label || t.key})
                      </option>
                    ))}
                  </select>

                  <button 
                    type="button" 
                    className="gd-batch-btn"
                    onClick={handleApplyBatchSubject}
                  >
                    Asignar en Todos los Grados
                  </button>
                </div>
              </div>

              {/* Tabla de Asignación por Materia */}
              <div className="gd-table-responsive">
                <table className="gd-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Asignatura / Área</th>
                      <th style={{ width: '25%' }}>Tipo Curricular</th>
                      <th style={{ width: '35%' }}>Docente Titular Asignado</th>
                      <th style={{ width: '10%' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMallaGradeData?.subjects.map((item) => {
                      const isFormativa = ['Educación Artística', 'Religión', 'Educación Física', 'Ética & Valores'].includes(item.subject);

                      return (
                        <tr key={item.subject}>
                          <td>
                            <div className="gd-subject-col">
                              <div className="gd-subject-icon">
                                <i className={`ph-bold ${getSubjectIcon(item.subject)}`}></i>
                              </div>
                              <span>{item.subject}</span>
                            </div>
                          </td>
                          <td>
                            {isFormativa ? (
                              <span className="gd-badge-director-rule">
                                <i className="ph-bold ph-star"></i> Materia de Dirección
                              </span>
                            ) : (
                              <span className="gd-badge-custom-rule">
                                <i className="ph-bold ph-book-open"></i> Especialidad Académica
                              </span>
                            )}
                          </td>
                          <td>
                            <select 
                              className="gd-select-styled"
                              value={item.docente_id}
                              onChange={(e) => handleSubjectTeacherChange(selectedMallaGrade, item.subject, e.target.value)}
                            >
                              {teachers.map(t => (
                                <option key={t.key} value={t.key}>
                                  {t.name} ({t.label || t.key})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                              <i className="ph-bold ph-check"></i> Activo
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            PESTAÑA 3: PERFILES Y DIRECTORIO DE DOCENTES
            ===================================================================== */}
        {activeTab === 'perfiles' && (
          <section className="gd-tab-pane">
            <div className="gd-teachers-grid">
              {teachers.map((t) => {
                const profile = editingProfiles[t.key] || { name: t.name, label: t.label, status: t.status };
                const avatarUrl = t.avatar || getUserAvatar(t.key);

                return (
                  <article key={t.key} className="gd-teacher-card">
                    <div className="gd-tc-header">
                      <div className="gd-tc-left">
                        <div className="gd-tc-avatar">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={profile.name} />
                          ) : (
                            t.initial || t.key.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{profile.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Usuario: @{t.key}</span>
                        </div>
                      </div>
                      <span className="gd-dc-badge">
                        {t.directedGrade ? `Dir. ${t.directedGrade}` : 'Docente'}
                      </span>
                    </div>

                    <div className="gd-tc-form-group">
                      <label htmlFor={`edit-name-${t.key}`}>Nombre Visible Institucional:</label>
                      <input 
                        id={`edit-name-${t.key}`}
                        type="text" 
                        className="gd-input-styled"
                        value={profile.name}
                        onChange={(e) => setEditingProfiles({
                          ...editingProfiles,
                          [t.key]: { ...profile, name: e.target.value }
                        })}
                      />
                    </div>

                    <div className="gd-tc-form-group">
                      <label htmlFor={`edit-label-${t.key}`}>Especialidad / Rol en Login:</label>
                      <input 
                        id={`edit-label-${t.key}`}
                        type="text" 
                        className="gd-input-styled"
                        value={profile.label}
                        onChange={(e) => setEditingProfiles({
                          ...editingProfiles,
                          [t.key]: { ...profile, label: e.target.value }
                        })}
                        placeholder="Ej: Docente de Inglés • Dir. 4° Primaria"
                      />
                    </div>

                    <div className="gd-tc-form-group">
                      <label htmlFor={`edit-status-${t.key}`}>Estado Administrativo:</label>
                      <select 
                        id={`edit-status-${t.key}`}
                        className="gd-select-styled"
                        value={profile.status}
                        onChange={(e) => setEditingProfiles({
                          ...editingProfiles,
                          [t.key]: { ...profile, status: e.target.value }
                        })}
                      >
                        <option value="activa">Activa en Aula</option>
                        <option value="incapacidad">En Incapacidad Médica EPS</option>
                        <option value="permiso">En Permiso Institucional</option>
                        <option value="licencia">En Licencia</option>
                      </select>
                    </div>

                    <div className="gd-tc-actions">
                      <button 
                        type="button" 
                        className="gd-btn-save-teacher"
                        onClick={() => handleSaveProfile(t.key)}
                      >
                        <i className="ph-bold ph-floppy-disk"></i> Guardar Perfil
                      </button>

                      <button 
                        type="button" 
                        className="gd-btn-reset-pass"
                        onClick={() => handleResetPassword(t.key, profile.name)}
                        title="Restablece la contraseña por defecto de fábrica"
                      >
                        <i className="ph-bold ph-key"></i> Clave Inicial
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* =====================================================================
            PESTAÑA 4: AUDITORÍA Y TRAZABILIDAD
            ===================================================================== */}
        {activeTab === 'auditoria' && (
          <section className="gd-tab-pane">
            <div className="gd-audit-panel">
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
                <i className="ph-bold ph-clock-counter-clockwise"></i> Registro Histórico de Cambios
              </h3>

              {auditLogs.length === 0 ? (
                <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                  No se han registrado modificaciones curriculares todavía.
                </p>
              ) : (
                <div className="gd-audit-timeline">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="gd-audit-item">
                      <div className="gd-audit-icon-box">
                        <i className="ph-bold ph-check"></i>
                      </div>
                      <div className="gd-audit-content">
                        <div className="gd-audit-top">
                          <span className="gd-audit-action">{log.action}</span>
                          <span className="gd-audit-time">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="gd-audit-details">{log.details}</p>
                        <span className="gd-audit-author">Autor: {log.author} ({log.authorRole})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Toast Flotante */}
      {toastMessage && (
        <div className="gd-toast-floating">
          <i className="ph-bold ph-check-circle" style={{ fontSize: '1.25rem' }}></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
