"use client";

import { useThemeContext } from "@/hooks/theme-context";
import { DollarSign, LayoutDashboard, Moon, Package, Plus, Search, Sun, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const { theme, setThemeMode } = useThemeContext();
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const items = React.useMemo(() => {
    const all = [
      {
        label: "Ir para Dashboard",
        icon: LayoutDashboard,
        action: () => router.push("/app/dashboard"),
        group: "Navegação",
      },
      {
        label: "Abrir Financeiro",
        icon: DollarSign,
        action: () => router.push("/app/financeiro"),
        group: "Navegação",
      },
      {
        label: "Gerenciar Itens",
        icon: Package,
        action: () => router.push("/app/gestao"),
        group: "Navegação",
      },
      {
        label: "Adicionar Novo Item",
        icon: Plus,
        action: () => router.push("/app/gestao"),
        group: "Ações Rápidas",
      },
      {
        label: `Alternar para Modo ${theme === "dark" ? "Claro" : "Escuro"}`,
        icon: theme === "dark" ? Sun : Moon,
        action: () => setThemeMode(theme === "dark" ? "light" : "dark"),
        group: "Ações Rápidas",
      },
    ];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, theme, router, setThemeMode]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[selectedIndex]) {
          runCommand(items[selectedIndex].action);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, items, selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4">
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      />
      <div className="relative w-full max-w-xl bg-surface border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-5 h-5 text-text-tertiary mr-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que você deseja fazer?"
            className="w-full h-14 bg-transparent border-none outline-none text-text placeholder:text-text-tertiary text-sm"
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-surface-tertiary px-1.5 font-mono text-[10px] font-medium text-text-tertiary">
            ESC
          </kbd>
        </div>

        <div className="max-h-[350px] overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="text-center text-text-tertiary text-sm py-8">
              Nenhum resultado encontrado
            </p>
          )}
          {["Navegação", "Ações Rápidas"].map((group) => {
            const groupItems = items
              .map((item, idx) => ({ ...item, idx }))
              .filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group} className="px-3 py-2">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2">
                  {group}
                </p>
                <div className="space-y-1">
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => runCommand(item.action)}
                        onMouseEnter={() => setSelectedIndex(item.idx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                          selectedIndex === item.idx
                            ? "bg-brand-500/10 text-brand-600"
                            : "text-text-secondary hover:bg-brand-500/10 hover:text-brand-600"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${selectedIndex === item.idx ? "text-brand-500" : "text-text-tertiary"}`}
                        />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-surface-tertiary/50 px-4 py-3 flex items-center justify-between border-t border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-surface px-1.5 font-mono text-[10px] text-text-tertiary">
                ↑↓
              </kbd>
              <span className="text-[10px] text-text-tertiary">Navegar</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-surface px-1.5 font-mono text-[10px] text-text-tertiary">
                Enter
              </kbd>
              <span className="text-[10px] text-text-tertiary">Selecionar</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-brand-500" />
            <span className="text-[10px] font-bold text-brand-600 uppercase">Ação Rápida</span>
          </div>
        </div>
      </div>
    </div>
  );
}
