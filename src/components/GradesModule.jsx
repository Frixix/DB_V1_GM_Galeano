import { useState, useEffect } from 'react';
import './GradesModule.css';

// Roster inicial de estudiantes con notas y observaciones docentes y directivas
const INITIAL_STUDENTS = [
  { 
    id: 'EST-001', 
    name: 'Valentina Gómez Álvarez', 
    c1: 4.8, 
    c2: 4.5, 
    c3: 5.0, 
    notes: 'Excelente comprensión y autonomía en las actividades.', 
    directivaNote: 'Felicitaciones por el rendimiento destacado en el período.',
    adminNote: '' 
  },
  { 
    id: 'EST-002', 
    name: 'Santiago Morales Peña', 
    c1: 4.0, 
    c2: 4.2, 
    c3: 4.0, 
    notes: 'Puntual y constante en sus entregas.', 
    directivaNote: '',
    adminNote: '' 
  },
  { 
    id: 'EST-003', 
    name: 'Luciana Herrera Rincón', 
    c1: 4.6, 
    c2: 4.7, 
    c3: 4.8, 
    notes: 'Destacado liderazgo en trabajo grupal.', 
    directivaNote: 'Candidata a cuadro de honor institucional.',
    adminNote: '' 
  },
  { 
    id: 'EST-004', 
    name: 'Mateo Pardo Beltrán', 
    c1: 3.6, 
    c2: 3.8, 
    c3: 4.0, 
    notes: 'Progreso notable durante el período.', 
    directivaNote: '',
    adminNote: '' 
  },
  { 
    id: 'EST-005', 
    name: 'Mariana Ríos Restrepo', 
    c1: 4.2, 
    c2: 4.1, 
    c3: 4.5, 
    notes: 'Muy colaborativa y ordenada con sus guías.', 
    directivaNote: '',
    adminNote: '' 
  },
  { 
    id: 'EST-006', 
    name: 'Samuel Castro Ortiz', 
    c1: 3.2, 
    c2: 3.4, 
    c3: 3.5, 
    notes: 'Reforzar talleres procedimentales en casa.', 
    directivaNote: 'Plan de mejoramiento sugerido para el periodo 2.',
    adminNote: '' 
  },
];

// Matriz de Asignaciones Académicas por Docente (Reglas de Negocio RBAC)
const TEACHER_ASSIGNMENTS = {
  jessica: {
    name: 'Jessica',
    grades: ['1° Primaria', '2° Primaria'],
    subjects: ['Lengua Castellana', 'Matemáticas', 'Ética & Valores']
  },
  yuri: {
    name: 'Yuri',
    grades: ['2° Primaria', '3° Primaria'],
    subjects: ['Ciencias Naturales', 'Matemáticas', 'Educación Artística']
  },
  elcy: {
    name: 'Elcy',
    grades: ['4° Primaria', '5° Primaria'],
    subjects: ['Ciencias Sociales', 'Lengua Castellana', 'Educación Física']
  },
  induccion: {
    name: 'Inducción Profesoras',
    grades: ['1° Primaria', '2° Primaria', '3° Primaria', '4° Primaria', '5° Primaria'],
    subjects: ['Matemáticas', 'Lengua Castellana', 'Ciencias Naturales', 'Ciencias Sociales', 'Inglés', 'Educación Artística', 'Educación Física', 'Ética & Valores']
  }
};

const ALL_GRADES = ['1° Primaria', '2° Primaria', '3° Primaria', '4° Primaria', '5° Primaria'];
const ALL_SUBJECTS = [
  'Matemáticas',
  'Lengua Castellana',
  'Ciencias Naturales',
  'Ciencias Sociales',
  'Inglés',
  'Educación Artística',
  'Educación Física',
  'Ética & Valores'
];

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

  // Regla RBAC #2: ¿Puede calificar / modificar nota?
  // Docente -> Sí (dentro del periodo académico abierto)
  // Directivo / Rectora -> ❌ Bloqueado (Solo Lectura)
  // Administrador -> ❌ Bloqueado (Solo Lectura)
  const canEditGrades = isDocente;

  // Regla RBAC #1: Grados y materias accesibles según el rol
  const availableGrades = isDocente 
    ? (TEACHER_ASSIGNMENTS[userKey]?.grades || ['1° Primaria', '2° Primaria']) 
    : ALL_GRADES;

  const availableSubjects = isDocente 
    ? (TEACHER_ASSIGNMENTS[userKey]?.subjects || ['Matemáticas', 'Lengua Castellana']) 
    : ALL_SUBJECTS;

  const [selectedGrade, setSelectedGrade] = useState(availableGrades[0]);
  const [selectedSubject, setSelectedSubject] = useState(availableSubjects[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('1° Periodo (25%)');
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [toastMessage, setToastMessage] = useState(null);

  // Asegurar que si el rol cambia, los selectores apunten a opciones válidas
  useEffect(() => {
    if (!availableGrades.includes(selectedGrade)) {
      setSelectedGrade(availableGrades[0]);
    }
    if (!availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [userKey, availableGrades, availableSubjects, selectedGrade, selectedSubject]);

  // Resolver quién es el docente titular a cargo del curso y materia seleccionada
  const getAssignedTeacher = (grade, subject) => {
    if (grade === '1° Primaria' || (grade === '2° Primaria' && (subject === 'Lengua Castellana' || subject === 'Ética & Valores' || subject === 'Matemáticas'))) {
      return 'Jessica';
    }
    if (grade === '3° Primaria' || (grade === '2° Primaria' && (subject === 'Ciencias Naturales' || subject === 'Educación Artística'))) {
      return 'Yuri';
    }
    return 'Elcy';
  };

  const currentTeacherName = isDocente 
    ? (currentUser?.name || 'Docente Titular') 
    : getAssignedTeacher(selectedGrade, selectedSubject);

  // Edición de calificaciones (Exclusivo Docente)
  const handleScoreChange = (id, field, value) => {
    if (!canEditGrades) return;

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

  // Edición de observaciones según el Rol RBAC
  const handleObservationChange = (id, value) => {
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        if (isDocente) {
          return { ...student, notes: value };
        } else if (isRectora) {
          return { ...student, directivaNote: value };
        } else {
          return { ...student, adminNote: value };
        }
      }
      return student;
    }));
  };

  const calculateDefinitive = (c1, c2, c3) => {
    const val1 = Number(c1) || 0;
    const val2 = Number(c2) || 0;
    const val3 = Number(c3) || 0;
    const def = (val1 * 0.4) + (val2 * 0.4) + (val3 * 0.2);
    return def.toFixed(1);
  };

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

  // Estadísticas grupales
  const averagesList = students.map(s => Number(calculateDefinitive(s.c1, s.c2, s.c3)));
  const classAverage = (averagesList.reduce((acc, curr) => acc + curr, 0) / (averagesList.length || 1)).toFixed(2);
  const passingCount = averagesList.filter(avg => avg >= 3.0).length;
  const passRate = Math.round((passingCount / (students.length || 1)) * 100);

  // Guardado según el Rol RBAC
  const handleSaveAction = () => {
    if (isDocente) {
      setToastMessage(`¡Planilla de ${selectedSubject} (${selectedGrade}) guardada exitosamente por ${currentUser?.name}!`);
    } else if (isRectora) {
      setToastMessage(`¡Sugerencias y notas directivas registradas para la auditoría de ${selectedSubject}!`);
    } else {
      setToastMessage(`¡Comentarios técnicos y de auditoría registrados exitosamente!`);
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
          {/* Botón de Supervisión de Conexiones en Vivo (Exclusivo Rectora y Admin) */}
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

          {/* Chip de Usuario Interactivo y Configuración (Admin y Docentes) */}
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
        {/* Banner de Bienvenida y Métricas en Armonía Pastel */}
        <section className="grades-banner-card">
          <div className="grades-banner-info">
            <div className="grades-banner-title-row">
              <h2>
                <i className="ph-bold ph-book-open"></i>
                Planilla de Calificaciones Académicas
              </h2>
              {/* Badge Dinámico RBAC del Rol Activo */}
              {isDocente && (
                <span className="grades-role-mode-pill mode-docente">
                  <i className="ph-bold ph-pencil-simple-line"></i>
                  Modo Calificación Docente • Planilla Abierta
                </span>
              )}
              {isRectora && (
                <span className="grades-role-mode-pill mode-rectora">
                  <i className="ph-bold ph-lock-key"></i>
                  Modo Supervisión Directiva • Calificación Protegida (Solo Lectura)
                </span>
              )}
              {isAdmin && (
                <span className="grades-role-mode-pill mode-admin">
                  <i className="ph-bold ph-shield-check"></i>
                  Modo Auditoría Técnica • Solo Lectura de Notas
                </span>
              )}
            </div>

            <p>
              Ponderaciones académicas: <strong>Cognitivo (40%)</strong>, <strong>Procedimental (40%)</strong> y <strong>Actitudinal (20%)</strong>.
              {!canEditGrades && (
                <span className="grades-banner-security-notice">
                  {' '}Por normativa del SIEE y seguridad institucional, las notas solo pueden ser modificadas por el docente titular de la materia.
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

            <div className="grades-metric-badge metric-titular">
              <span className="grades-metric-label">
                <i className="ph-bold ph-user-check"></i> Docente
              </span>
              <span className="grades-metric-val grades-metric-titular-name">{currentTeacherName}</span>
            </div>
          </div>
        </section>

        {/* Barra de Filtros con Alcance RBAC */}
        <section className="grades-filter-bar">
          <div className="grades-filter-group">
            <div className="grades-select-item">
              <label><i className="ph-bold ph-student"></i> Grado / Curso</label>
              <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                {availableGrades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="grades-select-item">
              <label><i className="ph-bold ph-chalkboard-teacher"></i> Asignatura</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                {availableSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="grades-select-item">
              <label><i className="ph-bold ph-calendar"></i> Período Lectivo</label>
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
                <option value="1° Periodo (25%)">1° Período (25%)</option>
                <option value="2° Periodo (25%)">2° Período (25%)</option>
                <option value="3° Periodo (25%)">3° Período (25%)</option>
                <option value="4° Periodo (25%)">4° Período (25%)</option>
              </select>
            </div>

            {/* Tag informativo de asignación de docente */}
            <div className="grades-assigned-teacher-tag">
              <i className="ph-bold ph-chalkboard-teacher"></i>
              <span>Docente a cargo: <strong>{currentTeacherName}</strong></span>
            </div>
          </div>

          <div className="grades-filter-actions">
            <button 
              type="button" 
              className="grades-btn-secondary" 
              onClick={() => alert(`Generando reporte oficial en PDF de ${selectedSubject} - ${selectedGrade}...`)}
              title="Descargar boletín de notas"
            >
              <i className="ph-bold ph-file-arrow-down"></i>
              <span>Boletín PDF</span>
            </button>
            <button 
              type="button" 
              className="grades-btn-primary" 
              onClick={handleSaveAction}
              title={canEditGrades ? "Guardar notas del período" : "Guardar notas y sugerencias directivas"}
            >
              <i className={`ph-bold ${canEditGrades ? 'ph-floppy-disk' : 'ph-chats-circle'}`}></i>
              <span>{canEditGrades ? 'Guardar Planilla' : (isRectora ? 'Guardar Sugerencias' : 'Guardar Auditoría')}</span>
            </button>
          </div>
        </section>

        {/* Tabla / Planilla de Registro de Notas con Encabezados Pastel por Componente */}
        <section className="grades-sheet-card">
          <div className="grades-table-wrapper">
            <table className="grades-table">
              <thead>
                <tr>
                  <th style={{ width: '42px', textAlign: 'center' }}>#</th>
                  <th style={{ minWidth: '220px' }}>Estudiante</th>
                  
                  {/* Componente 1: Cognitivo (40%) - Pastel Sky Blue */}
                  <th className="th-pastel-cognitivo" style={{ textAlign: 'center' }}>
                    <div className="th-component-header">
                      <span>Cognitivo</span>
                      <span className="th-badge-c1">40%</span>
                      {!canEditGrades && <i className="ph-bold ph-lock-key th-lock-icon" title="Calificación bloqueada para directivos"></i>}
                    </div>
                  </th>

                  {/* Componente 2: Procedimental (40%) - Pastel Violet */}
                  <th className="th-pastel-procedimental" style={{ textAlign: 'center' }}>
                    <div className="th-component-header">
                      <span>Procedimental</span>
                      <span className="th-badge-c2">40%</span>
                      {!canEditGrades && <i className="ph-bold ph-lock-key th-lock-icon" title="Calificación bloqueada para directivos"></i>}
                    </div>
                  </th>

                  {/* Componente 3: Actitudinal (20%) - Pastel Mint */}
                  <th className="th-pastel-actitudinal" style={{ textAlign: 'center' }}>
                    <div className="th-component-header">
                      <span>Actitudinal</span>
                      <span className="th-badge-c3">20%</span>
                      {!canEditGrades && <i className="ph-bold ph-lock-key th-lock-icon" title="Calificación bloqueada para directivos"></i>}
                    </div>
                  </th>

                  {/* Definitiva - Pastel Warm Amber */}
                  <th className="th-pastel-definitiva" style={{ textAlign: 'center' }}>
                    <div className="th-component-header">
                      <span>Definitiva</span>
                      <span className="th-badge-def">100%</span>
                    </div>
                  </th>

                  {/* Desempeño - Pastel Teal */}
                  <th className="th-pastel-desempeno" style={{ textAlign: 'center' }}>
                    Nivel de Desempeño
                  </th>

                  {/* Observaciones según RBAC */}
                  <th style={{ minWidth: '250px' }}>
                    {isDocente && 'Observaciones Pedagógicas'}
                    {isRectora && 'Sugerencias Directivas (Auditoría)'}
                    {isAdmin && 'Comentarios de Auditoría Técnica'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const def = calculateDefinitive(student.c1, student.c2, student.c3);
                  const des = getDesempeno(def);
                  const defBadgeClass = getDefinitiveBadgeClass(def);
                  const avatarColorClass = PASTEL_AVATAR_CLASSES[idx % PASTEL_AVATAR_CLASSES.length];

                  // Resolver valor de observación según RBAC
                  const currentObsValue = isDocente 
                    ? student.notes 
                    : (isRectora ? (student.directivaNote || '') : (student.adminNote || ''));

                  const obsPlaceholder = isDocente
                    ? "Observación pedagógica al estudiante..."
                    : (isRectora ? "Sugerencia directiva / Nota de auditoría interna..." : "Comentario técnico de soporte...");

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
                            className={`grades-input-score input-c1 ${!canEditGrades ? 'grades-input-locked' : ''}`}
                            readOnly={!canEditGrades}
                            title={!canEditGrades ? "Solo Lectura: Los directivos no pueden alterar notas docentes por seguridad institucional (SIEE)" : "Calificar componente cognitivo"}
                          />
                          {!canEditGrades && <i className="ph-bold ph-lock-key input-mini-lock" title="Calificación bloqueada"></i>}
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
                            className={`grades-input-score input-c2 ${!canEditGrades ? 'grades-input-locked' : ''}`}
                            readOnly={!canEditGrades}
                            title={!canEditGrades ? "Solo Lectura: Los directivos no pueden alterar notas docentes por seguridad institucional (SIEE)" : "Calificar componente procedimental"}
                          />
                          {!canEditGrades && <i className="ph-bold ph-lock-key input-mini-lock" title="Calificación bloqueada"></i>}
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
                            className={`grades-input-score input-c3 ${!canEditGrades ? 'grades-input-locked' : ''}`}
                            readOnly={!canEditGrades}
                            title={!canEditGrades ? "Solo Lectura: Los directivos no pueden alterar notas docentes por seguridad institucional (SIEE)" : "Calificar componente actitudinal"}
                          />
                          {!canEditGrades && <i className="ph-bold ph-lock-key input-mini-lock" title="Calificación bloqueada"></i>}
                        </div>
                      </td>

                      {/* Definitiva con Pill Pastel */}
                      <td className="grades-definitiva-cell td-score-def">
                        <span className={`definitiva-pill ${defBadgeClass}`}>
                          {def}
                        </span>
                      </td>

                      {/* Desempeño */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`tag-desempeno ${des.className}`}>
                          <i className={`ph-bold ${des.icon}`}></i>
                          {des.label}
                        </span>
                      </td>

                      {/* Observaciones / Sugerencias según RBAC */}
                      <td>
                        <div className="obs-input-wrap">
                          <input 
                            type="text"
                            value={currentObsValue}
                            onChange={(e) => handleObservationChange(student.id, e.target.value)}
                            placeholder={obsPlaceholder}
                            className={`grades-input-obs ${!isDocente ? 'obs-directiva-mode' : ''}`}
                          />
                          {isRectora && currentObsValue && (
                            <span className="obs-directiva-indicator" title="Sugerencia registrada por Rectoría">
                              <i className="ph-bold ph-crown"></i>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                <i className={`ph-bold ${canEditGrades ? 'ph-check-circle' : 'ph-shield-check'}`}></i>
                {canEditGrades ? 'Planilla abierta para calificar' : 'Auditoría institucional: notas de docente protegidas por SIEE'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="grades-btn-secondary" 
                onClick={() => alert(`Exportando consolidado de notas de ${selectedSubject} en Excel...`)}
              >
                <i className="ph-bold ph-file-xls" style={{ color: '#064e3b' }}></i>
                <span>Consolidado Excel</span>
              </button>
              <button 
                type="button" 
                className="grades-btn-primary" 
                onClick={handleSaveAction}
              >
                <i className={`ph-bold ${canEditGrades ? 'ph-floppy-disk' : 'ph-chats-circle'}`}></i>
                <span>{canEditGrades ? 'Confirmar y Guardar' : (isRectora ? 'Guardar Sugerencias' : 'Guardar Auditoría')}</span>
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
