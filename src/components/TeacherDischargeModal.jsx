import { useState } from 'react';
import './TeacherDischargeModal.css';

export default function TeacherDischargeModal({
  isOpen,
  onClose,
  teacher,
  activeTeachers = [],
  onSubmit,
  isInduccion = false
}) {
  const [reason, setReason] = useState('');
  const [dischargeDate, setDischargeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [replacementMode, setReplacementMode] = useState('new'); // 'new' | 'existing'
  const [existingKey, setExistingKey] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherLabel, setNewTeacherLabel] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !teacher) return null;

  // Filtrar docentes activos que no sean el docente saliente
  const eligibleExisting = activeTeachers.filter(t => t.key !== teacher.key && t.status !== 'retirada');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reason.trim()) {
      setErrorMsg('Debe ingresar el motivo formal por el cual se retira el docente.');
      return;
    }

    if (replacementMode === 'new') {
      if (!newTeacherName.trim()) {
        setErrorMsg('Debe ingresar el nombre y apellidos del nuevo docente que asume el cargo.');
        return;
      }
    } else {
      if (!existingKey) {
        setErrorMsg('Debe seleccionar el docente de la planta que asumirá las responsabilidades.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        retiredKey: teacher.key,
        reason: reason.trim(),
        dischargeDate,
        replacementMode,
        existingReplacementKey: existingKey,
        newTeacherData: {
          name: newTeacherName.trim(),
          label: newTeacherLabel.trim() || `Docente Reemplazo de ${teacher.name}`,
          pass: newTeacherPass.trim() || undefined
        }
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la baja del docente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="td-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="td-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="td-modal-header">
          <div className="td-modal-title-wrap">
            <div className="td-modal-icon-badge">
              <i className="ph-bold ph-user-minus"></i>
            </div>
            <div>
              <h3 className="td-modal-title">Baja y Reemplazo de Docente</h3>
              <p className="td-modal-subtitle">
                Procedimiento formal de desvinculación con traspaso obligatorio de responsabilidades
              </p>
            </div>
          </div>
          <button type="button" className="td-modal-close-btn" onClick={onClose} title="Cerrar">
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Contenido / Formulario */}
        <form onSubmit={handleSubmit} className="td-modal-body">
          {errorMsg && (
            <div className="td-alert-error">
              <i className="ph-bold ph-warning-circle"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tarjeta del Docente Saliente */}
          <div className="td-retiring-box">
            <div className="td-retiring-avatar">
              {teacher.avatar ? (
                <img src={teacher.avatar} alt={teacher.name} />
              ) : (
                teacher.initial || 'D'
              )}
            </div>
            <div className="td-retiring-info">
              <span className="td-retiring-label">Docente que se retira:</span>
              <h4 className="td-retiring-name">{teacher.name}</h4>
              <div className="td-retiring-meta">
                <span><i className="ph-bold ph-identification-card"></i> {teacher.label || 'Docente Titular'}</span>
                {teacher.directedGrade && (
                  <span className="td-badge-director">
                    <i className="ph-bold ph-chalkboard"></i> Directora de {teacher.directedGrade}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Motivo y Fecha */}
          <div className="td-form-row">
            <div className="td-form-group" style={{ flex: 1 }}>
              <label htmlFor="td-discharge-date">Fecha de Retiro / Novedad:</label>
              <input
                id="td-discharge-date"
                type="date"
                className="td-input-styled"
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="td-form-group">
            <label htmlFor="td-reason">
              Motivo Formal del Retiro <span className="td-required">*</span>:
            </label>
            <textarea
              id="td-reason"
              className="td-textarea-styled"
              placeholder="Ej: Renuncia voluntaria por cambio de domicilio, terminación de contrato, traslado institucional..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Sección de Reemplazo Obligatorio */}
          <div className="td-replacement-section">
            <div className="td-replacement-header">
              <i className="ph-bold ph-arrow-fat-line-right"></i>
              <div>
                <strong>Reemplazo Obligatorio de Cargos y Responsabilidades</strong>
                <p>
                  Todo lo que tenía asignado {teacher.name} (dirección de curso, materias curriculares, evaluaciones SIEE y comités) se transferirá automáticamente a:
                </p>
              </div>
            </div>

            <div className="td-mode-selector">
              <label className={`td-mode-card ${replacementMode === 'new' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="replacementMode"
                  value="new"
                  checked={replacementMode === 'new'}
                  onChange={() => setReplacementMode('new')}
                />
                <div className="td-mode-content">
                  <i className="ph-bold ph-user-plus"></i>
                  <div>
                    <strong>Nuevo(a) Docente Contratado(a)</strong>
                    <span>Ingresa un nuevo profesional a la planta de profesores</span>
                  </div>
                </div>
              </label>

              <label className={`td-mode-card ${replacementMode === 'existing' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="replacementMode"
                  value="existing"
                  checked={replacementMode === 'existing'}
                  onChange={() => setReplacementMode('existing')}
                />
                <div className="td-mode-content">
                  <i className="ph-bold ph-users"></i>
                  <div>
                    <strong>Docente Existente de la Planta</strong>
                    <span>Reasignar responsabilidades a un colega ya activo</span>
                  </div>
                </div>
              </label>
            </div>

            {/* Campos condicionales */}
            {replacementMode === 'new' ? (
              <div className="td-new-teacher-fields">
                <div className="td-form-group">
                  <label htmlFor="td-new-name">
                    Nombre Completo del Nuevo Docente <span className="td-required">*</span>:
                  </label>
                  <input
                    id="td-new-name"
                    type="text"
                    className="td-input-styled"
                    placeholder="Ej: Profe Marcela Sánchez"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    required
                  />
                </div>

                <div className="td-form-row">
                  <div className="td-form-group" style={{ flex: 1 }}>
                    <label htmlFor="td-new-label">Especialidad / Cargo Visible:</label>
                    <input
                      id="td-new-label"
                      type="text"
                      className="td-input-styled"
                      placeholder={`Ej: Docente Reemplazo • ${teacher.label || 'Básica Primaria'}`}
                      value={newTeacherLabel}
                      onChange={(e) => setNewTeacherLabel(e.target.value)}
                    />
                  </div>
                  <div className="td-form-group" style={{ flex: 1 }}>
                    <label htmlFor="td-new-pass">Contraseña Inicial de Acceso:</label>
                    <input
                      id="td-new-pass"
                      type="text"
                      className="td-input-styled"
                      placeholder="Opcional (por defecto: nombre2026)"
                      value={newTeacherPass}
                      onChange={(e) => setNewTeacherPass(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="td-form-group">
                <label htmlFor="td-existing-select">
                  Seleccionar Docente que Asumirá las Responsabilidades <span className="td-required">*</span>:
                </label>
                <select
                  id="td-existing-select"
                  className="td-select-styled"
                  value={existingKey}
                  onChange={(e) => setExistingKey(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Docente Activo --</option>
                  {eligibleExisting.map(t => (
                    <option key={t.key} value={t.key}>
                      {t.name} ({t.label || t.key})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="td-modal-footer">
            <button type="button" className="td-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="td-btn-confirm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <i className="ph-bold ph-spinner ph-spin"></i>
                  <span>Procesando Baja y Traspaso...</span>
                </>
              ) : (
                <>
                  <i className="ph-bold ph-check-circle"></i>
                  <span>Confirmar Baja y Transferir Cargos</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
