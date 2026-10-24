/**
 * Auditor Autónomo de Métricas y Coherencia Curricular
 * Gimnasio Martín Galeano - Sistema Integral de Básica Primaria
 * 
 * Reglas de Validación:
 * a) 100% de grados con Directora Titular activa.
 * b) Asignaturas de dirección (Artes, Religión, Educación Física, Ética) ligadas a la titular de curso.
 * c) Especialidades con docente válido y activo.
 * d) Detección de asignaturas huérfanas y cálculo de porcentajes institucionales.
 */

import { GRADES_LIST } from '../src/data/gradesTreeData.js';
import { USERS } from '../src/data/users.js';
import gradesService from '../src/services/gradesService.js';

const FORMATIVE_SUBJECTS = [
  'Educación Artística',
  'Religión',
  'Educación Física',
  'Ética & Valores',
  'Ética y Valores'
];

async function runCurriculumAudit() {
  console.log('\n===============================================================');
  console.log('🔍 INICIANDO AUDITORÍA INSTITUCIONAL DE MÉTRICAS CURRICULARES');
  console.log('   Gimnasio Martín Galeano - Planta Docente y Malla SIEE');
  console.log('===============================================================\n');

  let totalGradesChecked = 0;
  let gradesWithValidDirector = 0;
  let totalAssignmentsChecked = 0;
  let validAssignments = 0;
  let formativeLinkedCorrectly = 0;
  let totalFormativeChecked = 0;
  let orphanedAssignments = 0;

  const auditReportRows = [];
  const issues = [];

  for (const grade of GRADES_LIST) {
    totalGradesChecked++;
    const directorInfo = gradesService.getGradeDirector(grade);
    const directorKey = directorInfo?.docente_id;
    const directorUser = directorKey ? USERS[directorKey] : null;
    const isDirectorValid = Boolean(directorUser && directorUser.role === 'docente' || directorUser?.role === 'rectora' || directorUser?.role === 'admin');

    if (isDirectorValid) {
      gradesWithValidDirector++;
    } else {
      issues.push(`❌ [Dirección de Curso] Grado ${grade} sin director(a) válido(a): "${directorKey}"`);
    }

    const subjects = gradesService.getSubjectsForGrade(grade);

    for (const subject of subjects) {
      totalAssignmentsChecked++;
      const assignment = gradesService.getTeacherAssignment(grade, subject);
      const teacherKey = assignment?.docente_id;
      const teacherUser = teacherKey ? USERS[teacherKey] : null;

      const isTeacherActive = Boolean(teacherUser && teacherUser.status !== 'retirada' && !teacherUser.isBlocked);
      const isFormative = FORMATIVE_SUBJECTS.includes(subject);

      let isFormativeLinked = true;
      if (isFormative) {
        totalFormativeChecked++;
        if (teacherKey !== directorKey) {
          isFormativeLinked = false;
          issues.push(`⚠️ [Materia de Dirección] ${grade} - ${subject}: Asignada a "${teacherKey}" pero la directora es "${directorKey}"`);
        } else {
          formativeLinkedCorrectly++;
        }
      }

      if (isTeacherActive) {
        validAssignments++;
      } else {
        orphanedAssignments++;
        issues.push(`❌ [Materia Huérfana/Inactiva] ${grade} - ${subject}: Docente no válido o inhabilitado "${teacherKey}"`);
      }

      auditReportRows.push({
        Grado: grade,
        Asignatura: subject,
        Docente: teacherUser?.name || teacherKey || 'SIN ASIGNAR',
        Tipo: isFormative ? 'Formativa / Dirección' : 'Especialidad',
        DirectorCurso: directorUser?.name || directorKey || 'N/A',
        Estado: isTeacherActive ? (isFormative && !isFormativeLinked ? 'Desalineada' : 'Óptimo') : 'Huérfana'
      });
    }
  }

  // Despliegue de métricas en tabla
  console.table(auditReportRows);

  const directorCoveragePct = ((gradesWithValidDirector / totalGradesChecked) * 100).toFixed(1);
  const assignmentsCoveragePct = ((validAssignments / totalAssignmentsChecked) * 100).toFixed(1);
  const formativeLinkedPct = totalFormativeChecked > 0 ? ((formativeLinkedCorrectly / totalFormativeChecked) * 100).toFixed(1) : '100.0';

  console.log('\n📊 RESUMEN EJECUTIVO DE MÉTRICAS CURRICULARES:');
  console.log('---------------------------------------------------------------');
  console.log(`• Cobertura de Directores Titulares: ${directorCoveragePct}% (${gradesWithValidDirector}/${totalGradesChecked} grados)`);
  console.log(`• Titularidad Activa de Asignaturas: ${assignmentsCoveragePct}% (${validAssignments}/${totalAssignmentsChecked} asignaciones)`);
  console.log(`• Vinculación Formativas a Directoras: ${formativeLinkedPct}% (${formativeLinkedCorrectly}/${totalFormativeChecked} formativas)`);
  console.log(`• Asignaturas Huérfanas / Bloqueadas: ${orphanedAssignments}`);
  console.log('---------------------------------------------------------------\n');

  if (issues.length > 0) {
    console.warn('⚠️ ALERTAS CURRICULARES DETECTADAS:');
    issues.forEach(iss => console.warn(`  ${iss}`));
    console.log('\n');
  }

  // Regla de salida: Error si faltan directores o hay huérfanas
  if (gradesWithValidDirector < totalGradesChecked || orphanedAssignments > 0) {
    console.error('❌ ERROR AUDITORÍA: El sistema curricular presenta inconsistencias críticas.');
    process.exit(1);
  } else {
    console.log('✅ AUDITORÍA EXITOSA: Planta docente y malla curricular 100% consistentes.\n');
    process.exit(0);
  }
}

runCurriculumAudit().catch(err => {
  console.error('Error fatal durante la auditoría:', err);
  process.exit(1);
});
