/**
 * Utilidades para cálculo, formateo y alertas de fechas y plazos
 * Módulo: Observador del Estudiante y Actas de Comités
 * Gimnasio Martín Galeano - Básica Primaria
 */

/**
 * Convierte un objeto Date a string YYYY-MM-DD local
 */
export function toISODate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Suma días a una fecha base (por defecto hoy) y retorna YYYY-MM-DD
 */
export function addDays(days, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/**
 * Parsea cualquier fecha (YYYY-MM-DD, DD/MM/YYYY, ISO string) a objeto Date
 */
export function parseDateSafe(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;

  const str = String(dateStr).trim();

  // Caso DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day, 23, 59, 59);
    return isNaN(d.getTime()) ? null : d;
  }

  // Caso YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day, 23, 59, 59);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Convierte cualquier fecha a formato YYYY-MM-DD compatible con <input type="date">
 */
export function normalizeToInputDate(dateStr) {
  if (!dateStr) return '';
  const d = parseDateSafe(dateStr);
  return d ? toISODate(d) : '';
}

/**
 * Formatea una fecha para visualización en tarjetas, tablas y actas
 * Ej: "21/10/2026" o "21 de Octubre, 2026"
 */
export function formatDisplayDate(dateStr, format = 'short') {
  if (!dateStr) return 'Sin fecha';
  const d = parseDateSafe(dateStr);
  if (!d) return dateStr;

  if (format === 'long') {
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Calcula la diferencia en días enteros entre una fecha objetivo y la fecha actual.
 * < 0: Vencida
 * 0: Vence hoy
 * > 0: Días restantes
 */
export function getDaysDifference(targetDateStr, baseDate = new Date()) {
  const target = parseDateSafe(targetDateStr);
  if (!target) return null;

  // Normalizamos ambas fechas a medianoche del día local para comparación exacta de calendario
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const baseMidnight = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  const diffTime = targetMidnight.getTime() - baseMidnight.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Evalúa el estado del plazo y metadatos de alerta para un registro
 */
export function getDeadlineMeta(record, baseDate = new Date()) {
  if (!record) {
    return {
      isResolved: false,
      isOverdue: false,
      isExpiringToday: false,
      isUrgent: false,
      autoEscalateToRed: false,
      badgeClass: 'deadline-badge-none',
      statusText: 'Sin seguimiento',
      daysDiff: null
    };
  }

  // Si ya está resuelto (verde), el caso fue cerrado con éxito y no escala
  const isResolved = record.semaforo === 'verde' || record.status === 'resuelto';
  if (isResolved) {
    return {
      isResolved: true,
      isOverdue: false,
      isExpiringToday: false,
      isUrgent: false,
      autoEscalateToRed: false,
      badgeClass: 'deadline-badge-resolved',
      statusText: 'Cumplido / Resuelto',
      fullText: 'Compromiso cumplido y situación superada.',
      icon: 'ph-check-circle',
      daysDiff: null
    };
  }

  if (!record.followUpDate) {
    return {
      isResolved: false,
      isOverdue: false,
      isExpiringToday: false,
      isUrgent: false,
      autoEscalateToRed: false,
      badgeClass: 'deadline-badge-none',
      statusText: 'Sin fecha de plazo',
      fullText: 'No tiene fecha de seguimiento asignada.',
      icon: 'ph-calendar-blank',
      daysDiff: null
    };
  }

  const diff = getDaysDifference(record.followUpDate, baseDate);

  // Caso 1: VENCIDO (plazo expirado)
  if (diff < 0) {
    const overdueDays = Math.abs(diff);
    return {
      isResolved: false,
      isOverdue: true,
      isExpiringToday: false,
      isUrgent: true,
      autoEscalateToRed: true, // Escala automáticamente a 🔴 Rojo
      daysDiff: diff,
      overdueDays,
      badgeClass: 'deadline-badge-overdue',
      statusText: overdueDays === 1 ? '⚠️ Vencido ayer' : `⚠️ Vencido hace ${overdueDays}d`,
      fullText: `⚠️ Plazo de seguimiento vencido hace ${overdueDays} día(s). Caso escalado a Alerta Crítica.`,
      icon: 'ph-warning-octagon'
    };
  }

  // Caso 2: VENCE HOY
  if (diff === 0) {
    return {
      isResolved: false,
      isOverdue: false,
      isExpiringToday: true,
      isUrgent: true,
      autoEscalateToRed: true, // Prioridad crítica hoy
      daysDiff: 0,
      badgeClass: 'deadline-badge-today',
      statusText: '🚨 ¡Vence hoy!',
      fullText: '🚨 Atención prioritaria: El plazo de este compromiso o sesión vence hoy.',
      icon: 'ph-alarm'
    };
  }

  // Caso 3: PRÓXIMO A VENCER (1 a 2 días restantes / 24h-48h)
  if (diff <= 2) {
    return {
      isResolved: false,
      isOverdue: false,
      isExpiringToday: false,
      isUrgent: true,
      autoEscalateToRed: false,
      daysDiff: diff,
      badgeClass: 'deadline-badge-urgent',
      statusText: diff === 1 ? '⏳ Vence mañana' : `⏳ Vence en 2 días`,
      fullText: `⏳ Alerta de seguimiento: Quedan ${diff} día(s) para verificar el cumplimiento.`,
      icon: 'ph-clock-countdown'
    };
  }

  // Caso 4: EN PLAZO NORMAL (3 días en adelante)
  return {
    isResolved: false,
    isOverdue: false,
    isExpiringToday: false,
    isUrgent: false,
    autoEscalateToRed: false,
    daysDiff: diff,
    badgeClass: 'deadline-badge-normal',
    statusText: `📅 ${diff} días rest.`,
    fullText: `📅 Plazo vigente: Faltan ${diff} días para la fecha de seguimiento fijada.`,
    icon: 'ph-calendar-check'
  };
}

/**
 * Reglas de negocio institucionales sobre límites máximos y autollenado de fechas
 * - Casos de convivencia / citaciones: máximo 1 semana (7 días).
 * - PIAR / Seguimiento pedagógico: máximo 1 mes (30 días).
 * - Comités / Reuniones docentes: máximo 1 mes (30 días) o hasta 60 días si es reunión especial.
 */
export function getDateRules(route, sessionType = 'Ordinaria', isSpecialMeeting = false) {
  const today = new Date();
  const todayISO = toISODate(today);

  // 1. Casos de Convivencia y Citaciones: MÁXIMO 1 SEMANA (7 DÍAS)
  if (route === 'observador' || route === 'citaciones') {
    const isCitacion = route === 'citaciones';
    const defaultDays = isCitacion ? 3 : 7;
    return {
      maxDays: 7,
      defaultDays,
      minDate: todayISO,
      maxDate: addDays(7, today),
      defaultDate: addDays(defaultDays, today),
      isConvivenciaRule: true,
      ruleNotice: '⚠️ Por norma institucional de Básica Primaria, los compromisos de convivencia y citaciones tienen un plazo máximo de 1 semana (7 días).'
    };
  }

  // 2. Comité de Convivencia Escolar (Ley 1620)
  if (route === 'comite_convivencia') {
    if (sessionType === 'Extraordinaria') {
      return {
        maxDays: 7,
        defaultDays: 3,
        minDate: todayISO,
        maxDate: addDays(7, today),
        defaultDate: addDays(3, today),
        isConvivenciaRule: true,
        ruleNotice: '⚠️ Sesión extraordinaria de convivencia: Plazo máximo normativo de 1 semana (7 días).'
      };
    }
    const maxDays = isSpecialMeeting ? 60 : 30;
    return {
      maxDays,
      defaultDays: 15,
      minDate: todayISO,
      maxDate: addDays(maxDays, today),
      defaultDate: addDays(15, today),
      isConvivenciaRule: false,
      ruleNotice: isSpecialMeeting
        ? 'Reunión de cronograma ampliado: Plazo extendido hasta 60 días.'
        : 'Comité de Convivencia: Plazo estándar de 15 a 30 días.'
    };
  }

  // 3. Seguimiento Pedagógico y PIAR: MÁXIMO 1 MES (30 DÍAS)
  if (route === 'piar') {
    return {
      maxDays: 30,
      defaultDays: 15,
      minDate: todayISO,
      maxDate: addDays(30, today),
      defaultDate: addDays(15, today),
      isConvivenciaRule: false,
      ruleNotice: 'Planes PIAR y seguimiento pedagógico: Plazo máximo normativo de 1 mes (30 días).'
    };
  }

  // 4. Comités Generales y Reuniones de Docentes (Evaluación, Académico, Docentes)
  const maxDays = isSpecialMeeting ? 60 : 30;
  return {
    maxDays,
    defaultDays: 15,
    minDate: todayISO,
    maxDate: addDays(maxDays, today),
    defaultDate: addDays(15, today),
    isConvivenciaRule: false,
    ruleNotice: isSpecialMeeting
      ? 'Reunión o asamblea especial de periodo: Plazo extendido hasta 60 días.'
      : 'Actas de comités y jornadas: Plazo máximo normativo de 1 mes (30 días).'
  };
}
