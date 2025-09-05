"use client";

import { useEffect, useState } from "react";
import { getLandingConfigPublic } from "@/services/landingConfig";

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
  },
};

export const useSEOConfig = () => {
  const [seoConfig, setSeoConfig] = useState<SEOConfig>(defaultSEOConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSEOConfig();
  }, []);

  const loadSEOConfig = async () => {
    try {
      const { call } = getLandingConfigPublic();
      const response = await call;

      if (response && response.data && response.data.status === "success") {
        const config = response.data.data;
        setSeoConfig({
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
        });
      }
    } catch (err) {
      console.error("Error loading SEO config:", err);
      setError("No se pudo cargar la configuración SEO");
      // Mantener la configuración por defecto en caso de error
    } finally {
      setLoading(false);
    }
  };

  const updatePageTitle = (pageTitle?: string) => {
    const title = pageTitle
      ? `${pageTitle} | ${seoConfig.siteName}`
      : seoConfig.seoTitle;

    document.title = title;
  };

  const updateMetaDescription = (description?: string) => {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        description || seoConfig.seoDescription
      );
    }
  };

  const updateMetaTags = (customMeta?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  }) => {
    // Actualizar título
    if (customMeta?.title) {
      updatePageTitle(customMeta.title);
    }

    // Actualizar descripción
    if (customMeta?.description) {
      updateMetaDescription(customMeta.description);
    }

    // Actualizar keywords
    if (customMeta?.keywords) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute("content", customMeta.keywords);
      }
    }

    // Actualizar Open Graph
    const updateOGTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement("meta");
        ogTag.setAttribute("property", property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute("content", content);
    };

    if (customMeta?.ogTitle) {
      updateOGTag("og:title", customMeta.ogTitle);
    }
    if (customMeta?.ogDescription) {
      updateOGTag("og:description", customMeta.ogDescription);
    }
    if (customMeta?.ogImage) {
      updateOGTag("og:image", customMeta.ogImage);
    }
  };

  return {
    seoConfig,
    loading,
    error,
    updatePageTitle,
    updateMetaDescription,
    updateMetaTags,
    reload: loadSEOConfig,
  };
};
