import PortalNavbar from './PortalNavbar';

/**
 * Navbar institucional para Recursos Pedagógicos & Circulares
 * Mantiene retrocompatibilidad delegando en PortalNavbar con paridad visual 100%.
 */
export default function Navbar({ 
  currentUser, 
  onLogout, 
  onToggleSidebar, 
  onOpenCirculares, 
  circularesCount = 0,
  isNotificationsOpen = false,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineCount = 0,
  onBackToModules,
  onOpenTour
}) {
  return (
    <PortalNavbar
      currentUser={currentUser}
      moduleTitle="Recursos Pedagógicos & Circulares"
      moduleSubtitle={`Archivo Central • Panel de ${currentUser?.name || 'Docente'}`}
      onBackToModules={onBackToModules}
      onToggleSidebar={onToggleSidebar}
      onOpenConnectionsModal={onOpenConnectionsModal}
      onlineCount={onlineCount}
      circularesCount={circularesCount}
      isNotificationsOpen={isNotificationsOpen}
      onOpenCirculares={onOpenCirculares}
      onOpenTour={onOpenTour}
      onOpenProfile={onOpenProfile}
      onLogout={onLogout}
    />
  );
}