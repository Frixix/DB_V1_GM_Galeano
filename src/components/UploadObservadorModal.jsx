import { useState, useEffect, useRef } from 'react';
import { STUDENTS_BY_GRADE } from '../data/gradesTreeData';
import { OBSERVADOR_ROUTES, RECORD_STATUSES, COMMITTEE_MEMBERS, AVAILABLE_TEACHERS } from '../data/initialObservador';
import { getDateRules, addDays, toISODate, formatDisplayDate, getDaysDifference } from '../utils/observadorDates';
import { committeeService } from '../services/committeeService.js';
import { uploadDocumentFile } from '../services/storageService.js';

export default function UploadObservadorModal({
  isOpen,
  onClose,
  currentUser,
  onRecordCreated,
  initialRoute = 'observador'
}) {
  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora'].includes(currentUser.role);
  const formRef = useRef(null);

  const getValidInitialRoute = (rt) => {
    if (!rt || rt === 'all') return 'observador';
    const isCommittee = ['comite_convivencia', 'comision_evaluacion', 'consejo_academico', 'reuniones_docentes'].includes(rt);
    if (isCommittee && !committeeService.canUserCreateInRoute(rt, currentUser)) {
      return 'observador';
    }
    return rt;
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
  
  // Reglas de fecha automatizadas según la ruta y la falta
  const dateRules = getDateRules(route, sessionType, isSpecialMeeting, type);
  const [followUpDate, setFollowUpDate] = useState(() => dateRules.defaultDate);

  const [status, setStatus] = useState('en_seguimiento');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para la pantalla de confirmación y finalización exitosa
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [createdRecordInfo, setCreatedRecordInfo] = useState(null);

  // Sincronizar fechas automatizadas al cambiar la ruta, tipo de sesión o falta
  useEffect(() => {
    const rules = getDateRules(route, sessionType, isSpecialMeeting, type);
    setFollowUpDate(rules.defaultDate);
  }, [route, sessionType, isSpecialMeeting, type]);

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

  // Diferencia de días en tiempo real
  const diffDays = getDaysDifference(followUpDate);

  // Resetear formulario para radicar otro registro
  const handleResetForm = () => {
    setIsSubmittedSuccess(false);
    setCreatedRecordInfo(null);
    setTitle('');
    setDescription('');
    setAgreements('');
    setSelectedFile(null);
    setErrorMessage('');
    const rules = getDateRules(route, sessionType, isSpecialMeeting, type);
    setFollowUpDate(rules.defaultDate);
  };

  // Cerrar y limpiar
  const handleModalClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!teacher.trim()) {
      setErrorMessage('⚠️ Obligatorio: Seleccione el docente que presencia o reporta el hecho.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!title.trim()) {
      setErrorMessage('⚠️ Obligatorio: Ingrese el título o asunto del hecho o sesión.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (isStudentRoute && (!studentId || !studentName)) {
      setErrorMessage('⚠️ Obligatorio: Debe seleccionar el estudiante a registrar.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (isStudentRoute && route === 'citaciones' && !guardianName.trim()) {
      setErrorMessage('⚠️ Obligatorio para citaciones: Indique el nombre o parentesco del acudiente convocado.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isStudentRoute && !attendees.trim()) {
      setErrorMessage('⚠️ Obligatorio para actas de comité: Ingrese los miembros o asistentes convocados.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setErrorMessage('⚠️ Obligatorio: La descripción de los hechos debe contener información clara.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validación de fecha límite de seguimiento y cumplimiento
    if (!followUpDate) {
      setErrorMessage('⚠️ Obligatorio: Debe definir la fecha de seguimiento o verificación del caso.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const currentDiffDays = getDaysDifference(followUpDate);
    if (currentDiffDays === null || isNaN(currentDiffDays)) {
      setErrorMessage('⚠️ Fecha de seguimiento no válida. Seleccione una fecha válida en el calendario.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Regla de plazo máximo institucional según la falta
    if (currentDiffDays > dateRules.maxDays) {
      setErrorMessage(`⚠️ Plazo no permitido: Para esta falta/acta el plazo normativo máximo es de ${dateRules.maxDays} días. Ha seleccionado un plazo de ${currentDiffDays} días.`);
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Compromisos con fallback pedagógico automático para evitar bloqueos
    const resolvedAgreements = agreements.trim() || 'Compromiso formativo de diálogo reflexivo y acompañamiento en aula.';

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

    let uploadedStorageKey = null;
    if (selectedFile) {
      try {
        setIsUploading(true);
        const uploadRes = await uploadDocumentFile(selectedFile, 'observador', newId);
        uploadedStorageKey = uploadRes.storageKey;
      } catch (err) {
        console.warn('[UploadObservadorModal] Error al subir archivo adjunto a R2/Storage:', err);
      } finally {
        setIsUploading(false);
      }
    }

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
      agreements: resolvedAgreements,
      followUpDate: formatDisplayDate(followUpDate, 'short'),
      followUpDateISO: followUpDate,
      fileName: selectedFile ? selectedFile.name : null,
      storageKey: uploadedStorageKey,
      notes: selectedFile ? `Archivo adjunto: ${selectedFile.name}` : '',
      resolutionNotes: semaforo === 'verde' ? resolvedAgreements : '',
      resolutionImage: null,
      resolvedAt: semaforo === 'verde' ? formattedDate : null,
      resolvedBy: semaforo === 'verde' ? teacher.trim() : null
    };

    // Guardar registro en Supabase y estado general (sin forzar apertura de visor inmediatamente)
    onRecordCreated(newRecord, false);

    // Activar pantalla de confirmación exitosa dentro del modal
    setCreatedRecordInfo(newRecord);
    setIsSubmittedSuccess(true);
  };

  if (!isOpen) return null;

  return (
    <div className="obs-modal-overlay" onClick={handleModalClose}>
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
              <h3 className="obs-modal-institution">
                {isSubmittedSuccess ? 'REGISTRO RADICADO EXITOSAMENTE' : 'RADICAR REGISTRO / ACTA INSTITUCIONAL'}
              </h3>
              <p className="obs-modal-subinstitution">
                {isSubmittedSuccess
                  ? 'Custodia digital y trazabilidad institucional completada'
                  : 'Observador del Estudiante, Citación con Acudiente o Acta de Comité'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="obs-modal-close-btn"
            onClick={handleModalClose}
            aria-label="Cerrar modal"
          >
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* PANTALLA DE CONFIRMACIÓN DE RADICACIÓN EXITOSA */}
        {isSubmittedSuccess && createdRecordInfo ? (
          <div className="obs-success-confirmation-view">
            <div className="obs-success-icon-wrap">
              <i className="ph-bold ph-check"></i>
            </div>
            <h3 className="obs-success-title">¡Registro Radicado con Éxito!</h3>
            <p className="obs-success-desc">
              El caso ha sido procesado formalmente en el sistema, custodiado en la nube y asignado con su código de radicado oficial.
            </p>

            <div className="obs-success-summary-card">
              <div className="obs-success-radicado-pill">
                <i className="ph-bold ph-barcode"></i>
                <span>N° RADICADO: {createdRecordInfo.id}</span>
              </div>

              <div className="obs-success-details-grid">
                <div className="obs-success-item">
                  <span className="obs-success-label">Ubicación / Módulo</span>
                  <strong className="obs-success-val">{createdRecordInfo.route}</strong>
                </div>
                <div className="obs-success-item">
                  <span className="obs-success-label">Estado de Alerta</span>
                  <strong className="obs-success-val" style={{ textTransform: 'capitalize' }}>
                    {createdRecordInfo.semaforo === 'rojo' && '🔴 Alerta Crítica'}
                    {createdRecordInfo.semaforo === 'amarillo' && '🟡 En Seguimiento'}
                    {createdRecordInfo.semaforo === 'verde' && '🟢 Superado / Resuelto'}
                  </strong>
                </div>
                {createdRecordInfo.studentName && (
                  <div className="obs-success-item">
                    <span className="obs-success-label">Estudiante Matriculado</span>
                    <strong className="obs-success-val">
                      {createdRecordInfo.studentName} ({createdRecordInfo.grade})
                    </strong>
                  </div>
                )}
                <div className="obs-success-item">
                  <span className="obs-success-label">Docente Responsable</span>
                  <strong className="obs-success-val">{createdRecordInfo.teacher}</strong>
                </div>
                <div className="obs-success-item" style={{ gridColumn: 'span 2' }}>
                  <span className="obs-success-label">Título / Asunto</span>
                  <strong className="obs-success-val">{createdRecordInfo.title}</strong>
                </div>
                <div className="obs-success-item">
                  <span className="obs-success-label">Fecha Límite de Seguimiento</span>
                  <strong className="obs-success-val" style={{ color: '#0f766e' }}>
                    {createdRecordInfo.followUpDate} ({createdRecordInfo.followUpDateISO})
                  </strong>
                </div>
                {createdRecordInfo.fileName && (
                  <div className="obs-success-item">
                    <span className="obs-success-label">Soporte Escaneado (Cloudflare R2)</span>
                    <strong className="obs-success-val" style={{ color: '#0f766e' }}>
                      <i className="ph-bold ph-cloud-check" style={{ marginRight: '4px' }}></i>
                      {createdRecordInfo.fileName}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            <div className="obs-success-actions-row">
              <button
                type="button"
                className="obs-btn-outline"
                onClick={handleResetForm}
              >
                <i className="ph-bold ph-plus-circle"></i>
                <span>Radicar Otro Registro</span>
              </button>

              <button
                type="button"
                className="obs-btn-outline"
                onClick={() => {
                  onRecordCreated(createdRecordInfo, true);
                  onClose();
                }}
              >
                <i className="ph-bold ph-eye"></i>
                <span>Ver Acta Completa</span>
              </button>

              <button
                type="button"
                className="obs-btn-finish"
                onClick={handleModalClose}
              >
                <i className="ph-bold ph-check"></i>
                <span>Finalizar y Salir</span>
              </button>
            </div>
          </div>
        ) : (
          /* FORMULARIO DE CAPTURA Y RADICACIÓN */
          <form ref={formRef} onSubmit={handleSubmit} className="obs-upload-form">
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
                    if (COMMITTEE_MEMBERS[newRoute] || committeeService.getCommittee(newRoute)) {
                      const cInfo = committeeService.getCommittee(newRoute);
                      const membersTxt = committeeService.getCommitteeMembersLabel(newRoute);
                      setAttendees(`${membersTxt}, Claudia (Rectora)`);
                      if (!title) {
                        setTitle(`Acta Ordinaria N° - ${cInfo?.name || newRoute}`);
                      }
                    }
                  }}
                  required
                >
                  <optgroup label="Seguimiento a Estudiantes">
                    <option value="observador">Observador del Estudiante</option>
                    <option value="citaciones">Citaciones & Acudientes</option>
                    <option value="piar">Seguimiento Pedagógico & PIAR</option>
                  </optgroup>
                  
                  {/* Comités Disponibles según asignación de Rectoría */}
                  {(isPrivileged || committeeService.getUserAssignedCommittees(currentUser).length > 0) && (
                    <optgroup label="Actas de Comités Escolares (Asignadas por Rectoría)">
                      {(isPrivileged || committeeService.isUserAssigned('comite_convivencia', currentUser)) && (
                        <option value="comite_convivencia">Comité de Convivencia Escolar (Ley 1620)</option>
                      )}
                      {(isPrivileged || committeeService.isUserAssigned('comision_evaluacion', currentUser)) && (
                        <option value="comision_evaluacion">Comisión de Evaluación y Promoción (Dec. 1290)</option>
                      )}
                      {(isPrivileged || committeeService.isUserAssigned('consejo_academico', currentUser)) && (
                        <option value="consejo_academico">Consejo Académico (Ley 115)</option>
                      )}
                      <option value="reuniones_docentes">Reuniones de Docentes & Asambleas</option>
                    </optgroup>
                  )}
                </select>
                {!isPrivileged && (
                  <span style={{ fontSize: '0.72rem', color: '#0f766e', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="ph-bold ph-info"></i>
                    <span>
                      {committeeService.getUserAssignedCommittees(currentUser).length > 0
                        ? 'Permisos activos: Observador de aula + Comités asignados por Rectoría.'
                        : 'Permiso docente estándar: Observador, citaciones y PIAR.'}
                    </span>
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
                    <label htmlFor="obsTypeSelect">
                      <i className="ph-bold ph-scales"></i> Tipo de Falta / Notificación *
                    </label>
                    <select
                      id="obsTypeSelect"
                      className="obs-input-field"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      required
                    >
                      <option value="falta_leve">📘 Falta Leve (Tipo I - Llamado Pedagógico)</option>
                      <option value="falta_grave">⚠️ Falta Grave (Tipo II - Debido Proceso)</option>
                      <option value="falta_gravisima">🚨 Falta Gravísima (Tipo III - Máxima Alerta)</option>
                      <option value="felicitacion">⭐ Mérito & Felicitación Institucional</option>
                      <option value="piar_ajuste">🧠 Ajuste Metodológico PIAR</option>
                    </select>
                  </div>

                  {route === 'citaciones' && (
                    <div className="obs-form-group">
                      <label htmlFor="obsGuardianInput">Nombre del Acudiente / Teléfono *</label>
                      <input
                        type="text"
                        id="obsGuardianInput"
                        className="obs-input-field"
                        placeholder="Ej: Carolina Álvarez (Madre - 3105551234)"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        required
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
                    <label htmlFor="obsCommitteeAttendees">Miembros Convocados / Asistentes *</label>
                    <input
                      type="text"
                      id="obsCommitteeAttendees"
                      className="obs-input-field"
                      placeholder="Ej: Claudia (Rectora), Jessica, Yuri, Elcy, Padres"
                      value={attendees}
                      onChange={(e) => setAttendees(e.target.value)}
                      required
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
                    ? 'Ej: Compromiso por llamado de atención en clase o reconocimiento...'
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
                <i className="ph-bold ph-handshake"></i> Compromisos, Acuerdos o Medidas Concertadas
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

            {/* Fila: Estado Inicial y Soporte Adjunto en R2 */}
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

              <div className="obs-form-group obs-file-upload-block">
                <div className="obs-file-header-bar">
                  <label htmlFor="obsFileInput" className="obs-file-title-label">
                    <i className="ph-bold ph-paperclip"></i>
                    <span>Adjuntar Evidencia o Acta Escaneada (Opcional)</span>
                  </label>
                  <span className="obs-r2-cloud-badge" title="Almacenamiento seguro en la nube con Cloudflare R2">
                    <i className="ph-bold ph-cloud-arrow-up"></i> Custodia R2
                  </span>
                </div>

                {!selectedFile ? (
                  <div 
                    className="obs-file-dropzone-box"
                    onClick={() => document.getElementById('obsFileInput')?.click()}
                    title="Seleccionar archivo para subir a Cloudflare R2"
                  >
                    <i className="ph-bold ph-file-arrow-up obs-dropzone-icon"></i>
                    <div className="obs-dropzone-info">
                      <strong>Haz clic aquí para seleccionar evidencia o acta</strong>
                      <span>Formatos: PDF, Word (.docx) o imágenes escaneadas (PNG, JPG)</span>
                    </div>
                    <input
                      type="file"
                      id="obsFileInput"
                      className="obs-file-input-native"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <div className="obs-file-chosen-card">
                    <div className="obs-file-chosen-left">
                      <div className="obs-file-type-icon">
                        <i className={selectedFile.name.toLowerCase().endsWith('.pdf') ? 'ph-bold ph-file-pdf' : 'ph-bold ph-file-text'}></i>
                      </div>
                      <div className="obs-file-details">
                        <strong className="obs-file-title" title={selectedFile.name}>{selectedFile.name}</strong>
                        <span className="obs-file-sub">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Listo para subir a Cloudflare R2
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="obs-btn-remove-selected-file"
                      onClick={() => {
                        setSelectedFile(null);
                        const fileInput = document.getElementById('obsFileInput');
                        if (fileInput) fileInput.value = '';
                      }}
                      title="Quitar archivo adjunto"
                    >
                      <i className="ph-bold ph-trash"></i>
                      <span>Quitar</span>
                    </button>
                  </div>
                )}
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
                      Se calculan alertas automáticas de vencimiento según la falta tipificada en el manual de convivencia.
                    </span>
                  </div>
                </div>

                <span className={`obs-date-badge-pill ${dateRules.isConvivenciaRule ? 'urgent' : 'standard'}`}>
                  {dateRules.badgeLabel}
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

                  {/* Paridad visual en tiempo real: etiqueta que sincroniza el cálculo */}
                  {diffDays !== null && !isNaN(diffDays) && (
                    <div style={{ marginTop: '5px' }}>
                      {diffDays < 0 && (
                        <span className="obs-date-diff-tag past" title="Fecha anterior a hoy (registro retroactivo)">
                          <i className="ph-bold ph-clock-counter-clockwise"></i>
                          <span>Fecha anterior: hace {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'día' : 'días'} (retroactivo)</span>
                        </span>
                      )}
                      {diffDays === 0 && (
                        <span className="obs-date-diff-tag today">
                          <i className="ph-bold ph-warning-circle"></i>
                          <span>Vence hoy mismo</span>
                        </span>
                      )}
                      {diffDays > 0 && diffDays <= dateRules.maxDays && (
                        <span className="obs-date-diff-tag future">
                          <i className="ph-bold ph-calendar-check"></i>
                          <span>En plazo normativo: faltan {diffDays} {diffDays === 1 ? 'día' : 'días'}</span>
                        </span>
                      )}
                      {diffDays > dateRules.maxDays && (
                        <span className="obs-date-diff-tag exceeded">
                          <i className="ph-bold ph-warning"></i>
                          <span>Supera el plazo máximo ({diffDays}d &gt; {dateRules.maxDays}d)</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Botones de Autollenado Rápido Sincronizados con la Falta */}
                <div className="obs-quick-dates-row">
                  <span className="obs-quick-label">⚡ Llenado rápido:</span>
                  {dateRules.quickButtons.map((btn) => {
                    const targetDate = btn.days === 0 ? toISODate(new Date()) : addDays(btn.days);
                    const isSelected = followUpDate === targetDate;
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        className={`obs-btn-quick-tag ${btn.highlight ? 'highlight' : ''} ${btn.isPast ? 'past' : ''} ${isSelected ? 'active' : ''}`}
                        onClick={() => setFollowUpDate(targetDate)}
                        title={`Fijar fecha estimada en ${targetDate}`}
                      >
                        {isSelected && <i className="ph-bold ph-check" style={{ marginRight: '3px' }}></i>}
                        {btn.label}
                      </button>
                    );
                  })}
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

            {/* Error reflejado también abajo antes del botón para visibilidad total */}
            {errorMessage && (
              <div className="obs-form-error" role="alert" style={{ marginTop: '0.5rem' }}>
                <i className="ph-bold ph-warning-circle"></i>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Botones de Envío */}
            <div className="obs-upload-footer">
              <button type="button" className="obs-btn-outline" onClick={handleModalClose} disabled={isUploading}>
                Cancelar
              </button>
              <button type="submit" className="obs-btn-primary obs-btn-submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <i className="ph-bold ph-spinner ph-spin"></i>
                    <span>Subiendo a R2 & Radicando...</span>
                  </>
                ) : (
                  <>
                    <i className="ph-bold ph-check"></i>
                    <span>Radicar Registro / Acta</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
