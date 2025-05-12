"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSelector } from "@/hooks/redux-hooks";
import ProtectedRoute from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const userRedux = useAppSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("personal");

  // Estados para edición de perfil
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    // Aquí iría la lógica para actualizar el perfil
    // const { call } = updateProfile({ name, email, phone, address });
    // await call;

    setTimeout(() => {
      setIsEditing(false);
      setIsUpdating(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-amber-700 text-white">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white">
                <Image
                  src="/images/luna-logo.png"
                  alt="Luna logo"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-bold">Luna Brew House</span>
            </Link>

            <Button
              onClick={logout}
              variant="outline"
              className="border-white text-white hover:bg-white/20"
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
            <p className="text-muted-foreground">
              Gestiona tu información personal y tus pedidos
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid grid-cols-3 md:w-[400px] mb-4">
              <TabsTrigger value="personal">Datos Personales</TabsTrigger>
              <TabsTrigger value="orders">Mis Pedidos</TabsTrigger>
              <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información personal</CardTitle>
                  <CardDescription>
                    Actualiza tus datos de contacto y dirección de envío
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Nombre completo
                        </label>
                        <Input
                          id="name"
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
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">
                          Teléfono
                        </label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="address"
                          className="text-sm font-medium"
                        >
                          Dirección de envío
                        </label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          className="bg-amber-600 hover:bg-amber-700"
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Guardando..." : "Guardar cambios"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          disabled={isUpdating}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Nombre
                          </h3>
                          <p className="mt-1">
                            {user?.name || userRedux.name || "No especificado"}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Email
                          </h3>
                          <p className="mt-1">
                            {user?.email ||
                              userRedux.email ||
                              "No especificado"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Teléfono
                          </h3>
                          <p className="mt-1">
                            {user?.phone || "No especificado"}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Dirección
                          </h3>
                          <p className="mt-1">
                            {user?.address || "No especificada"}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 bg-amber-600 hover:bg-amber-700"
                      >
                        Editar información
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de pedidos</CardTitle>
                  <CardDescription>
                    Consulta tus pedidos anteriores y su estado
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="text-center py-10">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-amber-600"
                      >
                        <circle cx="8" cy="21" r="1"></circle>
                        <circle cx="19" cy="21" r="1"></circle>
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                      </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      No tienes pedidos
                    </h3>
                    <p className="mb-6 text-muted-foreground">
                      Aún no has realizado ningún pedido en Luna Brew House
                    </p>
                    <Button
                      asChild
                      className="bg-amber-600 hover:bg-amber-700 rounded-full"
                    >
                      <Link href="/#cervezas">Ver nuestras cervezas</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mis suscripciones</CardTitle>
                  <CardDescription>
                    Gestiona tus suscripciones activas al Club Luna
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="text-center py-10">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-amber-600"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                      </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      Sin suscripciones activas
                    </h3>
                    <p className="mb-6 text-muted-foreground">
                      Únete a nuestro Club Luna y recibe cerveza artesanal cada
                      mes
                    </p>
                    <Button
                      asChild
                      className="bg-amber-600 hover:bg-amber-700 rounded-full"
                    >
                      <Link href="/#suscripciones">
                        Ver planes de suscripción
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
