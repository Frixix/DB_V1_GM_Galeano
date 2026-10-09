import { useState } from 'react';

export default function BovedaAuthModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.trim() === 'boveda2026') {
      setPassword('');
      onSuccess(); // Desbloquea la bóveda
    } else {
      alert('❌ Clave de seguridad incorrecta. Acceso a la bóveda denegado.');
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
              <p>Acceso restringido para Rectoría y Administrador</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><i className="ph-bold ph-x"></i></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#475569' }}>
            Esta área contiene archivos directivos de hasta 2 GB organizados por años y subcarpetas. Ingrese la clave para acceder:
          </p>

          <div className="form-group">
            <label htmlFor="bovedaPassword">Clave de Seguridad de la Bóveda</label>
            <input 
              type="password" 
              id="bovedaPassword" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese clave de bóveda" 
              required 
              autoFocus
            />
            <small className="helper-text">Clave de acceso: <code>boveda2026</code></small>
          </div>

          <div className="modal-footer" style={{ padding: 0, marginTop: '0.5rem' }}>
            <button type="button" class="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" class="btn btn-primary" style={{ backgroundColor: '#0f172a' }}>
              <i className="ph-bold ph-key"></i> Desbloquear Bóveda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}