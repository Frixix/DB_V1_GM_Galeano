import { useState } from 'react';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import DocumentCard from './components/DocumentCard';
import DocumentTable from './components/DocumentTable';
import BovedaAuthModal from './components/BovedaAuthModal';
import { initialDocuments } from './data/initialDocs';

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

  const [documents, setDocuments] = useState(initialDocuments);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const isPrivileged = ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);

  // Manejador del clic en Bóveda
  const handleFolderSelectWithBoveda = (folderKey) => {
    if (folderKey === 'boveda' && !isBovedaUnlocked) {
      setIsBovedaModalOpen(true);
      return;
    }
    setCurrentFolder(folderKey);
    setIsSidebarOpen(false); // Cierra el menú en móvil al seleccionar
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
        onOpenUploadModal={() => alert("Pronto abriremos el modal de subida de archivos")}
      />
      
      <div className="app-layout">
        <div className={`sidebar-container ${isSidebarOpen ? 'mobile-open' : ''}`}>
          <Sidebar 
            currentUser={currentUser} 
            currentFolder={currentFolder} 
            onFolderSelect={handleFolderSelectWithBoveda}
            currentTeacher={currentTeacher}
            onTeacherSelect={(t) => { setCurrentTeacher(t); setIsSidebarOpen(false); }}
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

          {filteredDocs.length > 0 ? (
            currentView === 'cards' ? (
              <div className="cards-grid">
                {filteredDocs.map(doc => (
                  <DocumentCard 
                    key={doc.id} 
                    doc={doc} 
                    onView={(id) => alert(`Ver documento: ${id}`)}
                    onDownload={(id) => alert(`Descargar archivo: ${id}`)}
                    canDelete={isPrivileged}
                  />
                ))}
              </div>
            ) : (
              <DocumentTable 
                documents={filteredDocs}
                onView={(id) => alert(`Ver documento: ${id}`)}
                onDownload={(id) => alert(`Descargar archivo: ${id}`)}
                canDelete={isPrivileged}
              />
            )
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No se encontraron registros en esta sección.</p>
          )}
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
    </div>
  );
}