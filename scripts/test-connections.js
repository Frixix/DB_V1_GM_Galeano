#!/usr/bin/env node
/**
 * Script de validación End-to-End para persistencia Supabase y Cloudflare R2
 * Sistema Documental — Gimnasio Martín Galeano
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Cargar variables de entorno desde .env.local o .env
const envFiles = ['.env.local', '.env'];
let envLoaded = {};

for (const file of envFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').trim();
      if (key && !envLoaded[key.trim()]) {
        envLoaded[key.trim()] = val;
        process.env[key.trim()] = val;
      }
    }
  }
}

console.log('========================================================');
console.log('   DIAGNÓSTICO Y TEST DE CONEXIÓN EN VIVO: GALEANO DOCS  ');
console.log('========================================================\n');

async function testSupabase() {
  console.log('--- 1. VERIFICACIÓN SUPABASE (PERSISTENCIA) ---');
  const supabaseUrl = envLoaded.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = envLoaded.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('tu-proyecto')) {
    console.warn('⚠️ Supabase no está configurado en .env.local');
    return { ok: false };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error, count } = await supabase
      .from('documents')
      .select('id, title, folder, raw_bytes, storage_key', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('❌ Error consultando tabla "documents":', error.message);
      return { ok: false, error };
    }

    console.log(`✅ Supabase OK: Conexión exitosa.`);
    console.log(`   Total de documentos registrados: ${count ?? data.length}`);
    if (data.length > 0) {
      console.log(`   Muestra (ID): ${data[0].id} | Título: "${data[0].title.slice(0, 35)}..."`);
    }
    return { ok: true, supabase };
  } catch (err) {
    console.error('❌ Fallo crítico conectando a Supabase:', err);
    return { ok: false, err };
  }
}

async function testR2() {
  console.log('\n--- 2. VERIFICACIÓN CLOUDFLARE R2 (S3 COMPATIBLE) ---');
  const accountId = envLoaded.VITE_R2_ACCOUNT_ID || process.env.VITE_R2_ACCOUNT_ID;
  const accessKeyId = envLoaded.VITE_R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID;
  const secretAccessKey = envLoaded.VITE_R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY;
  const bucketName = envLoaded.VITE_R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME || 'documentos-galeano';

  if (!accountId || !accessKeyId || !secretAccessKey || accountId.includes('tu-account-id')) {
    console.warn('⚠️ Cloudflare R2 no está completamente configurado en .env.local');
    return { ok: false };
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Bucket:   ${bucketName}`);

  const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const r2 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const testKey = `test/ping-test-${Date.now()}.txt`;
  const dummyPayload = `Test ping binario Gimnasio Martin Galeano - ${new Date().toISOString()} - R2 Storage Verification (1KB padding): ` + 'X'.repeat(900);

  try {
    // a) Subida dummy 1 KB
    await r2.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: Buffer.from(dummyPayload, 'utf-8'),
      ContentType: 'text/plain',
    }));
    console.log(`✅ [R2 Upload] Archivo dummy subido correctamente a "${testKey}"`);

    // b) Lectura / Descarga
    const getRes = await r2.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    }));
    const downloadedStr = await getRes.Body.transformToString();
    if (downloadedStr.includes('Gimnasio Martin Galeano')) {
      console.log(`✅ [R2 Download] Archivo leído y verificado (${downloadedStr.length} bytes recibidos).`);
    } else {
      throw new Error('El contenido descargado de R2 no coincide con el enviado.');
    }

    // c) Limpieza
    await r2.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    }));
    console.log(`✅ [R2 Clean] Archivo dummy de prueba eliminado del bucket con éxito.`);
    return { ok: true };
  } catch (err) {
    console.error('❌ Error en prueba viva de Cloudflare R2:', err);
    return { ok: false, err };
  }
}

async function testSupabaseStorageFallback(supabase) {
  console.log('\n--- 3. VERIFICACIÓN SUPABASE STORAGE (RESPALDO / FALLBACK) ---');
  if (!supabase) {
    console.log('   Omitiendo verificación (Supabase no conectado).');
    return;
  }

  const bucket = envLoaded.VITE_SUPABASE_STORAGE_BUCKET || 'documentos-galeano';
  const testKey = `test/ping-supa-${Date.now()}.txt`;
  try {
    const { data: upData, error: upErr } = await supabase.storage.from(bucket).upload(
      testKey, 
      Buffer.from('Prueba fallback Supabase Storage', 'utf-8'),
      { upsert: true }
    );
    if (upErr) {
      console.warn('⚠️ Supabase Storage upload error:', upErr.message);
    } else {
      console.log(`✅ [Supabase Storage] Fallback operativo en bucket "${bucket}".`);
      await supabase.storage.from(bucket).remove([testKey]);
      console.log(`✅ [Supabase Storage] Archivo temporal limpiado.`);
    }
  } catch (err) {
    console.warn('⚠️ Nota sobre Supabase Storage:', err.message);
  }
}

async function run() {
  const supaResult = await testSupabase();
  const r2Result = await testR2();
  await testSupabaseStorageFallback(supaResult.supabase);

  // Verificación de módulos institucionales y tablas operativas
  if (supaResult.supabase) {
    console.log('\n--- 4. AUDITORÍA DE MÓDULOS INSTITUCIONALES EN SUPABASE ---');
    const moduleChecks = [
      { name: 'Observador & Actas de Comités', table: 'observador_records' },
      { name: 'Evaluaciones Finales', table: 'evaluaciones_finales' },
      { name: 'Cronograma de Exámenes', table: 'evaluaciones_deadlines' },
      { name: 'Censo & Matrículas Estudiantiles', table: 'matriculas_estudiantes' },
      { name: 'Gestión Docente (Directores)', table: 'directores_curso' },
      { name: 'Gestión Docente (Perfiles)', table: 'docentes_perfiles' },
      { name: 'Calificaciones SIEE (Ramas)', table: 'grades_branches' },
      { name: 'Seguridad & Credenciales Bóveda', table: 'institutional_vault' }
    ];

    for (const mod of moduleChecks) {
      try {
        const { count, error } = await supaResult.supabase
          .from(mod.table)
          .select('*', { count: 'exact', head: true });
        if (error) {
          console.log(`❌ [${mod.name}] Tabla "${mod.table}": ERROR (${error.message})`);
        } else {
          console.log(`✅ [${mod.name}] Tabla "${mod.table}": CONECTADO (${count ?? 0} registros sincronizados)`);
        }
      } catch (modErr) {
        console.log(`❌ [${mod.name}]: ${modErr.message}`);
      }
    }
  }

  console.log('\n========================================================');
  if (supaResult.ok && r2Result.ok) {
    console.log('🎉 RESULTADO: TODOS LOS SERVICIOS OPERATIVOS AL 100%');
  } else {
    console.log('⚠️ RESULTADO: REVISAR ADVERTENCIAS REPORTADAS ARRIBA');
  }
  console.log('========================================================\n');
}

run();
