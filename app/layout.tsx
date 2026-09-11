import { SkipToContent } from "@/components/ui/skip-to-content";
import { ThemeProvider } from "@/hooks/theme-context";
import { AuthProvider } from "@/hooks/use-auth";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estoque - Restaurante",
  description: "Gerenciamento de Estoque",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('estoque-rest-theme');
                var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (!theme) theme = 'system';
                var effective = theme === 'system' ? (supportDark ? 'dark' : 'light') : theme;
                document.documentElement.classList.add(effective);
                var prefs = localStorage.getItem('user_prefs');
                if (prefs) {
                  var parsed = JSON.parse(prefs);
                  if (parsed.fontSize) document.documentElement.dataset.fontSize = parsed.fontSize;
                }
              } catch (e) {}
            `,
          }}
        />
      </head>

      <body suppressHydrationWarning className="antialiased">
        <SkipToContent />
        <ThemeProvider>
          <AuthProvider>
            <main id="main-content">{children}</main>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
