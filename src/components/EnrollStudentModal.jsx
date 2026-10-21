import { useState, useId } from 'react';
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
  const [acudiente, setAcudiente] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState(() => new Date().toISOString().split('T')[0]);
  const [tipoIngreso, setTipoIngreso] = useState('Matrícula Extemporánea');
  const [observaciones, setObservaciones] = useState('');
  const [customId, setCustomId] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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
    if (!acudiente.trim()) {
      setErrorMsg('Por favor ingrese el nombre del acudiente y su teléfono de contacto.');
      return;
    }
    if (!fechaIngreso) {
      setErrorMsg('Por favor seleccione la fecha de ingreso.');
      return;
    }

    try {
      setIsSubmitting(true);
      const studentId = customId.trim() || autoSuggestedCode();

      const created = gradesService.addStudentExtemporaneo({
        grade,
        name: name.trim(),
        id: studentId,
        acudiente: acudiente.trim(),
        fechaIngreso,
        tipoIngreso,
        observaciones: observaciones.trim()
      }, currentUser);

      if (onStudentEnrolled) {
        onStudentEnrolled(created);
      }

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
    <div className="enroll-modal-overlay" onClick={onClose}>
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
            onClick={onClose} 
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

            {/* Campo 4: Acudiente y Contacto */}
            <div className="enroll-form-group col-span-2">
              <label htmlFor="enroll-acudiente">
                Nombre del Acudiente & Teléfono de Contacto <span className="req-star">*</span>
              </label>
              <input
                id="enroll-acudiente"
                type="text"
                required
                placeholder="Ej: Carmen Castro (Madre) - Cel: 312 890 1234"
                value={acudiente}
                onChange={(e) => setAcudiente(e.target.value)}
                className="enroll-input"
              />
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
              onClick={onClose}
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
