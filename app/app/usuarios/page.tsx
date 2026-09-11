"use client";

import { ROLE_HIERARCHY, ROLE_LABELS, isManagerRole, useAuth } from "@/hooks/use-auth";
import type { AuthRole } from "@/hooks/use-auth";
import { Clock, Plus, Send, Settings, ShieldOff, Users as UsersIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type RoleOption = AuthRole;

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  authRole?: AuthRole;
  mustChangePassword?: boolean;
  createdAt: string;
};

type Invitation = {
  id: string;
  email: string;
  name: string;
  role: RoleOption;
  status: string;
  createdAt: string;
};

export default function UsuariosPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleOption>("funcionario");
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    const [usersRes, invitesRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/invitations"),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (invitesRes.ok) setInvitations(await invitesRes.json());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!isManagerRole(user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldOff className="w-16 h-16 text-danger mb-4" />
        <h2 className="text-2xl font-bold text-text">Acesso Restrito</h2>
        <p className="text-text-tertiary mt-2">
          Apenas proprietários e administradores podem gerenciar usuários.
        </p>
      </div>
    );
  }

  async function inviteUser(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setCreating(true);
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        role,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message || "Convite enviado!");
      if (data.inviteUrl) {
        navigator.clipboard?.writeText(data.inviteUrl);
        toast.info("Link copiado para área de transferência");
      }
      setName("");
      setEmail("");
      setRole("funcionario");
      setShowForm(false);
      loadData();
    } else {
      toast.error(data.error || "Erro ao convidar");
    }
    setCreating(false);
  }

  const canInviteRole = (targetRole: RoleOption) => {
    if (!user?.role) return false;
    return ROLE_HIERARCHY[user.role] > ROLE_HIERARCHY[targetRole];
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text tracking-tight uppercase">
            Equipe e Colaboradores
          </h1>
          <p className="text-text-tertiary text-sm">
            Convide membros para sua empresa e gerencie permissões.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl hover:bg-brand-500 shadow-xl shadow-brand-500/20 transition-all text-sm font-bold uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" /> Convidar Membro
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={inviteUser}
          className="p-8 bg-surface rounded-[2.5rem] border border-border shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300"
        >
          <h3 className="text-lg font-bold text-text mb-4">Convidar Novo Membro</h3>
          <p className="text-xs text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl mb-4">
            O colaborador receberá um link por email para criar a própria senha.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                Nome Completo
              </label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-4 bg-surface-tertiary border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/50 outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                Email Profissional
              </label>
              <input
                type="email"
                placeholder="email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 bg-surface-tertiary border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/50 outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                Perfil de Acesso
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleOption)}
                className="w-full h-12 px-4 bg-surface-tertiary border-none rounded-xl text-sm font-bold text-text-secondary focus:ring-2 focus:ring-brand-500/50 outline-none"
              >
                {Object.entries(ROLE_LABELS).map(([val, label]) => (
                  <option key={val} value={val} disabled={!canInviteRole(val as RoleOption)}>
                    {label} {!canInviteRole(val as RoleOption) ? "(restrito)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all text-sm font-bold uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {creating ? "Enviando..." : "Enviar Convite"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setName("");
                setEmail("");
              }}
              className="flex-1 sm:flex-none px-8 py-3 bg-surface-tertiary text-text-secondary rounded-xl hover:bg-border transition-all text-sm font-bold uppercase tracking-widest"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Pending Invitations */}
      {invitations.filter((i) => i.status === "pending").length > 0 && (
        <div className="bg-surface rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-amber-500/5">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-black uppercase tracking-widest text-amber-500">
                Convites Pendentes
              </span>
            </div>
          </div>
          <div className="divide-y divide-border-light">
            {invitations
              .filter((i) => i.status === "pending")
              .map((inv) => (
                <div key={inv.id} className="px-8 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-text">{inv.name}</p>
                    <p className="text-xs text-text-tertiary">{inv.email}</p>
                  </div>
                  <span className="text-[10px] font-black text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                    {ROLE_LABELS[inv.role]}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active Members */}
      <div className="bg-surface rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-surface-tertiary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UsersIcon className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-black uppercase tracking-widest text-text">
                Membros Ativos
              </span>
            </div>
            <span className="text-[10px] font-bold text-text-tertiary bg-surface px-3 py-1 rounded-full border border-border">
              {users.length} ATIVOS
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-tertiary/50 text-text-tertiary text-left">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">
                  Colaborador
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                  Perfil
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                  Status
                </th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-secondary/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-black shadow-md">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-text group-hover:text-brand-600 transition-colors">
                          {u.name}
                        </p>
                        <p className="text-xs text-text-tertiary">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        u.authRole === "owner" || u.authRole === "admin"
                          ? "bg-brand-600 text-white"
                          : "bg-surface-tertiary text-text-secondary border border-border"
                      }`}
                    >
                      {(u.authRole && ROLE_LABELS[u.authRole]) || u.role || "Funcionário"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {u.mustChangePassword !== false ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        1º Acesso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Ativo
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-text-tertiary hover:text-brand-600 hover:bg-brand-500/10 rounded-xl transition-all">
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-surface-tertiary rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <UsersIcon className="w-10 h-10 text-text-tertiary opacity-40" />
              </div>
              <p className="text-sm font-bold text-text-tertiary uppercase tracking-widest">
                Nenhum membro na empresa
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
