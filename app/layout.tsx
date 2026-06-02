import type { Metadata } from "next";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estoque - Restaurante",
  description: "Gerenciamento de Estoque",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
