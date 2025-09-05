"use client";

import { useEffect } from "react";
import { useSEOConfig } from "@/hooks/useSEOConfig";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function SEOTestPage() {
  const {
    seoConfig,
    loading,
    error,
    updatePageTitle,
    updateMetaDescription,
    updateMetaTags,
  } = useSEOConfig();

  useEffect(() => {
    // Actualizar el título de la página cuando se carga
    updatePageTitle("Prueba de SEO Dinámico");
    updateMetaDescription(
      "Esta es una página de prueba para demostrar la funcionalidad de SEO dinámico con configuración del backend."
    );
  }, [updatePageTitle, updateMetaDescription]);

  const handleUpdateTitle = () => {
    const timestamp = new Date().toLocaleTimeString();
    updatePageTitle(`SEO Dinámico - ${timestamp}`);
  };

  const handleUpdateDescription = () => {
    updateMetaDescription(
      `Descripción actualizada dinámicamente a las ${new Date().toLocaleTimeString()}`
    );
  };

  const handleUpdateOGTags = () => {
    updateMetaTags({
      ogTitle: `Luna Brew House - Actualizado ${new Date().toLocaleTimeString()}`,
      ogDescription: "Metadata de Open Graph actualizada dinámicamente",
      title: `@LunaBrewHouse - ${new Date().toLocaleTimeString()}`,
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">
              Error al cargar configuración SEO
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de SEO Dinámico</CardTitle>
          <CardDescription>
            Esta página demuestra cómo funciona la configuración de SEO dinámico
            con datos del backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Configuración SEO Actual:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  Título del sitio
                </Badge>
                <p className="text-sm">
                  {seoConfig?.siteName || "Cargando..."}
                </p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">
                  Tagline
                </Badge>
                <p className="text-sm">{seoConfig?.tagline || "Cargando..."}</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">
                  Descripción SEO
                </Badge>
                <p className="text-sm">
                  {seoConfig?.seoDescription || "Cargando..."}
                </p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">
                  Keywords
                </Badge>
                <p className="text-sm">
                  {seoConfig?.seoKeywords || "Cargando..."}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Colores del tema:</h3>
            <div className="flex gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: seoConfig?.theme?.primaryColor }}
                />
                <span className="text-sm">
                  Primario: {seoConfig?.theme?.primaryColor}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: seoConfig?.theme?.secondaryColor }}
                />
                <span className="text-sm">
                  Secundario: {seoConfig?.theme?.secondaryColor}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: seoConfig?.theme?.accentColor }}
                />
                <span className="text-sm">
                  Acento: {seoConfig?.theme?.accentColor}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Acciones de prueba:</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleUpdateTitle} variant="outline">
                Actualizar Título
              </Button>
              <Button onClick={handleUpdateDescription} variant="outline">
                Actualizar Descripción
              </Button>
              <Button onClick={handleUpdateOGTags} variant="outline">
                Actualizar Open Graph
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Usa las herramientas de desarrollador del navegador para ver cómo
              cambian las meta tags dinámicamente.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Server-side SEO:</strong> La metadata inicial se genera en
              el servidor usando la configuración del backend.
            </p>
            <p>
              <strong>Client-side updates:</strong> Los cambios dinámicos se
              aplican usando JavaScript para actualizar las meta tags.
            </p>
            <p>
              <strong>Configuración centralizada:</strong> Todos los valores SEO
              se gestionan desde el panel de administración.
            </p>
            <p>
              <strong>Fallbacks:</strong> Si el backend no está disponible, se
              usan valores por defecto.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
