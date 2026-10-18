import { useState, useEffect } from 'react';
import Login from './components/Login';
import ModulesDashboard from './components/ModulesDashboard';
import GradesModule from './components/GradesModule';
import AdminReemplazosModule from './components/AdminReemplazosModule';
import BovedaModule from './components/BovedaModule';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import DocumentCard from './components/DocumentCard';
import DocumentTable from './components/DocumentTable';
import BovedaAuthModal from './components/BovedaAuthModal';
import ViewModal from './components/ViewModal';
import UploadModal from './components/UploadModal';
import ProfileModal from './components/ProfileModal';
import ForcePasswordChangeModal from './components/ForcePasswordChangeModal';
import BovedaPasswordModal from './components/BovedaPasswordModal';
import TourSpotlight from './components/TourSpotlight';
import ConnectionsModal from './components/ConnectionsModal';
import TrialWatermark from './components/TrialWatermark';
import { USERS } from './data/users';
import { useDocuments } from './hooks/useDocuments';
import { useCircularReads } from './hooks/useCircularReads';
import { useUserPresence } from './hooks/useUserPresence';
import { downloadDocumentBlob } from './services/storageService';
import { syncVaultWithSupabase, subscribeToVaultChanges, hasCustomPassword } from './services/authService';
import { syncAvatarsFromCloud, subscribeToAvatarChanges } from './services/avatarService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authVaultTick, setAuthVaultTick] = useState(0);
  const [activeModule, setActiveModule] = useState(null);
  const [avatarTick, setAvatarTick] = useState(0);
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
  const [profileTargetUserKey, setProfileTargetUserKey] = useState(null);
  const [profileInitialTab, setProfileInitialTab] = useState(null);
  const [avatarToast, setAvatarToast] = useState(null);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState(null);

  const handleOpenProfile = (targetUserKey = null, initialTab = null) => {
    const validKey = (typeof targetUserKey === 'string' && targetUserKey.trim()) 
      ? targetUserKey.trim() 
      : (currentUser?.key || 'claudia');
    const validTab = (typeof initialTab === 'string') ? initialTab : null;
    setProfileTargetUserKey(validKey);
    setProfileInitialTab(validTab);
    setIsProfileModalOpen(true);
  };

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
    syncAvatarsFromCloud().catch(() => {});

    const unsubscribeVault = subscribeToVaultChanges(() => {
      setAuthVaultTick((prev) => prev + 1);
    });
    const unsubscribeAvatars = subscribeToAvatarChanges(({ userKey, avatar }) => {
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const key = prev.key || prev.role;
        if (key === userKey) {
          return { ...prev, avatar };
        }
        return prev;
      });
      setAvatarTick((t) => t + 1);
      if (typeof refreshPresence === 'function') {
        refreshPresence();
      }
    });

    return () => {
      if (typeof unsubscribeVault === 'function') unsubscribeVault();
      if (typeof unsubscribeAvatars === 'function') unsubscribeAvatars();
    };
  }, [refreshPresence]);

  if (!currentUser) {
    return (
      <Login onLogin={(user) => {
        setCurrentUser(user);
        setActiveModule(null);
      }} />
    );
  }

  // Verificación obligatoria de primer ingreso institucional (no se puede saltar)
  const currentAccountKey = currentUser.key || currentUser.role;
  if (!hasCustomPassword(currentAccountKey)) {
    return (
      <ForcePasswordChangeModal
        currentUser={currentUser}
        onPasswordChanged={() => {
          setAuthVaultTick((prev) => prev + 1);
        }}
        onLogout={handleLogout}
      />
    );
  }

  const isPrivileged = currentUser && ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);

  // Identificar si un documento o circular está pendiente de revisión por el usuario actual
  const isDocUnread = (doc) => {
    if (!currentUser) return false;
    const isSharedOrPublic = Boolean(doc.isPublic) || doc.folder === 'institucional';
    const isFromOtherUser = doc.teacher !== currentUser.name;
    const isNotReadYet = !readCircularIds.includes(doc.id);
    return isSharedOrPublic && isFromOtherUser && isNotReadYet;
  };

  const unreadDocs = documents.filter(isDocUnread);
  const unreadCirculares = unreadDocs.filter(d => d.folder === 'institucional');
  const unreadSharedDocs = unreadDocs.filter(d => d.folder !== 'institucional');
  const totalUnreadCount = unreadDocs.length;

  const handleLogout = async () => {
    await presenceLogout();
    setCurrentUser(null);
    setIsBovedaUnlocked(false);
    setActiveModule(null);
  };

  // Manejador para abrir novedades desde la campanita unificada (en cualquier módulo)
  const handleOpenCircularesBell = () => {
    setActiveModule('docs');
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

  // Manejador para abrir la guía interactiva desde la barra superior unificada
  const handleOpenTour = () => {
    setActiveModule('docs');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('gmg_open_tour'));
    }, 150);
  };

  // Segunda Capa: Panel Principal / Dashboard Estructural (Ideas y modulos)
  if (!activeModule) {
    return (
      <>
        <ModulesDashboard 
          currentUser={currentUser}
          onSelectModule={(moduleId) => setActiveModule(moduleId)}
          onOpenProfile={handleOpenProfile}
          onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
          onlineCount={onlineCount}
          circularesCount={totalUnreadCount}
          onOpenCirculares={handleOpenCircularesBell}
          onOpenTour={handleOpenTour}
          onLogout={handleLogout}
        />
        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          initialTargetUserKey={profileTargetUserKey}
          initialTab={profileInitialTab}
          onProfileUpdated={(updatedUser) => {
            setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
          }}
          onAvatarUpdated={(targetKey, newAvatar) => {
            const targetName = USERS[targetKey]?.name || targetKey;
            setCurrentUser((prev) => {
              if (prev && (prev.key === targetKey || prev.role === targetKey)) {
                return { ...prev, avatar: newAvatar };
              }
              return prev;
            });
            setAvatarTick((t) => t + 1);
            setAvatarToast({ name: targetName });
            setTimeout(() => {
              setAvatarToast(null);
            }, 4500);

            if (typeof refreshPresence === 'function') {
              refreshPresence();
            }
          }}
        />
        <ConnectionsModal 
          isOpen={isConnectionsModalOpen}
          onClose={() => setIsConnectionsModalOpen(false)}
          presenceData={presenceData}
          currentUser={currentUser}
          onSelectTeacher={(teacherName) => {
            setCurrentTeacher(teacherName);
            setCurrentFolder('all');
            setActiveModule('docs');
          }}
          onRefresh={refreshPresence}
          loading={presenceLoading}
        />
        <TrialWatermark documents={documents} />
        {avatarToast && (
          <div className="avatar-global-toast-notification">
            <div className="toast-chulito-icon">
              <i className="ph-bold ph-check"></i>
            </div>
            <div className="toast-chulito-content">
              <strong>¡Foto de perfil actualizada!</strong>
              <span>El cambio de {avatarToast.name} se sincronizó en la nube.</span>
            </div>
            <button 
              type="button" 
              className="toast-close-btn" 
              onClick={() => setAvatarToast(null)} 
              aria-label="Cerrar notificación"
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
        )}
      </>
    );
  }

  // Módulo 2: Notas y Calificaciones (Paleta pastel y cero salto visual)
  if (activeModule === 'grades') {
    return (
      <>
        <GradesModule 
          currentUser={currentUser}
          onBackToModules={() => setActiveModule(null)}
          onNavigateToReemplazos={() => setActiveModule('reemplazos')}
          onOpenProfile={handleOpenProfile}
          onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
          onlineCount={onlineCount}
          circularesCount={totalUnreadCount}
          onOpenCirculares={handleOpenCircularesBell}
          onOpenTour={handleOpenTour}
          onLogout={handleLogout}
        />
        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          initialTargetUserKey={profileTargetUserKey}
          initialTab={profileInitialTab}
          onProfileUpdated={(updatedUser) => {
            setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
          }}
          onAvatarUpdated={(targetKey, newAvatar) => {
            const targetName = USERS[targetKey]?.name || targetKey;
            setCurrentUser((prev) => {
              if (prev && (prev.key === targetKey || prev.role === targetKey)) {
                return { ...prev, avatar: newAvatar };
              }
              return prev;
            });
            setAvatarTick((t) => t + 1);
            setAvatarToast({ name: targetName });
            setTimeout(() => {
              setAvatarToast(null);
            }, 4500);

            if (typeof refreshPresence === 'function') {
              refreshPresence();
            }
          }}
        />
        <ConnectionsModal 
          isOpen={isConnectionsModalOpen}
          onClose={() => setIsConnectionsModalOpen(false)}
          presenceData={presenceData}
          currentUser={currentUser}
          onSelectTeacher={(teacherName) => {
            setCurrentTeacher(teacherName);
            setCurrentFolder('all');
            setActiveModule('docs');
          }}
          onRefresh={refreshPresence}
          loading={presenceLoading}
        />
        <TrialWatermark documents={documents} />
        {avatarToast && (
          <div className="avatar-global-toast-notification">
            <div className="toast-chulito-icon">
              <i className="ph-bold ph-check"></i>
            </div>
            <div className="toast-chulito-content">
              <strong>¡Foto de perfil actualizada!</strong>
              <span>El cambio de {avatarToast.name} se sincronizó en la nube.</span>
            </div>
            <button 
              type="button" 
              className="toast-close-btn" 
              onClick={() => setAvatarToast(null)} 
              aria-label="Cerrar notificación"
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
        )}
      </>
    );
  }

  // Módulo Exclusivo Admin: Novedades & Reemplazos Docentes (Consola Completa y Espaciosa)
  if (activeModule === 'reemplazos') {
    return (
      <>
        <AdminReemplazosModule 
          currentUser={currentUser}
          onBackToModules={() => setActiveModule(null)}
          onNavigateToGrades={() => setActiveModule('grades')}
          onOpenProfile={handleOpenProfile}
          onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
          onlineCount={onlineCount}
          circularesCount={totalUnreadCount}
          onOpenCirculares={handleOpenCircularesBell}
          onOpenTour={handleOpenTour}
          onLogout={handleLogout}
        />
        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          initialTargetUserKey={profileTargetUserKey}
          initialTab={profileInitialTab}
          onProfileUpdated={(updatedUser) => {
            setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
          }}
          onAvatarUpdated={(targetKey, newAvatar) => {
            const targetName = USERS[targetKey]?.name || targetKey;
            setCurrentUser((prev) => {
              if (prev && (prev.key === targetKey || prev.role === targetKey)) {
                return { ...prev, avatar: newAvatar };
              }
              return prev;
            });
            setAvatarTick((t) => t + 1);
            setAvatarToast({ name: targetName });
            setTimeout(() => {
              setAvatarToast(null);
            }, 4500);

            if (typeof refreshPresence === 'function') {
              refreshPresence();
            }
          }}
        />
        <ConnectionsModal 
          isOpen={isConnectionsModalOpen}
          onClose={() => setIsConnectionsModalOpen(false)}
          presenceData={presenceData}
          currentUser={currentUser}
          onSelectTeacher={(teacherName) => {
            setCurrentTeacher(teacherName);
            setCurrentFolder('all');
            setActiveModule('docs');
          }}
          onRefresh={refreshPresence}
          loading={presenceLoading}
        />
        <TrialWatermark documents={documents} />
        {avatarToast && (
          <div className="avatar-global-toast-notification">
            <div className="toast-chulito-icon">
              <i className="ph-bold ph-check"></i>
            </div>
            <div className="toast-chulito-content">
              <strong>¡Foto de perfil actualizada!</strong>
              <span>El cambio de {avatarToast.name} se sincronizó en la nube.</span>
            </div>
            <button 
              type="button" 
              className="toast-close-btn" 
              onClick={() => setAvatarToast(null)} 
              aria-label="Cerrar notificación"
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
        )}
      </>
    );
  }

  // Manejador del clic en carpetas de Gestión Documental
  const handleFolderSelect = (folderKey) => {
    setCurrentFolder(folderKey);
    setIsSidebarOpen(false); // Cierra el menú en móvil al seleccionar
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

  // Módulo 3: Bóveda Directiva & Archivo Confidencial (Gris Pastel con Texto Negro Formal)
  if (activeModule === 'boveda') {
    return (
      <>
        <BovedaModule 
          currentUser={currentUser}
          documents={documents}
          onBackToModules={() => setActiveModule(null)}
          onOpenProfile={handleOpenProfile}
          onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
          onlineCount={onlineCount}
          circularesCount={totalUnreadCount}
          onOpenCirculares={handleOpenCircularesBell}
          onOpenTour={handleOpenTour}
          onLogout={handleLogout}
          onViewDocument={handleViewDocument}
          onDownloadDocument={handleDownloadDocument}
          onDeleteDocument={handleDeleteDocument}
          onOpenUploadModal={() => {
            setCurrentFolder('boveda');
            setIsUploadModalOpen(true);
          }}
          onOpenChangeBovedaModal={() => setIsChangeBovedaModalOpen(true)}
          isBovedaUnlocked={isBovedaUnlocked}
          setIsBovedaUnlocked={setIsBovedaUnlocked}
          isPrivileged={isPrivileged}
        />
        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          initialTargetUserKey={profileTargetUserKey}
          initialTab={profileInitialTab}
          onProfileUpdated={(updatedUser) => {
            setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
          }}
          onAvatarUpdated={(targetKey, newAvatar) => {
            const targetName = USERS[targetKey]?.name || targetKey;
            setCurrentUser((prev) => {
              if (prev && (prev.key === targetKey || prev.role === targetKey)) {
                return { ...prev, avatar: newAvatar };
              }
              return prev;
            });
            setAvatarTick((t) => t + 1);
            setAvatarToast({ name: targetName });
            setTimeout(() => {
              setAvatarToast(null);
            }, 4500);

            if (typeof refreshPresence === 'function') {
              refreshPresence();
            }
          }}
        />
        <ConnectionsModal 
          isOpen={isConnectionsModalOpen}
          onClose={() => setIsConnectionsModalOpen(false)}
          presenceData={presenceData}
          currentUser={currentUser}
          onSelectTeacher={(teacherName) => {
            setCurrentTeacher(teacherName);
            setCurrentFolder('all');
            setActiveModule('docs');
          }}
          onRefresh={refreshPresence}
          loading={presenceLoading}
        />
        <ViewModal 
          isOpen={isViewModalOpen}
          doc={selectedDocForView}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedDocForView(null);
          }}
          onDownload={handleDownloadDocument}
        />
        <UploadModal 
          key={isUploadModalOpen ? `upload_modal_${currentFolder}` : 'upload_modal_closed'}
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          currentUser={currentUser}
          onUploadSuccess={handleUploadSuccess}
          existingCount={documents.length}
          initialFolder="boveda"
          totalUsedBytes={totalUsedBytes}
        />
        <BovedaPasswordModal 
          isOpen={isChangeBovedaModalOpen}
          onClose={() => setIsChangeBovedaModalOpen(false)}
          currentUser={currentUser}
          onPasswordChanged={() => {
            console.log('Clave de Bóveda actualizada exitosamente.');
          }}
        />
        <TrialWatermark documents={documents} />
        {avatarToast && (
          <div className="avatar-global-toast-notification">
            <div className="toast-chulito-icon">
              <i className="ph-bold ph-check"></i>
            </div>
            <div className="toast-chulito-content">
              <strong>¡Foto de perfil actualizada!</strong>
              <span>El cambio de {avatarToast.name} se sincronizó en la nube.</span>
            </div>
            <button 
              type="button" 
              className="toast-close-btn" 
              onClick={() => setAvatarToast(null)} 
              aria-label="Cerrar notificación"
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div id="appContainer">
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenCirculares={handleOpenCircularesBell}
        circularesCount={totalUnreadCount}
        onOpenProfile={() => handleOpenProfile(currentUser?.key)}
        onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
        onlineCount={onlineCount}
        onBackToModules={() => setActiveModule(null)}
        onOpenTour={handleOpenTour}
      />
      
      <div className="app-layout">
        <div className={`sidebar-container ${isSidebarOpen ? 'mobile-open' : ''}`}>
          <Sidebar 
            key={`sidebar_${avatarTick}`}
            currentUser={currentUser} 
            currentFolder={currentFolder} 
            onFolderSelect={handleFolderSelect}
            currentTeacher={currentTeacher}
            onTeacherSelect={(t) => { setCurrentTeacher(t); setIsSidebarOpen(false); }}
            documents={documents}
            circularesCount={unreadCirculares.length}
            unreadSharedCount={unreadSharedDocs.length}
            onOpenProfile={handleOpenProfile}
            onlineMap={onlineMap}
            onlineCount={onlineCount}
            onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
            onBackToModules={() => setActiveModule(null)}
          />
        </div>

        {isSidebarOpen && (
          <div className="mobile-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
        )}
        
        <main className="main-content">
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
        initialTargetUserKey={profileTargetUserKey}
        initialTab={profileInitialTab}
        onProfileUpdated={(userKey) => {
          // Si el usuario actual actualiza su contraseña, mantenemos la sesión sincronizada
          console.log(`Credenciales institucionales actualizadas para: ${userKey}`);
        }}
        onAvatarUpdated={(targetKey, newAvatar) => {
          const targetName = USERS[targetKey]?.name || targetKey;
          setCurrentUser((prev) => {
            if (prev && (prev.key === targetKey || prev.role === targetKey)) {
              return { ...prev, avatar: newAvatar };
            }
            return prev;
          });
          setAvatarTick((t) => t + 1);
          setAvatarToast({ name: targetName });
          setTimeout(() => {
            setAvatarToast(null);
          }, 4500);

          if (typeof refreshPresence === 'function') {
            refreshPresence();
          }
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

      {/* Botón Flotante para Subir Documento en Gestión Documental (Inferior Derecha) */}
      <button 
        type="button" 
        id="btnOpenModal" 
        className="btn-floating-upload" 
        onClick={() => setIsUploadModalOpen(true)}
        title="Subir Nuevo Documento a Gestión Documental"
      >
        <i className="ph-bold ph-cloud-arrow-up"></i>
        <span>Subir Documento</span>
      </button>

      {/* Guía Interactiva Spotlight */}
      <TourSpotlight currentUser={currentUser} />

      {/* Marca de Agua Inferior Derecha: Fase de Prueba */}
      <TrialWatermark documents={documents} />

      {/* Notificación Toast Global con Chulito al Cambiar Foto de Perfil */}
      {avatarToast && (
        <div className="avatar-global-toast-notification">
          <div className="toast-chulito-icon">
            <i className="ph-bold ph-check"></i>
          </div>
          <div className="toast-chulito-content">
            <strong>¡Foto de perfil actualizada!</strong>
            <span>El cambio de {avatarToast.name} se sincronizó en la nube.</span>
          </div>
          <button 
            type="button" 
            className="toast-close-btn" 
            onClick={() => setAvatarToast(null)} 
            aria-label="Cerrar notificación"
          >
            <i className="ph-bold ph-x"></i>
          </button>
        </div>
      )}
    </div>
  );
}