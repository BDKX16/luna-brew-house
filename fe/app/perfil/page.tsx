"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProfileDashboard from "@/components/profile/ProfileDashboard";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated and not currently loading
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/perfil");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Avoid flash of unauthorized page before redirect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>
      {user && <ProfileDashboard user={user} />}
    </div>
  );
}
