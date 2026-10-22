import { useState, useEffect } from 'react';
import { 
  getBovedaCredentials, 
  changeBovedaPassword 
} from '../services/authService';

export default function BovedaPasswordModal({ isOpen, onClose, currentUser, onPasswordChanged }) {
  const isRectora = currentUser?.role === 'rectora' || currentUser?.role === 'induccion_rectora';
  const isAdmin = currentUser?.role === 'admin';

  // Si es rectora, modifica directamente la llave de rectoría. El admin puede gestionar ambas.
  const [targetKeyRole, setTargetKeyRole] = useState(isAdmin ? 'admin' : 'rectora');
  const [currentAuthPassword, setCurrentAuthPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bovedaCreds = getBovedaCredentials();

  // Verificaciones en tiempo real para Bóveda
  const cleanAuth = (currentAuthPassword || '').trim();
  const cleanNew = (newPassword || '').trim();
  const cleanConfirm = (confirmPassword || '').trim();

  const hasMinLength = cleanNew.length >= 5;
  const isDifferentFromAuth = cleanNew.length > 0 && cleanNew !== cleanAuth;
  const isConfirmStarted = cleanConfirm.length > 0;
  const doPasswordsMatch = cleanNew.length > 0 && isConfirmStarted && cleanNew === cleanConfirm;
  const isBovedaFormValid = hasMinLength && isDifferentFromAuth && doPasswordsMatch && cleanAuth.length > 0;

  useEffect(() => {
    if (isOpen) {
      setTargetKeyRole(isAdmin ? 'admin' : 'rectora');
      setCurrentAuthPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, isAdmin]);

  // Atajo de teclado: Cerrar modal con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (!currentAuthPassword) {
      setErrorMessage('Por favor ingrese su contraseña actual de autorización.');
      return;
    }

    if (newPassword.length < 5) {
      setErrorMessage('La nueva clave de la Bóveda debe tener al menos 5 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('La confirmación de la contraseña no coincide.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changeBovedaPassword({
        keyRole: targetKeyRole,
        currentAuthPassword,
        newPassword,
        currentUser
      });

      if (isAdmin) {
        setStatusMessage(
          `¡Clave de la Bóveda actualizada con éxito! La clave para ${
            targetKeyRole === 'rectora' ? 'Rectoría' : 'Administrador (Respaldo)'
          } ha quedado ofuscada de forma segura.`
        );
      } else {
        setStatusMessage(
          '¡Clave de la Bóveda actualizada con éxito! La nueva clave ha quedado guardada y ofuscada de forma segura.'
        );
      }

      setCurrentAuthPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onPasswordChanged) onPasswordChanged();
    } catch (err) {
      setErrorMessage(err.message || 'Error al actualizar la clave de la bóveda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div 
        className="modal modal-boveda-password" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog"
        aria-labelledby="bovedaPasswordTitle"
      >
        {/* Encabezado */}
        <div className="modal-header modal-header-boveda">
          <div className="modal-title-wrap">
            <div className="modal-icon boveda-modal-icon">
              <i className="ph-bold ph-key"></i>
            </div>
            <div>
              <h3 id="bovedaPasswordTitle">
                {isAdmin ? 'Seguridad de la Bóveda • Doble Llave (Respaldo)' : 'Seguridad de la Bóveda • Clave de Acceso'}
              </h3>
              <p>Solo configurable desde el interior de la Bóveda Confidencial</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar modal">
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="modal-body-profile">
          {/* Si es ADMINISTRADOR: Muestra la información de Respaldo y Doble Llave */}
          {isAdmin ? (
            <div className="boveda-dual-key-banner">
              <div className="dual-key-header">
                <i className="ph-bold ph-shield-check"></i>
                <strong>Panel de Administración • Respaldo Principal de Seguridad</strong>
              </div>
              <p className="dual-key-desc">
                Como Administrador General, actúas como el <strong>respaldo principal</strong> en caso de contingencia. 
                El sistema mantiene una llave administrativa activa junto a la llave de Rectoría:
              </p>

              <div className="dual-key-grid">
                <div className={`dual-key-badge-card ${targetKeyRole === 'rectora' ? 'active-target' : ''}`}>
                  <div className="dual-key-icon"><i className="ph-bold ph-crown"></i></div>
                  <div>
                    <strong>Llave de Rectoría</strong>
                    <span>
                      {bovedaCreds.isRectoraCustom 
                        ? '🔒 Personalizada y ofuscada' 
                        : '⚙️ Clave inicial'}
                    </span>
                  </div>
                </div>

                <div className={`dual-key-badge-card ${targetKeyRole === 'admin' ? 'active-target' : ''}`}>
                  <div className="dual-key-icon"><i className="ph-bold ph-user-gear"></i></div>
                  <div>
                    <strong>Llave de Respaldo Admin</strong>
                    <span>
                      {bovedaCreds.isAdminCustom 
                        ? '🔒 Personalizada y ofuscada' 
                        : '⚙️ Clave inicial activa'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Si es RECTORA: Vista limpia enfocada exclusivamente en su clave de bóveda */
            bovedaCreds.isRectoraCustom ? (
              <div className="security-status-banner secure" style={{ margin: 0 }}>
                <div className="status-icon"><i className="ph-bold ph-shield-check"></i></div>
                <div className="status-text">
                  <strong>Clave de Bóveda personalizada y protegida</strong>
                  <p>
                    Su clave actual de la bóveda se encuentra ofuscada con cifrado institucional y resguardada de manera segura.
                  </p>
                </div>
              </div>
            ) : (
              <div className="security-status-banner warning" style={{ margin: 0 }}>
                <div className="status-icon"><i className="ph-bold ph-warning"></i></div>
                <div className="status-text">
                  <strong>Clave inicial por defecto en uso</strong>
                  <p>
                    Actualmente la bóveda utiliza la clave institucional inicial. Le sugerimos actualizarla a continuación por una de su preferencia.
                  </p>
                </div>
              </div>
            )
          )}

          {/* Selector de Llave a Modificar (SOLO VISIBLE PARA EL ADMINISTRADOR) */}
          {isAdmin && (
            <div className="form-group">
              <label>Seleccione la llave que desea gestionar:</label>
              <div className="key-role-selector">
                <button
                  type="button"
                  className={`btn-key-selector ${targetKeyRole === 'admin' ? 'active' : ''}`}
                  onClick={() => setTargetKeyRole('admin')}
                >
                  <i className="ph-bold ph-user-gear"></i>
                  <span>Llave de Respaldo (Admin)</span>
                </button>
                <button
                  type="button"
                  className={`btn-key-selector ${targetKeyRole === 'rectora' ? 'active' : ''}`}
                  onClick={() => setTargetKeyRole('rectora')}
                >
                  <i className="ph-bold ph-crown"></i>
                  <span>Llave Directiva (Rectoría)</span>
                </button>
              </div>
            </div>
          )}

          {/* Mensajes de Estado */}
          {statusMessage && (
            <div className="alert-box alert-success">
              <i className="ph-bold ph-check-circle"></i>
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="alert-box alert-error">
              <i className="ph-bold ph-warning-circle"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulario */}
          <form className="password-change-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="bovedaCurrentAuth">Contraseña de autorización actual</label>
              <div className="input-with-action">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  id="bovedaCurrentAuth"
                  placeholder="Ingrese clave actual de bóveda o su contraseña"
                  value={currentAuthPassword}
                  onChange={(e) => setCurrentAuthPassword(e.target.value)}
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
              <small className="helper-text">
                Para verificar su autorización antes de aplicar el cambio.
              </small>
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label htmlFor="bovedaNewPass">
                  {isAdmin ? `Nueva Clave (${targetKeyRole === 'admin' ? 'Admin' : 'Rectoría'})` : 'Nueva Clave de Bóveda'}
                </label>
                <div className="input-with-action">
                  <input
                    type={showNew ? 'text' : 'password'}
                    id="bovedaNewPass"
                    placeholder="Mínimo 5 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
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

              <div className="form-group">
                <label htmlFor="bovedaConfirmPass">Verificación de la nueva clave</label>
                <div className={`input-with-action ${isConfirmStarted ? (doPasswordsMatch ? 'input-verified-success' : 'input-verified-error') : ''}`}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="bovedaConfirmPass"
                    placeholder="Repita la nueva clave"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

            {/* Panel de Verificación de Seguridad en Tiempo Real */}
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
                <div className={`verification-check-item ${isDifferentFromAuth ? 'valid' : 'pending'}`}>
                  <i className={`ph-bold ${isDifferentFromAuth ? 'ph-check-circle' : 'ph-circle'}`}></i>
                  <span>Diferente a la contraseña de autorización</span>
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

              {isBovedaFormValid && (
                <div className="verification-badge-success">
                  <i className="ph-bold ph-seal-check"></i>
                  <span>¡Verificación aprobada! La nueva clave para la Bóveda cumple con los requisitos.</span>
                </div>
              )}
            </div>

            <div className="profile-form-actions" style={{ marginTop: '1.25rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary btn-save-password"
                disabled={!isBovedaFormValid || isSubmitting}
                title={!isBovedaFormValid ? "Completa la verificación de la nueva clave para continuar" : "Guardar y ofuscar clave de Bóveda"}
              >
                <i className={`ph-bold ${isSubmitting ? 'ph-arrows-clockwise ph-spin' : (isBovedaFormValid ? 'ph-seal-check' : 'ph-shield-check')}`}></i>
                <span>{isSubmitting ? 'Ofuscando y Guardando...' : 'Guardar y Ofuscar Clave de Bóveda'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
