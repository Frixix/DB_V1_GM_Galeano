/**
 * Generador e Impresor de Actas Oficiales en PDF / Formato SED
 * Gimnasio Martín Galeano - Básica Primaria
 */

export function printOfficialDocumentPDF(record) {
  if (!record) return;

  const isStudent = ['observador', 'citaciones', 'piar'].includes(record.route) || Boolean(record.studentName);

  const routeTitleMap = {
    observador: 'Observador del Estudiante',
    citaciones: 'Acta de Citación & Compromiso con Acudiente',
    piar: 'Plan Individual de Ajustes Razonables (PIAR)',
    comite_convivencia: 'Acta del Comité de Convivencia Escolar',
    comision_evaluacion: 'Acta de la Comisión de Evaluación y Promoción',
    consejo_academico: 'Acta de Sesión del Consejo Académico',
    reuniones_docentes: 'Acta de Reunión de Docentes & Jornada Pedagógica'
  };

  const routeTitle = (routeTitleMap[record.route] || 'Acta Oficial').toUpperCase();

  const teacherSig = record.signatures?.teacher;
  const secondPartySig = record.signatures?.secondParty;

  const teacherRole = isStudent ? 'Docente / Director(a) de Grupo' : 'Presidencia del Comité / Rectoría';
  const secondPartyRole = isStudent ? 'Acudiente / Estudiante' : 'Secretaría de Comité / Representante';
  const secondPartyName = isStudent ? (record.guardianName || record.studentName || 'Acudiente') : 'Secretaría de Comité';

  const formatParagraphs = (text) => {
    if (!text) return '<p><em>Sin registro detallado.</em></p>';
    return text
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p style="margin: 0 0 8px 0; text-align: justify; line-height: 1.55;">${escapeHtml(p)}</p>`)
      .join('');
  };

  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const teacherSignatureHtml = teacherSig?.signatureImg
    ? `<img src="${teacherSig.signatureImg}" alt="Firma Docente" style="max-height: 52px; max-width: 180px; display: block; margin: 0 auto 6px auto; object-fit: contain;" />`
    : teacherSig?.signedAt
    ? `<div style="padding: 4px 0; color: #0f766e; font-family: monospace; font-size: 8pt; font-weight: bold; text-align: center;">
         [FIRMA DIGITAL CERTIFICADA]<br/>
         <span style="font-size: 7.5pt; color: #555;">${escapeHtml(teacherSig.signedAt)}</span>
       </div>`
    : `<div style="height: 48px;"></div>`;

  const secondPartySignatureHtml = secondPartySig?.signatureImg
    ? `<img src="${secondPartySig.signatureImg}" alt="Firma Contraparte" style="max-height: 52px; max-width: 180px; display: block; margin: 0 auto 6px auto; object-fit: contain;" />`
    : secondPartySig?.signedAt
    ? `<div style="padding: 4px 0; color: #0f766e; font-family: monospace; font-size: 8pt; font-weight: bold; text-align: center;">
         [FIRMA DIGITAL CERTIFICADA]<br/>
         <span style="font-size: 7.5pt; color: #555;">${escapeHtml(secondPartySig.signedAt)}</span>
       </div>`
    : `<div style="height: 48px;"></div>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Acta Oficial - ${escapeHtml(record.id)} - Gimnasio Martín Galeano</title>
  <style>
    @page {
      size: letter portrait;
      margin: 15mm 18mm 18mm 18mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      color: #1e293b;
      line-height: 1.5;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-box {
      border-bottom: 2.5px solid #0f766e;
      padding-bottom: 12px;
      margin-bottom: 16px;
      text-align: center;
    }
    .inst-name {
      font-size: 14pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0 0 2px 0;
    }
    .inst-sub {
      font-size: 8.5pt;
      color: #475569;
      margin: 1px 0;
    }
    .acta-title {
      margin-top: 8px;
      font-size: 11pt;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: 0.5px;
    }
    .table-meta {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 9pt;
    }
    .table-meta th, .table-meta td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
    }
    .table-meta th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      width: 20%;
      text-align: left;
    }
    .table-meta td {
      background-color: #ffffff;
      color: #0f172a;
      width: 30%;
    }
    .section-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 0 0 8px 0;
    }
    .agreements-box {
      background-color: #f0fdfa;
      border: 1px solid #99f6e4;
    }
    .agreements-box .section-title {
      color: #0d9488;
      border-bottom: 1px solid #99f6e4;
    }
    .signatures-grid {
      display: table;
      width: 100%;
      margin-top: 28px;
      page-break-inside: avoid;
    }
    .signature-col {
      display: table-cell;
      width: 48%;
      vertical-align: top;
      text-align: center;
      padding: 0 10px;
    }
    .sig-line {
      border-top: 1.5px solid #0f172a;
      margin: 4px auto 6px auto;
      width: 85%;
    }
    .sig-name {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0f172a;
      display: block;
    }
    .sig-role {
      font-size: 8pt;
      color: #64748b;
      display: block;
    }
    .footer-stamp {
      margin-top: 22px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 6px;
      font-size: 7.5pt;
      color: #94a3b8;
      text-align: center;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="inst-name">GIMNASIO MARTÍN GALEANO</div>
    <div class="inst-sub">Educación Básica Primaria Formal · Aprobación Oficial SED · Código DANE Institucional</div>
    <div class="inst-sub">Sistema de Gestión Convivencial, Citaciones & Actas Oficiales de Comités</div>
    <div class="acta-title">${routeTitle} — RADICADO: ${escapeHtml(record.id)}</div>
  </div>

  <table class="table-meta">
    <tr>
      <th>Radicado N°:</th>
      <td><strong>${escapeHtml(record.id)}</strong></td>
      <th>Fecha de Expedición:</th>
      <td>${escapeHtml(record.date)}</td>
    </tr>
    <tr>
      <th>Periodo Académico:</th>
      <td>${escapeHtml(record.period || 'General')}</td>
      <th>Grado / Nivel:</th>
      <td>${escapeHtml(record.grade || 'Primaria')}</td>
    </tr>
    <tr>
      <th>Docente Responsable:</th>
      <td>${escapeHtml(record.teacher)}</td>
      <th>Estado Oficial:</th>
      <td><strong>${escapeHtml(record.status || 'Registrado')}</strong></td>
    </tr>
    ${isStudent ? `
    <tr>
      <th>Estudiante:</th>
      <td><strong>${escapeHtml(record.studentName || 'N/A')}</strong> ${record.studentId ? `(${escapeHtml(record.studentId)})` : ''}</td>
      <th>Acudiente / Contacto:</th>
      <td>${escapeHtml(record.guardianName || 'Acudiente Titular')} ${record.guardianPhone ? `· Tel: ${escapeHtml(record.guardianPhone)}` : ''}</td>
    </tr>
    ` : `
    <tr>
      <th>Sesión / Convocatoria:</th>
      <td>${escapeHtml(record.sessionType || 'Ordinaria')}</td>
      <th>Miembros Asistentes:</th>
      <td>${escapeHtml(record.attendees || 'Cuerpo Docente y Directivo')}</td>
    </tr>
    `}
  </table>

  <div class="section-box">
    <div class="section-title">Asunto / Título Oficial de la Diligencia</div>
    <p style="margin: 0; font-weight: bold; color: #0f172a;">${escapeHtml(record.title)}</p>
  </div>

  <div class="section-box">
    <div class="section-title">${isStudent ? 'Descripción de los Hechos & Situación Observada' : 'Orden del Día & Deliberación del Comité'}</div>
    ${formatParagraphs(record.description)}
  </div>

  <div class="section-box agreements-box">
    <div class="section-title">${isStudent ? 'Compromisos Convivenciales / Pedagógicos Concertados' : 'Acuerdos, Decisiones & Tareas Aprobadas'}</div>
    ${formatParagraphs(record.agreements)}
    ${record.followUpDate ? `
      <p style="margin-top: 10px; font-size: 8.5pt; color: #0f766e; font-weight: bold;">
        📅 Fecha Límite para Seguimiento / Verificación de Cumplimiento: ${escapeHtml(record.followUpDate)}
      </p>
    ` : ''}
  </div>

  ${record.resolutionNotes ? `
  <div class="section-box" style="background-color: #f0fdf4; border-color: #86efac;">
    <div class="section-title" style="color: #15803d; border-color: #86efac;">Cierre Formal & Resolución del Caso</div>
    ${formatParagraphs(record.resolutionNotes)}
    <p style="margin-top: 8px; font-size: 8pt; color: #166534;">
      Verificado y resuelto por: <strong>${escapeHtml(record.resolvedBy || record.teacher)}</strong> ${record.resolvedAt ? `el ${escapeHtml(record.resolvedAt)}` : ''}
    </p>
  </div>
  ` : ''}

  ${record.notes ? `
  <div class="section-box">
    <div class="section-title">Observaciones Institucionales Adicionales</div>
    ${formatParagraphs(record.notes)}
  </div>
  ` : ''}

  <!-- APARTADO PARA FIRMAR Y CONSENTIMIENTO DE LAS PARTES -->
  <div class="signatures-grid">
    <div class="signature-col">
      ${teacherSignatureHtml}
      <div class="sig-line"></div>
      <span class="sig-name">${escapeHtml(record.teacher)}</span>
      <span class="sig-role">${teacherRole}</span>
      <span class="sig-role">Gimnasio Martín Galeano</span>
    </div>

    <div class="signature-col">
      ${secondPartySignatureHtml}
      <div class="sig-line"></div>
      <span class="sig-name">${escapeHtml(secondPartyName)}</span>
      <span class="sig-role">${secondPartyRole}</span>
      <span class="sig-role">Firma de Conformidad & Notificación</span>
    </div>
  </div>

  <div class="footer-stamp">
    Documento Oficial expedido por el Sistema Institucional de Convivencia y Actas del Gimnasio Martín Galeano.<br/>
    Válido para efectos de archivo institucional, seguimiento convivencial y acreditación ante la Secretaría de Educación (SED / MEN).
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 300);
    });
  </script>
</body>
</html>`;

  // Abrir ventana emergente optimizada para impresión a PDF o crear iframe
  const printWindow = window.open('', '_blank', 'width=900,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // Fallback: usar iframe si la ventana emergente fue bloqueada por el navegador
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 500);
  }
}
