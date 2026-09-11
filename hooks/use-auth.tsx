"use client";

import { authClient } from "@/lib/auth-client";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Papéis do modelo multi-tenant (espelha `authRoleEnum` / `AuthRole` do servidor).
 * A hierarquia é: visualizador < funcionario < gerente < admin < owner.
 */
export type AuthRole = "owner" | "admin" | "gerente" | "funcionario" | "visualizador";

export const ROLE_HIERARCHY: Record<AuthRole, number> = {
  visualizador: 0,
  funcionario: 1,
  gerente: 2,
  admin: 3,
  owner: 4,
};

export const ROLE_LABELS: Record<AuthRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  gerente: "Gerente",
  funcionario: "Funcionário",
  visualizador: "Visualizador",
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  companyId: string | null;
  companyName: string | null;
  mustChangePassword: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, companyName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** true para owner/admin (usado para itens adminOnly no menu e guards de tela). */
export function isManagerRole(role: AuthRole | undefined | null): boolean {
  return role === "owner" || role === "admin";
}

function meToUser(me: {
  id?: string;
  email?: string;
  name?: string;
  role?: AuthRole;
  companyId?: string | null;
  company?: { name?: string; plan?: string } | null;
  mustChangePassword?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}): User {
  return {
    id: me.id || "",
    email: me.email || "",
    name: me.name || "",
    role: (me.role as AuthRole) || "funcionario",
    companyId: me.companyId || null,
    companyName: me.company?.name || null,
    mustChangePassword: me.mustChangePassword || false,
    createdAt: me.createdAt,
    updatedAt: me.updatedAt,
  };
}

async function fetchUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ? meToUser(data.user) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient
      .getSession()
      .then(async (res) => {
        if (res?.data?.user) {
          const fullUser = await fetchUser();
          if (fullUser) setUser(fullUser);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authClient.signIn.email({ email, password });
    if (res?.error) throw new Error(res.error.message || "Erro ao fazer login");
    const fullUser = await fetchUser();
    if (!fullUser) throw new Error("Erro ao obter sessão");
    setUser(fullUser);
    return fullUser;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, companyName: string) => {
      // 1. Cria o usuário e a sessão no better-auth
      const res = await authClient.signUp.email({ name, email, password });
      if (res?.error) throw new Error(res.error.message || "Erro ao cadastrar");

      // 2. Provisiona o tenant (estabelecimento) e promove a owner
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });
      if (!regRes.ok) {
        const data = await regRes.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao criar estabelecimento");
      }

      // 3. Atualiza o contexto com role=owner + companyId
      const fullUser = await fetchUser();
      if (fullUser) setUser(fullUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
