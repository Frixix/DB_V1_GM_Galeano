import { useState } from 'react';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DocumentCard from './components/DocumentCard';
import { initialDocuments } from './data/initialDocs';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('all');
  const [currentTeacher, setCurrentTeacher] = useState('all');
  const [documents, setDocuments] = useState(initialDocuments);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const isPrivileged = ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);

  // Motor de filtrado idéntico a tu lógica de negocio
  const filteredDocs = documents.filter(doc => {
    // Si no es staff y entra a bóveda, se oculta
    if (doc.folder === 'boveda' && !isPrivileged) return false;

    // Si es docente regular, solo ve lo suyo, lo público o institucional
    if (!isPrivileged) {
      const teacherMatch = doc.teacher === currentUser.name;
      const isShared = Boolean(doc.isPublic) || doc.folder === 'institucional';
      if (!teacherMatch && !isShared) return false;
    }

    // Filtro por docente seleccionado en el panel lateral de la Rectora
    if (isPrivileged && currentTeacher !== 'all') {
      if (doc.teacher !== currentTeacher) return false;
    }

    // Filtro por carpeta
    if (currentFolder === 'publico') {
      if (!doc.isPublic) return false;
    } else if (currentFolder !== 'all') {
      if (doc.folder !== currentFolder) return false;
    } else {
      if (doc.folder === 'boveda' && currentFolder === 'all') return false;
    }

    return true;
  });

  return (
    <div id="appContainer">
      <Navbar currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
      
      <div className="app-layout">
        <Sidebar 
          currentUser={currentUser} 
          currentFolder={currentFolder} 
          onFolderSelect={setCurrentFolder}
          currentTeacher={currentTeacher}
          onTeacherSelect={setCurrentTeacher}
        />
        
        <main className="main-content">
          <div className="cards-grid">
            {filteredDocs.length > 0 ? (
              filteredDocs.map(doc => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  onView={(id) => alert(`Ver documento: ${id}`)}
                  onDownload={(id) => alert(`Descargar archivo: ${id}`)}
                  canDelete={isPrivileged}
                />
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No hay documentos para este filtro.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}