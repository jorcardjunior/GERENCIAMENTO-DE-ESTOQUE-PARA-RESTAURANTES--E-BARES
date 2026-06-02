"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Package, ClipboardList, Users, LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const navItems = [
  { href: "/app/gestao", label: "Gestão", icon: Package, adminOnly: true },
  { href: "/app/preenchimento", label: "Preenchimento", icon: ClipboardList, adminOnly: false },
  { href: "/app/usuarios", label: "Usuários", icon: Users, adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4ff]">
        <div className="animate-spin w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  async function handleLogout() {
    await logout();
    toast.success("Sessão encerrada");
    router.push("/auth/login");
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#e2e8f0] transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-3">
              <div className="bg-[#2563eb] w-9 h-9 rounded-lg flex items-center justify-center">
                <Package className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-[#0f172a] text-sm">Estoque</h2>
                <p className="text-xs text-[#64748b]">Restaurante</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#2563eb] text-white"
                        : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          <div className="p-4 border-t border-[#e2e8f0]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-sm font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0f172a] truncate">{user.name}</p>
                <p className="text-xs text-[#64748b] capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#dc2626] hover:bg-[#fef2f2] rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-[#e2e8f0]"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
