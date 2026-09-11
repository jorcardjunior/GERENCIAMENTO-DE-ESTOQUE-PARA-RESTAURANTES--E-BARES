"use client";
import { useThemeContext } from "@/hooks/theme-context";
import { ROLE_LABELS, isManagerRole, useAuth } from "@/hooks/use-auth";
import {
  ArrowLeftRight,
  BarChart3,
  BrainCircuit,
  ChefHat,
  ChevronDown,
  ClipboardList,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  RefreshCw,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Store,
  Sun,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const CommandPalette = dynamic(
  () => import("@/components/ui/command-palette").then((m) => m.CommandPalette),
  { ssr: false, loading: () => null },
);
const AIGuide = dynamic(() => import("@/components/ui/ai-guide").then((m) => m.AIGuide), {
  ssr: false,
  loading: () => null,
});
const WelcomeTour = dynamic(
  () => import("@/components/ui/welcome-tour").then((m) => m.WelcomeTour),
  { ssr: false, loading: () => null },
);
const NotificationBell = dynamic(
  () => import("@/components/ui/notification-bell").then((m) => m.NotificationBell),
  { ssr: false, loading: () => null },
);

const navItems = [
  { href: "/app/dashboard", label: "Tela Inicial", icon: LayoutDashboard, adminOnly: false },
  { href: "/app/gestao", label: "Gestão de Estoque", icon: Package, adminOnly: false },
  { href: "/app/estabelecimentos", label: "Estabelecimentos", icon: Store, adminOnly: false },
  { href: "/app/fichas-tecnicas", label: "Fichas Técnicas", icon: FileText, adminOnly: false },
  { href: "/app/pedidos-compra", label: "Pedidos de Compra", icon: ShoppingCart, adminOnly: false },
  { href: "/app/transferencias", label: "Transferências", icon: ArrowLeftRight, adminOnly: false },
  { href: "/app/financeiro", label: "Financeiro", icon: DollarSign, adminOnly: true },
  { href: "/app/bi", label: "Indicadores", icon: BrainCircuit, adminOnly: true },
  {
    href: "/app/bi/sugestao-compra",
    label: "Sugestão de Compra",
    icon: ShoppingBag,
    adminOnly: false,
  },
  { href: "/app/importar", label: "Importar", icon: Upload, adminOnly: false },
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
  const { theme, toggleTheme } = useThemeContext();
  const [switchModal, setSwitchModal] = useState(false);
  const [switchEmail, setSwitchEmail] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [switchLoading, setSwitchLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface to-brand-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm font-medium">Carregando...</p>
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

  async function handleSwitchUser(e: React.FormEvent) {
    e.preventDefault();
    setSwitchLoading(true);
    try {
      const res = await fetch("/api/auth/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: switchEmail, targetPassword: switchPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao trocar de usuário");
      toast.success(`Trocado para ${data.user.name || data.user.email}`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSwitchLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary text-text flex flex-col transition-colors duration-300">
      {/* Fixed Top Right Controls */}
      <div className="hidden lg:flex fixed top-5 right-0 z-50 items-center gap-1 pr-3">
        <NotificationBell />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl glass border-brand-500/20 hover:scale-110 active:scale-95 transition-all group shadow-elevated"
          aria-label={`Alternar para ${theme === "dark" ? "claro" : "escuro"}`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-yellow-400 group-hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-brand-600 group-hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>

      <CommandPalette />
      <AIGuide />
      <WelcomeTour />
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-text-secondary" />
            ) : (
              <Menu className="w-5 h-5 text-text-secondary" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 w-7 h-7 rounded-lg flex items-center justify-center">
              <ChefHat className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-text">
              Estoque<span className="text-brand-600">Rest</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors"
              aria-label={`Alternar para ${theme === "dark" ? "claro" : "escuro"}`}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-text-secondary" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-surface border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-5 border-b border-border-light">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-brand-500 to-brand-700 w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-brand-500/15">
                  <ChefHat className="text-white w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text tracking-tight">
                    Estoque<span className="text-brand-600">Rest</span>
                  </p>
                  <p className="text-[11px] text-text-tertiary">Sistema de Gestão</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {navItems
                .filter((item) => !item.adminOnly || isManagerRole(user.role))
                .map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                          : "text-text-secondary hover:bg-surface-secondary hover:text-text"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${active ? "text-brand-600" : "text-text-tertiary"}`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
            </nav>

            {/* User Section */}
            <div className="p-3 border-t border-border-light">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-text truncate">{user.name}</p>
                    <p className="text-[11px] text-text-tertiary truncate flex items-center gap-1">
                      <Shield className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {ROLE_LABELS[user.role] || user.role}
                        {user.companyName ? ` · ${user.companyName}` : ""}
                      </span>
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-text-tertiary transition-transform shrink-0 ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface rounded-xl border border-border shadow-elevated overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
                    <Link
                      href="/app/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </Link>
                    <button
                      onClick={() => {
                        setSwitchModal(true);
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-secondary transition-colors border-t border-border-light"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Trocar Usuário
                    </button>
                    <div className="border-t border-border-light" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                )}
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
          <div className="flex-1 p-6 lg:pr-20">{children}</div>

          {/* Footer */}
          <footer className="border-t border-border-light py-3 px-6 lg:pr-20">
            <div className="flex items-center justify-between text-xs text-text-tertiary">
              <span>© 2024 EstoqueRest</span>
              <div className="flex items-center gap-3">
                <Link href="/about" className="hover:text-text-secondary transition-colors">
                  Sobre
                </Link>
                <Link href="/contact" className="hover:text-text-secondary transition-colors">
                  Contato
                </Link>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {switchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border shadow-elevated w-full max-w-md p-6 mx-4">
            <h2 className="text-lg font-bold text-text mb-1">Trocar de Usuário</h2>
            <p className="text-sm text-text-tertiary mb-5">
              Informe o email e a senha do usuário para o qual deseja trocar.
            </p>
            <form onSubmit={handleSwitchUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Email do usuário
                </label>
                <input
                  type="email"
                  value={switchEmail}
                  onChange={(e) => setSwitchEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-text placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Senha do usuário
                </label>
                <input
                  type="password"
                  value={switchPassword}
                  onChange={(e) => setSwitchPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-text placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSwitchModal(false);
                    setSwitchEmail("");
                    setSwitchPassword("");
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface-secondary transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={switchLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  {switchLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                      Trocando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" /> Trocar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
