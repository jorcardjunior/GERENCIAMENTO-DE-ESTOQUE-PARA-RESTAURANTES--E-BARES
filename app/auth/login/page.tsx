"use client";

import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Lock, LogIn, Mail, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user?.mustChangePassword) {
        router.push("/auth/forced-reset");
        return;
      }
      toast.success(`Bem-vindo, ${loggedUser.name}!`);
      const role = meData.user?.role || "funcionario";
      if (role === "owner" || role === "admin") {
        router.push("/app/dashboard");
      } else {
        router.push("/app/preenchimento");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillCredentials(role: "admin" | "staff") {
    if (role === "admin") {
      setEmail("admin@gmail.com");
      setPassword("admin");
    } else {
      setEmail("staff@gmail.com");
      setPassword("staff");
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface relative overflow-hidden p-4">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-surface-secondary/80 border border-border rounded-3xl p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <Package className="text-white w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-text tracking-tight">
              Estoque<span className="text-blue-400">Rest</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Acesse sua conta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-tertiary/50 border border-slate-700 rounded-xl text-text placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-surface-tertiary/50 border border-slate-700 rounded-xl text-text placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link
              href="/auth/forgot-password"
              className="text-slate-400 hover:text-text-secondary text-sm transition-colors"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <p className="text-xs text-slate-500 text-center">Credenciais de Teste</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillCredentials("admin")}
                className="text-left text-xs px-3 py-3 rounded-xl bg-surface-tertiary/50 border border-slate-700 text-text-secondary hover:bg-slate-800 hover:border-slate-600 transition-all"
              >
                <span className="font-semibold text-text block mb-0.5">Administrador</span>
                admin@gmail.com
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("staff")}
                className="text-left text-xs px-3 py-3 rounded-xl bg-surface-tertiary/50 border border-slate-700 text-text-secondary hover:bg-slate-800 hover:border-slate-600 transition-all"
              >
                <span className="font-semibold text-text block mb-0.5">Colaborador</span>
                staff@gmail.com
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Não tem conta?{" "}
            <Link
              href="/auth/register"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
