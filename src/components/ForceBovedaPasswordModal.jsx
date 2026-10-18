import { useState, useEffect } from 'react';
import { changeBovedaPassword } from '../services/authService';
import { BOVEDA_PASSWORD } from '../data/users';

export default function ForceBovedaPasswordModal({ currentUser, onSuccess, onCancel }) {
  const isAdmin = currentUser?.role === 'admin';
  const targetKeyRole = isAdmin ? 'admin' : 'rectora';
  const roleLabel = isAdmin ? 'Administración General (Llave de Respaldo)' : 'Rectoría Institucional';
  const userName = currentUser?.name || (isAdmin ? 'Administrador General' : 'Rectora Institucional');

  const initialBovedaPass = BOVEDA_PASSWORD; // 'boveda2026'

  const [currentPassword, setCurrentPassword] = useState(initialBovedaPass);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(true); // Visible la primera vez
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificaciones en tiempo real al ingresar la nueva clave de la Bóveda
  const cleanCurrent = (currentPassword || '').trim();
  const cleanNew = (newPassword || '').trim();
  const cleanConfirm = (confirmPassword || '').trim();

  const hasMinLength = cleanNew.length >= 5;
  const isDifferentFromInitial = cleanNew.length > 0 && cleanNew !== initialBovedaPass && cleanNew !== cleanCurrent;
  const isConfirmStarted = cleanConfirm.length > 0;
  const doPasswordsMatch = cleanNew.length > 0 && isConfirmStarted && cleanNew === cleanConfirm;
  const isFormValid = hasMinLength && isDifferentFromInitial && doPasswordsMatch && cleanCurrent.length > 0;

  // Bloquear Escape para impedir saltar el modal
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

    if (!cleanCurrent) {
      setErrorMessage(`Por favor ingresa la contraseña anterior de la Bóveda (${initialBovedaPass}).`);
      return;
    }

    if (cleanNew.length < 5) {
      setErrorMessage('La nueva clave de la Bóveda debe tener al menos 5 caracteres.');
      return;
    }

    if (cleanNew === initialBovedaPass || cleanNew === cleanCurrent) {
      setErrorMessage(`La nueva clave debe ser diferente a la anterior (${initialBovedaPass}).`);
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setErrorMessage('La verificación de la nueva contraseña no coincide.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changeBovedaPassword({
        keyRole: targetKeyRole,
        currentAuthPassword: cleanCurrent,
        newPassword: cleanNew,
        currentUser
      });

      setSuccessMessage(
        `¡Contraseña de la Bóveda actualizada y protegida con éxito! La clave anterior '${initialBovedaPass}' ha sido eliminada permanentemente. Accediendo a la Bóveda...`
      );

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 900);
    } catch (err) {
      setErrorMessage(err.message || 'Error al actualizar la contraseña de la Bóveda.');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="modal-backdrop force-password-backdrop show" 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="forceBovedaPasswordTitle"
    >
      <div className="modal modal-force-password" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado Directivo de Bóveda */}
        <div className="force-password-header force-boveda-header">
          <div className="force-header-monogram boveda-monogram">
            <i className="ph-bold ph-lock-key" style={{ fontSize: '1.25rem', color: '#10b981' }}></i>
          </div>
          <div className="force-header-titles">
            <h3 id="forceBovedaPasswordTitle">Seguridad de la Bóveda • Clave Única Requerida</h3>
            <p>Gimnasio Martin Galeano • Custodia Confidencial de Alta Capacidad</p>
          </div>
        </div>

        {/* Tarjeta de Identidad y Alerta */}
        <div className="force-user-card">
          <div className="force-user-avatar boveda-avatar-badge">
            <i className="ph-bold ph-vault"></i>
          </div>
          <div className="force-user-details">
            <div className="force-user-name-row">
              <strong>{userName}</strong>
              <span className="force-role-badge">{roleLabel}</span>
            </div>
            <span className="force-security-alert">
              <i className="ph-bold ph-shield-check"></i>
              <span>Por máxima confidencialidad institucional, debes reemplazar la clave anterior ({initialBovedaPass}) por tu contraseña personal y única antes de ingresar.</span>
            </span>
          </div>
        </div>

        {/* Notificación de Clave Anterior */}
        <div className="force-key-pill-notice">
          <div className="force-key-pill-left">
            <i className="ph-bold ph-key"></i>
            <div>
              <span className="force-key-label">Clave anterior de la Bóveda:</span>
              <strong className="force-key-code">{initialBovedaPass}</strong>
            </div>
          </div>
          <span className="force-key-pill-tag">
            <i className="ph-bold ph-trash"></i> Se elimina automáticamente al crear tu clave única
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

        {/* Formulario */}
        <form className="force-password-form" onSubmit={handleSubmit}>
          {/* Contraseña Anterior / Inicial */}
          <div className="form-group">
            <label htmlFor="forceBovedaCurrentPass">
              Contraseña anterior (Clave institucional: {initialBovedaPass})
            </label>
            <div className="input-with-action">
              <input
                type={showCurrent ? 'text' : 'password'}
                id="forceBovedaCurrentPass"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={initialBovedaPass}
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
              Visible para verificación. Al guardar tu nueva clave, '{initialBovedaPass}' quedará anulada permanentemente para tu acceso.
            </small>
          </div>

          <div className="form-row-two">
            {/* Nueva Contraseña Única */}
            <div className="form-group">
              <label htmlFor="forceBovedaNewPass">Nueva contraseña única de la Bóveda</label>
              <div className="input-with-action">
                <input
                  type={showNew ? 'text' : 'password'}
                  id="forceBovedaNewPass"
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

            {/* Verificación de Contraseña */}
            <div className="form-group">
              <label htmlFor="forceBovedaConfirmPass">Verificación de la nueva clave</label>
              <div className={`input-with-action ${isConfirmStarted ? (doPasswordsMatch ? 'input-verified-success' : 'input-verified-error') : ''}`}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="forceBovedaConfirmPass"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva clave"
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

          {/* Panel de Verificación de Seguridad en Tiempo Real (Dos columnas responsivas) */}
          <div className="password-verification-checklist">
            <div className="verification-checklist-header">
              <i className="ph-bold ph-shield-check"></i>
              <span>Verificación de la clave de Bóveda:</span>
            </div>
            <div className="verification-check-grid">
              <div className={`verification-check-item ${hasMinLength ? 'valid' : 'pending'}`}>
                <i className={`ph-bold ${hasMinLength ? 'ph-check-circle' : 'ph-circle'}`}></i>
                <span>Mínimo 5 caracteres ({cleanNew.length}/5)</span>
              </div>
              <div className={`verification-check-item ${isDifferentFromInitial ? 'valid' : 'pending'}`}>
                <i className={`ph-bold ${isDifferentFromInitial ? 'ph-check-circle' : 'ph-circle'}`}></i>
                <span>Diferente a la anterior ({initialBovedaPass})</span>
              </div>
              <div className={`verification-check-item full-width ${doPasswordsMatch ? 'valid' : (isConfirmStarted ? 'invalid' : 'pending')}`}>
                <i className={`ph-bold ${doPasswordsMatch ? 'ph-check-circle' : (isConfirmStarted ? 'ph-x-circle' : 'ph-circle')}`}></i>
                <span>
                  {doPasswordsMatch 
                    ? 'Verificación exitosa: Las claves coinciden perfectamente' 
                    : (isConfirmStarted ? 'Las contraseñas no coinciden aún' : 'Confirmación y verificación idéntica')}
                </span>
              </div>
            </div>

            {isFormValid && (
              <div className="verification-badge-success">
                <i className="ph-bold ph-seal-check"></i>
                <span>¡Verificación aprobada! La nueva contraseña cumple con todos los requisitos de la Bóveda.</span>
              </div>
            )}
          </div>

          {/* Acciones del Modal: Devolverme o Guardar y Desbloquear */}
          <div className="force-modal-actions">
            <button
              type="button"
              className="btn btn-secondary btn-force-back"
              onClick={onCancel}
              title="Volver al menú de módulos"
              disabled={isSubmitting}
            >
              <i className="ph-bold ph-arrow-left"></i>
              <span>Devolverme al Menú</span>
            </button>

            <button
              type="submit"
              className="btn btn-primary btn-force-save"
              disabled={!isFormValid || isSubmitting}
              title={!isFormValid ? "Completa la verificación de la nueva clave para continuar" : "Guardar contraseña y entrar a la Bóveda"}
            >
              <i className={`ph-bold ${isSubmitting ? 'ph-arrows-clockwise ph-spin' : (isFormValid ? 'ph-seal-check' : 'ph-lock')}`}></i>
              <span>{isSubmitting ? 'Guardando y Asegurando...' : 'Guardar y Desbloquear Bóveda'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
