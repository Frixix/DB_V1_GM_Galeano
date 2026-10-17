import { useState } from 'react';
import './GradesModule.css';

const INITIAL_STUDENTS = [
  { id: 'EST-001', name: 'Valentina Gómez Álvarez', c1: 4.8, c2: 4.5, c3: 5.0, notes: 'Excelente comprensión y autonomía.' },
  { id: 'EST-002', name: 'Santiago Morales Peña', c1: 4.0, c2: 4.2, c3: 4.0, notes: 'Puntual y constante en sus entregas.' },
  { id: 'EST-003', name: 'Luciana Herrera Rincón', c1: 4.6, c2: 4.7, c3: 4.8, notes: 'Destacado liderazgo en trabajo grupal.' },
  { id: 'EST-004', name: 'Mateo Pardo Beltrán', c1: 3.6, c2: 3.8, c3: 4.0, notes: 'Progreso notable durante el periodo.' },
  { id: 'EST-005', name: 'Mariana Ríos Restrepo', c1: 4.2, c2: 4.1, c3: 4.5, notes: 'Muy colaborativa y ordenada.' },
  { id: 'EST-006', name: 'Samuel Castro Ortiz', c1: 3.2, c2: 3.4, c3: 3.5, notes: 'Reforzar talleres procedimentales.' },
];

export default function GradesModule({ currentUser, onBackToModules, onLogout }) {
  const [selectedGrade, setSelectedGrade] = useState('1° Primaria');
  const [selectedSubject, setSelectedSubject] = useState('Matemáticas');
  const [selectedPeriod, setSelectedPeriod] = useState('1° Periodo (25%)');
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [toastMessage, setToastMessage] = useState(null);

  const isRectora = currentUser?.role === 'rectora' || currentUser?.role === 'induccion_rectora';

  const handleScoreChange = (id, field, value) => {
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

  const handleNotesChange = (id, value) => {
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, notes: value };
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

  // Cálculo de estadísticas grupales
  const averagesList = students.map(s => Number(calculateDefinitive(s.c1, s.c2, s.c3)));
  const classAverage = (averagesList.reduce((acc, curr) => acc + curr, 0) / (averagesList.length || 1)).toFixed(2);
  const passingCount = averagesList.filter(avg => avg >= 3.0).length;
  const passRate = Math.round((passingCount / (students.length || 1)) * 100);

  const handleSaveGrades = () => {
    setToastMessage('¡Planilla de Notas guardada y consolidada exitosamente!');
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="grades-module-container">
      {/* Navbar Superior (Estilo unificado sin salto visual) */}
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
            <div className="grades-brand-icon">
              <i className="ph-bold ph-chart-line-up"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="grades-brand-title">Gimnasio Martin Galeano</span>
                <span className="grades-tag-pill">Notas & Calificaciones</span>
              </div>
              <span className="grades-brand-subtitle">
                Sistema de Evaluación y Ponderaciones Académicas
              </span>
            </div>
          </div>
        </div>

        <div className="grades-navbar-right">
          <div className="user-chip" title={`Usuario: ${currentUser?.name}`}>
            <div className={`user-avatar ${isRectora ? 'avatar-rectora-chip' : ''}`}>
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="user-avatar-img"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : null}
              <span className="user-avatar-initial" style={{ display: currentUser?.avatar ? 'none' : 'flex' }}>
                {currentUser?.initial || 'U'}
              </span>
              {isRectora && <span className="avatar-chip-crown">👑</span>}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser?.name}</span>
              <span className="user-role">{currentUser?.label}</span>
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
        {/* Banner de Bienvenida y Métricas */}
        <section className="grades-banner-card">
          <div className="grades-banner-info">
            <h2>
              <i className="ph-bold ph-book-open"></i>
              Planilla de Calificaciones Académicas
            </h2>
            <p>
              Captura notas del período actual por componentes de evaluación: Cognitivo (40%), Procedimental (40%) y Actitudinal (20%).
            </p>
          </div>

          <div className="grades-banner-metrics">
            <div className="grades-metric-badge">
              <span className="grades-metric-label">Promedio Grupal</span>
              <span className="grades-metric-val">{classAverage}</span>
            </div>
            <div className="grades-metric-badge">
              <span className="grades-metric-label">Aprobación</span>
              <span className="grades-metric-val" style={{ color: '#064e3b' }}>{passRate}%</span>
            </div>
            <div className="grades-metric-badge">
              <span className="grades-metric-label">Estudiantes</span>
              <span className="grades-metric-val" style={{ color: '#4338ca' }}>{students.length}</span>
            </div>
          </div>
        </section>

        {/* Barra de Filtros en Colores Pastel */}
        <section className="grades-filter-bar">
          <div className="grades-filter-group">
            <div className="grades-select-item">
              <label><i className="ph-bold ph-student"></i> Grado / Curso</label>
              <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                <option value="1° Primaria">Grado 1° Primaria</option>
                <option value="2° Primaria">Grado 2° Primaria</option>
                <option value="3° Primaria">Grado 3° Primaria</option>
                <option value="4° Primaria">Grado 4° Primaria</option>
                <option value="5° Primaria">Grado 5° Primaria</option>
              </select>
            </div>

            <div className="grades-select-item">
              <label><i className="ph-bold ph-chalkboard-teacher"></i> Asignatura</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="Matemáticas">Matemáticas</option>
                <option value="Lengua Castellana">Lengua Castellana</option>
                <option value="Ciencias Naturales">Ciencias Naturales</option>
                <option value="Ciencias Sociales">Ciencias Sociales</option>
                <option value="Inglés">Inglés</option>
                <option value="Educación Artística">Educación Artística</option>
                <option value="Educación Física">Educación Física</option>
                <option value="Ética & Valores">Ética & Valores</option>
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
          </div>

          <div className="grades-filter-actions">
            <button 
              type="button" 
              className="grades-btn-secondary" 
              onClick={() => alert(`Generando reporte de ${selectedSubject} - ${selectedGrade}...`)}
              title="Descargar boletín de notas"
            >
              <i className="ph-bold ph-file-arrow-down"></i>
              <span>Exportar PDF</span>
            </button>
            <button 
              type="button" 
              className="grades-btn-primary" 
              onClick={handleSaveGrades}
              title="Guardar notas actuales"
            >
              <i className="ph-bold ph-floppy-disk"></i>
              <span>Guardar Planilla</span>
            </button>
          </div>
        </section>

        {/* Tabla / Planilla de Registro de Notas */}
        <section className="grades-sheet-card">
          <div className="grades-table-wrapper">
            <table className="grades-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  <th>Estudiante</th>
                  <th style={{ textAlign: 'center' }} title="Ponderación: 40%">Cognitivo (40%)</th>
                  <th style={{ textAlign: 'center' }} title="Ponderación: 40%">Procedimental (40%)</th>
                  <th style={{ textAlign: 'center' }} title="Ponderación: 20%">Actitudinal (20%)</th>
                  <th style={{ textAlign: 'center' }}>Definitiva</th>
                  <th style={{ textAlign: 'center' }}>Nivel de Desempeño</th>
                  <th>Observaciones Pedagógicas</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const def = calculateDefinitive(student.c1, student.c2, student.c3);
                  const des = getDesempeno(def);

                  return (
                    <tr key={student.id}>
                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div className="grades-student-cell">
                          <div className="grades-student-avatar">
                            {student.name.charAt(0)}
                          </div>
                          <div className="grades-student-info">
                            <span className="grades-student-name">{student.name}</span>
                            <span className="grades-student-code">{student.id}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number" 
                          step="0.1" 
                          min="1.0" 
                          max="5.0"
                          value={student.c1}
                          onChange={(e) => handleScoreChange(student.id, 'c1', e.target.value)}
                          className="grades-input-score"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number" 
                          step="0.1" 
                          min="1.0" 
                          max="5.0"
                          value={student.c2}
                          onChange={(e) => handleScoreChange(student.id, 'c2', e.target.value)}
                          className="grades-input-score"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number" 
                          step="0.1" 
                          min="1.0" 
                          max="5.0"
                          value={student.c3}
                          onChange={(e) => handleScoreChange(student.id, 'c3', e.target.value)}
                          className="grades-input-score"
                        />
                      </td>
                      <td className="grades-definitiva-cell">
                        {def}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`tag-desempeno ${des.className}`}>
                          <i className={`ph-bold ${des.icon}`}></i>
                          {des.label}
                        </span>
                      </td>
                      <td>
                        <input 
                          type="text"
                          value={student.notes}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          placeholder="Agregar observación..."
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.65rem',
                            fontSize: '0.82rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            backgroundColor: '#fafafa',
                            color: '#334155'
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grades-sheet-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.82rem' }}>
              <i className="ph-bold ph-info" style={{ color: '#b45309' }}></i>
              <span>Las notas definitivas se recalculan automáticamente según el Sistema Institucional de Evaluación (SIEE).</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="grades-btn-secondary" 
                onClick={() => alert('Generando consolidado general en formato Excel...')}
              >
                <i className="ph-bold ph-file-xls" style={{ color: '#064e3b' }}></i>
                <span>Consolidado Excel</span>
              </button>
              <button 
                type="button" 
                className="grades-btn-primary" 
                onClick={handleSaveGrades}
              >
                <i className="ph-bold ph-check"></i>
                <span>Confirmar y Guardar</span>
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
