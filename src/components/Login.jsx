import { useState, useEffect } from 'react';
import { USERS } from '../data/users';
import { verifyCredentials, hasCustomPassword, syncVaultWithSupabase, subscribeToVaultChanges } from '../services/authService';

export default function Login({ onLogin }) {
  const [userKey, setUserKey] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [, setVaultTick] = useState(0);

  useEffect(() => {
    // Sincronizar credenciales ofuscadas desde la nube al cargar
    syncVaultWithSupabase().catch(() => {});
    
    // Escuchar cambios en tiempo real si otra pestaña o dispositivo actualiza la bóveda
    const unsubscribe = subscribeToVaultChanges(() => {
      setVaultTick((prev) => prev + 1);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!userKey || !USERS[userKey]) {
      setLoginError("Por favor selecciona un usuario institucional.");
      return;
    }
    
    const expectedUser = USERS[userKey];
    if (!verifyCredentials(userKey, password)) {
      setLoginError(`Contraseña incorrecta para ${expectedUser.name}.`);
      setPassword('');
      return;
    }
    
    onLogin({ ...expectedUser, key: userKey });
  };

  return (
    <div id="loginScreen" className="login-wrapper">
      <div className="login-card">
        
        <div className="login-brand">
          <div className="brand-icon-lg">
            <img 
              src="/images/logos/logo.svg" 
              alt="Logo Gimnasio Martin Galeano" 
              className="brand-logo-img-lg"
              onError={(e) => { e.currentTarget.style.display = 'none'; const f = e.currentTarget.nextSibling; if (f) f.style.display = 'block'; }}
            />
            <i className="ph-bold ph-graduation-cap" style={{ display: 'none' }}></i>
          </div>
          <h2>Gimnasio Martin Galeano</h2>
          <p>Módulo Documental • Básica Primaria</p>
        </div>

        <form id="loginForm" className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginUserSelect">Seleccione usuario</label>
            <select 
              id="loginUserSelect" 
              value={userKey} 
              onChange={(e) => setUserKey(e.target.value)} 
              required
            >
              <option value="" disabled>-- Seleccione su cuenta --</option>
              <option value="induccion_rectora">👑 Inducción Rectora (Tour Directivo)</option>
              <option value="induccion">✨ Inducción Profesoras (Tour Docente)</option>
              <option value="claudia">Claudia (Rectora)</option>
              <option value="jessica">Jessica</option>
              <option value="yuri">Yuri</option>
              <option value="elcy">Elcy</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {loginError && (
            <div className="login-error-alert" style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="ph-bold ph-warning-circle"></i>
              <span>{loginError}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="loginPassword">Contraseña</label>
            <div className="input-with-action" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                id="loginPassword" 
                placeholder="Ingrese contraseña" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                style={{ width: '100%', paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                className="btn-toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <i className={`ph-bold ${showPassword ? 'ph-eye-slash' : 'ph-eye'}`}></i>
              </button>
            </div>
            <small className="helper-text">
              {userKey && hasCustomPassword(userKey) ? (
                <span style={{ color: '#065f46', fontWeight: 600 }}>
                  🔒 Este perfil tiene una contraseña personalizada activa y protegida.
                </span>
              ) : (
                <>
                  Claves iniciales: <code>induccionrectora2026</code>, <code>induccion2026</code>,{' '}
                  <code>rectora2026</code>, <code>jessica2026</code>, <code>admin2026</code>
                </>
              )}
            </small>
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            <i className="ph-bold ph-sign-in"></i> Iniciar Sesión
          </button>
        </form>

      </div>
    </div>
  );
}