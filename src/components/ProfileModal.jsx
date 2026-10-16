import { useState, useEffect, useRef } from 'react';
import { 
  resolveUserKey, 
  hasCustomPassword, 
  getPasswordUpdatedAt, 
  changeUserPassword 
} from '../services/authService';
import { 
  PRESET_AVATARS, 
  getUserAvatar, 
  saveUserAvatar, 
  resetUserAvatar, 
  processAvatarImageFile 
} from '../services/avatarService';
import { USERS } from '../data/users';

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  initialTargetUserKey,
  onProfileUpdated,
  onAvatarUpdated 
}) {
  const [activeTab, setActiveTab] = useState('avatar'); // 'avatar' | 'security' | 'features'

  // Estados de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Estados de Logo / Avatar
  const currentUserKey = currentUser ? resolveUserKey(currentUser) : null;
  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora'].includes(currentUser.role);

  // Usuario seleccionado para editar su logo (para Rectora/Admin pueden seleccionar cualquier docente)
  const [targetUserKey, setTargetUserKey] = useState(initialTargetUserKey || currentUserKey || 'claudia');
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [avatarStatus, setAvatarStatus] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const fileInputRef = useRef(null);

  // Sincronizar targetUserKey cuando se abre el modal o cambia initialTargetUserKey
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStatus(null);
      setPasswordError(null);
      setAvatarStatus(null);
      setAvatarError(null);
      setPendingAvatar(null);

      const chosenKey = initialTargetUserKey || currentUserKey || 'claudia';
      setTargetUserKey(chosenKey);

      // Si se abre para un usuario distinto al logueado, enfocar automáticamente en la pestaña de Logo
      if (initialTargetUserKey && initialTargetUserKey !== currentUserKey) {
        setActiveTab('avatar');
      }
    }
  }, [isOpen, initialTargetUserKey, currentUserKey]);

  // Resolver información del usuario objetivo
  const targetUser = USERS[targetUserKey] || currentUser;
  const isEditingSelf = targetUserKey === currentUserKey;
  const isTargetRectora = targetUser?.role === 'rectora' || targetUser?.role === 'induccion_rectora';
  const targetUserAvatar = pendingAvatar !== null ? pendingAvatar : (getUserAvatar(targetUserKey) || targetUser?.avatar || null);

  // Cuando cambia el usuario objetivo a editar
  const handleSelectTargetUser = (key) => {
    setTargetUserKey(key);
    setPendingAvatar(null);
    setAvatarStatus(null);
    setAvatarError(null);
  };

  if (!isOpen || !currentUser) return null;

  const isRectora = currentUser.role === 'rectora' || currentUser.role === 'induccion_rectora';
  const isCustomPass = currentUserKey ? hasCustomPassword(currentUserKey) : false;
  const lastPassUpdated = currentUserKey ? getPasswordUpdatedAt(currentUserKey) : null;

  // Manejador para subir archivo desde dispositivo
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setAvatarStatus(null);
    setIsProcessingImage(true);

    try {
      const optimizedDataUrl = await processAvatarImageFile(file, 256, 0.85);
      setPendingAvatar(optimizedDataUrl);
      setAvatarStatus('Imagen cargada y optimizada en alta resolución. Haz clic en "Guardar Logo en la Nube" para aplicar y sincronizar.');
    } catch (err) {
      setAvatarError(err.message || 'Error al procesar la imagen.');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Manejador para seleccionar un preset de la galería
  const handleSelectPreset = (presetUrl) => {
    setAvatarError(null);
    setAvatarStatus(null);
    setPendingAvatar(presetUrl);
  };

  // Guardar en la nube el nuevo logo/avatar
  const handleSaveAvatar = async () => {
    if (!pendingAvatar) {
      setAvatarError('Por favor seleccione un logo de la galería o suba una imagen antes de guardar.');
      return;
    }

    setIsSavingAvatar(true);
    setAvatarStatus(null);
    setAvatarError(null);

    try {
      const result = await saveUserAvatar(targetUserKey, pendingAvatar, currentUser.name);
      const targetName = USERS[targetUserKey]?.name || targetUserKey;
      
      setAvatarStatus(`¡Logo de "${targetName}" guardado y persistido en la nube con éxito! Todos los perfiles verán este cambio de inmediato.`);
      setPendingAvatar(null);

      if (onAvatarUpdated) {
        onAvatarUpdated(targetUserKey, result.avatar);
      }
    } catch (err) {
      setAvatarError(err.message || 'Error al persistir el avatar en la nube.');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Restaurar al logo/avatar predeterminado
  const handleResetAvatar = async () => {
    setIsSavingAvatar(true);
    setAvatarStatus(null);
    setAvatarError(null);

    try {
      const result = await resetUserAvatar(targetUserKey);
      const targetName = USERS[targetUserKey]?.name || targetUserKey;
      
      setPendingAvatar(null);
      setAvatarStatus(`¡Logo de "${targetName}" restaurado al formato inicial del colegio!`);

      if (onAvatarUpdated) {
        onAvatarUpdated(targetUserKey, result.avatar);
      }
    } catch (err) {
      setAvatarError(err.message || 'Error al restaurar el avatar.');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Manejador del cambio de contraseña (para la cuenta activa)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Por favor ingrese su contraseña actual para autorizar el cambio.');
      return;
    }

    if (newPassword.length < 5) {
      setPasswordError('La nueva contraseña debe tener como mínimo 5 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('La nueva contraseña debe ser diferente a la contraseña actual.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await changeUserPassword(currentUserKey, currentPassword, newPassword);
      setPasswordStatus(
        '¡Contraseña actualizada con éxito! La clave anterior por defecto fue eliminada del sistema y la nueva ha quedado ofuscada de forma segura.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onProfileUpdated) {
        onProfileUpdated(currentUserKey);
      }
    } catch (err) {
      setPasswordError(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setIsSubmittingPassword(false);
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
        {/* Encabezado del Modal Dinámico */}
        <div className="modal-header modal-header-profile">
          <div className="modal-title-wrap">
            <div className={`modal-icon ${isTargetRectora ? 'profile-avatar-rectora' : ''}`}>
              {isTargetRectora ? <i className="ph-bold ph-crown"></i> : <i className="ph-bold ph-user"></i>}
            </div>
            <div>
              <h3 id="profileModalTitle">
                {isEditingSelf 
                  ? (isRectora ? 'Perfil Directivo • Rectoría' : `Perfil Institucional • ${currentUser.name}`)
                  : `Personalizar Perfil & Logo • ${targetUser.name}`}
              </h3>
              <p>
                {isEditingSelf 
                  ? 'Gimnasio Martin Galeano • Básica Primaria'
                  : `Gestión Institucional de Usuario • ${targetUser.label}`}
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar modal">
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="modal-body-profile">
          {/* Tarjeta de Identidad y Rol Dinámica según el Usuario Seleccionado */}
          <div className="profile-identity-card">
            <div className="profile-avatar-large">
              {targetUserAvatar ? (
                <img 
                  src={targetUserAvatar} 
                  alt={targetUser.name} 
                  className="profile-avatar-img-lg"
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none'; 
                    const f = e.currentTarget.nextSibling; 
                    if (f) f.style.display = 'flex'; 
                  }}
                />
              ) : null}
              <span className="profile-avatar-initial" style={{ display: targetUserAvatar ? 'none' : 'flex' }}>
                {targetUser.initial || targetUser.name?.charAt(0)}
              </span>
              {isTargetRectora && <span className="profile-crown-badge">👑</span>}
            </div>
            <div className="profile-identity-details">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0 }}>{targetUser.name}</h4>
                {!isEditingSelf && (
                  <span style={{ 
                    fontSize: '0.72rem', 
                    background: '#ecfdf5', 
                    color: '#065f46', 
                    border: '1px solid #a7f3d0',
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <i className="ph-bold ph-sliders"></i> Editando a este docente
                  </span>
                )}
              </div>
              <span className="profile-role-tag" style={{ marginTop: '5px' }}>
                <i className="ph-bold ph-shield-check"></i> {targetUser.label}
              </span>
              <p className="profile-institution-text">
                Gestión Académica y Documental • Sede Básica Primaria
              </p>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <div className="profile-tabs-nav">
            <button 
              type="button" 
              className={`profile-tab-btn ${activeTab === 'avatar' ? 'active' : ''}`}
              onClick={() => setActiveTab('avatar')}
            >
              <i className="ph-bold ph-image"></i>
              <span>Logo & Foto de Perfil</span>
              <span className="profile-tab-cloud-pill">
                <i className="ph-bold ph-cloud-arrow-up"></i> Nube
              </span>
            </button>

            {isEditingSelf && (
              <button 
                type="button" 
                className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="ph-bold ph-lock-key"></i>
                <span>Contraseña & Seguridad</span>
              </button>
            )}

            <button 
              type="button" 
              className={`profile-tab-btn ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              <i className="ph-bold ph-sparkle"></i>
              <span>Capacidades del Rol</span>
            </button>
          </div>

          {/* ========================================================
              PESTAÑA 1: PERSONALIZACIÓN DE LOGO / AVATAR CON PERSISTENCIA EN NUBE
             ======================================================== */}
          {activeTab === 'avatar' && (
            <div className="avatar-customizer-section">
              {/* Selector de Usuario para Directivos */}
              {isPrivileged && (
                <div className="avatar-target-selector-box">
                  <div className="target-selector-header">
                    <i className="ph-bold ph-users-three"></i>
                    <div>
                      <strong>Personalizar Logo de:</strong>
                      <span className="target-selector-subtitle">Selecciona a qué docente o directivo deseas actualizarle el logo o foto de perfil:</span>
                    </div>
                  </div>
                  <select 
                    className="avatar-user-dropdown"
                    value={targetUserKey}
                    onChange={(e) => handleSelectTargetUser(e.target.value)}
                  >
                    <option value="claudia">Claudia (Rectora Institucional)</option>
                    <option value="jessica">Jessica (Docente Primaria)</option>
                    <option value="yuri">Yuri (Docente Primaria)</option>
                    <option value="elcy">Elcy (Docente Primaria)</option>
                    <option value="admin">Administrador General</option>
                    <option value="induccion_rectora">Claudia (Inducción Rectora)</option>
                    <option value="induccion">Inducción Profesoras</option>
                  </select>
                </div>
              )}

              {/* Vista Previa del Logo del Usuario Objetivo */}
              <div className="avatar-preview-card">
                <div className="avatar-preview-visual-wrap">
                  <div className={`avatar-preview-circle ${isTargetRectora ? 'is-rectora' : ''}`}>
                    {targetUserAvatar ? (
                      <img 
                        src={targetUserAvatar} 
                        alt={targetUser.name} 
                        className="avatar-preview-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span 
                      className="avatar-preview-initial" 
                      style={{ display: targetUserAvatar ? 'none' : 'flex' }}
                    >
                      {targetUser.initial || targetUser.name?.charAt(0)}
                    </span>
                    {isTargetRectora && <span className="preview-crown-badge">👑</span>}
                  </div>

                  <div className="avatar-preview-meta">
                    <div className="avatar-meta-title-row">
                      <h4>{targetUser.name}</h4>
                      <span className="avatar-cloud-status-pill">
                        <i className="ph-bold ph-cloud-check"></i> Persiste en la Nube
                      </span>
                    </div>
                    <p className="avatar-meta-desc">
                      Este logo se mostrará en la barra superior, en el menú lateral, en el registro de conexiones y en las circulares emitidas por {targetUser.name}.
                    </p>
                    {pendingAvatar && (
                      <span className="avatar-pending-indicator">
                        <i className="ph-bold ph-pencil-simple"></i> Cambio seleccionado pendiente por guardar
                      </span>
                    )}
                  </div>
                </div>

                {/* Mensajes de Alerta / Éxito para Avatares */}
                {avatarStatus && (
                  <div className="alert-box alert-success" style={{ marginTop: '0.85rem' }}>
                    <i className="ph-bold ph-check-circle"></i>
                    <span>{avatarStatus}</span>
                  </div>
                )}

                {avatarError && (
                  <div className="alert-box alert-error" style={{ marginTop: '0.85rem' }}>
                    <i className="ph-bold ph-warning-circle"></i>
                    <span>{avatarError}</span>
                  </div>
                )}
              </div>

              {/* Botón de Subida de Archivo Propio */}
              <div className="avatar-upload-box">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml, image/jfif"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button 
                  type="button" 
                  className="btn-avatar-upload-trigger"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage || isSavingAvatar}
                >
                  <div className="upload-trigger-icon">
                    <i className={`ph-bold ${isProcessingImage ? 'ph-arrows-clockwise ph-spin' : 'ph-upload-simple'}`}></i>
                  </div>
                  <div className="upload-trigger-text">
                    <strong>{isProcessingImage ? 'Optimizando imagen...' : 'Subir Imagen o Foto desde este Dispositivo'}</strong>
                    <span>Formatos JPG, PNG, WEBP o SVG. Se recorta y optimiza automáticamente en alta definición.</span>
                  </div>
                </button>
              </div>

              {/* Galería de Logos Institucionales Predefinidos */}
              <div className="avatar-presets-container">
                <div className="presets-title-row">
                  <i className="ph-bold ph-palette"></i>
                  <strong>O selecciona un emblema de la Galería Institucional:</strong>
                </div>

                <div className="avatar-presets-grid">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = targetUserAvatar === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`avatar-preset-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectPreset(preset.url)}
                        title={preset.description}
                      >
                        <div className="preset-img-wrapper">
                          <img 
                            src={preset.url} 
                            alt={preset.name} 
                            className="preset-thumb-img" 
                          />
                          {isSelected && (
                            <span className="preset-check-badge">
                              <i className="ph-bold ph-check"></i>
                            </span>
                          )}
                        </div>
                        <span className="preset-card-name">{preset.name}</span>
                        <span className="preset-card-category">{preset.category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botones de Acción de Avatar */}
              <div className="avatar-actions-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-reset-avatar"
                  onClick={handleResetAvatar}
                  disabled={isSavingAvatar || isProcessingImage}
                  title="Volver al formato inicial por defecto"
                >
                  <i className="ph-bold ph-arrow-counter-clockwise"></i>
                  <span>Restaurar Predeterminado</span>
                </button>

                <button 
                  type="button" 
                  className="btn btn-primary btn-save-avatar"
                  onClick={handleSaveAvatar}
                  disabled={isSavingAvatar || isProcessingImage || !pendingAvatar}
                >
                  <i className={`ph-bold ${isSavingAvatar ? 'ph-arrows-clockwise ph-spin' : 'ph-cloud-arrow-up'}`}></i>
                  <span>{isSavingAvatar ? 'Guardando en la Nube...' : 'Guardar y Sincronizar en la Nube'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              PESTAÑA 2: CONTRASEÑA Y SEGURIDAD INSTITUCIONAL
             ======================================================== */}
          {activeTab === 'security' && (
            <div className="profile-section">
              <h5 className="profile-section-title">
                <i className="ph-bold ph-lock-key"></i> Seguridad y Credenciales Institucionales
              </h5>

              {isCustomPass ? (
                <div className="security-status-banner secure">
                  <div className="status-icon"><i className="ph-bold ph-shield-check"></i></div>
                  <div className="status-text">
                    <strong>Contraseña Personalizada y Protegida</strong>
                    <p>
                      La contraseña anterior por defecto fue <strong>eliminada</strong>. Su clave actual se encuentra 
                      ofuscada con un cifrado interno que solo esta aplicación puede descifrar, protegida contra inspecciones en el repositorio.
                    </p>
                    {lastPassUpdated && (
                      <small className="status-date">
                        Última modificación: {new Date(lastPassUpdated).toLocaleDateString()} a las {new Date(lastPassUpdated).toLocaleTimeString()}
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

              {/* Mensajes de Alerta / Éxito para Contraseña */}
              {passwordStatus && (
                <div className="alert-box alert-success">
                  <i className="ph-bold ph-check-circle"></i>
                  <span>{passwordStatus}</span>
                </div>
              )}

              {passwordError && (
                <div className="alert-box alert-error">
                  <i className="ph-bold ph-warning-circle"></i>
                  <span>{passwordError}</span>
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
                    disabled={isSubmittingPassword}
                  >
                    <i className="ph-bold ph-shield-check"></i>
                    <span>{isSubmittingPassword ? 'Guardando y Ofuscando...' : 'Guardar y Ofuscar Contraseña'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================
              PESTAÑA 3: CARACTERÍSTICAS Y CAPACIDADES DEL ROL
             ======================================================== */}
          {activeTab === 'features' && (
            <div className="profile-section">
              <h5 className="profile-section-title">
                <i className="ph-bold ph-sparkle"></i> Características y Atribuciones de {targetUser.name}
              </h5>
              <div className="profile-features-grid">
                <div className="profile-feature-item">
                  <div className="feature-icon"><i className="ph-bold ph-hard-drives"></i></div>
                  <div className="feature-info">
                    <strong>Capacidad de Almacenamiento</strong>
                    <span>Límite de {targetUser.maxUploadLabel || '15 MB'} por archivo ({targetUser.maxUploadBytes > 50 * 1024 * 1024 ? 'Modo Directivo Ampliado' : 'Estándar'})</span>
                  </div>
                </div>

                {isTargetRectora && (
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

                    <div className="profile-feature-item">
                      <div className="feature-icon"><i className="ph-bold ph-eye"></i></div>
                      <div className="feature-info">
                        <strong>Control de Conexiones en Vivo</strong>
                        <span>Monitoreo de asistencia y dispositivos del personal docente</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
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
