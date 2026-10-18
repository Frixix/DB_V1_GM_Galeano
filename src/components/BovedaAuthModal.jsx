import { useState } from 'react';
import { verifyBovedaPassword, getBovedaCredentials } from '../services/authService';

export default function BovedaAuthModal({ isOpen, onClose, onSuccess, currentUser }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';
  const { isRectoraCustom } = getBovedaCredentials();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const res = verifyBovedaPassword(password, currentUser);
    if (res.valid) {
      setPassword('');
      setErrorMessage('');
      onSuccess(); // Desbloquea la bóveda
    } else {
      setErrorMessage(res.error || '❌ Clave de seguridad incorrecta. Acceso a la bóveda denegado.');
      setPassword('');
    }
  };

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div className="modal modal-auth" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon boveda-modal-icon">
              <i className="ph-bold ph-lock-key"></i>
            </div>
            <div>
              <h3>Bóveda de Archivos Confidencial</h3>
              <p>Acceso restringido • Documentación de Alta Seguridad</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><i className="ph-bold ph-x"></i></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>
            Esta área contiene archivos directivos de alta seguridad (hasta 2 GB). Ingrese la clave institucional para acceder:
          </p>

          {errorMessage && (
            <div className="alert-box alert-error" style={{ margin: 0, padding: '0.65rem 0.85rem' }}>
              <i className="ph-bold ph-warning-circle"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="bovedaPassword">Clave de Seguridad de la Bóveda</label>
            <div className="input-with-action">
              <input 
                type={showPassword ? 'text' : 'password'}
                id="bovedaPassword" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Ingrese clave de bóveda" 
                required 
                autoFocus
              />
              <button
                type="button"
                className="btn-toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
                tabIndex={-1}
              >
                <i className={`ph-bold ${showPassword ? 'ph-eye-slash' : 'ph-eye'}`}></i>
              </button>
            </div>
            <small className="helper-text" style={{ marginTop: '6px' }}>
              {isAdmin ? (
                <span style={{ color: '#065f46', fontWeight: 600 }}>
                  ⚙️ Modo Administrador: Sistema de respaldo y doble llave activa.
                </span>
              ) : isRectoraCustom ? (
                <span style={{ color: '#059669', fontWeight: 600 }}>
                  🔒 Clave de seguridad de la Bóveda activa y protegida.
                </span>
              ) : (
                <>
                  Clave de acceso requerida (inicial institucional: <code>boveda2026</code>).
                </>
              )}
            </small>
          </div>

          <div className="modal-footer" style={{ padding: 0, marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0f172a' }}>
              <i className="ph-bold ph-key"></i> Desbloquear Bóveda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}