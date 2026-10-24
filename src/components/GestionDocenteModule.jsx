import { useState, useEffect } from 'react';
import PortalNavbar from './PortalNavbar';
import teacherService from '../services/teacherService';
import committeeService from '../services/committeeService';
import CommitteeAssignmentModal from './CommitteeAssignmentModal';
import TeacherDischargeModal from './TeacherDischargeModal';
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
  isNotificationsOpen = false,
  onOpenTour,
  onLogout
}) {
  const isAdmin = currentUser?.role === 'admin';
  const isRectora = currentUser?.role === 'rectora' || currentUser?.role === 'induccion_rectora';
  const isCoordinador = currentUser?.role === 'coordinador';
  const canResetPassword = isAdmin || isRectora;
  const canResetFactory = isAdmin || isRectora;

  const [activeTab, setActiveTab] = useState('directores'); // 'directores', 'malla', 'perfiles', 'bajas', 'auditoria'
  const [teachers, setTeachers] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [directorsMap, setDirectorsMap] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [retirementsHistory, setRetirementsHistory] = useState([]);
  const [selectedMallaGrade, setSelectedMallaGrade] = useState('1° Primaria');
  const [toastMessage, setToastMessage] = useState(null);

  // Modal de Baja de Docente
  const [dischargeTargetTeacher, setDischargeTargetTeacher] = useState(null);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);

  // Estados para asignación de comités de actas (Ley 1620 / Dec. 1290)
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [committeesMap, setCommitteesMap] = useState(() => committeeService.getCommittees());

  // Estados para asignación masiva de materia
  const [batchSubject, setBatchSubject] = useState('Inglés');
  const [batchTeacherKey, setBatchTeacherKey] = useState('elcy');

  // Estados para edición de perfiles docentes
  const [editingProfiles, setEditingProfiles] = useState({});
  const [showSyncInfoTip, setShowSyncInfoTip] = useState(false);

  // Cargar datos del servicio
  const loadData = () => {
    const teacherList = teacherService.getTeachers(true); // Incluir planta completa
    setTeachers(teacherList);
    setMatrix(teacherService.getCurriculumMatrix());
    setDirectorsMap(teacherService.getGradeDirectorsMap());
    setAuditLogs(teacherService.getAuditLogs());
    setRetirementsHistory(teacherService.getRetirementsHistory());
    setCommitteesMap(committeeService.getCommittees());

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
    const unsubscribeTeachers = teacherService.subscribe(() => {
      loadData();
    });
    const handleCommitteesUpdated = () => {
      setCommitteesMap(committeeService.getCommittees());
    };
    window.addEventListener('gmg_committees_updated', handleCommitteesUpdated);
    return () => {
      unsubscribeTeachers();
      window.removeEventListener('gmg_committees_updated', handleCommitteesUpdated);
    };
  }, []);

  // Helper para consultar comités asignados a una docente
  const getTeacherCommittees = (teacherKey) => {
    const result = [];
    Object.values(committeesMap).forEach((c) => {
      if (c.assignedTeachers && c.assignedTeachers.includes(teacherKey)) {
        result.push(c);
      }
    });
    return result;
  };

  const isInduccion = currentUser?.role === 'induccion' || currentUser?.role === 'induccion_rectora';

  const showToast = (msg) => {
    const finalMsg = isInduccion ? "Acción en modo demostración: los datos maestros están protegidos." : msg;
    setToastMessage(finalMsg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === finalMsg ? null : curr));
    }, 4000);
  };

  // Manejo de cambio de Director de Curso
  const handleDirectorChange = async (grade, newTeacherKey, linkDirectorSubjects = true) => {
    try {
      const res = await teacherService.setGradeDirector(grade, newTeacherKey, {
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
  const handleSubjectTeacherChange = async (grade, subject, newTeacherKey) => {
    try {
      await teacherService.setSubjectTeacher(grade, subject, newTeacherKey, currentUser);
      loadData();
      const teacherObj = teachers.find(t => t.key === newTeacherKey);
      showToast(`¡Materia actualizada! ${subject} en ${grade} ahora está a cargo de ${teacherObj?.name || newTeacherKey}.`);
    } catch (err) {
      alert(`Error al actualizar materia: ${err.message}`);
    }
  };

  // Asignación masiva de una materia en todos los grados
  const handleApplyBatchSubject = async () => {
    try {
      await teacherService.setSubjectAcrossGrades(batchSubject, batchTeacherKey, null, currentUser);
      loadData();
      const teacherObj = teachers.find(t => t.key === batchTeacherKey);
      showToast(`¡Asignación masiva aplicada! ${batchSubject} quedó a cargo de ${teacherObj?.name} en todos los grados.`);
    } catch (err) {
      alert(`Error en asignación masiva: ${err.message}`);
    }
  };

  // Guardar perfil individual
  const handleSaveProfile = async (teacherKey) => {
    const profile = editingProfiles[teacherKey];
    if (!profile) return;
    try {
      await teacherService.updateTeacherProfile(teacherKey, profile, currentUser);
      loadData();
      showToast(`¡Perfil de ${profile.name} guardado con éxito! Se sincronizó en toda la plataforma.`);
    } catch (err) {
      alert(`Error al actualizar perfil: ${err.message}`);
    }
  };

  // Guardar todos los perfiles docentes modificados
  const handleSaveAllProfiles = async () => {
    try {
      let count = 0;
      for (const [key, prof] of Object.entries(editingProfiles)) {
        if (prof) {
          await teacherService.updateTeacherProfile(key, prof, currentUser);
          count++;
        }
      }
      loadData();
      showToast(`¡${count} perfiles docentes guardados y sincronizados en toda la plataforma!`);
    } catch (err) {
      alert(`Error al guardar perfiles: ${err.message}`);
    }
  };

  // Restablecer clave a fábrica (Solo Rectora o Administrador)
  const handleResetPassword = async (teacherKey, teacherName) => {
    if (!canResetPassword) {
      alert('Acción restringida: Solo Rectoría o el Administrador General tienen permisos para restablecer contraseñas.');
      return;
    }
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
  const handleApplyPresetGaleano = async () => {
    if (!window.confirm('¿Desea aplicar el Preset Institucional Galeano 2026?\n\n• Elcy: Inglés (Todos los grados)\n• Jessica: Español (Todos los grados)\n• Yuri: Ciencias Naturales y Sociales (Todos los grados)\n• Profe 2: Matemáticas (1° a 5°)\n• Directoras de Curso: Artes, Religión, Educación Física y Ética')) {
      return;
    }
    try {
      await teacherService.applyGaleanoOfficialPreset(currentUser);
      loadData();
      showToast('¡Preset Oficial Galeano 2026 aplicado con éxito en toda la plataforma!');
    } catch (err) {
      alert(`Error al aplicar preset: ${err.message}`);
    }
  };

  // Vincular materias formativas a directoras
  const handleBindFormativas = async () => {
    try {
      const res = await teacherService.applyDirectorSubjectsRule(currentUser);
      loadData();
      showToast(`¡Materias formativas vinculadas! Se sincronizaron ${res.count} asignaturas con sus Directoras de Curso.`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Restablecer valores de fábrica (Solo Rectora o Administrador)
  const handleResetDefaults = async () => {
    if (!canResetFactory) {
      alert('Acción restringida: Solo Rectoría o el Administrador General pueden restablecer la configuración de fábrica.');
      return;
    }
    if (!window.confirm('¿Está seguro de restablecer todas las asignaciones a los valores iniciales de fábrica?')) {
      return;
    }
    try {
      await teacherService.resetToFactoryDefaults(currentUser);
      loadData();
      showToast('Se restablecieron todas las asignaciones a la configuración institucional de fábrica.');
    } catch (err) {
      alert(`Error al restablecer: ${err.message}`);
    }
  };

  // Abrir modal de baja de docente
  const handleOpenDischargeModal = (teacher) => {
    setDischargeTargetTeacher(teacher);
    setIsDischargeModalOpen(true);
  };

  // Procesar baja y traspaso obligatorio de responsabilidades
  const handleConfirmDischarge = async (dischargePayload) => {
    try {
      const res = await teacherService.processTeacherDischarge({
        ...dischargePayload,
        author: currentUser
      });
      loadData();
      showToast(`¡Baja procesada con éxito! Se transfirieron todas las responsabilidades a ${res.entry.replacementName}.`);
    } catch (err) {
      alert(`Error al procesar la baja: ${err.message}`);
      throw err;
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
        isNotificationsOpen={isNotificationsOpen}
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

          <div className="gd-header-actions gd-top-actions">
            <button 
              type="button" 
              className="gd-btn-comites" 
              onClick={() => setIsCommitteeModalOpen(true)}
              title="Asignación directiva de 1 o 2 docentes por comité de actas (Ley 1620 / Dec. 1290)"
            >
              <i className="ph-bold ph-scales"></i>
              <span>Comités de Actas</span>
            </button>

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

            {canResetFactory && (
              <button 
                type="button" 
                className="gd-btn-reset" 
                onClick={handleResetDefaults}
                title="Restablece las asignaciones y directores por defecto (Exclusivo Rectoría y Admin)"
              >
                <i className="ph-bold ph-arrow-counter-clockwise"></i>
                <span>Fábrica</span>
              </button>
            )}
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
            <span className="gd-tab-badge">{teachers.filter(t => t.status !== 'retirada').length} Activas</span>
          </button>

          <button 
            type="button" 
            className={`gd-tab-btn ${activeTab === 'bajas' ? 'active' : ''}`}
            onClick={() => setActiveTab('bajas')}
          >
            <i className="ph-bold ph-user-minus"></i>
            <span>Historial de Bajas & Reemplazos</span>
            {retirementsHistory.length > 0 && (
              <span className="gd-tab-badge" style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }}>
                {retirementsHistory.length}
              </span>
            )}
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
        {/* Barra Compacta de Sincronización con Bombillito */}
        <div className="gd-compact-tip-bar">
          <div className="gd-compact-tip-left">
            <span className="gd-tip-badge">Sincronización Global</span>
            <span className="gd-tip-summary">Cambios curriculares y de planta en tiempo real</span>
            <button
              type="button"
              className={`gd-btn-bulb ${showSyncInfoTip ? 'active' : ''}`}
              onClick={() => setShowSyncInfoTip(prev => !prev)}
              title="Ver detalle de sincronización institucional"
            >
              💡
            </button>
          </div>
          {showSyncInfoTip && (
            <div className="gd-bulb-popover">
              <p style={{ margin: 0 }}>
                Cualquier cambio en la dirección de curso o titularidad de materias actualiza instantáneamente el <strong>Inicio de Sesión (Login)</strong>, las planillas y permisos de <strong>Calificaciones (SIEE)</strong>, el repositorio de <strong>Evaluaciones Finales</strong> y el <strong>Observador del Estudiante</strong>.
              </p>
            </div>
          )}
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
            {/* Barra superior de control de perfiles docentes */}
            <div className="gd-perfiles-header-bar">
              <div className="gd-perfiles-header-info">
                <h3 className="gd-perfiles-title">
                  <i className="ph-bold ph-identification-badge"></i>
                  Directorio & Perfiles de la Planta Docente
                </h3>
                <p className="gd-perfiles-subtitle">
                  Edita nombres institucionales, especialidades y estados administrativos. Se sincronizan en tiempo real con Login, Calificaciones, Evaluaciones y Sidebars.
                </p>
              </div>
              <button 
                type="button" 
                className="gd-btn-save-all-profiles"
                onClick={handleSaveAllProfiles}
                title="Guardar todos los perfiles de la planta docente de una sola vez"
              >
                <i className="ph-bold ph-floppy-disk"></i>
                <span>Guardar Todos los Cambios</span>
              </button>
            </div>

            <div className="gd-teachers-grid">
              {teachers.map((t) => {
                const profile = editingProfiles[t.key] || { name: t.name, label: t.label, status: t.status };
                const avatarUrl = t.avatar || getUserAvatar(t.key);

                const getStatusBadge = (statusVal) => {
                  switch (statusVal) {
                    case 'incapacidad':
                      return <span className="gd-status-pill gd-status-incapacidad">Incapacidad EPS</span>;
                    case 'permiso':
                      return <span className="gd-status-pill gd-status-permiso">Permiso</span>;
                    case 'licencia':
                      return <span className="gd-status-pill gd-status-licencia">Licencia</span>;
                    default:
                      return <span className="gd-status-pill gd-status-activa">Activa en Aula</span>;
                  }
                };

                return (
                  <article key={t.key} className="gd-teacher-card">
                    <div className="gd-tc-header gd-teacher-card-header">
                      <div className="gd-tc-left">
                        <div 
                          className="gd-tc-avatar gd-tc-avatar-clickable"
                          onClick={() => onOpenProfile && onOpenProfile(t.key)}
                          title={`Clic para personalizar foto o avatar de ${profile.name}`}
                          role="button"
                          tabIndex={0}
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={profile.name} />
                          ) : (
                            t.initial || t.key.slice(0, 2).toUpperCase()
                          )}
                          <span className="gd-avatar-hover-icon">
                            <i className="ph-bold ph-sliders"></i>
                          </span>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{profile.name}</h4>
                            {getStatusBadge(profile.status)}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Usuario: @{t.key}</span>
                        </div>
                      </div>
                      <span className="gd-dc-badge">
                        {t.directedGrade ? `Dir. ${t.directedGrade}` : 'Docente'}
                      </span>
                    </div>

                    {/* Roles Institucionales & Comités Asignados (Ley 1620 / Dec. 1290) */}
                    <div className="gd-teacher-roles-summary">
                      <span className="gd-role-chip dir">
                        <i className="ph-bold ph-chalkboard"></i>
                        {t.directedGrade ? `Dir. ${t.directedGrade}` : 'Docente de Aula'}
                      </span>
                      {getTeacherCommittees(t.key).map((c) => (
                        <span 
                          key={c.id} 
                          className="gd-role-chip committee" 
                          title={`Miembro oficial asignado por Rectoría: ${c.name} (${c.legalBasis})`}
                        >
                          <i className={`ph-bold ${c.icon || 'ph-scales'}`}></i>
                          {c.id === 'comite_convivencia' ? 'Com. Convivencia' : (c.id === 'comision_evaluacion' ? 'Com. Evaluación' : (c.id === 'consejo_academico' ? 'Consejo Académico' : 'Asambleas'))}
                        </span>
                      ))}
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
                        onBlur={() => handleSaveProfile(t.key)}
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
                        onBlur={() => handleSaveProfile(t.key)}
                        placeholder="Ej: Docente de Inglés • Dir. 4° Primaria"
                      />
                    </div>

                    <div className="gd-tc-form-group">
                      <label htmlFor={`edit-status-${t.key}`}>Estado Administrativo:</label>
                      <select 
                        id={`edit-status-${t.key}`}
                        className="gd-select-styled"
                        value={profile.status}
                        onChange={(e) => {
                          const updated = { ...profile, status: e.target.value };
                          setEditingProfiles({
                            ...editingProfiles,
                            [t.key]: updated
                          });
                        }}
                        onBlur={() => handleSaveProfile(t.key)}
                      >
                        <option value="activa">Activa en Aula</option>
                        <option value="incapacidad">En Incapacidad Médica EPS</option>
                        <option value="permiso">En Permiso Institucional</option>
                        <option value="licencia">En Licencia</option>
                      </select>
                    </div>

                    <div className="gd-tc-actions gd-teacher-actions-bar">
                      <button 
                        type="button" 
                        className="gd-btn-save-teacher btn-save-profile"
                        onClick={() => handleSaveProfile(t.key)}
                        title="Guardar cambios de este docente"
                      >
                        <i className="ph-bold ph-floppy-disk"></i> Guardar Perfil
                      </button>

                      <div className="gd-teacher-actions-subgroup" style={{ display: 'contents' }}>
                        {onOpenProfile && (
                          <button 
                            type="button" 
                            className="gd-btn-edit-avatar"
                            onClick={() => onOpenProfile(t.key)}
                            title={`Personalizar foto/avatar de ${profile.name}`}
                          >
                            <i className="ph-bold ph-sliders"></i> Foto
                          </button>
                        )}

                        {canResetPassword && (
                          <button 
                            type="button" 
                            className="gd-btn-reset-pass"
                            onClick={() => handleResetPassword(t.key, profile.name)}
                            title="Restablece la contraseña por defecto de fábrica"
                          >
                            <i className="ph-bold ph-key"></i> Clave
                          </button>
                        )}

                        {/* Botón de Baja de Docente */}
                        {t.status !== 'retirada' && (isAdmin || isRectora || isCoordinador) && (
                          <button
                            type="button"
                            className="gd-btn-discharge-teacher"
                            onClick={() => handleOpenDischargeModal(t)}
                            title={`Dar de baja a ${profile.name} y transferir obligatoriamente sus cargos`}
                          >
                            <i className="ph-bold ph-user-minus"></i> Baja
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* =====================================================================
            PESTAÑA: HISTORIAL DE BAJAS Y REEMPLAZOS DOCENTES
            ===================================================================== */}
        {activeTab === 'bajas' && (
          <section className="gd-tab-pane">
            <div className="gd-audit-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="ph-bold ph-user-minus" style={{ color: '#dc2626' }}></i>
                    Historial Institucional de Bajas y Reemplazos
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Registro inmutable de docentes desvinculados, motivos legales y traspaso obligatorio de cargos y responsabilidades.
                  </p>
                </div>
              </div>

              {retirementsHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <i className="ph-bold ph-shield-check" style={{ fontSize: '2.5rem', color: '#10b981', display: 'block', marginBottom: '0.5rem' }}></i>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a' }}>Planta Docente 100% Activa</h4>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                    No se han registrado bajas de personal. Cuando un docente se retire, aquí se conservará el histórico con su reemplazo correspondiente.
                  </p>
                </div>
              ) : (
                <div className="gd-retirements-grid">
                  {retirementsHistory.map((item) => (
                    <article key={item.id} className="gd-retirement-card">
                      <div className="gd-ret-header">
                        <div className="gd-ret-badge-date">
                          <i className="ph-bold ph-calendar"></i>
                          <span>Fecha: {item.effectiveDate || new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <span className="gd-ret-id">{item.id}</span>
                      </div>

                      <div className="gd-ret-transfer-flow">
                        {/* Docente Retirado */}
                        <div className="gd-ret-box-person out">
                          <span className="gd-ret-role-tag">Docente que se retiró</span>
                          <h4 className="gd-ret-name">{item.retiredName}</h4>
                          <span className="gd-ret-desc">{item.retiredLabel}</span>
                        </div>

                        {/* Flecha de Transferencia */}
                        <div className="gd-ret-arrow">
                          <i className="ph-bold ph-arrow-right"></i>
                          <span>Traspaso</span>
                        </div>

                        {/* Docente Entrante */}
                        <div className="gd-ret-box-person in">
                          <span className="gd-ret-role-tag in">Docente que asume</span>
                          <h4 className="gd-ret-name">{item.replacementName}</h4>
                          <span className="gd-ret-desc">
                            {item.replacementMode === 'new' ? 'Nuevo Contrato' : 'Reasignación Planta'}
                          </span>
                        </div>
                      </div>

                      {/* Motivo Formal */}
                      <div className="gd-ret-reason-box">
                        <strong>Motivo del Retiro:</strong>
                        <p>"{item.reason}"</p>
                      </div>

                      {/* Cargos y Responsabilidades Transferidas */}
                      <div className="gd-ret-transferred-meta">
                        {item.transferredDirectorGrades && item.transferredDirectorGrades.length > 0 && (
                          <span className="gd-ret-chip dir">
                            <i className="ph-bold ph-chalkboard"></i>
                            Dirección: {item.transferredDirectorGrades.join(', ')}
                          </span>
                        )}
                        <span className="gd-ret-chip subjects">
                          <i className="ph-bold ph-books"></i>
                          {item.transferredSubjectsCount || 0} materias transferidas
                        </span>
                        {item.transferredCommittees && item.transferredCommittees.length > 0 && (
                          <span className="gd-ret-chip com">
                            <i className="ph-bold ph-scales"></i>
                            Comités: {item.transferredCommittees.join(', ')}
                          </span>
                        )}
                      </div>

                      <div className="gd-ret-footer">
                        <span>Autorizado por: <strong>{item.author}</strong> ({item.authorRole})</span>
                        <span className="gd-ret-timestamp">{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
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

      {/* Modal de Asignación de Comités de Actas (Ley 1620 / Dec. 1290) */}
      <CommitteeAssignmentModal 
        isOpen={isCommitteeModalOpen}
        onClose={() => setIsCommitteeModalOpen(false)}
        currentUser={currentUser}
        onAssignmentsUpdated={() => {
          setCommitteesMap(committeeService.getCommittees());
          showToast('¡Asignación de comités de actas actualizada y sincronizada en toda la institución!');
        }}
      />

      {/* Modal de Baja de Docente y Reemplazo Obligatorio */}
      <TeacherDischargeModal
        isOpen={isDischargeModalOpen}
        onClose={() => {
          setIsDischargeModalOpen(false);
          setDischargeTargetTeacher(null);
        }}
        teacher={dischargeTargetTeacher}
        activeTeachers={teachers}
        onSubmit={handleConfirmDischarge}
        isInduccion={isInduccion}
      />
    </div>
  );
}
