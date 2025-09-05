"use client";

import { useState } from "react";
import { checkCurrentIP } from "@/services/landingConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Network, Shield } from "lucide-react";

export default function TestMaintenancePage() {
  const [ipInfo, setIpInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkIP = async () => {
    setLoading(true);
    try {
      const { call } = checkCurrentIP();
      const response = await call;

      if (response && response.data) {
        setIpInfo(response.data.data);
      }
    } catch (error) {
      console.error("Error checking IP:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Network className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Test de Modo Mantenimiento</h1>
          <p className="text-muted-foreground">
            Verifica el estado del modo mantenimiento y tu IP actual
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Información de IP y Mantenimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkIP} disabled={loading} className="w-full">
            {loading ? "Verificando..." : "Verificar IP Actual"}
          </Button>

          {ipInfo && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    IP Cliente (Limpia)
                  </label>
                  <div className="text-lg font-mono bg-white p-2 rounded border">
                    {ipInfo.clientIP}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    IP Original
                  </label>
                  <div className="text-lg font-mono bg-white p-2 rounded border">
                    {ipInfo.originalIP}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Estado de Acceso
                </label>
                <div className="mt-1">
                  <Badge
                    variant={ipInfo.isAllowed ? "default" : "destructive"}
                    className="text-lg px-3 py-1"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    {ipInfo.isAllowed ? "Permitido" : "Bloqueado"}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Modo Mantenimiento
                </label>
                <div className="mt-1">
                  <Badge
                    variant={ipInfo.maintenanceMode ? "destructive" : "default"}
                    className="text-lg px-3 py-1"
                  >
                    {ipInfo.maintenanceMode ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  IPs Permitidas
                </label>
                <div className="bg-white p-2 rounded border">
                  {ipInfo.allowedIPs && ipInfo.allowedIPs.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {ipInfo.allowedIPs.map((ip, index) => (
                        <li key={index} className="font-mono text-sm">
                          {ip}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500 italic">
                      Ninguna IP específica configurada
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Headers de Red
                </label>
                <div className="bg-white p-2 rounded border">
                  <pre className="text-xs">
                    {JSON.stringify(ipInfo.headers, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones de Prueba</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>
              <strong>1.</strong> Ve a la página de configuración
              (/admin/configuracion)
            </p>
            <p>
              <strong>2.</strong> Activa el modo mantenimiento
            </p>
            <p>
              <strong>3.</strong> Haz clic en "Verificar IP Actual" arriba
            </p>
            <p>
              <strong>4.</strong> Si tu IP no está en la lista de permitidas, no
              podrás acceder desde otro dispositivo
            </p>
            <p>
              <strong>5.</strong> Agrega tu IP actual a la lista de permitidas
              si quieres acceso desde otros dispositivos
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Las IPs locales (127.0.0.1, 192.168.x.x,
              etc.) se permiten automáticamente en desarrollo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
