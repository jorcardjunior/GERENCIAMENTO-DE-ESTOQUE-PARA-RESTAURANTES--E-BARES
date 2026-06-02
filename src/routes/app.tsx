import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useMemo } from "react";
import { LogOut, ClipboardList, Users, LayoutDashboard, ChefHat, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth/login" });
    }
  }, [user, loading, navigate]);

  const particles = useMemo(
    () => Array.from({ length: 20 }, () => ({
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 4 + 2}px`,
      delay: `${Math.random() * 12}s`,
      duration: `${Math.random() * 10 + 10}s`,
      opacity: Math.random() * 0.3 + 0.05,
    })),
    []
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const navItems = [
    { label: "Gestão", icon: LayoutDashboard, to: "/app/gestao" },
    { label: "Preenchimento", icon: ClipboardList, to: "/app/preenchimento" },
    { label: "Usuários", icon: Users, to: "/app/admin" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-emerald-500/30">
      {/* Animated Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/15 blur-[120px] animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] animate-blob-reverse" style={{ animationDelay: "1s" }} />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-emerald-600/15 blur-[120px] animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[40%] left-[40%] w-[25%] h-[25%] rounded-full bg-violet-500/8 blur-[100px] animate-blob-reverse" style={{ animationDelay: "3s", animationDuration: "7s" }} />
      </div>

      {/* Floating Particles */}
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
        {particles.map((p, i) => (
          <div key={i} className="particle" style={{
            left: p.left, bottom: 0, width: p.size, height: p.size,
            opacity: p.opacity, animationDelay: p.delay, animationDuration: p.duration,
          }} />
        ))}
      </div>

      {/* Light Sweep */}
      <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/[0.03] to-transparent sweep-light" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
        {/* Sidebar Desktop */}
        <aside className="hidden w-72 flex-col border-r border-white/5 bg-slate-950/40 backdrop-blur-2xl p-6 md:flex h-screen sticky top-0 shadow-2xl">
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <ChefHat className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white tracking-tighter leading-tight text-xl">SMART_ECO</span>
              <span className="text-xs font-bold text-emerald-500 tracking-[0.2em] uppercase -mt-1">Stock Pro</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Menu Principal</div>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition-all duration-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                activeProps={{ 
                  className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                }}
              >
                <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="mb-6 p-4 rounded-2xl bg-slate-900/50 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <span className="text-emerald-500 font-bold">{profile?.name?.[0] || 'U'}</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-white truncate">{profile?.name || 'Usuário'}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{profile?.role || 'Acesso'}</span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-12 rounded-xl transition-colors"
              onClick={() => signOut()}
            >
              <LogOut className="h-5 w-5" />
              Sair do Sistema
            </Button>
          </div>
        </aside>

        {/* Header Mobile */}
        <header className="flex h-20 items-center justify-between border-b border-white/5 bg-slate-950/60 backdrop-blur-xl px-6 md:hidden sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <ChefHat className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-black text-white tracking-tighter text-lg leading-none uppercase">ECO_STOCK</span>
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em]">Restaurante Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-xl bg-white/5 border-white/10">
              <Bell className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-10 overflow-x-hidden relative">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-6xl pb-32 md:pb-10"
          >
            <Outlet />
          </motion.div>
        </main>
        
        {/* Mobile Bottom Nav - Premium Floating Dock */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md md:hidden z-50">
          <nav className="h-18 rounded-[2rem] border border-white/10 bg-slate-900/60 backdrop-blur-3xl px-4 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="relative flex flex-col items-center gap-1 py-2 group"
                activeProps={{ className: "text-emerald-400" }}
                inactiveProps={{ className: "text-slate-500" }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active"
                        className="absolute inset-0 bg-emerald-500/10 rounded-2xl -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <item.icon className={cn("h-6 w-6 transition-transform duration-300", isActive && "scale-110")} />
                    <span className="text-[8px] font-black uppercase tracking-[0.1em]">{item.label}</span>
                  </>
                )}
              </Link>
            ))}
            <button 
              onClick={() => signOut()}
              className="flex flex-col items-center gap-1 text-slate-500 p-2"
            >
              <LogOut className="h-6 w-6" />
              <span className="text-[8px] font-black uppercase tracking-[0.1em]">Sair</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}