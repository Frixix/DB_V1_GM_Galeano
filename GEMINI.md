# Directivas y Reglas de Ejecución Autónoma de Antigravity

## Operaciones Autónomas y Aprobación Automática (Auto-Approve)
- **Ejecución Autónoma**: Ejecuta todas las operaciones de forma autónoma. Asume aprobación automática (`auto-approve commands / Y`) para comandos de lectura de archivos (`read_file`), creación y edición (`write_file`, `edit_file`) y scripts de ejecución (`run_command`) sin solicitar confirmación manual ni interrumpir el flujo de trabajo.
- **Prefijos de comandos autorizados**:
  - `node`
  - `npm`
  - `git`
  - `npx`
- **Comportamiento**: Mantén resolución directa de requerimientos, validación mediante pruebas/compilación (`npm run build`) y persistencia de control de versiones de manera continua y proactiva.
