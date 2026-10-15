import { useState, useEffect } from 'react';
import { 
  getBovedaCredentials, 
  changeBovedaPassword 
} from '../services/authService';

export default function BovedaPasswordModal({ isOpen, onClose, currentUser, onPasswordChanged }) {
  const isRectora = currentUser?.role === 'rectora' || currentUser?.role === 'induccion_rectora';
  const isAdmin = currentUser?.role === 'admin';

  // Por defecto, la rectora modifica su llave de rectoría, y el admin la de admin
  const [targetKeyRole, setTargetKeyRole] = useState(isRectora ? 'rectora' : 'admin');
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

  useEffect(() => {
    if (isOpen) {
      setTargetKeyRole(isRectora ? 'rectora' : 'admin');
      setCurrentAuthPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, isRectora]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
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
      const res = changeBovedaPassword({
        keyRole: targetKeyRole,
        currentAuthPassword,
        newPassword,
        currentUser
      });

      setStatusMessage(
        `¡Clave de la Bóveda actualizada con éxito! La nueva clave para ${
          targetKeyRole === 'rectora' ? 'Rectoría' : 'Administrador'
        } ha quedado ofuscada de forma segura. Ambas llaves (Rectora y Admin) permanecen válidas concurrentemente.`
      );
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
              <h3 id="bovedaPasswordTitle">Seguridad de la Bóveda • Doble Llave</h3>
              <p>Solo configurable desde el interior de la Bóveda Confidencial</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar modal">
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="modal-body-profile">
          {/* Banner de Doble Llave de Acceso */}
          <div className="boveda-dual-key-banner">
            <div className="dual-key-header">
              <i className="ph-bold ph-shield-check"></i>
              <strong>Sistema de Doble Llave Concurrente</strong>
            </div>
            <p className="dual-key-desc">
              La Bóveda está diseñada para que <strong>tanto la Rectora como el Administrador</strong> puedan entrar 
              con sus contraseñas independientes a la misma bóveda institucional:
            </p>

            <div className="dual-key-grid">
              <div className={`dual-key-badge-card ${targetKeyRole === 'rectora' ? 'active-target' : ''}`}>
                <div className="dual-key-icon"><i className="ph-bold ph-crown"></i></div>
                <div>
                  <strong>Llave de Rectoría</strong>
                  <span>
                    {bovedaCreds.isRectoraCustom 
                      ? '🔒 Personalizada y ofuscada' 
                      : '⚙️ Clave inicial por defecto'}
                  </span>
                </div>
              </div>

              <div className={`dual-key-badge-card ${targetKeyRole === 'admin' ? 'active-target' : ''}`}>
                <div className="dual-key-icon"><i className="ph-bold ph-user-gear"></i></div>
                <div>
                  <strong>Llave de Administración</strong>
                  <span>
                    {bovedaCreds.isAdminCustom 
                      ? '🔒 Personalizada y ofuscada' 
                      : '⚙️ Clave administrativa activa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Llave a Modificar (si es privilegiado) */}
          {(isRectora || isAdmin) && (
            <div className="form-group">
              <label>Seleccione la llave que desea modificar:</label>
              <div className="key-role-selector">
                <button
                  type="button"
                  className={`btn-key-selector ${targetKeyRole === 'rectora' ? 'active' : ''}`}
                  onClick={() => setTargetKeyRole('rectora')}
                >
                  <i className="ph-bold ph-crown"></i>
                  <span>Modificar Clave de Rectoría</span>
                </button>
                <button
                  type="button"
                  className={`btn-key-selector ${targetKeyRole === 'admin' ? 'active' : ''}`}
                  onClick={() => setTargetKeyRole('admin')}
                >
                  <i className="ph-bold ph-user-gear"></i>
                  <span>Modificar Clave de Administrador</span>
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
                Para verificar su identidad institucional antes de aplicar el cambio.
              </small>
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label htmlFor="bovedaNewPass">Nueva Clave de Bóveda</label>
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
                <label htmlFor="bovedaConfirmPass">Confirmar Nueva Clave</label>
                <div className="input-with-action">
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

            <div className="profile-form-actions" style={{ marginTop: '1.25rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary btn-save-password"
                disabled={isSubmitting}
              >
                <i className="ph-bold ph-shield-check"></i>
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
