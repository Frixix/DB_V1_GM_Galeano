import { RECORD_STATUSES, RECORD_TYPES, SEMAFORO_CONFIG } from '../data/initialObservador';
import { getDeadlineMeta } from '../utils/observadorDates';

export default function ObservadorCard({
  record,
  onView,
  onDownload,
  onDelete,
  canDelete = false
}) {
  const statusInfo = RECORD_STATUSES[record.status] || RECORD_STATUSES.en_seguimiento;
  const typeInfo = RECORD_TYPES[record.type] || RECORD_TYPES.ordinaria;

  const deadlineMeta = getDeadlineMeta(record);
  // Escalamiento automático a 🔴 Rojo si el plazo venció o vence hoy y el caso sigue sin resolverse
  const effectiveSemaforo = (deadlineMeta.autoEscalateToRed && record.semaforo !== 'verde' && record.status !== 'resuelto')
    ? 'rojo'
    : (record.semaforo || 'amarillo');

  const semaforoInfo = SEMAFORO_CONFIG[effectiveSemaforo] || SEMAFORO_CONFIG.amarillo;

  const getRouteBadgeClass = (route) => {
    const map = {
      observador: 'tag-obs-route-observador',
      citaciones: 'tag-obs-route-citaciones',
      piar: 'tag-obs-route-piar',
      comite_convivencia: 'tag-obs-route-convivencia',
      comision_evaluacion: 'tag-obs-route-evaluacion',
      consejo_academico: 'tag-obs-route-academico',
      reuniones_docentes: 'tag-obs-route-docentes'
    };
    return map[route] || 'tag-obs-route-default';
  };

  const formatRouteLabel = (route) => {
    const map = {
      observador: 'Observador',
      citaciones: 'Citación Acudiente',
      piar: 'PIAR / Pedagógico',
      comite_convivencia: 'Comité Convivencia',
      comision_evaluacion: 'Comisión Evaluación',
      consejo_academico: 'Consejo Académico',
      reuniones_docentes: 'Reunión Docente'
    };
    return map[route] || route;
  };

  const isStudentRoute = ['observador', 'citaciones', 'piar'].includes(record.route);

  return (
    <article className={`obs-card ${deadlineMeta.isOverdue ? 'obs-card-overdue' : ''}`}>
      {/* Cabecera de la Tarjeta */}
      <div className="obs-card-header">
        <div className="obs-badges-group">
          {/* Semáforo Institucional (🔴, 🟡, 🟢) */}
          <span className={`obs-semaforo-badge ${semaforoInfo.badgeClass}`} title={semaforoInfo.description}>
            <span className={`obs-semaforo-dot ${effectiveSemaforo}`}></span>
            <strong>
              {effectiveSemaforo === 'rojo'
                ? (deadlineMeta.isOverdue ? '🔴 Vencido (Crítico)' : '🔴 Crítico')
                : effectiveSemaforo === 'verde'
                ? '🟢 Resuelto'
                : '🟡 En Proceso'}
            </strong>
          </span>
          <span className={`obs-route-chip ${getRouteBadgeClass(record.route)}`}>
            {formatRouteLabel(record.route)}
          </span>
          <span className="obs-grade-chip">{record.grade}</span>
        </div>

        <div className="obs-meta-subtle">
          <span className="obs-meta-date" title={`Fecha de radicación: ${record.date}`}>
            <i className="ph-bold ph-calendar-blank"></i> {record.date}
          </span>
          <span className="obs-radicado-chip" title={`Radicado único institucional: ${record.id}`}>
            <code>{record.id}</code>
          </span>
        </div>
      </div>

      {/* Título de la anotación o acta */}
      <h4
        className="obs-card-title"
        onClick={() => onView(record.id)}
        style={{ cursor: 'pointer' }}
        title="Clic para ver detalle del registro o acta"
      >
        {record.title}
      </h4>

      {/* Metadatos: Estudiante / Asistentes y Docente Responsable */}
      <div className="obs-meta-grid">
        {isStudentRoute ? (
          <>
            <div className="obs-meta-item">
              <i className="ph-bold ph-student"></i>
              <span>
                <strong>Estudiante:</strong> {record.studentName || 'No especificado'}
              </span>
            </div>
            {record.guardianName && (
              <div className="obs-meta-item">
                <i className="ph-bold ph-users-three"></i>
                <span>
                  <strong>Acudiente:</strong> {record.guardianName}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="obs-meta-item">
            <i className="ph-bold ph-users"></i>
            <span>
              <strong>Comité / Asistentes:</strong> {record.attendees || 'Cuerpo Docente y Directivo'}
            </span>
          </div>
        )}

        <div className="obs-meta-item">
          <i className="ph-bold ph-chalkboard-teacher"></i>
          <span>
            <strong>Docente / Cargo:</strong> {record.teacher}
          </span>
        </div>

        {record.period && (
          <div className="obs-meta-item">
            <i className="ph-bold ph-hourglass-medium"></i>
            <span>
              <strong>Periodo:</strong> {record.period}
            </span>
          </div>
        )}
      </div>

      {/* Resumen de Hechos / Compromisos */}
      <div className="obs-card-summary">
        <p className="obs-summary-text">
          {record.description && record.description.length > 140
            ? `${record.description.substring(0, 140)}...`
            : record.description || 'Sin descripción detallada.'}
        </p>

        {record.agreements && (
          <div className="obs-agreements-box">
            <div className="obs-agreements-label">
              <i className="ph-bold ph-handshake"></i>
              <strong>Compromiso pactado:</strong>
            </div>
            <p className="obs-agreements-snippet">
              {record.agreements.length > 120
                ? `${record.agreements.substring(0, 120)}...`
                : record.agreements}
            </p>
          </div>
        )}

        {(record.semaforo === 'verde' || record.resolutionNotes) && (
          <div className="obs-card-resolved-box">
            <div className="obs-card-resolved-label">
              <i className="ph-bold ph-check-circle"></i>
              <strong>Solución documentada:</strong>
            </div>
            <p className="obs-card-resolved-text">
              {record.resolutionNotes
                ? (record.resolutionNotes.length > 110
                    ? `${record.resolutionNotes.substring(0, 110)}...`
                    : record.resolutionNotes)
                : 'Acuerdos cumplidos satisfactoriamente.'}
            </p>
          </div>
        )}
      </div>

      {/* Pie de Tarjeta y Botones de Acción */}
      <div className="obs-card-footer">
        <div className="obs-footer-left">
          {record.followUpDate && (
            <span
              className={`obs-deadline-tag ${deadlineMeta.badgeClass}`}
              title={`Fecha fijada: ${record.followUpDate}. ${deadlineMeta.fullText}`}
            >
              <i className={`ph-bold ${deadlineMeta.icon || 'ph-calendar-check'}`}></i>
              <span>{deadlineMeta.statusText}</span>
            </span>
          )}
        </div>

        <div className="obs-footer-actions">
          <button
            type="button"
            className="obs-btn-view"
            onClick={() => onView(record.id)}
            title="Ver Acta o Registro Completo"
          >
            <i className="ph-bold ph-eye"></i>
            <span>Ver Detalle</span>
          </button>

          <button
            type="button"
            className="obs-btn-download"
            onClick={() => onDownload(record)}
            title="Descargar Acta o Formato Institucional"
          >
            <i className="ph-bold ph-download-simple"></i>
            <span>Acta</span>
          </button>

          {canDelete && (
            <button
              type="button"
              className="obs-btn-delete"
              onClick={() => onDelete(record.id)}
              title="Eliminar este registro (Requiere perfil autorizado)"
            >
              <i className="ph-bold ph-trash"></i>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
