import { USERS, SYSTEM_STORAGE_CAPACITY_BYTES } from '../data/users.js';
import TeacherAccordion, { SidebarBackBtn } from './TeacherAccordion.jsx';

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
  const SYSTEM_CAPACITY = SYSTEM_STORAGE_CAPACITY_BYTES; // 2 GB
  const totalUsedBytes = documents.reduce((sum, doc) => sum + (doc.rawBytes || 0), 0);
  const usedMB = (totalUsedBytes / (1024 * 1024)).toFixed(1);
  const percentUsed = Math.min(100, Math.max(1, ((totalUsedBytes / SYSTEM_CAPACITY) * 100))).toFixed(1);
  const isStorageFull = totalUsedBytes >= SYSTEM_CAPACITY;
  const isStorageNearFull = !isStorageFull && (totalUsedBytes / SYSTEM_CAPACITY) >= 0.85;

  return (
    <aside className="sidebar" id="mainSidebar">
      {/* Botón para retornar al área de módulos */}
      <SidebarBackBtn onBackToModules={onBackToModules} />

      {/* Sección Unificada de Docentes (Acordeón para Directivos o Tarjeta para Docente Titular) */}
      <TeacherAccordion
        currentUser={currentUser}
        isPrivileged={isPrivileged}
        currentTeacher={currentTeacher}
        onTeacherSelect={onTeacherSelect}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onlineMap={onlineMap}
        onlineCount={onlineCount}
        onOpenProfile={onOpenProfile}
        sectionId="adminTeacherSection"
        defaultExpanded={false}
      />

      {/* Categorías de Carpetas */}
      <div className="sidebar-section" id="sidebarFoldersSection">
        <div className="sidebar-header">
          <i className="ph-bold ph-folder"></i>
          <span>Ubicación / Rutas</span>
        </div>
        <nav className="folder-list">
          <button 
            className={`folder-btn folder-all ${currentFolder === 'all' ? 'active' : ''}`}
            onClick={() => onFolderSelect('all')}
          >
            <i className="ph-bold ph-folders"></i>
            <span>{isPrivileged ? "Todos los Documentos" : `Mis Documentos (${currentUser.name})`}</span>
          </button>
          
          <button 
            className={`folder-btn folder-publico ${currentFolder === 'publico' ? 'active' : ''}`}
            onClick={() => onFolderSelect('publico')}
          >
            <i className="ph-bold ph-globe"></i>
            <span>Compartidos con Todos</span>
            {unreadSharedCount > 0 && <span className="whatsapp-badge">{unreadSharedCount}</span>}
          </button>

          <button 
            className={`folder-btn folder-institucional ${currentFolder === 'institucional' ? 'active' : ''}`}
            onClick={() => onFolderSelect('institucional')}
          >
            <i className="ph-bold ph-buildings"></i>
            <span>Institucional & Circulares</span>
            {circularesCount > 0 && <span className="whatsapp-badge">{circularesCount}</span>}
          </button>
          
          <button 
            className={`folder-btn folder-planeaciones ${currentFolder === 'planeaciones' ? 'active' : ''}`}
            onClick={() => onFolderSelect('planeaciones')}
          >
            <i className="ph-bold ph-notebook"></i>
            <span>Planeaciones</span>
          </button>

          <button 
            className={`folder-btn folder-talleres ${currentFolder === 'talleres' ? 'active' : ''}`}
            onClick={() => onFolderSelect('talleres')}
          >
            <i className="ph-bold ph-pencil-line"></i>
            <span>Guías & Talleres</span>
          </button>
        </nav>
      </div>

      {/* Almacenamiento en la parte inferior */}
      <div 
        className={`db-summary-card ${isStorageFull ? 'storage-card-full' : (isStorageNearFull ? 'storage-card-warning' : '')}`} 
        id="sidebarStorageCard"
      >
        <div className="summary-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ph-bold ph-hard-drive"></i>
            <span>Almacenamiento</span>
          </div>
          <span className={`storage-plan-pill ${isStorageFull ? 'full' : (isStorageNearFull ? 'warning' : '')}`}>
            {isStorageFull ? '2 GB Lleno' : 'Versión Institucional'}
          </span>
        </div>

        <div className="storage-bar-wrapper">
          <div 
            className={`storage-bar-progress ${isStorageFull ? 'progress-full' : (isStorageNearFull ? 'progress-warning' : '')}`} 
            style={{ width: `${percentUsed}%` }}
          ></div>
        </div>

        <div className="storage-labels">
          <span>{usedMB} MB usados ({percentUsed}%)</span>
          <span>2 GB disponibles</span>
        </div>

        {isStorageFull ? (
          <div className="summary-alert-full">
            <div className="summary-alert-header">
              <i className="ph-bold ph-warning-octagon"></i>
              <strong>Capacidad Agotada (2 GB)</strong>
            </div>
            <p>
              Has alcanzado el límite de 2 GB de la <strong>cuota institucional</strong>. Para continuar almacenando documentos, contacte al administrador.
            </p>
          </div>
        ) : (
          <p className="summary-reminder">
            {isStorageNearFull ? (
              <>⚠️ <strong>Cerca del límite:</strong> 85%+ de capacidad utilizada de los 2 GB institucionales.</>
            ) : (
              <>Plan Institucional: <strong>2 GB asignados</strong> para gestión académica.</>
            )}
          </p>
        )}
      </div>
    </aside>
  );
}