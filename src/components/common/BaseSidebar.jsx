import React from 'react';
import { SYSTEM_STORAGE_CAPACITY_BYTES } from '../../data/users.js';
import TeacherAccordion, { SidebarBackBtn } from './TeacherAccordion.jsx';

/**
 * BaseSidebar: Componente transversal reutilizable para Sidebars institucionales
 * Unifica el encabezado (retorno a módulos), acordeón de docentes/perfil,
 * lista configurable de navegación/rutas, ranura para contenido hijo y
 * widgets informativos adaptables (almacenamiento, SIEE, control de copias, marco legal).
 */
export default function BaseSidebar({
  currentModule = 'recursos',
  currentUser = null,
  isPrivileged = null,
  selectedTeacher = 'all',
  activeTeacherId = null,
  currentTeacher = null,
  onSelectTeacher = null,
  onTeacherSelect = null,
  onResetTeacher = null,
  selectedGrade = null,
  onBackToModules = null,
  onlineMap = {},
  onlineCount = 0,
  onOpenConnectionsModal = null,
  onOpenProfile = null,
  defaultExpanded = null,
  accentColor = null,
  sectionId = null,
  ownCardTitle = null,

  // Rutas y Categorías (Config-driven)
  navigationItems = null,
  activeItemId = null,
  onNavigateItem = null,
  navigationTitle = 'Ubicación / Rutas',
  navigationIcon = 'ph-bold ph-folder',
  navigationSectionId = null,

  // Ranura para contenido hijo
  children = null,

  // Panel Inferior / Widgets informativos
  footer = null,
  storageData = null,
  documents = null,
  stats = null,
  counts = null,

  // Atributos HTML
  className = '',
  id = null,
}) {
  // Normalización del rol privilegiado
  const computedIsPrivileged = isPrivileged !== null
    ? isPrivileged
    : (currentUser && ['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(currentUser.role));

  // Normalización de selección de docente
  const effectiveTeacher = activeTeacherId || (currentTeacher !== null && currentTeacher !== undefined ? currentTeacher : selectedTeacher);
  const handleTeacherChange = (teacherName, teacherObj) => {
    if (onSelectTeacher) onSelectTeacher(teacherName, teacherObj);
    else if (onTeacherSelect) onTeacherSelect(teacherName, teacherObj);
  };

  // Clase CSS e ID según módulo
  const getSidebarClassName = () => {
    const base = 'sidebar';
    let moduleClass = '';
    if (currentModule === 'calificaciones' || currentModule === 'grades') moduleClass = 'grades-sidebar';
    else if (currentModule === 'evaluaciones' || currentModule === 'final_exams') moduleClass = 'final-exams-sidebar';
    else if (currentModule === 'observador') moduleClass = 'obs-sidebar';
    return `${base} ${moduleClass} ${className}`.trim();
  };

  const getSidebarId = () => {
    if (id) return id;
    if (currentModule === 'calificaciones' || currentModule === 'grades') return 'gradesSidebar';
    if (currentModule === 'evaluaciones' || currentModule === 'final_exams') return 'finalExamsSidebar';
    if (currentModule === 'observador') return 'observadorSidebar';
    return 'mainSidebar';
  };

  // Color de acento según módulo
  const getAccentColor = () => {
    if (accentColor) return accentColor;
    if (currentModule === 'evaluaciones' || currentModule === 'final_exams') return '#6366f1';
    if (currentModule === 'observador') return '#0f766e';
    return '#059669';
  };

  // Renderizador del Panel Inferior Adaptable (Footer)
  const renderDefaultFooter = () => {
    // Caso 1: Recursos Pedagógicos / Gestión Documental (Widget de Almacenamiento 2 GB)
    if (currentModule === 'recursos' || currentModule === 'docs') {
      const docsList = documents || storageData?.documents || [];
      const totalUsedBytes = storageData?.totalUsedBytes !== undefined
        ? storageData.totalUsedBytes
        : docsList.reduce((sum, doc) => sum + (doc.rawBytes || 0), 0);
      const SYSTEM_CAPACITY = storageData?.capacityBytes || SYSTEM_STORAGE_CAPACITY_BYTES; // 2 GB
      const usedMB = (totalUsedBytes / (1024 * 1024)).toFixed(1);
      const percentUsed = Math.min(100, Math.max(1, ((totalUsedBytes / SYSTEM_CAPACITY) * 100))).toFixed(1);
      const isStorageFull = totalUsedBytes >= SYSTEM_CAPACITY;
      const isStorageNearFull = !isStorageFull && (totalUsedBytes / SYSTEM_CAPACITY) >= 0.85;

      return (
        <div 
          className={`db-summary-card ${isStorageFull ? 'storage-card-full' : (isStorageNearFull ? 'storage-card-warning' : '')}`} 
          id="sidebarStorageCard"
        >
          <div className="summary-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph-bold ph-hard-drive"></i>
              <span>Almacenamiento</span>
            </div>
            <span className={`storage-plan-pill ${isStorageFull ? 'full' : (isStorageNearFull ? 'warning' : '')}`}>
              {isStorageFull ? '2 GB Lleno' : 'Versión Institucional'}
            </span>
          </div>

          <div className="storage-bar-wrapper">
            <div 
              className={`storage-bar-progress ${isStorageFull ? 'progress-full' : (isStorageNearFull ? 'progress-warning' : '')}`} 
              style={{ width: `${percentUsed}%` }}
            ></div>
          </div>

          <div className="storage-labels">
            <span>{usedMB} MB usados ({percentUsed}%)</span>
            <span>2 GB disponibles</span>
          </div>

          {isStorageFull ? (
            <div className="summary-alert-full">
              <div className="summary-alert-header">
                <i className="ph-bold ph-warning-octagon"></i>
                <strong>Capacidad Agotada (2 GB)</strong>
              </div>
              <p>
                Has alcanzado el límite de 2 GB de la <strong>cuota institucional</strong>. Para continuar almacenando documentos, contacte al administrador.
              </p>
            </div>
          ) : (
            <p className="summary-reminder">
              {isStorageNearFull ? (
                <>⚠️ <strong>Cerca del límite:</strong> 85%+ de capacidad utilizada de los 2 GB institucionales.</>
              ) : (
                <>Plan Institucional: <strong>2 GB asignados</strong> para gestión académica.</>
              )}
            </p>
          )}
        </div>
      );
    }

    // Caso 2: Calificaciones (Resumen Normativo de Ponderación SIEE)
    if (currentModule === 'calificaciones' || currentModule === 'grades') {
      return (
        <div className="db-summary-card" id="gradesSieeSummary" style={{ marginTop: 'auto' }}>
          <div className="summary-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph-bold ph-scales"></i>
              <span>Ponderación SIEE</span>
            </div>
            <span className="storage-plan-pill" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
              100%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.73rem', color: '#475569', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Cognitivo:</span> <strong>40%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Procedimental:</span> <strong>40%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Actitudinal:</span> <strong>20%</strong>
            </div>
          </div>
        </div>
      );
    }

    // Caso 3: Evaluaciones / Exámenes Finales (Control de Impresión & Copias)
    if (currentModule === 'evaluaciones' || currentModule === 'final_exams') {
      const progressPercent = stats?.progressPercent || 0;
      const deadlineInfo = stats?.deadlineInfo || {};

      return (
        <div className="db-summary-card" id="finalPrintSummaryCard" style={{ marginTop: 'auto' }}>
          <div className="summary-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph-bold ph-printer" style={{ color: '#6d28d9' }}></i>
              <span>Control de Impresión</span>
            </div>
            <span className="storage-plan-pill" style={{ background: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe' }}>
              {progressPercent}% Listo
            </span>
          </div>

          <div className="storage-bar-wrapper" style={{ marginTop: '0.65rem' }}>
            <div 
              className="storage-bar-progress" 
              style={{ 
                width: `${progressPercent}%`,
                background: progressPercent === 100 ? '#059669' : 'linear-gradient(90deg, #6366f1, #7c3aed)'
              }}
            ></div>
          </div>

          <div className="storage-labels" style={{ marginTop: '0.35rem' }}>
            <span>{stats?.uploadedCount || 0} de {stats?.totalSubjects || 0} materias</span>
            <span title="Total de copias calculadas con la fórmula institucional N+1">{stats?.totalCopiesNeeded || 0} copias (N+1)</span>
          </div>

          <div style={{ marginTop: '0.65rem', padding: '0.55rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6d28d9', fontWeight: 700, marginBottom: '2px' }}>
              <i className="ph-bold ph-calendar-check"></i>
              <span>Fecha Límite:</span>
            </div>
            <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>
              {deadlineInfo.deadlineDate || '27 de Marzo 2026'} ({deadlineInfo.deliveryTime || '17:00'})
            </p>
          </div>
        </div>
      );
    }

    // Caso 4: Observador del Estudiante y Convivencia
    if (currentModule === 'observador') {
      const c = counts || {};
      return (
        <div className="obs-summary-card" id="obsSummaryCard">
          <div className="obs-summary-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph-bold ph-seal-check" style={{ color: '#0f766e', fontSize: '1.1rem' }}></i>
              <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a' }}>
                Marco Convivencial & SIEE
              </span>
            </div>
            <span className="obs-norm-pill">Ley 1620 / Dec. 1290</span>
          </div>

          <div className="obs-stat-grid">
            <div className="obs-stat-item">
              <span className="obs-stat-number">{c.en_seguimiento || 0}</span>
              <span className="obs-stat-label">En Seguimiento</span>
            </div>
            <div className="obs-stat-item">
              <span className="obs-stat-number">{c.actas_firmadas || 0}</span>
              <span className="obs-stat-label">Actas Firmadas</span>
            </div>
            <div className="obs-stat-item">
              <span className="obs-stat-number">{c.all || 0}</span>
              <span className="obs-stat-label">Total Radicados</span>
            </div>
          </div>

          <p className="obs-summary-note">
            Trazabilidad legal de observadores, citaciones de acudientes y actas institucionales.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <aside className={getSidebarClassName()} id={getSidebarId()}>
      {/* 1. Botón Superior de Navegación: "Volver a Módulos" */}
      <SidebarBackBtn onBackToModules={onBackToModules} />

      {/* 2. Acordeón / Lista de Docentes Oficial */}
      <TeacherAccordion
        currentUser={currentUser}
        isPrivileged={computedIsPrivileged}
        selectedTeacher={effectiveTeacher}
        onSelectTeacher={handleTeacherChange}
        onReset={onResetTeacher}
        selectedGrade={selectedGrade}
        onlineMap={onlineMap}
        onlineCount={onlineCount}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onOpenProfile={onOpenProfile}
        defaultExpanded={defaultExpanded ?? (currentModule !== 'recursos' && currentModule !== 'observador')}
        accentColor={getAccentColor()}
        sectionId={sectionId || `${currentModule}TeacherSection`}
        ownCardTitle={ownCardTitle || (currentModule === 'calificaciones' ? 'Mi Grado & Rol' : 'Mi Rol & Dirección de Aula')}
      />

      {/* 3. Rutas y Categorías Config-driven (si se suministra navigationItems) */}
      {Array.isArray(navigationItems) && navigationItems.length > 0 && (
        <div className="sidebar-section" id={navigationSectionId || (currentModule === 'recursos' || currentModule === 'docs' ? 'sidebarFoldersSection' : 'sidebarNavigationSection')}>
          <div className="sidebar-header">
            {typeof navigationIcon === 'string' ? <i className={navigationIcon}></i> : navigationIcon}
            <span>{navigationTitle}</span>
          </div>
          <nav className="folder-list">
            {navigationItems.map((item) => {
              const isActive = activeItemId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`folder-btn folder-${item.id} ${isActive ? 'active' : ''} ${item.className || ''}`}
                  onClick={() => onNavigateItem && onNavigateItem(item.id)}
                  title={item.title || item.label}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                    {typeof item.icon === 'string' ? <i className={item.icon}></i> : item.icon}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  </div>
                  {item.badge !== undefined && item.badge !== null && item.badge !== 0 && (
                    <span className={item.badgeClassName || 'whatsapp-badge'}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && item.showCheck && (
                    <i className="ph-bold ph-check" style={{ marginLeft: 'auto', color: getAccentColor(), fontSize: '0.85rem' }}></i>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* 4. Ranura / Children para componentes o secciones específicas */}
      {children}

      {/* 5. Panel inferior de Información / Almacenamiento */}
      {footer !== false && (footer !== null && footer !== undefined ? footer : renderDefaultFooter())}
    </aside>
  );
}
