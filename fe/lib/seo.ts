// Función server-side para obtener configuración de SEO
import axios from "axios";

interface SEOConfig {
  siteName: string;
  tagline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  canonicalUrl: string;
  favicon: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
}

const defaultSEOConfig: SEOConfig = {
  siteName: "Luna Brew House",
  tagline: "Cervezas Artesanales Premium",
  description: "Descubre nuestras cervezas artesanales únicas",
  seoTitle: "Luna Brew House - Cervezas Artesanales Premium",
  seoDescription:
    "Disfruta de las mejores cervezas artesanales con entrega a domicilio y planes de suscripción personalizados.",
  seoKeywords:
    "cerveza artesanal, craft beer, suscripción cerveza, entrega domicilio",
  ogImage: "",
  canonicalUrl: "",
  favicon: "",
  theme: {
    primaryColor: "#1a365d",
    secondaryColor: "#2d5a87",
    accentColor: "#f6ad55",
    backgroundColor: "#ffffff",
    textColor: "#2d3748",
  },
};

export async function getSEOConfig(): Promise<SEOConfig> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    const response = await axios.get(`${baseUrl}/landing/public`, {
      timeout: 5000, // 5 segundos timeout
    });

    if (response.data && response.data.status === "success") {
      const config = response.data.data;

      return {
        siteName: config.siteName || defaultSEOConfig.siteName,
        tagline: config.tagline || defaultSEOConfig.tagline,
        description: config.description || defaultSEOConfig.description,
        seoTitle: config.seoTitle || defaultSEOConfig.seoTitle,
        seoDescription:
          config.seoDescription || defaultSEOConfig.seoDescription,
        seoKeywords: config.seoKeywords || defaultSEOConfig.seoKeywords,
        ogImage: config.ogImage || defaultSEOConfig.ogImage,
        canonicalUrl: config.canonicalUrl || defaultSEOConfig.canonicalUrl,
        favicon: config.favicon || defaultSEOConfig.favicon,
        theme: config.theme || defaultSEOConfig.theme,
      };
    }
  } catch (error) {
    console.error("Error fetching SEO config server-side:", error);
  }

  // Retornar configuración por defecto si hay error
  return defaultSEOConfig;
}

export function generateMetadata(
  seoConfig: SEOConfig,
  pageTitle?: string,
  pageDescription?: string,
  pageImage?: string,
  canonicalPath?: string
) {
  const title = pageTitle
    ? `${pageTitle} | ${seoConfig.siteName}`
    : seoConfig.seoTitle;

  const description = pageDescription || seoConfig.seoDescription;
  const image = pageImage || seoConfig.ogImage;
  const canonical = canonicalPath
    ? `${seoConfig.canonicalUrl || ""}${canonicalPath}`
    : seoConfig.canonicalUrl;

  return {
    title,
    description,
    keywords: seoConfig.seoKeywords,
    authors: [{ name: seoConfig.siteName }],
    creator: seoConfig.siteName,
    publisher: seoConfig.siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: seoConfig.canonicalUrl
      ? new URL(seoConfig.canonicalUrl)
      : undefined,
    alternates: canonical
      ? {
          canonical: canonical,
        }
      : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: seoConfig.siteName,
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
      locale: "es_ES",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
      creator: `@${seoConfig.siteName.replace(/\s+/g, "")}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
    icons: seoConfig.favicon
      ? {
          icon: seoConfig.favicon,
          shortcut: seoConfig.favicon,
          apple: seoConfig.favicon,
        }
      : undefined,
    manifest: "/manifest.json",
    other: {
      "theme-color": seoConfig.theme.primaryColor,
      "msapplication-TileColor": seoConfig.theme.primaryColor,
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
    },
  };
}
