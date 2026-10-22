import { useState, useEffect } from 'react';
import { USERS } from '../data/users';
import { 
  verifyCredentials, 
  syncVaultWithSupabase, 
  subscribeToVaultChanges, 
  hasCustomPassword,
  resetUserPasswordToDefault,
  resetAllStaffPasswordsToDefault,
  DEFAULT_PASSWORDS
} from '../services/authService';
import { syncAvatarsFromCloud, getUserAvatar } from '../services/avatarService';
import teacherService from '../services/teacherService.js';
import './Login.css';

const STAFF_MEMBERS = [
  { key: 'claudia', name: 'Claudia (Rectora)', roleTitle: 'Rectora', grade: 'Rectoría Institucional' },
  { key: 'coordinacion', name: 'Coordinación Académica', roleTitle: 'Coordinación', grade: 'Supervisión Institucional' },
  { key: 'profe0', name: 'Profe Pre-Jardín', roleTitle: 'Docente', grade: 'Dir. Pre-Jardín' },
  { key: 'profe1', name: 'Profe 1', roleTitle: 'Docente', grade: 'Dir. Transición' },
  { key: 'jessica', name: 'Jessica', roleTitle: 'Docente Español', grade: 'Dir. 1° Primaria' },
  { key: 'yuri', name: 'Yuri', roleTitle: 'Docente C. Sociales', grade: 'Dir. 2° Primaria' },
  { key: 'profe2', name: 'Profe 2', roleTitle: 'Docente Matemáticas', grade: 'Dir. 3° Primaria' },
  { key: 'elcy', name: 'Elcy', roleTitle: 'Docente Inglés', grade: 'Dir. 4° Primaria' },
  { key: 'profe3', name: 'Profe 3', roleTitle: 'Docente C. Naturales', grade: 'Dir. 5° Primaria' },
];

export default function Login({ onLogin }) {
  const [userKey, setUserKey] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [, setVaultTick] = useState(0);
  const [resetToast, setResetToast] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [loginOptions, setLoginOptions] = useState(() => teacherService.getLoginSelectOptions());
  const [staffMembers, setStaffMembers] = useState(() => teacherService.getStaffMembersForLogin());

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

    // Escuchar actualizaciones dinámicas de docentes y asignaciones en Gestión Docente
    const unsubscribeTeachers = teacherService.subscribe(() => {
      setLoginOptions(teacherService.getLoginSelectOptions());
      setStaffMembers(teacherService.getStaffMembersForLogin());
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (typeof unsubscribeTeachers === 'function') unsubscribeTeachers();
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

  const handleResetSingleUser = async (targetKey) => {
    if (!targetKey) return;
    setIsResetting(true);
    setLoginError('');
    try {
      const res = await resetUserPasswordToDefault(targetKey);
      if (res.success) {
        setUserKey(targetKey);
        setPassword(res.defaultPass || '');
        setVaultTick((prev) => prev + 1);
        setResetToast({
          type: 'success',
          message: `✓ Clave de ${res.userName} restablecida por defecto (${res.defaultPass}). Como si fuera su primer ingreso.`
        });
        setTimeout(() => setResetToast(null), 6000);
      } else {
        setResetToast({
          type: 'error',
          message: `No se pudo restablecer la clave: ${res.error || 'Error desconocido'}`
        });
      }
    } catch (err) {
      setResetToast({
        type: 'error',
        message: 'Error al restablecer la contraseña por defecto.'
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetAllStaff = async () => {
    setIsResetting(true);
    setLoginError('');
    try {
      const res = await resetAllStaffPasswordsToDefault();
      if (res.success) {
        setVaultTick((prev) => prev + 1);
        setResetToast({
          type: 'success',
          message: `✓ Se restablecieron a valores de fábrica las claves de todas las profesoras y rectora (${res.count} cuentas).`
        });
        setTimeout(() => setResetToast(null), 6000);
      }
    } catch (err) {
      setResetToast({
        type: 'error',
        message: 'Error al restablecer las claves.'
      });
    } finally {
      setIsResetting(false);
    }
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
      else if (passKey === 'coordinacion2026') setUserKey('coordinacion');
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
    { userKey: 'coordinacion', key: 'coordinacion2026', label: 'coordinacion2026' },
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
        {/* Patrón académico refinado: cuadrícula y líneas de diploma con visibilidad calibrada */}
        <svg 
          className="auth-topo-svg" 
          viewBox="0 0 1000 1000" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Cuadrícula geométrica institucional suave pero visible */}
            <pattern id="academicGrid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#000000" strokeWidth="0.9" opacity="0.28" />
              <path d="M 47.5 0 L -0.5 0 -0.5 47.5" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.12" />
              <circle cx="48" cy="0" r="1" fill="#ffffff" opacity="0.22" />
            </pattern>

            {/* Líneas diagonales de seguridad / diploma */}
            <pattern id="diplomaLines" width="70" height="70" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="70" stroke="#000000" strokeWidth="1.2" opacity="0.22" />
              <line x1="35" y1="0" x2="35" y2="70" stroke="#ffffff" strokeWidth="0.8" opacity="0.10" />
            </pattern>

            {/* Halo de luz central */}
            <radialGradient id="softCenterGlow" cx="30%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.14" />
              <stop offset="65%" stopColor="#15803d" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Capas de patrones */}
          <rect width="1000" height="1000" fill="url(#academicGrid)" />
          <rect width="1000" height="1000" fill="url(#diplomaLines)" opacity="0.65" />
          <rect width="1000" height="1000" fill="url(#softCenterGlow)" />

          {/* Ondas fluidas de certificación (visibles, dignas y elegantes) */}
          <g>
            {/* Sombra de relieve negra */}
            <path d="M-60 220 C 220 140, 420 440, 720 280 S 1080 380, 1180 320" stroke="#000000" strokeWidth="3" opacity="0.30" />
            <path d="M-60 380 C 240 280, 440 570, 740 410 S 1100 510, 1180 450" stroke="#000000" strokeWidth="3" opacity="0.26" />
            <path d="M-60 540 C 260 440, 460 710, 760 550 S 1120 650, 1180 590" stroke="#000000" strokeWidth="2.5" opacity="0.22" />

            {/* Trazo blanco de luz nítido */}
            <path d="M-60 217 C 220 137, 420 437, 720 277 S 1080 377, 1180 317" stroke="#ffffff" strokeWidth="1.5" opacity="0.18" />
            <path d="M-60 377 C 240 277, 440 567, 740 407 S 1100 507, 1180 447" stroke="#ffffff" strokeWidth="1.5" opacity="0.15" />
            <path d="M-60 537 C 260 437, 460 707, 760 547 S 1120 647, 1180 587" stroke="#ffffff" strokeWidth="1.2" opacity="0.12" />

            {/* Círculos concéntricos de compás académico en esquina superior */}
            <circle cx="860" cy="140" r="160" stroke="#000000" strokeWidth="2" opacity="0.25" />
            <circle cx="860" cy="140" r="161" stroke="#ffffff" strokeWidth="1" opacity="0.16" strokeDasharray="4 6" />
            <circle cx="860" cy="140" r="280" stroke="#000000" strokeWidth="2" opacity="0.22" strokeDasharray="6 6" />
            <circle cx="860" cy="140" r="281" stroke="#ffffff" strokeWidth="1.2" opacity="0.15" strokeDasharray="6 6" />
            <circle cx="860" cy="140" r="400" stroke="#000000" strokeWidth="1.8" opacity="0.18" />
            <circle cx="860" cy="140" r="401" stroke="#ffffff" strokeWidth="1" opacity="0.12" />
          </g>
        </svg>

        <div className="auth-brand-inner">
          {/* Top Left Header: EducoKrea (Marca de la Plataforma) + Colegio Martín Galeano */}
          <div className="auth-brand-top-header">
            {/* Logo e Identidad EducoKrea: Fénix en Origami */}
            <div className="auth-educokrea-brand-badge">
              <div className="auth-educokrea-emblem-wrap">
                <img 
                  src="/images/educokrea/symbol.svg" 
                  alt="EducoKrea Fénix" 
                  width="44" 
                  height="44" 
                  style={{ display: 'block', borderRadius: '12px' }}
                />
              </div>
              <div className="auth-educokrea-text-block">
                <span className="auth-educokrea-logotype">
                  Educo<span className="auth-krea-highlight">Krea</span>
                </span>
                <span className="auth-educokrea-subpill">PLATAFORMA EDUCATIVA</span>
              </div>
            </div>

            {/* Fila institucional: Gimnasio Martin Galeano con su escudo MG */}
            <div className="auth-brand-school-row">
              <div className="auth-shield-badge" title="Portal Gimnasio Martin Galeano">
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

          {/* Bottom Footer: Social proof / Connected staff (Tarjeta Glassmorphism Premium Dinámica) */}
          <div className="auth-social-card auth-social-proof">
            <div className="auth-avatar-stack">
              {staffMembers.slice(0, 4).map((staff, idx) => {
                const avatarUrl = getUserAvatar(staff.key) || USERS[staff.key]?.avatar;
                const initial = USERS[staff.key]?.initial || staff.name.charAt(0);
                const bgColors = ['#7c3aed', '#047857', '#059669', '#1d4ed8'];
                const bg = bgColors[idx % bgColors.length];

                return (
                  <div key={staff.key} className="auth-stack-avatar" style={{ backgroundColor: bg }}>
                    <div className="auth-stack-avatar-inner">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt={staff.name} 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : null}
                      <span className="auth-avatar-initial">{initial}</span>
                    </div>
                    <span className="auth-avatar-tooltip">{staff.name} • {staff.roleTitle}</span>
                  </div>
                );
              })}

              <div className="auth-stack-avatar auth-stack-more">
                <div className="auth-stack-avatar-inner">
                  <span>+{Math.max(1, staffMembers.length - 4)}</span>
                </div>
                <span className="auth-avatar-tooltip">Planta docente activa</span>
              </div>
            </div>

            <div className="auth-social-divider" aria-hidden="true"></div>

            <div className="auth-social-text">
              <div className="auth-social-title-row">
                <span className="auth-live-pulse-wrapper" title="Conexión en tiempo real activa">
                  <span className="auth-live-pulse-ring"></span>
                  <span className="auth-live-pulse-core"></span>
                </span>
                <span className="auth-social-title">Personal activo en la plataforma</span>
                <span className="auth-social-badge">En vivo</span>
              </div>
              <span className="auth-social-subtitle">
                Equipo docente y directivo sincronizado
              </span>
            </div>
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
                    {loginOptions.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
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
                    <div className="auth-hint-text-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      <span>Contraseña personalizada activa (clave inicial eliminada)</span>
                    </div>
                    {/* Botón temporal rápido para restablecer clave del usuario seleccionado (Comentado temporalmente)
                    <button
                      type="button"
                      className="auth-btn-reset-single-inline"
                      onClick={() => handleResetSingleUser(userKey)}
                      disabled={isResetting}
                      title={`Restablecer contraseña por defecto de ${USERS[userKey]?.name || userKey} a valor de fábrica`}
                    >
                      ↺ Reestablecer clave (por defecto)
                    </button>
                    */}
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

            {/* Mensaje flotante de confirmación de restablecimiento */}
            {resetToast && (
              <div className={`auth-reset-toast ${resetToast.type}`}>
                <div className="auth-reset-toast-body">
                  <span className="auth-reset-toast-icon">
                    {resetToast.type === 'success' ? '✓' : '⚠️'}
                  </span>
                  <span>{resetToast.message}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setResetToast(null)} 
                  className="auth-reset-toast-close"
                  aria-label="Cerrar notificación"
                >
                  ×
                </button>
              </div>
            )}

            {/* ========================================================
                PANEL TEMPORAL DE PRUEBAS: REESTABLECER CLAVE (POR DEFECTO)
                (Comentado temporalmente)
                ======================================================== */}
            {/*
            <div className="auth-dev-reset-panel">
              <div className="auth-dev-reset-header">
                <div className="auth-dev-reset-title-group">
                  <span className="auth-dev-badge">TEMPORAL</span>
                  <span className="auth-dev-title-text">Reestablecer Claves (Por Defecto)</span>
                </div>
                <button
                  type="button"
                  className="auth-btn-reset-all"
                  onClick={handleResetAllStaff}
                  disabled={isResetting}
                  title="Restablecer todas las profesoras y rectora a sus contraseñas iniciales de fábrica"
                >
                  ↺ Reestablecer Todas
                </button>
              </div>

              <p className="auth-dev-reset-desc">
                Restaura el perfil como si nunca hubiera cambiado su clave (se le solicitará crear una nueva al iniciar sesión):
              </p>

              <div className="auth-dev-reset-grid">
                {staffMembers.map((staff) => {
                  const isCustom = hasCustomPassword(staff.key);
                  return (
                    <button
                      key={staff.key}
                      type="button"
                      className={`auth-dev-staff-btn ${isCustom ? 'is-custom' : 'is-default'} ${userKey === staff.key ? 'is-selected' : ''}`}
                      onClick={() => handleResetSingleUser(staff.key)}
                      disabled={isResetting}
                      title={`Clic para restablecer y seleccionar a ${staff.name} (${staff.grade})`}
                    >
                      <div className="auth-dev-staff-meta">
                        <span className="auth-dev-staff-name">{staff.name}</span>
                        <span className="auth-dev-staff-grade">{staff.grade}</span>
                      </div>
                      <span className={`auth-dev-status-tag ${isCustom ? 'tag-custom' : 'tag-default'}`}>
                        {isCustom ? '↺ Reestablecer' : '✓ Por defecto'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            */}
          </div>

          {/* Bottom Center Text */}
          <div className="auth-footer-tag">
            <div className="auth-footer-version">MG Workspace v2.1.0</div>
            <div className="auth-footer-credit">
              desarrollado por <span className="auth-footer-brand">&lt;FrixMoon.io/&gt;</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            3. FLOATING BADGES & FOOTER (Glassmorphism Pill)
            ======================================================== */}
        <div className="auth-floating-trial-pill">
          <span className="auth-trial-pulse-dot"></span>
          <span>VERSIÓN INSTITUCIONAL · 2026</span>
        </div>
      </section>
    </div>
  );
}