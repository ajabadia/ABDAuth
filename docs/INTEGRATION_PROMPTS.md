# Prompts & Integration Guide for Sibling Applications

This guide provides **ready-to-use, copy-pasteable prompts** designed to instruct other AI coding agents (or developers) to seamlessly integrate the `@ajabadia/styles` central engine into any sibling application inside the ABD SaaS suite.

---

## 🛰️ Prompt 1: Satelite UI Theme Integration (e.g. for `ABDQuiz`, `ABDDocumentation`, etc.)

Copy and paste this prompt when instructing an agent working on a satellite application to connect its layout to the central branding engine:

```markdown
# ESPECIFICACIÓN: Integración del Motor Central de Estilos (@ajabadia/styles)

Estamos integrando el sistema central de marca blanca dinámica `@ajabadia/styles` en esta aplicación para que cargue los colores base (primario, secundario, bordes, etc.) y logotipos del Tenant activo en tiempo real, de manera accesible (WCAG) y con latencia cero (sin parpadeo visual).

## REQUERIMIENTOS TÉCNICOS:

1. **Instalación de Dependencia**:
   - Agrega la dependencia central de GitHub en el `package.json` de este proyecto:
     ```json
     "@ajabadia/styles": "git+https://github.com/ajabadia/ABDStyles.git#main"
     ```
   - Ejecuta `npm install` para importar el módulo.

2. **Inyección en Servidor (SSR) en el Layout Raíz**:
   - En `src/app/[locale]/layout.tsx` (o tu layout raíz), importa la función generadora:
     ```typescript
     import { generateTenantCss } from '@ajabadia/styles';
     ```
   - Recupera los datos de branding del Tenant activo (ya sea de la base de datos de configuración por subdominio o desde la sesión de usuario federada).
   - Ejecuta `generateTenantCss(tenant.branding.theme)` en el servidor (en memoria) para obtener el bloque CSS optimizado.
   - Inyecta la cadena CSS resultante dentro del `<head>` del HTML utilizando una etiqueta `<style>` con el ID `tenant-branding-gateway`:
     ```tsx
     <head>
       {customCss && (
         <style id="tenant-branding-gateway" dangerouslySetInnerHTML={{ __html: customCss }} />
       )}
     </head>
     ```

3. **Uso de Imagen de Logotipo Dinámica**:
   - Localiza la cabecera o barra lateral de navegación y sustituye el logotipo estático por una etiqueta de imagen que cargue `tenant.branding.logoUrl` con un fallback seguro hacia la imagen corporativa local si no hay tenant activo:
     ```tsx
     <img src={tenant?.branding?.logoUrl || '/default-logo.svg'} alt="Logo Corporativo" />
     ```

4. **Alineación con Clases Semánticas**:
   - Asegúrate de que las vistas y componentes utilicen clases semánticas de Tailwind v4 (`bg-primary`, `text-primary-foreground`, `border-border`, `rounded-[var(--radius)]`) en lugar de colores hardcodeados (como `bg-cyan-500` o `bg-blue-600`), garantizando que la interfaz entera mute de color de forma inmediata y automática al aplicar los estilos del Tenant.

5. **Verificación**:
   - Levanta el servidor local (`npm run dev`) y simula subdominios accediendo a `http://bomberos.lvh.me:3300` o `http://policia.lvh.me:3300` para comprobar que la interfaz muta de color instantáneamente sin parpadeos visuales en la recarga.
```

---

## 🏛️ Prompt 2: Branding Customizer Console Integration (for `ABDAuth` / `ABDGovernance`)

Copy and paste this prompt when instructing an agent working on `ABDAuth` or `ABDGovernance` to build the administration portal where tenants configure their styles:

```markdown
# ESPECIFICACIÓN: Consola de Personalización Dinámica Multi-Tenant (Branding Customizer Console)

Estamos construyendo un panel administrativo dentro del portal de gobernanza para permitir a los administradores de cada Tenant (academia/empresa) personalizar de forma segura su identidad visual (logotipo, colores corporativos y redondeado de esquinas).

## REQUERIMIENTOS TÉCNICOS:

1. **Esquema de Base de Datos (MongoDB)**:
   - Modifica o extiende el modelo de datos de `Tenant` para incorporar el objeto `branding` estructurado de acuerdo con `@ajabadia/styles`:
     ```typescript
     branding: {
       logoUrl: string; // URL CDN de la imagen
       theme: {
         primary: string; // Hexadecimal (ej: '#ef4444')
         secondary: string; // Hexadecimal (ej: '#1f2937')
         background: string; // Hexadecimal (ej: '#0b0f19')
         rounded: boolean; // Si aplica bordes redondeados
         radius: string; // Valor CSS del redondeado (ej: '0.75rem')
       }
     }
     ```

2. **Sanitización Estricta mediante Zod**:
   - Instala e importa `@ajabadia/styles` para reutilizar su esquema de validación `brandingSchema` en el backend antes de persistir cualquier cambio en la base de datos, evitando inyecciones de CSS maliciosas.

3. **UI del Formulario de Marca (`TenantBrandingForm.tsx`)**:
   - Diseña un panel de control premium (estética Tech-Noir minimalista, bordes industriales, fondos glassmorphism).
   - Proporciona selectores de color interactivos (`<input type="color">`) para los campos Primario, Secundario y Fondo.
   - Implementa un control de tipo Toggle o Slider para activar/desactivar el redondeado y definir el valor del radio.
   - Añade un área de carga de imágenes (Drag & Drop) para el logotipo corporativo.

4. **Persistencia de Media con Vercel Blob Storage**:
   - Cuando el administrador suba una imagen de logotipo, no la guardes localmente.
   - Sube la imagen a **Vercel Blob Storage** (`@vercel/blob`) y recupera su URL pública de CDN (https://xxxx.public.blob.vercel-storage.com/logos/...) para guardarla en el campo `branding.logoUrl` del Tenant.

5. **Previsualizador Visual en Tiempo Real (Live Preview Box)**:
   - Crea un cuadro lateral de simulación interactiva que muestre una mini-vista simulada de la aplicación satélite.
   - Utiliza estados locales de React (`useState`) enlazados a los inputs del formulario para inyectar dinámicamente variables CSS inline sobre este cuadro simulado, de modo que el usuario vea cómo cambia el diseño al arrastrar o cambiar los selectores de color antes de pulsar "Guardar".

6. **Server Actions de Guardado**:
   - Implementa una Server Action segura con validación de roles de administrador de Tenant para actualizar la configuración de branding en MongoDB y limpiar cualquier caché activa.
```
