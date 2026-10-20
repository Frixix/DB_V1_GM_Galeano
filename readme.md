# 🏫 Gimnasio Martin Galeano — MG Workspace v2.0.0
> **Plataforma Integral de Gestión Documental, Calificaciones Académicas y Resguardo Institucional**  
> *Desarrollado por `<Frix.io/>`*

---

## 🌟 Visión General

**MG Workspace v2.0.0** es la plataforma tecnológica centralizada del **Gimnasio Martin Galeano** para la administración, resguardo documental, control de asistencia en tiempo real y evaluación académica (SIEE) de Básica Primaria. 

Diseñada bajo una arquitectura sin servidor de **Costo $0 COP**, aprovecha la potencia de **Supabase** (PostgreSQL, Row Level Security, Realtime) y **Cloudflare R2** (almacenamiento de alta velocidad para archivos de hasta 2 GB), garantizando máxima privacidad, integridad criptográfica y alta disponibilidad en la nube.

---

## 🚀 Módulos del Sistema (Versión 2.0)

### 1. 📂 Gestión Documental y Archivo Central *(En Producción)*
- **Control de Roles (RBAC):**
  - **Rectoría y Administrador:** Supervisión global, emisión de circulares oficiales, edición, eliminación y auditoría por docente.
  - **Docentes:** Espacio privado para radicación de planeaciones, guías y talleres, sin acceso a archivos ajenos ni permisos destructivos.
- **Estructura en Paleta Pastel Unificada:**
  - `Todos los documentos`, `Compartidos con todos`, `Institucional & Circulares`, `Planeaciones`, `Planillas`, `Guías & Talleres`, `Observador & Actas`.
  - Comportamiento interactivo intuitivo: reposo neutral con icono atenuado, iluminación al pasar el cursor (`hover`) y selección en color pastel con texto en negrita.
- **Circulares Institucionales con Notificación Activa:**
  - Globo indicador en tiempo real en la campanita superior que se apaga automáticamente al confirmar la lectura del documento.
- **Radicación Automática:** Formato estándar institucional: `MG-PRI-2026-XXXX`.
- **Almacenamiento Cloudflare R2:** Subida directa y multipart de archivos pesados con barras de progreso y compresión inteligente.

---

### 2. 🔐 Bóveda Directiva & Resguardo Confidencial *(En Producción)*
- **Exclusivo para Rectoría y Administrador:**
  - Resguardo de máxima seguridad para actas de Consejo Directivo, balances financieros, resoluciones, soportes PEI y contratos laborales.
- **Sistema de Doble Llave Concurrente:**
  - Clave maestra directiva (`boveda2026` inicial) con capacidad de actualización independiente y sincronización en la nube.
- **Partición por Año Lectivo y Subcarpetas:**
  - Clasificación automática por vigencia fiscal y carpetas temáticas confidenciales.

---

### 3. 📊 Notas y Calificaciones (SIEE) *(Versión 2 · Fase N° 1)*
- **Jerarquía Relacional de Datos (RBAC):**
  - Árbol relacional: `Año Lectivo (2026) ➔ Periodo (1° al 4°) ➔ Grado ➔ Director de Curso ➔ Asignatura ➔ Docente Titular ➔ Estudiantes`.
- **Navegación en Cards Grado a Grado y Sábana a Sábana:**
  - **Carpetas de Grados Académicos:** `Transición`, `1° Primaria`, `2° Primaria`, `3° Primaria`, `4° Primaria`, `5° Primaria` con asignación de dirección de curso y censo de estudiantes.
  - **Sábana General Consolidada (Vista General):**
    - Matriz integral con **todas las asignaturas del grado lado a lado**.
    - Cálculo de **promedio general**, **puestos del grado** (1°, 2° y 3° con medallas y trofeos) y conteo de asignaturas reprobadas.
    - **Acceso rápido interactivo:** Clic en cualquier encabezado de materia o celda para saltar directamente a su planilla detallada.
  - **Planillas Detalladas por Asignatura:**
    - Estructura oficial SIEE: **Cognitivo (40%)**, **Procedimental (40%)**, **Actitudinal (20%)** y cálculo de definitiva ponderada al 100%.
    - Escala valorativa nacional: *Superior*, *Alto*, *Básico*, *Bajo*.
    - Retroalimentación pedagógica docente (editable por el titular) y sugerencia directiva de auditoría (Rectoría).
- **Estado de Despliegue en la Nube:**
  - **Acceso Administrador:** Interacción completa para auditoría técnica y pruebas de sincronización.
  - **Modo Rectora y Docentes:** Tarjetas en gris con distintivo `🔨 EN DESARROLLO · FASE N° 1` y modal de agradecimiento institucional al hacer clic.

---

### 4. 🔄 Novedades & Reemplazos Docentes *(Archivado / Clausurado de la Interfaz)*
- **Estado:** Módulo retirado y ocultado del flujo visual por directiva de simplificación operativa.
- **Documentación y Memoria Técnica:** La lógica relacional de sustitución atómica, matrices curriculares y persistencia se encuentra detallada en [`docs/ARQUITECTURA_NOVEDADES_Y_REEMPLAZOS.md`](file:///C:/Users/robin/Documents%20internos%20C/producción/DB_V1_GM_Galeano/docs/ARQUITECTURA_NOVEDADES_Y_REEMPLAZOS.md).


---

### 5. 👥 Control de Asistencia y Presencia en Vivo *(En Producción)*
- **Supabase Realtime Presence:**
  - Latido (*heartbeat*) que registra en tiempo real quién se encuentra conectado en la plataforma.
  - Panel flotante con conteo en vivo de docentes en línea y registro de última conexión.

---

### 6. 🛡️ Seguridad, Identidad y Primer Ingreso *(En Producción)*
- **Primer Ingreso Obligatorio (`ForcePasswordChangeModal`):**
  - Las cuentas de docentes (`jessica`, `yuri`, `elcy`, etc.) cuentan con claves iniciales individuales (`jessica2026`, `yuri2026`, etc.).
  - En su primer ingreso, el sistema exige obligatoriamente cambiar la contraseña antes de poder navegar. Una vez cambiada, la clave inicial se elimina automáticamente.
- **Separación de Claves:**
  - `boveda2026` está blindada exclusivamente para la Bóveda Directiva.
- **Ofuscación Criptográfica:**
  - Las credenciales nunca viajan ni se almacenan en texto plano; se utiliza el algoritmo `GM_SEC_v1$...` respaldado en la tabla `institutional_vault` de Supabase.

---

## 🏗️ Arquitectura del Sistema

```
                      [ Cliente Web - React 19 + Vite ]
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
      [ Supabase Cloud ]                       [ Cloudflare R2 ]
  ├── Autenticación (JWT)                  └── Bucket Binarios (10 GB)
  ├── Base de Datos (PostgreSQL)                 ├── Archivos hasta 2 GB
  ├── Row Level Security (RLS)                   └── URLs firmadas por Edge Functions
  ├── Realtime (Presencia en vivo)
  └── Bóveda Criptográfica (Vault)
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 19, Vite 8, Phosphor Icons, CSS3 Modular Pastel |
| **Seguridad** | Row Level Security (RLS), JWT, Criptografía `GM_SEC_v1` |
| **Backend & DB** | Supabase (PostgreSQL), Supabase Edge Functions |
| **Almacenamiento** | Cloudflare R2 (S3-compatible API), JSZip |
| **Desarrollo** | `<Frix.io/>` |

---

## ⚙️ Puesta en Marcha Local

1. **Instalación de Dependencias:**
   ```bash
   npm install
   ```

2. **Variables de Entorno (`.env`):**
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

3. **Ejecución en Desarrollo:**
   ```bash
   npm run dev
   ```

4. **Compilación para Producción:**
   ```bash
   npm run build
   ```

---

## 📝 Historial de Versiones

### **v2.0.0 (Actual)**
- Reestructuración completa del módulo de **Notas y Calificaciones**: navegación en cards de carpetas, sábana general consolidada del grado, ranking/puestos y paleta pastel unificada esmeralda/menta.
- Integración del modal de primer ingreso obligatorio con contraseñas iniciales por docente.
- Aislamiento de clave maestra de Bóveda (`boveda2026`).
- Sistema de presencia en vivo y asistencia en tiempo real con Supabase Realtime.
- Bloqueo de fase de desarrollo en la nube para Notas y Reemplazos con modal de agradecimiento Fase N° 1 y acceso exclusivo para Administrador.
- Firma de autoría en pie de inicio de sesión: `desarrollado por <Frix.io/>`.

### **v1.0.0**
- Lanzamiento inicial de Gestión Documental y Bóveda Directiva con Supabase y Cloudflare R2.

---

## 👨‍💻 Autoría y Soporte

Desarrollado con dedicación para el **Gimnasio Martin Galeano** por:  
**`<Frix.io/>`**  
*Ingeniería de Software & Soluciones Cloud*