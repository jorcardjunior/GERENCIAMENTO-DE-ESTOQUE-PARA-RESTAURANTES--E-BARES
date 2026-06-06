"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  Package,
  ClipboardList,
  Users,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  BarChart3,
  Settings,
  ChefHat,
  Shield,
  User,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/app/gestao", label: "Gestão de Estoque", icon: Package, adminOnly: false },
  { href: "/app/preenchimento", label: "Preenchimento", icon: ClipboardList, adminOnly: false },
  { href: "/app/relatorios", label: "Relatórios", icon: BarChart3, adminOnly: false },
  { href: "/app/usuarios", label: "Usuários", icon: Users, adminOnly: true },
  { href: "/app/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-200/60 text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  async function handleLogout() {
    await logout();
    toast.success("Sessão encerrada com sucesso");
    router.push("/auth/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-7 h-7 rounded-lg flex items-center justify-center">
              <ChefHat className="text-white w-4 h-4" />
            </div>
            <span className="font-black text-sm text-slate-800">
              Estoque<span className="text-blue-600">Rest</span>
            </span>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto shadow-xl lg:shadow-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <ChefHat className="text-white w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-sm">
                    Estoque<span className="text-blue-600">Rest</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Sistema de Gestão</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Menu Principal
              </p>
              {navItems
                .filter((item) => !item.adminOnly || user.role === "admin")
                .map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-400"}`} />
                      {item.label}
                    </Link>
                  );
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-slate-100">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 font-medium capitalize flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {user.role === "admin" ? "Administrador" : "Colaborador"}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
                    >
                      <Link
                        href="/app/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Meu Perfil
                      </Link>
                      <div className="border-t border-slate-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen pt-14 lg:pt-0">
          <div className="flex-1 p-4 lg:p-8">
            {children}
          </div>

          {/* Footer */}
          <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200/50 py-4 px-4 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-5 h-5 rounded-md flex items-center justify-center">
                  <ChefHat className="text-white w-3 h-3" />
                </div>
                <span className="font-bold text-slate-600">
                  Estoque<span className="text-blue-600">Rest</span>
                </span>
                <span className="hidden sm:inline">·</span>
                <span>© 2024</span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/about" className="hover:text-blue-500 transition-colors flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Sobre
                </Link>
                <Link href="/contact" className="hover:text-blue-500 transition-colors flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Contato
                </Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
