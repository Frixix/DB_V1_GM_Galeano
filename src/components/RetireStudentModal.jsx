import { useState, useEffect } from 'react';
import gradesService from '../services/gradesService';
import './RetireStudentModal.css';

/**
 * FASE 5: Modal Interactivo para Inhabilitar / Marcar Retirado (Soft-Disable)
 * Regla de Oro de Auditoría:
 * - Prohibido eliminar (DELETE) de la base de datos o estado local.
 * - El estudiante permanece visible en la lista histórica.
 * - Sus notas previas se conservan intactas para auditoría.
 * - Los periodos futuros o evaluaciones no presentadas se registran con 1.0 por defecto para el consolidado anual.
 * - Su registro no altera el conteo de la fórmula de copias (N+1).
 */
export default function RetireStudentModal({
  isOpen,
  onClose,
  student,
  grade,
  onStudentRetired,
  currentUser
}) {
  const [motivoSelect, setMotivoSelect] = useState('Traslado a otra institución educativa');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [fechaRetiro, setFechaRetiro] = useState(() => new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atajo de teclado: Cerrar modal con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !student) return null;

  const currentCopiesInfo = gradesService.getPrintingCopiesSuggestion(grade);
  const nextActiveCount = Math.max(0, currentCopiesInfo.activeStudents - 1);
  const nextCopies = nextActiveCount + 1;

  const handleConfirmRetire = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalReason = motivoDetalle.trim()
      ? `${motivoSelect} — ${motivoDetalle.trim()}`
      : motivoSelect;

    try {
      setIsSubmitting(true);
      const res = gradesService.markStudentAsRetired(
        grade,
        student.id,
        { motivoRetiro: finalReason, fechaRetiro },
        currentUser
      );

      if (onStudentRetired) {
        onStudentRetired(res);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al inhabilitar al estudiante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="retire-modal-overlay" onClick={onClose}>
      <div className="retire-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera de Alerta */}
        <div className="retire-modal-header">
          <div className="retire-header-left">
            <div className="retire-icon-badge">
              <i className="ph-bold ph-shield-warning"></i>
            </div>
            <div>
              <div className="retire-tag-rule">
                <i className="ph-bold ph-lock-key"></i> REGLA DE ORO · SOFT-DISABLE
              </div>
              <h3>Inhabilitar / Marcar Retirado</h3>
              <p>Auditoría SIEE y conservación histórica de calificaciones</p>
            </div>
          </div>
          <button 
            type="button" 
            className="retire-close-btn" 
            onClick={onClose}
            title="Cerrar ventana"
          >
            ×
          </button>
        </div>

        {errorMsg && (
          <div className="retire-alert-error">
            <i className="ph-bold ph-warning-circle"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleConfirmRetire} className="retire-modal-body">
          {/* Tarjeta del Estudiante */}
          <div className="retire-student-card">
            <div className="retire-student-avatar">
              {student.name.charAt(0)}
            </div>
            <div className="retire-student-info">
              <h4>{student.name}</h4>
              <div className="retire-meta-pills">
                <span className="retire-pill-code">{student.id}</span>
                <span className="retire-pill-grade">{grade}</span>
                <span className="retire-pill-active">Actualmente Activo</span>
              </div>
              {student.acudiente && (
                <p className="retire-acudiente-text">
                  <i className="ph-bold ph-users"></i> {student.acudiente}
                </p>
              )}
            </div>
          </div>

          {/* Banner de Garantías Institucionales de Auditoría */}
          <div className="retire-rules-box">
            <div className="rule-item">
              <div className="rule-item-icon check-icon">
                <i className="ph-bold ph-prohibit"></i>
              </div>
              <div className="rule-item-text">
                <strong>Estrictamente Prohibido Eliminar (NO DELETE):</strong>
                <span>El estudiante <strong>permanece 100% visible</strong> en la lista histórica con distinción institucional de retirado.</span>
              </div>
            </div>

            <div className="rule-item">
              <div className="rule-item-icon check-icon">
                <i className="ph-bold ph-bookmarks"></i>
              </div>
              <div className="rule-item-text">
                <strong>Conservación de Notas Previas:</strong>
                <span>Todas las calificaciones de actividades y periodos cursados se guardan sin alteración para auditorías del MEN y secretaría.</span>
              </div>
            </div>

            <div className="rule-item">
              <div className="rule-item-icon check-icon">
                <i className="ph-bold ph-calculator"></i>
              </div>
              <div className="rule-item-text">
                <strong>Cómputo Anual con 1.0 por Defecto:</strong>
                <span>Los periodos futuros o evaluaciones no presentadas se registran automáticamente con <strong>1.0</strong> para el cálculo oficial del consolidado anual.</span>
              </div>
            </div>

            <div className="rule-item">
              <div className="rule-item-icon print-icon">
                <i className="ph-bold ph-printer"></i>
              </div>
              <div className="rule-item-text">
                <strong>Ajuste Inmediato de Fórmula N+1 (Fase 4):</strong>
                <span>El tiraje sugerido de copias en {grade} se recalcula de <strong>{currentCopiesInfo.suggestedCopies} a {nextCopies} ejemplares</strong> ({nextActiveCount} activos + 1 docente).</span>
              </div>
            </div>
          </div>

          {/* Formulario de Novedad Administrativa */}
          <div className="retire-form-fields">
            <div className="retire-field-group">
              <label htmlFor="retire-motivo">
                Motivo Oficial de Retiro o Traslado <span className="req-star">*</span>
              </label>
              <select
                id="retire-motivo"
                value={motivoSelect}
                onChange={(e) => setMotivoSelect(e.target.value)}
                className="retire-select"
              >
                <option value="Traslado a otra institución educativa">Traslado a otra institución educativa</option>
                <option value="Cambio de domicilio o ciudad">Cambio de domicilio o ciudad</option>
                <option value="Retiro voluntario formalizado por acudiente">Retiro voluntario formalizado por acudiente</option>
                <option value="Motivos de salud o calamidad familiar">Motivos de salud o calamidad familiar</option>
                <option value="Deserción escolar o inasistencia prolongada">Deserción escolar o inasistencia prolongada</option>
                <option value="Otro motivo institucional">Otro motivo institucional</option>
              </select>
            </div>

            <div className="retire-field-group">
              <label htmlFor="retire-fecha">
                Fecha Oficial de Retiro / Traslado <span className="req-star">*</span>
              </label>
              <input
                id="retire-fecha"
                type="date"
                required
                value={fechaRetiro}
                onChange={(e) => setFechaRetiro(e.target.value)}
                className="retire-input"
              />
            </div>

            <div className="retire-field-group col-span-2">
              <label htmlFor="retire-detalle">
                Detalle / Número de Acta o Radicado de Salida (Opcional)
              </label>
              <input
                id="retire-detalle"
                type="text"
                placeholder="Ej: Paz y salvo N° 2026-042, traslado a Colegio La Salle Bogotá"
                value={motivoDetalle}
                onChange={(e) => setMotivoDetalle(e.target.value)}
                className="retire-input"
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="retire-modal-actions">
            <button
              type="button"
              className="btn-retire-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar y Mantener Activo
            </button>
            <button
              type="submit"
              className="btn-retire-confirm"
              disabled={isSubmitting}
            >
              <i className="ph-bold ph-user-minus"></i>
              <span>{isSubmitting ? 'Inhabilitando...' : 'Confirmar Inhabilitación / Marcar Retirado'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
