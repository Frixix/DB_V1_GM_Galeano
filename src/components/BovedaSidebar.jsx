import React from 'react';
import { SidebarBackBtn } from './common/TeacherAccordion.jsx';
import { getUserAvatar } from '../services/avatarService.js';
import StorageQuotaMeter from './common/StorageQuotaMeter.jsx';
import './BovedaSidebar.css';

/**
 * BovedaSidebar: Barra lateral izquierda de la Bóveda Confidencial
 * Exclusiva para la Rectora y Administrador: subcarpetas privadas de despacho,
 * balances contables, contratos y nómina.
 */
export default function BovedaSidebar({
  currentUser,
  selectedSubfolder = 'all',
  onSelectSubfolder,
  onBackToModules,
  onOpenProfile,
  bovedaDocsCount = 0,
  totalBovedaBytes = 0,
  totalSystemBytes = 0,
  onOpenChangeBovedaModal,
  onLockBoveda
}) {
  const userName = currentUser?.name || 'Despacho Directivo';
  const userRole = currentUser?.label || currentUser?.role || 'Rectoría';
  const currentUserKey = currentUser?.key || currentUser?.role || (userName ? userName.toLowerCase().replace(/\s+/g, '') : 'rectora');
  const userAvatar = getUserAvatar(currentUserKey) || currentUser?.avatar || null;

  const usedMB = (totalBovedaBytes / (1024 * 1024)).toFixed(1);

  const subfolders = [
    { id: 'all', label: 'Todo el Archivo Confidencial', icon: 'ph-bold ph-vault' },
    { id: 'financiero', label: 'Financiero & Balances', icon: 'ph-bold ph-currency-dollar' },
    { id: 'contratos', label: 'Contratos & Nómina Docente', icon: 'ph-bold ph-file-text' },
    { id: 'legal', label: 'Resoluciones & Legalidad', icon: 'ph-bold ph-gavel' },
    { id: 'consejo', label: 'Actas de Consejo Directivo', icon: 'ph-bold ph-buildings' },
    { id: 'pei_soporte', label: 'Soportes de Licencia & Despacho', icon: 'ph-bold ph-certificate' }
  ];

  return (
    <aside className="sidebar boveda-sidebar" id="bovedaSidebar">
      {/* 1. Botón Superior de Navegación: "Volver a Módulos" */}
      <SidebarBackBtn onBackToModules={onBackToModules} />

      {/* 2. Tarjeta Confidencial de Despacho Directivo */}
      <div className="sidebar-section boveda-directivo-card">
        <div className="boveda-directivo-header">
          <div className="boveda-directivo-avatar">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="boveda-avatar-img" />
            ) : (
              <div className="boveda-avatar-fallback">
                <i className="ph-bold ph-shield-check"></i>
              </div>
            )}
          </div>
          <div className="boveda-directivo-info">
            <span className="boveda-directivo-tag">DESPACHO DIRECTIVO</span>
            <strong className="boveda-directivo-name">{userName}</strong>
            <span className="boveda-directivo-role">{userRole}</span>
          </div>
        </div>

        <div className="boveda-directivo-actions">
          {onOpenChangeBovedaModal && (
            <button
              type="button"
              className="boveda-btn-sidebar-key"
              onClick={onOpenChangeBovedaModal}
              title="Cambiar o verificar clave de seguridad de la Bóveda"
            >
              <i className="ph-bold ph-key"></i>
              <span>Clave</span>
            </button>
          )}
          {onLockBoveda && (
            <button
              type="button"
              className="boveda-btn-sidebar-lock"
              onClick={onLockBoveda}
              title="Bloquear la Bóveda"
            >
              <i className="ph-bold ph-lock-key"></i>
              <span>Bloquear</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Navegación por Subcarpetas Confidenciales */}
      <div className="sidebar-section boveda-pillars-nav-section" id="sidebarBovedaFoldersSection">
        <div className="sidebar-header boveda-sidebar-header">
          <i className="ph-bold ph-folder-lock"></i>
          <span>SECCIONES CONFIDENCIALES</span>
        </div>

        <nav className="folder-list boveda-pillars-nav-list">
          {subfolders.map((item) => {
            const isActive = selectedSubfolder === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`folder-btn boveda-nav-pillar-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectSubfolder && onSelectSubfolder(item.id)}
                title={item.label}
              >
                <div className="boveda-nav-item-inner">
                  <i className={`${item.icon} boveda-nav-item-icon`}></i>
                  <span className="boveda-nav-item-text">{item.label}</span>
                </div>
                {isActive && (
                  <i className="ph-bold ph-check boveda-nav-check"></i>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Panel Inferior: Resumen de Custodia & Almacenamiento Confidencial */}
      <div className="db-summary-card boveda-summary-card" id="bovedaSummaryCard">
        <div className="summary-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ph-bold ph-shield-check" style={{ color: '#0f172a' }}></i>
            <span style={{ color: '#0f172a', fontWeight: 700 }}>Ultra Confidencial</span>
          </div>
          <span className="storage-plan-pill" style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}>
            Rectora & Admin
          </span>
        </div>

        <div className="storage-labels" style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: '#64748b' }}>
          <span>{bovedaDocsCount} {bovedaDocsCount === 1 ? 'archivo custodiado' : 'archivos custodiados'}</span>
          <span>{usedMB} MB</span>
        </div>

        <p className="summary-reminder" style={{ marginTop: '0.45rem', fontSize: '0.72rem', color: '#475569' }}>
          Archivos de despacho no visibles para docentes ni personal institucional.
        </p>
      </div>

      {/* 5. Medidor y Gobernanza de Cuota SaaS (15 GB) */}
      <StorageQuotaMeter 
        usedBytes={totalSystemBytes || totalBovedaBytes} 
        floating={false}
        isDirectivo={true}
      />
    </aside>
  );
}
