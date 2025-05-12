"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const validatePassword = () => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (password !== confirmPassword) {
      return "Las contraseñas no coinciden";
    }
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    setIsLoading(true);

    try {
      const success = await register(name, email, password);

      if (success) {
        // Redirigir al usuario a login con un parámetro para mostrar mensaje de éxito
        router.push("/auth/login?registered=true");
      } else {
        setError("No se pudo completar el registro. Intenta de nuevo.");
      }
    } catch (err: any) {
      console.error("Error en registro:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Error al registrarse. Por favor, intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
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
            <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
            <CardDescription>
              Regístrate para comprar y disfrutar de nuestras cervezas
              artesanales
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nombre completo
                </label>
                <Input
                  id="name"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  La contraseña debe tener al menos 8 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirmar contraseña
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) =>
                    setAcceptTerms(checked as boolean)
                  }
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-500 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Acepto los{" "}
                  <Link
                    href="/terminos"
                    className="text-amber-600 hover:text-amber-800"
                  >
                    términos y condiciones
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={isLoading}
              >
                {isLoading ? "Creando cuenta..." : "Registrarse"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-500">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/auth/login"
                className="text-amber-600 hover:text-amber-800"
              >
                Iniciar sesión
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
