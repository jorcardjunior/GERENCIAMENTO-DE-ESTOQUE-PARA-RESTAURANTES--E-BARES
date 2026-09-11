"use client";

import { ChefHat, ExternalLink, Globe, Heart, Shield, Zap } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Zap,
    title: "Rapidez",
    description:
      "Interface otimizada para operações rápidas e eficientes no dia a dia do seu estabelecimento.",
  },
  {
    icon: Shield,
    title: "Segurança",
    description: "Seus dados protegidos com autenticação JWT e conexão criptografada.",
  },
  {
    icon: Globe,
    title: "Acessibilidade",
    description: "Acesse de qualquer lugar, a qualquer momento, em qualquer dispositivo.",
  },
  {
    icon: Heart,
    title: "Suporte Dedicado",
    description: "Equipe pronta para ajudar com o que você precisar.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 py-16 relative">
          <div className="text-center animate-fadeInUp">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
              <ChefHat className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">
                Sobre Nós
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Estoque<span className="text-blue-400">Rest</span>
            </h1>
            <p className="text-xl text-blue-200/80 max-w-2xl mx-auto leading-relaxed">
              Simplificando a gestão de estoque para restaurantes e bares com tecnologia inteligente
              e interface intuitiva.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12 animate-fadeInUp">
          <h2 className="text-2xl font-black text-text mb-4">
            Por que Escolher o EstoqueRest?
          </h2>
          <p className="text-text-secondary">
            Desenvolvido pensando nas necessidades reais do seu negócio
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-surface rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">{feature.title}</h3>
              <p className="text-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center animate-fadeInUp">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
            <h3 className="text-2xl font-black text-text mb-4">Nossa Missão</h3>
            <p className="text-text-secondary max-w-2xl mx-auto mb-6 leading-relaxed">
              Empoderar restaurantes e bares com tecnologia simples e eficaz, eliminando
              desperdícios e otimizando o controle de insumos. Acreditamos que quando vocos
              controles seu estoque, seu negócio prospera.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all"
            >
              Entre em Contato
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out both; }
      `}</style>
    </div>
  );
}
