export default function FilterBar({ 
  search, setSearch, 
  grade, setGrade, 
  subject, setSubject, 
  currentView, setCurrentView 
}) {
  return (
    <>
      <div className="breadcrumb-container" style={{ marginBottom: '1rem' }}>
        <div className="breadcrumb">
          <span><i className="ph ph-hard-drive"></i> Unidad_MG</span>
        </div>
        
        <div className="view-toggles">
          <button 
            className={`view-btn ${currentView === 'cards' ? 'active' : ''}`} 
            onClick={() => setCurrentView('cards')} 
            title="Vista Tarjetas"
          >
            <i className="ph-bold ph-squares-four"></i>
          </button>
          <button 
            className={`view-btn ${currentView === 'table' ? 'active' : ''}`} 
            onClick={() => setCurrentView('table')} 
            title="Vista Tabla BD"
          >
            <i className="ph-bold ph-table"></i>
          </button>
        </div>
      </div>

      <section className="filters-bar" id="generalFiltersBar">
        <div className="search-box">
          <i className="ph ph-magnifying-glass"></i>
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Buscar por título, docente, archivo..." 
          />
        </div>

        <div className="filter-group">
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">Todos los grados</option>
            <option value="Transición">Transición</option>
            <option value="Primero (1°)">Grado 1°</option>
            <option value="Segundo (2°)">Grado 2°</option>
            <option value="Tercero (3°)">Grado 3°</option>
            <option value="Cuarto (4°)">Grado 4°</option>
            <option value="Quinto (5°)">Grado 5°</option>
            <option value="General">General / Institucional</option>
          </select>
        </div>

        <div className="filter-group">
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Todas las materias</option>
            <option value="Matemáticas">Matemáticas</option>
            <option value="Lengua Castellana">Lengua Castellana</option>
            <option value="Ciencias Naturales">Ciencias Naturales</option>
            <option value="Ciencias Sociales">Ciencias Sociales</option>
            <option value="Inglés">Inglés</option>
            <option value="Educación Artística">Educación Artística</option>
            <option value="Ética y Valores">Ética y Valores</option>
            <option value="Tecnología e Informática">Tecnología e Informática</option>
            <option value="Institucional">Institucional</option>
          </select>
        </div>
      </section>
    </>
  );
}