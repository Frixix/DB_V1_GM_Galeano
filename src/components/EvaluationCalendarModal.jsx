import { useState } from 'react';
import gradesService from '../services/gradesService';
import { GRADES_LIST, ALL_SUBJECTS, subjectHasFinalExam } from '../data/gradesTreeData';
import { USERS } from '../data/users';
import './EvaluationCalendarModal.css';

/**
 * MODAL DE CONTROL DE FECHAS, CIERRES SIEE Y PRÓRROGAS EXTEMPORÁNEAS
 * Exclusivo para Coordinación Académica y Administrador General
 */
export default function EvaluationCalendarModal({ isOpen, onClose, currentUser, onCalendarUpdated }) {
  const [activeTab, setActiveTab] = useState('periods'); // 'periods' | 'extensions'
  const [calendar, setCalendar] = useState(() => gradesService.getEvaluationCalendar());
  const [extensions, setExtensions] = useState(() => gradesService.getExtemporaryExtensions());

  // Formulario de prórroga
  const [targetPeriod, setTargetPeriod] = useState('1° Periodo (25%)');
  const [targetGrade, setTargetGrade] = useState('1° Primaria');
  const [targetSubject, setTargetSubject] = useState(ALL_SUBJECTS[0] || 'Lengua Castellana');
  const [targetTeacher, setTargetTeacher] = useState('jessica');
  const [hours, setHours] = useState('48');
  const [reason, setReason] = useState('Incapacidad médica justificada');
  const [statusMsg, setStatusMsg] = useState(null);

  if (!isOpen) return null;

  const handleUpdatePeriod = (period, closureDate, status) => {
    try {
      gradesService.updateEvaluationPeriod(period, { closureDate, status }, currentUser);
      setCalendar({ ...gradesService.getEvaluationCalendar() });
      setStatusMsg(`Periodo ${period} actualizado exitosamente.`);
      setTimeout(() => setStatusMsg(null), 3000);
      if (onCalendarUpdated) onCalendarUpdated();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleGrantExtension = (e) => {
    e.preventDefault();
    try {
      gradesService.grantExtemporaryExtension({
        period: targetPeriod,
        grade: targetGrade,
        subject: targetSubject,
        teacherKey: targetTeacher,
        hours: Number(hours),
        reason,
        grantedBy: currentUser
      });
      setExtensions([...gradesService.getExtemporaryExtensions()]);
      setStatusMsg(`✓ Prórroga de ${hours} horas habilitada para ${targetGrade} - ${targetSubject}.`);
      setTimeout(() => setStatusMsg(null), 3500);
      if (onCalendarUpdated) onCalendarUpdated();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRevokeExtension = (id) => {
    if (!window.confirm('¿Desea revocar esta prórroga extemporánea inmediatamente?')) return;
    try {
      gradesService.revokeExtemporaryExtension(id, currentUser);
      setExtensions([...gradesService.getExtemporaryExtensions()]);
      setStatusMsg('Prórroga revocada correctamente.');
      setTimeout(() => setStatusMsg(null), 3000);
      if (onCalendarUpdated) onCalendarUpdated();
    } catch (e) {
      alert(e.message);
    }
  };

  const teachers = Object.entries(USERS)
    .filter(([, u]) => u.role === 'docente')
    .map(([key, u]) => ({ key, name: u.name }));

  return (
    <div className="eval-calendar-modal-overlay" onClick={onClose}>
      <div className="eval-calendar-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="eval-calendar-modal-header">
          <div className="eval-header-title-row">
            <div className="eval-header-icon">
              <i className="ph-bold ph-calendar-check"></i>
            </div>
            <div>
              <h3>Control Académico: Fechas, Cierres & Prórrogas</h3>
              <p>Gestión del calendario SIEE y habilitación formal de prórrogas extemporáneas</p>
            </div>
          </div>
          <button 
            type="button" 
            className="eval-modal-close-btn" 
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Body */}
        <div className="eval-calendar-modal-body">
          {statusMsg && (
            <div style={{
              padding: '0.65rem 1rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #6ee7b7',
              color: '#065f46',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              {statusMsg}
            </div>
          )}

          {/* Selector de Pestañas */}
          <div className="eval-modal-tabs">
            <button
              type="button"
              className={`eval-tab-btn ${activeTab === 'periods' ? 'active' : ''}`}
              onClick={() => setActiveTab('periods')}
            >
              <i className="ph-bold ph-calendar"></i>
              <span>Calendario de Periodos SIEE</span>
            </button>
            <button
              type="button"
              className={`eval-tab-btn ${activeTab === 'extensions' ? 'active' : ''}`}
              onClick={() => setActiveTab('extensions')}
            >
              <i className="ph-bold ph-clock-countdown"></i>
              <span>Prórrogas Extemporáneas ({extensions.filter(e => e.status === 'activa').length})</span>
            </button>
          </div>

          {/* Pestaña 1: Calendario de Periodos */}
          {activeTab === 'periods' && (
            <div>
              <table className="eval-periods-table">
                <thead>
                  <tr>
                    <th>Periodo Lectivo</th>
                    <th>Fecha Inicio</th>
                    <th>Cierre Ordinario</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(calendar).map(([pName, pData]) => (
                    <tr key={pName}>
                      <td><strong>{pName}</strong></td>
                      <td>{pData.startDate || '—'}</td>
                      <td>
                        <input 
                          type="date" 
                          defaultValue={pData.closureDate}
                          onBlur={(e) => handleUpdatePeriod(pName, e.target.value, pData.status)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.8rem'
                          }}
                        />
                      </td>
                      <td>
                        <span className={`status-pill status-${pData.status || 'abierto'}`}>
                          {pData.status || 'abierto'}
                        </span>
                      </td>
                      <td>
                        <select 
                          value={pData.status || 'abierto'}
                          onChange={(e) => handleUpdatePeriod(pName, pData.closureDate, e.target.value)}
                          style={{
                            padding: '0.25rem 0.45rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.8rem'
                          }}
                        >
                          <option value="abierto">Abierto</option>
                          <option value="cerrado">Cerrado</option>
                          <option value="programado">Programado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pestaña 2: Prórrogas Extemporáneas */}
          {activeTab === 'extensions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="extension-form-box">
                <h4>
                  <i className="ph-bold ph-plus-circle" style={{ color: '#4f46e5' }}></i>
                  Habilitar Nueva Prórroga Extemporánea
                </h4>
                <form onSubmit={handleGrantExtension} className="extension-grid-form">
                  <div className="form-field-group">
                    <label>Periodo:</label>
                    <select value={targetPeriod} onChange={(e) => setTargetPeriod(e.target.value)}>
                      {Object.keys(calendar).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field-group">
                    <label>Grado:</label>
                    <select value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)}>
                      {GRADES_LIST.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                    <div className="form-field-group">
                      <label>Asignatura:</label>
                      <select value={targetSubject} onChange={(e) => setTargetSubject(e.target.value)}>
                        {ALL_SUBJECTS.map(s => (
                          <option key={s} value={s}>
                            {s} {!subjectHasFinalExam(s) ? '• 20% Formativo' : '• Examen Final'}
                          </option>
                        ))}
                      </select>
                    </div>

                  <div className="form-field-group">
                    <label>Docente:</label>
                    <select value={targetTeacher} onChange={(e) => setTargetTeacher(e.target.value)}>
                      {teachers.map(t => (
                        <option key={t.key} value={t.key}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field-group">
                    <label>Tiempo de Habilitación:</label>
                    <select value={hours} onChange={(e) => setHours(e.target.value)}>
                      <option value="24">24 Horas</option>
                      <option value="48">48 Horas (2 Días)</option>
                      <option value="72">72 Horas (3 Días)</option>
                      <option value="120">5 Días Hábiles</option>
                    </select>
                  </div>

                  <div className="form-field-group" style={{ gridColumn: 'span 2' }}>
                    <label>Motivo Institucional:</label>
                    <input 
                      type="text" 
                      value={reason} 
                      onChange={(e) => setReason(e.target.value)} 
                      placeholder="Ej: Incapacidad médica validada / Calamidad doméstica"
                      required
                    />
                  </div>

                  <button type="submit" className="btn-grant-extension">
                    <i className="ph-bold ph-shield-check"></i>
                    <span>Autorizar Prórroga Extemporánea</span>
                  </button>
                </form>
              </div>

              {/* Historial */}
              <div>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '0.85rem' }}>
                  Prórrogas Habilitadas e Histórico
                </h5>
                {extensions.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No se han registrado prórrogas extemporáneas activas.</p>
                ) : (
                  <table className="extensions-history-table">
                    <thead>
                      <tr>
                        <th>Grado & Asignatura</th>
                        <th>Periodo</th>
                        <th>Vence</th>
                        <th>Motivo</th>
                        <th>Autorizado Por</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extensions.map(ext => (
                        <tr key={ext.id}>
                          <td><strong>{ext.grade}</strong> — {ext.subject}</td>
                          <td>{ext.period}</td>
                          <td>{new Date(ext.expiresAt).toLocaleDateString('es-CO')}</td>
                          <td>{ext.reason}</td>
                          <td>{ext.grantedByName}</td>
                          <td>
                            <span className={`status-pill status-${ext.status === 'activa' ? 'abierto' : 'cerrado'}`}>
                              {ext.status}
                            </span>
                          </td>
                          <td>
                            {ext.status === 'activa' && (
                              <button 
                                type="button" 
                                className="btn-revoke-ext"
                                onClick={() => handleRevokeExtension(ext.id)}
                              >
                                Revocar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="eval-calendar-modal-footer">
          <button type="button" className="btn-close-calendar" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
