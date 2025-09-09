"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, CheckCircle, Crown } from "lucide-react";
import Link from "next/link";

interface ProfileHeaderProps {
  title?: string;
  subtitle?: string;
  backUrl?: string;
  backLabel?: string;
  showUserInfo?: boolean;
  stats?: Array<{
    icon: React.ComponentType<any>;
    value: string | number;
    label: string;
    color: string;
  }>;
}

export default function ProfileHeader({
  title,
  subtitle,
  backUrl = "/perfil",
  backLabel = "Volver al Perfil",
  showUserInfo = false,
  stats = [],
}: ProfileHeaderProps) {
  const { user } = useAuth();

  // Determinar si es admin (esto debería venir del contexto de auth)
  const isAdmin = user?.role === "admin" || user?.isAdmin;

  const userInfo = {
    name: user?.name || user?.fullName || "Usuario",
    email: user?.email || "",
    memberSince: user?.createdAt
      ? new Date(user.createdAt).getFullYear()
      : new Date().getFullYear(),
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
      <div className="container py-6 md:py-8">
        {/* Para página principal de perfil con información completa */}
        {showUserInfo && (
          <>
            {/* Header compacto para mobile, expandido para desktop */}
            <div className="flex items-start gap-3 md:gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12 md:h-24 md:w-24 ring-2 ring-amber-200 ring-offset-2 md:ring-4 md:ring-offset-4">
                  <AvatarImage
                    src="/professional-avatar.png"
                    alt={userInfo.name}
                  />
                  <AvatarFallback className="text-sm md:text-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                    {userInfo.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 md:p-1">
                  <CheckCircle className="h-2 w-2 md:h-4 md:w-4 text-white" />
                </div>
              </div>

              {/* Contenido del header */}
              <div className="flex-1 min-w-0">
                {/* Título, badge y botón */}
                <div className="flex items-center justify-between gap-2 md:gap-3 mb-1 md:mb-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <h1 className="text-lg md:text-3xl font-bold text-gray-900 truncate">
                      {userInfo.name}
                    </h1>
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                      <Crown className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                      {isAdmin ? "Admin" : "Premium"}
                    </Badge>
                  </div>

                  {/* Botón de navegación pequeño a la derecha */}
                  <Link href={backUrl}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 hover:bg-amber-50 text-xs px-2 py-1 h-auto"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Volver
                    </Button>
                  </Link>
                </div>

                {/* Info de miembro */}
                <p className="text-xs md:text-gray-600 mb-2 md:mb-3 text-gray-500">
                  Miembro desde {userInfo.memberSince} • Cervecero apasionado
                </p>

                {/* Stats */}
                {stats.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
                    {stats.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 md:flex-col md:text-center bg-white/60 backdrop-blur-sm rounded-lg p-2 md:p-0 md:bg-transparent"
                        >
                          <div
                            className={`flex-shrink-0 w-6 h-6 md:w-12 md:h-12 rounded-full flex items-center justify-center ${stat.color} md:mb-2`}
                          >
                            <Icon className="h-3 w-3 md:h-6 md:w-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm md:text-2xl font-semibold md:font-bold text-gray-900 leading-none md:mb-1">
                              {stat.value}
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 truncate">
                              {stat.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Para otras páginas con título y subtítulo simples */}
        {!showUserInfo && (
          <>
            {/* Botón de navegación */}
            <div className="flex items-center gap-4 mb-6">
              <Link href={backUrl}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 hover:bg-amber-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {backLabel}
                </Button>
              </Link>
            </div>

            {/* Título y subtítulo */}
            {(title || subtitle) && (
              <div>
                {title && (
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                )}
                {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
