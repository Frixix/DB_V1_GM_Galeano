import { useState, useMemo } from 'react';
import PortalNavbar from './PortalNavbar';
import Decreto1075Sidebar from './Decreto1075Sidebar';
import DocumentCard from './DocumentCard';
import DocumentTable from './DocumentTable';
import { DECRETO_1075_PILLARS } from '../constants/decreto1075Categories';
import './Decreto1075Module.css';

/**
 * MÓDULO INSTITUCIONAL: DECRETO 1075 DE 2015
 * Ecosistema de Archivo Normativo y Custodia de los 9 Pilares de Inspección & Vigilancia
 */
export default function Decreto1075Module({
  currentUser,
  documents = [],
  initialPillar = 'all',
  onBackToModules,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineCount,
  circularesCount = 0,
  onOpenCirculares,
  isNotificationsOpen = false,
  onOpenTour,
  onLogout,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onOpenUploadModal,
  isPrivileged
}) {
  const [selectedPillar, setSelectedPillar] = useState(initialPillar || 'all');
  const [search, setSearch] = useState('');
  const [currentView, setCurrentView] = useState('cards');
  const [showLegalTip, setShowLegalTip] = useState(false);

  // Helper para vincular documentos con un pilar normativo
  const matchesPillar = (doc, pillarId) => {
    if (doc.pillarId && doc.pillarId === pillarId) return true;
    if (doc.pillar && doc.pillar === pillarId) return true;

    const titleLower = (doc.title || '').toLowerCase();
    const folderLower = (doc.folder || '').toLowerCase();
    const subfolderLower = (doc.bovedaSubfolder || '').toLowerCase();

    if (pillarId === 'pei') {
      return titleLower.includes('pei') || subfolderLower === 'pei_soporte' || titleLower.includes('horizonte');
    }
    if (pillarId === 'siee') {
      return titleLower.includes('siee') || titleLower.includes('evaluacion') || titleLower.includes('promocion') || folderLower === 'calificaciones';
    }
    if (pillarId === 'manual_convivencia') {
      return titleLower.includes('manual') || titleLower.includes('convivencia') || titleLower.includes('1620') || folderLower === 'observador';
    }
    if (pillarId === 'gobierno_escolar') {
      return titleLower.includes('consejo') || subfolderLower === 'consejo' || titleLower.includes('gobierno') || titleLower.includes('acta');
    }
    if (pillarId === 'curriculo_plan_estudios') {
      return titleLower.includes('malla') || titleLower.includes('curriculo') || titleLower.includes('plan de estudios') || folderLower === 'planeaciones';
    }
    if (pillarId === 'organizacion_servicio') {
      return titleLower.includes('costo') || titleLower.includes('calendario') || titleLower.includes('matricula') || subfolderLower === 'financiero' || subfolderLower === 'legal';
    }
    if (pillarId === 'evaluacion_docente') {
      return titleLower.includes('desempeño') || titleLower.includes('docente') || subfolderLower === 'contratos' || titleLower.includes('asignacion');
    }
    if (pillarId === 'inclusion_piar') {
      return titleLower.includes('piar') || titleLower.includes('inclusion') || titleLower.includes('dua') || titleLower.includes('ajustes razonables');
    }
    if (pillarId === 'proyectos_transversales') {
      return titleLower.includes('prae') || titleLower.includes('pescc') || titleLower.includes('transversal') || titleLower.includes('tiempo libre');
    }
    return false;
  };

  // Filtrar documentos que aplican para el Decreto 1075 (o todos los institucionales / normativos)
  const normativosDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Si se seleccionó un pilar específico, verificar coincidencia
      if (selectedPillar !== 'all') {
        if (!matchesPillar(doc, selectedPillar)) return false;
      }

      // Filtro de búsqueda
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = doc.title?.toLowerCase().includes(q);
        const matchesTeacher = doc.teacher?.toLowerCase().includes(q);
        const matchesSubject = doc.subject?.toLowerCase().includes(q);
        const matchesId = doc.id?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTeacher && !matchesSubject && !matchesId) return false;
      }

      return true;
    });
  }, [documents, selectedPillar, search]);

  // Conteo de documentos por pilar
  const pillarCounts = useMemo(() => {
    const counts = {};
    DECRETO_1075_PILLARS.forEach((p) => {
      counts[p.id] = documents.filter((d) => matchesPillar(d, p.id)).length;
    });
    return counts;
  }, [documents]);

  // Metadatos del pilar seleccionado
  const currentPillarMeta = useMemo(() => {
    if (selectedPillar === 'all') {
      return {
        numero: null,
        titulo: 'Todos los Pilares Normativos',
        articulos: 'Decreto 1075 de 2015 • Decreto Único Reglamentario del Sector Educación',
        descripcion: 'Archivo centralizado y estandarizado para inspección, vigilancia y auditoría oficial de colegios privados.',
        badgeColor: 'border-blue-200 bg-blue-50 text-blue-900',
        icon: 'ph-scales'
      };
    }
    return DECRETO_1075_PILLARS.find((p) => p.id === selectedPillar) || {
      numero: null,
      titulo: 'Pilar Normativo',
      articulos: 'Decreto 1075 de 2015',
      descripcion: 'Archivo oficial e institucional.',
      badgeColor: 'border-slate-200 bg-slate-50 text-slate-800',
      icon: 'ph-folders'
    };
  }, [selectedPillar]);

  return (
    <div className="decreto-module-container" id="view-decreto1075-module">
      {/* Navbar Superior Unificado */}
      <PortalNavbar
        currentUser={currentUser}
        moduleTitle="Decreto 1075 de 2015"
        moduleSubtitle="Sistema de Archivo Normativo • 9 Pilares de Inspección & Vigilancia"
        onBackToModules={onBackToModules}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onlineCount={onlineCount}
        circularesCount={circularesCount}
        isNotificationsOpen={isNotificationsOpen}
        onOpenCirculares={onOpenCirculares}
        onOpenTour={onOpenTour}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      <div className="decreto-layout">
        {/* Barra Lateral Izquierda: 9 Pilares */}
        <Decreto1075Sidebar
          selectedPillar={selectedPillar}
          onSelectPillar={(pillarId) => setSelectedPillar(pillarId)}
          onBackToModules={onBackToModules}
          totalDocs={documents.length}
          pillarCounts={pillarCounts}
        />

        {/* Panel Central Principal */}
        <main className="decreto-main-content">
          {/* Banner de Cabecera del Pilar */}
          <section className="decreto-banner-card">
            <div className="decreto-banner-left">
              <div className="decreto-banner-icon-box">
                <i className={`ph-bold ${currentPillarMeta.icon}`}></i>
              </div>
              <div className="decreto-banner-info-wrap">
                <div className="decreto-banner-title-row">
                  {currentPillarMeta.numero && (
                    <span className="decreto-banner-num-badge">
                      Pilar {currentPillarMeta.numero}
                    </span>
                  )}
                  <h2 className="decreto-banner-title">{currentPillarMeta.titulo}</h2>
                  
                  {/* Bombillo normativo interactivo */}
                  <div className="decreto-bulb-wrapper">
                    <button
                      type="button"
                      className={`decreto-bulb-btn ${showLegalTip ? 'active' : ''}`}
                      onClick={() => setShowLegalTip(!showLegalTip)}
                      title={showLegalTip ? "Ocultar artículos normativos" : "Ver fundamento normativo y artículos"}
                      aria-label="Ver fundamento legal y artículos"
                    >
                      <i className={`ph-fill ph-lightbulb ${showLegalTip ? 'text-amber-500' : ''}`}></i>
                      <span className="decreto-bulb-badge-text">Artículos</span>
                    </button>

                    {showLegalTip && (
                      <div className="decreto-legal-popover">
                        <div className="decreto-legal-popover-header">
                          <i className="ph-bold ph-scales"></i>
                          <span>Fundamento Normativo Oficial</span>
                          <button 
                            type="button" 
                            className="decreto-legal-popover-close"
                            onClick={() => setShowLegalTip(false)}
                          >
                            <i className="ph-bold ph-x"></i>
                          </button>
                        </div>
                        <div className="decreto-legal-popover-body">
                          <span className="decreto-legal-articles-tag">
                            <i className="ph-bold ph-bookmark-simple"></i> {currentPillarMeta.articulos}
                          </span>
                          <p className="decreto-legal-desc">{currentPillarMeta.descripcion}</p>
                          {currentPillarMeta.tiposSugeridos && (
                            <div className="decreto-legal-suggestions">
                              <strong>Expedientes requeridos:</strong>
                              <ul>
                                {currentPillarMeta.tiposSugeridos.map((tipo, idx) => (
                                  <li key={idx}><i className="ph-bold ph-check"></i> {tipo}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className="decreto-banner-sub">
                  {currentPillarMeta.descripcion}
                </p>
              </div>
            </div>
          </section>

          {/* Barra de Filtros y Búsqueda */}
          <section className="decreto-controls-bar">
            <div className="decreto-search-box">
              <i className="ph-bold ph-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Buscar por nombre de documento, radicado o palabra clave..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="decreto-view-selector">
              <button
                type="button"
                className={`decreto-view-btn ${currentView === 'cards' ? 'active' : ''}`}
                onClick={() => setCurrentView('cards')}
                title="Vista en Tarjetas"
              >
                <i className="ph-bold ph-squares-four"></i>
              </button>
              <button
                type="button"
                className={`decreto-view-btn ${currentView === 'table' ? 'active' : ''}`}
                onClick={() => setCurrentView('table')}
                title="Vista en Tabla"
              >
                <i className="ph-bold ph-list-dashes"></i>
              </button>
            </div>
          </section>

          {/* Listado de Documentos del Pilar */}
          <section>
            {normativosDocs.length > 0 ? (
              currentView === 'cards' ? (
                <div className="cards-grid">
                  {normativosDocs.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onView={onViewDocument}
                      onDownload={onDownloadDocument}
                      onDelete={onDeleteDocument}
                      canDelete={isPrivileged}
                      isUnread={false}
                    />
                  ))}
                </div>
              ) : (
                <DocumentTable
                  documents={normativosDocs}
                  onView={onViewDocument}
                  onDownload={onDownloadDocument}
                  onDelete={onDeleteDocument}
                  canDelete={isPrivileged}
                  readCircularIds={[]}
                  currentUserName={currentUser.name}
                />
              )
            ) : (
              <div className="decreto-empty-state">
                <div className="decreto-empty-icon">
                  <i className="ph-bold ph-folders"></i>
                </div>
                <h3>No hay documentos radicados en este pilar normativo</h3>
                <p>
                  Puedes radicar expedientes oficiales para {currentPillarMeta.titulo} o ajustar la búsqueda.
                </p>
                {onOpenUploadModal && (
                  <button
                    type="button"
                    className="decreto-btn-primary"
                    onClick={onOpenUploadModal}
                  >
                    <i className="ph-bold ph-upload-simple"></i>
                    <span>Radicar primer expediente</span>
                  </button>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Botón Flotante para Radicar Expediente (Unificado) */}
      {onOpenUploadModal && (
        <button
          type="button"
          className="btn-floating-upload"
          onClick={onOpenUploadModal}
          title="Radicar nuevo expediente normativo en el Decreto 1075"
          aria-label="Radicar Expediente"
        >
          <i className="ph-bold ph-upload-simple"></i>
          <span>Radicar Expediente</span>
        </button>
      )}
    </div>
  );
}
