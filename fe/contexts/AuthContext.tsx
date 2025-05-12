"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login as loginService } from "@/services/public";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "@/redux/slices/userSlice";

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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
          const userData = JSON.parse(storedUser);
          setUserState(userData);
          dispatch(setUser({ ...userData, token: storedToken }));
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
      const { call, controller } = loginService(email, password);
      const response = await call;

      if (response && response.data) {
        const { token, user } = response.data;
        // Guardar en localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(user));

        // Actualizar estado y Redux
        setUserState(user);
        dispatch(setUser({ ...user, token }));

        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Login error", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setUserState(null);
    dispatch(clearUser());
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {isLoading ? <div>Cargando...</div> : children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
