# Skill: Industrial Documentation Sync 📜🛡️

Este protocolo automatiza la sincronización de la documentación técnica y de gestión tras la finalización de un hito, fase o tarea crítica. Asegura que el estado del repositorio refleje fielmente los avances técnicos y arquitectónicos.

## 🎯 Objetivos
1.  **Mantener la Verdad Única**: Sincronizar `PROGRESS.md`, `ROADMAP.md` y `README.md` con la realidad del código.
2.  **Preservar el Conocimiento**: Actualizar o crear documentos en `docs/` (ADRs, Especificaciones, Lecciones Aprendidas).
3.  **Zero-Noise Documentation**: Eliminar inconsistencias y asegurar que la documentación siga los estándares de la Era 11.

## 🛠️ Flujo de Ejecución

### 1. Análisis de Impacto
-   Revisar los archivos modificados en la tarea actual.
-   Identificar cambios en la arquitectura, esquemas de base de datos o flujos de seguridad.
-   Consultar el estado previo en `PROGRESS.md`.

### 2. Actualización de Manifiestos
-   **`PROGRESS.md`**: 
    -   Marcar tareas completadas con `[X]`.
    -   Actualizar porcentajes de avance de la fase.
    -   Añadir breves notas sobre obstáculos superados.
-   **`ROADMAP.md`**: 
    -   Mover hitos de "In Progress" a "Completed".
    -   Ajustar fechas estimadas si es necesario.
-   **`README.md`**: 
    -   Actualizar la sección de "Features" o "Status".
    -   Reflejar cambios en los requisitos de instalación o ejecución.

### 3. Gestión de `docs/`
-   **Revisión**: Antes de crear un archivo nuevo, buscar en `docs/` si existe uno que cubra el tema (ej. `ARCHITECTURE.md`, `SECURITY.md`).
-   **Actualización**: Si el cambio es una evolución de un sistema existente, modificar el documento actual.
-   **Creación**: Crear nuevos archivos solo si se introduce un concepto arquitectónico inédito (ej. un nuevo ADR o una especificación de módulo).
-   **Lecciones Aprendidas**: Si se ha resuelto un bug complejo o un reto técnico, documentarlo en `docs/LESSONS_LEARNED.md`.

### 4. Verificación de Integridad
-   Comprobar que todos los enlaces internos funcionen.
-   Asegurar que el tono sea profesional, técnico y directo (Caveman-Mode compatible si es interno).

## 🛡️ Reglas de Oro
-   **No duplicar**: Si la información ya está en un ADR, no la repitas entera en el README. Usa enlaces.
-   **Fechas**: Todas las actualizaciones deben incluir la fecha estelar del proyecto (ej. 05/15/2026).
-   **Status**: Usar tags de estado industriales: `SYS_READY`, `ALPHA`, `BETA`, `DEPRECATED`.

## 🚀 Cuándo Usar esta Skill
-   Al finalizar una Fase del Roadmap.
-   Tras resolver un incidente crítico de seguridad o arquitectura.
-   Antes de realizar un `git push` de un bloque de trabajo significativo.
