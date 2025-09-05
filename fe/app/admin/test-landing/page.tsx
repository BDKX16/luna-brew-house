"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import {
  getLandingConfigPublic,
  getMaintenanceStatus,
  getLandingConfigAdmin,
  updateLandingConfig,
} from "@/services/landingConfig";

export default function TestLandingPage() {
  const [publicConfig, setPublicConfig] = useState(null);
  const [adminConfig, setAdminConfig] = useState(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const testPublicConfig = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getLandingConfigPublic();
      console.log("Public config result:", result);
      setPublicConfig(result);
    } catch (error) {
      setError("Error al obtener configuración pública: " + error.message);
    }
    setLoading(false);
  };

  const testAdminConfig = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getLandingConfigAdmin();
      console.log("Admin config result:", result);
      setAdminConfig(result);
    } catch (error) {
      setError("Error al obtener configuración admin: " + error.message);
    }
    setLoading(false);
  };

  const testMaintenanceStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getMaintenanceStatus();
      console.log("Maintenance status result:", result);
      setMaintenanceStatus(result);
    } catch (error) {
      setError("Error al obtener estado de mantenimiento: " + error.message);
    }
    setLoading(false);
  };

  const toggleMaintenance = async () => {
    if (!adminConfig?.success) {
      setError("Primero carga la configuración admin");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const currentMode = adminConfig.data.maintenance.isActive;
      const updateData = {
        siteName: adminConfig.data.siteName,
        tagline: adminConfig.data.tagline,
        description: adminConfig.data.description,
        logo: adminConfig.data.logo || "",
        favicon: adminConfig.data.favicon || "",
        seoTitle: adminConfig.data.seoTitle,
        seoDescription: adminConfig.data.seoDescription,
        seoKeywords: adminConfig.data.seoKeywords,
        ogImage: adminConfig.data.ogImage || "",
        canonicalUrl: adminConfig.data.canonicalUrl || "",
        primaryColor: adminConfig.data.theme.primaryColor,
        secondaryColor: adminConfig.data.theme.secondaryColor,
        accentColor: adminConfig.data.theme.accentColor,
        backgroundColor: adminConfig.data.theme.backgroundColor,
        textColor: adminConfig.data.theme.textColor,
        fontFamily: adminConfig.data.theme.fontFamily,
        fontSize: adminConfig.data.theme.fontSize,
        borderRadius: adminConfig.data.theme.borderRadius,
        maintenanceMode: !currentMode,
        maintenanceMessage: adminConfig.data.maintenance.message,
        maintenanceAllowedIPs: adminConfig.data.maintenance.allowedIPs,
      };

      const result = await updateLandingConfig(updateData);
      console.log("Update result:", result);

      if (result.success) {
        // Recargar configuración admin
        await testAdminConfig();
      } else {
        setError("Error al actualizar: " + result.error);
      }
    } catch (error) {
      setError("Error al cambiar modo mantenimiento: " + error.message);
    }
    setLoading(false);
  };

  const renderStatus = (result, title) => {
    if (!result) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.success ? (
            <div className="space-y-2">
              <Badge variant="outline" className="text-green-600">
                Éxito
              </Badge>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge variant="destructive">Error</Badge>
              {result.maintenance && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Sitio en modo mantenimiento: {result.message}
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-red-600">{result.error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Test Landing Configuration</h1>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button onClick={testPublicConfig} disabled={loading} variant="outline">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Test Public Config"
          )}
        </Button>

        <Button onClick={testAdminConfig} disabled={loading} variant="outline">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Test Admin Config"
          )}
        </Button>

        <Button
          onClick={testMaintenanceStatus}
          disabled={loading}
          variant="outline"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Test Maintenance Status"
          )}
        </Button>

        <Button
          onClick={toggleMaintenance}
          disabled={loading || !adminConfig?.success}
          variant={
            adminConfig?.data?.maintenance?.isActive ? "destructive" : "default"
          }
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : adminConfig?.data?.maintenance?.isActive ? (
            "Desactivar Mantenimiento"
          ) : (
            "Activar Mantenimiento"
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {renderStatus(publicConfig, "Configuración Pública")}
        {renderStatus(adminConfig, "Configuración Admin")}
        {renderStatus(maintenanceStatus, "Estado de Mantenimiento")}
      </div>
    </div>
  );
}
