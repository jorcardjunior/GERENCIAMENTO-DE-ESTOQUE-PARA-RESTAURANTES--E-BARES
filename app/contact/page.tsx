"use client";

import { useState } from "react";

import { Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Simulação de envio
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Mensagem enviada com sucesso!");
    setForm({ name: "", email: "", message: "" });
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 py-16 relative">
          <div className="text-center animate-fadeInUp">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">
                Contato
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Fale Conosco
            </h1>
            <p className="text-xl text-blue-200/80 max-w-2xl mx-auto leading-relaxed">
              Estamos aqui para ajudar. Entre em contato conosco através do formulário abaixo.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="animate-fadeInLeft">
            <h2 className="text-2xl font-black text-text mb-6">Informações de Contato</h2>
            <div className="space-y-4">
              {[
                { icon: Mail, label: "Email", value: "suporte@estoque.rest" },
                { icon: Phone, label: "Telefone", value: "(11) 9999-9999" },
                { icon: MapPin, label: "Endereço", value: "São Paulo, SP - Brasil" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border/50"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text">{item.label}</p>
                    <p className="text-sm text-text-secondary">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="animate-fadeInRight">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="Seu nome"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Mensagem</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                  placeholder="Como podemos ajudar?"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Mensagem
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out both; }
        .animate-fadeInLeft { animation: fadeInLeft 0.6s ease-out both; }
        .animate-fadeInRight { animation: fadeInRight 0.6s ease-out both; }
        .btn-hover:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}
