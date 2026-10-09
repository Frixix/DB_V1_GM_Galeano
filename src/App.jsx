import { useState } from 'react';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import DocumentCard from './components/DocumentCard';
import { initialDocuments } from './data/initialDocs';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('all');
  const [currentTeacher, setCurrentTeacher] = useState('all');
  
  // Estados para búsqueda y filtros avanzados
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [currentView, setCurrentView] = useState('cards');

  const [documents, setDocuments] = useState(initialDocuments);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const isPrivileged = ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);

  // Motor de filtrado completo
  const filteredDocs = documents.filter(doc => {
    if (doc.folder === 'boveda' && !isPrivileged) return false;

    if (!isPrivileged) {
      const teacherMatch = doc.teacher === currentUser.name;
      const isShared = Boolean(doc.isPublic) || doc.folder === 'institucional';
      if (!teacherMatch && !isShared) return false;
    }

    if (isPrivileged && currentTeacher !== 'all') {
      if (doc.teacher !== currentTeacher) return false;
    }

    if (currentFolder === 'publico') {
      if (!doc.isPublic) return false;
    } else if (currentFolder !== 'all') {
      if (doc.folder !== currentFolder) return false;
    } else {
      if (doc.folder === 'boveda' && currentFolder === 'all') return false;
    }

    // Filtros por grado, materia y texto libre
    if (grade && doc.grade !== grade) return false;
    if (subject && doc.subject !== subject) return false;

    if (search) {
      const q = search.toLowerCase();
      const match = 
        (doc.title && doc.title.toLowerCase().includes(q)) ||
        (doc.teacher && doc.teacher.toLowerCase().includes(q)) ||
        (doc.subject && doc.subject.toLowerCase().includes(q)) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(q)) ||
        (doc.id && doc.id.toLowerCase().includes(q));
      if (!match) return false;
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
          <FilterBar 
            search={search} setSearch={setSearch}
            grade={grade} setGrade={setGrade}
            subject={subject} setSubject={setSubject}
            currentView={currentView} setCurrentView={setCurrentView}
          />

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
              <p style={{ color: 'var(--text-muted)' }}>No se encontraron documentos con estos filtros.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}