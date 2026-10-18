import { useState, useEffect } from 'react';
import { formatPresenceDate, formatTimeAgo, formatTimeOnly } from '../utils/format.js';

export default function ConnectionsModal({ 
  isOpen, 
  onClose, 
  presenceData, 
  currentUser, 
  onSelectTeacher,
  onRefresh,
  loading 
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Verificación de seguridad en render: Solo Rectora o Administrador
  const isAuthorized = Boolean(
    currentUser && 
    ['admin', 'rectora', 'induccion_rectora'].includes(currentUser.role)
  );

  // Escuchar tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !isAuthorized) return null;

  const users = presenceData?.users || [];
  const onlineCount = presenceData?.onlineCount || 0;
  const offlineCount = presenceData?.offlineCount || 0;

  // Filtrado por buscador
  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term)) ||
      (u.label && u.label.toLowerCase().includes(term))
    );
  });

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div 
        className="modal modal-connections" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="connectionsModalTitle"
      >
        {/* Cabecera del Modal */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon modal-icon-presence">
              <i className="ph-bold ph-shield-check"></i>
            </div>
            <div>
              <h3 id="connectionsModalTitle" className="connections-modal-title">
                Control de Conexiones del Personal
                <span className="badge-exclusive-directiva">Directiva & Admin</span>
              </h3>
              <p>Supervisión en tiempo real de asistencia y registro de la última conexión de cada usuario.</p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={onClose} 
            aria-label="Cerrar ventana"
          >
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Tarjetas KPI de Estado Rápido */}
        <div className="connections-kpi-bar">
          <div className="connections-kpi-card kpi-online">
            <div className="kpi-icon-wrap">
              <span className="live-status-pulse"></span>
            </div>
            <div>
              <strong className="kpi-number">{onlineCount}</strong>
              <span className="kpi-label">En Línea Ahora</span>
            </div>
          </div>

          <div className="connections-kpi-card kpi-offline">
            <div className="kpi-icon-wrap">
              <i className="ph-bold ph-moon"></i>
            </div>
            <div>
              <strong className="kpi-number">{offlineCount}</strong>
              <span className="kpi-label">Desconectados</span>
            </div>
          </div>

          <div className="connections-kpi-card kpi-total">
            <div className="kpi-icon-wrap">
              <i className="ph-bold ph-shield"></i>
            </div>
            <div>
              <strong className="kpi-number" style={{ fontSize: '0.9rem', color: '#065f46' }}>0.00 MB</strong>
              <span className="kpi-label">Solo Última Conexión</span>
            </div>
          </div>

          <div className="connections-kpi-actions">
            <button 
              type="button" 
              className={`btn-refresh-presence ${loading ? 'loading' : ''}`}
              onClick={onRefresh}
              title="Refrescar estado en vivo"
            >
              <i className={`ph-bold ph-arrows-clockwise ${loading ? 'ph-spin' : ''}`}></i>
              <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {/* Buscador de Docentes */}
        <div className="connections-nav-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            <i className="ph-bold ph-users"></i>
            <span>Personal Registrado ({users.length})</span>
          </div>

          <div className="connections-search-box">
            <i className="ph-bold ph-magnifying-glass"></i>
            <input 
              type="text" 
              placeholder="Buscar por docente o rol..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button" 
                className="btn-clear-search" 
                onClick={() => setSearchTerm('')}
                title="Limpiar búsqueda"
              >
                <i className="ph-bold ph-x-circle"></i>
              </button>
            )}
          </div>
        </div>

        {/* Cuerpo del Modal: Cuadrícula del Personal */}
        <div className="modal-body connections-modal-body">
          <div className="connections-staff-grid">
            {filteredUsers.length === 0 ? (
              <div className="connections-empty-state">
                <i className="ph-bold ph-user-circle-dashed"></i>
                <p>No se encontraron docentes con el término "{searchTerm}".</p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isCurrentLoggedUser = u.key === currentUser.key;
                const isRectora = u.role === 'rectora' || u.role === 'induccion_rectora';

                return (
                  <div 
                    key={u.key} 
                    className={`staff-presence-card ${u.isOnline ? 'is-online' : 'is-offline'} ${isCurrentLoggedUser ? 'is-self' : ''}`}
                  >
                    <div className="staff-card-header">
                      <div className="staff-avatar-wrap">
                        <div className={`staff-avatar ${isRectora ? 'avatar-rectora' : ''}`}>
                          {u.avatar ? (
                            <img 
                              src={u.avatar} 
                              alt={u.name} 
                              className="staff-avatar-img"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const next = e.currentTarget.nextSibling;
                                if (next) next.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span 
                            className="staff-avatar-initial" 
                            style={{ display: u.avatar ? 'none' : 'flex' }}
                          >
                            {u.initial || u.name.charAt(0)}
                          </span>
                          {isRectora && <span className="crown-badge">👑</span>}
                        </div>

                        {/* Punto indicador de conexión */}
                        <span 
                          className={`staff-status-dot ${u.isOnline ? 'online' : 'offline'}`}
                          title={u.isOnline ? "Conectado ahora mismo" : "Desconectado"}
                        ></span>
                      </div>

                      <div className="staff-identity">
                        <div className="staff-name-row">
                          <strong className="staff-name">{u.name}</strong>
                          {isCurrentLoggedUser && (
                            <span className="badge-self-pill">Tú (Sesión actual)</span>
                          )}
                        </div>
                        <span className="staff-role-label">{u.label || u.role}</span>
                      </div>

                      {/* Pill de Estado */}
                      <div className="staff-status-badge-container">
                        {u.isOnline ? (
                          <span className="presence-pill online">
                            <span className="live-status-pulse"></span>
                            <span>EN LÍNEA</span>
                          </span>
                        ) : (
                          <span className="presence-pill offline">
                            <i className="ph-bold ph-moon"></i>
                            <span>DESCONECTADO</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Detalles de Última Conexión y Dispositivo */}
                    <div className="staff-card-details">
                      {u.isOnline ? (
                        <>
                          <div className="presence-detail-row">
                            <span className="detail-label">
                              <i className="ph-bold ph-sign-in"></i> Conectado hoy a las:
                            </span>
                            <strong className="detail-val highlight-online">
                              {formatTimeOnly(u.lastConnectedAt)}
                              <small style={{ marginLeft: '6px', fontWeight: 500, color: '#065f46' }}>
                                ({formatTimeAgo(u.lastConnectedAt)})
                              </small>
                            </strong>
                          </div>

                          <div className="presence-detail-row">
                            <span className="detail-label">
                              <i className="ph-bold ph-activity"></i> Último latido de actividad:
                            </span>
                            <span className="detail-val">
                              {formatTimeAgo(u.lastSeenAt)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="presence-detail-row">
                          <span className="detail-label">
                            <i className="ph-bold ph-clock"></i> Última conexión registrada:
                          </span>
                          <span className="detail-val">
                            {formatPresenceDate(u.lastConnectedAt || u.lastSeenAt || u.disconnectedAt)}
                          </span>
                        </div>
                      )}

                      {u.device && (
                        <div className="presence-detail-row device-row">
                          <span className="detail-label">
                            <i className="ph-bold ph-laptop"></i> Dispositivo:
                          </span>
                          <span className="detail-val device-val">
                            {u.device}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Acción contextual: Ver documentos de este docente */}
                    {onSelectTeacher && u.role === 'docente' && (
                      <div className="staff-card-footer">
                        <button 
                          type="button" 
                          className="btn-view-teacher-docs"
                          onClick={() => {
                            onSelectTeacher(u.name);
                            onClose();
                          }}
                        >
                          <i className="ph-bold ph-folder-open"></i>
                          <span>Ver documentos de {u.name}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="modal-footer connections-modal-footer">
          <div className="connections-footer-note">
            <i className="ph-bold ph-shield-check" style={{ color: '#065f46' }}></i>
            <span>Control de asistencia sin acumulación: Cada conexión sobrescribe la anterior para proteger el almacenamiento.</span>
          </div>
          <button type="button" className="btn btn-secondary btn-connections-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
