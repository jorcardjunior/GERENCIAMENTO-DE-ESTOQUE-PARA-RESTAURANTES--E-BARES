"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Bem-vindo, ${user.name}!`);
      if (user.role === "admin") {
        router.push("/app/gestao");
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
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4ff]">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-[#2563eb] w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Gerenciamento de Estoque</h1>
          <p className="text-[#64748b] mt-1">Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0f172a] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0f172a] mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2563eb] text-white py-2.5 rounded-lg font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#e2e8f0] space-y-2">
          <p className="text-xs text-[#64748b] text-center">Credenciais de teste:</p>
          <button
            type="button"
            onClick={() => fillCredentials("admin")}
            className="w-full text-left text-sm px-3 py-1.5 rounded bg-[#f0f4ff] text-[#2563eb] hover:bg-[#dbeafe] transition-colors"
          >
            <strong>Admin:</strong> admin@gmail.com / admin
          </button>
          <button
            type="button"
            onClick={() => fillCredentials("staff")}
            className="w-full text-left text-sm px-3 py-1.5 rounded bg-[#f0f4ff] text-[#2563eb] hover:bg-[#dbeafe] transition-colors"
          >
            <strong>Staff:</strong> staff@gmail.com / staff
          </button>
        </div>
      </div>
    </div>
  );
}
