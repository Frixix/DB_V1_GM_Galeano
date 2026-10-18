import { useState, useEffect } from 'react';
import { USERS } from '../data/users';
import { verifyCredentials, syncVaultWithSupabase, subscribeToVaultChanges, hasCustomPassword } from '../services/authService';
import { syncAvatarsFromCloud, getUserAvatar } from '../services/avatarService';
import './Login.css';

export default function Login({ onLogin }) {
  const [userKey, setUserKey] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [, setVaultTick] = useState(0);

  useEffect(() => {
    // Sincronizar credenciales ofuscadas y avatares desde la nube al cargar
    syncVaultWithSupabase()
      .then(() => setVaultTick((prev) => prev + 1))
      .catch(() => {});
    syncAvatarsFromCloud().catch(() => {});
    
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
    
    const activeAvatar = getUserAvatar(userKey) || expectedUser.avatar || null;
    onLogin({ ...expectedUser, key: userKey, avatar: activeAvatar });
  };

  const handlePillClick = (passKey, pillUserKey) => {
    setPassword(passKey);
    // Asignar el usuario correspondiente automáticamente si no se ha seleccionado ninguno
    if (!userKey) {
      if (pillUserKey) {
        setUserKey(pillUserKey);
      } else if (passKey === 'induccionrectora2026') setUserKey('induccion_rectora');
      else if (passKey === 'induccion2026') setUserKey('induccion');
      else if (passKey === 'rectora2026') setUserKey('claudia');
      else if (passKey === 'jessica2026') setUserKey('jessica');
      else if (passKey === 'yuri2026') setUserKey('yuri');
      else if (passKey === 'elcy2026') setUserKey('elcy');
      else if (passKey === 'profe12026') setUserKey('profe1');
      else if (passKey === 'profe22026') setUserKey('profe2');
      else if (passKey === 'profe32026') setUserKey('profe3');
      else if (passKey === 'admin2026') setUserKey('admin');
    }
  };

  const INITIAL_CREDENTIALS = [
    { userKey: 'induccion_rectora', key: 'induccionrectora2026', label: 'induccionrectora2026' },
    { userKey: 'induccion', key: 'induccion2026', label: 'induccion2026' },
    { userKey: 'claudia', key: 'rectora2026', label: 'rectora2026' },
    { userKey: 'jessica', key: 'jessica2026', label: 'jessica2026' },
    { userKey: 'admin', key: 'admin2026', label: 'admin2026' },
  ];

  // Solo conservamos los atajos de aquellos usuarios cuya contraseña NO ha sido cambiada/personalizada
  const activePills = INITIAL_CREDENTIALS.filter((item) => !hasCustomPassword(item.userKey));

  return (
    <div id="loginScreen" className="auth-split-layout">
      {/* ========================================================
          1. LEFT COLUMN: INSTITUTIONAL BRANDING (Forest Green)
          ======================================================== */}
      <section className="auth-brand-column">
        {/* Líneas topográficas/ondas de fondo */}
        <svg 
          className="auth-topo-svg" 
          viewBox="0 0 800 800" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M-100 180 C 150 90, 320 380, 580 240 S 880 340, 1050 280" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M-100 280 C 180 190, 350 480, 620 330 S 920 430, 1050 370" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M-100 380 C 220 290, 390 580, 660 420 S 960 520, 1050 460" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M-100 480 C 260 390, 430 680, 700 510 S 1000 610, 1050 550" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M-100 580 C 300 490, 470 780, 740 600 S 1040 700, 1050 640" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="680" cy="180" r="260" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="6 6" opacity="0.6" />
          <circle cx="680" cy="180" r="370" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="auth-brand-inner">
          {/* Top Left Header */}
          <div className="auth-brand-header">
            <div className="auth-shield-badge">
              {/* Escudo minimalista con monograma MG */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 6V12C3 17.5 6.8 22.3 12 23.5C17.2 22.3 21 17.5 21 12V6L12 2Z" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeWidth="1.7" />
                <text x="12" y="15.2" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="800" fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="-0.5">MG</text>
              </svg>
            </div>
            <div className="auth-brand-text">
              <span className="auth-brand-school-name">Gimnasio Martin Galeano</span>
              <span className="auth-brand-school-sub">Sistema Integral - Básica Primaria</span>
            </div>
          </div>

          {/* Center Content Area */}
          <div className="auth-brand-center">
            <h1 className="auth-hero-heading">
              Todo el colegio,{"\n"}en un solo lugar.
            </h1>
            <p className="auth-hero-subtitle">
              Documentos, calificaciones y gestión académica con la claridad que tu equipo necesita.
            </p>
          </div>

          {/* Bottom Footer: Social proof / Connected staff */}
          <div className="auth-social-proof">
            <div className="auth-avatar-stack">
              <div className="auth-stack-avatar" style={{ backgroundColor: '#059669' }}>JP</div>
              <div className="auth-stack-avatar" title="Claudia (Rectora)" style={{ backgroundColor: '#047857' }}>
                <img 
                  src="/images/avatars/rectora.svg" 
                  alt="Rectora" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span style={{ fontSize: '0.75rem' }}>👑</span>
              </div>
              <div className="auth-stack-avatar" style={{ backgroundColor: '#10b981' }}>YC</div>
              <div className="auth-stack-avatar" style={{ backgroundColor: '#15803d' }}>EC</div>
              <div className="auth-stack-avatar auth-stack-more">+12</div>
            </div>
            <span className="auth-social-label">Personal conectado en la plataforma</span>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. RIGHT COLUMN: CENTERED AUTH CARD (Clean Slate & White)
          ======================================================== */}
      <section className="auth-form-column">
        <div className="auth-card-container">
          <div className="auth-card">
            {/* Floating Shield Monogram on top of card */}
            <div className="auth-card-monogram-badge">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 6V12C3 17.5 6.8 22.3 12 23.5C17.2 22.3 21 17.5 21 12V6L12 2Z" fill="#15803d" />
                <path d="M12 3.8L4.5 7.2V12C4.5 16.5 7.6 20.6 12 21.8C16.4 20.6 19.5 16.5 19.5 12V7.2L12 3.8Z" fill="#16a34a" fillOpacity="0.85" />
                <text x="12" y="15.2" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800" fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="-0.5">MG</text>
              </svg>
            </div>

            {/* Card Header */}
            <div className="auth-card-header">
              <h2 className="auth-card-title">Gimnasio Martin Galeano</h2>
              <p className="auth-card-subtitle">Módulo Documental • Básica Primaria</p>
            </div>

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit}>
              {/* Select Dropdown */}
              <div className="auth-form-field">
                <label className="auth-label" htmlFor="authSelectUser">
                  Seleccione usuario
                </label>
                <div className="auth-select-wrapper">
                  <select
                    id="authSelectUser"
                    className="auth-select"
                    value={userKey}
                    onChange={(e) => setUserKey(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Seleccione su cuenta --</option>
                    <option value="induccion_rectora"> Inducción Rectora</option>
                    <option value="induccion"> Inducción Profesoras</option>
                    <option value="claudia">Claudia (Rectora)</option>
                    <option value="profe1">Profe 1 </option>
                    <option value="jessica">Jessica </option>
                    <option value="yuri">Yuri </option>
                    <option value="profe2">Profe 2 </option>
                    <option value="elcy">Elcy </option>
                    <option value="profe3">Profe 3 </option>
                    <option value="admin">Administrador</option>
                  </select>
                  <span className="auth-select-chevron">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </div>
              </div>

              {/* Error Alert */}
              {loginError && (
                <div className="auth-error-alert">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{loginError}</span>
                </div>
              )}

              {/* Password Input */}
              <div className="auth-form-field">
                <label className="auth-label" htmlFor="authPassword">
                  Contraseña
                </label>
                <div className="auth-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="authPassword"
                    className="auth-input"
                    placeholder="Ingrese contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-input-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      /* EyeOff SVG */
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      /* Eye SVG */
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Helper Box: Clave inicial asignada por docente (visible por primera vez, eliminada al cambiarla) */}
                {userKey && USERS[userKey] && !hasCustomPassword(userKey) && (
                  <div className="auth-credentials-box">
                    <span className="auth-credentials-title">
                      Clave inicial de {USERS[userKey].name} (visible primera vez):
                    </span>
                    <div className="auth-credentials-pills">
                      <button
                        type="button"
                        className="auth-credential-pill auth-pill-boveda"
                        onClick={() => setPassword(USERS[userKey].pass)}
                        title={`Clic para autocompletar clave inicial: ${USERS[userKey].pass}`}
                      >
                        {USERS[userKey].pass}
                      </button>
                    </div>
                  </div>
                )}

                {userKey && hasCustomPassword(userKey) && (
                  <div className="auth-credentials-secure-hint">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>Contraseña personalizada activa (clave inicial eliminada)</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button type="submit" className="auth-submit-btn">
                <span>Iniciar Sesión</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </form>
          </div>

          {/* Bottom Center Text */}
          <div className="auth-footer-tag">
            <div className="auth-footer-version">MG Workspace v2.0.0</div>
            <div className="auth-footer-credit">
              desarrollado por <span className="auth-footer-brand">&lt;Frix.io/&gt;</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            3. FLOATING BADGES & FOOTER (Glassmorphism Pill)
            ======================================================== */}
        <div className="auth-floating-trial-pill">
          <span className="auth-trial-pulse-dot"></span>
          <span>FASE DE PRUEBA · 2 GB</span>
        </div>
      </section>
    </div>
  );
}