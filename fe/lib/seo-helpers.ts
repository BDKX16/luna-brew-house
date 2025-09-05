import {
  getSEOConfig,
  generateMetadata as generateSEOMetadata,
} from "@/lib/seo";
import type { Metadata } from "next";

interface PageMetadataConfig {
  title?: string;
  description?: string;
  image?: string;
  canonicalPath?: string;
  keywords?: string;
}

/**
 * Helper para generar metadata de páginas de forma rápida
 */
export async function generatePageMetadata(
  config: PageMetadataConfig = {}
): Promise<Metadata> {
  const seoConfig = await getSEOConfig();

  // Usar los keywords personalizados si se proporcionan, sino usar los del config global
  const finalSeoConfig = config.keywords
    ? { ...seoConfig, seoKeywords: config.keywords }
    : seoConfig;

  return generateSEOMetadata(
    finalSeoConfig,
    config.title,
    config.description,
    config.image,
    config.canonicalPath
  );
}

/**
 * Metadata predefinida para páginas comunes
 */
export const pageMetadataConfigs = {
  home: {
    canonicalPath: "/",
  },
  products: {
    title: "Productos",
    description:
      "Descubre nuestra selección de cervezas artesanales premium. Varietales únicos elaborados con los mejores ingredientes.",
    canonicalPath: "/productos",
    keywords:
      "cerveza artesanal, craft beer, cervezas premium, varietales, ingredientes naturales",
  },
  subscriptions: {
    title: "Suscripciones",
    description:
      "Planes de suscripción personalizados para disfrutar de cervezas artesanales en casa. Entregas mensuales y descuentos exclusivos.",
    canonicalPath: "/suscripciones",
    keywords:
      "suscripción cerveza, planes mensuales, entrega domicilio, cerveza artesanal",
  },
  checkout: {
    title: "Checkout",
    description:
      "Finaliza tu compra de forma segura. Acepta múltiples métodos de pago y entregas rápidas.",
    canonicalPath: "/checkout",
    keywords: "comprar cerveza, checkout seguro, pago online, entrega rápida",
  },
  profile: {
    title: "Mi Perfil",
    description:
      "Gestiona tu perfil, suscripciones y historial de pedidos. Personaliza tu experiencia.",
    canonicalPath: "/perfil",
    keywords:
      "perfil usuario, gestión cuenta, historial pedidos, suscripciones",
  },
  auth: {
    login: {
      title: "Iniciar Sesión",
      description: "Accede a tu cuenta para gestionar pedidos y suscripciones.",
      canonicalPath: "/auth/login",
      keywords: "login, iniciar sesión, acceso cuenta",
    },
    register: {
      title: "Registro",
      description: "Crea tu cuenta y únete a la comunidad Luna Brew House.",
      canonicalPath: "/auth/registro",
      keywords: "registro, crear cuenta, unirse comunidad",
    },
  },
  admin: {
    title: "Administración",
    description:
      "Panel de administración para gestionar productos, pedidos y configuraciones.",
    canonicalPath: "/admin",
    keywords: "administración, panel admin, gestión productos",
  },
};

/**
 * Genera metadata usando configuraciones predefinidas
 */
export async function generatePredefinedMetadata(
  configKey: keyof typeof pageMetadataConfigs,
  subKey?: string
): Promise<Metadata> {
  let config: PageMetadataConfig = pageMetadataConfigs[
    configKey
  ] as PageMetadataConfig;

  // Manejar configuraciones anidadas como auth.login
  if (
    subKey &&
    typeof config === "object" &&
    config !== null &&
    subKey in config
  ) {
    config = (config as any)[subKey] as PageMetadataConfig;
  }

  return generatePageMetadata(config);
}
