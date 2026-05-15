# 🏭 Industrial UI Specification - ABDAuth

Este documento detalla los estándares estéticos y funcionales de la interfaz de usuario de ABDAuth, asegurando coherencia y cumplimiento de los principios DRY y Era 11.

## 🎨 Sistema de Diseño

### Tokens de Color
Se utilizan variables CSS dinámicas definidas en `globals.css`:
- **Primary**: Blue Industrial (`hsl(217.2, 91.2%, 59.8%)`).
- **Background**: Adaptativo (Claro: `0 0% 98%` | Oscuro: `0 0% 3%`).
- **Glassmorphism**: Clase `.glass-panel` para contenedores flotantes con desenfoque de fondo y bordes sutiles.

### Tipografía
- **Sans**: Inter / System UI para legibilidad.
- **Mono**: Utilizada en badges, códigos y datos técnicos para reforzar la estética de "Terminal Industrial".

## 🛠️ Componentes Centralizados

### `SystemSettings.tsx`
Orquestador unificado de configuración. Sustituye a selectores individuales para evitar duplicidad de código.
- **Funcionalidad**: Gestión de Temas (Luz, Oscuridad, Sistema) e Idiomas (i18n).
- **Animaciones**: Implementadas con `framer-motion` (opacidad, desplazamiento y escala).
- **Accesibilidad**: Todos los elementos deben incluir `aria-label` en la primera línea de la etiqueta para cumplimiento de auditoría.

## 🛡️ Estándares de Accesibilidad (a11y)

Para pasar la fase de auditoría `[3/6 a11y Compliance]`, es obligatorio:
1.  **Etiquetado**: Todo botón interactivo debe tener un `aria-label` descriptivo.
2.  **Orden de Atributos**: Colocar `aria-label` inmediatamente después de la apertura de la etiqueta para facilitar la detección por scripts de auditoría simplificados.
3.  **Contraste**: Mantener las opacidades de las rejillas (`bg-industrial-grid`) por debajo de `0.1` en modo oscuro y `0.03` en modo claro.

## 🚀 Guía de Extensión
Para añadir un nuevo idioma:
1.  Añadir el archivo de mensajes en `src/messages/`.
2.  Actualizar `src/i18n/routing.ts` con el nuevo locale.
3.  Añadir el botón correspondiente en la sección "Language" de `SystemSettings.tsx`.

---
*Status: SYS_CERTIFIED*
*Last Sync: 05/15/2026*
