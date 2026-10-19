import { useState, useEffect } from 'react';
import { STUDENTS_BY_GRADE } from '../data/gradesTreeData';
import { OBSERVADOR_ROUTES, RECORD_STATUSES, COMMITTEE_MEMBERS, AVAILABLE_TEACHERS } from '../data/initialObservador';
import { getDateRules, addDays, formatDisplayDate, getDaysDifference } from '../utils/observadorDates';

export default function UploadObservadorModal({
  isOpen,
  onClose,
  currentUser,
  onRecordCreated,
  initialRoute = 'observador'
}) {
  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora'].includes(currentUser.role);

  const getValidInitialRoute = (rt) => {
    const isCommittee = ['comite_convivencia', 'comision_evaluacion', 'consejo_academico', 'reuniones_docentes'].includes(rt);
    if (!isPrivileged && isCommittee) {
      return 'observador';
    }
    return rt === 'all' ? 'observador' : rt;
  };

  const [route, setRoute] = useState(() => getValidInitialRoute(initialRoute));
  const [teacher, setTeacher] = useState(() => currentUser?.name || 'Jessica');
  const [semaforo, setSemaforo] = useState('amarillo');
  const [grade, setGrade] = useState('1° Primaria');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [sessionType, setSessionType] = useState('Ordinaria');
  const [attendees, setAttendees] = useState('');
  const [type, setType] = useState('falta_leve');
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState('1° Periodo');
  const [description, setDescription] = useState('');
  const [agreements, setAgreements] = useState('');
  const [isSpecialMeeting, setIsSpecialMeeting] = useState(false);
  
  // Reglas de fecha automatizadas según la ruta
  const dateRules = getDateRules(route, sessionType, isSpecialMeeting);
  const [followUpDate, setFollowUpDate] = useState(() => dateRules.defaultDate);

  const [status, setStatus] = useState('en_seguimiento');
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Sincronizar fechas automatizadas al cambiar la ruta o tipo de sesión
  useEffect(() => {
    const rules = getDateRules(route, sessionType, isSpecialMeeting);
    setFollowUpDate(rules.defaultDate);
  }, [route, sessionType, isSpecialMeeting]);

  // Actualizar lista de estudiantes al cambiar el grado
  const currentGradeStudents = STUDENTS_BY_GRADE[grade] || [];

  useEffect(() => {
    if (initialRoute) {
      const valid = getValidInitialRoute(initialRoute);
      setRoute(valid);
      if (COMMITTEE_MEMBERS[valid]) {
        setAttendees(COMMITTEE_MEMBERS[valid].memberNames.join(', '));
      }
    }
  }, [initialRoute, isPrivileged]);

  // Sincronizar selección de estudiante inicial cuando cambia el grado
  useEffect(() => {
    if (currentGradeStudents.length > 0) {
      setStudentId(currentGradeStudents[0].id);
      setStudentName(currentGradeStudents[0].name);
    } else {
      setStudentId('');
      setStudentName('');
    }
  }, [grade]);

  // Manejar cambio de estudiante
  const handleStudentChange = (selectedId) => {
    setStudentId(selectedId);
    const found = currentGradeStudents.find((s) => s.id === selectedId);
    if (found) {
      setStudentName(found.name);
    }
  };

  const isStudentRoute = ['observador', 'citaciones', 'piar'].includes(route);

  // Generar prefijo de radicado inteligente
  const getRadicadoPrefix = () => {
    const map = {
      observador: 'OBS',
      citaciones: 'CIT',
      piar: 'PIAR',
      comite_convivencia: 'ACT-CONV',
      comision_evaluacion: 'ACT-EVAL',
      consejo_academico: 'ACT-ACAD',
      reuniones_docentes: 'ACT-DOC'
    };
    return map[route] || 'REG';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validación estricta obligatoria: NO permitir enviar sin completar la información
    if (!teacher.trim()) {
      setErrorMessage('⚠️ Obligatorio: Seleccione el docente que presencia o reporta el hecho.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('⚠️ Obligatorio: Ingrese el título o asunto del hecho o sesión.');
      return;
    }

    if (isStudentRoute && (!studentId || !studentName)) {
      setErrorMessage('⚠️ Obligatorio: Debe seleccionar el estudiante a registrar.');
      return;
    }

    if (isStudentRoute && route === 'citaciones' && !guardianName.trim()) {
      setErrorMessage('⚠️ Obligatorio para citaciones: Indique el nombre o parentesco del acudiente convocado.');
      return;
    }

    if (!isStudentRoute && !attendees.trim()) {
      setErrorMessage('⚠️ Obligatorio para actas de comité: Ingrese los miembros o asistentes convocados.');
      return;
    }

    if (!description.trim() || description.trim().length < 15) {
      setErrorMessage('⚠️ Obligatorio: La descripción detallada de los hechos observados debe contener información clara (mínimo 15 caracteres).');
      return;
    }

    if (!agreements.trim() || agreements.trim().length < 10) {
      setErrorMessage('⚠️ Obligatorio: Debe ingresar los compromisos, acuerdos o medidas concertadas (mínimo 10 caracteres). No deje este campo vacío.');
      return;
    }

    // Validación estricta de fecha límite de seguimiento y cumplimiento
    if (!followUpDate) {
      setErrorMessage('⚠️ Obligatorio: Debe definir la fecha límite de seguimiento o verificación del caso.');
      return;
    }

    const diffDays = getDaysDifference(followUpDate);
    if (diffDays === null || isNaN(diffDays)) {
      setErrorMessage('⚠️ Fecha de seguimiento no válida. Seleccione una fecha válida en el calendario.');
      return;
    }

    if (diffDays < 0) {
      setErrorMessage('⚠️ La fecha de seguimiento no puede ser una fecha pasada para un registro que recién se radica.');
      return;
    }

    // Regla de Convivencia y Citaciones: MÁXIMO 1 SEMANA (7 DÍAS)
    if (dateRules.isConvivenciaRule && diffDays > 7) {
      setErrorMessage(`⚠️ Plazo no permitido: Por norma institucional de Básica Primaria, los casos de convivencia y citaciones tienen un plazo máximo de 1 semana (7 días). Seleccionó ${diffDays} días.`);
      return;
    }

    // Regla General: MÁXIMO 1 MES (30 DÍAS) a menos que sea reunión especial
    if (!dateRules.isConvivenciaRule && diffDays > dateRules.maxDays) {
      setErrorMessage(`⚠️ Plazo no permitido: El plazo institucional máximo es de ${dateRules.maxDays} días (1 mes). Si se trata de una reunión de cronograma especial, active la casilla de ampliación.`);
      return;
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newId = `${getRadicadoPrefix()}-2026-${randomSuffix}`;

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })}, ${now.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;

    const newRecord = {
      id: newId,
      route,
      title: title.trim(),
      date: formattedDate,
      period,
      grade: isStudentRoute ? grade : (grade === 'Transición' ? 'Institucional' : grade),
      teacher: teacher.trim(),
      studentId: isStudentRoute ? studentId : null,
      studentName: isStudentRoute ? studentName : null,
      guardianName: isStudentRoute && guardianName.trim() ? guardianName.trim() : null,
      sessionType: !isStudentRoute ? sessionType : null,
      attendees: !isStudentRoute ? (attendees.trim() || 'Cuerpo Docente y Directivo') : null,
      type,
      semaforo,
      status: semaforo === 'verde' ? 'resuelto' : (semaforo === 'rojo' ? 'en_seguimiento' : status),
      description: description.trim(),
      agreements: agreements.trim(),
      followUpDate: formatDisplayDate(followUpDate, 'short'),
      followUpDateISO: followUpDate,
      fileName: selectedFile ? selectedFile.name : null,
      notes: selectedFile ? `Archivo adjunto: ${selectedFile.name}` : '',
      resolutionNotes: semaforo === 'verde' ? agreements.trim() : '',
      resolutionImage: null,
      resolvedAt: semaforo === 'verde' ? formattedDate : null,
      resolvedBy: semaforo === 'verde' ? teacher.trim() : null
    };

    onRecordCreated(newRecord);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="obs-modal-overlay" onClick={onClose}>
      <div
        className="obs-modal-dialog obs-upload-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="obs-modal-header">
          <div className="obs-modal-brand-box">
            <div className="obs-modal-shield">
              <i className="ph-bold ph-plus" style={{ color: '#0f766e', fontSize: '1.2rem' }}></i>
            </div>
            <div>
              <h3 className="obs-modal-institution">RADICAR REGISTRO / ACTA INSTITUCIONAL</h3>
              <p className="obs-modal-subinstitution">
                Observador del Estudiante, Citación con Acudiente o Acta de Comité
              </p>
            </div>
          </div>

          <button
            type="button"
            className="obs-modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="obs-upload-form">
          {errorMessage && (
            <div className="obs-form-error" role="alert">
              <i className="ph-bold ph-warning-circle"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Fila 1: Selección de Ruta y Periodo */}
          <div className="obs-form-grid-2">
            <div className="obs-form-group">
              <label htmlFor="obsRouteSelect">
                <i className="ph-bold ph-folder-open"></i> Ubicación / Destino *
              </label>
              <select
                id="obsRouteSelect"
                className="obs-input-field"
                value={route}
                onChange={(e) => {
                  const newRoute = e.target.value;
                  setRoute(newRoute);
                  if (COMMITTEE_MEMBERS[newRoute]) {
                    setAttendees(COMMITTEE_MEMBERS[newRoute].memberNames.join(', '));
                    if (!title) {
                      setTitle(`Acta Ordinaria N° - ${COMMITTEE_MEMBERS[newRoute].name}`);
                    }
                  }
                }}
                required
              >
                <optgroup label="Seguimiento a Estudiantes (Habilitado para Docentes)">
                  <option value="observador">Observador del Estudiante</option>
                  <option value="citaciones">Citaciones & Acudientes</option>
                  <option value="piar">Seguimiento Pedagógico & PIAR</option>
                </optgroup>
                {isPrivileged ? (
                  <optgroup label="Comités Internos (Convocatoria Exclusiva Rectoría)">
                    <option value="comite_convivencia">Comité de Convivencia Escolar (Ley 1620)</option>
                    <option value="comision_evaluacion">Comisión de Evaluación y Promoción (Dec. 1290)</option>
                    <option value="consejo_academico">Consejo Académico</option>
                    <option value="reuniones_docentes">Reuniones de Docentes & Asambleas</option>
                  </optgroup>
                ) : null}
              </select>
              {!isPrivileged && (
                <span style={{ fontSize: '0.72rem', color: '#0f766e', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ph-bold ph-info"></i>
                  <span>Permiso docente activo: Anotaciones, citaciones y PIAR. (Comités convocados por Rectoría).</span>
                </span>
              )}
            </div>

            <div className="obs-form-group">
              <label htmlFor="obsPeriodSelect">
                <i className="ph-bold ph-calendar"></i> Periodo Académico
              </label>
              <select
                id="obsPeriodSelect"
                className="obs-input-field"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="1° Periodo">1° Periodo (25%)</option>
                <option value="2° Periodo">2° Periodo (25%)</option>
                <option value="3° Periodo">3° Periodo (25%)</option>
                <option value="4° Periodo">4° Periodo (25%)</option>
                <option value="Anual / Permanente">Anual / Permanente</option>
              </select>
            </div>
          </div>

          {/* Fila 2: Docente que Reporta y Semáforo de Prioridad */}
          <div className="obs-form-grid-2">
            <div className="obs-form-group">
              <label htmlFor="obsReportingTeacher">
                <i className="ph-bold ph-chalkboard-teacher"></i> Docente que reporta / Presenció el hecho *
              </label>
              <select
                id="obsReportingTeacher"
                className="obs-input-field"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                required
              >
                <option value="">-- Seleccionar Docente Responsable --</option>
                {AVAILABLE_TEACHERS.map((t) => (
                  <option key={t.key} value={t.name}>
                    {t.name} ({t.label})
                  </option>
                ))}
              </select>
            </div>

            <div className="obs-form-group">
              <label htmlFor="obsSemaforoSelect">
                <i className="ph-bold ph-traffic-signal"></i> Estado del Semáforo *
              </label>
              <select
                id="obsSemaforoSelect"
                className={`obs-input-field obs-semaforo-select ${semaforo}`}
                value={semaforo}
                onChange={(e) => setSemaforo(e.target.value)}
                required
              >
                <option value="rojo">🔴 Rojo - Alerta Crítica (Va primero en la lista)</option>
                <option value="amarillo">🟡 Amarillo - En Seguimiento / Proceso (Intermedio)</option>
                <option value="verde">🟢 Verde - Superado / Resuelto (Va al fondo / resuelto)</option>
              </select>
            </div>
          </div>

          {/* Fila Condicional para Estudiantes */}
          {isStudentRoute ? (
            <div className="obs-student-fields-box">
              <div className="obs-student-fields-header">
                <i className="ph-bold ph-student"></i>
                <span>DATOS DEL ESTUDIANTE A REGISTRAR</span>
              </div>

              <div className="obs-form-grid-3">
                <div className="obs-form-group">
                  <label htmlFor="obsGradeSelect">Grado Escolar</label>
                  <select
                    id="obsGradeSelect"
                    className="obs-input-field"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    <option value="Transición">Transición</option>
                    <option value="1° Primaria">1° Primaria</option>
                    <option value="2° Primaria">2° Primaria</option>
                    <option value="3° Primaria">3° Primaria</option>
                    <option value="4° Primaria">4° Primaria</option>
                    <option value="5° Primaria">5° Primaria</option>
                  </select>
                </div>

                <div className="obs-form-group" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="obsStudentSelect">Estudiante Matriculado *</label>
                  <select
                    id="obsStudentSelect"
                    className="obs-input-field"
                    value={studentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    required
                  >
                    {currentGradeStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="obs-form-grid-2" style={{ marginTop: '0.65rem' }}>
                <div className="obs-form-group">
                  <label htmlFor="obsTypeSelect">Tipo de Notificación</label>
                  <select
                    id="obsTypeSelect"
                    className="obs-input-field"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="falta_leve">Falta Leve (Tipo I - Llamado Pedagógico)</option>
                    <option value="falta_grave">Falta Grave (Tipo II - Debido Proceso)</option>
                    <option value="felicitacion">Mérito & Felicitación Institucional</option>
                    <option value="piar_ajuste">Ajuste Metodológico PIAR</option>
                  </select>
                </div>

                {route === 'citaciones' && (
                  <div className="obs-form-group">
                    <label htmlFor="obsGuardianInput">Nombre del Acudiente / Teléfono</label>
                    <input
                      type="text"
                      id="obsGuardianInput"
                      className="obs-input-field"
                      placeholder="Ej: Carolina Álvarez (Madre - 3105551234)"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Fila Condicional para Comités */
            <div className="obs-committee-fields-box">
              <div className="obs-committee-fields-header">
                <i className="ph-bold ph-scales"></i>
                <span>DATOS DE LA SESIÓN DEL COMITÉ</span>
              </div>

              <div className="obs-form-grid-2">
                <div className="obs-form-group">
                  <label htmlFor="obsSessionType">Tipo de Sesión</label>
                  <select
                    id="obsSessionType"
                    className="obs-input-field"
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                  >
                    <option value="Ordinaria">Sesión Ordinaria de Cronograma</option>
                    <option value="Extraordinaria">Sesión Extraordinaria de Urgencia</option>
                    <option value="Seguimiento">Mesa de Seguimiento</option>
                  </select>
                </div>

                <div className="obs-form-group">
                  <label htmlFor="obsCommitteeAttendees">Miembros Convocados / Asistentes</label>
                  <input
                    type="text"
                    id="obsCommitteeAttendees"
                    className="obs-input-field"
                    placeholder="Ej: Claudia (Rectora), Jessica, Yuri, Elcy, Padres"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Título Principal */}
          <div className="obs-form-group">
            <label htmlFor="obsTitleInput">Título del Hecho o Asunto del Acta *</label>
            <input
              type="text"
              id="obsTitleInput"
              className="obs-input-field"
              placeholder={
                isStudentRoute
                  ? 'Ej: Compromiso por llamado de atención o reconocimiento de liderazgo...'
                  : 'Ej: Acta Ordinaria N° 02 - Balance bimestral y acuerdos de convivencia...'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Descripción de Hechos o Deliberación */}
          <div className="obs-form-group">
            <label htmlFor="obsDescInput">
              {isStudentRoute
                ? 'Descripción de la Situación o Hechos Observados *'
                : 'Puntos Tratados & Deliberación del Comité *'}
            </label>
            <textarea
              id="obsDescInput"
              className="obs-textarea-field"
              rows={4}
              placeholder={
                isStudentRoute
                  ? 'Detalla con claridad qué ocurrió en el aula o descanso, contexto y versión del estudiante...'
                  : 'Registra los temas discutidos, quórum, exposiciones y puntos de vista...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Acuerdos y Compromisos */}
          <div className="obs-form-group">
            <label htmlFor="obsAgreementsInput">
              <i className="ph-bold ph-handshake"></i> Compromisos, Acuerdos o Decisiones Concertadas
            </label>
            <textarea
              id="obsAgreementsInput"
              className="obs-textarea-field"
              rows={3}
              placeholder="1. Compromiso concreto del alumno o acudiente...&#10;2. Acompañamiento docente pactado..."
              value={agreements}
              onChange={(e) => setAgreements(e.target.value)}
            />
          </div>

          {/* Fila: Estado y Soporte Adjunto */}
          <div className="obs-form-grid-2">
            <div className="obs-form-group">
              <label htmlFor="obsStatusSelect">
                <i className="ph-bold ph-hourglass-high"></i> Estado Inicial del Registro
              </label>
              <select
                id="obsStatusSelect"
                className="obs-input-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="en_seguimiento">En Seguimiento (Caso Activo)</option>
                <option value="compromiso_firmado">Compromiso Firmado</option>
                <option value="resuelto">Superado / Resuelto (🟢 Verde)</option>
                <option value="acta_aprobada">Acta Aprobada & Firmada</option>
              </select>
            </div>

            <div className="obs-form-group">
              <label htmlFor="obsFileInput">
                <i className="ph-bold ph-paperclip"></i> Adjuntar Evidencia o Acta Escaneada (Opcional)
              </label>
              <input
                type="file"
                id="obsFileInput"
                className="obs-file-input"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
            </div>
          </div>

          {/* Bloque Destacado de Fecha Límite de Seguimiento y Alertas */}
          <div className="obs-date-card-panel">
            <div className="obs-date-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ph-bold ph-calendar-check" style={{ color: '#0f766e', fontSize: '1.2rem' }}></i>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>
                    FECHA LÍMITE DE SEGUIMIENTO / CUMPLIMIENTO *
                  </strong>
                  <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                    Se configurarán alertas automáticas de vencimiento y escalamiento a 🔴 Alerta Crítica si no se resuelve en esta fecha.
                  </span>
                </div>
              </div>

              <span className={`obs-date-badge-pill ${dateRules.isConvivenciaRule ? 'urgent' : 'standard'}`}>
                {dateRules.isConvivenciaRule ? '⚖️ Máx. 1 semana (7 días)' : (isSpecialMeeting ? '📋 Máx. 60 días' : '📆 Máx. 1 mes (30 días)')}
              </span>
            </div>

            <div className="obs-date-controls-grid">
              <div className="obs-form-group" style={{ minWidth: '220px' }}>
                <input
                  type="date"
                  id="obsFollowUpInput"
                  className="obs-input-field obs-date-highlighted-input"
                  min={dateRules.minDate}
                  max={dateRules.maxDate}
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  required
                />
              </div>

              {/* Botones de Autollenado Rápido para Agilizar el Trabajo Docente */}
              <div className="obs-quick-dates-row">
                <span className="obs-quick-label">⚡ Llenado rápido:</span>
                <button
                  type="button"
                  className="obs-btn-quick-tag"
                  onClick={() => setFollowUpDate(addDays(3))}
                  title="Fijar plazo urgente en 3 días"
                >
                  3 Días
                </button>
                <button
                  type="button"
                  className="obs-btn-quick-tag highlight"
                  onClick={() => setFollowUpDate(addDays(7))}
                  title="Fijar plazo en 1 semana (máximo para convivencia)"
                >
                  1 Semana (7d)
                </button>
                {!dateRules.isConvivenciaRule && (
                  <>
                    <button
                      type="button"
                      className="obs-btn-quick-tag"
                      onClick={() => setFollowUpDate(addDays(15))}
                      title="Fijar plazo quincenal en 15 días"
                    >
                      15 Días
                    </button>
                    <button
                      type="button"
                      className="obs-btn-quick-tag"
                      onClick={() => setFollowUpDate(addDays(30))}
                      title="Fijar plazo mensual en 30 días"
                    >
                      1 Mes (30d)
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="obs-date-rule-footer">
              <span className="obs-rule-hint-text">
                <i className="ph-bold ph-shield-check"></i> {dateRules.ruleNotice}
              </span>

              {/* Casilla de Excepción para Comités o Reuniones Especiales */}
              {!dateRules.isConvivenciaRule && (
                <label className="obs-special-meeting-check">
                  <input
                    type="checkbox"
                    checked={isSpecialMeeting}
                    onChange={(e) => setIsSpecialMeeting(e.target.checked)}
                  />
                  <span>Asamblea especial o cronograma extendido (permite hasta 60 días)</span>
                </label>
              )}
            </div>
          </div>

          {/* Botones de Envío */}
          <div className="obs-upload-footer">
            <button type="button" className="obs-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="obs-btn-primary obs-btn-submit">
              <i className="ph-bold ph-check"></i>
              <span>Radicar Registro / Acta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
