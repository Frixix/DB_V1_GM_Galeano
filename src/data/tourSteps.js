// "icon" es el nombre del icono de Phosphor; TourSpotlight lo convertirá en componente.
// "targetId" es el id del elemento que se resalta (null = pantalla centrada).

export const TOUR_STEPS_DOCENTE = [
  {
    targetId: null,
    title: '¡Bienvenida, Profesora!',
    desc: 'Este espacio fue diseñado para organizar de forma sencilla y privada el trabajo de Básica Primaria del Gimnasio Martin Galeano. En 4 pasos veremos cómo funciona.',
    icon: 'HandWaving',
  },
  {
    targetId: 'sidebarFoldersSection',
    title: 'Tus Carpetas y Circulares',
    desc: "En este menú lateral encuentras tus planeaciones, planillas y talleres. Además, en 'Institucional & Circulares' recibirás avisos de Rectoría con un globo rojo estilo WhatsApp.",
    icon: 'Folders',
  },
  {
    targetId: 'generalFiltersBar',
    title: 'Filtros y Búsqueda Rápida',
    desc: 'Puedes filtrar tus documentos al instante por Materia (Matemáticas, Lenguaje...), por Grado (1° a 5°) o escribiendo directamente en la barra de búsqueda.',
    icon: 'MagnifyingGlass',
  },
  {
    targetId: 'btnOpenModal',
    title: 'Subir Documento Comprimido',
    desc: 'Al pulsar aquí podrás subir tus archivos (PDF, Excel, Word). El sistema los comprime automáticamente para ahorrar memoria (límite de 15 MB).',
    icon: 'CloudArrowUp',
  },
  {
    targetId: 'documentsContainer',
    title: 'Visualizar y Descargar',
    desc: "En cada tarjeta encontrarás el botón 'Ver' para leer la circular en pantalla y 'Descargar' para obtener el archivo original en tu computador en cualquier momento.",
    icon: 'FileArrowDown',
  },
]

export const TOUR_STEPS_RECTORA = [
  {
    targetId: null,
    title: 'Bienvenida, Rectora Claudia 👑',
    desc: 'Este es su Centro de Control y Supervisión Directiva de Básica Primaria del Gimnasio Martin Galeano. Diseñado para auditar todo el colegio con total seguridad y sencillez.',
    icon: 'Crown',
  },
  {
    targetId: 'adminTeacherSection',
    title: '1. Auditoría Docente en Tiempo Real',
    desc: 'Aquí puede filtrar con un solo clic los documentos de Jessica, Yuri o Elcy. Podrá ver qué ha subido cada profesora, con su fecha exacta y sin que ellas puedan borrar registros.',
    icon: 'UsersThree',
  },
  {
    targetId: 'btnOpenModal',
    title: '2. Emisión de Circulares y Comunicados',
    desc: "Desde 'Subir Documento', marque la casilla '📢 Compartir con todos los profesores'. A las docentes les aparecerá de inmediato una notificación estilo WhatsApp para leer su comunicado.",
    icon: 'Megaphone',
  },
  {
    targetId: 'generalFiltersBar',
    title: '3. Búsqueda y Control por Radicado',
    desc: 'Cada documento cuenta con un código único (ej. MG-PRI-001) para facilitar citas en reuniones de padres, actas de comisión y auditorías de la Secretaría de Educación.',
    icon: 'MagnifyingGlass',
  },
  {
    targetId: 'btnBovedaFolder',
    title: '4. Bóveda Confidencial Protegida',
    desc: "Solo visible para usted y el Administrador con la clave 'boveda2026'. Aquí custodia actas de Consejo Directivo, balances financieros, contratos y soportes PEI organizados por año.",
    icon: 'Vault',
  },
  {
    targetId: 'sidebarStorageCard',
    title: '5. Capacidad Masiva y Almacenamiento',
    desc: 'Su cuenta institucional cuenta con un límite extendido de hasta 2 GB por archivo. La barra inferior calcula el espacio disponible en tiempo real.',
    icon: 'HardDrive',
  },
]