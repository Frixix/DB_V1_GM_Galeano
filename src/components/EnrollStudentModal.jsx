import { useState, useEffect, useId } from 'react';
import gradesService from '../services/gradesService';
import { GRADES_LIST, normalizeGrade } from '../data/gradesTreeData';
import './EnrollStudentModal.css';

/**
 * FASE 5: Modal Interactivo para Inscribir Nuevos Estudiantes Extemporáneos
 * Acceso: Solo Admin, Rectora y Coordinación
 * Campos obligatorios: Nombre, Código, Grado, Acudiente, Fecha de Ingreso
 */
export default function EnrollStudentModal({
  isOpen,
  onClose,
  initialGrade = '1° Primaria',
  onStudentEnrolled,
  currentUser
}) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(() => normalizeGrade(initialGrade));
  const [nombreMadre, setNombreMadre] = useState('');
  const [telefonoMadre, setTelefonoMadre] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState(() => new Date().toISOString().split('T')[0]);
  const [tipoIngreso, setTipoIngreso] = useState('Matrícula Extemporánea');
  const [observaciones, setObservaciones] = useState('');
  const [customId, setCustomId] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setNombreMadre('');
    setTelefonoMadre('');
    setObservaciones('');
    setCustomId('');
    setErrorMsg(null);
    setTipoIngreso('Matrícula Extemporánea');
    setFechaIngreso(new Date().toISOString().split('T')[0]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Atajo de teclado: Cerrar modal con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting]);

  if (!isOpen) return null;

  // Regla para teléfono de la madre: solo números y exactamente hasta 10 dígitos
  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setTelefonoMadre(digitsOnly);
    if (errorMsg) setErrorMsg(null);
  };

  // Sugerencia de código automático basado en el grado seleccionado
  const autoSuggestedCode = () => {
    const prefix = grade ? grade.substring(0, 3).toUpperCase() : 'EST';
    const rand = Math.floor(100 + Math.random() * 900);
    return `EST-${prefix}-${rand}`;
  };

  const currentCopiesInfo = gradesService.getPrintingCopiesSuggestion(grade);
  const nextActiveCount = currentCopiesInfo.activeStudents + 1;
  const nextCopies = nextActiveCount + 1;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Por favor ingrese el nombre completo del estudiante.');
      return;
    }
    if (!nombreMadre.trim()) {
      setErrorMsg('Por favor ingrese el nombre de la madre o acudiente.');
      return;
    }

    // Regla estricta: 10 números exactamente para el teléfono de la madre
    const cleanPhone = telefonoMadre.replace(/\D/g, '');
    if (!cleanPhone) {
      setErrorMsg('Por favor ingrese el número telefónico de la madre.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setErrorMsg(`El teléfono de la madre debe contener exactamente 10 números (actualmente ingresó ${cleanPhone.length} dígitos).`);
      return;
    }

    if (!fechaIngreso) {
      setErrorMsg('Por favor seleccione la fecha de ingreso.');
      return;
    }

    try {
      setIsSubmitting(true);
      const studentId = customId.trim() || autoSuggestedCode();
      const guardianDisplay = `${nombreMadre.trim()} (Madre) - Cel: ${cleanPhone}`;

      const created = gradesService.addStudentExtemporaneo({
        grade,
        name: name.trim(),
        id: studentId,
        nombreMadre: nombreMadre.trim(),
        telefonoMadre: cleanPhone,
        telefono: cleanPhone,
        acudiente: guardianDisplay,
        fechaIngreso,
        tipoIngreso,
        observaciones: observaciones.trim()
      }, currentUser);

      if (onStudentEnrolled) {
        onStudentEnrolled(created);
      }

      resetForm();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al inscribir estudiante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateCode = () => {
    setCustomId(autoSuggestedCode());
  };

  return (
    <div className="enroll-modal-overlay" onClick={handleClose}>
      <div className="enroll-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Modal */}
        <div className="enroll-modal-header">
          <div className="enroll-header-left">
            <div className="enroll-icon-badge">
              <i className="ph-bold ph-user-plus"></i>
            </div>
            <div>
              <div className="enroll-tag-fase">
                <i className="ph-bold ph-shield-check"></i> FASE 5 · HISTÓRICO BLINDADO
              </div>
              <h3>Inscribir Estudiante Extemporáneo</h3>
              <p>Registro oficial en censo escolar institucional y sincronización curricular</p>
            </div>
          </div>
          <button 
            type="button" 
            className="enroll-close-btn" 
            onClick={handleClose} 
            title="Cerrar ventana"
          >
            ×
          </button>
        </div>

        {errorMsg && (
          <div className="enroll-alert-error">
            <i className="ph-bold ph-warning-circle"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="enroll-modal-form">
          <div className="enroll-grid-row">
            {/* Campo 1: Nombre Completo */}
            <div className="enroll-form-group col-span-2">
              <label htmlFor="enroll-name">
                Nombre Completo del Estudiante <span className="req-star">*</span>
              </label>
              <input
                id="enroll-name"
                type="text"
                required
                placeholder="Ej: Daniel Esteban Méndez Castro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="enroll-input"
              />
            </div>

            {/* Campo 2: Grado */}
            <div className="enroll-form-group">
              <label htmlFor="enroll-grade">
                Grado Académico <span className="req-star">*</span>
              </label>
              <select
                id="enroll-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="enroll-select"
              >
                {GRADES_LIST.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Campo 3: Código / Identificador */}
            <div className="enroll-form-group">
              <label htmlFor="enroll-code">
                Código Institucional <span className="req-star">*</span>
              </label>
              <div className="enroll-code-input-wrap">
                <input
                  id="enroll-code"
                  type="text"
                  placeholder="Se autogenera si se deja vacío"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value.toUpperCase())}
                  className="enroll-input enroll-code-input"
                />
                <button
                  type="button"
                  className="btn-enroll-autocode"
                  onClick={handleGenerateCode}
                  title="Generar código institucional aleatorio"
                >
                  <i className="ph-bold ph-arrows-clockwise"></i> Auto
                </button>
              </div>
            </div>

            {/* Casilla 1: Nombre de la Madre / Acudiente */}
            <div className="enroll-form-group">
              <label htmlFor="enroll-nombre-madre">
                Nombre de la Madre / Acudiente <span className="req-star">*</span>
              </label>
              <input
                id="enroll-nombre-madre"
                type="text"
                required
                placeholder="Ej: Carmen Castro López"
                value={nombreMadre}
                onChange={(e) => setNombreMadre(e.target.value)}
                className="enroll-input"
              />
            </div>

            {/* Casilla 2: Teléfono de la Madre (Regla: 10 Números) */}
            <div className="enroll-form-group">
              <div className="enroll-phone-label-bar">
                <label htmlFor="enroll-telefono-madre">
                  Teléfono de la Madre <span className="req-star">*</span>
                </label>
                <span className={`phone-digit-counter ${telefonoMadre.length === 10 ? 'counter-success' : ''}`}>
                  {telefonoMadre.length === 10 ? '✓ 10/10' : `${telefonoMadre.length}/10`}
                </span>
              </div>
              <div className="enroll-phone-input-wrap">
                <span className="phone-prefix-addon">+57</span>
                <input
                  id="enroll-telefono-madre"
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="Ej: 3128901234"
                  value={telefonoMadre}
                  onChange={handlePhoneChange}
                  className={`enroll-input enroll-phone-input ${telefonoMadre.length === 10 ? 'phone-valid' : ''}`}
                />
              </div>
              <div className="phone-rule-hint">
                {telefonoMadre.length === 10 ? (
                  <span className="hint-ok">
                    <i className="ph-bold ph-check-circle"></i> Válido: 10 dígitos numéricos
                  </span>
                ) : (
                  <span className="hint-pending">
                    <i className="ph-bold ph-info"></i> Regla: exactamente 10 números
                  </span>
                )}
              </div>
            </div>

            {/* Campo 5: Fecha de Ingreso */}
            <div className="enroll-form-group">
              <label htmlFor="enroll-fecha">
                Fecha Oficial de Ingreso <span className="req-star">*</span>
              </label>
              <input
                id="enroll-fecha"
                type="date"
                required
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="enroll-input"
              />
            </div>

            {/* Campo 6: Modalidad de Matrícula */}
            <div className="enroll-form-group">
              <label htmlFor="enroll-modalidad">Modalidad de Ingreso</label>
              <select
                id="enroll-modalidad"
                value={tipoIngreso}
                onChange={(e) => setTipoIngreso(e.target.value)}
                className="enroll-select"
              >
                <option value="Matrícula Extemporánea">Matrícula Extemporánea</option>
                <option value="Traslado de Otra Institución">Traslado de Otra Institución</option>
                <option value="Reingreso Escolar">Reingreso Escolar</option>
                <option value="Matrícula Regular Tardía">Matrícula Regular Tardía</option>
              </select>
            </div>

            {/* Campo 7: Observaciones Administrativas */}
            <div className="enroll-form-group col-span-2">
              <label htmlFor="enroll-obs">Observaciones Administrativas / Radicación SIEE</label>
              <textarea
                id="enroll-obs"
                rows={2}
                placeholder="Paz y salvo verificado, documentos de origen radicados, asignación de pupitre..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="enroll-textarea"
              />
            </div>
          </div>

          {/* Banner de Impacto N+1 (Fase 4) & Blindaje (Fase 5) */}
          <div className="enroll-impact-box">
            <div className="enroll-impact-card">
              <div className="impact-icon print-icon">
                <i className="ph-bold ph-printer"></i>
              </div>
              <div className="impact-content">
                <strong>Impacto en Impresión N+1 ({grade})</strong>
                <p>
                  El censo activo pasará de <strong>{currentCopiesInfo.activeStudents}</strong> a <strong>{nextActiveCount} alumnos</strong>. El tiraje sugerido institucional se recalculará automáticamente de <strong>{currentCopiesInfo.suggestedCopies}</strong> a <strong>{nextCopies} copias</strong>.
                </p>
              </div>
            </div>

            <div className="enroll-impact-card audit-rule-card">
              <div className="impact-icon rule-icon">
                <i className="ph-bold ph-lock-key"></i>
              </div>
              <div className="impact-content">
                <strong>Regla de Oro de Auditoría SIEE (No Eliminación)</strong>
                <p>
                  El estudiante quedará blindado en el censo institucional perpetuo. En caso de retiro futuro, se inhabilitará conservando sus notas para auditoría sin ser eliminado.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="enroll-modal-actions">
            <button
              type="button"
              className="btn-enroll-cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-enroll-submit"
              disabled={isSubmitting}
            >
              <i className="ph-bold ph-check"></i>
              <span>{isSubmitting ? 'Inscribiendo...' : 'Confirmar Matrícula Extemporánea'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
