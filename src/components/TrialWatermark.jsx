import { useState, useRef, useEffect } from 'react';
import { SYSTEM_STORAGE_CAPACITY_BYTES } from '../data/users';

export default function TrialWatermark({ documents = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const SYSTEM_CAPACITY = SYSTEM_STORAGE_CAPACITY_BYTES; // 2 GB
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
              <i className="ph-bold ph-shield-check"></i>
              <span>Versión Institucional</span>
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
              <strong>{usedMB} MB / 2 GB ({percentUsed}%)</strong>
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
                ⚠️ Se ha alcanzado la cuota de 2 GB asignada para esta instalación institucional. Contacte a la administración del sistema.
              </span>
            ) : (
              <span>
                Esta instalación opera bajo <strong>Versión Institucional</strong> con una cuota asignada de hasta <strong>2 GB</strong> de almacenamiento en la nube.
              </span>
            )}
          </p>
        </div>
      )}

      {/* Marca de agua fija inferior derecha */}
      <div 
        className={`trial-watermark-pill ${isFull ? 'watermark-full' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Versión Institucional Activa · 2 GB Asignados (Clic para ver estado)"
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
        <span className="watermark-text">Versión Institucional</span>
      </div>
    </div>
  );
}
