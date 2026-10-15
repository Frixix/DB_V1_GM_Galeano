import { useState, useEffect } from 'react';
import { 
  resolveUserKey, 
  hasCustomPassword, 
  getPasswordUpdatedAt, 
  changeUserPassword 
} from '../services/authService';

export default function ProfileModal({ isOpen, onClose, currentUser, onProfileUpdated }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userKey = currentUser ? resolveUserKey(currentUser) : null;
  const isCustom = userKey ? hasCustomPassword(userKey) : false;
  const lastUpdated = userKey ? getPasswordUpdatedAt(userKey) : null;

  // Limpiar campos al abrir / cerrar
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const isRectora = currentUser.role === 'rectora' || currentUser.role === 'induccion_rectora';

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Por favor ingrese su contraseña actual para autorizar el cambio.');
      return;
    }

    if (newPassword.length < 5) {
      setErrorMessage('La nueva contraseña debe tener como mínimo 5 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('La nueva contraseña debe ser diferente a la contraseña actual.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = changeUserPassword(userKey, currentPassword, newPassword);
      setStatusMessage(
        '¡Contraseña actualizada con éxito! La clave anterior por defecto fue eliminada del sistema y la nueva ha quedado ofuscada de forma segura.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onProfileUpdated) {
        onProfileUpdated(userKey);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div 
        className="modal modal-profile" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog"
        aria-labelledby="profileModalTitle"
      >
        {/* Encabezado del Modal */}
        <div className="modal-header modal-header-profile">
          <div className="modal-title-wrap">
            <div className={`modal-icon ${isRectora ? 'profile-avatar-rectora' : ''}`}>
              {isRectora ? <i className="ph-bold ph-crown"></i> : <i className="ph-bold ph-user"></i>}
            </div>
            <div>
              <h3 id="profileModalTitle">
                {isRectora ? 'Perfil Directivo • Rectoría' : `Perfil Institucional • ${currentUser.name}`}
              </h3>
              <p>Gimnasio Martin Galeano • Básica Primaria</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar modal">
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="modal-body-profile">
          {/* Tarjeta de Identidad y Rol */}
          <div className="profile-identity-card">
            <div className="profile-avatar-large">
              {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="profile-avatar-img-lg"
                  onError={(e) => { e.currentTarget.style.display = 'none'; const f = e.currentTarget.nextSibling; if (f) f.style.display = 'flex'; }}
                />
              ) : null}
              <span className="profile-avatar-initial" style={{ display: currentUser.avatar ? 'none' : 'flex' }}>
                {currentUser.initial}
              </span>
              {isRectora && <span className="profile-crown-badge">👑</span>}
            </div>
            <div className="profile-identity-details">
              <h4>{currentUser.name}</h4>
              <span className="profile-role-tag">
                <i className="ph-bold ph-shield-check"></i> {currentUser.label}
              </span>
              <p className="profile-institution-text">
                Gestión Académica y Documental • Sede Básica Primaria
              </p>
            </div>
          </div>

          {/* Características y Capacidades del Perfil */}
          <div className="profile-section">
            <h5 className="profile-section-title">
              <i className="ph-bold ph-sparkle"></i> Características y Atribuciones del Perfil
            </h5>
            <div className="profile-features-grid">
              <div className="profile-feature-item">
                <div className="feature-icon"><i className="ph-bold ph-hard-drives"></i></div>
                <div className="feature-info">
                  <strong>Capacidad de Almacenamiento</strong>
                  <span>Límite de {currentUser.maxUploadLabel} por archivo ({currentUser.maxUploadBytes > 50 * 1024 * 1024 ? 'Modo Directivo Ampliado' : 'Estándar'})</span>
                </div>
              </div>

              {isRectora && (
                <>
                  <div className="profile-feature-item">
                    <div className="feature-icon"><i className="ph-bold ph-vault"></i></div>
                    <div className="feature-info">
                      <strong>Bóveda Institucional de Seguridad</strong>
                      <span>Habilitada para resguardo de actas y documentos confidenciales</span>
                    </div>
                  </div>

                  <div className="profile-feature-item">
                    <div className="feature-icon"><i className="ph-bold ph-megaphone"></i></div>
                    <div className="feature-info">
                      <strong>Emisión Oficial de Circulares</strong>
                      <span>Firma y difusión con confirmación de lectura en tiempo real</span>
                    </div>
                  </div>

                  <div className="profile-feature-item">
                    <div className="feature-icon"><i className="ph-bold ph-users-three"></i></div>
                    <div className="feature-info">
                      <strong>Supervisión Docente</strong>
                      <span>Auditoría de planeaciones de Jessica, Yuri y Elcy</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Estado de Seguridad y Ofuscación */}
          <div className="profile-section">
            <h5 className="profile-section-title">
              <i className="ph-bold ph-lock-key"></i> Seguridad y Credenciales Institucionales
            </h5>

            {isCustom ? (
              <div className="security-status-banner secure">
                <div className="status-icon"><i className="ph-bold ph-shield-check"></i></div>
                <div className="status-text">
                  <strong>Contraseña Personalizada y Protegida</strong>
                  <p>
                    La contraseña anterior por defecto fue <strong>eliminada</strong>. Su clave actual se encuentra 
                    ofuscada con un cifrado interno que solo esta aplicación puede descifrar, protegida contra inspecciones en el repositorio.
                  </p>
                  {lastUpdated && (
                    <small className="status-date">
                      Última modificación: {new Date(lastUpdated).toLocaleDateString()} a las {new Date(lastUpdated).toLocaleTimeString()}
                    </small>
                  )}
                </div>
              </div>
            ) : (
              <div className="security-status-banner warning">
                <div className="status-icon"><i className="ph-bold ph-warning"></i></div>
                <div className="status-text">
                  <strong>Contraseña inicial por defecto activa</strong>
                  <p>
                    Actualmente este perfil utiliza la clave predeterminada del sistema. Le recomendamos modificarla a continuación. 
                    Al hacerlo, la clave por defecto se eliminará por completo y la nueva quedará ofuscada.
                  </p>
                </div>
              </div>
            )}

            {/* Mensajes de Alerta / Éxito */}
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

            {/* Formulario de Cambio de Contraseña */}
            <form className="password-change-form" onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label htmlFor="currentPasswordInput">Contraseña actual</label>
                <div className="input-with-action">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    id="currentPasswordInput"
                    placeholder="Ingrese su contraseña actual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
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
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label htmlFor="newPasswordInput">Nueva contraseña</label>
                  <div className="input-with-action">
                    <input
                      type={showNew ? 'text' : 'password'}
                      id="newPasswordInput"
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
                  <label htmlFor="confirmPasswordInput">Confirmar contraseña</label>
                  <div className="input-with-action">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      id="confirmPasswordInput"
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

              <div className="profile-form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-save-password"
                  disabled={isSubmitting}
                >
                  <i className="ph-bold ph-shield-check"></i>
                  <span>{isSubmitting ? 'Guardando y Ofuscando...' : 'Guardar y Ofuscar Contraseña'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
