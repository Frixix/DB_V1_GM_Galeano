import { useState, useMemo } from 'react';
import PortalNavbar from './PortalNavbar';
import Decreto1075Sidebar from './Decreto1075Sidebar';
import DocumentCard from './DocumentCard';
import DocumentTable from './DocumentTable';
import { DECRETO_1075_PILLARS, DECRETO_AREAS_REQUIRED } from '../constants/decreto1075Categories';
import { generateRadicado, formatDateTime } from '../utils/format';
import { printCompiledExpedientePDF } from '../utils/decretoExpedienteCompiler';
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
  onUploadCompiledDocument,
  isPrivileged
}) {
  const [selectedPillar, setSelectedPillar] = useState(initialPillar || 'all');
  const [search, setSearch] = useState('');
  const [currentView, setCurrentView] = useState('cards');
  const [showLegalTip, setShowLegalTip] = useState(false);

  // Helper para vincular documentos con un pilar normativo
  const matchesPillar = (doc, pillarId) => {
    if ((doc.pillarId || doc.pillar_id || doc.pillar) && (doc.pillarId === pillarId || doc.pillar_id === pillarId || doc.pillar === pillarId)) return true;

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

  // Estado de entregas por área para pilares colaborativos
  const isCollaborativePillar = currentPillarMeta?.collaborationType === 'collaborative_all';

  const areaSubmissions = useMemo(() => {
    if (!isCollaborativePillar) return [];

    return DECRETO_AREAS_REQUIRED.map((area) => {
      // Buscar documento en este pilar cuyo título contenga el prefijo o la materia coincida
      const doc = documents.find((d) => {
        if (!matchesPillar(d, selectedPillar)) return false;
        const titleUpper = (d.title || '').toUpperCase();
        const subjectUpper = (d.subject || '').toUpperCase();
        return titleUpper.includes(area.prefix) || subjectUpper.includes(area.key) || subjectUpper.includes(area.label.toUpperCase());
      });

      return {
        ...area,
        delivered: Boolean(doc),
        deliveredDoc: doc || null
      };
    });
  }, [isCollaborativePillar, selectedPillar, documents]);

  // Manejador para Compilar Expediente Oficial en PDF (Rectoría / Admin)
  const handleCompileExpediente = async () => {
    if (!isPrivileged) {
      alert('Esta acción es reservada exclusivamente para Rectoría y Consejo Directivo.');
      return;
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateFormatted = `${yyyy}_${mm}_${dd}`;

    const cleanTitle = (currentPillarMeta.titulo || 'EXPEDIENTE')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toUpperCase();

    const fileName = `${cleanTitle}_COMPILADO_${dateFormatted}.pdf`;
    const docTitle = `${currentPillarMeta.titulo} [COMPILADO OFICIAL ${yyyy}]`;
    const radicado = generateRadicado(documents.length);

    // Documento compilado registrado en la base de datos
    const compiledDoc = {
      id: radicado,
      title: docTitle,
      folder: 'institucional',
      grade: 'General',
      subject: 'Institucional',
      teacher: currentUser?.name || 'Rectoría General',
      period: 'Anual / Permanente',
      isPublic: true,
      fileName,
      fileSize: '480 KB',
      rawBytes: 491520,
      uploadedAt: formatDateTime(),
      notes: `Expediente oficial compilado para ${currentPillarMeta.titulo} bajo el Decreto 1075 de 2015. Avalado por Rectoría.`,
      pillarId: selectedPillar,
      pillar_id: selectedPillar,
      isCompiled: true,
      compilationBadge: 'COMPILADO OFICIAL',
      tags: ['COMPILADO OFICIAL', 'DECRETO 1075']
    };

    if (onUploadCompiledDocument) {
      await onUploadCompiledDocument(compiledDoc);
    }

    // Disparar generador de PDF con vista preliminar oficial
    printCompiledExpedientePDF({
      pillarMeta: currentPillarMeta,
      submissions: areaSubmissions,
      currentUser,
      anoLectivo: String(yyyy)
    });
  };

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
          totalSystemBytes={documents.reduce((sum, doc) => sum + (doc.rawBytes || 0), 0)}
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

          {/* Consola de Supervisión & Compilación Colaborativa (Solo para Pilares Colaborativos como PEI y Currículo) */}
          {isCollaborativePillar && (
            <section style={{
              margin: '0 0 1.25rem 0',
              padding: '1.25rem 1.5rem',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ph-bold ph-columns" style={{ color: '#0f766e' }}></i>
                    Consola de Supervisión & Entregas por Área ({currentPillarMeta.titulo})
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    Monitoreo en tiempo real de capítulos radicados por el cuerpo docente. Nomenclatura obligatoria requerida.
                  </p>
                </div>

                {isPrivileged && (
                  <button
                    type="button"
                    onClick={handleCompileExpediente}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(15, 118, 110, 0.25)'
                    }}
                    title="Consolidar todos los capítulos y emitir el Expediente Maestro en PDF"
                  >
                    <i className="ph-bold ph-file-pdf"></i>
                    <span>Compilar Expediente Oficial en PDF</span>
                  </button>
                )}
              </div>

              {/* Grid de Estado por Asignatura / Capítulo */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '0.75rem'
              }}>
                {areaSubmissions.map((area) => (
                  <div
                    key={area.key}
                    style={{
                      padding: '0.75rem 0.95rem',
                      borderRadius: '8px',
                      border: `1px solid ${area.delivered ? '#a7f3d0' : '#fed7aa'}`,
                      background: area.delivered ? '#f0fdf4' : '#fffbeb',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{area.label}</strong>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: area.delivered ? '#dcfce7' : '#ffedd5',
                        color: area.delivered ? '#15803d' : '#c2410c'
                      }}>
                        {area.delivered ? '✓ Entregado' : '⏳ Pendiente'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                      Prefijo: {area.prefix}
                    </span>

                    {area.delivered ? (
                      <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {area.deliveredDoc.teacher}
                        </span>
                        {area.deliveredDoc && (
                          <button
                            type="button"
                            onClick={() => onViewDocument ? onViewDocument(area.deliveredDoc) : onDownloadDocument(area.deliveredDoc)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#0f766e',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <i className="ph-bold ph-eye"></i> Ver
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#9a3412', fontStyle: 'italic', marginTop: '4px' }}>
                        Sin radicación registrada
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

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
                    onClick={() => onOpenUploadModal(selectedPillar !== 'all' ? selectedPillar : 'pei')}
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
          onClick={() => onOpenUploadModal(selectedPillar !== 'all' ? selectedPillar : 'pei')}
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
