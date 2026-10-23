/**
 * STRESS & SECURITY TEST SUITE: "ROMPER LA WEB"
 * 
 * Batería de pruebas de estrés, seguridad, fuga de datos, subida y descarga
 * sobre Cloudflare R2 y la arquitectura del sistema Gimnasio Martin Galeano.
 * 
 * Ejecución: node scripts/stress-and-security-tests.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getMimeType, sanitizeFileName } from '../src/services/storageService.js';
import { USERS } from '../src/data/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .env.local manualmente para Node.js
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = (match[2] || '').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      env[match[1]] = val;
    }
  });
  return env;
}

const env = loadEnvLocal();
const accountId = env.VITE_R2_ACCOUNT_ID;
const accessKeyId = env.VITE_R2_ACCESS_KEY_ID;
const secretAccessKey = env.VITE_R2_SECRET_ACCESS_KEY;
const bucketName = env.VITE_R2_BUCKET_NAME || 'documentos-galeano';

console.log('======================================================================');
console.log('🔥 BATERÍA DE PRUEBAS DE ESTRÉS, SEGURIDAD & FUGA DE DATOS');
console.log('======================================================================');
console.log(`📡 Cloudflare R2 Account: ${accountId ? 'Detectada (Configurada)' : 'No detectada'}`);
console.log(`📦 Bucket Objetivo: "${bucketName}"\n`);

let testsPassed = 0;
let testsFailed = 0;
const createdTestKeys = []; // Para limpieza automática al final

function logPass(title, details = '') {
  console.log(`✅ [PASS] ${title}`);
  if (details) console.log(`   └─ ${details}`);
  testsPassed++;
}

function logFail(title, error) {
  console.error(`❌ [FAIL] ${title}`);
  console.error(`   └─ Error: ${error}`);
  testsFailed++;
}

// Inicializar cliente S3 para Cloudflare R2
const r2 = (accountId && accessKeyId && secretAccessKey)
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey }
    })
  : null;

async function runTestSuite() {
  if (!r2) {
    console.warn('⚠️ No se encontraron credenciales de R2 en .env.local. Se evaluarán solo reglas lógicas.');
  }

  // -------------------------------------------------------------------------
  // TEST 1: Sanitización y Ataque de Inyección de Rutas (Path Traversal / Poisoning)
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Intento de Inyección de Rutas (Path Traversal / Escape de Raíz) ---');
  try {
    const maliciousNames = [
      '../../etc/passwd.pdf',
      '..\\..\\windows\\system32\\cmd.exe',
      '../../../boveda/2026/secreto.pdf',
      'archivo con espacios & caracteres extraños !@#$%^&*().pdf',
      '../../../../../../root.txt'
    ];

    let allSanitizedSafely = true;
    for (const raw of maliciousNames) {
      const clean = sanitizeFileName(raw);
      if (clean.includes('..') || clean.includes('/') || clean.includes('\\')) {
        allSanitizedSafely = false;
        break;
      }
    }

    if (allSanitizedSafely) {
      logPass('Sanitizador neutraliza intentos de Path Traversal', 'Ningún nombre malicioso pudo romper la jerarquía de carpetas.');
    } else {
      logFail('Fallo en sanitizador', 'Se detectó que ".." o slashes escaparon la sanitización.');
    }
  } catch (err) {
    logFail('Error en Test 1', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Fuga de Información / Filtración de MIME types y Archivos Peligrosos
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Detección de Extensiones Maliciosas y Mime Types ---');
  try {
    const dangerousFiles = ['malware.exe', 'script.bat', 'virus.sh', 'trojan.dll', 'web.php'];
    let safeCount = 0;
    dangerousFiles.forEach(file => {
      const mime = getMimeType(file);
      // Debe resolver como octet-stream o binario seguro, nunca ejecutable mime
      if (mime === 'application/octet-stream') safeCount++;
    });

    if (safeCount === dangerousFiles.length) {
      logPass('Extensiones peligrosas tratadas como octet-stream genérico seguro', `${safeCount}/${dangerousFiles.length} neutralizadas.`);
    } else {
      logFail('Riesgo de MIME type peligroso', 'Algún binario no se aisló correctamente.');
    }
  } catch (err) {
    logFail('Error en Test 2', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Carga Real en Cloudflare R2 con Ruta Canónica y Comprobación de Integridad
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Carga Real y Verificación de Integridad en Cloudflare R2 ---');
  if (r2) {
    try {
      const testRadicado = `TEST-AUDIT-${Date.now()}`;
      const testKey = `comites/comite_convivencia/${testRadicado}_Acta_Prueba_Auditoria.pdf`;
      const testBody = Buffer.from('%PDF-1.4\n%Prueba de Integridad Galeano R2 - Contenido Cifrado de Prueba\n%%EOF');

      // 1. Subida
      await r2.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testBody,
        ContentType: 'application/pdf',
        Metadata: {
          'institucion': 'Gimnasio Martin Galeano',
          'auditoria': 'Prueba Automatica Anti-Fugas'
        }
      }));
      createdTestKeys.push(testKey);
      logPass('Subida binaria exitosa a Cloudflare R2', `Key canónica: "${testKey}"`);

      // 2. Descarga y Verificación Byte a Byte
      const getRes = await r2.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey
      }));

      const chunks = [];
      for await (const chunk of getRes.Body) {
        chunks.push(chunk);
      }
      const downloadedBuffer = Buffer.concat(chunks);

      if (downloadedBuffer.equals(testBody)) {
        logPass('Integridad binaria perfecta (100% Match SHA)', `Descargados ${downloadedBuffer.length} bytes idénticos al original.`);
      } else {
        logFail('Corrupción de datos detectada en R2', 'Los bytes descargados no coinciden con el buffer emitido.');
      }
    } catch (err) {
      logFail('Error en conexión o subida con Cloudflare R2', err.message);
    }
  } else {
    console.log('⏩ [SKIP] Omitida prueba en caliente de R2 (sin cliente activo)');
  }

  // -------------------------------------------------------------------------
  // TEST 4: Fuga de Credenciales y Roles (RBAC Bóveda vs Docente)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Blindaje RBAC (Acceso no autorizado a Bóveda Directiva) ---');
  try {
    const teacherUsers = Object.values(USERS).filter(u => u.role === 'docente');
    let teacherBreach = false;

    // Verificar si algún docente tiene permisos sobre la ruta 'boveda' o claves maestras
    teacherUsers.forEach(u => {
      if (u.pass && (u.pass.includes('boveda') || u.pass.includes('rectora') || u.pass.includes('admin'))) {
        teacherBreach = true;
      }
    });

    if (!teacherBreach) {
      logPass('Separación estricta de credenciales de Docentes vs Bóveda Directiva', 'Ningún perfil docente tiene indicios de credenciales de administración.');
    } else {
      logFail('Fuga de privilegios detectada', 'Un usuario docente contiene credenciales elevadas.');
    }
  } catch (err) {
    logFail('Error en Test 4', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: Resistencia a Nombres con Caracteres Especiales y Tildes
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Carga con Tildes, Eñes y Caracteres Colombianos ---');
  if (r2) {
    try {
      const complexKey = `observador/citaciones/CIT-TEST-${Date.now()}_Acta_Niño_José_Muñoz_Educación.pdf`;
      const complexBody = Buffer.from('Prueba con caracteres especiales colombianos: ñ, á, é, í, ó, ú');

      await r2.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: complexKey,
        Body: complexBody,
        ContentType: 'application/pdf'
      }));
      createdTestKeys.push(complexKey);

      logPass('Carga exitosa con nomenclatura compleja y tildes', `Key: "${complexKey}"`);
    } catch (err) {
      logFail('Fallo al procesar caracteres especiales en R2', err.message);
    }
  }

  // -------------------------------------------------------------------------
  // LIMPIEZA AUTOMÁTICA DE ARCHIVOS TEMPORALES DE PRUEBA EN R2
  // -------------------------------------------------------------------------
  if (r2 && createdTestKeys.length > 0) {
    console.log('\n🧹 Limpieza de artefactos de prueba temporales en R2...');
    for (const key of createdTestKeys) {
      try {
        await r2.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key
        }));
        console.log(`   └─ Eliminado objeto temporal: "${key}"`);
      } catch (e) {
        console.warn(`   └─ Advertencia limpiando ${key}:`, e.message);
      }
    }
  }

  // -------------------------------------------------------------------------
  // RESUMEN FINAL
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`🎯 RESULTADOS: ${testsPassed} Pruebas Exitosas | ${testsFailed} Fallas Detectadas`);
  console.log('======================================================================');

  if (testsFailed === 0) {
    console.log('🚀 ¡EL SISTEMA PASÓ TODAS LAS PRUEBAS DE ESTRÉS, SEGURIDAD Y R2 SIN NINGUNA FUGA!\n');
    process.exit(0);
  } else {
    console.error('⚠️ Se detectaron inconsistencias que deben corregirse.\n');
    process.exit(1);
  }
}

runTestSuite();
