import type React from "react";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ReduxProvider } from "@/redux/ReduxProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import MaintenanceChecker from "@/components/MaintenanceChecker";
import {
  getSEOConfig,
  generateMetadata as generateSEOMetadata,
} from "@/lib/seo";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const seoConfig = await getSEOConfig();
  return generateSEOMetadata(seoConfig);
}

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
              <MaintenanceChecker>{children}</MaintenanceChecker>
            </ThemeProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
