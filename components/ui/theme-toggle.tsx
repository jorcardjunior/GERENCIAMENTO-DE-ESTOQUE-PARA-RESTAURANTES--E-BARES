import { useThemeContext } from "@/hooks/theme-context";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full w-9 h-9 flex items-center justify-center transition-all duration-200 bg-surface-secondary hover:bg-surface-tertiary dark:bg-surface-tertiary dark:hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label={`Alternar para ${theme === "dark" ? "claro" : "escuro"} modo`}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  );
}
