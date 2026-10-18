import { useState, useEffect } from 'react';
import { changeUserPassword } from '../services/authService';
import { USERS } from '../data/users';

export default function ForcePasswordChangeModal({ currentUser, onPasswordChanged, onLogout }) {
  const userKey = currentUser?.key || currentUser?.role || 'docente';
  const userName = currentUser?.name || 'Docente Institucional';
  const userRole = currentUser?.label || currentUser?.role || 'Personal Institucional';
  const userInitial = currentUser?.initial || (userName ? userName.charAt(0).toUpperCase() : 'U');

  // Clave inicial individual según el perfil en USERS (ej: elcy2026 para Elcy)
  const initialPass = USERS[userKey]?.pass || currentUser?.pass || '';

  const [currentPassword, setCurrentPassword] = useState(initialPass);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(true); // Visible la primera vez como solicitó el usuario
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bloquear la tecla Escape para impedir saltarse el modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCurrent = (currentPassword || '').trim();
    const cleanNew = (newPassword || '').trim();
    const cleanConfirm = (confirmPassword || '').trim();

    if (!cleanCurrent) {
      setErrorMessage(`Por favor ingresa tu clave inicial (${initialPass}) para autorizar.`);
      return;
    }

    if (cleanNew.length < 5) {
      setErrorMessage('La nueva contraseña debe tener como mínimo 5 caracteres.');
      return;
    }

    if (cleanNew === cleanCurrent) {
      setErrorMessage('La nueva contraseña debe ser diferente a tu clave inicial actual.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setErrorMessage('La confirmación de la nueva contraseña no coincide.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changeUserPassword(userKey, cleanCurrent, cleanNew);
      setSuccessMessage(
        `¡Contraseña actualizada con éxito! La clave inicial ${initialPass} ha sido eliminada permanentemente. Ingresando al sistema...`
      );
      setTimeout(() => {
        if (onPasswordChanged) {
          onPasswordChanged();
        }
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Error al cambiar la contraseña.');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="modal-backdrop force-password-backdrop show" 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="forcePasswordTitle"
    >
      <div className="modal modal-force-password" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado Institucional No Saltable */}
        <div className="force-password-header">
          <div className="force-header-monogram">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 6V12C3 17.5 6.8 22.3 12 23.5C17.2 22.3 21 17.5 21 12V6L12 2Z" fill="#15803d" />
              <path d="M12 3.8L4.5 7.2V12C4.5 16.5 7.6 20.6 12 21.8C16.4 20.6 19.5 16.5 19.5 12V7.2L12 3.8Z" fill="#16a34a" fillOpacity="0.9" />
              <text x="12" y="15.2" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800" fontFamily="'Plus Jakarta Sans', sans-serif">MG</text>
            </svg>
          </div>
          <div className="force-header-titles">
            <h3 id="forcePasswordTitle">Primer Ingreso Requerido</h3>
            <p>Gimnasio Martin Galeano • Plataforma Institucional</p>
          </div>
        </div>

        {/* Tarjeta de Identidad del Perfil Activo */}
        <div className="force-user-card">
          <div className="force-user-avatar">
            {currentUser?.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={userName} 
                className="force-avatar-img"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span className="force-avatar-initial">{userInitial}</span>
            )}
          </div>
          <div className="force-user-details">
            <div className="force-user-name-row">
              <strong>{userName}</strong>
              <span className="force-role-badge">{userRole}</span>
            </div>
            <span className="force-security-alert">
              <i className="ph-bold ph-shield-check"></i>
              <span>Por seguridad del colegio, debes crear tu contraseña personal antes de continuar.</span>
            </span>
          </div>
        </div>

        {/* Notificación de Clave Inicial Temporal */}
        <div className="force-key-pill-notice">
          <div className="force-key-pill-left">
            <i className="ph-bold ph-key"></i>
            <div>
              <span className="force-key-label">Clave inicial asignada:</span>
              <strong className="force-key-code">{initialPass}</strong>
            </div>
          </div>
          <span className="force-key-pill-tag">
            <i className="ph-bold ph-trash"></i> Se elimina automáticamente al cambiarla
          </span>
        </div>

        {/* Mensajes de Alerta */}
        {errorMessage && (
          <div className="alert-box alert-error force-alert" role="alert">
            <i className="ph-bold ph-warning-circle"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert-box alert-success force-alert" role="alert">
            <i className="ph-bold ph-check-circle"></i>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulario Obligatorio */}
        <form className="force-password-form" onSubmit={handleSubmit}>
          {/* Contraseña Actual / Inicial */}
          <div className="form-group">
            <label htmlFor="forceCurrentPass">
              Contraseña actual (Clave inicial de {userName})
            </label>
            <div className="input-with-action">
              <input
                type={showCurrent ? 'text' : 'password'}
                id="forceCurrentPass"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={initialPass}
                required
              />
              <button
                type="button"
                className="btn-toggle-visibility"
                onClick={() => setShowCurrent(!showCurrent)}
                title={showCurrent ? 'Ocultar' : 'Mostrar'}
                tabIndex={-1}
              >
                <i className={`ph-bold ${showCurrent ? 'ph-eye-slash' : 'ph-eye'}`}></i>
              </button>
            </div>
            <small className="form-field-hint">
              Visible por primera vez. Una vez cambiada, no volverá a funcionar.
            </small>
          </div>

          <div className="form-row-two">
            {/* Nueva Contraseña */}
            <div className="form-group">
              <label htmlFor="forceNewPass">Nueva contraseña personal</label>
              <div className="input-with-action">
                <input
                  type={showNew ? 'text' : 'password'}
                  id="forceNewPass"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 5 caracteres"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-toggle-visibility"
                  onClick={() => setShowNew(!showNew)}
                  title={showNew ? 'Ocultar' : 'Mostrar'}
                  tabIndex={-1}
                >
                  <i className={`ph-bold ${showNew ? 'ph-eye-slash' : 'ph-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="form-group">
              <label htmlFor="forceConfirmPass">Confirmar nueva contraseña</label>
              <div className="input-with-action">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="forceConfirmPass"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu clave"
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-visibility"
                  onClick={() => setShowConfirm(!showConfirm)}
                  title={showConfirm ? 'Ocultar' : 'Mostrar'}
                  tabIndex={-1}
                >
                  <i className={`ph-bold ${showConfirm ? 'ph-eye-slash' : 'ph-eye'}`}></i>
                </button>
              </div>
            </div>
          </div>

          {/* Acciones del Modal: Solo Devolverme/Salir o Guardar */}
          <div className="force-modal-actions">
            <button
              type="button"
              className="btn btn-secondary btn-force-back"
              onClick={onLogout}
              title="Volver a la pantalla de inicio si seleccionaste este usuario por error"
              disabled={isSubmitting}
            >
              <i className="ph-bold ph-arrow-left"></i>
              <span>Devolverme / Salir</span>
            </button>

            <button
              type="submit"
              className="btn btn-primary btn-force-save"
              disabled={isSubmitting}
            >
              <i className={`ph-bold ${isSubmitting ? 'ph-arrows-clockwise ph-spin' : 'ph-shield-check'}`}></i>
              <span>{isSubmitting ? 'Guardando y Activando...' : 'Guardar y Entrar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
