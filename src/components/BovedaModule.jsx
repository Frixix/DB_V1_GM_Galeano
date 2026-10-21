import { useState, useMemo } from 'react';
import PortalNavbar from './PortalNavbar';
import { verifyBovedaPassword, getBovedaCredentials } from '../services/authService';
import DocumentCard from './DocumentCard';
import DocumentTable from './DocumentTable';
import './BovedaModule.css';

/**
 * MÓDULO INSTITUCIONAL: BÓVEDA DIRECTIVA DE ALTA CAPACIDAD
 * Cero salto visual respecto a Gestión de Módulos (altura de navbar, padding y tipografía idénticos).
 * Tipografía: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
 * Color procedimental: Gris Pastel (#f1f5f9 / #e2e8f0 / #cbd5e1)
 * Texto: Negro formal institucional (#0f172a)
 */
export default function BovedaModule({
  currentUser,
  documents = [],
  onBackToModules,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineCount,
  circularesCount = 0,
  onOpenCirculares,
  isNotificationsOpen = false,
  onOpenTour,
  onLogout,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onOpenUploadModal,
  onOpenChangeBovedaModal,
  isBovedaUnlocked,
  setIsBovedaUnlocked,
  isPrivileged
}) {
  const [bovedaYear, setBovedaYear] = useState('all');
  const [bovedaSubfolder, setBovedaSubfolder] = useState('all');
  const [search, setSearch] = useState('');
  const [currentView, setCurrentView] = useState('cards');

  // Estados de desbloqueo (Candado)
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  const userName = currentUser?.name || 'Usuario Directivo';
  const userRole = currentUser?.label || currentUser?.role || 'Personal Institucional';
  const userInitial = currentUser?.initial || (userName ? userName.charAt(0).toUpperCase() : 'U');

  const bovedaCreds = getBovedaCredentials();

  // Filtrado de documentos de Bóveda
  const bovedaDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.folder !== 'boveda') return false;
      if (bovedaYear !== 'all' && doc.bovedaYear !== bovedaYear) return false;
      if (bovedaSubfolder !== 'all' && doc.bovedaSubfolder !== bovedaSubfolder) return false;

      if (search) {
        const q = search.toLowerCase();
        const match =
          (doc.title && doc.title.toLowerCase().includes(q)) ||
          (doc.teacher && doc.teacher.toLowerCase().includes(q)) ||
          (doc.notes && doc.notes.toLowerCase().includes(q)) ||
          (doc.id && doc.id.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [documents, bovedaYear, bovedaSubfolder, search]);

  const totalBovedaBytes = useMemo(() => {
    return documents
      .filter((d) => d.folder === 'boveda')
      .reduce((sum, d) => sum + (d.rawBytes || 0), 0);
  }, [documents]);

  const formatStorageMB = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  const handleUnlockSubmit = (e) => {
    e.preventDefault();
    setUnlockError('');

    const res = verifyBovedaPassword(password, currentUser);
    if (res.valid) {
      setPassword('');
      setUnlockError('');
      setIsBovedaUnlocked(true);
    } else {
      setUnlockError(res.error || 'Clave de seguridad incorrecta. Acceso a la bóveda denegado.');
      setPassword('');
    }
  };

  return (
    <div className="boveda-module-container" id="view-boveda-module">
      {/* Navbar Superior Unificado */}
      <PortalNavbar
        currentUser={currentUser}
        moduleTitle="Bóveda Directiva"
        moduleSubtitle="Custodia Confidencial de Alta Seguridad"
        onBackToModules={onBackToModules}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onlineCount={onlineCount}
        circularesCount={circularesCount}
        isNotificationsOpen={isNotificationsOpen}
        onOpenCirculares={onOpenCirculares}
        onOpenTour={onOpenTour}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      {/* Área de Contenido Principal (Mismo fondo y alineación) */}
      <div className="boveda-content-area">
        {!isBovedaUnlocked ? (
          /* CASO 1: BLOQUEADA (Tarjeta de Autorización integrada con fluidez) */
          <section className="boveda-lock-container">
            <div className="boveda-lock-card">
              <div className="boveda-lock-icon-container">
                <i className="ph-bold ph-lock-key"></i>
              </div>
              <h2>Bóveda Institucional Protegida</h2>
              <p>
                Espacio confidencial reservado para custodia de actas de consejo directivo, resoluciones, estados financieros y contratos docentes.
              </p>

              <div className="boveda-dual-key-row">
                <div className="boveda-dual-key-pill">
                  <span className="boveda-key-dot"></span>
                  <span>Rectoría {bovedaCreds.isRectoraCustom ? 'Personalizada' : 'Activa'}</span>
                </div>
                <div className="boveda-dual-key-pill">
                  <span className="boveda-key-dot"></span>
                  <span>Administración {bovedaCreds.isAdminCustom ? 'Personalizada' : 'Activa'}</span>
                </div>
              </div>

              {unlockError && (
                <div className="boveda-alert-error">
                  <i className="ph-bold ph-warning-circle"></i>
                  <span>{unlockError}</span>
                </div>
              )}

              <form onSubmit={handleUnlockSubmit}>
                <div className="boveda-form-group">
                  <label htmlFor="bovedaUnlockPass">Contraseña de Acceso a la Bóveda</label>
                  <div className="boveda-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="bovedaUnlockPass"
                      className="boveda-input-field"
                      placeholder="Ingrese clave de seguridad"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (unlockError) setUnlockError('');
                      }}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      className="boveda-btn-toggle-eye"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      tabIndex={-1}
                    >
                      <i className={`ph-bold ${showPassword ? 'ph-eye-slash' : 'ph-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <button type="submit" className="boveda-btn-submit-unlock">
                  <i className="ph-bold ph-key"></i>
                  <span>Desbloquear Bóveda</span>
                </button>

                <div className="boveda-lock-card-footer">
                  <button
                    type="button"
                    className="boveda-btn-link-change-key"
                    onClick={onOpenChangeBovedaModal}
                  >
                    <i className="ph-bold ph-shield-check"></i>
                    <span>¿Deseas cambiar o verificar una nueva clave para la Bóveda? Haz clic aquí</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : (
          /* CASO 2: DESBLOQUEADA (Consola y Cuadrícula de Archivos) */
          <>
            {/* Banner de Control Superior de Bóveda */}
            <section className="boveda-banner-card">
              <div className="boveda-banner-left">
                <div className="boveda-banner-icon-box">
                  <i className="ph-bold ph-shield-check"></i>
                </div>
                <div>
                  <h2 className="boveda-banner-title">Bóveda Directiva de Alta Capacidad</h2>
                  <p className="boveda-banner-sub">
                    Custodia y auditoría de archivos de alta seguridad (hasta 2 GB). Almacenamiento usado: <strong>{formatStorageMB(totalBovedaBytes)} MB</strong> en <strong>{bovedaDocs.length}</strong> {bovedaDocs.length === 1 ? 'documento' : 'documentos'}.
                  </p>
                </div>
              </div>

              <div className="boveda-banner-actions">
                <button 
                  type="button" 
                  className="boveda-btn-secondary"
                  onClick={onOpenChangeBovedaModal}
                  title="Modificar o actualizar la contraseña de la Bóveda"
                >
                  <i className="ph-bold ph-key"></i>
                  <span>Cambiar Clave</span>
                </button>

                <button 
                  type="button" 
                  className="boveda-btn-lock"
                  onClick={() => setIsBovedaUnlocked(false)}
                  title="Bloquear la Bóveda y salir al candado de seguridad"
                >
                  <i className="ph-bold ph-lock-key"></i>
                  <span>Bloquear</span>
                </button>
              </div>
            </section>

            {/* Barra de Filtros y Búsqueda */}
            <section className="boveda-controls-bar">
              <div className="boveda-controls-left">
                <div className="boveda-filter-unit">
                  <label htmlFor="bovedaFilterYear">
                    <i className="ph-bold ph-calendar"></i> Año:
                  </label>
                  <select
                    id="bovedaFilterYear"
                    className="boveda-select-control"
                    value={bovedaYear}
                    onChange={(e) => setBovedaYear(e.target.value)}
                  >
                    <option value="all">Todos los años</option>
                    <option value="2026">Año 2026</option>
                    <option value="2025">Año 2025</option>
                    <option value="2024">Año 2024</option>
                    <option value="Historico">Archivo Histórico</option>
                  </select>
                </div>

                <div className="boveda-filter-unit">
                  <label htmlFor="bovedaFilterSubfolder">
                    <i className="ph-bold ph-folder-notch-open"></i> Subcarpeta:
                  </label>
                  <select
                    id="bovedaFilterSubfolder"
                    className="boveda-select-control"
                    value={bovedaSubfolder}
                    onChange={(e) => setBovedaSubfolder(e.target.value)}
                  >
                    <option value="all">Todas las subcarpetas</option>
                    <option value="consejo">Actas de Consejo Directivo</option>
                    <option value="financiero">Financiero & Contable</option>
                    <option value="legal">Resoluciones & Legalidad</option>
                    <option value="contratos">Contratos & Nómina Docente</option>
                    <option value="pei_soporte">Soportes PEI & Licencias</option>
                  </select>
                </div>

                <div className="boveda-search-box">
                  <i className="ph-bold ph-magnifying-glass"></i>
                  <input
                    type="text"
                    placeholder="Buscar en la bóveda..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="boveda-view-selector">
                <button
                  type="button"
                  className={`boveda-view-btn ${currentView === 'cards' ? 'active' : ''}`}
                  onClick={() => setCurrentView('cards')}
                  title="Vista en Tarjetas"
                  aria-label="Vista en Tarjetas"
                >
                  <i className="ph-bold ph-squares-four"></i>
                </button>
                <button
                  type="button"
                  className={`boveda-view-btn ${currentView === 'table' ? 'active' : ''}`}
                  onClick={() => setCurrentView('table')}
                  title="Vista en Tabla"
                  aria-label="Vista en Tabla"
                >
                  <i className="ph-bold ph-list-dashes"></i>
                </button>
              </div>
            </section>

            {/* Listado de Documentos */}
            <section>
              {bovedaDocs.length > 0 ? (
                currentView === 'cards' ? (
                  <div className="cards-grid">
                    {bovedaDocs.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        onView={onViewDocument}
                        onDownload={onDownloadDocument}
                        onDelete={onDeleteDocument}
                        canDelete={isPrivileged}
                        isUnread={false}
                      />
                    ))}
                  </div>
                ) : (
                  <DocumentTable
                    documents={bovedaDocs}
                    onView={onViewDocument}
                    onDownload={onDownloadDocument}
                    onDelete={onDeleteDocument}
                    canDelete={isPrivileged}
                    readCircularIds={[]}
                    currentUserName={currentUser.name}
                  />
                )
              ) : (
                <div className="boveda-empty-state">
                  <div className="boveda-empty-icon">
                    <i className="ph-bold ph-vault"></i>
                  </div>
                  <h3>No hay archivos en la Bóveda con los filtros seleccionados</h3>
                  <p>Puedes subir documentos de alta seguridad o ajustar el año y subcarpeta seleccionados.</p>
                  <button 
                    type="button" 
                    className="boveda-btn-primary"
                    onClick={onOpenUploadModal}
                  >
                    <i className="ph-bold ph-upload-simple"></i>
                    <span>Subir primer documento a esta sección</span>
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Botón Flotante para Subir Documento a la Bóveda (Inferior Derecha - Cero salto respecto a los otros módulos) */}
      {isBovedaUnlocked && (
        <button
          type="button"
          className="btn-floating-upload"
          onClick={onOpenUploadModal}
          title="Subir nuevo archivo de alta seguridad a la Bóveda"
          aria-label="Subir nuevo archivo a la Bóveda"
        >
          <i className="ph-bold ph-upload-simple"></i>
          <span>Subir a Bóveda</span>
        </button>
      )}
    </div>
  );
}
