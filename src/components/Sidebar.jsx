import BaseSidebar from './common/BaseSidebar.jsx';

export default function Sidebar({ 
  currentUser, 
  currentFolder, 
  onFolderSelect, 
  currentTeacher, 
  onTeacherSelect, 
  documents = [], 
  circularesCount = 0, 
  unreadSharedCount = 0,
  onOpenProfile,
  onlineMap = {},
  onlineCount = 0,
  onOpenConnectionsModal,
  onBackToModules
}) {
  const isPrivileged = ["admin", "rectora", "induccion_rectora", "coordinador"].includes(currentUser.role);

  const navigationItems = [
    {
      id: 'all',
      label: isPrivileged ? "Todos los Documentos" : `Mis Documentos (${currentUser.name})`,
      icon: 'ph-bold ph-folders'
    },
    {
      id: 'publico',
      label: 'Compartidos con Todos',
      icon: 'ph-bold ph-globe',
      badge: unreadSharedCount
    },
    {
      id: 'institucional',
      label: 'Institucional & Circulares',
      icon: 'ph-bold ph-buildings',
      badge: circularesCount
    },
    {
      id: 'planeaciones',
      label: 'Planeaciones',
      icon: 'ph-bold ph-notebook'
    },
    {
      id: 'talleres',
      label: 'Guías & Talleres',
      icon: 'ph-bold ph-pencil-line'
    }
  ];

  return (
    <BaseSidebar
      currentModule="recursos"
      currentUser={currentUser}
      isPrivileged={isPrivileged}
      selectedTeacher={currentTeacher}
      onSelectTeacher={onTeacherSelect}
      navigationItems={navigationItems}
      activeItemId={currentFolder}
      onNavigateItem={onFolderSelect}
      navigationTitle="Ubicación / Rutas"
      navigationIcon="ph-bold ph-folder"
      navigationSectionId="sidebarFoldersSection"
      documents={documents}
      onBackToModules={onBackToModules}
      onlineMap={onlineMap}
      onlineCount={onlineCount}
      onOpenConnectionsModal={onOpenConnectionsModal}
      onOpenProfile={onOpenProfile}
      defaultExpanded={false}
      sectionId="adminTeacherSection"
      id="mainSidebar"
    />
  );
}
