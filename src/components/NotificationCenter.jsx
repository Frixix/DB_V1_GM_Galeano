import { useState, useEffect, useMemo, useRef } from 'react';
import './NotificationCenter.css';

/**
 * NotificationCenter: Centro de Notificaciones Institucional
 * Desplegable transversal con persistencia de lectura, filtrado por pestañas,
 * navegación reactiva al módulo de origen sin marcar como leída al vuelo,
 * y confirmación explícita de lectura individual o masiva.
 */
export default function NotificationCenter({
  isOpen = false,
  onClose,
  currentUser,
  documents = [],
  readCircularIds = [],
  onSelectNotification,
  onConfirmRead,
  onConfirmAllReads
}) {
  const [activeTab, setActiveTab] = useState('pendientes'); // 'pendientes' | 'todas' | 'circulares' | 'compartidos'
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

  // Lista de notificaciones estructuradas basadas en documentos institucionales y compartidos
  const notifications = useMemo(() => {
    if (!currentUser) return [];

    return documents
      .filter((doc) => {
        // Solo documentos públicos o institucionales
        const isSharedOrPublic = Boolean(doc.isPublic) || doc.folder === 'institucional';
        if (!isSharedOrPublic) return false;
        // Notificaciones generadas por otros usuarios (o de Rectoría si es docente)
        return doc.teacher !== currentUser.name;
      })
      .map((doc) => {
        const isRead = readCircularIds.includes(doc.id);
        const isCircular = doc.folder === 'institucional';

        return {
          id: doc.id,
          doc,
          module: 'docs',
          title: doc.title,
          teacher: doc.teacher,
          grade: doc.grade,
          subject: doc.subject,
          folder: doc.folder,
          uploadedAt: doc.uploadedAt || 'Reciente',
          isCircular,
          isRead,
          fileName: doc.fileName,
          notes: doc.notes
        };
      });
  }, [documents, currentUser, readCircularIds]);

  // Contadores reactivos
  const unreadList = useMemo(() => notifications.filter((n) => !n.isRead), [notifications]);
  const circularesList = useMemo(() => notifications.filter((n) => n.isCircular), [notifications]);
  const sharedList = useMemo(() => notifications.filter((n) => !n.isCircular), [notifications]);

  // Filtrado según la pestaña activa
  const displayedNotifications = useMemo(() => {
    switch (activeTab) {
      case 'pendientes':
        return unreadList;
      case 'circulares':
        return circularesList;
      case 'compartidos':
        return sharedList;
      case 'todas':
      default:
        return notifications;
    }
  }, [activeTab, notifications, unreadList, circularesList, sharedList]);

  if (!isOpen) return null;

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

  const getFolderBadgeClass = (folder) => {
    switch (folder) {
      case 'institucional':
        return 'tag-pastel-institucional';
      case 'planeaciones':
        return 'tag-pastel-planeaciones';
      case 'talleres':
        return 'tag-pastel-talleres';
      default:
        return 'tag-pastel-public';
    }
  };

  const getFolderLabel = (folder) => {
    switch (folder) {
      case 'institucional':
        return 'Circular Institucional';
      case 'planeaciones':
        return 'Planeación Pedagógica';
      case 'talleres':
        return 'Guía o Taller';
      default:
        return 'Documento Compartido';
    }
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
              {unreadList.length > 0 && <span className="notif-pulse-dot"></span>}
            </div>
            <div>
              <h3 className="notif-center-title">Centro de Notificaciones</h3>
              <p className="notif-center-subtitle">
                {unreadList.length > 0
                  ? `${unreadList.length} comunicado(s) pendiente(s) por revisar`
                  : 'Todos los comunicados revisados'}
              </p>
            </div>
          </div>

          <div className="notif-center-header-actions">
            {unreadList.length > 0 && (
              <button
                type="button"
                className="btn-notif-mark-all"
                onClick={handleConfirmAll}
                title="Marcar todos los comunicados pendientes como revisados"
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
            {unreadList.length > 0 && (
              <span className="notif-tab-badge unread">{unreadList.length}</span>
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
            className={`notif-tab ${activeTab === 'compartidos' ? 'active' : ''}`}
            onClick={() => setActiveTab('compartidos')}
          >
            <span>Compartidos</span>
            <span className="notif-tab-badge">{sharedList.length}</span>
          </button>
        </div>

        {/* Lista de Notificaciones */}
        <div className="notif-center-list">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((notif) => {
              const isUnread = !notif.isRead;

              return (
                <div
                  key={notif.id}
                  className={`notif-item ${isUnread ? 'is-unread' : 'is-read'}`}
                  onClick={() => handleItemClick(notif)}
                  role="button"
                  tabIndex={0}
                  title="Clic para ir al módulo y revisar el documento"
                >
                  <div className="notif-item-indicator">
                    {isUnread ? (
                      <span className="notif-dot-unread" title="Pendiente de confirmación de lectura" />
                    ) : (
                      <i className="ph-bold ph-check notif-icon-read" title="Lectura confirmada" />
                    )}
                  </div>

                  <div className="notif-item-content">
                    <div className="notif-item-topbar">
                      <span className={getFolderBadgeClass(notif.folder)}>
                        {getFolderLabel(notif.folder)}
                      </span>
                      <span className="notif-item-time">
                        <i className="ph-bold ph-clock"></i> {notif.uploadedAt}
                      </span>
                    </div>

                    <h4 className="notif-item-title">{notif.title}</h4>

                    <div className="notif-item-meta">
                      <span className="notif-meta-teacher">
                        <i className="ph-bold ph-user"></i> {notif.teacher}
                      </span>
                      <span className="notif-meta-grade">
                        <i className="ph-bold ph-chalkboard"></i> {notif.grade} • {notif.subject}
                      </span>
                      <span className="notif-meta-radicado">
                        <code>{notif.id}</code>
                      </span>
                    </div>

                    {/* Acciones de cada notificación */}
                    <div className="notif-item-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-notif-action-view"
                        onClick={() => handleItemClick(notif)}
                        title="Ver detalle del documento sin marcar como leído"
                      >
                        <i className="ph-bold ph-arrow-up-right"></i>
                        <span>Revisar detalle</span>
                      </button>

                      {isUnread ? (
                        <button
                          type="button"
                          className="btn-notif-action-confirm"
                          onClick={(e) => handleConfirmSingle(e, notif.id)}
                          title="Confirmar lectura de este comunicado"
                        >
                          <i className="ph-bold ph-check-circle"></i>
                          <span>Confirmar lectura</span>
                        </button>
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
                  ? '¡Estás al día con todos los comunicados!'
                  : 'No hay notificaciones en esta categoría'}
              </h4>
              <p className="notif-empty-desc">
                {activeTab === 'pendientes'
                  ? 'No tienes circulares o documentos institucionales pendientes por confirmar.'
                  : 'Las nuevas comunicaciones emitidas por Rectoría o docentes aparecerán aquí.'}
              </p>
            </div>
          )}
        </div>

        {/* Pie Informativo */}
        <div className="notif-center-footer">
          <i className="ph-bold ph-info"></i>
          <span>
            Las notificaciones solo se registran como leídas al presionar <strong>[Confirmar lectura]</strong>.
          </span>
        </div>
      </div>
    </>
  );
}
