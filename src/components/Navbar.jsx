import PortalNavbar from './PortalNavbar';

/**
 * Navbar institucional para Gestión Documental
 * Mantiene retrocompatibilidad delegando en PortalNavbar con paridad visual 100%.
 */
export default function Navbar({ 
  currentUser, 
  onLogout, 
  onToggleSidebar, 
  onOpenCirculares, 
  circularesCount = 0,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineCount = 0,
  onBackToModules,
  onOpenTour
}) {
  return (
    <PortalNavbar
      currentUser={currentUser}
      moduleTitle="Gestión Documental"
      moduleSubtitle={`Archivo Central • Panel de ${currentUser?.name || 'Docente'}`}
      onBackToModules={onBackToModules}
      onToggleSidebar={onToggleSidebar}
      onOpenConnectionsModal={onOpenConnectionsModal}
      onlineCount={onlineCount}
      circularesCount={circularesCount}
      onOpenCirculares={onOpenCirculares}
      onOpenTour={onOpenTour}
      onOpenProfile={onOpenProfile}
      onLogout={onLogout}
    />
  );
}