import { useState } from 'react';
import { USERS } from '../data/users';

export default function Login({ onLogin }) {
  const [userKey, setUserKey] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userKey || !USERS[userKey]) {
      alert("Por favor selecciona un usuario institucional.");
      return;
    }
    
    const expectedUser = USERS[userKey];
    if (password !== expectedUser.pass) {
      alert(`Contraseña incorrecta para ${expectedUser.name}.`);
      setPassword('');
      return;
    }
    
    onLogin(expectedUser);
  };

  return (
    <div id="loginScreen" className="login-wrapper">
      <div className="login-card">
        
        <div className="login-brand">
          <div className="brand-icon-lg">
            <i className="ph-bold ph-graduation-cap"></i>
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

          <div className="form-group">
            <label htmlFor="loginPassword">Contraseña</label>
            <input 
              type="password" 
              id="loginPassword" 
              placeholder="Ingrese contraseña" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <small className="helper-text">
              Claves: <code>induccionrectora2026</code>, <code>induccion2026</code>, <code>rectora2026</code>, <code>jessica2026</code>, <code>admin2026</code>
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