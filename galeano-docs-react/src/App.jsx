import { useState } from 'react';
import Login from './components/Login';
import Navbar from './components/Navbar';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return (
    <div id="appContainer">
      <Navbar currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
      
      <div className="app-layout">
        {/* Aquí irá el Sidebar próximamente */}
        <main className="main-content">
          <p style={{padding: '2rem'}}>Aquí irán los documentos...</p>
        </main>
      </div>
    </div>
  );
}