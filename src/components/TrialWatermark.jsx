import { useState, useRef, useEffect } from 'react';

export default function TrialWatermark({ documents = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const SYSTEM_CAPACITY = 3 * 1024 * 1024 * 1024; // 3 GB (Fase de Prueba)
  const totalUsedBytes = documents.reduce((sum, doc) => sum + (doc.rawBytes || 0), 0);
  const usedMB = (totalUsedBytes / (1024 * 1024)).toFixed(1);
  const percentUsed = Math.min(100, Math.max(1, ((totalUsedBytes / SYSTEM_CAPACITY) * 100))).toFixed(1);
  const isFull = totalUsedBytes >= SYSTEM_CAPACITY;

  // Cerrar al hacer clic por fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="trial-watermark-wrapper" ref={popoverRef}>
      {/* Popover flotante informativo al hacer clic */}
      {isOpen && (
        <div className="trial-watermark-popover">
          <div className="popover-header">
            <div className="popover-title">
              <i className="ph-bold ph-flask"></i>
              <span>Fase de Prueba</span>
            </div>
            <button 
              type="button" 
              className="popover-close-btn" 
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar detalles"
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>

          <p className="popover-sub">
            Gimnasio Martin Galeano · Básica Primaria
          </p>

          <div className="popover-storage-box">
            <div className="popover-storage-labels">
              <span>Almacenamiento Usado:</span>
              <strong>{usedMB} MB / 3 GB ({percentUsed}%)</strong>
            </div>
            <div className="popover-bar-track">
              <div 
                className={`popover-bar-fill ${isFull ? 'full' : ''}`}
                style={{ width: `${percentUsed}%` }}
              ></div>
            </div>
          </div>

          <p className="popover-desc">
            {isFull ? (
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                ⚠️ Se ha alcanzado el límite de 3 GB asignado para la fase de prueba. Contacte al administrador del sistema.
              </span>
            ) : (
              <span>
                Esta instalación opera actualmente en <strong>fase de prueba</strong> con una cuota asignada de hasta <strong>3 GB</strong> de almacenamiento institucional.
              </span>
            )}
          </p>
        </div>
      )}

      {/* Marca de agua fija inferior derecha */}
      <div 
        className={`trial-watermark-pill ${isFull ? 'watermark-full' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Fase de Prueba Activa · Límite de 3 GB (Clic para ver estado)"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={`watermark-dot ${isFull ? 'dot-full' : ''}`}></span>
        <span className="watermark-text">Fase de prueba</span>
      </div>
    </div>
  );
}
