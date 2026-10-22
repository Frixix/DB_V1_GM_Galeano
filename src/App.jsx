import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import Login from './components/Login';
import ModulesDashboard from './components/ModulesDashboard';
import LoadingSpinner from './components/LoadingSpinner';

const GradesModule = lazy(() => import('./components/GradesModule'));
const BovedaModule = lazy(() => import('./components/BovedaModule'));
const ObservadorModule = lazy(() => import('./components/ObservadorModule'));
const FinalExamsModule = lazy(() => import('./components/FinalExamsModule'));
const GestionDocenteModule = lazy(() => import('./components/GestionDocenteModule'));
const MatriculasModule = lazy(() => import('./components/MatriculasModule'));
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
import ForceBovedaPasswordModal from './components/ForceBovedaPasswordModal';
import TourSpotlight from './components/TourSpotlight';
import ConnectionsModal from './components/ConnectionsModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import NotificationCenter from './components/NotificationCenter';
import TrialWatermark from './components/TrialWatermark';
import ModuleThemeWrapper from './components/common/ModuleThemeWrapper';
import { USERS } from './data/users';
import { useDocuments } from './hooks/useDocuments';
import { useCircularReads } from './hooks/useCircularReads';
import { useObservador } from './hooks/useObservador';
import { getDeadlineMeta } from './utils/observadorDates';
import { useUserPresence } from './hooks/useUserPresence';
import { downloadDocumentBlob } from './services/storageService';
import { syncVaultWithSupabase, subscribeToVaultChanges, hasCustomPassword, hasBovedaCustomPassword } from './services/authService';
import { syncAvatarsFromCloud, subscribeToAvatarChanges } from './services/avatarService';
import gradesService from './services/gradesService';

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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [observadorDeepLink, setObservadorDeepLink] = useState(null);

  const handleOpenProfile = useCallback((targetUserKey = null, initialTab = null) => {
    const validKey = (typeof targetUserKey === 'string' && targetUserKey.trim()) 
      ? targetUserKey.trim() 
      : (currentUser?.key || 'claudia');
    const validTab = (typeof initialTab === 'string') ? initialTab : null;
    setProfileTargetUserKey(validKey);
    setProfileInitialTab(validTab);
    setIsProfileModalOpen(true);
  }, [currentUser?.key]);

  const { documents, addDocument, deleteDocument } = useDocuments();
  const { readCircularIds, markAsRead: markCircularAsRead, markAllAsRead } = useCircularReads(currentUser);
  const { records: observadorRecords } = useObservador();

  const totalUsedBytes = documents.reduce((sum, doc) => sum + (doc.rawBytes || 0), 0);

  // Escucha reactiva de actualizaciones del roster escolar (ingresos / inhabilitaciones N+1)
  const [rosterTick, setRosterTick] = useState(0);
  useEffect(() => {
    const handleRosterUpdate = () => {
      setRosterTick(t => t + 1);
    };
    window.addEventListener('gmg_roster_updated', handleRosterUpdate);
    return () => window.removeEventListener('gmg_roster_updated', handleRosterUpdate);
  }, []);

  // Control de asistencia y conexiones en tiempo real
  const {
    presenceData,
    onlineMap,
    onlineCount,
    refresh: refreshPresence,
    loading: presenceLoading,
    handleLogout: presenceLogout,
  } = useUserPresence(currentUser);

  // Solicitar cierre de sesión (abre el modal interactivo de confirmación)
  const handleLogout = useCallback(() => {
    setIsLogoutModalOpen(true);
  }, []);

  const handleToggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const handleCloseSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const handleTeacherSelect = useCallback((t) => {
    setCurrentTeacher(t);
    setIsSidebarOpen(false);
  }, []);
  const handleOpenConnectionsModal = useCallback(() => setIsConnectionsModalOpen(true), []);
  const handleBackToModules = useCallback(() => setActiveModule(null), []);
  const handleOpenCurrentUserProfile = useCallback(() => {
    handleOpenProfile(currentUser?.key);
  }, [handleOpenProfile, currentUser?.key]);

  // Ejecución definitiva del cierre de sesión tras confirmación del usuario
  const executeLogout = async () => {
    setIsLogoutModalOpen(false);
    try {
      if (typeof presenceLogout === 'function') {
        await presenceLogout();
      }
    } catch (err) {
      console.warn('Error during presence logout:', err);
    }
    setCurrentUser(null);
    setIsBovedaUnlocked(false);
    setActiveModule(null);
  };

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

    const handleTeachersUpdated = () => {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const key = prev.key || prev.role;
        const updatedUser = USERS[key];
        if (updatedUser) {
          return {
            ...prev,
            name: updatedUser.name || prev.name,
            label: updatedUser.label || prev.label,
            status: updatedUser.status || prev.status || 'activa'
          };
        }
        return prev;
      });
    };

    window.addEventListener('gmg_teachers_updated', handleTeachersUpdated);

    return () => {
      if (typeof unsubscribeVault === 'function') unsubscribeVault();
      if (typeof unsubscribeAvatars === 'function') unsubscribeAvatars();
      window.removeEventListener('gmg_teachers_updated', handleTeachersUpdated);
    };
  }, [refreshPresence]);

  useEffect(() => {
    gradesService.setActiveUser(currentUser);
  }, [currentUser]);

  // Verificación estricta de permisos para módulos institucionales
  useEffect(() => {
    const canAccessGrades = currentUser && ['admin', 'coordinador', 'rectora', 'induccion_rectora', 'docente', 'induccion'].includes(currentUser.role);
    if (!canAccessGrades && activeModule === 'grades') {
      setActiveModule(null);
    }
    const canAccessDocentes = currentUser && ['admin', 'coordinador', 'rectora', 'induccion_rectora'].includes(currentUser.role);
    if (!canAccessDocentes && (activeModule === 'docentes' || activeModule === 'gestion_docente')) {
      setActiveModule(null);
    }
    const canAccessMatriculas = currentUser && ['admin', 'coordinador', 'rectora', 'induccion_rectora'].includes(currentUser.role);
    if (!canAccessMatriculas && (activeModule === 'matriculas' || activeModule === 'matricula')) {
      setActiveModule(null);
    }
    if (activeModule === 'reemplazos') {
      setActiveModule(null);
    }
  }, [currentUser, activeModule]);

  const isPrivileged = currentUser && ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);
  const isCoordinador = currentUser && currentUser.role === 'coordinador';
  const isInduccionUser = currentUser && (currentUser.role === 'induccion' || currentUser.role === 'induccion_rectora');
  const canAuditDocs = isPrivileged || isCoordinador;

  // Identificar si un documento o circular está pendiente de revisión por el usuario actual
  const isDocUnread = useCallback((doc) => {
    if (!currentUser) return false;
    const isSharedOrPublic = Boolean(doc.isPublic) || doc.folder === 'institucional';
    const isFromOtherUser = doc.teacher !== currentUser.name;
    const isNotReadYet = !readCircularIds.includes(doc.id);
    return isSharedOrPublic && isFromOtherUser && isNotReadYet;
  }, [currentUser, readCircularIds]);

  const unreadDocs = documents.filter(isDocUnread);
  const unreadCirculares = unreadDocs.filter((d) => d.folder === 'institucional');
  const unreadSharedDocs = unreadDocs.filter((d) => d.folder !== 'institucional');

  // Conteo de alertas pendientes en Observador y Actas de Comités
  const unreadObservadorCount = useMemo(() => {
    if (!currentUser || !observadorRecords) return 0;
    const isPrivileged = ['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(currentUser.role);
    return observadorRecords.filter((rec) => {
      const isCommitteeRoute = ['comite_convivencia', 'comision_evaluacion', 'consejo_academico', 'reuniones_docentes'].includes(rec.route);
      const isOwnCase = rec.teacher === currentUser.name;
      if (!isPrivileged && !isCommitteeRoute && !isOwnCase) return false;

      const meta = getDeadlineMeta(rec);
      const isResolved = meta.isResolved || rec.status === 'resuelto' || rec.semaforo === 'verde';
      if (isResolved) return false;

      const isUnread = !readCircularIds.includes(rec.id);
      const isOverdueOrToday = meta.isOverdue || meta.isExpiringToday;

      return isUnread || isOverdueOrToday;
    }).length;
  }, [currentUser, observadorRecords, readCircularIds]);

  const totalUnreadCount = unreadDocs.length + unreadObservadorCount;

  // Manejador para abrir novedades o alternar el Centro de Notificaciones (en cualquier módulo)
  const handleOpenCircularesBell = useCallback(() => {
    setIsNotificationsOpen((prev) => !prev);
  }, []);

  const handleCloseNotifications = useCallback(() => {
    setIsNotificationsOpen(false);
  }, []);

  // Manejador para seleccionar alerta con DEEP-LINKING hacia el recurso específico
  // Regla estricta: NO se marca como leída al vuelo al abrir la alerta
  const handleSelectNotification = useCallback((notif) => {
    setIsNotificationsOpen(false);
    if (!notif) return;

    const route = notif.route || {};
    const targetModule = route.module || notif.module;

    if (targetModule === 'docs') {
      setActiveModule('docs');
      if (route.folder) {
        setCurrentFolder(route.folder);
      }
      const targetDoc = route.targetData || documents.find((d) => d.id === route.resourceId) || notif.doc;
      if (targetDoc) {
        setSelectedDocForView(targetDoc);
        setIsViewModalOpen(true);
      }
    } else if (targetModule === 'observador') {
      setActiveModule('observador');
      setObservadorDeepLink({
        routeTab: route.routeTab || 'all',
        recordId: route.resourceId,
        action: route.action || 'view_record',
        targetData: route.targetData,
        timestamp: Date.now()
      });
    } else if (targetModule === 'grades' || targetModule === 'calificaciones') {
      setActiveModule('grades');
    } else if (targetModule === 'boveda') {
      setActiveModule('boveda');
    } else if (targetModule === 'evaluaciones') {
      setActiveModule('evaluaciones');
    } else if (targetModule === 'gestion_docente' || targetModule === 'docentes') {
      setActiveModule('gestion_docente');
    }
  }, [documents]);

  // Manejador para confirmar lectura explícita desde el detalle o notificación
  const handleConfirmRead = useCallback((documentId) => {
    markCircularAsRead(documentId);
  }, [markCircularAsRead]);

  // Manejador para confirmar todas las lecturas explícitas
  const handleConfirmAllReads = useCallback((documentIds) => {
    markAllAsRead(documentIds);
  }, [markAllAsRead]);

  // Manejador para abrir la guía interactiva desde la barra superior unificada
  const handleOpenTour = useCallback(() => {
    window.dispatchEvent(new CustomEvent('gmg_open_tour'));
  }, []);

  // Manejador del clic en carpetas de Gestión Documental
  const handleFolderSelect = useCallback((folderKey) => {
    setCurrentFolder(folderKey);
    setIsSidebarOpen(false); // Cierra el menú en móvil al seleccionar
  }, []);

  // Manejador para ver documento (Regla estricta: NO se marca automáticamente al vuelo)
  const handleViewDocument = useCallback((id) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setSelectedDocForView(doc);
      setIsViewModalOpen(true);
    }
  }, [documents]);

  // Manejador para descargar archivo (Regla estricta: NO se marca automáticamente al vuelo)
  const handleDownloadDocument = useCallback(async (docOrId) => {
    const doc = typeof docOrId === 'object' && docOrId !== null ? docOrId : documents.find(d => d.id === docOrId);
    if (!doc) return;

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
  }, [documents, markCircularAsRead]);

  // Manejador para eliminar documento
  const handleDeleteDocument = useCallback((id) => {
    const target = documents.find(d => d.id === id);
    const confirmMessage = target 
      ? `¿Está seguro de eliminar el registro "${target.title}" (Radicado: ${id})?\nEsta acción no se puede deshacer.`
      : `¿Está seguro de eliminar el registro ${id}?`;

    if (window.confirm(confirmMessage)) {
      deleteDocument(id, isInduccionUser);
      setSelectedDocForView(prev => {
        if (prev?.id === id) {
          setIsViewModalOpen(false);
          return null;
        }
        return prev;
      });
    }
  }, [documents, deleteDocument, isInduccionUser]);

  // Manejador para registrar nuevo documento
  const handleUploadSuccess = useCallback(async (newDoc) => {
    return await addDocument(isInduccionUser ? { ...newDoc, isSimulated: true } : newDoc);
  }, [addDocument, isInduccionUser]);

  if (!currentUser) {
    return (
      <Login onLogin={(user) => {
        setCurrentUser(user);
        setActiveModule(null);
      }} />
    );
  }

  // Verificación obligatoria de primer ingreso institucional (no se puede saltar, salvo cuentas de inducción guiada)
  const currentAccountKey = currentUser.key || currentUser.role;
  if (!isInduccionUser && !hasCustomPassword(currentAccountKey)) {
    const handleCancelFirstLogin = async () => {
      setIsLogoutModalOpen(false);
      try {
        if (typeof presenceLogout === 'function') {
          await presenceLogout();
        }
      } catch (err) {
        console.warn('Error during presence logout:', err);
      }
      setCurrentUser(null);
      setIsBovedaUnlocked(false);
      setActiveModule(null);
    };

    return (
      <>
        <ForcePasswordChangeModal
          currentUser={currentUser}
          onPasswordChanged={() => {
            setAuthVaultTick((prev) => prev + 1);
          }}
          onLogout={handleCancelFirstLogin}
        />
        <LogoutConfirmModal 
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={executeLogout}
          currentUser={currentUser}
        />
        <TourSpotlight currentUser={currentUser} />
      </>
    );
  }

  // Segunda Capa: Panel Principal / Dashboard Estructural (Ideas y modulos)
  if (!activeModule || activeModule === 'reemplazos') {
    return (
      <>
        <ModulesDashboard 
          currentUser={currentUser}
          onSelectModule={(moduleId) => {
            if (moduleId === 'reemplazos') {
              setActiveModule(null);
              return;
            }
            setActiveModule(moduleId);
          }}
          onOpenProfile={handleOpenProfile}
          onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
          onlineCount={onlineCount}
          circularesCount={totalUnreadCount}
          isNotificationsOpen={isNotificationsOpen}
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
        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={handleCloseNotifications}
          currentUser={currentUser}
          documents={documents}
          observadorRecords={observadorRecords}
          readCircularIds={readCircularIds}
          onSelectNotification={handleSelectNotification}
          onConfirmRead={handleConfirmRead}
          onConfirmAllReads={handleConfirmAllReads}
        />
        <LogoutConfirmModal 
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={executeLogout}
          currentUser={currentUser}
        />
        <TourSpotlight currentUser={currentUser} />
      </>
    );
  }

  // Módulo de Gestión Docente & Planta Curricular (Coordinación, Rectoría y Administración)
  if (activeModule === 'docentes' || activeModule === 'gestion_docente') {
    return (
      <ModuleThemeWrapper themeKey="gestionDocente">
        <Suspense fallback={<LoadingSpinner message="Cargando Gestión Docente & Planta Curricular..." />}>
          <GestionDocenteModule 
            currentUser={currentUser}
            onBackToModules={() => setActiveModule(null)}
            onOpenProfile={handleOpenProfile}
            onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
            onlineMap={onlineMap}
            onlineCount={onlineCount}
            circularesCount={totalUnreadCount}
          isNotificationsOpen={isNotificationsOpen}
            onOpenCirculares={handleOpenCircularesBell}
            onOpenTour={handleOpenTour}
            onLogout={handleLogout}
          />
        </Suspense>
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
        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={handleCloseNotifications}
          currentUser={currentUser}
          documents={documents}
          observadorRecords={observadorRecords}
          readCircularIds={readCircularIds}
          onSelectNotification={handleSelectNotification}
          onConfirmRead={handleConfirmRead}
          onConfirmAllReads={handleConfirmAllReads}
        />
        <LogoutConfirmModal 
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={executeLogout}
          currentUser={currentUser}
        />
      </ModuleThemeWrapper>
    );
  }

  // Módulo de Gestión de Matrícula e Histórico Blindado (Fase 5: Solo Admin, Rectora y Coordinación)
  if (activeModule === 'matriculas' || activeModule === 'matricula') {
    return (
      <ModuleThemeWrapper themeKey="matriculas">
        <Suspense fallback={<LoadingSpinner message="Cargando Panel de Matriculados (Fase 5)..." />}>
          <MatriculasModule 
            currentUser={currentUser}
            onBackToModules={() => setActiveModule(null)}
            onOpenProfile={handleOpenProfile}
            onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
            onlineMap={onlineMap}
            onlineCount={onlineCount}
            circularesCount={totalUnreadCount}
            isNotificationsOpen={isNotificationsOpen}
            onOpenCirculares={handleOpenCircularesBell}
            onOpenTour={handleOpenTour}
            onLogout={handleLogout}
          />
        </Suspense>
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
        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={handleCloseNotifications}
          currentUser={currentUser}
          documents={documents}
          observadorRecords={observadorRecords}
          readCircularIds={readCircularIds}
          onSelectNotification={handleSelectNotification}
          onConfirmRead={handleConfirmRead}
          onConfirmAllReads={handleConfirmAllReads}
        />
        <LogoutConfirmModal 
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={executeLogout}
          currentUser={currentUser}
        />
      </ModuleThemeWrapper>
    );
  }

  // Módulo 2: Notas y Calificaciones (Paleta pastel y cero salto visual)
  if (activeModule === 'grades') {
    return (
      <ModuleThemeWrapper themeKey="notas">
        <Suspense fallback={<LoadingSpinner message="Cargando Calificaciones & SIEE..." />}>
          <GradesModule 
            currentUser={currentUser}
            onBackToModules={() => setActiveModule(null)}
            onOpenProfile={handleOpenProfile}
            onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
            onlineMap={onlineMap}
            onlineCount={onlineCount}
            circularesCount={totalUnreadCount}
          isNotificationsOpen={isNotificationsOpen}
            onOpenCirculares={handleOpenCircularesBell}
            onOpenTour={handleOpenTour}
            onLogout={handleLogout}
          />
        </Suspense>
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
        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={handleCloseNotifications}
          currentUser={currentUser}
          documents={documents}
          observadorRecords={observadorRecords}
          readCircularIds={readCircularIds}
          onSelectNotification={handleSelectNotification}
          onConfirmRead={handleConfirmRead}
          onConfirmAllReads={handleConfirmAllReads}
        />
        <LogoutConfirmModal 
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={executeLogout}
          currentUser={currentUser}
        />
      </ModuleThemeWrapper>
    );
  }



  // Módulo 5: Evaluaciones Finales (Pruebas Acumulativas & Cierres SIEE)
  if (activeModule === 'evaluaciones') {
    return (
      <ModuleThemeWrapper themeKey="evaluaciones">
        <Suspense fallback={<LoadingSpinner message="Cargando Evaluaciones & Exámenes Finales..." />}>
          <FinalExamsModule 
            currentUser={currentUser}
            onBackToModules={() => setActiveModule(null)}
            onOpenProfile={handleOpenProfile}
            onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
            onlineMap={onlineMap}
            onlineCount={onlineCount}
            circularesCount={totalUnreadCount}
          isNotificationsOpen={isNotificationsOpen}
            onOpenCirculares={handleOpenCircularesBell}
            onOpenTour={handleOpenTour}
            onLogout={handleLogout}
          />
        </Suspense>
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
        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={handleCloseNotifications}
          currentUser={currentUser}
          documents={documents}
          observadorRecords={observadorRecords}
          readCircularIds={readCircularIds}
          onSelectNotification={handleSelectNotification}
          onConfirmRead={handleConfirmRead}
          onConfirmAllReads={handleConfirmAllReads}
        />
        <LogoutConfirmModal 
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={executeLogout}
          currentUser={currentUser}
        />
      </ModuleThemeWrapper>
    );
  }

  const filteredDocs = documents.filter(doc => {
    // 1. Bóveda: solo si el usuario es privilegiado y está desbloqueada
    if (doc.folder === 'boveda' && (!isPrivileged || !isBovedaUnlocked)) return false;

    // 2. Privacidad estricta para docentes:
    // Si NO es admin/rectora/coordinador, solo puede ver:
    // - Documentos propios (doc.teacher === currentUser.name)
    // - Documentos públicos o institucionales (doc.isPublic || doc.folder === 'institucional')
    if (!canAuditDocs) {
      const isOwner = doc.teacher === currentUser.name;
      const isShared = Boolean(doc.isPublic) || doc.folder === 'institucional';
      if (!isOwner && !isShared) return false;
    }

    // 3. Auditoría por docente (Rectoría / Admin / Coordinación)
    if (canAuditDocs && currentTeacher !== 'all') {
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
      <ModuleThemeWrapper themeKey="boveda">
        <Suspense fallback={<LoadingSpinner message="Cargando Bóveda Directiva & Archivo Confidencial..." />}>
          <BovedaModule 
            currentUser={currentUser}
            documents={documents}
            onBackToModules={() => setActiveModule(null)}
            onOpenProfile={handleOpenProfile}
            onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
            onlineCount={onlineCount}
            circularesCount={totalUnreadCount}
          isNotificationsOpen={isNotificationsOpen}
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
        </Suspense>
        {!hasBovedaCustomPassword(currentUser) && (
          <ForceBovedaPasswordModal
            currentUser={currentUser}
            onSuccess={() => {
              setIsBovedaUnlocked(true);
              setAuthVaultTick((prev) => prev + 1);
            }}
            onCancel={() => {
              setActiveModule(null);
            }}
          />
        )}
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
          isUnread={selectedDocForView ? isDocUnread(selectedDocForView) : false}
          onConfirmRead={handleConfirmRead}
        />
        <UploadModal 
          key={isUploadModalOpen ? `upload_modal_${currentFolder}` : 'upload_modal_closed'}
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          currentUser={currentUser}
          onUploadSuccess={handleUploadSuccess}
          existingCount={documents}
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
        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={handleCloseNotifications}
          currentUser={currentUser}
          documents={documents}
          observadorRecords={observadorRecords}
          readCircularIds={readCircularIds}
          onSelectNotification={handleSelectNotification}
          onConfirmRead={handleConfirmRead}
          onConfirmAllReads={handleConfirmAllReads}
        />
        <LogoutConfirmModal 
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={executeLogout}
          currentUser={currentUser}
        />
      </ModuleThemeWrapper>
    );
  }

  // Módulo 4: Observador del Estudiante & Actas de Comités Internos (Estilo Teal Pastel)
  if (activeModule === 'observador') {
    return (
      <ModuleThemeWrapper themeKey="observador">
        <Suspense fallback={<LoadingSpinner message="Cargando Observador & Comités..." />}>
          <ObservadorModule 
            currentUser={currentUser}
            onBackToModules={() => setActiveModule(null)}
            onOpenProfile={handleOpenProfile}
            onOpenConnectionsModal={() => setIsConnectionsModalOpen(true)}
            onlineCount={onlineCount}
            onlineMap={onlineMap}
            circularesCount={totalUnreadCount}
            isNotificationsOpen={isNotificationsOpen}
            onOpenCirculares={handleOpenCircularesBell}
            onOpenTour={handleOpenTour}
            onLogout={handleLogout}
            deepLinkTarget={observadorDeepLink}
            onClearDeepLink={() => setObservadorDeepLink(null)}
            readCircularIds={readCircularIds}
            onConfirmRead={handleConfirmRead}
          />
        </Suspense>
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
        <NotificationCenter
          isOpen={isNotificationsOpen}
          onClose={handleCloseNotifications}
          currentUser={currentUser}
          documents={documents}
          observadorRecords={observadorRecords}
          readCircularIds={readCircularIds}
          onSelectNotification={handleSelectNotification}
          onConfirmRead={handleConfirmRead}
          onConfirmAllReads={handleConfirmAllReads}
        />
        <LogoutConfirmModal 
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={executeLogout}
          currentUser={currentUser}
        />
      </ModuleThemeWrapper>
    );
  }

  return (
    <ModuleThemeWrapper themeKey="recursos">
      <div id="appContainer">
        <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onToggleSidebar={handleToggleSidebar}
        onOpenCirculares={handleOpenCircularesBell}
        circularesCount={totalUnreadCount}
        isNotificationsOpen={isNotificationsOpen}
        onOpenProfile={handleOpenCurrentUserProfile}
        onOpenConnectionsModal={handleOpenConnectionsModal}
        onlineCount={onlineCount}
        onBackToModules={handleBackToModules}
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
            onTeacherSelect={handleTeacherSelect}
            documents={documents}
            circularesCount={unreadCirculares.length}
            unreadSharedCount={unreadSharedDocs.length}
            onOpenProfile={handleOpenProfile}
            onlineMap={onlineMap}
            onlineCount={onlineCount}
            onOpenConnectionsModal={handleOpenConnectionsModal}
            onBackToModules={handleBackToModules}
          />
        </div>

        {isSidebarOpen && (
          <div className="mobile-backdrop" onClick={handleCloseSidebar}></div>
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
                      key={`${doc.id}_${rosterTick}`} 
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
                  key={`table_${rosterTick}`}
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

      {/* Modal de Autenticación de Bóveda (o cambio forzado si usa la clave inicial boveda2026) */}
      {isBovedaModalOpen && !hasBovedaCustomPassword(currentUser) ? (
        <ForceBovedaPasswordModal
          currentUser={currentUser}
          onSuccess={() => {
            setIsBovedaUnlocked(true);
            setIsBovedaModalOpen(false);
            setCurrentFolder('boveda');
            setAuthVaultTick((prev) => prev + 1);
          }}
          onCancel={() => {
            setIsBovedaModalOpen(false);
          }}
        />
      ) : (
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
      )}

      {/* Modal para Ver Documento */}
      <ViewModal 
        key={`view_${selectedDocForView?.id}_${rosterTick}`}
        isOpen={isViewModalOpen}
        doc={selectedDocForView}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedDocForView(null);
        }}
        onDownload={handleDownloadDocument}
        isUnread={selectedDocForView ? isDocUnread(selectedDocForView) : false}
        onConfirmRead={handleConfirmRead}
      />

      {/* Modal para Subir Documento */}
      <UploadModal 
        key={isUploadModalOpen ? `upload_modal_${currentFolder}_${rosterTick}` : 'upload_modal_closed'}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentUser={currentUser}
        onUploadSuccess={handleUploadSuccess}
        existingCount={documents}
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

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={handleCloseNotifications}
        currentUser={currentUser}
        documents={documents}
        observadorRecords={observadorRecords}
        readCircularIds={readCircularIds}
        onSelectNotification={handleSelectNotification}
        onConfirmRead={handleConfirmRead}
        onConfirmAllReads={handleConfirmAllReads}
      />

      {/* Modal de Confirmación de Cierre de Sesión */}
      <LogoutConfirmModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={executeLogout}
        currentUser={currentUser}
      />
    </div>
  </ModuleThemeWrapper>
);
}