"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "estoque-rest-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(effectiveTheme: "light" | "dark") {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(effectiveTheme);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (savedTheme) return savedTheme;
    return getSystemTheme();
  });

  useEffect(() => {
    const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
    applyTheme(effectiveTheme);

    if (theme !== "system") {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = () => {
      if (theme === "system") {
        // Directly apply theme when system preference changes while in system mode
        applyTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === "system") {
        return getSystemTheme() === "dark" ? "light" : "dark";
      }
      return prev === "light" ? "dark" : "light";
    });
  }, []);

  const setThemeMode = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  return { theme, toggleTheme, setThemeMode };
}
