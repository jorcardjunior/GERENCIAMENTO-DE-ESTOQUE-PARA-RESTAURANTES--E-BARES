"use client";

import { useState } from "react";

import { ArrowLeft, Mail, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Erro ao solicitar recuperação");
      setSent(true);
      toast.success("Instruções enviadas para seu email!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar recuperação de senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-md px-4 animate-fadeInUp">
        <div className="bg-surface-secondary/80 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Login
          </Link>

          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-springScale">
              <Mail className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-text tracking-tight">Recuperar Senha</h1>
            <p className="text-text-secondary text-sm mt-1">
              {sent
                ? "Verifique seu email para as instruções"
                : "Digite seu email para receber as instruções de recuperação"}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-tertiary/50 border border-border rounded-xl text-text placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Enviar Instruções
                  </span>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-8 animate-fadeInScale">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-text-secondary mb-4">
                Enviamos as instruções para <strong>{email}</strong>
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-brand-600 hover:text-brand-500 text-sm font-medium transition-colors"
              >
                Eniar para outro email
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes springScale {
          0% { transform: scale(0); }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out both; }
        .animate-springScale { animation: springScale 0.5s ease-out both; }
        .animate-fadeInScale { animation: fadeInScale 0.3s ease-out both; }
      `}</style>
    </div>
  );
}
