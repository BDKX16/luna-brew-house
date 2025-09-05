# Sistema de SEO Dinámico - Luna Brew House

Este documento describe el sistema de SEO dinámico implementado para permitir la configuración de meta tags y títulos desde el panel de administración.

## Arquitectura del Sistema

### 1. Configuración Server-Side

#### Funciones principales (`fe/lib/seo.ts`):

- **`getSEOConfig()`**: Obtiene la configuración SEO del backend de forma server-side
- **`generateMetadata()`**: Genera metadata compatible con Next.js para renderizado server-side

#### Características:

- Renderizado server-side para SEO óptimo
- Fallback a configuración por defecto si el backend no está disponible
- Soporte completo para Open Graph y Twitter Cards
- Configuración de colores de tema dinámica

### 2. Configuración Client-Side

#### Hook personalizado (`fe/hooks/useSEOConfig.ts`):

- **`useSEOConfig()`**: Hook para gestionar SEO dinámico en el cliente
- **`updatePageTitle()`**: Actualiza el título de la página dinámicamente
- **`updateMetaDescription()`**: Actualiza la meta descripción
- **`updateMetaTags()`**: Actualiza múltiples meta tags

#### Características:

- Actualizaciones en tiempo real
- Gestión de estado de carga y errores
- Integración con la configuración del backend

### 3. Helpers y Configuraciones Predefinidas

#### Archivo de helpers (`fe/lib/seo-helpers.ts`):

- **`generatePageMetadata()`**: Helper simplificado para generar metadata
- **`generatePredefinedMetadata()`**: Usa configuraciones predefinidas
- **`pageMetadataConfigs`**: Configuraciones predefinidas para páginas comunes

## Uso del Sistema

### 1. Configuración Server-Side (Páginas)

```typescript
// app/productos/page.tsx
import { generatePredefinedMetadata } from "@/lib/seo-helpers";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return generatePredefinedMetadata("products");
}

export default function ProductsPage() {
  return <ProductsClient />;
}
```

### 2. Configuración Personalizada

```typescript
// app/custom-page/page.tsx
import {
  getSEOConfig,
  generateMetadata as generateSEOMetadata,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const seoConfig = await getSEOConfig();
  return generateSEOMetadata(
    seoConfig,
    "Título Personalizado",
    "Descripción personalizada de la página",
    "/imagen-custom.jpg",
    "/ruta-canonica"
  );
}
```

### 3. Actualizaciones Dinámicas (Componentes Cliente)

```typescript
// components/MiComponente.tsx
"use client";
import { useSEOConfig } from "@/hooks/useSEOConfig";

export default function MiComponente() {
  const { updatePageTitle, updateMetaDescription, seoConfig } = useSEOConfig();

  const handleUpdate = () => {
    updatePageTitle("Nuevo Título");
    updateMetaDescription("Nueva descripción");
  };

  return (
    <div>
      <h1>{seoConfig?.siteName}</h1>
      <button onClick={handleUpdate}>Actualizar SEO</button>
    </div>
  );
}
```

## Configuraciones Predefinidas

El sistema incluye configuraciones predefinidas para páginas comunes:

- **`home`**: Página principal
- **`products`**: Página de productos
- **`subscriptions`**: Página de suscripciones
- **`checkout`**: Página de checkout
- **`profile`**: Perfil de usuario
- **`auth.login`**: Página de login
- **`auth.register`**: Página de registro
- **`admin`**: Panel de administración

## Estructura de Configuración SEO

```typescript
interface SEOConfig {
  siteName: string; // Nombre del sitio
  tagline: string; // Lema del sitio
  description: string; // Descripción general
  seoTitle: string; // Título SEO por defecto
  seoDescription: string; // Descripción SEO por defecto
  seoKeywords: string; // Keywords SEO
  ogImage: string; // Imagen Open Graph
  canonicalUrl: string; // URL canónica base
  favicon: string; // Favicon
  theme: {
    // Colores del tema
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
}
```

## Backend Integration

### API Endpoints:

- **GET `/api/landing/public`**: Obtiene configuración SEO (endpoint público)
- **GET `/api/landing/admin`**: Obtiene configuración completa (admin)
- **PUT `/api/landing/admin`**: Actualiza configuración (admin)

### Configuración en el Admin:

1. Navegar a `/admin/configuracion`
2. Ir a la pestaña "SEO & Meta"
3. Configurar:
   - Título SEO
   - Descripción SEO
   - Keywords
   - URL canónica
   - Imagen Open Graph
   - Favicon

## Características Avanzadas

### 1. Renderizado Server-Side

- Las meta tags se generan en el servidor antes del renderizado
- Optimizado para crawlers y social media bots
- Fallback automático si el backend no está disponible

### 2. Actualizaciones Dinámicas

- Cambios en tiempo real sin recargar la página
- Útil para aplicaciones SPA
- Mantiene sincronización con la configuración del backend

### 3. Gestión de Errores

- Fallback a configuración por defecto
- Manejo de errores de red
- Estados de carga apropiados

### 4. Optimización SEO

- Support completo para Open Graph
- Twitter Cards configuradas
- Meta tags de robots optimizadas
- Structured data friendly

## Testing

### Página de Pruebas

Visita `/seo-test` para ver una demostración del sistema en acción:

- Visualización de configuración actual
- Botones para probar actualizaciones dinámicas
- Información técnica del sistema

### Verificación

1. **Server-side**: Ver fuente de la página para verificar meta tags iniciales
2. **Client-side**: Usar DevTools para ver actualizaciones dinámicas
3. **Social Media**: Usar herramientas como Facebook Debugger o Twitter Card Validator

## Beneficios

1. **SEO Optimizado**: Renderizado server-side para mejor indexación
2. **Gestión Centralizada**: Configuración desde el panel admin
3. **Flexibilidad**: Configuraciones por página y actualizaciones dinámicas
4. **Mantenimiento**: Fácil actualización sin redeploy
5. **Performance**: Caching de configuración y fallbacks eficientes

## Próximas Mejoras

- [ ] Sitemap.xml dinámico basado en configuración
- [ ] robots.txt configurable
- [ ] Schema.org structured data
- [ ] Multilingual SEO support
- [ ] A/B testing para meta tags
- [ ] Analytics integration para tracking de performance SEO
