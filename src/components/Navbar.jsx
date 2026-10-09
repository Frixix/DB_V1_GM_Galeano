export default function Navbar({ currentUser, onLogout }) {
  return (
    <header className="navbar">
      <div className="nav-left">
        <button className="btn-mobile-toggle" aria-label="Abrir Menú">
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
        <div className="nav-notification-bell" title="Circulares sin leer">
          <i className="ph-bold ph-bell"></i>
          <span className="whatsapp-badge hidden">0</span>
        </div>

        <div className="user-chip">
          <div className="user-avatar">{currentUser.initial}</div>
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">{currentUser.label}</span>
          </div>
        </div>

        <button className="btn btn-primary btn-upload-nav">
          <i className="ph-bold ph-cloud-arrow-up"></i> <span>Subir Documento</span>
        </button>
        
        <button className="btn btn-secondary btn-icon-only" onClick={onLogout} title="Cerrar Sesión">
          <i className="ph-bold ph-sign-out"></i>
        </button>
      </div>
    </header>
  );
}