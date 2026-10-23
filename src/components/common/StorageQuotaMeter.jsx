import React, { useState } from 'react';
import { formatBytes } from '../../utils/format.js';
import { INSTITUTION_CONFIG, SYSTEM_STORAGE_CAPACITY_BYTES } from '../../data/users.js';

/**
 * StorageQuotaMeter: Componente de gobernanza y medición de almacenamiento (15 GB) SaaS B2B
 * Soporta dos modos:
 * 1. floating = true (por defecto): Widget flotante fijo en la esquina inferior izquierda (bottom: 20px, left: 20px)
 * 2. floating = false: Modo embebido para paneles o sidebars
 *
 * @param {number} usedBytes - Bytes consumidos actualmente
 * @param {number} totalBytes - Cuota total contratada (por defecto 15 GB)
 * @param {boolean} floating - Si se muestra flotante en la pantalla (bottom-left)
 * @param {boolean} isDirectivo - Si es visible en modo directivo/rectoría
 */
export default function StorageQuotaMeter({
  usedBytes = 0,
  totalBytes = SYSTEM_STORAGE_CAPACITY_BYTES,
  floating = true,
  isDirectivo = true
}) {
  const [isMinimized, setIsMinimized] = useState(false);

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

  // Tarjeta de contenido
  const cardContent = (
    <div
      className="storage-quota-meter-card"
      style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        boxShadow: floating ? '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
        width: floating ? '270px' : '100%',
        boxBox: 'border-box',
        backdropFilter: 'blur(8px)',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="ph-bold ph-database" style={{ color: barColor, fontSize: '1.05rem' }}></i>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.01em' }}>
            Cuota Institucional
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '9999px',
              background: badgeBg,
              color: badgeColor,
              border: `1px solid ${badgeBorder}`,
              textTransform: 'uppercase'
            }}
          >
            {badgeText}
          </span>
          {floating && (
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              title="Minimizar medidor"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
            >
              <i className="ph-bold ph-minus" style={{ fontSize: '0.75rem' }}></i>
            </button>
          )}
        </div>
      </div>

      {/* Valores y Porcentaje */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
        <span style={{ fontWeight: 800, color: '#0f172a' }}>
          {usedFormatted} <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.78rem' }}>de {totalFormatted}</span>
        </span>
        <span style={{ fontWeight: 800, color: barColor, fontSize: '0.85rem' }}>
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
          <span style={{ fontWeight: 600, color: '#334155' }}>{INSTITUTION_CONFIG.plan}</span>
          <span style={{ fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid #a7f3d0' }}>SaaS B2B</span>
        </div>
      )}

      {/* Advertencia preventiva si aplica */}
      {alertMessage && (
        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.68rem', color: percentage >= 95 ? '#e11d48' : '#b45309', lineHeight: 1.35, fontWeight: 600 }}>
          {alertMessage}
        </p>
      )}
    </div>
  );

  if (!floating) {
    return cardContent;
  }

  // MODO FLOTANTE: Siempre activo y visible en la esquina inferior izquierda
  return (
    <div
      className="storage-quota-floating-wrapper"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 9999,
        fontFamily: 'inherit'
      }}
    >
      {isMinimized ? (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          title="Ver Cuota Institucional (15 GB)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '9999px',
            padding: '6px 14px',
            boxShadow: '0 4px 15px rgba(15, 23, 42, 0.12)',
            color: '#0f172a',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.78rem'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: barColor }}></span>
          <i className="ph-bold ph-database" style={{ color: barColor }}></i>
          <span>Cuota: {usedFormatted} / {totalFormatted}</span>
        </button>
      ) : (
        cardContent
      )}
    </div>
  );
}
