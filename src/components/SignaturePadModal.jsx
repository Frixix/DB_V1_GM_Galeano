import { useRef, useState, useEffect } from 'react';

/**
 * Modal Canvas para Trazar Firma Digital Manuscrita (Mouse o Touch con el dedo)
 * Incluye soporte táctil fluido, borrado, y guardado en imagen PNG transparente.
 */
export default function SignaturePadModal({
  isOpen,
  onClose,
  signerRoleName = 'Firmante',
  onSaveSignature
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasStroke(false);
      setIsDrawing(false);
      // Limpiar y preparar canvas con fondo transparente
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0f172a'; // Tinta oscura formal
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasStroke(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e?.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  };

  const handleSave = () => {
    if (!hasStroke) {
      alert('Por favor realiza el trazo de tu firma con el mouse o con el dedo antes de confirmar.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #cbd5e1',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Cabecera */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ph-bold ph-signature" style={{ color: '#0f766e' }}></i>
              Recuadro de Firma Manuscrita Digital
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Firma para: <strong>{signerRoleName}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
          >
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Cuerpo con Lienzo Canvas */}
        <div style={{ padding: '1.25rem', textAlign: 'center' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#475569' }}>
            Dibuja tu firma en el recuadro usando el <strong>mouse</strong> o directamente con el <strong>dedo</strong> si estás en pantalla táctil:
          </p>

          <div style={{
            position: 'relative',
            background: '#ffffff',
            border: '2px dashed #0f766e',
            borderRadius: '12px',
            touchAction: 'none',
            display: 'inline-block',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)'
          }}>
            <canvas
              ref={canvasRef}
              width={480}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{
                display: 'block',
                cursor: 'crosshair',
                maxWidth: '100%',
                borderRadius: '10px'
              }}
            />

            {/* Línea guía para firmar */}
            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '10%',
              right: '10%',
              borderTop: '1px solid #cbd5e1',
              pointerEvents: 'none'
            }}>
              <span style={{
                position: 'absolute',
                top: '4px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.68rem',
                color: '#94a3b8',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                Línea de firma manuscrita
              </span>
            </div>
          </div>
        </div>

        {/* Pie y Controles */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <button
            type="button"
            onClick={handleClear}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <i className="ph-bold ph-eraser"></i> Borrar y Repetir
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.78rem',
                color: '#64748b',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                background: '#0f766e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(15, 118, 110, 0.25)'
              }}
            >
              <i className="ph-bold ph-check"></i> Aceptar y Guardar Firma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
