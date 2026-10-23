/**
 * Generador Dinámico de Plantilla Base Institucional (.docx / OpenXML)
 * Gimnasio Martín Galeano - Básica Primaria
 */

import JSZip from 'jszip';

export async function generateDecretoWordTemplate({
  pilarTitulo = 'PEI (Proyecto Educativo Institucional)',
  areaLabel = 'Matemáticas',
  docenteName = 'Docente Titular',
  anoLectivo = '2026'
}) {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  const escapeXml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // word/document.xml con membrete institucional y estructura Decreto 1075
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>GIMNASIO MARTÍN GALEANO</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
          <w:color w:val="475569"/>
        </w:rPr>
        <w:t>Educación Básica Primaria Formal · Aprobación SED · Decreto 1075 de 2015</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="0F766E"/>
        </w:rPr>
        <w:t>PLANTILLA INSTITUCIONAL: ${escapeXml(pilarTitulo.toUpperCase())}</w:t>
      </w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>ÁREA / COMPONENTE: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="22"/></w:rPr>
        <w:t>${escapeXml(areaLabel)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>DOCENTE RESPONSABLE: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="22"/></w:rPr>
        <w:t>${escapeXml(docenteName)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>AÑO LECTIVO: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="22"/></w:rPr>
        <w:t>${escapeXml(anoLectivo)}</w:t>
      </w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="1E3A8A"/>
        </w:rPr>
        <w:t>1. JUSTIFICACIÓN Y DIAGNÓSTICO PEDAGÓGICO</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:sz w:val="22"/></w:rPr>
        <w:t>[Escriba aquí la descripción diagnóstica del área o capítulo según los lineamientos curriculares y estándares básicos de competencias del MEN...]</w:t>
      </w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="1E3A8A"/>
        </w:rPr>
        <w:t>2. OBJETIVOS DE APRENDIZAJE Y COMPETENCIAS</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:sz w:val="22"/></w:rPr>
        <w:t>[Detalle los DBA (Derechos Básicos de Aprendizaje), competencias ciudadanas y propósitos institucionales...]</w:t>
      </w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="1E3A8A"/>
        </w:rPr>
        <w:t>3. MALLA Y ESTRUCTURA TEMÁTICA</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:sz w:val="22"/></w:rPr>
        <w:t>[Ingrese los contenidos desagregados por periodos académicos del 1° al 4° periodo...]</w:t>
      </w:r>
    </w:p>
    <w:p/>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="1E3A8A"/>
        </w:rPr>
        <w:t>4. CRITERIOS DE EVALUACIÓN (SIEE) Y AJUSTES RAZONABLES (PIAR)</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:sz w:val="22"/></w:rPr>
        <w:t>[Criterios de evaluación formativa, rúbricas y estrategias de flexibilización curricular para inclusión...]</w:t>
      </w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

  return blob;
}

export async function downloadDecretoWordTemplate(options) {
  const blob = await generateDecretoWordTemplate(options);
  const cleanPilar = (options.pilarTitulo || 'PEI').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
  const cleanArea = (options.areaLabel || 'MATEMATICAS').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `PLANTILLA_${cleanPilar}_${cleanArea}_2026.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
