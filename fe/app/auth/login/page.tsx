"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const { login, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("registered") === "true") {
      setShowRegistrationSuccess(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Convertir email a lowercase antes de enviar
      const normalizedEmail = email.toLowerCase().trim();
      const result = await login(normalizedEmail, password);
      console.log(result);
      if (result) {
        const redirectPath = searchParams?.get("redirect") || "/";
        router.push(redirectPath);
      } else {
        setError(result.error || "Error al iniciar sesión.");
      }
    } catch (err: any) {
      console.error("Error en login:", err);
      setError("Error inesperado. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el Enter en los inputs
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && email && password) {
      e.preventDefault();
      handleLogin(e as any);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="max-w-md w-full p-4">
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <Image
              src="/images/luna-logo.png"
              alt="Luna Brew House"
              fill
              className="object-contain"
            />
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
            <CardDescription>
              Accede a tu cuenta para comprar y gestionar tus suscripciones
            </CardDescription>
          </CardHeader>

          <CardContent>
            {showRegistrationSuccess && (
              <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  ¡Registro exitoso! Ya puedes iniciar sesión con tus
                  credenciales.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {error}
                    {error.includes("No existe una cuenta") && (
                      <div className="mt-2">
                        <Link
                          href="/auth/registro"
                          className="text-amber-600 hover:text-amber-800 underline font-medium"
                        >
                          Crear cuenta nueva
                        </Link>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </label>
                  <Link
                    href="/auth/recuperar-password"
                    className="text-xs text-amber-600 hover:text-amber-800"
                    tabIndex={-1}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-500">
              ¿No tienes una cuenta?{" "}
              <Link
                href="/auth/registro"
                className="text-amber-600 hover:text-amber-800"
              >
                Regístrate
              </Link>
            </div>

            <Link
              href="/"
              className="text-amber-700 hover:text-amber-900 text-sm text-center"
            >
              Volver a la página principal
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
