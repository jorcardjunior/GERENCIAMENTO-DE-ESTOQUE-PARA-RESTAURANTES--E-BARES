"use client";

import { Lock, Mail, Package, Shield, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function ActivatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(true);

  useEffect(() => {
    if (!token) {
      toast.error("Link inválido");
      router.push("/auth/login");
      return;
    }
    fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.invite) {
          setName(data.invite.name);
          setEmail(data.invite.email);
          setCompanyName(data.invite.companyName);
        } else {
          toast.error(data.error || "Convite inválido");
          router.push("/auth/login");
        }
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoadingInvite(false));
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Senhas não conferem");
      return;
    }
    if (password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Conta ativada com sucesso!");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvite) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface relative overflow-hidden p-4">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-surface-secondary/80 border border-border rounded-3xl p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
              <Shield className="text-white w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-text tracking-tight">
              Ativar <span className="text-emerald-400">Conta</span>
            </h1>
            {companyName && (
              <p className="text-slate-400 text-sm mt-1">
                Você foi convidado para{" "}
                <span className="text-emerald-400 font-medium">{companyName}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="activate-name" className="text-xs font-medium text-text-secondary">
                Nome
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="activate-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-surface-tertiary/50 border border-slate-700 rounded-xl text-text placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="activate-email" className="text-xs font-medium text-text-secondary">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="activate-email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/30 border border-slate-700/50 rounded-xl text-slate-400 cursor-not-allowed text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="activate-password" className="text-xs font-medium text-text-secondary">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="activate-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-surface-tertiary/50 border border-slate-700 rounded-xl text-text placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="activate-confirm-password"
                className="text-xs font-medium text-text-secondary"
              >
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="activate-confirm-password"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-surface-tertiary/50 border border-slate-700 rounded-xl text-text placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Ativar conta
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ActivateFallback() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface">
      <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<ActivateFallback />}>
      <ActivatePageContent />
    </Suspense>
  );
}
