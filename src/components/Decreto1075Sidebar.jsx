import React from 'react';
import { SidebarBackBtn } from './common/TeacherAccordion.jsx';
import { DECRETO_1075_PILLARS } from '../constants/decreto1075Categories.js';
import StorageQuotaMeter from './common/StorageQuotaMeter.jsx';
import './Decreto1075Sidebar.css';

/**
 * Decreto1075Sidebar: Barra lateral izquierda con los 9 Pilares Fundamentales del Decreto 1075 de 2015
 */
export default function Decreto1075Sidebar({
  selectedPillar = 'all',
  onSelectPillar,
  onBackToModules,
  totalDocs = 0,
  pillarCounts = {},
  totalSystemBytes = 0
}) {
  return (
    <aside className="sidebar decreto-sidebar" id="decreto1075Sidebar">
      {/* 1. Botón Superior de Navegación: Volver a Módulos */}
      <SidebarBackBtn onBackToModules={onBackToModules} />

      {/* 2. Encabezado del Módulo Normativo */}
      <div className="sidebar-section decreto-header-card">
        <div className="decreto-header-icon">
          <i className="ph-bold ph-scales"></i>
        </div>
        <div className="decreto-header-text">
          <span className="decreto-header-tag">MARCO LEGAL MEN</span>
          <strong className="decreto-header-title">Decreto 1075 de 2015</strong>
          <span className="decreto-header-subtitle">Sector Educación</span>
        </div>
      </div>

      {/* 3. Navegación de los 9 Pilares */}
      <div className="sidebar-section decreto-pillars-section">
        <div className="sidebar-header decreto-section-header">
          <i className="ph-bold ph-folders"></i>
          <span>9 PILARES NORMATIVOS</span>
        </div>

        <nav className="folder-list decreto-nav-list">
          {/* Opción General: Todos los Pilares */}
          <button
            type="button"
            className={`folder-btn decreto-nav-btn ${selectedPillar === 'all' ? 'active' : ''}`}
            onClick={() => onSelectPillar && onSelectPillar('all')}
            title="Ver todos los expedientes del Decreto 1075"
          >
            <div className="decreto-nav-inner">
              <i className="ph-bold ph-squares-four decreto-nav-icon"></i>
              <span className="decreto-nav-text">Todos los Pilares</span>
            </div>
            {totalDocs > 0 && (
              <span className="decreto-nav-badge">{totalDocs}</span>
            )}
          </button>

          {/* Listado de los 9 Pilares */}
          {DECRETO_1075_PILLARS.map((p) => {
            const isActive = selectedPillar === p.id;
            const count = pillarCounts[p.id] || 0;
            return (
              <button
                key={p.id}
                type="button"
                className={`folder-btn decreto-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectPillar && onSelectPillar(p.id)}
                title={`Pilar ${p.numero}: ${p.tituloCompleto || p.titulo} • ${p.articulos}`}
              >
                <div className="decreto-nav-inner">
                  <span className={`decreto-pillar-badge ${isActive ? 'active' : ''}`}>
                    {p.numero}
                  </span>
                  <div className="decreto-pillar-info">
                    <span className="decreto-pillar-name">{p.titulo}</span>
                  </div>
                </div>
                {count > 0 ? (
                  <span className="decreto-nav-badge">{count}</span>
                ) : isActive ? (
                  <i className="ph-bold ph-check decreto-nav-check"></i>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Resumen Normativo y Barra de Completitud de Blindaje */}
      {(() => {
        const coveredCount = DECRETO_1075_PILLARS.filter(p => (pillarCounts[p.id] || 0) > 0).length;
        const totalPillars = DECRETO_1075_PILLARS.length;
        const completionPercentage = Math.round((coveredCount / totalPillars) * 100);

        return (
          <div className="db-summary-card decreto-summary-card">
            <div className="summary-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="ph-bold ph-shield-check" style={{ color: '#1e3a8a' }}></i>
                <span style={{ color: '#1e3a8a', fontWeight: 700 }}>Blindaje SED</span>
              </div>
              <span className="storage-plan-pill" style={{ background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe', fontWeight: 700 }}>
                {coveredCount}/{totalPillars} Pilares
              </span>
            </div>

            {/* Barra de progreso de completitud */}
            <div style={{ margin: '0.65rem 0 0.4rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                <span>Completitud Institucional</span>
                <span style={{ color: '#1e40af', fontWeight: 800 }}>{completionPercentage}%</span>
              </div>
              <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${completionPercentage}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)', 
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
            </div>

            <p className="summary-reminder" style={{ marginTop: '0.45rem', fontSize: '0.72rem', color: '#475569' }}>
              {coveredCount === totalPillars 
                ? '¡Blindaje al 100%! Todos los pilares cuentan con expedientes radicados ante el MEN.' 
                : `${coveredCount} de 9 pilares cuentan con expedientes radicados para inspección y vigilancia.`}
            </p>
          </div>
        );
      })()}

      {/* 5. Medidor y Gobernanza de Cuota SaaS (15 GB) */}
      <StorageQuotaMeter 
        usedBytes={totalSystemBytes} 
        floating={false}
        isDirectivo={true}
      />
    </aside>
  );
}
