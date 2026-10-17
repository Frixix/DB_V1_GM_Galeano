/**
 * ==============================================================================
 * ENTORNO DE PROTOTIPADO ULTRALIGERO (SPA EN VANILLA JS)
 * Google Antigravity - Senior Frontend Architecture
 * ==============================================================================
 * 
 * - Paleta predominante: Verde institucional.
 * - Iconografía: Gráficos vectoriales SVG nativos (cero emojis).
 * - Módulo funcional activo: Notas y Calificaciones.
 * - Módulos pendientes: Marcados en gris ("En desarrollo").
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ----------------------------------------------------------------------------
  // 1. REGISTRO DE MÓDULOS DEL SISTEMA
  // ----------------------------------------------------------------------------
  const MODULES_REGISTRY = {
    grades: {
      id: 'grades',
      title: 'Notas y Calificaciones',
      tag: 'Módulo Activo',
      iconSvg: `
        <svg class="icon-svg-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      `
    }
  };

  // ----------------------------------------------------------------------------
  // 2. REFERENCIAS A ELEMENTOS DEL DOM
  // ----------------------------------------------------------------------------
  const views = {
    login: document.getElementById('view-login'),
    dashboard: document.getElementById('view-dashboard'),
    module: document.getElementById('view-module')
  };

  // Botones de acción principales
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnBackDashboard = document.getElementById('btn-back-dashboard');

  // Elementos dinámicos de la Vista 3 (Pantalla de Módulo)
  const moduleTitleEl = document.getElementById('module-title');
  const moduleIconEl = document.getElementById('module-icon');
  const moduleTagEl = document.getElementById('module-tag');

  // Disparadores interactivos de módulos (Sidebar + Tarjeta activa)
  const moduleTriggers = document.querySelectorAll('.module-trigger');

  // ----------------------------------------------------------------------------
  // 3. ENRUTADOR Y CONTROLADOR DE VISTAS (SPA ENGINE)
  // ----------------------------------------------------------------------------
  /**
   * Cambia la vista activa gestionando la clase CSS `.hidden`.
   * 
   * @param {'login'|'dashboard'|'module'} targetView - Vista a presentar.
   * @param {Object} [params] - Parámetros (ej. moduleId).
   */
  function navigateTo(targetView, params = {}) {
    // 1. Ocultar todas las vistas registradas
    Object.values(views).forEach(viewElement => {
      if (viewElement) {
        viewElement.classList.add('hidden');
      }
    });

    // 2. Parametrizar la Vista 3 cuando se accede a un módulo
    if (targetView === 'module') {
      const moduleKey = params.moduleId || 'grades';
      const moduleData = MODULES_REGISTRY[moduleKey] || MODULES_REGISTRY.grades;

      if (moduleTitleEl) {
        moduleTitleEl.textContent = `Módulo: ${moduleData.title}`;
      }
      if (moduleIconEl && moduleData.iconSvg) {
        moduleIconEl.innerHTML = moduleData.iconSvg;
      }
      if (moduleTagEl) {
        moduleTagEl.textContent = moduleData.tag;
      }
    }

    // 3. Presentar la vista solicitada y desplazar al inicio
    const activeView = views[targetView];
    if (activeView) {
      activeView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.warn(`[SPA Router] No se encontró el contenedor para la vista: "${targetView}"`);
    }
  }

  // ----------------------------------------------------------------------------
  // 4. REGISTRO DE EVENTOS (LISTENERS)
  // ----------------------------------------------------------------------------

  // Vista 1 -> Vista 2: Simulación de Login
  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      navigateTo('dashboard');
    });
  }

  // Vista 2 -> Vista 1: Cerrar Sesión
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      navigateTo('login');
    });
  }

  // Vista 3 -> Vista 2: Volver al Panel Principal
  if (btnBackDashboard) {
    btnBackDashboard.addEventListener('click', () => {
      navigateTo('dashboard');
    });
  }

  // Vista 2 -> Vista 3: Clic en módulos activos
  moduleTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const moduleId = trigger.getAttribute('data-module');
      if (moduleId) {
        navigateTo('module', { moduleId });
      }
    });
  });

  // ----------------------------------------------------------------------------
  // 5. INICIALIZACIÓN
  // ----------------------------------------------------------------------------
  navigateTo('login');
});
