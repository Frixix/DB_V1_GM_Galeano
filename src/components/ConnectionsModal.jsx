import { useState, useEffect } from 'react';
import { formatPresenceDate, formatTimeAgo, formatTimeOnly } from '../utils/format';

export default function ConnectionsModal({ 
  isOpen, 
  onClose, 
  presenceData, 
  currentUser, 
  onSelectTeacher,
  onRefresh,
  loading 
}) {
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'history'
  const [searchTerm, setSearchTerm] = useState('');

  // Verificación de seguridad en render: Solo Rectora o Administrador
  const isAuthorized = Boolean(
    currentUser && 
    ['admin', 'rectora', 'induccion_rectora'].includes(currentUser.role)
  );

  // Escuchar tecla Escape
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
  const logs = presenceData?.logs || [];
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

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (l.name && l.name.toLowerCase().includes(term)) ||
      (l.role && l.role.toLowerCase().includes(term)) ||
      (l.device && l.device.toLowerCase().includes(term))
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
              <h3 id="connectionsModalTitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Control de Conexiones del Personal
                <span className="badge-exclusive-directiva">Directiva & Admin</span>
              </h3>
              <p>Supervisión en tiempo real de asistencia, estado en línea y registro de horarios.</p>
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
              <i className="ph-bold ph-clock-counter-clockwise"></i>
            </div>
            <div>
              <strong className="kpi-number">{logs.length}</strong>
              <span className="kpi-label">Eventos Registrados</span>
            </div>
          </div>

          <div className="connections-kpi-actions">
            <button 
              type="button" 
              className={`btn-refresh-presence ${loading ? 'loading' : ''}`}
              onClick={onRefresh}
              title="Refrescar datos en vivo de Supabase"
            >
              <i className={`ph-bold ph-arrows-clockwise ${loading ? 'ph-spin' : ''}`}></i>
              <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación y Buscador */}
        <div className="connections-nav-bar">
          <div className="connections-tabs">
            <button 
              type="button" 
              className={`connections-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              <i className="ph-bold ph-users"></i>
              <span>Estado del Personal ({users.length})</span>
            </button>
            <button 
              type="button" 
              className={`connections-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <i className="ph-bold ph-list-numbers"></i>
              <span>Historial de Horarios ({logs.length})</span>
            </button>
          </div>

          <div className="connections-search-box">
            <i className="ph-bold ph-magnifying-glass"></i>
            <input 
              type="text" 
              placeholder={activeTab === 'staff' ? "Buscar por docente o rol..." : "Filtrar por nombre o dispositivo..."} 
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

        {/* Cuerpo del Modal */}
        <div className="modal-body connections-modal-body">
          {/* TAB 1: ESTADO DEL PERSONAL EN VIVO */}
          {activeTab === 'staff' && (
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

                      {/* Detalles de Conexión y Horarios */}
                      <div className="staff-card-details">
                        {u.isOnline ? (
                          <>
                            <div className="presence-detail-row">
                              <span className="detail-label">
                                <i className="ph-bold ph-sign-in"></i> Conectado desde:
                              </span>
                              <strong className="detail-val highlight-online">
                                {formatTimeOnly(u.connectedAt)}
                                <small style={{ marginLeft: '6px', fontWeight: 500, color: '#065f46' }}>
                                  ({formatTimeAgo(u.connectedAt)})
                                </small>
                              </strong>
                            </div>

                            <div className="presence-detail-row">
                              <span className="detail-label">
                                <i className="ph-bold ph-activity"></i> Última actividad:
                              </span>
                              <span className="detail-val">
                                {formatTimeAgo(u.lastSeenAt)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="presence-detail-row">
                            <span className="detail-label">
                              <i className="ph-bold ph-clock"></i> Última conexión:
                            </span>
                            <span className="detail-val">
                              {formatPresenceDate(u.lastSeenAt || u.disconnectedAt)}
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
          )}

          {/* TAB 2: HISTORIAL CRONOLÓGICO DE CONEXIONES */}
          {activeTab === 'history' && (
            <div className="connections-history-wrapper">
              {filteredLogs.length === 0 ? (
                <div className="connections-empty-state">
                  <i className="ph-bold ph-calendar-blank"></i>
                  <p>No hay registros de conexión que coincidan con la búsqueda.</p>
                </div>
              ) : (
                <div className="history-table-container">
                  <table className="connections-history-table">
                    <thead>
                      <tr>
                        <th>Docente / Usuario</th>
                        <th>Tipo de Evento</th>
                        <th>Fecha y Hora Exacta</th>
                        <th>Dispositivo / Navegador</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => {
                        const isLogin = log.type === 'login';
                        return (
                          <tr key={log.id || `${log.userKey}_${log.timestamp}`}>
                            <td className="history-col-user">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="history-user-icon">
                                  {log.userKey === 'claudia' ? '👑' : log.userKey === 'admin' ? '🛡️' : '👤'}
                                </div>
                                <div>
                                  <strong>{log.name}</strong>
                                  <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                    {log.role === 'rectora' ? 'Rectora' : log.role === 'admin' ? 'Administrador' : 'Docente'}
                                  </small>
                                </div>
                              </div>
                            </td>

                            <td className="history-col-type">
                              {isLogin ? (
                                <span className="event-pill event-login">
                                  <i className="ph-bold ph-sign-in"></i> Inicio de Sesión
                                </span>
                              ) : (
                                <span className="event-pill event-logout">
                                  <i className="ph-bold ph-sign-out"></i> Cierre de Sesión
                                </span>
                              )}
                            </td>

                            <td className="history-col-time">
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong>{formatPresenceDate(log.timestamp)}</strong>
                                <small style={{ color: 'var(--text-muted)' }}>
                                  {formatTimeAgo(log.timestamp)}
                                </small>
                              </div>
                            </td>

                            <td className="history-col-device">
                              <span className="device-badge">
                                <i className="ph-bold ph-device-mobile-camera"></i>
                                {log.device || 'Navegador Web'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="modal-footer" style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ph-bold ph-lock-key" style={{ color: '#065f46' }}></i>
            <span>Módulo de auditoría de conexiones confidencial para Rectoría y Administración.</span>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
