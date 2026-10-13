import { useState } from 'react';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import DocumentCard from './components/DocumentCard';
import DocumentTable from './components/DocumentTable';
import BovedaAuthModal from './components/BovedaAuthModal';
import ViewModal from './components/ViewModal';
import UploadModal from './components/UploadModal';
import TourSpotlight from './components/TourSpotlight';
import { useDocuments } from './hooks/useDocuments';

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
  const [bovedaYear, setBovedaYear] = useState('all');
  const [bovedaSubfolder, setBovedaSubfolder] = useState('all');

  // Modales interactivos
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState(null);

  const { documents, addDocument, deleteDocument } = useDocuments();
  const [readByUsers, setReadByUsers] = useState(() => {
    try {
      const stored = localStorage.getItem('read_circulares_v2');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const isPrivileged = ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);
  const currentUserKey = `${currentUser.role}_${currentUser.name.replace(/\s+/g, '_').toLowerCase()}`;
  const readCircularIds = readByUsers[currentUserKey] || [];

  // Marcar una circular específica como leída solo para el usuario actual
  const markCircularAsRead = (id) => {
    setReadByUsers(prev => {
      const currentList = prev[currentUserKey] || [];
      if (currentList.includes(id)) return prev;
      const updated = { ...prev, [currentUserKey]: [...currentList, id] };
      try {
        localStorage.setItem('read_circulares_v2', JSON.stringify(updated));
      } catch {
        // Ignorar
      }
      return updated;
    });
  };

  // Circulares pendientes por leer (independiente por usuario, excluyendo al emisor)
  const unreadCirculares = documents.filter(
    d => d.folder === 'institucional' && d.teacher !== currentUser.name && !readCircularIds.includes(d.id)
  );
  const circularesCount = unreadCirculares.length;

  // Manejador del clic en Bóveda y carpetas
  const handleFolderSelectWithBoveda = (folderKey) => {
    if (folderKey === 'boveda' && !isBovedaUnlocked) {
      setIsBovedaModalOpen(true);
      return;
    }
    setCurrentFolder(folderKey);
    setIsSidebarOpen(false); // Cierra el menú en móvil al seleccionar
  };

  // Manejador para abrir circulares desde la campanita
  const handleOpenCircularesBell = () => {
    setCurrentFolder('institucional');
    if (unreadCirculares.length > 0) {
      const target = unreadCirculares[0];
      setSelectedDocForView(target);
      setIsViewModalOpen(true);
      markCircularAsRead(target.id);
    }
  };

  // Manejador para ver documento (al leer una circular se apaga la notificación y el puntito)
  const handleViewDocument = (id) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setSelectedDocForView(doc);
      setIsViewModalOpen(true);
      if (doc.folder === 'institucional') {
        markCircularAsRead(doc.id);
      }
    }
  };

  // Manejador para descargar archivo (también apaga la notificación y el puntito rojo)
  const handleDownloadDocument = (docOrId) => {
    const doc = typeof docOrId === 'object' ? docOrId : documents.find(d => d.id === docOrId);
    if (!doc) return;

    if (doc.folder === 'institucional') {
      markCircularAsRead(doc.id);
    }

    if (doc.fileBlob instanceof Blob) {
      const url = URL.createObjectURL(doc.fileBlob);
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
    if (doc.folder === 'boveda' && (!isPrivileged || !isBovedaUnlocked)) return false;

    if (!isPrivileged) {
      const teacherMatch = doc.teacher === currentUser.name;
      const isShared = Boolean(doc.isPublic) || doc.folder === 'institucional';
      if (!teacherMatch && !isShared) return false;
    }

    if (isPrivileged && currentTeacher !== 'all') {
      if (doc.teacher !== currentTeacher) return false;
    }

    if (currentFolder === 'boveda') {
      if (doc.folder !== 'boveda') return false;
      if (bovedaYear !== 'all' && doc.bovedaYear !== bovedaYear) return false;
      if (bovedaSubfolder !== 'all' && doc.bovedaSubfolder !== bovedaSubfolder) return false;
    } else if (currentFolder === 'publico') {
      if (!doc.isPublic) return false;
    } else if (currentFolder !== 'all') {
      if (doc.folder !== currentFolder) return false;
    } else {
      if (doc.folder === 'boveda') return false;
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
        onLogout={() => { setCurrentUser(null); setIsBovedaUnlocked(false); }} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenCirculares={handleOpenCircularesBell}
        circularesCount={circularesCount}
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
            circularesCount={circularesCount}
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
                <div className="boveda-banner-icon"><i className="ph-bold ph-shield-check"></i></div>
                <div>
                  <h3>Bóveda Directiva de Alta Capacidad</h3>
                  <p>Archivos institucionales organizados por año y subcarpeta.</p>
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
                      isUnread={doc.folder === 'institucional' && doc.teacher !== currentUser.name && !readCircularIds.includes(doc.id)}
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
      />

      {/* Guía Interactiva Spotlight */}
      <TourSpotlight currentUser={currentUser} />
    </div>
  );
}