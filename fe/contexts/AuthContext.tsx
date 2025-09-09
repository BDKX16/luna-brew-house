"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login as loginService } from "@/services/public";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "@/redux/slices/userSlice";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch();
  const { callEndpoint } = useFetchAndLoad();

  useEffect(() => {
    // Solo ejecuta en el cliente
    if (typeof window !== "undefined") {
      const checkAuth = () => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("userData");

        if (!storedToken || !storedUser) {
          setIsLoading(false);
          return;
        }

        try {
          // Ensure storedUser is not undefined or "undefined" string before parsing
          if (storedUser && storedUser !== "undefined") {
            const userData = JSON.parse(storedUser);
            setUserState(userData);
            dispatch(setUser({ ...userData, token: storedToken }));
          } else {
            // Clear invalid data
            localStorage.removeItem("token");
            localStorage.removeItem("userData");
          }
        } catch (error) {
          console.error("Error parsing stored user data", error);
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [dispatch]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await callEndpoint(loginService(email, password));
      if (response && response.data) {
        const { token, userData } = response.data;
        const user = userData;
        // Guardar en localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(userData));

        // Actualizar estado y Redux
        setUserState(user);
        dispatch(setUser({ ...user, token }));

        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: "Credenciales inválidas" };
    } catch (error: any) {
      console.error("Login error", error);
      setIsLoading(false);

      // Retornar información específica del error
      if (error.response?.status === 401) {
        return { success: false, error: "Email o contraseña incorrectos." };
      } else if (error.response?.status === 404) {
        return {
          success: false,
          error: "No existe una cuenta con este email.",
        };
      } else if (error.response?.status === 400) {
        return {
          success: false,
          error: "Datos inválidos. Verifica tu email y contraseña.",
        };
      } else if (error.message?.includes("Network Error")) {
        return {
          success: false,
          error: "Error de conexión. Verifica tu internet.",
        };
      }

      return { success: false, error: "Error al iniciar sesión." };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setUserState(null);
    dispatch(clearUser());
    router.push("/auth/login");
  };

  const updateUser = (userData: any) => {
    const currentToken = localStorage.getItem("token");

    // Actualizar localStorage
    localStorage.setItem("userData", JSON.stringify(userData));

    // Actualizar estado local
    setUserState(userData);

    // Actualizar Redux
    dispatch(setUser({ ...userData, token: currentToken }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {isLoading ? <div>Cargando...</div> : children}
    </AuthContext.Provider>
  );
};

// Export default was missing which could cause import issues
export default AuthContext;
