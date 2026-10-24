import { useState, useEffect, useRef, useMemo } from 'react';
import { STUDENTS_BY_GRADE } from '../data/gradesTreeData';
import { OBSERVADOR_ROUTES, RECORD_STATUSES, COMMITTEE_MEMBERS, AVAILABLE_TEACHERS } from '../data/initialObservador';
import { getDateRules, addDays, toISODate, formatDisplayDate, getDaysDifference } from '../utils/observadorDates';
import { committeeService } from '../services/committeeService.js';
import { uploadDocumentFile } from '../services/storageService.js';
import gradesService from '../services/gradesService.js';

// Presets de asistentes para comités y asambleas
const COMMITTEE_ATTENDEE_PRESETS = [
  'Claudia (Rectora)',
  'Liliana (Preescolar)',
  'Yuri (1°)',
  'Elcy (2°)',
  'Blanca (3°)',
  'Nicolle (4°)',
  'Jessica (5°)',
  'Representante de Padres',
  'Personero Estudiantil'
];

export default function UploadObservadorModal({
  isOpen,
  onClose,
  currentUser,
  onRecordCreated,
  initialRoute = 'observador',
  existingRecords = []
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
  const [guardianPhone, setGuardianPhone] = useState('');
  const [sessionType, setSessionType] = useState('Ordinaria');
  const [attendees, setAttendees] = useState('');
  const [type, setType] = useState('falta_leve');
  const [title, setTitle] = useState('');
  const activePeriodInfo = gradesService.getActiveAcademicPeriod();
  const [period, setPeriod] = useState(() => activePeriodInfo.shortName || '1° Periodo');
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

  // Función auxiliar para extraer nombre de acudiente y teléfono
  const parseAcudienteInfo = (acudienteRaw = '') => {
    if (!acudienteRaw) return { name: '', phone: '' };
    // Formato común: "Marta Álvarez (Madre) - Cel: 310 892 1102" o "Carlos Torres (Padre) - Cel: 315 489 1234"
    const parts = acudienteRaw.split(/\s*-\s*Cel:?\s*/i);
    const parsedName = parts[0]?.trim() || '';
    const parsedPhone = parts[1]?.trim() || '';
    return { name: parsedName, phone: parsedPhone };
  };

  // Sincronizar selección de estudiante inicial cuando cambia el grado
  useEffect(() => {
    if (currentGradeStudents.length > 0) {
      const first = currentGradeStudents[0];
      setStudentId(first.id);
      setStudentName(first.name);
      const parsed = parseAcudienteInfo(first.acudiente);
      setGuardianName(parsed.name);
      setGuardianPhone(parsed.phone);
    } else {
      setStudentId('');
      setStudentName('');
      setGuardianName('');
      setGuardianPhone('');
    }
  }, [grade]);

  // Manejar cambio de estudiante
  const handleStudentChange = (selectedId) => {
    setStudentId(selectedId);
    const found = currentGradeStudents.find((s) => s.id === selectedId);
    if (found) {
      setStudentName(found.name);
      const parsed = parseAcudienteInfo(found.acudiente);
      setGuardianName(parsed.name);
      setGuardianPhone(parsed.phone);
    }
  };

  const isStudentRoute = ['observador', 'citaciones', 'piar'].includes(route);

  // Cálculo de secuencia automática para comités
  const COMMITTEE_NAME_MAP = {
    comite_convivencia: 'Comité de Convivencia Escolar',
    comision_evaluacion: 'Comisión de Evaluación y Promoción',
    consejo_academico: 'Consejo Académico',
    reuniones_docentes: 'Reunión General de Docentes'
  };

  const nextActaNumber = useMemo(() => {
    if (isStudentRoute) return 1;
    const sameRouteRecords = existingRecords.filter((r) => r.route === route);
    let maxNum = 0;
    sameRouteRecords.forEach((r) => {
      const match = r.title?.match(/Acta\s*(?:Ordinaria|Extraordinaria|General)?\s*(?:N°|N|#)?\s*(\d+)/i);
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (parsed > maxNum) maxNum = parsed;
      }
    });
    return maxNum > 0 ? maxNum + 1 : sameRouteRecords.length + 1;
  }, [route, existingRecords, isStudentRoute]);

  const [actaNumber, setActaNumber] = useState(1);
  const [actaTopic, setActaTopic] = useState('');
  const [isManualTitleEdit, setIsManualTitleEdit] = useState(false);

  // Sincronizar número correlativo al cambiar de comité o al abrirse
  useEffect(() => {
    if (!isStudentRoute) {
      setActaNumber(nextActaNumber);
      setIsManualTitleEdit(false);
      setActaTopic('');
    }
  }, [route, nextActaNumber, isStudentRoute, isOpen]);

  // Actualizar el título autogenerado del acta cuando cambia el número, tema o tipo de sesión
  useEffect(() => {
    if (!isStudentRoute && !isManualTitleEdit) {
      const commName = COMMITTEE_NAME_MAP[route] || 'Comité';
      const formattedNum = String(actaNumber).padStart(2, '0');
      const sessionLabel = sessionType === 'Extraordinaria' ? 'Extraordinaria' : 'Ordinaria';
      const generatedTitle = actaTopic.trim()
        ? `Acta ${sessionLabel} N° ${formattedNum}: ${actaTopic.trim()}`
        : `Acta ${sessionLabel} N° ${formattedNum} - ${commName} 2026`;
      setTitle(generatedTitle);
    }
  }, [actaNumber, actaTopic, sessionType, route, isStudentRoute, isManualTitleEdit]);

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

    // Candado Jurídico: Bloqueo explícito de radicación si se marca estado verde o resuelto sin soporte documental
    if ((semaforo === 'verde' || status === 'resuelto') && !selectedFile) {
      setErrorMessage('⚠️ Candado Jurídico: No es legal radicar un caso en estado 🟢 Verde (Superado / Resuelto) sin adjuntar el acta escaneada o soporte probatorio en R2.');
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
    // Partición jerárquica canónica para R2: GMG/2026/COMITES/.../ACTA_001/ o GMG/2026/OBSERVADOR/...
    const cleanRoute = (route || 'observador').toLowerCase();
    const targetFolder = isStudentRoute ? `observador/${cleanRoute}` : `comites/${cleanRoute}`;
    if (selectedFile) {
      try {
        setIsUploading(true);
        const uploadRes = await uploadDocumentFile(selectedFile, targetFolder, newId, {
          moduleFolder: isStudentRoute ? 'OBSERVADOR' : 'COMITES',
          subFolder: cleanRoute,
          expedienteId: newId,
          documentType: 'PRINCIPAL',
          year: '2026',
          institutionCode: 'GMG'
        });
        uploadedStorageKey = uploadRes.storageKey;
      } catch (err) {
        console.warn('[UploadObservadorModal] Error al subir archivo adjunto a R2/Storage:', err);
      } finally {
        setIsUploading(false);
      }
    }

    const fullGuardianContact = isStudentRoute && (guardianName.trim() || guardianPhone.trim())
      ? `${guardianName.trim()}${guardianPhone.trim() ? ` - Cel: ${guardianPhone.trim()}` : ''}`
      : null;

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
      guardianName: fullGuardianContact,
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

  // Atajo de teclado: Cerrar modal con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isUploading) {
        handleModalClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isUploading]);

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
                  <option value="1° Periodo">1° Periodo</option>
                  <option value="2° Periodo">2° Periodo</option>
                  <option value="3° Periodo">3° Periodo</option>
                  <option value="4° Periodo">4° Periodo</option>
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
                  <option value="Liliana">Liliana • Preescolar</option>
                  <option value="Yuri">Yuri • 1° Primaria</option>
                  <option value="Elcy">Elcy • 2° Primaria</option>
                  <option value="Blanca">Blanca • 3° Primaria</option>
                  <option value="Nicolle">Nicolle • 4° Primaria</option>
                  <option value="Jessica">Jessica • 5° Primaria</option>
                  <option value="Claudia (Rectora)">Claudia • Rectoría Institucional</option>
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'verde' && !selectedFile) {
                      setErrorMessage('⚠️ Candado Jurídico: Para pasar a 🟢 Verde (Superado / Resuelto) es obligatorio adjuntar el acta firmada o soporte documental escaneado.');
                      return;
                    }
                    setErrorMessage('');
                    setSemaforo(val);
                  }}
                  required
                >
                  <option value="rojo">🔴 Rojo - Alerta Crítica (Va primero en la lista)</option>
                  <option value="amarillo">🟡 Amarillo - En Seguimiento / Proceso (Intermedio)</option>
                  <option value="verde" disabled={!selectedFile}>
                    🟢 Verde - Superado / Resuelto {!selectedFile ? '(Requiere adjuntar evidencia escaneada)' : '(Soporte cargado)'}
                  </option>
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
                      <option value="Pre-Jardín">Pre-Jardín</option>
                    <option value="Transición">Transición</option>
                      <option value="1° Primaria">1° Primaria</option>
                      <option value="2° Primaria">2° Primaria</option>
                      <option value="3° Primaria">3° Primaria</option>
                      <option value="4° Primaria">4° Primaria</option>
                      <option value="5° Primaria">5° Primaria</option>
                    </select>
                  </div>

                  <div className="obs-form-group" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="obsStudentSelect" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Estudiante Matriculado *</span>
                      <span style={{ fontSize: '0.72rem', color: '#0f766e', fontWeight: 600 }}>
                        <i className="ph-bold ph-user-check" style={{ marginRight: '4px' }}></i>Incluye contacto de acudiente
                      </span>
                    </label>
                    <select
                      id="obsStudentSelect"
                      className="obs-input-field"
                      value={studentId}
                      onChange={(e) => handleStudentChange(e.target.value)}
                      required
                    >
                      {currentGradeStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} — {st.acudiente || `ID: ${st.id}`}
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

                  {/* Casillas Separadas: Nombre de Madre/Acudiente y Teléfono */}
                  <div className="obs-form-group">
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                      <div>
                        <label htmlFor="obsGuardianNameInput">Nombre de Acudiente / Madre *</label>
                        <input
                          type="text"
                          id="obsGuardianNameInput"
                          className="obs-input-field"
                          placeholder="Ej: Marta Álvarez (Madre)"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          required={route === 'citaciones'}
                        />
                      </div>
                      <div>
                        <label htmlFor="obsGuardianPhoneInput">Teléfono de Contacto</label>
                        <input
                          type="text"
                          id="obsGuardianPhoneInput"
                          className="obs-input-field"
                          placeholder="Ej: 310 892 1102"
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
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

                  <div className="obs-form-group" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label htmlFor="obsCommitteeAttendees" style={{ margin: 0 }}>
                        <i className="ph-bold ph-users-three"></i> Miembros Convocados / Asistentes *
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#0f766e', fontWeight: 600 }}>
                        Toca los chips para alternar asistentes
                      </span>
                    </div>

                    {/* Cuadrícula táctil de chips de asistentes */}
                    <div className="obs-attendees-chips-grid" style={{ marginBottom: '8px' }}>
                      {COMMITTEE_ATTENDEE_PRESETS.map((preset) => {
                        const currentList = attendees ? attendees.split(',').map(s => s.trim()).filter(Boolean) : [];
                        const isSelected = currentList.some(item => item.toLowerCase() === preset.toLowerCase());
                        return (
                          <button
                            key={preset}
                            type="button"
                            className={`obs-chip-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              let nextList;
                              if (isSelected) {
                                nextList = currentList.filter(item => item.toLowerCase() !== preset.toLowerCase());
                              } else {
                                nextList = [...currentList, preset];
                              }
                              setAttendees(nextList.join(', '));
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: isSelected ? 700 : 500,
                              background: isSelected ? '#0f766e' : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#334155',
                              border: isSelected ? '1px solid #0f766e' : '1px solid #cbd5e1',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <i className={`ph-bold ${isSelected ? 'ph-check' : 'ph-plus'}`}></i>
                            <span>{preset}</span>
                          </button>
                        );
                      })}
                    </div>

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

            {/* Título Principal y Estructura Correlativa Automatizada */}
            {!isStudentRoute ? (
              <div className="obs-form-group" style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <label style={{ margin: 0, fontWeight: 700, fontSize: '0.86rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ph-bold ph-hash" style={{ color: '#0f766e' }}></i>
                    <span>Secuencia Correlativa & Título Oficial del Acta</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManualTitleEdit(prev => !prev)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isManualTitleEdit ? '#b91c1c' : '#0f766e',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className={`ph-bold ${isManualTitleEdit ? 'ph-lock' : 'ph-pencil-simple'}`}></i>
                    <span>{isManualTitleEdit ? 'Bloquear estructura' : 'Editar texto libremente'}</span>
                  </button>
                </div>

                {!isManualTitleEdit ? (
                  <div>
                    <div className="obs-acta-sequence-grid" style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '10px', marginBottom: '0.6rem' }}>
                      <div>
                        <label htmlFor="obsActaNum" style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                          N° de Acta
                        </label>
                        <input
                          type="number"
                          id="obsActaNum"
                          min="1"
                          max="999"
                          className="obs-input-field"
                          value={actaNumber}
                          onChange={(e) => setActaNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          style={{ fontWeight: 800, textAlign: 'center', color: '#0f766e', fontSize: '0.95rem' }}
                        />
                      </div>
                      <div>
                        <label htmlFor="obsActaTopic" style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                          Tema o Asunto Principal (Opcional)
                        </label>
                        <input
                          type="text"
                          id="obsActaTopic"
                          className="obs-input-field"
                          placeholder="Ej: Análisis académico de primer corte / Mediación"
                          value={actaTopic}
                          onChange={(e) => setActaTopic(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdfa', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #99f6e4' }}>
                      <i className="ph-bold ph-shield-check" style={{ color: '#0f766e', fontSize: '1.05rem', flexShrink: 0 }}></i>
                      <div style={{ fontSize: '0.8rem', color: '#134e4a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong>Título resultante:</strong> {title}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      id="obsTitleInput"
                      className="obs-input-field"
                      placeholder="Ej: Acta Ordinaria N° 02 - Balance bimestral y acuerdos..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                    <small style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>
                      Estructura manual habilitada: puedes ingresar el texto exacto deseado.
                    </small>
                  </div>
                )}
              </div>
            ) : (
              <div className="obs-form-group">
                <label htmlFor="obsTitleInput">Título del Hecho o Asunto *</label>
                <input
                  type="text"
                  id="obsTitleInput"
                  className="obs-input-field"
                  placeholder="Ej: Compromiso por llamado de atención en clase o reconocimiento..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            )}

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
                  <option value="en_seguimiento">En Seguimiento</option>
                  <option value="compromiso_firmado">Compromiso Firmado</option>
                  <option value="resuelto">Superado</option>
                  <option value="acta_aprobada">Aprobada & Firmada</option>
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
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          setSelectedFile(null);
                          return;
                        }
                        const maxBytes = currentUser?.maxUploadBytes || (15 * 1024 * 1024);
                        if (file.size > maxBytes) {
                          const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
                          setErrorMessage(`⚠️ El archivo seleccionado pesa ${(file.size / (1024 * 1024)).toFixed(2)} MB y supera el límite de ${maxMb} MB.`);
                          e.target.value = '';
                          setSelectedFile(null);
                          return;
                        }
                        setErrorMessage('');
                        setSelectedFile(file);
                      }}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
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
