import { useMemo } from 'react';
import gradesService, { calculateGrade80_20 } from '../services/gradesService';
import { ACADEMIC_PERIODS } from '../data/gradesTreeData';
import './StudentAuditDetailModal.css';

/**
 * FASE 5: Modal de Auditoría SIEE y Ficha Histórica del Estudiante
 * Permite visualizar el expediente completo del alumno:
 * - Datos administrativos de matrícula y acudiente
 * - Trazabilidad de retiro / traslado (con motivo, fecha y directivo responsable)
 * - Calificaciones de cada materia en los 4 periodos lectivos
 * - Detalle del cómputo consolidado anual con 1.0 por defecto para periodos futuros o no presentados
 */
export default function StudentAuditDetailModal({
  isOpen,
  onClose,
  student,
  grade,
  currentUser,
  onOpenRetireModal,
  onReactivateStudent
}) {
  if (!isOpen || !student) return null;

  const isRetired = student.active === false || student.status === 'inactivo' || student.status === 'retirado' || student.inhabilitado;
  const canManage = gradesService.canManageMatricula(currentUser);

  // Cargar calificaciones de los 4 periodos para este estudiante en todas las materias del grado
  const subjects = useMemo(() => {
    return gradesService.getSubjectsForGrade(grade);
  }, [grade]);

  const auditHistory = useMemo(() => {
    const rows = [];
    let annualSum = 0;

    subjects.forEach((subj) => {
      const periodScores = [];
      let subjAnnualWeighted = 0;

      ACADEMIC_PERIODS.forEach((period) => {
        const branch = gradesService.getBranch('2026', period, grade, subj);
        const record = branch?.students?.find(s => s.id === student.id);
        
        let score = 1.0;
        let isPreserved = false;
        let isDefaulted = false;

        if (record) {
          const calc = calculateGrade80_20(record, branch?.activities);
          score = calc.definitivaNum;
          isPreserved = Boolean(calc.hasPreservedScores || calc.activeScoresCount > 0);
          isDefaulted = Boolean(isRetired && !isPreserved);
        } else {
          isDefaulted = isRetired;
          score = 1.0;
        }

        periodScores.push({
          period,
          score,
          isPreserved,
          isDefaulted
        });

        subjAnnualWeighted += score * 0.25;
      });

      const definitiveAnnual = Number(subjAnnualWeighted.toFixed(2));
      annualSum += definitiveAnnual;

      rows.push({
        subject: subj,
        teacher: gradesService.getTeacherAssignment(grade, subj).teacherName,
        periodScores,
        definitiveAnnual,
        passed: definitiveAnnual >= 3.0
      });
    });

    const overallAnnualAverage = rows.length > 0 ? Number((annualSum / rows.length).toFixed(2)) : 1.0;

    return {
      rows,
      overallAnnualAverage,
      failedCount: rows.filter(r => !r.passed).length
    };
  }, [grade, student.id, subjects, isRetired]);

  return (
    <div className="audit-modal-overlay" onClick={onClose}>
      <div className="audit-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Expediente */}
        <div className="audit-modal-header">
          <div className="audit-header-left">
            <div className={`audit-avatar ${isRetired ? 'avatar-retired' : 'avatar-active'}`}>
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="audit-badge-row">
                <span className="audit-code-pill">{student.id}</span>
                <span className="audit-grade-pill">{grade}</span>
                {isRetired ? (
                  <span className="audit-status-tag status-retired">
                    <i className="ph-bold ph-user-minus"></i> Retirado / Inhabilitado
                  </span>
                ) : (
                  <span className="audit-status-tag status-active">
                    <span className="pulse-dot"></span> Activo en Aula
                  </span>
                )}
              </div>
              <h3 className="audit-student-name">{student.name}</h3>
              <p className="audit-subtitle">Ficha Histórica y Auditoría de Calificaciones SIEE • Gimnasio Martin Galeano</p>
            </div>
          </div>
          <button 
            type="button" 
            className="audit-close-btn" 
            onClick={onClose}
            title="Cerrar expediente"
          >
            ×
          </button>
        </div>

        <div className="audit-modal-body">
          {/* Ficha de Datos Administrativos */}
          <div className="audit-info-grid">
            <div className="audit-info-item">
              <span className="info-label">Madre / Acudiente & Teléfono</span>
              <span className="info-val">
                <i className="ph-bold ph-users"></i> {student.acudiente || 'Acudiente registrado en secretaría'}
              </span>
            </div>
            <div className="audit-info-item">
              <span className="info-label">Fecha de Ingreso</span>
              <span className="info-val">
                <i className="ph-bold ph-calendar-plus"></i> {student.fechaIngreso || '2026-02-02'}
              </span>
            </div>
            <div className="audit-info-item">
              <span className="info-label">Modalidad de Matrícula</span>
              <span className="info-val">
                <i className="ph-bold ph-identification-card"></i> {student.tipoIngreso || 'Matrícula Regular'}
              </span>
            </div>
            <div className="audit-info-item">
              <span className="info-label">Promedio Anual SIEE</span>
              <span className={`info-val-prom ${auditHistory.overallAnnualAverage >= 3.0 ? 'prom-pass' : 'prom-fail'}`}>
                {auditHistory.overallAnnualAverage.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Banner de Estado Retirado / Auditoría */}
          {isRetired ? (
            <div className="audit-alert-retired">
              <div className="retired-alert-icon">
                <i className="ph-bold ph-shield-check"></i>
              </div>
              <div className="retired-alert-content">
                <strong>Registro Inhabilitado por Novedad Institucional (Fase 5):</strong>
                <p>
                  <strong>Motivo de Retiro:</strong> {student.motivoRetiro || 'Retiro / Traslado escolar'}
                  <br />
                  <strong>Fecha de Retiro:</strong> {student.fechaRetiro || '2026-04-15'} • <strong>Auditoría:</strong> Sus notas previas se conservan. Las evaluaciones no presentadas o periodos futuros se computan con <strong>1.0 por defecto</strong> para el consolidado anual. Su registro no cuenta en el tiraje $N+1$.
                </p>
              </div>
            </div>
          ) : (
            <div className="audit-alert-active">
              <div className="active-alert-icon">
                <i className="ph-bold ph-check-circle"></i>
              </div>
              <div className="active-alert-content">
                <strong>Estudiante en Estado Activo:</strong>
                <p>
                  Participa regularmente en las actividades del grado y está contabilizado en la fórmula de impresión de copias institucionales ($N+1$).
                </p>
              </div>
            </div>
          )}

          {/* Tabla de Calificaciones y Consolidado SIEE */}
          <div className="audit-table-section">
            <div className="audit-table-header">
              <h4>Consolidado Histórico de Calificaciones (4 Periodos Lectivos)</h4>
              <span className="table-header-sub">Ponderación oficial: 25% por periodo lectivo</span>
            </div>

            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Asignatura</th>
                    <th>Docente Titular</th>
                    <th style={{ textAlign: 'center' }}>1° Periodo (25%)</th>
                    <th style={{ textAlign: 'center' }}>2° Periodo (25%)</th>
                    <th style={{ textAlign: 'center' }}>3° Periodo (25%)</th>
                    <th style={{ textAlign: 'center' }}>4° Periodo (25%)</th>
                    <th style={{ textAlign: 'center' }}>Definitiva Anual</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.rows.map((row) => (
                    <tr key={row.subject}>
                      <td className="td-subj-name">
                        <strong>{row.subject}</strong>
                      </td>
                      <td className="td-subj-teacher">{row.teacher}</td>
                      {row.periodScores.map((ps, pIdx) => (
                        <td key={pIdx} style={{ textAlign: 'center' }}>
                          <span 
                            className={`period-score-badge ${ps.score >= 3.0 ? 'score-high' : 'score-low'} ${ps.isDefaulted ? 'score-defaulted' : ''}`}
                            title={ps.isDefaulted ? 'Evaluación no presentada por retiro: 1.0 por defecto' : (ps.isPreserved ? 'Nota previa preservada para auditoría' : 'Calificación')}
                          >
                            {ps.score.toFixed(1)}
                            {ps.isDefaulted && <span className="defaulted-dot" title="1.0 por defecto">*</span>}
                          </span>
                        </td>
                      ))}
                      <td style={{ textAlign: 'center' }}>
                        <strong className={`annual-score-badge ${row.definitiveAnnual >= 3.0 ? 'annual-pass' : 'annual-fail'}`}>
                          {row.definitiveAnnual.toFixed(2)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {row.passed ? (
                          <span className="status-pill pass-pill">Aprobada</span>
                        ) : (
                          <span className="status-pill fail-pill">Reprobada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isRetired && (
              <p className="table-caption-note">
                <i className="ph-bold ph-info"></i> Los valores marcados con asterisco (*) corresponden a evaluaciones o periodos no presentados tras el retiro, registrados con <strong>1.0 por defecto</strong> según la directiva ministerial SIEE.
              </p>
            )}
          </div>
        </div>

        {/* Acciones del Expediente */}
        <div className="audit-modal-footer">
          <div className="footer-left">
            <span className="footer-rule-text">
              <i className="ph-bold ph-shield-check"></i> Histórico blindado: Prohibida la eliminación física del registro.
            </span>
          </div>
          <div className="footer-right">
            {canManage && (
              <>
                {isRetired ? (
                  <button
                    type="button"
                    className="btn-audit-reactivate"
                    onClick={() => {
                      onReactivateStudent(student);
                      onClose();
                    }}
                  >
                    <i className="ph-bold ph-arrows-clockwise"></i> Reactivar Estudiante
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-audit-retire"
                    onClick={() => {
                      onClose();
                      onOpenRetireModal(student);
                    }}
                  >
                    <i className="ph-bold ph-user-minus"></i> Inhabilitar / Marcar Retirado
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              className="btn-audit-close"
              onClick={onClose}
            >
              Cerrar Expediente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
