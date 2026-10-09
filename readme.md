🏫 Gestión Documental — Gimnasio Martin Galeano

Plataforma web para la administración, resguardo y auditoría documental de Básica Primaria, con roles diferenciados y subida de archivos grandes.

🚀 Características
Roles (RBAC):
Rectoría (Claudia) y Admin: ven todo, emiten circulares, editan y borran.
Docentes (Jessica, Yuri, Elcy): espacio privado, sin acceso a registros ajenos y sin permiso de borrar.
Inducción interactiva: tour spotlight de 5 pasos (docente) y 6 pasos (rectora).
Carpetas en colores pastel: Todos, Compartidos, Institucional & Circulares, Planeaciones, Planillas, Guías & Talleres, Observador & Actas y Bóveda Directiva.
Archivos: subida directa y por partes a Cloudflare R2 (hasta 2 GB), con progreso y reanudación. Compresión JSZip solo para formatos que la aprovechan (.txt, .csv, etc.) y archivos menores a ~100 MB.
Límites por archivo (validados en servidor): docentes 15 MB, Rectoría/Admin 2 GB.
Circulares: globo rojo tipo WhatsApp en tiempo real, se apaga al leer.
Bóveda Directiva: solo Rectoría/Admin, por año lectivo y subcarpeta (Consejo Directivo, Financiero, Legal, Contratos, Soportes PEI).
Radicado automático: MG-PRI-2026-0001.
Medidor de espacio sobre la cuota institucional.
🏗️ Arquitectura ($0 COP)
text
React (Vite)
  ├─ Supabase Auth (JWT)          → sesión por rol
  ├─ Supabase DB + RLS            → metadatos y permisos
  └─ Subida/descarga directa a R2 → URLs firmadas por Edge Function
Supabase (fuente de verdad): autenticación, metadatos, permisos (RLS) y Realtime.
Cloudflare R2 (10 GB gratis): solo los archivos binarios.
IndexedDB: caché local de metadatos.
Edge Functions: sign-upload, complete-upload, sign-download, delete-file.

Nunca se guardan binarios en PostgreSQL: la base de datos solo guarda la referencia (storage_key, tamaño, tipo).

🛠️ Stack

Vite · React 19 · Phosphor Icons · JSZip · Supabase · Cloudflare R2 · Plus Jakarta Sans

📂 Estructura
text
galeano-docs-react/
├── supabase/
│   ├── migrations/          # 001_schema.sql, 002_rls.sql
│   └── functions/           # sign-upload, complete-upload, sign-download, delete-file
├── src/
│   ├── components/          # Login, Navbar, Sidebar, FilterBar, DocumentCard,
│   │                        # DocumentTable, UploadModal, UploadProgress,
│   │                        # ViewModal, BovedaAuthModal, TourSpotlight
│   ├── hooks/               # useDocuments, useUpload, useRealtimeBadges, useIndexedDB
│   ├── lib/                 # supabaseClient, compression
│   ├── services/            # authService, documentService, fileService
│   ├── assets/styles.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
└── package.json
⚙️ Configuración

.env (cliente):

bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

Secretos de R2 (solo en Edge Functions, nunca en VITE_*):

bash
supabase secrets set R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=...

Arranque:

bash
npm install
npm run dev
🔐 Seguridad
Los permisos los aplica RLS en la base de datos, no la interfaz.
Los límites de tamaño se revalidan en el servidor.
Descargas con URL firmada que expira en ~5 minutos.
Las llaves de R2 y la clave de la bóveda viven solo en el servidor.
⚠️ Pendiente
Hacer export periódico de la tabla documents (el plan Free de Supabase no incluye backups).