import { useState, useEffect, useMemo, useRef } from 'react';
import './NotificationCenter.css';
import { getDeadlineMeta } from '../utils/observadorDates';

/**
 * NotificationCenter: Centro de Notificaciones Institucional
 * Soporta Deep-Linking estructurado con metadatos de ruta para redirigir directamente
 * al recurso específico (ej: circular nueva, acta vencida, registro pendiente de observador).
 * Regla estricta: La redirección NO marca la alerta como leída "al vuelo"; requiere confirmación explícita.
 */
export default function NotificationCenter({
  isOpen = false,
  onClose,
  currentUser,
  documents = [],
  observadorRecords = [],
  readCircularIds = [],
  onSelectNotification,
  onConfirmRead,
  onConfirmAllReads
}) {
  const [activeTab, setActiveTab] = useState('pendientes'); // 'pendientes' | 'todas' | 'circulares' | 'actas' | 'observador'
  const panelRef = useRef(null);

  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Lista de notificaciones estructuradas con metadatos de ruta para Deep-Linking
  const notifications = useMemo(() => {
    if (!currentUser) return [];

    const result = [];

    // 1. CIRCULARES NUEVAS Y DOCUMENTOS COMPARTIDOS (Módulo Recursos Pedagógicos)
    documents
      .filter((doc) => {
        const isSharedOrPublic = Boolean(doc.isPublic) || doc.folder === 'institucional';
        if (!isSharedOrPublic) return false;
        // Excluir propios para notificar aportes o comunicados de otros docentes / Rectoría
        return doc.teacher !== currentUser.name;
      })
      .forEach((doc) => {
        const isRead = readCircularIds.includes(doc.id);
        const isCircular = doc.folder === 'institucional';

        result.push({
          id: doc.id,
          type: isCircular ? 'circular_nueva' : 'documento_compartido',
          category: 'circulares',
          title: doc.title,
          subtitle: doc.notes || (isCircular ? `Circular oficial emitida por ${doc.teacher}` : `Recurso pedagógico compartido en ${doc.grade}`),
          badgeLabel: isCircular ? 'Circular Nueva' : 'Recurso Compartido',
          badgeClass: isCircular ? 'tag-pastel-institucional' : 'tag-pastel-public',
          urgency: isCircular ? 'warning' : 'normal',
          teacher: doc.teacher,
          grade: doc.grade || 'Institucional',
          subject: doc.subject || 'General',
          date: doc.uploadedAt || 'Reciente',
          isRead,
          isCircular,
          isOverdue: false,
          isToday: false,
          isResolved: true,
          // METADATOS DE RUTA (DEEP-LINKING)
          route: {
            module: 'docs',
            folder: doc.folder || (isCircular ? 'institucional' : 'publico'),
            resourceId: doc.id,
            action: 'view_document',
            targetName: doc.title,
            targetData: doc,
            hint: `Recursos Pedagógicos › ${isCircular ? 'Circulares' : 'Compartidos'}`
          }
        });
      });

    // 2. ALERTAS DE OBSERVADOR Y ACTAS DE COMITÉS (Módulo Observador & Actas)
    (observadorRecords || []).forEach((rec) => {
      const isPrivileged = ['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(currentUser.role);
      const isCommitteeRoute = ['comite_convivencia', 'comision_evaluacion', 'consejo_academico', 'reuniones_docentes'].includes(rec.route);
      const isOwnCase = rec.teacher === currentUser.name;

      // Filtrado por rol y privacidad
      if (!isPrivileged && !isCommitteeRoute && !isOwnCase) {
        return;
      }

      const deadlineMeta = getDeadlineMeta(rec);
      const isResolved = deadlineMeta.isResolved || rec.status === 'resuelto' || rec.semaforo === 'verde';
      const isActa = isCommitteeRoute || (rec.id && rec.id.startsWith('ACT-'));

      // Si está superado/resuelto y sin retraso, no genera alerta activa
      if (isResolved && !deadlineMeta.isOverdue) {
        return;
      }

      const isRead = readCircularIds.includes(rec.id);
      const isOverdue = deadlineMeta.isOverdue;
      const isToday = deadlineMeta.isExpiringToday;

      let badgeLabel = 'Seguimiento Pendiente';
      let badgeClass = 'tag-pastel-amber';
      let urgency = 'warning';
      let category = isActa ? 'actas' : 'observador';

      if (isOverdue) {
        badgeLabel = isActa ? 'Acta Vencida' : 'Plazo Vencido';
        badgeClass = 'tag-pastel-danger';
        urgency = 'critical';
      } else if (isToday) {
        badgeLabel = isActa ? 'Acta Vence Hoy' : 'Vence Hoy';
        badgeClass = 'tag-pastel-rose';
        urgency = 'critical';
      } else if (isActa) {
        badgeLabel = 'Acta de Comité';
        badgeClass = 'tag-pastel-purple';
        urgency = 'warning';
      }

      const routeNameMap = {
        observador: 'Observador',
        citaciones: 'Citaciones',
        piar: 'PIAR',
        comite_convivencia: 'Comité Convivencia',
        comision_evaluacion: 'Comisión Evaluación',
        consejo_academico: 'Consejo Académico',
        reuniones_docentes: 'Reunión Docente'
      };

      const friendlySub = routeNameMap[rec.route] || 'Observador & Actas';

      result.push({
        id: rec.id,
        type: isActa ? 'acta_vencida' : 'registro_pendiente',
        category,
        title: rec.studentName ? `${rec.studentName} — ${rec.title}` : rec.title,
        subtitle: deadlineMeta.fullText || deadlineMeta.statusText || rec.description?.slice(0, 90),
        badgeLabel,
        badgeClass,
        urgency,
        teacher: rec.teacher,
        grade: rec.grade || 'Institucional',
        subject: isActa ? 'Acta de Sesión' : (rec.studentName || 'Estudiante'),
        date: rec.date || rec.followUpDate || 'Reciente',
        isRead,
        isCircular: false,
        isActa,
        isOverdue,
        isToday,
        isResolved,
        // METADATOS DE RUTA (DEEP-LINKING)
        route: {
          module: 'observador',
          routeTab: rec.route,
          resourceId: rec.id,
          action: 'view_record',
          targetName: rec.title,
          targetData: rec,
          hint: `Observador & Actas › ${friendlySub}`
        }
      });
    });

    // Ordenar: Plazos vencidos y casos críticos de hoy primero, luego alertas no leídas
    return result.sort((a, b) => {
      const aCritical = a.isOverdue || a.isToday || a.urgency === 'critical';
      const bCritical = b.isOverdue || b.isToday || b.urgency === 'critical';
      if (aCritical && !bCritical) return -1;
      if (bCritical && !aCritical) return 1;

      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      return 0;
    });
  }, [documents, observadorRecords, currentUser, readCircularIds]);

  // Listas filtradas por categoría
  // Coherencia institucional: Una alerta con Plazo Vencido o Vence Hoy SIEMPRE es pendiente
  // hasta que el caso sea resuelto o atendido, independientemente de si ya se leyó la notificación.
  const pendingList = useMemo(() => {
    return notifications.filter((n) => !n.isRead || n.isOverdue || n.isToday);
  }, [notifications]);

  const unreadList = useMemo(() => notifications.filter((n) => !n.isRead), [notifications]);
  const circularesList = useMemo(() => notifications.filter((n) => n.category === 'circulares'), [notifications]);
  const actasList = useMemo(() => notifications.filter((n) => n.category === 'actas'), [notifications]);
  const observadorList = useMemo(() => notifications.filter((n) => n.category === 'observador'), [notifications]);

  // Filtrado según la pestaña activa
  const displayedNotifications = useMemo(() => {
    switch (activeTab) {
      case 'pendientes':
        return pendingList;
      case 'circulares':
        return circularesList;
      case 'actas':
        return actasList;
      case 'observador':
        return observadorList;
      case 'todas':
      default:
        return notifications;
    }
  }, [activeTab, notifications, pendingList, circularesList, actasList, observadorList]);

  if (!isOpen) return null;

  // Redirección directa al recurso mediante metadatos de ruta (Deep Linking)
  const handleItemClick = (notif) => {
    if (onSelectNotification) {
      onSelectNotification(notif);
    }
  };

  const handleConfirmSingle = (e, notifId) => {
    e.stopPropagation();
    if (onConfirmRead) {
      onConfirmRead(notifId);
    }
  };

  const handleConfirmAll = () => {
    if (onConfirmAllReads && unreadList.length > 0) {
      const ids = unreadList.map((n) => n.id);
      onConfirmAllReads(ids);
    }
  };

  const getRouteIcon = (notif) => {
    if (notif.route?.module === 'observador') {
      if (notif.category === 'actas') return 'ph-bold ph-scales';
      return 'ph-bold ph-user-list';
    }
    if (notif.route?.module === 'grades') return 'ph-bold ph-chart-bar';
    if (notif.route?.module === 'boveda') return 'ph-bold ph-vault';
    return 'ph-bold ph-file-text';
  };

  return (
    <>
      {/* Backdrop transparente para cerrar con clic exterior */}
      <div className="notif-center-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Panel Flotante del Centro de Notificaciones */}
      <div 
        className="notif-center-panel" 
        ref={panelRef}
        role="dialog"
        aria-label="Centro de Notificaciones Institucionales"
        aria-modal="true"
      >
        {/* Encabezado del Centro de Notificaciones */}
        <div className="notif-center-header">
          <div className="notif-center-title-group">
            <div className="notif-center-icon-wrap">
              <i className="ph-bold ph-bell-ringing"></i>
              {pendingList.length > 0 && <span className="notif-pulse-dot"></span>}
            </div>
            <div>
              <h3 className="notif-center-title">Centro de Notificaciones</h3>
              <p className="notif-center-subtitle">
                {pendingList.length > 0
                  ? `${pendingList.length} alerta(s) institucional(es) pendiente(s)`
                  : 'Todas las alertas al día'}
              </p>
            </div>
          </div>

          <div className="notif-center-header-actions">
            {unreadList.length > 0 && (
              <button
                type="button"
                className="btn-notif-mark-all"
                onClick={handleConfirmAll}
                title="Marcar todas las alertas pendientes como revisadas"
              >
                <i className="ph-bold ph-checks"></i>
                <span>Revisar todas</span>
              </button>
            )}
            <button
              type="button"
              className="btn-notif-close"
              onClick={onClose}
              title="Cerrar notificaciones (Esc)"
              aria-label="Cerrar"
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
        </div>

        {/* Pestañas de Filtrado */}
        <div className="notif-center-tabs">
          <button
            type="button"
            className={`notif-tab ${activeTab === 'pendientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('pendientes')}
          >
            <span>Pendientes</span>
            {pendingList.length > 0 && (
              <span className="notif-tab-badge unread">{pendingList.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === 'todas' ? 'active' : ''}`}
            onClick={() => setActiveTab('todas')}
          >
            <span>Todas</span>
            <span className="notif-tab-badge">{notifications.length}</span>
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === 'circulares' ? 'active' : ''}`}
            onClick={() => setActiveTab('circulares')}
          >
            <span>Circulares</span>
            <span className="notif-tab-badge">{circularesList.length}</span>
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === 'actas' ? 'active' : ''}`}
            onClick={() => setActiveTab('actas')}
          >
            <span>Actas</span>
            <span className="notif-tab-badge">{actasList.length}</span>
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === 'observador' ? 'active' : ''}`}
            onClick={() => setActiveTab('observador')}
          >
            <span>Observador</span>
            <span className="notif-tab-badge">{observadorList.length}</span>
          </button>
        </div>

        {/* Lista de Notificaciones con Deep-Linking */}
        <div className="notif-center-list">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((notif) => {
              const isUnread = !notif.isRead;
              const isCritical = notif.urgency === 'critical';

              return (
                <div
                  key={notif.id}
                  className={`notif-item ${isUnread ? 'is-unread' : 'is-read'} ${isCritical ? 'is-critical' : ''}`}
                  onClick={() => handleItemClick(notif)}
                  role="button"
                  tabIndex={0}
                  title={`Clic para ir directamente al recurso: ${notif.route?.hint || notif.title}`}
                >
                  <div className="notif-item-indicator">
                    {isUnread ? (
                      <span className={`notif-dot-unread ${isCritical ? 'critical-pulse' : ''}`} title="Alerta pendiente de revisión" />
                    ) : (
                      <i className="ph-bold ph-check notif-icon-read" title="Revisión confirmada" />
                    )}
                  </div>

                  <div className="notif-item-content">
                    <div className="notif-item-topbar">
                      <div className="notif-badges-group">
                        <span className={notif.badgeClass}>
                          {notif.badgeLabel}
                        </span>
                        {/* Indicador de Ruta / Deep Link */}
                        <span className={`notif-route-pill ${notif.route?.module || 'docs'}`}>
                          <i className={getRouteIcon(notif)}></i>
                          <span>{notif.route?.hint}</span>
                        </span>
                      </div>
                      <span className="notif-item-time">
                        <i className="ph-bold ph-clock"></i> {notif.date}
                      </span>
                    </div>

                    <h4 className="notif-item-title">{notif.title}</h4>

                    {notif.subtitle && (
                      <p className="notif-item-desc">{notif.subtitle}</p>
                    )}

                    <div className="notif-item-meta">
                      <span className="notif-meta-teacher">
                        <i className="ph-bold ph-user"></i> {notif.teacher}
                      </span>
                      <span className="notif-meta-grade">
                        <i className="ph-bold ph-chalkboard"></i> {notif.grade} {notif.subject ? `• ${notif.subject}` : ''}
                      </span>
                      <span className="notif-meta-radicado">
                        <code>{notif.id}</code>
                      </span>
                    </div>

                    {/* Acciones de cada alerta */}
                    <div className="notif-item-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-notif-action-view"
                        onClick={() => handleItemClick(notif)}
                        title={`Ir directamente al recurso institucional ${notif.id} sin marcar como leído`}
                      >
                        <i className="ph-bold ph-arrow-square-out"></i>
                        <span>Ir al recurso</span>
                      </button>

                      {isUnread ? (
                        <button
                          type="button"
                          className="btn-notif-action-confirm"
                          onClick={(e) => handleConfirmSingle(e, notif.id)}
                          title="Confirmar lectura de esta alerta institucional"
                        >
                          <i className="ph-bold ph-check-circle"></i>
                          <span>Confirmar lectura</span>
                        </button>
                      ) : notif.isOverdue ? (
                        <span className="notif-confirmed-tag tag-urgent-pending">
                          <i className="ph-bold ph-warning-octagon"></i> Plazo por resolver
                        </span>
                      ) : notif.isToday ? (
                        <span className="notif-confirmed-tag tag-urgent-pending">
                          <i className="ph-bold ph-alarm"></i> Vence hoy
                        </span>
                      ) : (
                        <span className="notif-confirmed-tag">
                          <i className="ph-bold ph-check"></i> Revisada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="notif-empty-state">
              <div className="notif-empty-icon">
                <i className="ph-bold ph-seal-check"></i>
              </div>
              <h4 className="notif-empty-title">
                {activeTab === 'pendientes'
                  ? '¡Estás al día con todas las alertas institucionales!'
                  : 'No hay alertas en esta categoría'}
              </h4>
              <p className="notif-empty-desc">
                {activeTab === 'pendientes'
                  ? 'No tienes circulares por leer, actas vencidas ni compromisos con plazo expirado.'
                  : 'Las novedades y llamados de atención generados aparecerán aquí.'}
              </p>
            </div>
          )}
        </div>

        {/* Pie Informativo */}
        <div className="notif-center-footer">
          <i className="ph-bold ph-info"></i>
          <span>
            Cada alerta redirige directamente al recurso. Solo se marca como leída al presionar <strong>[Confirmar lectura]</strong>.
          </span>
        </div>
      </div>
    </>
  );
}
