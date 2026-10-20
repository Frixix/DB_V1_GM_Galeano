import { useEffect } from 'react';
import './LogoutConfirmModal.css';

/**
 * Modal de Confirmación para Cierre de Sesión
 * Pregunta amigablemente al usuario antes de salir del sistema
 */
export default function LogoutConfirmModal({ isOpen, onClose, onConfirm, currentUser }) {
  // Manejo de tecla Escape para cancelar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const userName = currentUser?.name || 'Usuario';
  const userRole = currentUser?.role === 'admin' 
    ? 'Administrador del Sistema'
    : currentUser?.role === 'rectora'
    ? 'Rectoría Institucional'
    : 'Docente Titular';

  return (
    <div className="modal-backdrop modal-logout-backdrop show" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal-logout-confirm" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del modal */}
        <div className="logout-modal-header">
          <div className="logout-icon-badge">
            <i className="ph-bold ph-sign-out"></i>
          </div>
          <button 
            type="button" 
            className="btn-logout-close" 
            onClick={onClose}
            title="Cancelar y permanecer en el sistema"
          >
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Contenido principal */}
        <div className="logout-modal-body">
          <h3 className="logout-modal-title">¿Deseas cerrar sesión?</h3>
          <p className="logout-modal-desc">
            Estás a punto de salir de la plataforma. Para volver a ingresar tendrás que seleccionar tu usuario y contraseña.
          </p>

          {/* Tarjeta del usuario actual */}
          <div className="logout-user-chip">
            <div className="logout-user-avatar">
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={userName} 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span>{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="logout-user-meta">
              <span className="logout-user-name">{userName}</span>
              <span className="logout-user-role">{userRole}</span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="logout-modal-actions">
          <button 
            type="button" 
            className="btn-logout-cancel" 
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn-logout-confirm" 
            onClick={onConfirm}
          >
            <i className="ph-bold ph-sign-out"></i>
            <span>Sí, cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
