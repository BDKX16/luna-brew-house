"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { getMaintenanceStatus } from "@/services/landingConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Wrench, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MaintenanceCheckerProps {
  children: React.ReactNode;
}

export default function MaintenanceChecker({
  children,
}: MaintenanceCheckerProps) {
  const pathname = usePathname();
  const user = useSelector((state: any) => state.user);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Rutas que siempre están disponibles (login, admin, etc.)
  const allowedPaths = ["/auth/login", "/auth/registro", "/admin"];
  const isAllowedPath = allowedPaths.some((path) => pathname.startsWith(path));
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    checkMaintenanceStatus();

    // Verificar cada 30 segundos si el modo mantenimiento cambió
    const interval = setInterval(checkMaintenanceStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const { call } = getMaintenanceStatus();
      const response = await call;

      if (response && response.data) {
        setIsMaintenanceMode(response.data.data.maintenanceMode);
        setMaintenanceMessage(
          response.data.data.message ||
            "Sitio en mantenimiento. Volvemos pronto."
        );
      }
    } catch (error) {
      console.error("Error checking maintenance status:", error);
      // Si hay un error, asumir que no está en mantenimiento para no bloquear la app
      setIsMaintenanceMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras verifica el estado
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si está en modo mantenimiento pero es admin o está en ruta permitida, mostrar la app con banner
  if (isMaintenanceMode && (isAdmin || isAllowedPath)) {
    return (
      <>
        {isAdmin && (
          <div className="bg-orange-500 text-white text-center py-2 px-4 text-sm font-medium">
            <div className="flex items-center justify-center space-x-2">
              <Wrench className="w-4 h-4" />
              <span>
                Modo mantenimiento activo - Solo visible para administradores
              </span>
              <Link href="/admin/configuracion">
                <Button variant="secondary" size="sm" className="ml-4">
                  <Settings className="w-3 h-3 mr-1" />
                  Configurar
                </Button>
              </Link>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  // Si está en modo mantenimiento y no es admin ni ruta permitida, mostrar página de mantenimiento
  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Sitio en Mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <p className="text-gray-600 text-lg leading-relaxed">
                {maintenanceMessage}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500">
                Estamos trabajando para mejorar tu experiencia. Por favor,
                vuelve a intentarlo en unos minutos.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 mb-4">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span>Verificando estado cada 30 segundos...</span>
            </div>

            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Acceso de Administrador
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no está en mantenimiento, mostrar la aplicación normal
  return <>{children}</>;
}
