import { RECORD_STATUSES, SEMAFORO_CONFIG } from '../data/initialObservador';
import { getDeadlineMeta } from '../utils/observadorDates';

export default function ObservadorTable({
  records = [],
  onView,
  onDownload,
  onDelete,
  canDelete = false
}) {
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
      citaciones: 'Citación',
      piar: 'PIAR',
      comite_convivencia: 'C. Convivencia',
      comision_evaluacion: 'C. Evaluación',
      consejo_academico: 'C. Académico',
      reuniones_docentes: 'Reunión Docente'
    };
    return map[route] || route;
  };

  return (
    <div className="obs-table-container">
      <table className="obs-table">
        <thead>
          <tr>
            <th>Radicado</th>
            <th>Semáforo</th>
            <th>Plazo / Alerta</th>
            <th>Fecha</th>
            <th>Ruta / Tipo</th>
            <th>Asunto / Estudiante</th>
            <th>Grado</th>
            <th>Responsable</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => {
            const deadlineMeta = getDeadlineMeta(rec);
            const effectiveSemaforo = (deadlineMeta.autoEscalateToRed && rec.semaforo !== 'verde' && rec.status !== 'resuelto')
              ? 'rojo'
              : (rec.semaforo || 'amarillo');
            const semaforoInfo = SEMAFORO_CONFIG[effectiveSemaforo] || SEMAFORO_CONFIG.amarillo;
            const isStudent = Boolean(rec.studentName);

            return (
              <tr key={rec.id} className={`obs-table-row ${deadlineMeta.isOverdue ? 'obs-row-overdue' : ''}`}>
                {/* Radicado */}
                <td className="obs-col-id">
                  <code>{rec.id}</code>
                </td>

                {/* Semáforo Institucional (🔴, 🟡, 🟢) */}
                <td className="obs-col-semaforo">
                  <span className={`obs-semaforo-badge ${semaforoInfo.badgeClass}`} title={semaforoInfo.description}>
                    <span className={`obs-semaforo-dot ${effectiveSemaforo}`}></span>
                    <span>
                      {effectiveSemaforo === 'rojo'
                        ? (deadlineMeta.isOverdue ? '🔴 Vencido' : '🔴 Crítico')
                        : effectiveSemaforo === 'verde'
                        ? '🟢 Resuelto'
                        : '🟡 En Proceso'}
                    </span>
                  </span>
                </td>

                {/* Plazo / Alerta de Seguimiento */}
                <td className="obs-col-deadline">
                  {rec.followUpDate ? (
                    <span
                      className={`obs-deadline-tag ${deadlineMeta.badgeClass}`}
                      title={`Fecha fijada: ${rec.followUpDate}. ${deadlineMeta.fullText}`}
                    >
                      <i className={`ph-bold ${deadlineMeta.icon || 'ph-calendar-check'}`}></i>
                      <span>{deadlineMeta.statusText}</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>-</span>
                  )}
                </td>

                {/* Fecha */}
                <td className="obs-col-date">
                  <span>{rec.date}</span>
                </td>

                {/* Ruta / Tipo */}
                <td className="obs-col-route">
                  <span className={`obs-route-chip ${getRouteBadgeClass(rec.route)}`}>
                    {formatRouteLabel(rec.route)}
                  </span>
                </td>

                {/* Asunto / Estudiante */}
                <td className="obs-col-title">
                  <div className="obs-title-cell">
                    <strong
                      className="obs-clickable-title"
                      onClick={() => onView(rec.id)}
                      title="Clic para ver detalle"
                    >
                      {rec.title}
                    </strong>
                    {isStudent ? (
                      <span className="obs-sub-student">
                        <i className="ph-bold ph-student"></i> {rec.studentName}
                        {rec.guardianName && ` • Acudiente: ${rec.guardianName}`}
                      </span>
                    ) : (
                      <span className="obs-sub-attendees">
                        <i className="ph-bold ph-users"></i> {rec.attendees || 'Cuerpo Institucional'}
                      </span>
                    )}
                  </div>
                </td>

                {/* Grado */}
                <td className="obs-col-grade">
                  <span className="obs-grade-cell-badge">{rec.grade}</span>
                </td>

                {/* Responsable */}
                <td className="obs-col-teacher">
                  <span className="obs-teacher-name">{rec.teacher}</span>
                </td>

                {/* Estado */}
                <td className="obs-col-status">
                  <span className={`obs-status-chip ${statusInfo.badgeClass}`}>
                    <i className={`ph-bold ${statusInfo.icon}`}></i>
                    {statusInfo.label}
                  </span>
                </td>

                {/* Acciones */}
                <td className="obs-col-actions" style={{ textAlign: 'right' }}>
                  <div className="obs-row-actions">
                    <button
                      type="button"
                      className="obs-table-btn-action"
                      onClick={() => onView(rec.id)}
                      title="Ver Detalle / Acta"
                    >
                      <i className="ph-bold ph-eye"></i>
                    </button>
                    <button
                      type="button"
                      className="obs-table-btn-action"
                      onClick={() => onDownload(rec)}
                      title="Descargar Formato / Acta"
                    >
                      <i className="ph-bold ph-download-simple"></i>
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        className="obs-table-btn-delete"
                        onClick={() => onDelete(rec.id)}
                        title="Eliminar Registro"
                      >
                        <i className="ph-bold ph-trash"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
