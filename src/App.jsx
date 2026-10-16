import { useState, useEffect } from 'react';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import DocumentCard from './components/DocumentCard';
import DocumentTable from './components/DocumentTable';
import BovedaAuthModal from './components/BovedaAuthModal';
import ViewModal from './components/ViewModal';
import UploadModal from './components/UploadModal';
import ProfileModal from './components/ProfileModal';
import BovedaPasswordModal from './components/BovedaPasswordModal';
import TourSpotlight from './components/TourSpotlight';
import ConnectionsModal from './components/ConnectionsModal';
import TrialWatermark from './components/TrialWatermark';
import { useDocuments } from './hooks/useDocuments';
import { useCircularReads } from './hooks/useCircularReads';
import { useUserPresence } from './hooks/useUserPresence';
import { downloadDocumentBlob } from './services/storageService';
import { syncVaultWithSupabase, subscribeToVaultChanges } from './services/authService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('all');
  const [currentTeacher, setCurrentTeacher] = useState('all');
  
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [currentView, setCurrentView] = useState('cards');

  // Estado para el menú móvil
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados específicos de la Bóveda
  const [isBovedaUnlocked, setIsBovedaUnlocked] = useState(false);
  const [isBovedaModalOpen, setIsBovedaModalOpen] = useState(false);
  const [isChangeBovedaModalOpen, setIsChangeBovedaModalOpen] = useState(false);
  const [bovedaYear, setBovedaYear] = useState('all');
  const [bovedaSubfolder, setBovedaSubfolder] = useState('all');

  // Modales interactivos
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState(null);

  const { documents, addDocument, deleteDocument } = useDocuments();
  const { readCircularIds, markAsRead: markCircularAsRead } = useCircularReads(currentUser);

  const totalUsedBytes = documents.reduce((sum, doc) => sum + (doc.rawBytes || 0), 0);

  // Control de asistencia y conexiones en tiempo real
  const {
    presenceData,
    onlineMap,
    onlineCount,
    refresh: refreshPresence,
    loading: presenceLoading,
    handleLogout: presenceLogout,
  } = useUserPresence(currentUser);

  useEffect(() => {
    syncVaultWithSupabase().catch(() => {});
    const unsubscribe = subscribeToVaultChanges();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (!currentUser) {
    return (
      <>
        <Login onLogin={setCurrentUser} />
        <TrialWatermark documents={documents} />
      </>
    );
  }

  const isPrivileged = ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);

  // Identificar si un documento o circular está pendiente de revisión por el usuario actual
  const isDocUnread = (doc) => {
    const isSharedOrPublic = Boolean(doc.isPublic) || doc.folder === 'institucional';
    const isFromOtherUser = doc.teacher !== currentUser.name;
    const isNotReadYet = !readCircularIds.includes(doc.id);
    return isSharedOrPublic && isFromOtherUser && isNotReadYet;
  };

  const unreadDocs = documents.filter(isDocUnread);
  const unreadCirculares = unreadDocs.filter(d => d.folder === 'institucional');
  const unreadSharedDocs = unreadDocs.filter(d => d.folder !== 'institucional');
  const totalUnreadCount = unreadDocs.length;

  // Manejador del clic en Bóveda y carpetas
  const handleFolderSelectWithBoveda = (folderKey) => {
    if (folderKey === 'boveda' && !isBovedaUnlocked) {
      setIsBovedaModalOpen(true);
      return;
    }
    setCurrentFolder(folderKey);
    setIsSidebarOpen(false); // Cierra el menú en móvil al seleccionar
  };

  // Manejador para abrir novedades desde la campanita
  const handleOpenCircularesBell = () => {
    if (unreadDocs.length > 0) {
      const target = unreadDocs[0];
      if (target.folder === 'institucional') {
        setCurrentFolder('institucional');
      } else {
        setCurrentFolder('publico');
      }
      setSelectedDocForView(target);
      setIsViewModalOpen(true);
      markCircularAsRead(target.id);
    } else {
      setCurrentFolder('institucional');
    }
  };

  // Manejador para ver documento (al leer una circular o compartido se apaga la notificación y el puntito)
  const handleViewDocument = (id) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setSelectedDocForView(doc);
      setIsViewModalOpen(true);
      if (doc.isPublic || doc.folder === 'institucional') {
        markCircularAsRead(doc.id);
      }
    }
  };

  // Manejador para descargar archivo (también apaga la notificación y el puntito rojo)
  const handleDownloadDocument = async (docOrId) => {
    const doc = typeof docOrId === 'object' ? docOrId : documents.find(d => d.id === docOrId);
    if (!doc) return;

    if (doc.isPublic || doc.folder === 'institucional') {
      markCircularAsRead(doc.id);
    }

    let downloadBlob = doc.fileBlob instanceof Blob ? doc.fileBlob : null;

    if (!downloadBlob && doc.storageKey) {
      downloadBlob = await downloadDocumentBlob(doc.storageKey);
    }

    if (downloadBlob instanceof Blob) {
      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || `${doc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const content = `========================================\nGIMNASIO MARTIN GALEANO\nSistema de Gestión Documental de Básica Primaria\n========================================\n\nRadicado: ${doc.id}\nTítulo: ${doc.title}\nDocente / Responsable: ${doc.teacher}\nGrado: ${doc.grade}\nÁrea / Materia: ${doc.subject}\nPeriodo: ${doc.period || 'General'}\nFecha de Radicación: ${doc.uploadedAt}\n\nObservaciones / Resumen del Documento:\n${doc.notes || 'Sin observaciones registradas.'}\n\n========================================\nArchivo resguardado institucionalmente.\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const downloadName = doc.fileName ? doc.fileName.replace(/\.[^/.]+$/, ".txt") : `${doc.id}.txt`;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Manejador para eliminar documento
  const handleDeleteDocument = (id) => {
    const target = documents.find(d => d.id === id);
    const confirmMessage = target 
      ? `¿Está seguro de eliminar el registro "${target.title}" (Radicado: ${id})?\nEsta acción no se puede deshacer.`
      : `¿Está seguro de eliminar el registro ${id}?`;

    if (window.confirm(confirmMessage)) {
      deleteDocument(id);
      if (selectedDocForView?.id === id) {
        setIsViewModalOpen(false);
      }
    }
  };

  // Manejador para registrar nuevo documento
  const handleUploadSuccess = (newDoc) => {
    addDocument(newDoc);
  };

  const filteredDocs = documents.filter(doc => {
    // 1. Bóveda: solo si el usuario es privilegiado y está desbloqueada
    if (doc.folder === 'boveda' && (!isPrivileged || !isBovedaUnlocked)) return false;

    // 2. Privacidad estricta para docentes:
    // Si NO es admin/rectora, solo puede ver:
    // - Documentos propios (doc.teacher === currentUser.name)
    // - Documentos públicos o institucionales (doc.isPublic || doc.folder === 'institucional')
    if (!isPrivileged) {
      const isOwner = doc.teacher === currentUser.name;
      const isShared = Boolean(doc.isPublic) || doc.folder === 'institucional';
      if (!isOwner && !isShared) return false;
    }

    // 3. Auditoría por docente (Rectoría / Admin)
    if (isPrivileged && currentTeacher !== 'all') {
      if (doc.teacher !== currentTeacher) return false;
    }

    // 4. Filtrado por carpeta activa
    if (currentFolder === 'boveda') {
      if (doc.folder !== 'boveda') return false;
      if (bovedaYear !== 'all' && doc.bovedaYear !== bovedaYear) return false;
      if (bovedaSubfolder !== 'all' && doc.bovedaSubfolder !== bovedaSubfolder) return false;
    } else if (currentFolder === 'publico') {
      // Compartidos con Todos: cualquier documento público o institucional
      if (!doc.isPublic && doc.folder !== 'institucional') return false;
    } else if (currentFolder === 'all') {
      if (doc.folder === 'boveda') return false;
      // Para docente en "Mis Documentos": mostrar exclusivamente sus documentos propios
      if (!isPrivileged && doc.teacher !== currentUser.name) return false;
    } else {
      // Carpetas temáticas (planeaciones, calificaciones, talleres, observador, institucional):
      if (doc.folder !== currentFolder) return false;
    }

    if (currentFolder !== 'boveda') {
      if (grade && doc.grade !== grade) return false;
      if (subject && doc.subject !== subject) return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const match = 
        (doc.title && doc.title.toLowerCase().includes(q)) ||
        (doc.teacher && doc.teacher.toLowerCase().includes(q)) ||
        (doc.subject && doc.subject.toLowerCase().includes(q)) ||
        (doc.id && doc.id.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div id="appContainer">
      <Navbar 
        currentUser={currentUser} 
        onLogout={async () => {
          await presenceLogout();
          setCurrentUser(null);
          setIsBovedaUnlocked(false);
        }} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenCirculares={handleOpenCircularesBell}
        circularesCount={totalUnreadCount}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
        onlineCount={onlineCount}
      />
      
      <div className="app-layout">
        <div className={`sidebar-container ${isSidebarOpen ? 'mobile-open' : ''}`}>
          <Sidebar 
            currentUser={currentUser} 
            currentFolder={currentFolder} 
            onFolderSelect={handleFolderSelectWithBoveda}
            currentTeacher={currentTeacher}
            onTeacherSelect={(t) => { setCurrentTeacher(t); setIsSidebarOpen(false); }}
            documents={documents}
            circularesCount={unreadCirculares.length}
            unreadSharedCount={unreadSharedDocs.length}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onlineMap={onlineMap}
            onlineCount={onlineCount}
            onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
          />
        </div>

        {isSidebarOpen && (
          <div className="mobile-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
        )}
        
        <main className="main-content">
          {/* Panel visual de Bóveda si está activa */}
          {currentFolder === 'boveda' && (
            <section className="boveda-controls">
              <div className="boveda-banner">
                <div className="boveda-banner-left">
                  <div className="boveda-banner-icon"><i className="ph-bold ph-shield-check"></i></div>
                  <div>
                    <h3>Bóveda Directiva de Alta Capacidad</h3>
                    <p>Archivos institucionales organizados por año y subcarpeta.</p>
                  </div>
                </div>

                <div className="boveda-banner-actions">
                  <button 
                    type="button" 
                    className="btn btn-boveda-action"
                    onClick={() => setIsChangeBovedaModalOpen(true)}
                    title="Cambiar clave de acceso a la Bóveda (Doble llave concurrente)"
                  >
                    <i className="ph-bold ph-key"></i>
                    <span>Cambiar Clave de Bóveda</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-boveda-lock"
                    onClick={() => {
                      setIsBovedaUnlocked(false);
                      setCurrentFolder('all');
                    }}
                    title="Bloquear y salir de la Bóveda"
                  >
                    <i className="ph-bold ph-lock-key"></i>
                    <span>Bloquear Bóveda</span>
                  </button>
                </div>
              </div>
              <div className="boveda-filters-row">
                <div className="filter-group">
                  <label><i className="ph-bold ph-calendar"></i> Año Lectivo:</label>
                  <select value={bovedaYear} onChange={(e) => setBovedaYear(e.target.value)}>
                    <option value="all">Todos los años</option>
                    <option value="2026">Año 2026</option>
                    <option value="2025">Año 2025</option>
                    <option value="2024">Año 2024</option>
                    <option value="Historico">Archivo Histórico</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label><i className="ph-bold ph-folder-notch-open"></i> Subcarpeta:</label>
                  <select value={bovedaSubfolder} onChange={(e) => setBovedaSubfolder(e.target.value)}>
                    <option value="all">Todas las subcarpetas</option>
                    <option value="consejo">Actas de Consejo Directivo</option>
                    <option value="financiero">Financiero & Contable</option>
                    <option value="legal">Resoluciones & Legalidad</option>
                    <option value="contratos">Contratos & Nómina Docente</option>
                    <option value="pei_soporte">Soportes PEI & Licencias</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          <FilterBar 
            search={search} setSearch={setSearch}
            grade={grade} setGrade={setGrade}
            subject={subject} setSubject={setSubject}
            currentView={currentView} setCurrentView={setCurrentView}
          />

          <div id="documentsContainer">
            {filteredDocs.length > 0 ? (
              currentView === 'cards' ? (
                <div className="cards-grid">
                  {filteredDocs.map(doc => (
                    <DocumentCard 
                      key={doc.id} 
                      doc={doc} 
                      onView={handleViewDocument}
                      onDownload={handleDownloadDocument}
                      onDelete={handleDeleteDocument}
                      canDelete={isPrivileged}
                      isUnread={isDocUnread(doc)}
                    />
                  ))}
                </div>
              ) : (
                <DocumentTable 
                  documents={filteredDocs}
                  onView={handleViewDocument}
                  onDownload={handleDownloadDocument}
                  onDelete={handleDeleteDocument}
                  canDelete={isPrivileged}
                  readCircularIds={readCircularIds}
                  currentUserName={currentUser.name}
                />
              )
            ) : (
              <p style={{ color: 'var(--text-muted)', padding: '2rem 1rem' }}>No se encontraron registros en esta sección.</p>
            )}
          </div>
        </main>
      </div>

      {/* Modal de Autenticación de Bóveda */}
      <BovedaAuthModal 
        isOpen={isBovedaModalOpen} 
        onClose={() => setIsBovedaModalOpen(false)} 
        currentUser={currentUser}
        onSuccess={() => {
          setIsBovedaUnlocked(true);
          setIsBovedaModalOpen(false);
          setCurrentFolder('boveda');
        }} 
      />

      {/* Modal para Ver Documento */}
      <ViewModal 
        isOpen={isViewModalOpen}
        doc={selectedDocForView}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedDocForView(null);
        }}
        onDownload={handleDownloadDocument}
      />

      {/* Modal para Subir Documento */}
      <UploadModal 
        key={isUploadModalOpen ? `upload_modal_${currentFolder}` : 'upload_modal_closed'}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentUser={currentUser}
        onUploadSuccess={handleUploadSuccess}
        existingCount={documents.length}
        initialFolder={currentFolder}
        totalUsedBytes={totalUsedBytes}
      />

      {/* Modal de Perfil Institucional y Seguridad */}
      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(userKey) => {
          // Si el usuario actual actualiza su contraseña, mantenemos la sesión sincronizada
          console.log(`Credenciales institucionales actualizadas para: ${userKey}`);
        }}
      />

      {/* Modal para Modificar Clave de la Bóveda (Doble llave concurrente) */}
      <BovedaPasswordModal 
        isOpen={isChangeBovedaModalOpen}
        onClose={() => setIsChangeBovedaModalOpen(false)}
        currentUser={currentUser}
        onPasswordChanged={() => {
          console.log('Clave de Bóveda actualizada exitosamente.');
        }}
      />

      {/* Modal de Control de Asistencia y Conexiones en Vivo (Exclusivo Rectora/Admin) */}
      <ConnectionsModal 
        isOpen={isConnectionsModalOpen}
        onClose={() => setIsConnectionsModalOpen(false)}
        presenceData={presenceData}
        currentUser={currentUser}
        onSelectTeacher={(teacherName) => {
          setCurrentTeacher(teacherName);
          setCurrentFolder('all');
        }}
        onRefresh={refreshPresence}
        loading={presenceLoading}
      />

      {/* Guía Interactiva Spotlight */}
      <TourSpotlight currentUser={currentUser} />

      {/* Marca de Agua Inferior Derecha: Fase de Prueba */}
      <TrialWatermark documents={documents} />
    </div>
  );
}