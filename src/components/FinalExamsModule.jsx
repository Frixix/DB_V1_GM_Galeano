import { useState, useMemo, useEffect } from 'react';
import PortalNavbar from './PortalNavbar';
import FinalExamsSidebar from './FinalExamsSidebar';
import finalExamsService, { DEFAULT_DEADLINES } from '../services/finalExamsService';
import { getUserAvatar } from '../services/avatarService';
import { STUDENTS_BY_GRADE, TEACHER_CURRICULUM_ASSIGNMENTS, GRADES_LIST } from '../data/gradesTreeData';
import './FinalExamsModule.css';

// Helper para iconos temáticos de materias
const getSubjectIcon = (subj) => {
  if (!subj) return 'ph-book-bookmark';
  const s = subj.toLowerCase();
  if (s.includes('lengua') || s.includes('español')) return 'ph-book-open';
  if (s.includes('mate')) return 'ph-calculator';
  if (s.includes('natural') || s.includes('biolog') || s.includes('cienc')) return 'ph-leaf';
  if (s.includes('social') || s.includes('geograf') || s.includes('histor')) return 'ph-globe';
  if (s.includes('inglés') || s.includes('ingles')) return 'ph-translate';
  if (s.includes('art') || s.includes('dibujo')) return 'ph-palette';
  if (s.includes('física') || s.includes('fisica') || s.includes('deporte')) return 'ph-barbell';
  if (s.includes('ética') || s.includes('etica') || s.includes('valor')) return 'ph-heart';
  if (s.includes('tecno') || s.includes('inform') || s.includes('sistem')) return 'ph-laptop';
  if (s.includes('relig')) return 'ph-cross';
  return 'ph-graduation-cap';
};

export default function FinalExamsModule({
  currentUser,
  onBackToModules,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineMap = {},
  onlineCount = 0,
  circularesCount = 0,
  onOpenCirculares,
  isNotificationsOpen = false,
  onOpenTour,
  onLogout
}) {
  const isRectora = currentUser?.role === 'rectora' || currentUser?.role === 'induccion_rectora';
  const isAdmin = currentUser?.role === 'admin';
  const isCoordinador = currentUser?.role === 'coordinador';
  const isPrivileged = isRectora || isAdmin || isCoordinador;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(() => isPrivileged ? 'all' : (currentUser?.name || 'all'));
  const [curriculumTick, setCurriculumTick] = useState(0);

  const availablePeriods = useMemo(() => finalExamsService.getPeriods(), []);
  const availableGrades = useMemo(() => {
    return finalExamsService.getGradesForUser(currentUser);
  }, [currentUser, curriculumTick]);

  const [selectedPeriod, setSelectedPeriod] = useState(availablePeriods[0] || '1° Periodo (25%)');
  const [selectedGrade, setSelectedGrade] = useState('all'); // 'all' o grado específico
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'uploaded' | 'pending'
  const [search, setSearch] = useState('');
  const [currentView, setCurrentView] = useState('cards'); // 'cards' | 'table'

  useEffect(() => {
    if (!isPrivileged && currentUser?.name && selectedTeacher !== currentUser.name) {
      setSelectedTeacher(currentUser.name);
    }
  }, [isPrivileged, currentUser, selectedTeacher]);

  // Si la docente cambia o tiene un grado no asignado, restablecer a 'all'
  useEffect(() => {
    if (!isPrivileged && selectedGrade !== 'all' && !availableGrades.includes(selectedGrade)) {
      setSelectedGrade('all');
    }
  }, [isPrivileged, selectedGrade, availableGrades]);

  // Escuchar actualizaciones globales de evaluaciones y del roster escolar
  useEffect(() => {
    const handleUpdate = () => {
      setCurriculumTick((t) => t + 1);
    };
    window.addEventListener('gmg_evaluaciones_updated', handleUpdate);
    window.addEventListener('gmg_roster_updated', handleUpdate);
    return () => {
      window.removeEventListener('gmg_evaluaciones_updated', handleUpdate);
      window.removeEventListener('gmg_roster_updated', handleUpdate);
    };
  }, []);

  // Modales
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetSubject, setUploadTargetSubject] = useState(null);
  const [uploadTargetGrade, setUploadTargetGrade] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItemForView, setSelectedItemForView] = useState(null);
  const [isDeadlinesModalOpen, setIsDeadlinesModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Obtener datos consolidados de control de impresión según rol y asignación
  const printControlData = useMemo(() => {
    // Si NO es directivo (es docente titular), OBLIGATORIAMENTE se restringe a sus materias a cargo
    if (!isPrivileged && currentUser) {
      return finalExamsService.getPrintControlForUser(selectedPeriod, selectedGrade, currentUser);
    }

    if (selectedGrade === 'all') {
      if (selectedTeacher !== 'all') {
        return finalExamsService.getPrintControlForTeacher(selectedPeriod, selectedTeacher);
      }
      return finalExamsService.getPrintControlAll(selectedPeriod);
    }
    return finalExamsService.getPrintControlForGrade(selectedPeriod, selectedGrade);
  }, [selectedPeriod, selectedGrade, selectedTeacher, curriculumTick, isPrivileged, currentUser]);

  const { items = [], stats = {} } = printControlData;

  // Filtrado reactivo de materias
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filtro por docente seleccionado
      if (selectedTeacher !== 'all') {
        if (item.teacher !== selectedTeacher && item.uploadedBy !== selectedTeacher) {
          return false;
        }
      }

      // Filtro por grado si está seleccionado un curso específico
      if (selectedGrade !== 'all' && item.grade !== selectedGrade) {
        return false;
      }

      // Filtro por estado de subida
      if (statusFilter === 'uploaded' && !item.uploaded) return false;
      if (statusFilter === 'pending' && item.uploaded) return false;

      // Filtro por texto de búsqueda
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchSubj = item.subject.toLowerCase().includes(q);
        const matchTeacher = item.teacher.toLowerCase().includes(q);
        const matchGrade = item.grade ? item.grade.toLowerCase().includes(q) : false;
        const matchUploader = item.uploadedBy ? item.uploadedBy.toLowerCase().includes(q) : false;
        const matchFile = item.fileName ? item.fileName.toLowerCase().includes(q) : false;
        if (!matchSubj && !matchTeacher && !matchGrade && !matchUploader && !matchFile) return false;
      }

      return true;
    });
  }, [items, selectedTeacher, selectedGrade, statusFilter, search]);

  // Manejador para abrir modal de subida para una materia y grado específicos
  const handleOpenUpload = (subj = null, grade = null) => {
    setUploadTargetSubject(subj);
    setUploadTargetGrade(grade || (selectedGrade !== 'all' ? selectedGrade : availableGrades[0]));
    setIsUploadModalOpen(true);
  };

  // Manejador para ver detalle de la evaluación
  const handleViewItem = (item) => {
    setSelectedItemForView(item);
    setIsViewModalOpen(true);
  };

  // Manejador para descargar archivo de examen institucional
  const handleDownloadExam = (item) => {
    if (item.downloadUrl) {
      const a = document.createElement('a');
      a.href = item.downloadUrl;
      a.download = item.fileName || `Evaluacion_${item.subject}_${item.grade}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const content = `================================================================================
                    GIMNASIO MARTÍN GALEANO
               Sistema Institucional de Básica Primaria
        REPOSITORIO DE EVALUACIONES FINALES PARA IMPRESIÓN
================================================================================

Radicado Oficial:   ${item.id || 'EVAL-BORRADOR'}
Materia / Asignatura:${item.subject}
Grado Escolar:      ${item.grade}
Periodo Académico:  ${selectedPeriod}
Docente a Cargo:    ${item.teacher}
Copias Requeridas:  ${item.copiesNeeded} copias para ${item.grade} (${item.activeStudents || (item.copiesNeeded - 1)} alumnos activos + 1 copia docente calificador [Fórmula N+1])
Fecha de Carga:     ${item.uploadedAt || '2026-03-24 14:00'}
Subido Oficial Por: ${item.uploadedBy || item.teacher}
Estado Fotocopiado: ${item.copiesStatus?.toUpperCase() || 'APROBADO PARA IMPRESIÓN'}

--------------------------------------------------------------------------------
ESPECIFICACIÓN DE REPRODUCCIÓN (FÓRMULA N + 1):
${item.notes || `Sugerencia institucional automatizada: ${item.copiesNeeded} ejemplares (${item.activeStudents || (item.copiesNeeded - 1)} alumnos activos + 1 docente calificador).`}
--------------------------------------------------------------------------------

[CONTENIDO COMPLETO DE LA EVALUACIÓN ACUMULATIVA]
El presente instrumento de evaluación final ha sido revisado conforme al SIEE
institucional y remitido a Coordinación y Secretaría para fotocopiado y custodia.

Gimnasio Martín Galeano - Formando en Valores y Excelencia
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName ? item.fileName.replace('.pdf', '.txt') : `Evaluacion_${item.subject}_${item.grade}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`✓ Descargando evaluación de ${item.subject} (${item.grade})`);
  };

  // Manejador para eliminar evaluación
  const handleDeleteEvaluation = async (grade, subj) => {
    if (!window.confirm(`¿Está seguro de eliminar la evaluación de "${subj}" para el grado ${grade}?\nEsta acción permitirá subir un nuevo archivo de examen.`)) {
      return;
    }
    try {
      const ok = await finalExamsService.deleteEvaluation(selectedPeriod, grade, subj, currentUser);
      if (ok) {
        showToast(`Evaluación de ${subj} (${grade}) eliminada correctamente`);
        if (selectedItemForView?.subject === subj && selectedItemForView?.grade === grade) {
          setIsViewModalOpen(false);
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Manejador para actualizar el estado de fotocopiado
  const handleUpdateCopiesStatus = async (grade, subj, newStatus) => {
    try {
      await finalExamsService.updateCopiesStatus(selectedPeriod, grade, subj, newStatus, currentUser);
      showToast(`Estado de impresión actualizado a: ${newStatus === 'impreso' ? 'Fotocopiado' : 'Aprobado'}`);
      if (selectedItemForView?.subject === subj && selectedItemForView?.grade === grade) {
        setSelectedItemForView((prev) => prev ? { ...prev, copiesStatus: newStatus } : null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const deadlineInfo = stats?.deadlineInfo || DEFAULT_DEADLINES[selectedPeriod] || {};

  return (
    <div className="final-exams-module-wrapper" id="view-final-exams-module">
      {/* Navbar Superior Unificado con Identidad Institucional */}
      <PortalNavbar
        currentUser={currentUser}
        moduleTitle="Evaluaciones Finales"
        moduleSubtitle="Control de Entrega, Fechas Límite & Fotocopiado de Exámenes"
        onBackToModules={onBackToModules}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onlineCount={onlineCount}
        circularesCount={circularesCount}
        isNotificationsOpen={isNotificationsOpen}
        onOpenCirculares={onOpenCirculares}
        onOpenTour={onOpenTour}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      <div className="final-exams-body-layout">
        {/* Sidebar Izquierda: Ver por Docente, Grados Escolares, Periodo y Progreso */}
        <div className={`sidebar-container ${isSidebarOpen ? 'mobile-open' : ''}`}>
          <FinalExamsSidebar
            currentUser={currentUser}
            selectedGrade={selectedGrade}
            onSelectGrade={(g) => {
              setSelectedGrade(g);
              setIsSidebarOpen(false);
            }}
            selectedPeriod={selectedPeriod}
            onSelectPeriod={(p) => {
              setSelectedPeriod(p);
              setIsSidebarOpen(false);
            }}
            statusFilter={statusFilter}
            onSelectStatusFilter={(f) => setStatusFilter(f)}
            selectedTeacher={selectedTeacher}
            onSelectTeacher={(t) => {
              setSelectedTeacher(t);
              setIsSidebarOpen(false);
            }}
            availableGrades={availableGrades}
            availablePeriods={availablePeriods}
            stats={stats}
            onlineMap={onlineMap}
            onlineCount={onlineCount}
            onOpenConnectionsModal={onOpenConnectionsModal}
            onOpenProfile={onOpenProfile}
            onBackToModules={onBackToModules}
          />
        </div>

        {isSidebarOpen && (
          <div className="mobile-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* Área Central: Cabecera, Alertas de Plazo, Controles y Tarjetas de Exámenes */}
        <main className="final-exams-content-area">
          {/* Banner de Cabecera del Curso y Periodo Activo */}
          <section className="final-exams-banner-header">
            <div className="final-banner-left">
              <div className="final-banner-icon-box">
                <i className="ph-bold ph-printer"></i>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 className="final-banner-title">
                    Evaluaciones Finales • {!isPrivileged ? `Mis Asignaturas (${currentUser?.name})` : (selectedGrade === 'all' ? (selectedTeacher !== 'all' ? `Docente: ${selectedTeacher}` : 'Todos los Grados') : selectedGrade)}
                  </h2>
                  <span className="final-grade-badge">
                    {!isPrivileged ? `Mis Evaluaciones (${stats?.totalSubjects || 0} a cargo)` : (selectedTeacher !== 'all' ? `Filtro Docente: ${selectedTeacher}` : (selectedGrade === 'all' ? 'Vista Institucional Completa' : `${stats?.studentCount || 0} Estudiantes`))}
                  </span>
                </div>
                <p className="final-banner-desc">
                  Gestión y control de entrega de pruebas acumulativas para fotocopiado y reproducción institucional ({selectedPeriod}).
                </p>
              </div>
            </div>

            <div className="final-banner-actions">
              {isPrivileged && (
                <button
                  type="button"
                  className="final-btn-secondary"
                  onClick={() => setIsDeadlinesModalOpen(true)}
                  title="Configurar calendario de entrega y fechas límite por periodo"
                >
                  <i className="ph-bold ph-calendar-check"></i>
                  <span>Fechas Límite</span>
                </button>
              )}

              <button
                type="button"
                className="final-btn-primary"
                onClick={() => handleOpenUpload(null, null)}
                title="Subir evaluación final para impresión"
              >
                <i className="ph-bold ph-upload-simple"></i>
                <span>Subir Evaluación</span>
              </button>
            </div>
          </section>

          {/* Banner de Alerta de Fecha Límite de Entrega & Resumen de Fotocopiado */}
          <section className="final-deadline-summary-card">
            <div className="final-deadline-left">
              <div className="final-deadline-icon">
                <i className="ph-bold ph-clock-countdown"></i>
              </div>
              <div>
                <div className="final-deadline-header-row">
                  <span className="final-deadline-tag">PLAZO DE ENTREGA: {selectedPeriod.toUpperCase()}</span>
                  <span className={`final-deadline-status-pill ${deadlineInfo.status || 'en_plazo'}`}>
                    <i className="ph-bold ph-shield-check"></i>
                    {deadlineInfo.status === 'cerrado' ? 'Periodo Cerrado' : 'En Plazo de Recepción'}
                  </span>
                </div>
                <h4 className="final-deadline-heading">
                  Fecha Límite: {deadlineInfo.deadlineDate || '27 de Marzo 2026'} a las {deadlineInfo.deliveryTime || '17:00'}
                </h4>
                <p className="final-deadline-instructions">
                  {deadlineInfo.description || 'Todos los exámenes deben estar cargados antes de esta fecha para reproducción física en secretaría.'}
                </p>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="final-stats-chips-container">
              <div className="final-stat-chip">
                <span className="stat-chip-number">{stats?.uploadedCount || 0} / {stats?.totalSubjects || 0}</span>
                <span className="stat-chip-label">Materias Subidas</span>
              </div>
              <div className="final-stat-chip">
                <span className="stat-chip-number pending">{stats?.pendingCount || 0}</span>
                <span className="stat-chip-label">Pendientes</span>
              </div>
              <div className="final-stat-chip">
                <span className="stat-chip-number copies">{stats?.readyCopies || 0} / {stats?.totalCopiesNeeded || 0}</span>
                <span className="stat-chip-label">Copias Listas</span>
              </div>
              <div className="final-stat-chip">
                <span className="stat-chip-number percent">{stats?.progressPercent || 0}%</span>
                <span className="stat-chip-label">Avance</span>
              </div>
            </div>
          </section>

          {/* Barra de Controles y Filtros */}
          <section className="final-controls-bar">
            <div className="final-controls-left">
              {/* Búsqueda en vivo */}
              <div className="final-search-box">
                <i className="ph-bold ph-magnifying-glass final-search-icon"></i>
                <input
                  type="text"
                  className="final-search-input"
                  placeholder="Buscar por materia, docente, grado o archivo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Selector de Grado */}
              <div className="final-filter-unit">
                <label htmlFor="finalGradeSelect">
                  <i className="ph-bold ph-graduation-cap"></i> Grado:
                </label>
                <select
                  id="finalGradeSelect"
                  className="final-select-control"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  <option value="all">{isPrivileged ? 'Todos los grados' : 'Todos mis grados'}</option>
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Estado */}
              <div className="final-filter-unit">
                <label htmlFor="finalStatusSelect">
                  <i className="ph-bold ph-funnel"></i> Estado:
                </label>
                <select
                  id="finalStatusSelect"
                  className="final-select-control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todas ({items.length})</option>
                  <option value="uploaded">✓ Listas para impresión ({stats?.uploadedCount || 0})</option>
                  <option value="pending">⏳ Pendientes de subida ({stats?.pendingCount || 0})</option>
                </select>
              </div>
            </div>

            {/* Alternador de Vistas: Tarjetas vs Tabla */}
            <div className="final-view-toggle">
              <button
                type="button"
                className={`final-view-btn ${currentView === 'cards' ? 'active' : ''}`}
                onClick={() => setCurrentView('cards')}
                title="Vista en Cuadrícula de Tarjetas"
              >
                <i className="ph-bold ph-squares-four"></i>
              </button>
              <button
                type="button"
                className={`final-view-btn ${currentView === 'table' ? 'active' : ''}`}
                onClick={() => setCurrentView('table')}
                title="Vista en Tabla Institucional"
              >
                <i className="ph-bold ph-table"></i>
              </button>
            </div>
          </section>

          {/* Cuadrícula o Tabla de Evaluaciones por Materia */}
          <section className="final-exams-container">
            {filteredItems.length > 0 ? (
              currentView === 'cards' ? (
                <div className="final-exams-grid">
                  {filteredItems.map((item) => {
                    const avatarUrl = getUserAvatar(item.teacherId);
                    const canUpload = finalExamsService.canUploadForSubject(currentUser, item.grade, item.subject);
                    const isOwnTeacher = currentUser && (
                      item.teacherId === currentUser.key ||
                      item.teacher === currentUser.name
                    );

                    return (
                      <article
                        key={`${item.grade}_${item.subject}`}
                        className={`final-subject-card ${item.uploaded ? 'is-uploaded' : 'is-pending'}`}
                      >
                        {/* Cabecera de la Materia con Distintivo de Grado */}
                        <div className="subject-card-header">
                          <div className="subject-icon-box">
                            <i className={`ph-bold ${getSubjectIcon(item.subject)}`}></i>
                          </div>
                          <div className="subject-title-box">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span className="card-grade-chip">{item.grade}</span>
                              <span className="subject-period-tag">{selectedPeriod.split(' ')[0]}</span>
                            </div>
                            <h3 className="subject-title">{item.subject}</h3>
                          </div>
                          {item.uploaded ? (
                            <span className="subject-status-pill uploaded" title="Evaluación cargada y lista para fotocopiado">
                              <i className="ph-bold ph-check-circle"></i>
                              <span>Lista</span>
                            </span>
                          ) : (
                            <span className="subject-status-pill pending" title="Examen pendiente por subir">
                              <i className="ph-bold ph-clock"></i>
                              <span>Pendiente</span>
                            </span>
                          )}
                        </div>

                        {/* Docente Responsable Asignado Oficialmente */}
                        <div className="subject-teacher-row">
                          <div className="teacher-avatar-box">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={item.teacher}
                                className="teacher-avatar-img"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const f = e.currentTarget.nextSibling;
                                  if (f) f.style.display = 'inline-block';
                                }}
                              />
                            ) : null}
                            <i
                              className="ph-bold ph-user"
                              style={{ display: avatarUrl ? 'none' : 'inline-block' }}
                            ></i>
                          </div>
                          <div className="teacher-details">
                            <span className="teacher-label">Docente a Cargo:</span>
                            <strong className="teacher-name">{item.teacher}</strong>
                          </div>
                          {isOwnTeacher && (
                            <span className="own-teacher-badge" title="Tú estás a cargo de esta materia">
                              Tu Asignatura
                            </span>
                          )}
                        </div>

                        {/* Contenido / Estado del Archivo */}
                        <div className="subject-card-body">
                          {item.uploaded ? (
                            <div className="uploaded-file-info">
                              <div className="file-meta-row">
                                <i className="ph-bold ph-file-pdf file-icon"></i>
                                <div className="file-texts">
                                  <span className="file-name" title={item.fileName}>
                                    {item.fileName}
                                  </span>
                                  <span className="file-subtext">
                                    {item.fileSize} • Subido por: <strong>{item.uploadedBy}</strong> el {item.uploadedAt}
                                  </span>
                                </div>
                              </div>

                              <div className="copies-status-box">
                                <div className="copies-metric">
                                  <i className="ph-bold ph-copy"></i>
                                  <span><strong>{item.copiesNeeded}</strong> copias (N+1: {item.activeStudents || (item.copiesNeeded - 1)} + 1)</span>
                                </div>
                                <span className={`print-badge ${item.copiesStatus}`}>
                                  <i className={`ph-bold ${item.copiesStatus === 'impreso' ? 'ph-printer-check' : 'ph-stamp'}`}></i>
                                  {item.copiesStatus === 'impreso' ? 'Fotocopiado / Impreso' : 'Aprobado para Impresión'}
                                </span>
                              </div>

                              {item.notes && (
                                <p className="print-notes-preview">
                                  <i className="ph-bold ph-info"></i>
                                  <span>{item.notes}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="pending-file-notice">
                              <div className="pending-alert-icon">
                                <i className="ph-bold ph-warning-circle"></i>
                              </div>
                              <div>
                                <p className="pending-text">
                                  Pendiente por <strong>{item.teacher}</strong>
                                </p>
                                <span className="pending-hint">
                                  Sugerencia N+1: <strong>{item.copiesNeeded || (item.studentCount + 1)}</strong> copias ({item.activeStudents || item.studentCount} alumnos + 1 docente)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Pie de Acciones */}
                        <div className="subject-card-footer">
                          {item.uploaded ? (
                            <>
                              <button
                                type="button"
                                className="btn-card-action btn-view-download"
                                onClick={() => handleDownloadExam(item)}
                                title="Descargar examen en PDF / formato de impresión"
                              >
                                <i className="ph-bold ph-download-simple"></i>
                                <span>Descargar</span>
                              </button>

                              <button
                                type="button"
                                className="btn-card-action btn-view-details"
                                onClick={() => handleViewItem(item)}
                                title="Ver detalles e instrucciones de fotocopiado"
                              >
                                <i className="ph-bold ph-eye"></i>
                                <span>Detalles</span>
                              </button>

                              {canUpload && (
                                <button
                                  type="button"
                                  className="btn-card-action btn-update"
                                  onClick={() => handleOpenUpload(item.subject, item.grade)}
                                  title="Actualizar o sustituir el archivo de evaluación"
                                >
                                  <i className="ph-bold ph-arrow-clockwise"></i>
                                  <span>Actualizar</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              {canUpload ? (
                                <button
                                  type="button"
                                  className="btn-card-action btn-upload-now"
                                  onClick={() => handleOpenUpload(item.subject, item.grade)}
                                  title="Cargar examen para reproducción"
                                >
                                  <i className="ph-bold ph-upload-simple"></i>
                                  <span>Subir Evaluación Ahora</span>
                                </button>
                              ) : (
                                <span className="card-pending-badge-text">
                                  <i className="ph-bold ph-hourglass-high"></i>
                                  Pendiente ({item.grade})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* Vista en Tabla Institucional con Columna de Grado */
                <div className="final-table-wrapper">
                  <table className="final-data-table">
                    <thead>
                      <tr>
                        <th>Grado</th>
                        <th>Materia / Asignatura</th>
                        <th>Docente a Cargo</th>
                        <th>Estado de Subida</th>
                        <th>Copias</th>
                        <th>Archivo Adjunto</th>
                        <th>Estado Impresión</th>
                        <th style={{ textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => {
                        const avatarUrl = getUserAvatar(item.teacherId);
                        const canUpload = finalExamsService.canUploadForSubject(currentUser, item.grade, item.subject);

                        return (
                          <tr key={`${item.grade}_${item.subject}`}>
                            <td>
                              <span className="card-grade-chip">{item.grade}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className={`ph-bold ${getSubjectIcon(item.subject)}`} style={{ color: '#6366f1', fontSize: '1.1rem' }}></i>
                                <strong>{item.subject}</strong>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div className="table-teacher-avatar">
                                  {avatarUrl ? (
                                    <img src={avatarUrl} alt={item.teacher} className="table-avatar-img" />
                                  ) : (
                                    <i className="ph-bold ph-user"></i>
                                  )}
                                </div>
                                <span>{item.teacher}</span>
                              </div>
                            </td>
                            <td>
                              {item.uploaded ? (
                                <span className="table-badge uploaded">
                                  <i className="ph-bold ph-check"></i> Subido
                                </span>
                              ) : (
                                <span className="table-badge pending">
                                  <i className="ph-bold ph-clock"></i> Pendiente
                                </span>
                              )}
                            </td>
                            <td>
                              <strong>{item.copiesNeeded}</strong> copias
                              <small style={{ display: 'block', color: '#64748b', fontSize: '0.72rem' }}>
                                (N+1: {item.activeStudents || (item.copiesNeeded - 1)} + 1)
                              </small>
                            </td>
                            <td>
                              {item.uploaded ? (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span className="table-file-name" title={item.fileName}>
                                    {item.fileName}
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                    Subido por: {item.uploadedBy}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin archivo</span>
                              )}
                            </td>
                            <td>
                              {item.uploaded ? (
                                <span className={`table-print-status ${item.copiesStatus}`}>
                                  {item.copiesStatus === 'impreso' ? 'Fotocopiado' : 'Aprobado'}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>-</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                {item.uploaded ? (
                                  <>
                                    <button
                                      type="button"
                                      className="table-action-btn"
                                      onClick={() => handleDownloadExam(item)}
                                      title="Descargar examen"
                                    >
                                      <i className="ph-bold ph-download-simple"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="table-action-btn"
                                      onClick={() => handleViewItem(item)}
                                      title="Ver detalle"
                                    >
                                      <i className="ph-bold ph-eye"></i>
                                    </button>
                                    {canUpload && (
                                      <button
                                        type="button"
                                        className="table-action-btn"
                                        onClick={() => handleOpenUpload(item.subject, item.grade)}
                                        title="Actualizar archivo"
                                      >
                                        <i className="ph-bold ph-arrow-clockwise"></i>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  canUpload && (
                                    <button
                                      type="button"
                                      className="table-action-btn upload"
                                      onClick={() => handleOpenUpload(item.subject, item.grade)}
                                      title="Subir evaluación"
                                    >
                                      <i className="ph-bold ph-upload-simple"></i>
                                      <span>Subir</span>
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="final-empty-state">
                <i className="ph-bold ph-tray"></i>
                <h4>No se encontraron materias con los filtros aplicados</h4>
                <p>Prueba ajustando el término de búsqueda o seleccionando otro filtro de estado en la barra superior.</p>
                <button
                  type="button"
                  className="final-btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setSelectedTeacher('all');
                    setSelectedGrade('all');
                  }}
                >
                  Restablecer Filtros
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Botón Flotante para Subir Evaluación (Inferior Derecha) */}
      <button
        type="button"
        className="btn-floating-upload final-floating-save-btn"
        onClick={() => handleOpenUpload(null, null)}
        title="Subir evaluación para impresión"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
          boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)'
        }}
      >
        <i className="ph-bold ph-upload-simple"></i>
        <span>Subir Evaluación</span>
      </button>

      {/* Toast de Notificaciones */}
      {toastMessage && (
        <div className="final-toast-alert" role="alert">
          <i className="ph-bold ph-check-circle"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal 1: Subir Evaluación para Impresión */}
      <UploadExamModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadTargetSubject(null);
          setUploadTargetGrade(null);
        }}
        currentUser={currentUser}
        initialGrade={uploadTargetGrade || (selectedGrade !== 'all' ? selectedGrade : availableGrades[0])}
        initialPeriod={selectedPeriod}
        initialSubject={uploadTargetSubject}
        onUploadSuccess={(msg) => {
          setIsUploadModalOpen(false);
          setUploadTargetSubject(null);
          setUploadTargetGrade(null);
          showToast(msg);
        }}
      />

      {/* Modal 2: Detalle y Gestión de Fotocopiado de la Evaluación */}
      <ViewExamModal
        isOpen={isViewModalOpen}
        item={selectedItemForView}
        selectedPeriod={selectedPeriod}
        currentUser={currentUser}
        isPrivileged={isPrivileged}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedItemForView(null);
        }}
        onDownload={handleDownloadExam}
        onDelete={(grade, subj) => handleDeleteEvaluation(grade, subj)}
        onUpdateCopiesStatus={(grade, subj, st) => handleUpdateCopiesStatus(grade, subj, st)}
        onReplace={(grade, subj) => {
          setIsViewModalOpen(false);
          handleOpenUpload(subj, grade);
        }}
      />

      {/* Modal 3: Configuración de Fechas Límite por Periodo */}
      {isPrivileged && (
        <DeadlinesModal
          isOpen={isDeadlinesModalOpen}
          currentUser={currentUser}
          onClose={() => setIsDeadlinesModalOpen(false)}
          onSaved={(msg) => {
            setIsDeadlinesModalOpen(false);
            showToast(msg);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTE: MODAL PARA SUBIR EVALUACIÓN
// =============================================================================
function UploadExamModal({
  isOpen,
  onClose,
  currentUser,
  initialGrade,
  initialPeriod,
  initialSubject,
  onUploadSuccess
}) {
  const availableGrades = useMemo(() => finalExamsService.getGradesForUser(currentUser), [currentUser]);
  const defaultGrade = initialGrade && initialGrade !== 'all' ? initialGrade : (availableGrades[0] || '1° Primaria');

  const [period, setPeriod] = useState(initialPeriod || '1° Periodo (25%)');
  const [grade, setGrade] = useState(defaultGrade);

  const availableSubjects = useMemo(() => {
    return finalExamsService.getSubjectsForGradeAndUser(grade, currentUser);
  }, [grade, currentUser]);

  const [subject, setSubject] = useState(initialSubject || availableSubjects[0] || 'Lengua Castellana');
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Al cambiar grado en el modal, reajustar automáticamente la materia disponible
  const handleGradeChange = (newGrade) => {
    setGrade(newGrade);
    const newSubjects = finalExamsService.getSubjectsForGradeAndUser(newGrade, currentUser);
    if (newSubjects.length > 0 && !newSubjects.includes(subject)) {
      setSubject(newSubjects[0]);
    }
  };

  useEffect(() => {
    if (initialSubject && availableSubjects.includes(initialSubject)) {
      setSubject(initialSubject);
    } else if (availableSubjects.length > 0 && !availableSubjects.includes(subject)) {
      setSubject(availableSubjects[0]);
    }
  }, [initialSubject, availableSubjects]);

  useEffect(() => {
    if (initialGrade && initialGrade !== 'all') setGrade(initialGrade);
    if (initialPeriod) setPeriod(initialPeriod);
  }, [initialGrade, initialPeriod]);

  if (!isOpen) return null;

  const assignment = finalExamsService.getTeacherAssignment(grade, subject);
  const printInfo = finalExamsService.getPrintingCopiesSuggestion(grade);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await finalExamsService.uploadEvaluation({
        period,
        grade,
        subject,
        file,
        notes: notes.trim() ? notes : `Sugerencia institucional (N + 1): ${printInfo.suggestedCopies} ejemplares (${printInfo.activeStudents} alumnos activos + 1 copia docente).`,
        copiesStatus: 'aprobado',
        user: currentUser
      });

      onUploadSuccess(`✓ Evaluación de ${subject} (${grade}) guardada para ${assignment.teacherName} (${printInfo.suggestedCopies} copias - Fórmula N+1).`);
    } catch (err) {
      alert(`Error al guardar la evaluación: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="final-modal-overlay" onClick={onClose}>
      <div className="final-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="final-modal-header">
          <div className="final-modal-title-row">
            <div className="final-modal-icon-badge">
              <i className="ph-bold ph-upload-simple"></i>
            </div>
            <div>
              <h3>Subir Evaluación para Impresión</h3>
              <p>Carga de archivo oficial y especificaciones para fotocopiado escolar</p>
            </div>
          </div>
          <button type="button" className="final-modal-close-btn" onClick={onClose}>
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="final-modal-body">
          <div className="final-form-grid">
            <div className="final-form-group">
              <label>Periodo Académico:</label>
              <select
                className="final-form-input"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {finalExamsService.getPeriods().map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="final-form-group">
              <label>Grado Escolar:</label>
              <select
                className="final-form-input"
                value={grade}
                onChange={(e) => handleGradeChange(e.target.value)}
              >
                {availableGrades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="final-form-group" style={{ marginTop: '0.85rem' }}>
            <label>Materia / Asignatura:</label>
            <select
              className="final-form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Tarjeta de Docente Asignado Oficialmente & Copias */}
          <div className="final-modal-assignment-preview">
            <div className="assignment-teacher-info">
              <i className="ph-bold ph-user-check"></i>
              <div>
                <span className="info-lbl">Docente Oficial a Cargo:</span>
                <strong className="info-val">{assignment.teacherName}</strong>
              </div>
            </div>

            <div className="assignment-copies-info">
              <i className="ph-bold ph-copy"></i>
              <div>
                <span className="info-lbl">Sugerencia de Impresión (N + 1):</span>
                <strong className="info-val">{printInfo.suggestedCopies} Copias ({grade})</strong>
                <small style={{ display: 'block', color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>
                  {printInfo.activeStudents} alumnos activos + 1 docente calificador
                </small>
              </div>
            </div>
          </div>

          {/* Selector de Archivo */}
          <div className="final-form-group" style={{ marginTop: '1rem' }}>
            <label>Archivo del Examen (PDF / Word):</label>
            <div className="final-file-dropzone">
              <input
                type="file"
                id="examFileInput"
                accept=".pdf,.doc,.docx,.xlsx"
                className="final-file-hidden-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="examFileInput" className="final-dropzone-label">
                <i className="ph-bold ph-cloud-arrow-up dropzone-icon"></i>
                {file ? (
                  <div className="selected-file-details">
                    <strong className="selected-filename">{file.name}</strong>
                    <span className="selected-filesize">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    <span className="dropzone-change-hint">Clic para cambiar de archivo</span>
                  </div>
                ) : (
                  <div>
                    <strong className="dropzone-prompt">Haz clic para seleccionar o arrastra el archivo aquí</strong>
                    <span className="dropzone-hint">Formatos soportados: PDF, Word (.docx) • Máx 15MB</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Indicaciones para Impresión */}
          <div className="final-form-group" style={{ marginTop: '1rem' }}>
            <label>Indicaciones para Fotocopiado & Reproducción:</label>
            <textarea
              className="final-form-textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones pedagógicas adicionales para el fotocopiado (el tiraje N+1 se calcula de forma automática)..."
            />
          </div>

          <div className="final-modal-footer">
            <button type="button" className="final-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="final-btn-primary" disabled={isSubmitting}>
              <i className="ph-bold ph-floppy-disk"></i>
              <span>{isSubmitting ? 'Guardando...' : 'Guardar y Enviar a Impresión'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTE: MODAL PARA VER DETALLES DE EVALUACIÓN
// =============================================================================
function ViewExamModal({
  isOpen,
  item,
  selectedPeriod,
  currentUser,
  isPrivileged,
  onClose,
  onDownload,
  onDelete,
  onUpdateCopiesStatus,
  onReplace
}) {
  if (!isOpen || !item) return null;

  const canUpload = finalExamsService.canUploadForSubject(currentUser, item.grade, item.subject);

  return (
    <div className="final-modal-overlay" onClick={onClose}>
      <div className="final-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="final-modal-header">
          <div className="final-modal-title-row">
            <div className="final-modal-icon-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>
              <i className="ph-bold ph-file-text"></i>
            </div>
            <div>
              <h3>{item.subject} • {item.grade}</h3>
              <p>Control de Fotocopiado & Especificaciones del Examen</p>
            </div>
          </div>
          <button type="button" className="final-modal-close-btn" onClick={onClose}>
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        <div className="final-modal-body">
          {/* Ficha de Información Principal */}
          <div className="final-detail-card-info">
            <div className="detail-row">
              <span className="detail-lbl">Radicado:</span>
              <strong className="detail-val">{item.id || 'EVAL-2026'}</strong>
            </div>
            <div className="detail-row">
              <span className="detail-lbl">Grado Escolar:</span>
              <strong className="detail-val">{item.grade}</strong>
            </div>
            <div className="detail-row">
              <span className="detail-lbl">Periodo:</span>
              <strong className="detail-val">{selectedPeriod}</strong>
            </div>
            <div className="detail-row">
              <span className="detail-lbl">Docente a Cargo:</span>
              <strong className="detail-val">{item.teacher}</strong>
            </div>
            <div className="detail-row">
              <span className="detail-lbl">Subido Por:</span>
              <strong className="detail-val">{item.uploadedBy || item.teacher}</strong>
            </div>
            <div className="detail-row">
              <span className="detail-lbl">Fecha de Carga:</span>
              <strong className="detail-val">{item.uploadedAt || '2026-03-24'}</strong>
            </div>
            <div className="detail-row">
              <span className="detail-lbl">Archivo:</span>
              <strong className="detail-val">{item.fileName || 'Evaluacion.pdf'} ({item.fileSize || '1.2 MB'})</strong>
            </div>
            <div className="detail-row">
              <span className="detail-lbl">Sugerencia de Impresión:</span>
              <strong className="detail-val" style={{ color: '#4338ca' }}>
                {item.copiesNeeded} Copias ({item.activeStudents || (item.copiesNeeded - 1)} alumnos activos + 1 docente • Fórmula N+1)
              </strong>
            </div>
          </div>

          {/* Control de Estado de Impresión para Rectora / Admin / Coordinación */}
          {isPrivileged && (
            <div className="final-print-status-control" style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Actualizar Estado en Fotocopiadora / Secretaría:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn-status-choice ${item.copiesStatus === 'aprobado' ? 'active aprobado' : ''}`}
                  onClick={() => onUpdateCopiesStatus(item.grade, item.subject, 'aprobado')}
                >
                  <i className="ph-bold ph-stamp"></i> Aprobado para Copias
                </button>
                <button
                  type="button"
                  className={`btn-status-choice ${item.copiesStatus === 'impreso' ? 'active impreso' : ''}`}
                  onClick={() => onUpdateCopiesStatus(item.grade, item.subject, 'impreso')}
                >
                  <i className="ph-bold ph-printer-check"></i> Impreso / Listo en Mesa
                </button>
              </div>
            </div>
          )}

          {/* Notas para Fotocopiado */}
          <div className="final-detail-notes-box" style={{ marginTop: '1rem' }}>
            <span className="notes-lbl">Instrucciones para Fotocopiado:</span>
            <p className="notes-text">{item.notes || 'Sin especificaciones adicionales de reproducción.'}</p>
          </div>

          <div className="final-modal-footer" style={{ marginTop: '1.25rem' }}>
            {canUpload && (
              <button
                type="button"
                className="final-btn-danger"
                onClick={() => onDelete(item.grade, item.subject)}
                title="Eliminar este archivo de evaluación"
              >
                <i className="ph-bold ph-trash"></i>
                <span>Eliminar</span>
              </button>
            )}

            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              {canUpload && (
                <button
                  type="button"
                  className="final-btn-secondary"
                  onClick={() => onReplace(item.grade, item.subject)}
                >
                  <i className="ph-bold ph-arrow-clockwise"></i>
                  <span>Sustituir Archivo</span>
                </button>
              )}

              <button
                type="button"
                className="final-btn-primary"
                onClick={() => onDownload(item)}
              >
                <i className="ph-bold ph-download-simple"></i>
                <span>Descargar Examen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTE: MODAL DE GESTIÓN DE FECHAS LÍMITE (COORDINACIÓN / ADMIN)
// =============================================================================
function DeadlinesModal({ isOpen, currentUser, onClose, onSaved }) {
  const [deadlines, setDeadlines] = useState(() => finalExamsService.getDeadlines());
  const [activePeriod, setActivePeriod] = useState('1° Periodo (25%)');

  const currentPeriodData = deadlines[activePeriod] || DEFAULT_DEADLINES[activePeriod] || {};

  const [date, setDate] = useState(currentPeriodData.deadlineDate || '2026-03-27');
  const [time, setTime] = useState(currentPeriodData.deliveryTime || '17:00');
  const [status, setStatus] = useState(currentPeriodData.status || 'en_plazo');
  const [description, setDescription] = useState(currentPeriodData.description || '');

  useEffect(() => {
    const data = deadlines[activePeriod] || DEFAULT_DEADLINES[activePeriod] || {};
    setDate(data.deadlineDate || '2026-03-27');
    setTime(data.deliveryTime || '17:00');
    setStatus(data.status || 'en_plazo');
    setDescription(data.description || '');
  }, [activePeriod, deadlines]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await finalExamsService.updateDeadline(
        activePeriod,
        {
          deadlineDate: date,
          deliveryTime: time,
          status,
          description
        },
        currentUser
      );
      setDeadlines(finalExamsService.getDeadlines());
      onSaved(`✓ Fechas límite de ${activePeriod} actualizadas correctamente.`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="final-modal-overlay" onClick={onClose}>
      <div className="final-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="final-modal-header">
          <div className="final-modal-title-row">
            <div className="final-modal-icon-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
              <i className="ph-bold ph-calendar-check"></i>
            </div>
            <div>
              <h3>Gestión de Fechas Límite de Evaluaciones</h3>
              <p>Control de plazos de entrega para fotocopiado y reproducción por periodo</p>
            </div>
          </div>
          <button type="button" className="final-modal-close-btn" onClick={onClose}>
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        <form onSubmit={handleSave} className="final-modal-body">
          {/* Pestañas de Periodos */}
          <div className="deadlines-period-tabs">
            {finalExamsService.getPeriods().map((p) => (
              <button
                key={p}
                type="button"
                className={`deadline-tab-btn ${activePeriod === p ? 'active' : ''}`}
                onClick={() => setActivePeriod(p)}
              >
                {p.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="final-form-grid" style={{ marginTop: '1rem' }}>
            <div className="final-form-group">
              <label>Fecha Límite de Recepción:</label>
              <input
                type="date"
                className="final-form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="final-form-group">
              <label>Hora Límite:</label>
              <input
                type="time"
                className="final-form-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="final-form-group" style={{ marginTop: '0.85rem' }}>
            <label>Estado del Plazo:</label>
            <select
              className="final-form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="en_plazo">En Plazo de Recepción</option>
              <option value="programado">Programado / Futuro</option>
              <option value="cerrado">Plazo Cerrado</option>
            </select>
          </div>

          <div className="final-form-group" style={{ marginTop: '0.85rem' }}>
            <label>Instrucciones & Observaciones para el Cuerpo Docente:</label>
            <textarea
              className="final-form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instrucciones sobre entrega a tiempo para impresión..."
            />
          </div>

          <div className="final-modal-footer">
            <button type="button" className="final-btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="submit" className="final-btn-primary">
              <i className="ph-bold ph-floppy-disk"></i>
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
