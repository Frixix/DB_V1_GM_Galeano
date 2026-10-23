/**
 * Compilador de Expedientes Oficiales en PDF / Formato SED
 * Genera el documento maestro institucional compilado para Rectoría
 */

export function printCompiledExpedientePDF({
  pillarMeta,
  submissions,
  currentUser,
  anoLectivo = '2026'
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const totalRequired = submissions.length;
  const totalDelivered = submissions.filter((s) => s.delivered).length;
  const percentComplete = totalRequired > 0 ? Math.round((totalDelivered / totalRequired) * 100) : 100;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Expediente Compilado Oficial - ${escapeHtml(pillarMeta.titulo)}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 15mm 18mm 18mm 18mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      color: #0f172a;
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
      font-size: 15pt;
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
    .expediente-badge {
      display: inline-block;
      margin-top: 8px;
      background-color: #0f766e;
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 9pt;
    }
    .meta-table th, .meta-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
    }
    .meta-table th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      width: 25%;
    }
    .section-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 800;
      color: #0f766e;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 0 0 8px 0;
    }
    .areas-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-top: 6px;
    }
    .areas-table th, .areas-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      text-align: left;
    }
    .areas-table th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 700;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 700;
    }
    .status-ok {
      background-color: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .status-pending {
      background-color: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .signatures-grid {
      display: table;
      width: 100%;
      margin-top: 35px;
      page-break-inside: avoid;
    }
    .signature-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      text-align: center;
      padding: 0 15px;
    }
    .sig-line {
      border-top: 1.5px solid #0f172a;
      margin: 35px auto 6px auto;
      width: 80%;
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
      margin-top: 25px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 6px;
      font-size: 7.5pt;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="inst-name">GIMNASIO MARTÍN GALEANO</div>
    <div class="inst-sub">Educación Básica Primaria Formal · Aprobación Oficial SED · Decreto 1075 de 2015</div>
    <div class="inst-sub">Custodia Documental y Consolidación Curricular e Institucional</div>
    <div class="expediente-badge">COMPILADO OFICIAL — ${escapeHtml(pillarMeta.titulo)}</div>
  </div>

  <table class="meta-table">
    <tr>
      <th>Pilar Normativo:</th>
      <td>Pilar ${pillarMeta.numero}: ${escapeHtml(pillarMeta.titulo)}</td>
      <th>Año Lectivo:</th>
      <td>${escapeHtml(anoLectivo)}</td>
    </tr>
    <tr>
      <th>Fundamento Legal:</th>
      <td>${escapeHtml(pillarMeta.articulos)}</td>
      <th>Fecha de Consolidación:</th>
      <td>${dateStr} (${timeStr})</td>
    </tr>
    <tr>
      <th>Compilado Por:</th>
      <td>${escapeHtml(currentUser?.name || 'Rectoría Institucional')}</td>
      <th>Nivel de Integración:</th>
      <td><strong>${percentComplete}% Completo</strong> (${totalDelivered}/${totalRequired} áreas entregadas)</td>
    </tr>
  </table>

  <div class="section-box">
    <div class="section-title">1. Resumen Ejecutivo & Descripción del Pilar</div>
    <p style="margin: 0; text-align: justify; font-size: 9pt;">
      El presente expediente recopila formalmente las entregas académicas, curriculares y normativas radicadas por el cuerpo docente y comités correspondientes al <strong>${escapeHtml(pillarMeta.titulo)}</strong>. Cumple con los lineamientos del Decreto 1075 de 2015 para efectos de inspección, vigilancia y acreditación ministerial.
    </p>
  </div>

  <div class="section-box">
    <div class="section-title">2. Consola de Supervisión & Entrega de Capítulos por Área</div>
    <table class="areas-table">
      <thead>
        <tr>
          <th>Área / Capítulo</th>
          <th>Prefijo Nomenclatura</th>
          <th>Estado de Radicación</th>
          <th>Docente Responsable</th>
          <th>Fecha Radicación</th>
        </tr>
      </thead>
      <tbody>
        ${submissions.map((sub) => `
          <tr>
            <td><strong>${escapeHtml(sub.label)}</strong></td>
            <td><code style="font-family: monospace; color: #0f766e;">${escapeHtml(sub.prefix)}</code></td>
            <td>
              <span class="status-badge ${sub.delivered ? 'status-ok' : 'status-pending'}">
                ${sub.delivered ? '✓ Radicado / Entregado' : '⏳ Pendiente de Entrega'}
              </span>
            </td>
            <td>${escapeHtml(sub.deliveredDoc?.teacher || 'Sin entrega')}</td>
            <td>${escapeHtml(sub.deliveredDoc?.uploadedAt || '—')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section-box">
    <div class="section-title">3. Certificación de Custodia Institucional</div>
    <p style="margin: 0; text-align: justify; font-size: 8.5pt; color: #475569;">
      La Dirección Institucional del Gimnasio Martín Galeano certifica que los documentos y evidencias anexas reposan bajo archivo blindado en la plataforma de gestión académica y en el repositorio institucional en la nube para auditoría oficial de la Secretaría de Educación Distrital y el Ministerio de Educación Nacional.
    </p>
  </div>

  <div class="signatures-grid">
    <div class="signature-col">
      <div class="sig-line"></div>
      <span class="sig-name">${escapeHtml(currentUser?.name || 'Rectoría')}</span>
      <span class="sig-role">Rectoría / Representación Legal</span>
      <span class="sig-role">Gimnasio Martín Galeano</span>
    </div>

    <div class="signature-col">
      <div class="sig-line"></div>
      <span class="sig-name">Coordinación Académica & Calidad</span>
      <span class="sig-role">Comisión de Supervisión Curricular</span>
      <span class="sig-role">Gimnasio Martín Galeano</span>
    </div>
  </div>

  <div class="footer-stamp">
    Expediente Oficial Compilado emitido bajo el Sistema Institucional de Básica Primaria del Gimnasio Martín Galeano.<br/>
    Documento con plena validez para inspección, vigilancia y soporte del Proyecto Educativo Institucional (PEI).
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

  const printWindow = window.open('', '_blank', 'width=900,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
