import type React from "react";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ReduxProvider } from "@/redux/provider";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Luna Brew House - Cerveza Artesanal",
  description:
    "Cerveza artesanal con el alma de Luna. Elaborada con pasión en Mar del Plata por una familia con raíces vascas.",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ReduxProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
