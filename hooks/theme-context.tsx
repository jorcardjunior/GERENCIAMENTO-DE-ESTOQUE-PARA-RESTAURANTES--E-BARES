"use client";

import { type ReactNode, createContext, useContext, useEffect } from "react";
import { useTheme } from "./use-theme";

export type Theme = "light" | "dark" | "system";

const ThemeContext = createContext({
  theme: "light" as Theme,
  toggleTheme: () => {},
  setThemeMode: (_theme: Theme) => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeValues = useTheme();

  useEffect(() => {
    try {
      const prefs = localStorage.getItem("user_prefs");
      if (prefs) {
        const parsed = JSON.parse(prefs);
        if (parsed.fontSize) {
          document.documentElement.dataset.fontSize = parsed.fontSize;
        }
      }
    } catch {}
  }, []);

  return <ThemeContext.Provider value={themeValues}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
