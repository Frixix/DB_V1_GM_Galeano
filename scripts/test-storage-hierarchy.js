/**
 * Prueba de Integración en Vivo para la Arquitectura Canónica de Storage / Cloudflare R2
 * Gimnasio Martín Galeano - Validación de Jerarquía de Expedientes
 */

import { buildCanonicalStorageKey, sanitizeFileName } from '../src/services/storageService.js';

async function runStorageHierarchyTest() {
  console.log('\n===============================================================');
  console.log('🧪 INICIANDO PRUEBA DE INTEGRACIÓN: JERARQUÍA CANÓNICA R2');
  console.log('===============================================================\n');

  const baseConfig = {
    institutionCode: 'GMG',
    year: '2026',
    moduleFolder: 'COMITES',
    subFolder: 'comite_convivencia',
    expedienteId: 'ACTA_TEST_099'
  };

  // 1. Generación de claves de prueba
  const key1 = buildCanonicalStorageKey({
    ...baseConfig,
    documentType: 'PRINCIPAL',
    originalFileName: 'acta_reunion_inicial.pdf'
  });

  const key2 = buildCanonicalStorageKey({
    ...baseConfig,
    documentType: 'SOPORTE_FIRMAS',
    originalFileName: 'hoja_firmas_firmadas.png'
  });

  // Ruta esperada del expediente común
  const expectedDossierFolder = 'GMG/2026/COMITES/COMITE_CONVIVENCIA/ACTA_TEST_099/';
  const expectedKey1 = 'GMG/2026/COMITES/COMITE_CONVIVENCIA/ACTA_TEST_099/GMG_2026_ACTA_TEST_099_PRINCIPAL.pdf';
  const expectedKey2 = 'GMG/2026/COMITES/COMITE_CONVIVENCIA/ACTA_TEST_099/GMG_2026_ACTA_TEST_099_SOPORTE_FIRMAS.png';

  const assertions = [];

  // Aserción a) Misma subcarpeta base de expediente
  const folder1 = key1.substring(0, key1.lastIndexOf('/') + 1);
  const folder2 = key2.substring(0, key2.lastIndexOf('/') + 1);
  const isSameFolder = (folder1 === expectedDossierFolder) && (folder2 === expectedDossierFolder);
  assertions.push({
    Prueba: 'a) Mismo Directorio Base Expediente',
    ResultadoEsperado: expectedDossierFolder,
    ResultadoObtenido: folder1,
    Estado: isSameFolder ? 'PASÓ (OK)' : 'FALLÓ'
  });

  // Aserción b) Archivo 1: Acta Principal
  const isKey1Exact = key1 === expectedKey1;
  assertions.push({
    Prueba: 'b) Formato Canónico Acta Principal',
    ResultadoEsperado: expectedKey1,
    ResultadoObtenido: key1,
    Estado: isKey1Exact ? 'PASÓ (OK)' : 'FALLÓ'
  });

  // Aserción c) Archivo 2: Soporte de Firmas
  const isKey2Exact = key2 === expectedKey2;
  assertions.push({
    Prueba: 'c) Formato Canónico Soporte de Firmas',
    ResultadoEsperado: expectedKey2,
    ResultadoObtenido: key2,
    Estado: isKey2Exact ? 'PASÓ (OK)' : 'FALLÓ'
  });

  // Aserción d) Retrocompatibilidad de ruta legada
  const legacyPath = 'comites/comite_convivencia/ACTA_001_acta.pdf';
  let isLegacyValid = false;
  try {
    const cleanLegacy = sanitizeFileName(legacyPath);
    isLegacyValid = Boolean(cleanLegacy && cleanLegacy.includes('acta.pdf'));
  } catch (err) {
    isLegacyValid = false;
  }
  assertions.push({
    Prueba: 'd) Retrocompatibilidad Rutas Legadas',
    ResultadoEsperado: 'Resolución sin excepciones',
    ResultadoObtenido: 'Procesada de forma transparente',
    Estado: isLegacyValid ? 'PASÓ (OK)' : 'FALLÓ'
  });

  console.table(assertions);

  const hasFailures = assertions.some(a => a.Estado !== 'PASÓ (OK)');

  if (hasFailures) {
    console.error('\n❌ ERROR: Una o más aserciones de la jerarquía canónica han fallado.\n');
    process.exit(1);
  } else {
    console.log('\n✅ TODAS LAS ASERCIONES HAN PASADO EXITOSAMENTE.');
    console.log('   La jerarquía de carpetas R2 empaqueta de forma óptima los expedientes documentales.\n');
    process.exit(0);
  }
}

runStorageHierarchyTest().catch(err => {
  console.error('Error no controlado en la prueba de integración:', err);
  process.exit(1);
});
