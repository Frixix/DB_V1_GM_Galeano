import { useState, useEffect, useMemo } from 'react';
import './GradesModule.css';
import gradesService from '../services/gradesService';

// Clases pastel para los avatares circulares de estudiantes
const PASTEL_AVATAR_CLASSES = [
  'avatar-pastel-mint',
  'avatar-pastel-sky',
  'avatar-pastel-lavender',
  'avatar-pastel-amber',
  'avatar-pastel-rose',
  'avatar-pastel-teal'
];

export default function GradesModule({ 
  currentUser, 
  onBackToModules, 
  onLogout,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineCount
}) {
  // Identificación del Rol RBAC
  const userKey = currentUser?.key || currentUser?.role || 'jessica';
  const isDocente = currentUser?.role === 'docente' || currentUser?.role === 'induccion';
  const isRectora = currentUser?.role === 'rectora' || currentUser?.role === 'induccion_rectora';
  const isAdmin = currentUser?.role === 'admin';
  const isPrivileged = isRectora || isAdmin;

  // Sincronización en tiempo real de novedades y reemplazos
  const [curriculumTick, setCurriculumTick] = useState(0);

  useEffect(() => {
    const handleCurriculumUpdate = () => {
      setCurriculumTick(t => t + 1);
    };
    window.addEventListener('gmg_curriculum_updated', handleCurriculumUpdate);
    return () => window.removeEventListener('gmg_curriculum_updated', handleCurriculumUpdate);
  }, []);

  // 1. Niveles de la Jerarquía de Datos
  const availableYears = useMemo(() => gradesService.getAcademicYears(), []);
  const availablePeriods = useMemo(() => gradesService.getAcademicPeriods(), []);
  
  // Grados disponibles filtrados por rol, asignación curricular y dirección de curso
  const availableGrades = useMemo(() => {
    return gradesService.getGradesForUser(currentUser);
  }, [currentUser, curriculumTick]);

  // Estados de navegación en el árbol relacional
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedPeriod, setSelectedPeriod] = useState(availablePeriods[0] || '1° Periodo (25%)');
  const [selectedGrade, setSelectedGrade] = useState(availableGrades[0] || '1° Primaria');

  // Materias disponibles para el grado seleccionado:
  const availableSubjects = useMemo(() => {
    return gradesService.getSubjectsForGradeAndUser(selectedGrade, currentUser);
  }, [selectedGrade, currentUser, curriculumTick]);

  const [selectedSubject, setSelectedSubject] = useState(availableSubjects[0] || 'Lengua Castellana');
  const [searchFilter, setSearchFilter] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Asegurar consistencia del árbol cuando cambia el usuario o el grado
  useEffect(() => {
    if (!availableGrades.includes(selectedGrade)) {
      setSelectedGrade(availableGrades[0] || '1° Primaria');
    }
  }, [availableGrades, selectedGrade]);

  useEffect(() => {
    if (!availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0] || 'Lengua Castellana');
    }
  }, [availableSubjects, selectedSubject]);

  // Carga de la rama actual del árbol: Año -> Periodo -> Grado -> Materia
  const branchData = useMemo(() => {
    return gradesService.getBranch(selectedYear, selectedPeriod, selectedGrade, selectedSubject);
  }, [selectedYear, selectedPeriod, selectedGrade, selectedSubject, curriculumTick]);

  const [students, setStudents] = useState(branchData.students || []);

  // Sincronizar roster al cambiar de rama en el árbol o al registrarse un reemplazo
  useEffect(() => {
    const freshBranch = gradesService.getBranch(selectedYear, selectedPeriod, selectedGrade, selectedSubject);
    setStudents(freshBranch.students || []);
  }, [selectedYear, selectedPeriod, selectedGrade, selectedSubject, curriculumTick]);

  // Información del Director de Curso Oficial del Grado
  const gradeDirector = useMemo(() => {
    return gradesService.getGradeDirector(selectedGrade);
  }, [selectedGrade, curriculumTick]);

  // Información del Docente Titular de la Materia
  const teacherInfo = useMemo(() => {
    return gradesService.getTeacherAssignment(selectedGrade, selectedSubject);
  }, [selectedGrade, selectedSubject, curriculumTick]);

  // ¿El usuario actual está actuando como Director de Curso supervisando la materia de otra docente?
  const isViewingAsGradeDirector = useMemo(() => {
    return gradesService.isViewingAsGradeDirector(currentUser, selectedGrade, selectedSubject);
  }, [currentUser, selectedGrade, selectedSubject, curriculumTick]);

  // Permisos granulares de edición en la rama activa
  const canEditScores = useMemo(() => {
    return gradesService.canEditScores(currentUser, selectedGrade, selectedSubject);
  }, [currentUser, selectedGrade, selectedSubject, curriculumTick]);

  const canEditFeedback = useMemo(() => {
    return gradesService.canEditTeacherFeedback(currentUser, selectedGrade, selectedSubject);
  }, [currentUser, selectedGrade, selectedSubject, curriculumTick]);

  const canEditDirective = useMemo(() => {
    return gradesService.canEditDirectiveSuggestion(currentUser);
  }, [currentUser]);

  // Manejo de cambio en notas numéricas (Exclusivo Docente Titular de la materia)
  const handleScoreChange = (id, field, value) => {
    if (!canEditScores) return;

    let num = parseFloat(value);
    if (isNaN(num)) num = '';
    else if (num > 5.0) num = 5.0;
    else if (num < 0) num = 0;

    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, [field]: num };
      }
      return student;
    }));
  };

  // Manejo de observaciones pedagógicas (Docente Titular de la materia)
  const handleTeacherFeedbackChange = (id, value) => {
    if (!canEditFeedback) return;
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, retroalimentacionDocente: value };
      }
      return student;
    }));
  };

  // Manejo de sugerencias directivas de auditoría (Exclusivo Rectora)
  const handleDirectiveSuggestionChange = (id, value) => {
    if (!canEditDirective) return;
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, sugerenciaDirectiva: value };
      }
      return student;
    }));
  };

  // Cálculo de definitiva ponderada
  const calculateDefinitive = (c1, c2, c3) => {
    const val1 = Number(c1) || 0;
    const val2 = Number(c2) || 0;
    const val3 = Number(c3) || 0;
    const def = (val1 * 0.4) + (val2 * 0.4) + (val3 * 0.2);
    return def.toFixed(1);
  };

  // Escala valorativa nacional institucional (SIEE)
  const getDesempeno = (score) => {
    const s = Number(score);
    if (s >= 4.6) return { label: 'Superior', className: 'tag-pastel-superior', icon: 'ph-trophy' };
    if (s >= 4.0) return { label: 'Alto', className: 'tag-pastel-alto', icon: 'ph-check-circle' };
    if (s >= 3.0) return { label: 'Básico', className: 'tag-pastel-basico', icon: 'ph-minus-circle' };
    return { label: 'Bajo', className: 'tag-pastel-bajo', icon: 'ph-warning-circle' };
  };

  const getDefinitiveBadgeClass = (score) => {
    const s = Number(score);
    if (s >= 4.6) return 'def-pill-superior';
    if (s >= 4.0) return 'def-pill-alto';
    if (s >= 3.0) return 'def-pill-basico';
    return 'def-pill-bajo';
  };

  // Métricas estadísticas del grupo actual
  const averagesList = students.map(s => Number(calculateDefinitive(s.c1, s.c2, s.c3)));
  const classAverage = averagesList.length 
    ? (averagesList.reduce((acc, curr) => acc + curr, 0) / averagesList.length).toFixed(2)
    : '0.00';
  const passingCount = averagesList.filter(avg => avg >= 3.0).length;
  const passRate = students.length 
    ? Math.round((passingCount / students.length) * 100)
    : 0;

  // Filtrado de estudiantes por nombre o código en la búsqueda
  const filteredStudents = useMemo(() => {
    if (!searchFilter.trim()) return students;
    const term = searchFilter.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(term) || s.id.toLowerCase().includes(term)
    );
  }, [students, searchFilter]);

  // Guardado en la persistencia del árbol
  const handleSaveAction = () => {
    if (isViewingAsGradeDirector) {
      setToastMessage(`Modo Director de Curso: Supervisión integral de ${selectedSubject}. Calificaciones registradas por ${teacherInfo.teacherName}.`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    gradesService.saveBranchStudents(selectedYear, selectedPeriod, selectedGrade, selectedSubject, students, currentUser);

    if (canEditScores) {
      setToastMessage(`¡Planilla guardada! Notas y retroalimentación de ${selectedSubject} registradas por ${currentUser?.name || 'la docente'}.`);
    } else if (canEditDirective) {
      setToastMessage(`¡Sugerencias registradas! Auditoría directiva de Rectoría guardada exitosamente.`);
    } else {
      setToastMessage(`¡Registro de auditoría técnica guardado exitosamente!`);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="grades-module-container">
      {/* Navbar Superior Unificado */}
      <header className="grades-navbar">
        <div className="grades-navbar-left">
          <button 
            type="button" 
            className="btn-back-to-modules" 
            onClick={onBackToModules}
            title="Volver al Portal Principal de Módulos"
          >
            <i className="ph-bold ph-arrow-left"></i>
            <span>Volver a Módulos</span>
          </button>

          <div className="grades-brand-box">
            <div className="portal-shield-badge" title="Gimnasio Martin Galeano">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 6V12C3 17.5 6.8 22.3 12 23.5C17.2 22.3 21 17.5 21 12V6L12 2Z" fill="#15803d" />
                <path d="M12 3.8L4.5 7.2V12C4.5 16.5 7.6 20.6 12 21.8C16.4 20.6 19.5 16.5 19.5 12V7.2L12 3.8Z" fill="#16a34a" fillOpacity="0.85" />
                <text x="12" y="15.2" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800" fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="-0.5">MG</text>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="grades-brand-title">Gimnasio Martin Galeano</span>
                <span className="grades-tag-pill">Notas & Calificaciones</span>
              </div>
              <span className="grades-brand-subtitle">
                Sistema Integral de Evaluación Académica (SIEE)
              </span>
            </div>
          </div>
        </div>

        <div className="grades-navbar-right">
          {/* Supervisión de Conexiones en Vivo (Rectora y Admin) */}
          {isPrivileged && onOpenConnectionsModal && (
            <button 
              type="button"
              className="btn-presence-nav" 
              onClick={onOpenConnectionsModal}
              title="Supervisión en vivo: Ver quién está conectado y a qué horas se conectaron"
              aria-label="Ver control de conexiones del personal"
            >
              <span className="live-status-pulse"></span>
              <span className="live-status-nav-label">
                <strong>{onlineCount || 1}</strong> en línea
              </span>
              <i className="ph-bold ph-shield-check"></i>
            </button>
          )}

          {/* Chip de Usuario Interactivo y Configuración */}
          <div 
            className="user-chip user-chip-clickable" 
            onClick={onOpenProfile}
            role="button"
            tabIndex={0}
            title={isPrivileged ? "Configuración de administrador y ajustes de personal" : `Configuración de perfil de ${currentUser?.name}`}
            aria-label={isPrivileged ? "Configuración de administrador" : `Configuración de perfil de ${currentUser?.name}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onOpenProfile) onOpenProfile();
              }
            }}
          >
            <div className={`user-avatar ${isPrivileged ? 'avatar-rectora-chip' : ''}`}>
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser?.name} 
                  className="user-avatar-img"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : null}
              <span className="user-avatar-initial" style={{ display: currentUser?.avatar ? 'none' : 'flex' }}>
                {currentUser?.initial || 'U'}
              </span>
              {isPrivileged && <span className="avatar-chip-crown">👑</span>}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser?.name}</span>
              <span className="user-role">{currentUser?.label}</span>
            </div>
            <div className="user-chip-icon-hint" title="Configurar cuenta y avatar">
              <i className="ph-bold ph-gear"></i>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary btn-icon-only" 
            onClick={onLogout} 
            title="Cerrar Sesión"
          >
            <i className="ph-bold ph-sign-out"></i>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="grades-content-area">
        {/* Banner de Bienvenida y Métricas en Armonía Pastel Balanceada */}
        <section className="grades-banner-card">
          <div className="grades-banner-info">
            <div className="grades-banner-title-row">
              <h2>
                <i className="ph-bold ph-book-open"></i>
                Planilla de Calificaciones y Evaluaciones
              </h2>
              {/* Badge Dinámico RBAC del Rol Activo */}
              {canEditScores ? (
                <span className="grades-role-mode-pill mode-docente">
                  <i className="ph-bold ph-pencil-simple-line"></i>
                  Modo Calificación Docente • Planilla Abierta
                </span>
              ) : isViewingAsGradeDirector ? (
                <span className="grades-role-mode-pill mode-director-curso">
                  <i className="ph-bold ph-shield-star"></i>
                  Modo Director(a) de Curso ({selectedGrade}) • Solo Lectura de Acompañamiento
                </span>
              ) : isRectora ? (
                <span className="grades-role-mode-pill mode-rectora">
                  <i className="ph-bold ph-lock-key"></i>
                  Modo Supervisión Directiva • Notas Protegidas (Solo Lectura SIEE)
                </span>
              ) : (
                <span className="grades-role-mode-pill mode-admin">
                  <i className="ph-bold ph-shield-check"></i>
                  Modo Auditoría Técnica • Solo Lectura
                </span>
              )}
            </div>

            <p>
              Estructura ponderada: <strong>Cognitivo (40%)</strong>, <strong>Procedimental (40%)</strong> y <strong>Actitudinal (20%)</strong>.
              {isViewingAsGradeDirector ? (
                <span className="grades-banner-director-notice">
                  {' '}Como <strong>Director(a) de Curso de {selectedGrade}</strong>, puedes supervisar las notas y retroalimentaciones de todas las materias de tus estudiantes. Las notas de esta asignatura corresponden a la docente <strong>{teacherInfo.teacherName}</strong> y están en solo lectura.
                </span>
              ) : !canEditScores && (
                <span className="grades-banner-security-notice">
                  {' '}Por normativa SIEE y seguridad legal institucional, las notas solo pueden ser modificadas por el docente titular asignado.
                </span>
              )}
            </p>
          </div>

          <div className="grades-banner-metrics">
            <div className="grades-metric-badge metric-promedio">
              <span className="grades-metric-label">
                <i className="ph-bold ph-chart-line-up"></i> Promedio
              </span>
              <span className="grades-metric-val">{classAverage}</span>
            </div>

            <div className="grades-metric-badge metric-aprobacion">
              <span className="grades-metric-label">
                <i className="ph-bold ph-check-circle"></i> Aprobación
              </span>
              <span className="grades-metric-val">{passRate}%</span>
            </div>

            <div className="grades-metric-badge metric-estudiantes">
              <span className="grades-metric-label">
                <i className="ph-bold ph-student"></i> Roster
              </span>
              <span className="grades-metric-val">{students.length}</span>
            </div>

            <div className="grades-metric-badge metric-director">
              <span className="grades-metric-label">
                <i className="ph-bold ph-shield-star"></i> Dir. Curso
              </span>
              <span className="grades-metric-val grades-metric-titular-name" title={`Director(a) de Curso de ${selectedGrade}: ${gradeDirector.teacherName}`}>
                {gradeDirector.teacherName}
              </span>
            </div>

            <div className="grades-metric-badge metric-titular">
              <span className="grades-metric-label">
                <i className="ph-bold ph-chalkboard-teacher"></i> Docente
              </span>
              <span className="grades-metric-val grades-metric-titular-name" title={`Docente de ${selectedSubject}: ${teacherInfo.teacherName}`}>
                {teacherInfo.teacherName}
              </span>
            </div>
          </div>
        </section>

        {/* Visualización Visual de la Jerarquía de Datos (Árbol Relacional RBAC) */}
        <section className="grades-tree-path-card">
          <div className="grades-tree-path-header">
            <div className="tree-badge">
              <i className="ph-bold ph-tree-structure"></i>
              <span>Jerarquía de Datos Relacional (RBAC)</span>
            </div>
            <div className="tree-path-meta">
              <span className="tree-security-pill">
                <i className={`ph-bold ${canEditScores ? 'ph-check-circle' : (isViewingAsGradeDirector ? 'ph-shield-star' : 'ph-shield-check')}`}></i>
                {canEditScores 
                  ? `Docente autorizado: ${currentUser?.name || teacherInfo.teacherName}`
                  : isViewingAsGradeDirector
                  ? `Supervisión: Dir. de Curso ${gradeDirector.teacherName} (Docente: ${teacherInfo.teacherName})`
                  : `Auditoría: Notas a cargo de ${teacherInfo.teacherName}`
                }
              </span>
            </div>
          </div>

          <div className="grades-tree-breadcrumbs">
            {/* Nivel 1: Año Lectivo */}
            <div className="tree-crumb crumb-year">
              <span className="crumb-level">Año Lectivo</span>
              <span className="crumb-val">
                <i className="ph-bold ph-calendar-blank"></i> {selectedYear}
              </span>
            </div>

            <i className="ph-bold ph-caret-right tree-crumb-divider"></i>

            {/* Nivel 2: Período */}
            <div className="tree-crumb crumb-period">
              <span className="crumb-level">Periodo</span>
              <span className="crumb-val">
                <i className="ph-bold ph-clock"></i> {selectedPeriod.split(' ')[0]}
              </span>
            </div>

            <i className="ph-bold ph-caret-right tree-crumb-divider"></i>

            {/* Nivel 3: Grado */}
            <div className="tree-crumb crumb-grade">
              <span className="crumb-level">Grado</span>
              <span className="crumb-val">
                <i className="ph-bold ph-student"></i> {selectedGrade}
              </span>
            </div>

            <i className="ph-bold ph-caret-right tree-crumb-divider"></i>

            {/* Director(a) de Curso Oficial por Grado */}
            <div className="tree-crumb crumb-director">
              <span className="crumb-level">Director de Curso</span>
              <span className="crumb-val">
                <i className="ph-bold ph-shield-star"></i> {gradeDirector.teacherName}
              </span>
            </div>

            <i className="ph-bold ph-caret-right tree-crumb-divider"></i>

            {/* Nivel 4: Materia / Asignatura */}
            <div className="tree-crumb crumb-subject">
              <span className="crumb-level">Asignatura</span>
              <span className="crumb-val">
                <i className="ph-bold ph-book-bookmark"></i> {selectedSubject}
              </span>
            </div>

            <i className="ph-bold ph-caret-right tree-crumb-divider"></i>

            {/* Asignación Docente Oficial de la Materia */}
            <div className="tree-crumb crumb-teacher">
              <span className="crumb-level">Docente Asignatura</span>
              <span className="crumb-val">
                <i className="ph-bold ph-chalkboard-teacher"></i> {teacherInfo.teacherName}
              </span>
            </div>
          </div>
        </section>

        {/* Barra de Filtros y Navegación del Árbol con Reglas RBAC */}
        <section className="grades-filter-bar">
          <div className="grades-filter-group">
            {/* Selector Año Lectivo */}
            <div className="grades-select-item">
              <label><i className="ph-bold ph-calendar"></i> Año Lectivo</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                title="Seleccione el Año Lectivo"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Selector Período */}
            <div className="grades-select-item">
              <label><i className="ph-bold ph-clock"></i> Período</label>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                title="Seleccione el Período Académico"
              >
                {availablePeriods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Selector Grado */}
            <div className="grades-select-item">
              <label><i className="ph-bold ph-student"></i> Grado</label>
              <select 
                value={selectedGrade} 
                onChange={(e) => setSelectedGrade(e.target.value)}
                title="Seleccione el Grado Académico"
              >
                {availableGrades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Selector Materia (Incluye todas las materias si es Director de Curso del Grado) */}
            <div className="grades-select-item">
              <label><i className="ph-bold ph-chalkboard-teacher"></i> Materia</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                title="Seleccione la Materia"
              >
                {availableSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Búsqueda rápida de estudiante */}
            <div className="grades-select-item grades-search-item">
              <label><i className="ph-bold ph-magnifying-glass"></i> Filtrar Alumno</label>
              <input 
                type="text" 
                placeholder="Buscar por nombre..." 
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="grades-search-input"
              />
            </div>
          </div>

          <div className="grades-filter-actions">
            {isAdmin && (
              <button 
                type="button" 
                className="grades-btn-secondary btn-novedades-admin" 
                onClick={() => onOpenProfile && onOpenProfile(null, 'reemplazos')}
                title="Panel de Administrador: Novedades y Reemplazos Docentes por Incapacidad"
              >
                <i className="ph-bold ph-arrows-left-right" style={{ color: '#0891b2' }}></i>
                <span>Novedades & Reemplazos</span>
              </button>
            )}

            <button 
              type="button" 
              className="grades-btn-secondary" 
              onClick={() => alert(`Generando boletín PDF oficial de ${selectedSubject} - ${selectedGrade} (${selectedPeriod})...`)}
              title="Descargar boletín de calificaciones en formato PDF"
            >
              <i className="ph-bold ph-file-arrow-down"></i>
              <span>Boletín PDF</span>
            </button>
            <button 
              type="button" 
              className={`grades-btn-primary ${isViewingAsGradeDirector ? 'btn-view-only' : ''}`} 
              onClick={handleSaveAction}
              title={
                canEditScores 
                  ? "Guardar notas y observaciones docentes" 
                  : isViewingAsGradeDirector 
                  ? `Supervisión de Director(a) de Curso (Notas de ${teacherInfo.teacherName})` 
                  : "Guardar observaciones de auditoría directiva"
              }
            >
              <i className={`ph-bold ${
                canEditScores 
                  ? 'ph-floppy-disk' 
                  : isViewingAsGradeDirector 
                  ? 'ph-eye' 
                  : (canEditDirective ? 'ph-crown' : 'ph-shield-check')
              }`}></i>
              <span>
                {canEditScores 
                  ? 'Guardar Planilla' 
                  : isViewingAsGradeDirector 
                  ? 'Modo Director de Curso' 
                  : (canEditDirective ? 'Guardar Sugerencias' : 'Guardar Auditoría')
                }
              </span>
            </button>
          </div>
        </section>

        {/* Tabla / Planilla de Registro de Notas con Encabezados Pastel por Componente */}
        <section className="grades-sheet-card">
          <div className="grades-table-wrapper">
            <table className="grades-table">
              <thead>
                <tr>
                  <th style={{ width: '38px', textAlign: 'center' }}>#</th>
                  <th style={{ minWidth: '200px' }}>Estudiante</th>
                  
                  {/* Componente 1: Cognitivo (40%) - Pastel Sky Blue */}
                  <th className="th-pastel-cognitivo" style={{ textAlign: 'center', minWidth: '95px' }}>
                    <div className="th-component-header">
                      <span>Cognitivo</span>
                      <span className="th-badge-c1">40%</span>
                      {!canEditScores && (
                        <i 
                          className="ph-bold ph-lock-key th-lock-icon" 
                          title={isViewingAsGradeDirector ? `Solo Lectura (Director de Curso): Asignatura a cargo de ${teacherInfo.teacherName}` : "Calificación bloqueada: Solo docente titular"}
                        ></i>
                      )}
                    </div>
                  </th>

                  {/* Componente 2: Procedimental (40%) - Pastel Lavender */}
                  <th className="th-pastel-procedimental" style={{ textAlign: 'center', minWidth: '95px' }}>
                    <div className="th-component-header">
                      <span>Procedimental</span>
                      <span className="th-badge-c2">40%</span>
                      {!canEditScores && (
                        <i 
                          className="ph-bold ph-lock-key th-lock-icon" 
                          title={isViewingAsGradeDirector ? `Solo Lectura (Director de Curso): Asignatura a cargo de ${teacherInfo.teacherName}` : "Calificación bloqueada: Solo docente titular"}
                        ></i>
                      )}
                    </div>
                  </th>

                  {/* Componente 3: Actitudinal (20%) - Pastel Mint */}
                  <th className="th-pastel-actitudinal" style={{ textAlign: 'center', minWidth: '95px' }}>
                    <div className="th-component-header">
                      <span>Actitudinal</span>
                      <span className="th-badge-c3">20%</span>
                      {!canEditScores && (
                        <i 
                          className="ph-bold ph-lock-key th-lock-icon" 
                          title={isViewingAsGradeDirector ? `Solo Lectura (Director de Curso): Asignatura a cargo de ${teacherInfo.teacherName}` : "Calificación bloqueada: Solo docente titular"}
                        ></i>
                      )}
                    </div>
                  </th>

                  {/* Definitiva - Pastel Warm Amber */}
                  <th className="th-pastel-definitiva" style={{ textAlign: 'center', minWidth: '85px' }}>
                    <div className="th-component-header">
                      <span>Definitiva</span>
                      <span className="th-badge-def">100%</span>
                    </div>
                  </th>

                  {/* Desempeño - Pastel Teal */}
                  <th className="th-pastel-desempeno" style={{ textAlign: 'center', minWidth: '110px' }}>
                    Nivel SIEE
                  </th>

                  {/* Rama Árbol: Retroalimentación Docente */}
                  <th className="th-pastel-docente-col" style={{ minWidth: '220px' }}>
                    <div className="th-component-header">
                      <i className="ph-bold ph-chalkboard-teacher"></i>
                      <span>Retroalimentación Docente</span>
                      {canEditFeedback ? (
                        <span className="th-badge-editable">Editable</span>
                      ) : isViewingAsGradeDirector ? (
                        <span className="th-badge-director" title="Visible para seguimiento del Director de Curso">Dir. de Curso</span>
                      ) : null}
                    </div>
                  </th>

                  {/* Rama Árbol: Sugerencia Directiva (Rectoría) */}
                  <th className="th-pastel-directiva-col" style={{ minWidth: '220px' }}>
                    <div className="th-component-header">
                      <i className="ph-bold ph-crown"></i>
                      <span>Sugerencia Directiva (Rectoría)</span>
                      {canEditDirective && <span className="th-badge-rectora">Auditoría</span>}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No se encontraron estudiantes para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const def = calculateDefinitive(student.c1, student.c2, student.c3);
                    const des = getDesempeno(def);
                    const defBadgeClass = getDefinitiveBadgeClass(def);
                    const avatarColorClass = PASTEL_AVATAR_CLASSES[idx % PASTEL_AVATAR_CLASSES.length];

                    return (
                      <tr key={student.id}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                          {idx + 1}
                        </td>

                        {/* Estudiante con Avatar Pastel */}
                        <td>
                          <div className="grades-student-cell">
                            <div className={`grades-student-avatar ${avatarColorClass}`}>
                              {student.name.charAt(0)}
                            </div>
                            <div className="grades-student-info">
                              <span className="grades-student-name">{student.name}</span>
                              <span className="grades-student-code">{student.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Nota Cognitivo (40%) */}
                        <td style={{ textAlign: 'center' }} className="td-score-c1">
                          <div className="score-input-wrap">
                            <input 
                              type="number" 
                              step="0.1" 
                              min="1.0" 
                              max="5.0"
                              value={student.c1}
                              onChange={(e) => handleScoreChange(student.id, 'c1', e.target.value)}
                              className={`grades-input-score input-c1 ${!canEditScores ? 'grades-input-locked' : ''}`}
                              readOnly={!canEditScores}
                              title={
                                !canEditScores 
                                  ? (isViewingAsGradeDirector 
                                      ? `Solo Lectura (Director de Curso): Calificada por ${teacherInfo.teacherName}` 
                                      : "Solo Lectura: Los directivos no pueden alterar notas docentes por seguridad institucional (SIEE)") 
                                  : "Calificar componente cognitivo"
                              }
                            />
                            {!canEditScores && (
                              <i 
                                className="ph-bold ph-lock-key input-mini-lock" 
                                title={isViewingAsGradeDirector ? `Solo lectura para Director de Curso` : "Calificación protegida por SIEE"}
                              ></i>
                            )}
                          </div>
                        </td>

                        {/* Nota Procedimental (40%) */}
                        <td style={{ textAlign: 'center' }} className="td-score-c2">
                          <div className="score-input-wrap">
                            <input 
                              type="number" 
                              step="0.1" 
                              min="1.0" 
                              max="5.0"
                              value={student.c2}
                              onChange={(e) => handleScoreChange(student.id, 'c2', e.target.value)}
                              className={`grades-input-score input-c2 ${!canEditScores ? 'grades-input-locked' : ''}`}
                              readOnly={!canEditScores}
                              title={
                                !canEditScores 
                                  ? (isViewingAsGradeDirector 
                                      ? `Solo Lectura (Director de Curso): Calificada por ${teacherInfo.teacherName}` 
                                      : "Solo Lectura: Los directivos no pueden alterar notas docentes por seguridad institucional (SIEE)") 
                                  : "Calificar componente procedimental"
                              }
                            />
                            {!canEditScores && (
                              <i 
                                className="ph-bold ph-lock-key input-mini-lock" 
                                title={isViewingAsGradeDirector ? `Solo lectura para Director de Curso` : "Calificación protegida por SIEE"}
                              ></i>
                            )}
                          </div>
                        </td>

                        {/* Nota Actitudinal (20%) */}
                        <td style={{ textAlign: 'center' }} className="td-score-c3">
                          <div className="score-input-wrap">
                            <input 
                              type="number" 
                              step="0.1" 
                              min="1.0" 
                              max="5.0"
                              value={student.c3}
                              onChange={(e) => handleScoreChange(student.id, 'c3', e.target.value)}
                              className={`grades-input-score input-c3 ${!canEditScores ? 'grades-input-locked' : ''}`}
                              readOnly={!canEditScores}
                              title={
                                !canEditScores 
                                  ? (isViewingAsGradeDirector 
                                      ? `Solo Lectura (Director de Curso): Calificada por ${teacherInfo.teacherName}` 
                                      : "Solo Lectura: Los directivos no pueden alterar notas docentes por seguridad institucional (SIEE)") 
                                  : "Calificar componente actitudinal"
                              }
                            />
                            {!canEditScores && (
                              <i 
                                className="ph-bold ph-lock-key input-mini-lock" 
                                title={isViewingAsGradeDirector ? `Solo lectura para Director de Curso` : "Calificación protegida por SIEE"}
                              ></i>
                            )}
                          </div>
                        </td>

                        {/* Definitiva con Pill Pastel */}
                        <td className="grades-definitiva-cell td-score-def">
                          <span className={`definitiva-pill ${defBadgeClass}`}>
                            {def}
                          </span>
                        </td>

                        {/* Desempeño SIEE */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`tag-desempeno ${des.className}`}>
                            <i className={`ph-bold ${des.icon}`}></i>
                            {des.label}
                          </span>
                        </td>

                        {/* Rama: Retroalimentación Docente */}
                        <td>
                          {canEditFeedback ? (
                            <div className="obs-input-wrap">
                              <input 
                                type="text"
                                value={student.retroalimentacionDocente || ''}
                                onChange={(e) => handleTeacherFeedbackChange(student.id, e.target.value)}
                                placeholder="Observación pedagógica al estudiante..."
                                className="grades-input-obs obs-docente-input"
                              />
                            </div>
                          ) : (
                            <div className="obs-readonly-box obs-docente-readonly">
                              <i className="ph-bold ph-chat-circle-dots"></i>
                              <span>
                                {student.retroalimentacionDocente 
                                  ? student.retroalimentacionDocente 
                                  : (isViewingAsGradeDirector 
                                      ? `Sin retroalimentación de ${teacherInfo.teacherName} aún` 
                                      : 'Sin retroalimentación docente aún'
                                    )
                                }
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Rama: Sugerencia Directiva (Rectoría) */}
                        <td>
                          {canEditDirective ? (
                            <div className="obs-input-wrap">
                              <input 
                                type="text"
                                value={student.sugerenciaDirectiva || ''}
                                onChange={(e) => handleDirectiveSuggestionChange(student.id, e.target.value)}
                                placeholder="Sugerencia / Nota de auditoría de Rectoría..."
                                className="grades-input-obs obs-rectora-input"
                              />
                              <span className="obs-directiva-indicator" title="Sugerencia registrada por Rectoría">
                                <i className="ph-bold ph-crown"></i>
                              </span>
                            </div>
                          ) : (
                            student.sugerenciaDirectiva ? (
                              <div className="obs-readonly-box obs-rectora-readonly" title="Sugerencia oficial emitida por Rectoría">
                                <span className="obs-crown-badge">👑 Rectoría:</span>
                                <span>{student.sugerenciaDirectiva}</span>
                              </div>
                            ) : (
                              <span className="obs-empty-dash" title="Sin sugerencias directivas registradas">—</span>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer de la Planilla */}
          <div className="grades-sheet-footer">
            <div className="grades-footer-legend">
              <span className="footer-legend-item">
                <span className="legend-dot dot-c1"></span> Cognitivo 40%
              </span>
              <span className="footer-legend-item">
                <span className="legend-dot dot-c2"></span> Procedimental 40%
              </span>
              <span className="footer-legend-item">
                <span className="legend-dot dot-c3"></span> Actitudinal 20%
              </span>
              <span className="footer-legend-rbac">
                <i className={`ph-bold ${canEditScores ? 'ph-check-circle' : (isViewingAsGradeDirector ? 'ph-shield-star' : 'ph-shield-check')}`}></i>
                {canEditScores 
                  ? 'Planilla abierta para calificar y retroalimentar' 
                  : isViewingAsGradeDirector
                  ? `Supervisión de Director(a) de Curso (${gradeDirector.teacherName}) • Calificación por ${teacherInfo.teacherName}`
                  : `Supervisión institucional: notas protegidas de ${teacherInfo.teacherName}`}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="grades-btn-secondary" 
                onClick={() => alert(`Exportando consolidado de calificaciones de ${selectedSubject} en Excel...`)}
              >
                <i className="ph-bold ph-file-xls" style={{ color: '#064e3b' }}></i>
                <span>Consolidado Excel</span>
              </button>
              <button 
                type="button" 
                className={`grades-btn-primary ${isViewingAsGradeDirector ? 'btn-view-only' : ''}`} 
                onClick={handleSaveAction}
              >
                <i className={`ph-bold ${
                  canEditScores 
                    ? 'ph-floppy-disk' 
                    : isViewingAsGradeDirector 
                    ? 'ph-eye' 
                    : (canEditDirective ? 'ph-crown' : 'ph-shield-check')
                }`}></i>
                <span>
                  {canEditScores 
                    ? 'Confirmar y Guardar' 
                    : isViewingAsGradeDirector 
                    ? 'Modo Director de Curso' 
                    : (canEditDirective ? 'Guardar Sugerencias' : 'Guardar Auditoría')
                  }
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Notificación Toast Flotante */}
      {toastMessage && (
        <div className="grades-toast">
          <i className="ph-bold ph-check-circle" style={{ fontSize: '1.25rem', color: '#34d399' }}></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
