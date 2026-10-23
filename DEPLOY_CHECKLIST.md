# 🚀 Checklist de Despliegue a Producción & Dominio Propio
**Gimnasio Martín Galeano · Plataforma de Gestión Escolar & Archivo Normativo**

Este documento detalla el procedimiento técnico paso a paso para conectar el dominio institucional definitivo y asegurar la alta disponibilidad de persistencia, almacenamiento R2 y autenticación.

---

## 1. Configuración de Registros DNS (Dominio Institucional)

En el panel de tu registrador o proveedor DNS (Cloudflare, Mi.com.co, GoDaddy, Namecheap):

1. **Subdominio de la Aplicación (Recomendado)**:
   - **Tipo**: `CNAME`
   - **Nombre**: `sistema` (o `plataforma`)
   - **Destino**: El subdominio asignado por el hosting (ej: `cname.vercel-dns.com` o `<proyecto>.pages.dev`).
   - **Proxy**: Si usas Cloudflare, activa la nube naranja (Proxied) para CDN y certificados SSL/TLS automáticos.

2. **Dominio Raíz (Apex Domain)**:
   - **Tipo**: `A` o `ALIAS/ANAME` apuntando a las IPs estáticas del proveedor de hosting.

3. **Verificación SSL**:
   - Asegúrate de que el certificado SSL/TLS esté emitido en modo **Full** o **Strict** antes del tráfico oficial.

---

## 2. Configuración de CORS en Cloudflare R2

Para que el nuevo dominio pueda subir binarios (`PUT`), descargar previsualizaciones (`GET`) y realizar verificaciones previas (`HEAD` / `OPTIONS`), actualiza la política CORS en el bucket de R2:

1. Ve a **Cloudflare Dashboard** > **R2 Storage** > Selecciona el bucket `documentos-galeano`.
2. Dirígete a la pestaña **Settings** > **CORS Policy** > **Add CORS rule**.
3. Pega la configuración JSON autorizada:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://sistema.gimnasiomartingaleano.edu.co",
         "https://*.gimnasiomartingaleano.edu.co",
         "http://localhost:5173"
       ],
       "AllowedMethods": [
         "GET",
         "PUT",
         "POST",
         "DELETE",
         "HEAD"
       ],
       "AllowedHeaders": [
         "*"
       ],
       "ExposeHeaders": [
         "ETag"
       ],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

---

## 3. Configuración en Supabase (Auth & Realtime)

1. Ve al panel de **Supabase** > Proyecto > **Authentication** > **URL Configuration**:
   - **Site URL**: `https://sistema.gimnasiomartingaleano.edu.co`
   - **Redirect URLs**: Añade:
     - `https://sistema.gimnasiomartingaleano.edu.co/**`
     - `http://localhost:5173/**` (para soporte de pruebas locales)

2. En **Storage** (para el bucket fallback `documentos-galeano`):
   - Verifica que la política de subida RLS permita lecturas públicas de archivos no confidenciales e inserciones authenticated/anon.

---

## 4. Inyección de Variables de Entorno en el Hosting

Configura en Vercel / Cloudflare Pages / Netlify las siguientes variables (Environment: **Production**):

```env
VITE_APP_URL=https://sistema.gimnasiomartingaleano.edu.co
VITE_SUPABASE_URL=https://<TU_PROYECTO>.supabase.co
VITE_SUPABASE_ANON_KEY=<TU_SUPABASE_ANON_KEY>
VITE_SUPABASE_STORAGE_BUCKET=documentos-galeano
VITE_R2_ACCOUNT_ID=<TU_CLOUDFLARE_ACCOUNT_ID>
VITE_R2_ACCESS_KEY_ID=<TU_R2_ACCESS_KEY_ID>
VITE_R2_SECRET_ACCESS_KEY=<TU_R2_SECRET_ACCESS_KEY>
VITE_R2_BUCKET_NAME=documentos-galeano
VITE_R2_ENDPOINT=https://<TU_ACCOUNT_ID>.r2.cloudflarestorage.com
VITE_R2_PUBLIC_DOMAIN=https://pub-<TU_SUBDOMINIO>.r2.dev
```

---

## 5. Pruebas de Humo en Producción (Live Verification)

Una vez desplegada la versión en el dominio final:

- [ ] **Rutas Directas**: Navegar a una subruta directamente (ej: `/decreto1075` o `/observador`) y presionar F5 para validar que las reglas de `_redirects` / `vercel.json` sirvan `index.html` sin error 404.
- [ ] **Login & Sesiones**: Iniciar sesión con perfil Directivo y Docente.
- [ ] **Carga de Archivos**: Radicar un acta en *Comités & Actas* o un documento en *Decreto 1075* (.docx / .pdf) y confirmar que se aloje en Cloudflare R2 sin errores de CORS en consola.
- [ ] **Firmas Digitales**: Firmar con el mouse/dedo y descargar el acta en PDF para comprobar la estampa y membrete SED.
- [ ] **Bóveda Confidencial**: Desbloquear con contraseña maestra y verificar custodia y descarga de documentos de rectoría.
