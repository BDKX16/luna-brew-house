import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Por ahora usamos valores estáticos, más adelante se puede integrar con la configuración
    const manifest = {
      name: "Luna Brew House",
      short_name: "Luna Brew",
      description:
        "Cervezas Artesanales Premium con entrega a domicilio y planes de suscripción",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#1a365d",
      orientation: "portrait-primary",
      scope: "/",
      lang: "es-ES",
      dir: "ltr",
      categories: ["food", "shopping", "lifestyle"],
      icons: [
        {
          src: "/placeholder-logo.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          src: "/placeholder-logo.png",
          sizes: "96x96",
          type: "image/png",
        },
        {
          src: "/placeholder-logo.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/placeholder-logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
      shortcuts: [
        {
          name: "Ver Productos",
          short_name: "Productos",
          description: "Ver catálogo de cervezas artesanales",
          url: "/productos",
          icons: [
            {
              src: "/placeholder-logo.png",
              sizes: "96x96",
            },
          ],
        },
        {
          name: "Suscripciones",
          short_name: "Planes",
          description: "Ver planes de suscripción",
          url: "/suscripciones",
          icons: [
            {
              src: "/placeholder-logo.png",
              sizes: "96x96",
            },
          ],
        },
        {
          name: "Mi Perfil",
          short_name: "Perfil",
          description: "Gestionar perfil y pedidos",
          url: "/perfil",
          icons: [
            {
              src: "/placeholder-logo.png",
              sizes: "96x96",
            },
          ],
        },
      ],
      prefer_related_applications: false,
    };

    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=86400", // Cache por 24 horas
      },
    });
  } catch (error) {
    console.error("Error generating manifest:", error);

    // Fallback manifest básico
    const fallbackManifest = {
      name: "Luna Brew House",
      short_name: "Luna Brew",
      description: "Cervezas Artesanales Premium",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#1a365d",
      icons: [
        {
          src: "/placeholder-logo.png",
          sizes: "192x192",
          type: "image/png",
        },
      ],
    };

    return NextResponse.json(fallbackManifest, {
      headers: {
        "Content-Type": "application/manifest+json",
      },
    });
  }
}
