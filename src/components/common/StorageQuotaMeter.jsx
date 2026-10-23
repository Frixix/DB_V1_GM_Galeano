import React from 'react';
import { formatBytes } from '../../utils/format.js';
import { INSTITUTION_CONFIG, SYSTEM_STORAGE_CAPACITY_BYTES } from '../../data/users.js';

/**
 * StorageQuotaMeter: Componente de gobernanza y medición de almacenamiento (15 GB) SaaS B2B
 * @param {number} usedBytes - Bytes consumidos actualmente
 * @param {number} totalBytes - Cuota total contratada (por defecto 15 GB)
 * @param {boolean} compact - Modo visual compacto o detallado
 * @param {boolean} isDirectivo - Si es visible en modo directivo/rectoría
 */
export default function StorageQuotaMeter({
  usedBytes = 0,
  totalBytes = SYSTEM_STORAGE_CAPACITY_BYTES,
  compact = false,
  isDirectivo = true
}) {
  const percentage = Math.min(100, Math.round(((usedBytes || 0) / (totalBytes || 1)) * 100));
  const usedFormatted = formatBytes(usedBytes || 0);
  const totalFormatted = formatBytes(totalBytes);

  // Rangos de Gobernanza de Almacenamiento:
  // < 80%: Verde esmeralda institucional
  // 80% - 94%: Ámbar preventivo
  // >= 95%: Rojo suave crítico / contacto comercial
  let barColor = '#059669'; // bg-emerald-600
  let badgeText = 'Óptimo';
  let badgeBg = '#ecfdf5';
  let badgeColor = '#065f46';
  let badgeBorder = '#a7f3d0';
  let alertMessage = null;

  if (percentage >= 95) {
    barColor = '#e11d48'; // bg-rose-600
    badgeText = 'Crítico (≥95%)';
    badgeBg = '#fff1f2';
    badgeColor = '#be123c';
    badgeBorder = '#fecdd3';
    alertMessage = 'Capacidad crítica alcanzada. Contacte a soporte comercial para ampliar su cuota SaaS.';
  } else if (percentage >= 80) {
    barColor = '#f59e0b'; // bg-amber-500
    badgeText = 'Capacidad al 80%';
    badgeBg = '#fffbeb';
    badgeColor = '#b45309';
    badgeBorder = '#fde68a';
    alertMessage = 'Acercándose al límite de almacenamiento institucional (80%).';
  }

  if (compact) {
    return (
      <div className="storage-quota-meter-compact" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', marginBottom: '0.25rem' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Almacenamiento</span>
          <span style={{ fontWeight: 700, color: percentage >= 95 ? '#e11d48' : '#334155' }}>
            {usedFormatted} / {totalFormatted} • {percentage}%
          </span>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.max(percentage, 2)}%`,
              height: '100%',
              backgroundColor: barColor,
              borderRadius: '999px',
              transition: 'width 0.4s ease, background-color 0.3s ease'
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="storage-quota-meter-card"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '0.85rem 0.95rem',
        marginTop: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="ph-bold ph-database" style={{ color: barColor, fontSize: '1rem' }}></i>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
            Cuota Institucional
          </span>
        </div>
        <span 
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '0.15rem 0.45rem',
            borderRadius: '999px',
            background: badgeBg,
            color: badgeColor,
            border: `1px solid ${badgeBorder}`
          }}
        >
          {badgeText}
        </span>
      </div>

      {/* Valores y Porcentaje */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>
          {usedFormatted} <span style={{ color: '#64748b', fontWeight: 500 }}>de {totalFormatted}</span>
        </span>
        <span style={{ fontWeight: 800, color: barColor, fontSize: '0.82rem' }}>
          {percentage}%
        </span>
      </div>

      {/* Barra de Progreso */}
      <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.45rem' }}>
        <div
          style={{
            width: `${Math.max(percentage, 2)}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: '999px',
            transition: 'width 0.4s ease, background-color 0.3s ease'
          }}
        />
      </div>

      {/* Plan institucional en modo directivo */}
      {isDirectivo && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', borderTop: '1px dashed #e2e8f0', paddingTop: '0.4rem', marginTop: '0.35rem' }}>
          <span>{INSTITUTION_CONFIG.plan}</span>
          <span style={{ fontWeight: 600, color: '#334155' }}>SaaS B2B</span>
        </div>
      )}

      {/* Advertencia preventiva si aplica */}
      {alertMessage && (
        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.68rem', color: percentage >= 95 ? '#e11d48' : '#b45309', lineHeight: 1.35, fontWeight: 500 }}>
          {alertMessage}
        </p>
      )}
    </div>
  );
}
