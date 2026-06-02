"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ShieldOff, Users as UsersIcon, Plus } from "lucide-react";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
  createdAt: string;
};

export default function UsuariosPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [creating, setCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldOff className="w-16 h-16 text-[#dc2626] mb-4" />
        <h2 className="text-2xl font-bold text-[#0f172a]">Acesso Restrito</h2>
        <p className="text-[#64748b] mt-2">Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    setCreating(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Usuário criado com sucesso");
      setName("");
      setEmail("");
      setPassword("");
      setRole("staff");
      setShowForm(false);
      loadUsers();
    } else {
      toast.error(data.error || "Erro ao criar usuário");
    }
    setCreating(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a]">Gerenciar Usuários</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createUser}
          className="mb-6 p-4 bg-white rounded-xl border border-[#e2e8f0] space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "staff")}
              className="px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-[#16a34a] text-white rounded-lg hover:bg-[#15803d] transition-colors text-sm font-medium disabled:opacity-50"
            >
              {creating ? "Criando..." : "Criar"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setName(""); setEmail(""); setPassword(""); }}
              className="px-4 py-2 bg-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#cbd5e1] transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8fafc] text-[#64748b] text-left">
              <th className="px-6 py-3 font-medium">Nome</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Perfil</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]">
                <td className="px-6 py-3 font-medium text-[#0f172a]">{u.name}</td>
                <td className="px-6 py-3 text-[#64748b]">{u.email}</td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === "admin"
                        ? "bg-[#2563eb] text-white"
                        : "bg-[#f1f5f9] text-[#64748b]"
                    }`}
                  >
                    {u.role === "admin" ? "Admin" : "Staff"}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center gap-1 text-xs text-[#16a34a]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                    Ativo
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12 text-[#64748b]">
            <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum usuário encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
