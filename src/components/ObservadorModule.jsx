import { useState, useMemo } from 'react';
import PortalNavbar from './PortalNavbar';
import ObservadorSidebar from './ObservadorSidebar';
import ObservadorCard from './ObservadorCard';
import ObservadorTable from './ObservadorTable';
import ViewObservadorModal from './ViewObservadorModal';
import UploadObservadorModal from './UploadObservadorModal';
import { useObservador } from '../hooks/useObservador';
import { OBSERVADOR_ROUTES } from '../data/initialObservador';
import { getDeadlineMeta } from '../utils/observadorDates';
import './ObservadorModule.css';

export default function ObservadorModule({
  currentUser,
  onBackToModules,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineCount = 0,
  onlineMap = {},
  circularesCount = 0,
  onOpenCirculares,
  onOpenTour,
  onLogout
}) {
  const { records, addRecord, updateRecord, deleteRecord } = useObservador();

  const [currentRoute, setCurrentRoute] = useState('all');
  const [currentTeacher, setCurrentTeacher] = useState('all');
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [semaforoFilter, setSemaforoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alertFilter, setAlertFilter] = useState('all'); // 'all' | 'overdue' | 'today' | 'urgent'
  const [currentView, setCurrentView] = useState('cards');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modales
  const [selectedRecordForView, setSelectedRecordForView] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora'].includes(currentUser.role);
  const isCoordinador = currentUser?.role === 'coordinador';
  const canAuditAll = isPrivileged || isCoordinador;

  // Estadísticas globales de alertas de plazos (Vencidos, Vence hoy, Próximos)
  const alertStats = useMemo(() => {
    let overdue = 0;
    let todayCount = 0;
    let urgent = 0;
    let inProgress = 0;
    let resolved = 0;

    records.forEach((rec) => {
      // Filtrar si el docente solo tiene acceso a sus casos
      if (!canAuditAll) {
        const isOwn = rec.teacher === currentUser?.name;
        const isGeneral = ['comite_convivencia', 'comision_evaluacion', 'consejo_academico', 'reuniones_docentes'].includes(rec.route);
        if (!isOwn && !isGeneral) return;
      }
      const meta = getDeadlineMeta(rec);
      if (meta.isResolved) {
        resolved++;
      } else {
        inProgress++;
        if (meta.isOverdue) overdue++;
        else if (meta.isExpiringToday) todayCount++;
        else if (meta.isUrgent) urgent++;
      }
    });

    return { overdue, todayCount, urgent, inProgress, resolved };
  }, [records, canAuditAll, currentUser]);

  // Filtrado y ordenamiento reactivo de registros por Semáforo y Alertas
  const filteredRecords = useMemo(() => {
    const list = records.filter((rec) => {
      // 1. Filtrado por Ruta / Ubicación
      if (currentRoute !== 'all' && rec.route !== currentRoute) {
        return false;
      }

      // 2. Control de Acceso / Privacidad si es Docente
      if (!canAuditAll) {
        const isOwn = rec.teacher === currentUser?.name;
        const isGeneralCommittee = ['comite_convivencia', 'comision_evaluacion', 'consejo_academico', 'reuniones_docentes'].includes(rec.route);
        if (!isOwn && !isGeneralCommittee) {
          return false;
        }
      }

      // 3. Auditoría por Docente (Rectora / Admin / Coordinación)
      if (canAuditAll && currentTeacher !== 'all') {
        if (rec.teacher !== currentTeacher) {
          return false;
        }
      }

      // 4. Filtro por Grado
      if (gradeFilter !== 'all' && rec.grade !== gradeFilter) {
        return false;
      }

      const deadlineMeta = getDeadlineMeta(rec);
      const effectiveSemaforo = (deadlineMeta.autoEscalateToRed && rec.semaforo !== 'verde' && rec.status !== 'resuelto')
        ? 'rojo'
        : (rec.semaforo || 'amarillo');

      // 5. Filtro por Alertas Rápidas (Vencidos, Vence hoy, Próximos)
      if (alertFilter === 'overdue' && !deadlineMeta.isOverdue) return false;
      if (alertFilter === 'today' && !deadlineMeta.isExpiringToday) return false;
      if (alertFilter === 'urgent' && !deadlineMeta.isUrgent) return false;

      // 6. Filtro por Semáforo Convivencial (con escalamiento a rojo)
      if (semaforoFilter !== 'all' && effectiveSemaforo !== semaforoFilter) {
        return false;
      }

      // 7. Filtro por Estado
      if (statusFilter !== 'all' && rec.status !== statusFilter) {
        return false;
      }

      // 8. Búsqueda en vivo
      if (search) {
        const q = search.toLowerCase();
        const match =
          (rec.title && rec.title.toLowerCase().includes(q)) ||
          (rec.studentName && rec.studentName.toLowerCase().includes(q)) ||
          (rec.guardianName && rec.guardianName.toLowerCase().includes(q)) ||
          (rec.teacher && rec.teacher.toLowerCase().includes(q)) ||
          (rec.id && rec.id.toLowerCase().includes(q)) ||
          (rec.description && rec.description.toLowerCase().includes(q)) ||
          (rec.attendees && rec.attendees.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });

    // Ordenamiento estricto por Semáforo con Escalamiento Automático:
    // 🔴 Rojo: va de PRIMERO en la vista (orden: 1, casos críticos y vencidos)
    // 🟡 Amarillo: va en el MEDIO (orden: 2, en seguimiento / proceso)
    // 🟢 Verde: va al FONDO / FINAL (orden: 3, casos que ya se arreglaron / resueltos)
    const semaforoWeight = { rojo: 1, amarillo: 2, verde: 3 };
    return list.sort((a, b) => {
      const metaA = getDeadlineMeta(a);
      const metaB = getDeadlineMeta(b);
      const effectiveA = (metaA.autoEscalateToRed && a.semaforo !== 'verde' && a.status !== 'resuelto')
        ? 'rojo'
        : (a.semaforo || 'amarillo');
      const effectiveB = (metaB.autoEscalateToRed && b.semaforo !== 'verde' && b.status !== 'resuelto')
        ? 'rojo'
        : (b.semaforo || 'amarillo');

      const weightA = semaforoWeight[effectiveA] || 2;
      const weightB = semaforoWeight[effectiveB] || 2;
      if (weightA !== weightB) {
        return weightA - weightB;
      }

      // Sub-orden para casos en rojo: casos con fecha vencida van antes
      if (effectiveA === 'rojo' && effectiveB === 'rojo') {
        if (metaA.isOverdue && !metaB.isOverdue) return -1;
        if (!metaA.isOverdue && metaB.isOverdue) return 1;
      }

      return (b.id || '').localeCompare(a.id || '');
    });
  }, [records, currentRoute, currentTeacher, gradeFilter, alertFilter, semaforoFilter, statusFilter, search, isPrivileged, currentUser]);

  // Manejador para abrir vista de registro
  const handleViewRecord = (id) => {
    const rec = records.find((r) => r.id === id);
    if (rec) {
      setSelectedRecordForView(rec);
      setIsViewModalOpen(true);
    }
  };

  // Manejador para descargar acta formal en texto estructurado institucional
  const handleDownloadRecord = (record) => {
    const isStudent = Boolean(record.studentName);
    const content = `================================================================================
                    GIMNASIO MARTÍN GALEANO
               Sistema Institucional de Básica Primaria
        Seguimiento Convivencial, Citaciones & Actas de Comités
================================================================================

Radicado Único:    ${record.id}
Fecha de Emisión:  ${record.date}
Ruta / Sección:    ${record.route.toUpperCase()}
Grado Escolar:     ${record.grade}
Periodo:           ${record.period || 'General'}
Docente / Cargo:   ${record.teacher}
${isStudent ? `Estudiante:        ${record.studentName} (${record.studentId || 'N/A'})\n` : ''}${record.guardianName ? `Acudiente:         ${record.guardianName}\n` : ''}${record.attendees ? `Miembros / Asist:  ${record.attendees}\n` : ''}Estado:            ${record.status}

--------------------------------------------------------------------------------
ASUNTO / TÍTULO DEL REGISTRO:
${record.title}

--------------------------------------------------------------------------------
DESCRIPCIÓN DE LOS HECHOS / DELIBERACIONES DE LA SESIÓN:
${record.description || 'Sin descripción detallada registrada.'}

--------------------------------------------------------------------------------
COMPROMISOS, ACUERDOS Y CORRECTIVOS CONCERTADOS:
${record.agreements || 'Sin compromisos específicos pactados.'}
${record.followUpDate ? `\nFecha Prevista para Seguimiento / Verificación: ${record.followUpDate}\n` : ''}
${record.notes ? `\nObservaciones Adicionales:\n${record.notes}\n` : ''}
--------------------------------------------------------------------------------
FIRMAS INSTITUCIONALES DE CONFORMIDAD:

_____________________________             _____________________________
Docente / Directivo Responsable           Acudiente / Estudiante / Comité
${record.teacher}                         Gimnasio Martín Galeano

================================================================================
Documento archivado en el Sistema Institucional de Convivencia y Actas Escolares.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acta_${record.id}_${record.route}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Manejador para eliminar registro
  const handleDeleteRecord = (id) => {
    const target = records.find((r) => r.id === id);
    const confirmMessage = target
      ? `¿Está seguro de eliminar el registro "${target.title}" (Radicado: ${id})?\nEsta acción no se puede deshacer.`
      : `¿Está seguro de eliminar el registro ${id}?`;

    if (window.confirm(confirmMessage)) {
      deleteRecord(id);
      if (selectedRecordForView?.id === id) {
        setIsViewModalOpen(false);
        setSelectedRecordForView(null);
      }
    }
  };

  // Obtener metadata de la ruta actual
  const currentRouteMeta = OBSERVADOR_ROUTES.find((r) => r.id === currentRoute) || OBSERVADOR_ROUTES[0];

  return (
    <div className="obs-container" id="view-observador-module">
      {/* Navbar Superior Unificado con Identidad Institucional */}
      <PortalNavbar
        currentUser={currentUser}
        moduleTitle="Observador & Actas"
        moduleSubtitle="Seguimiento Convivencial, Citaciones & Comités Internos"
        onBackToModules={onBackToModules}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onlineCount={onlineCount}
        circularesCount={circularesCount}
        onOpenCirculares={onOpenCirculares}
        onOpenTour={onOpenTour}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      <div className="obs-layout">
        {/* Sidebar Izquierda: Panel de Docentes + Ubicación/Rutas + Resumen */}
        <div className={`sidebar-container ${isSidebarOpen ? 'mobile-open' : ''}`}>
          <ObservadorSidebar
            currentUser={currentUser}
            currentRoute={currentRoute}
            onRouteChange={(route) => {
              setCurrentRoute(route);
              setIsSidebarOpen(false);
            }}
            currentTeacher={currentTeacher}
            onTeacherSelect={(teacher) => {
              setCurrentTeacher(teacher);
              setIsSidebarOpen(false);
            }}
            records={records}
            onOpenProfile={onOpenProfile}
            onlineMap={onlineMap}
            onlineCount={onlineCount}
            onOpenConnectionsModal={onOpenConnectionsModal}
            onBackToModules={onBackToModules}
          />
        </div>

        {isSidebarOpen && (
          <div className="mobile-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* Área Central: Banner de Sección, Filtros y Cuadrícula / Tabla */}
        <main className="obs-main-content">
          {/* Banner de Cabecera de la Sección Activa */}
          <section className="obs-banner-header">
            <div className="obs-banner-left">
              <div className="obs-banner-icon-box">
                <i className={`ph-bold ${currentRouteMeta.icon || 'ph-folders'}`}></i>
              </div>
              <div>
                <h2 className="obs-banner-title">{currentRouteMeta.label}</h2>
                <p className="obs-banner-desc">
                  {currentRouteMeta.description ||
                    'Seguimiento pedagógico, actas de acuerdos y compromisos institucionales.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="obs-banner-btn-new"
              onClick={() => setIsUploadModalOpen(true)}
              title={
                isPrivileged
                  ? "Radicar observación, citación o convocar sesión de comité"
                  : "Radicar observación pedagógica, citación a acudiente o PIAR"
              }
            >
              <i className="ph-bold ph-plus-circle"></i>
              <span>
                {isPrivileged
                  ? "Radicar / Convocar Comité"
                  : "Radicar Observación / Citación / PIAR"}
              </span>
            </button>
          </section>

          {/* Barra de Notificaciones y Alertas Rápidas de Plazos */}
          {(alertStats.overdue > 0 || alertStats.todayCount > 0 || alertStats.urgent > 0) && (
            <section className="obs-alerts-panel" aria-label="Alertas de plazos de seguimiento">
              <div className="obs-alerts-title-box">
                <i className="ph-bold ph-bell-ringing obs-bell-shake"></i>
                <div>
                  <h4 className="obs-alerts-heading">ALERTAS INSTITUCIONALES DE PLAZO & SEGUIMIENTO</h4>
                  <p className="obs-alerts-sub">
                    Monitoreo en tiempo real de compromisos de convivencia, citaciones y actas. Casos vencidos escalan a 🔴 Rojo.
                  </p>
                </div>
              </div>

              <div className="obs-alert-chips-row">
                {alertStats.overdue > 0 && (
                  <button
                    type="button"
                    className={`obs-alert-filter-chip overdue ${alertFilter === 'overdue' ? 'active' : ''}`}
                    onClick={() => setAlertFilter(alertFilter === 'overdue' ? 'all' : 'overdue')}
                    title="Filtrar solo casos con plazo vencido (escalados a Alerta Crítica)"
                  >
                    <span className="obs-alert-dot red"></span>
                    <strong>{alertStats.overdue} Vencidos</strong>
                    <span className="obs-alert-mini-lbl">(🔴 Escalados)</span>
                  </button>
                )}

                {alertStats.todayCount > 0 && (
                  <button
                    type="button"
                    className={`obs-alert-filter-chip today ${alertFilter === 'today' ? 'active' : ''}`}
                    onClick={() => setAlertFilter(alertFilter === 'today' ? 'all' : 'today')}
                    title="Filtrar casos que vencen hoy"
                  >
                    <span className="obs-alert-dot orange"></span>
                    <strong>{alertStats.todayCount} Vencen Hoy</strong>
                    <span className="obs-alert-mini-lbl">(🚨 Prioridad)</span>
                  </button>
                )}

                {alertStats.urgent > 0 && (
                  <button
                    type="button"
                    className={`obs-alert-filter-chip urgent ${alertFilter === 'urgent' ? 'active' : ''}`}
                    onClick={() => setAlertFilter(alertFilter === 'urgent' ? 'all' : 'urgent')}
                    title="Filtrar casos que vencen en las próximas 24h a 48h"
                  >
                    <span className="obs-alert-dot amber"></span>
                    <strong>{alertStats.urgent} Próximos a Vencer</strong>
                    <span className="obs-alert-mini-lbl">(⏳ 24h - 48h)</span>
                  </button>
                )}

                {alertFilter !== 'all' && (
                  <button
                    type="button"
                    className="obs-alert-clear-btn"
                    onClick={() => setAlertFilter('all')}
                    title="Restablecer filtro y mostrar todos los registros"
                  >
                    <i className="ph-bold ph-arrow-counter-clockwise"></i> Ver Todos
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Barra de Controles y Filtros */}
          <section className="obs-controls-bar">
            <div className="obs-controls-left">
              {/* Búsqueda en vivo */}
              <div className="obs-search-box">
                <i className="ph-bold ph-magnifying-glass obs-search-icon"></i>
                <input
                  type="text"
                  className="obs-search-input"
                  placeholder="Buscar por estudiante, radicado, acudiente o tema..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Filtro por Grado */}
              <div className="obs-filter-unit">
                <label htmlFor="obsGradeFilter">
                  <i className="ph-bold ph-graduation-cap"></i> Grado:
                </label>
                <select
                  id="obsGradeFilter"
                  className="obs-select-control"
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                >
                  <option value="all">Todos los grados</option>
                  <option value="Transición">Transición</option>
                  <option value="1° Primaria">1° Primaria</option>
                  <option value="2° Primaria">2° Primaria</option>
                  <option value="3° Primaria">3° Primaria</option>
                  <option value="4° Primaria">4° Primaria</option>
                  <option value="5° Primaria">5° Primaria</option>
                  <option value="Institucional">Institucional / Comité</option>
                </select>
              </div>

              {/* Filtro por Semáforo Convivencial */}
              <div className="obs-filter-unit">
                <label htmlFor="obsSemaforoFilter">
                  <i className="ph-bold ph-traffic-signal"></i> Semáforo:
                </label>
                <select
                  id="obsSemaforoFilter"
                  className="obs-select-control"
                  value={semaforoFilter}
                  onChange={(e) => setSemaforoFilter(e.target.value)}
                >
                  <option value="all">Todos (🔴 ➔ 🟡 ➔ 🟢)</option>
                  <option value="rojo">🔴 Alerta Crítica (Primero)</option>
                  <option value="amarillo">🟡 En Seguimiento (Medio)</option>
                  <option value="verde">🟢 Superado / Resuelto (Fondo)</option>
                </select>
              </div>

              {/* Filtro por Estado */}
              <div className="obs-filter-unit">
                <label htmlFor="obsStatusFilter">
                  <i className="ph-bold ph-seal-check"></i> Estado:
                </label>
                <select
                  id="obsStatusFilter"
                  className="obs-select-control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="en_seguimiento">En Seguimiento</option>
                  <option value="compromiso_firmado">Compromiso Firmado</option>
                  <option value="resuelto">Superado / Resuelto</option>
                  <option value="acta_aprobada">Acta Aprobada</option>
                </select>
              </div>
            </div>

            {/* Alternador de Vistas: Cards vs Table */}
            <div className="obs-view-toggle">
              <button
                type="button"
                className={`obs-view-btn ${currentView === 'cards' ? 'active' : ''}`}
                onClick={() => setCurrentView('cards')}
                title="Vista en Cuadrícula de Tarjetas"
              >
                <i className="ph-bold ph-squares-four"></i>
              </button>
              <button
                type="button"
                className={`obs-view-btn ${currentView === 'table' ? 'active' : ''}`}
                onClick={() => setCurrentView('table')}
                title="Vista en Tabla Institucional"
              >
                <i className="ph-bold ph-table"></i>
              </button>
            </div>
          </section>

          {/* Cuadrícula o Tabla de Registros */}
          <section className="obs-records-container">
            {filteredRecords.length > 0 ? (
              currentView === 'cards' ? (
                <div className="obs-cards-grid">
                  {filteredRecords.map((rec) => (
                    <ObservadorCard
                      key={rec.id}
                      record={rec}
                      onView={handleViewRecord}
                      onDownload={handleDownloadRecord}
                      onDelete={handleDeleteRecord}
                      canDelete={isPrivileged}
                    />
                  ))}
                </div>
              ) : (
                <ObservadorTable
                  records={filteredRecords}
                  onView={handleViewRecord}
                  onDownload={handleDownloadRecord}
                  onDelete={handleDeleteRecord}
                  canDelete={isPrivileged}
                />
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <i className="ph-bold ph-tray" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '0.75rem', display: 'inline-block' }}></i>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No se encontraron registros en esta sección</h4>
                <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
                  No hay anotaciones ni actas registradas que coincidan con los filtros aplicados. Puedes radicar una nueva en este momento.
                </p>
                <button
                  type="button"
                  className="obs-btn-primary"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <i className="ph-bold ph-plus"></i>
                  <span>Radicar Nuevo Registro</span>
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Botón Flotante para Radicar Nuevo Registro / Acta (Inferior Derecha) */}
      <button
        type="button"
        className="btn-floating-upload"
        onClick={() => setIsUploadModalOpen(true)}
        title={
          isPrivileged
            ? "Radicar observación, citación o convocar comité"
            : "Radicar observación, citación a acudiente o PIAR"
        }
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
          boxShadow: '0 6px 16px rgba(15, 118, 110, 0.35)'
        }}
      >
        <i className="ph-bold ph-note-pencil"></i>
        <span>
          {isPrivileged ? "Radicar / Convocar Comité" : "Radicar Observación / Citación"}
        </span>
      </button>

      {/* Modal para Ver y Descargar Registro o Acta */}
      <ViewObservadorModal
        isOpen={isViewModalOpen}
        record={selectedRecordForView}
        currentUser={currentUser}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedRecordForView(null);
        }}
        onDownload={handleDownloadRecord}
        onUpdateStatus={(id, fields) => {
          updateRecord(id, fields);
          setSelectedRecordForView((prev) => (prev ? { ...prev, ...fields } : null));
        }}
      />

      {/* Modal para Radicar Nueva Observación o Acta */}
      <UploadObservadorModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentUser={currentUser}
        onRecordCreated={(newRec) => {
          addRecord(newRec);
          setSelectedRecordForView(newRec);
          setIsViewModalOpen(true);
        }}
        initialRoute={currentRoute}
      />
    </div>
  );
}
