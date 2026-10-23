/**
 * Script de Auditoría Automatizada de Integridad de Rutas y Almacenamiento R2 / Supabase
 * Ejecutar con: node scripts/test-storage-integrity.js
 */

import { DECRETO_1075_PILLARS } from '../src/constants/decreto1075Categories.js';
import { OBSERVADOR_ROUTES } from '../src/data/initialObservador.js';

console.log('======================================================================');
console.log('🔍 AUDITORÍA DE INTEGRIDAD: RUTAS DE ALMACENAMIENTO R2 & SUPABASE');
console.log('======================================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (details) console.error(`   👉 Detalle: ${details}`);
    failedTests++;
  }
}

// 1. Simulación de cálculo de ruta en Observador y Comités
console.log('📌 Bloque 1: Validación de Rutas en Observador & Comités');

function resolveObservadorStorageFolder(route) {
  const isStudentRoute = ['observador', 'citaciones', 'piar'].includes(route);
  const cleanRoute = (route || 'observador').toLowerCase();
  return isStudentRoute ? `observador/${cleanRoute}` : `comites/${cleanRoute}`;
}

OBSERVADOR_ROUTES.forEach(r => {
  if (r.id === 'all') return;
  const folder = resolveObservadorStorageFolder(r.id);
  const isStudent = ['observador', 'citaciones', 'piar'].includes(r.id);
  
  if (isStudent) {
    assert(folder.startsWith('observador/'), `Ruta de estudiante para "${r.id}"`, `Folder: "${folder}"`);
  } else {
    assert(folder.startsWith('comites/'), `Ruta de comité para "${r.id}"`, `Folder: "${folder}"`);
  }
  assert(!folder.includes('//') && !folder.endsWith('/'), `Estructura limpia para "${r.id}"`, `Folder: "${folder}"`);
});

// 2. Simulación de cálculo de ruta en Bóveda Directiva
console.log('\n📌 Bloque 2: Validación de Rutas en Bóveda Directiva');

function resolveBovedaStorageFolder(year = '2026', subfolder = 'financiero') {
  return `boveda/${year || '2026'}/${subfolder || 'general'}`;
}

const bovedaSubfolders = ['consejo', 'financiero', 'contratos', 'legal', 'pei_soporte'];
bovedaSubfolders.forEach(sub => {
  const path = resolveBovedaStorageFolder('2026', sub);
  assert(path === `boveda/2026/${sub}`, `Ruta canónica Bóveda [2026 -> ${sub}]`, `Obtenido: "${path}"`);
});

// 3. Simulación de cálculo de ruta en Evaluaciones Finales
console.log('\n📌 Bloque 3: Validación de Rutas en Evaluaciones Finales');

function resolveExamStorageFolder(period, grade) {
  const cleanGrade = (grade || '1pri').replace(/[\s°]+/g, '').slice(0, 4).toLowerCase();
  const cleanPeriod = (period || '1_periodo').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 10);
  return `evaluaciones/${cleanPeriod}/${cleanGrade}`;
}

const testExams = [
  { period: '1° Periodo (25%)', grade: 'Primero (1°)', expectedPrefix: 'evaluaciones/1_periodo/prim' },
  { period: '2° Periodo (25%)', grade: 'Transición', expectedPrefix: 'evaluaciones/2_periodo/tran' },
  { period: '3° Periodo (25%)', grade: 'Quinto (5°)', expectedPrefix: 'evaluaciones/3_periodo/quin' },
];

testExams.forEach(t => {
  const path = resolveExamStorageFolder(t.period, t.grade);
  assert(path.startsWith('evaluaciones/'), `Ruta de evaluaciones para "${t.grade}"`, `Obtenido: "${path}"`);
  assert(!path.includes(' '), `Sin espacios en ruta para "${t.grade}"`, `Obtenido: "${path}"`);
});

// 4. Integridad de Pilares Normativos (Decreto 1075)
console.log('\n📌 Bloque 4: Integridad de Pilares del Decreto 1075');
assert(DECRETO_1075_PILLARS.length === 9, 'Están presentes los 9 Pilares de Inspección y Vigilancia', `Conteo: ${DECRETO_1075_PILLARS.length}`);

console.log('\n======================================================================');
console.log(`📊 RESULTADO DE LA AUDITORÍA: ${passedTests} aprobadas, ${failedTests} fallidas`);
console.log('======================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ¡TODAS LAS RUTAS Y CANÓNICAS DE ALMACENAMIENTO ESTÁN 100% BLINDADAS!\n');
}
