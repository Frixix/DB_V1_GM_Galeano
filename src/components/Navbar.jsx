export default function Navbar({ 
  currentUser, 
  onLogout, 
  onToggleSidebar, 
  onOpenUploadModal, 
  onOpenCirculares, 
  circularesCount = 0,
  onOpenProfile
}) {
  const isRectora = currentUser.role === 'rectora' || currentUser.role === 'induccion_rectora';

  return (
    <header className="navbar">
      <div className="nav-left">
        <button className="btn-mobile-toggle" onClick={onToggleSidebar} aria-label="Abrir Menú">
          <i className="ph-bold ph-list"></i>
        </button>

        <div className="nav-brand">
          <div className="brand-icon">
            <i className="ph-bold ph-graduation-cap"></i>
          </div>
          <div>
            <h1>Gimnasio Martin Galeano</h1>
            <p className="subtitle">Panel de {currentUser.name}</p>
          </div>
        </div>
      </div>

      <div className="nav-actions">
        <div 
          className="nav-notification-bell" 
          title={circularesCount > 0 ? `${circularesCount} circular(es) pendiente(s) por leer` : "Circulares institucionales al día"}
          onClick={onOpenCirculares}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-label="Abrir circulares"
        >
          <i className="ph-bold ph-bell"></i>
          {circularesCount > 0 && <span className="whatsapp-badge">{circularesCount}</span>}
        </div>

        <div 
          className="user-chip user-chip-clickable" 
          onClick={onOpenProfile}
          role="button"
          tabIndex={0}
          title={isRectora ? "Abrir perfil institucional y ajustes de la Rectora" : `Ver perfil de ${currentUser.name}`}
          aria-label={isRectora ? "Abrir perfil de la Rectora" : `Ver perfil de ${currentUser.name}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onOpenProfile) onOpenProfile();
            }
          }}
        >
          <div className={`user-avatar ${isRectora ? 'avatar-rectora-chip' : ''}`}>
            {currentUser.initial}
            {isRectora && <span className="avatar-chip-crown">👑</span>}
          </div>
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">{currentUser.label}</span>
          </div>
          <div className="user-chip-icon-hint" title="Gestionar perfil">
            <i className="ph-bold ph-gear"></i>
          </div>
        </div>

        <button id="btnOpenModal" className="btn btn-primary btn-upload-nav" onClick={onOpenUploadModal}>
          <i className="ph-bold ph-cloud-arrow-up"></i> <span>Subir Documento</span>
        </button>
        
        <button className="btn btn-secondary btn-icon-only" onClick={onLogout} title="Cerrar Sesión">
          <i className="ph-bold ph-sign-out"></i>
        </button>
      </div>
    </header>
  );
}