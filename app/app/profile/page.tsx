"use client";

import { ROLE_LABELS, useAuth } from "@/hooks/use-auth";
import { Building2, Check, ChevronDown, Clock, Lock, Mail, Save, Shield, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-violet-600",
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || data.error || "Erro ao atualizar perfil");
      }
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("Nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Senhas não conferem");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || data.error || "Erro ao alterar senha");
      }
      toast.success("Senha alterada com sucesso!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPassword(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setPwLoading(false);
    }
  }

  const avatarGradient = getAvatarGradient(user?.name || "U");
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;
  const lastUpdate = user?.updatedAt
    ? new Date(user.updatedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-text tracking-tight">Meu Perfil</h1>
        <p className="text-text-secondary mt-1">Gerencie suas informações pessoais e segurança</p>
      </div>

      {/* Informações Pessoais */}
      <div className="card overflow-hidden">
        <div className={`relative h-32 bg-gradient-to-r ${avatarGradient}`}>
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-full bg-surface shadow-lg flex items-center justify-center text-3xl font-bold text-white border-4 border-surface ring-2 ring-white/20">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          <form onSubmit={handleUpdateUser} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-1">
                  <User className="w-4 h-4" />
                  Nome
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-text"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-text"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-1">
                  <Shield className="w-4 h-4" />
                  Função
                </label>
                <div className="px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-secondary font-medium">
                  {ROLE_LABELS[user?.role ?? "funcionario"] || user?.role || "—"}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-1">
                  <Building2 className="w-4 h-4" />
                  Estabelecimento
                </label>
                <div className="px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-secondary font-medium">
                  {user?.companyName || "—"}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-brand text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-brand-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Alterar Senha */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">Alterar Senha</h2>
              <p className="text-sm text-text-secondary">Atualize sua senha de acesso ao sistema</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-text-tertiary transition-transform duration-200 ${
              showPassword ? "rotate-180" : ""
            }`}
          />
        </button>

        {showPassword && (
          <form
            onSubmit={handleChangePassword}
            className="px-6 pb-6 space-y-4 border-t border-border pt-5"
          >
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-1">
                <Lock className="w-4 h-4" />
                Senha Atual
              </label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-text"
                placeholder="••••••••"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-1">
                  <Lock className="w-4 h-4" />
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-text"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-1">
                  <Check className="w-4 h-4" />
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-text"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pwLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Alterar Senha
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Atividade Recente */}
      <div className="card">
        <div className="card-header flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">Atividade Recente</h2>
            <p className="text-sm text-text-secondary">Informações da sua conta e acesso</p>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between py-3 px-4 bg-surface-secondary rounded-xl">
            <span className="text-sm font-medium text-text-secondary">Membro desde</span>
            <span className="text-sm font-bold text-text">{memberSince || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3 px-4 bg-surface-secondary rounded-xl">
            <span className="text-sm font-medium text-text-secondary">Última atualização</span>
            <span className="text-sm font-bold text-text">{lastUpdate || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3 px-4 bg-surface-secondary rounded-xl">
            <span className="text-sm font-medium text-text-secondary">Função</span>
            <span className="text-sm font-bold text-text">
              {ROLE_LABELS[user?.role ?? "funcionario"] || user?.role || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 px-4 bg-surface-secondary rounded-xl">
            <span className="text-sm font-medium text-text-secondary">Estabelecimento</span>
            <span className="text-sm font-bold text-text">{user?.companyName || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
