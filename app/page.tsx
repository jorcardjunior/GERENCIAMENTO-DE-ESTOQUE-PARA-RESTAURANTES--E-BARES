"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu, X, Check, ChevronDown, Star, TrendingUp, Shield, Clock, Smartphone,
  BarChart3, Users, Package, AlertTriangle, RefreshCw,
} from "lucide-react";

const PLANS = [
  {
    name: "Básico",
    price: 49,
    desc: "Perfeito para pequenos restaurantes e bares que estão começando a organizar o estoque.",
    features: [
      "1 estabelecimento",
      "Até 200 itens no catálogo",
      "Controle de vencimento",
      "Relatórios básicos",
      "1 usuário",
      "Suporte por e-mail",
    ],
    highlighted: false,
    cta: "Começar Grátis",
  },
  {
    name: "Profissional",
    price: 99,
    desc: "Ideal para restaurantes e bares em crescimento que precisam de mais controle e equipe.",
    features: [
      "3 estabelecimentos",
      "Até 1.000 itens no catálogo",
      "Alertas de vencimento e estoque baixo",
      "Relatórios avançados",
      "Até 5 usuários",
      "Suporte prioritário via chat",
    ],
    highlighted: true,
    cta: "Assinar Agora",
  },
  {
    name: "Enterprise",
    price: 199,
    desc: "Para redes e operações de grande porte que exigem máxima personalização e suporte.",
    features: [
      "Estabelecimentos ilimitados",
      "Itens ilimitados",
      "API e integrações personalizadas",
      "Relatórios customizados",
      "Usuários ilimitados",
      "Suporte dedicado 24/7",
    ],
    highlighted: false,
    cta: "Falar com Vendas",
  },
];

const FEATURES = [
  {
    icon: Package,
    title: "Gestão de Estoque",
    desc: "Cadastre, categorize e monitore todos os itens do seu estoque em um só lugar, com busca rápida e organização por categorias.",
  },
  {
    icon: AlertTriangle,
    title: "Alertas Inteligentes",
    desc: "Receba notificações sobre itens próximos ao vencimento e estoque baixo com regras configuráveis de dias e percentuais.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Completo",
    desc: "Visualize indicadores em tempo real: total de itens, valor empregado em estoque, itens baixos e próximos ao vencimento.",
  },
  {
    icon: RefreshCw,
    title: "Preenchimento Rápido",
    desc: "Registre contagens de estoque de forma ágil com seleção por categoria e item, atualizando quantidades e validades.",
  },
  {
    icon: Users,
    title: "Múltiplos Usuários",
    desc: "Defina permissões de administrador e colaborador, cada um com acesso adequado às funcionalidades do sistema.",
  },
  {
    icon: TrendingUp,
    title: "Valor em Estoque",
    desc: "Atribua preços unitários aos itens e acompanhe o capital empregado em estoque com cálculos automáticos e precisos.",
  },
];

const TESTIMONIALS = [
  {
    name: "Carlos Mendes",
    role: "Proprietário — Restaurante Sabor Caseiro",
    avatar: "CM",
    quote: "Reduzimos o desperdício em 40% nos primeiros meses. O alerta de vencimento nos salvou de perder centenas de reais em insumos.",
  },
  {
    name: "Ana Lúcia",
    role: "Gerente — Bar do Zé",
    avatar: "AL",
    quote: "A interface é intuitiva e o preenchimento de estoque ficou muito mais rápido. Minha equipe inteira aprendeu a usar em um dia.",
  },
  {
    name: "Ricardo Oliveira",
    role: "CEO — Grupo Oliveira Restaurantes",
    avatar: "RO",
    quote: "Usamos em 5 unidades diferentes. O plano Enterprise nos deu a flexibilidade que precisávamos para padronizar a gestão.",
  },
];

const FAQ_ITEMS = [
  {
    q: "O sistema funciona para qualquer tipo de restaurante ou bar?",
    a: "Sim! O Estoque Restaurante foi projetado para atender desde lanchonetes e padarias até restaurantes fine dining e redes de bares. A estrutura de categorias e itens é totalmente flexível.",
  },
  {
    q: "Preciso instalar algum software?",
    a: "Não. O sistema é 100% online (web app). Funciona em qualquer navegador moderno no computador, tablet ou celular. Basta criar sua conta e começar a usar.",
  },
  {
    q: "Como funciona o período gratuito?",
    a: "Oferecemos 14 dias de teste gratuito no plano Profissional, sem necessidade de cartão de crédito. Você pode cancelar a qualquer momento durante o período.",
  },
  {
    q: "Posso cadastrar itens com unidades diferentes (kg, L, un)?",
    a: "Sim. Você define a unidade de medida para cada item: kg, g, L, mL, unidade, pacote, etc. O sistema também sugere a unidade ideal baseada no nome do item.",
  },
  {
    q: "É possível controlar a data de vencimento dos produtos?",
    a: "Sim. Cada item pode ter uma data de vencimento opcional. O sistema alerta automaticamente quando o item está próximo do vencimento, de acordo com a configuração de dias que você definir.",
  },
  {
    q: "Como funciona o suporte?",
    a: "O plano Básico inclui suporte por e-mail. O Profissional tem suporte prioritário via chat. O Enterprise conta com suporte dedicado 24 horas por dia, 7 dias por semana.",
  },
];

function PlanCard({ plan, index }: { plan: typeof PLANS[0]; index: number }) {
  return (
    <div
      className={`relative rounded-3xl border-2 p-8 transition-all duration-500 hover:-translate-y-2 ${
        plan.highlighted
          ? "border-[#2563eb] bg-gradient-to-b from-[#2563eb]/5 to-white shadow-2xl shadow-blue-500/20 scale-105 lg:scale-110 z-10"
          : "border-[#e2e8f0] bg-white shadow-lg hover:shadow-xl"
      }`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {plan.highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2563eb] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
          Mais Popular
        </div>
      )}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#0f172a]">{plan.name}</h3>
          <p className="text-sm text-[#64748b] mt-1">{plan.desc}</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-[#0f172a]">R$ {plan.price}</span>
          <span className="text-sm text-[#64748b] font-medium">/mês</span>
        </div>
        <ul className="space-y-3">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-[#475569]">
              <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlighted ? "text-[#2563eb]" : "text-emerald-500"}`} />
              {f}
            </li>
          ))}
        </ul>
        <Link
          href="/auth/register"
          className={`block w-full py-3 rounded-xl font-bold text-sm text-center transition-all ${
            plan.highlighted
              ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
              : "bg-[#f1f5f9] text-[#0f172a] hover:bg-[#e2e8f0]"
          }`}
        >
          {plan.cta}
        </Link>
      </div>
    </div>
  );
}

function AccordionItem({ item, index }: { item: typeof FAQ_ITEMS[0]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border border-[#e2e8f0] rounded-2xl overflow-hidden transition-all duration-300 ${open ? "shadow-md" : "hover:shadow-sm"}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-[#f8fafc] transition-colors"
      >
        <span className="text-sm font-bold text-[#0f172a] pr-4">{item.q}</span>
        <ChevronDown className={`h-4 w-4 text-[#64748b] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96" : "max-h-0"}`}>
        <p className="px-5 pb-5 text-sm text-[#64748b] leading-relaxed">{item.a}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ─── NAVIGATION ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/90 backdrop-blur-xl border-b border-[#e2e8f0] shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-[#2563eb] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-[#0f172a]">Estoque<span className="text-[#2563eb]">Rest</span></span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {[
                { label: "Recursos", href: "#recursos" },
                { label: "Preços", href: "#precos" },
                { label: "Depoimentos", href: "#depoimentos" },
                { label: "FAQ", href: "#faq" },
              ].map((item) => (
                <a key={item.label} href={item.href}
                  className="text-sm font-semibold text-[#64748b] hover:text-[#2563eb] transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <Link href="/auth/login"
                className="px-5 py-2.5 text-sm font-bold text-[#0f172a] hover:text-[#2563eb] transition-colors"
              >
                Entrar
              </Link>
              <Link href="/auth/register"
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#2563eb] rounded-xl hover:bg-[#1d4ed8] transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              >
                Começar Grátis
              </Link>
            </div>

            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#f1f5f9] transition-colors"
            >
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="lg:hidden bg-white border-t border-[#e2e8f0] shadow-xl">
            <div className="px-4 py-4 space-y-3">
              {[
                { label: "Recursos", href: "#recursos" },
                { label: "Preços", href: "#precos" },
                { label: "Depoimentos", href: "#depoimentos" },
                { label: "FAQ", href: "#faq" },
              ].map((item) => (
                <a key={item.label} href={item.href} onClick={() => setMobileMenu(false)}
                  className="block px-3 py-2.5 text-sm font-bold text-[#64748b] hover:text-[#2563eb] hover:bg-[#f8fafc] rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-3 border-t border-[#e2e8f0] flex flex-col gap-2">
                <Link href="/auth/login" onClick={() => setMobileMenu(false)}
                  className="block px-3 py-2.5 text-sm font-bold text-center text-[#0f172a] hover:bg-[#f1f5f9] rounded-lg transition-colors"
                >
                  Entrar
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenu(false)}
                  className="block px-3 py-2.5 text-sm font-bold text-center text-white bg-[#2563eb] rounded-xl hover:bg-[#1d4ed8] transition-colors"
                >
                  Começar Grátis
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ─── HERO ─── */}
        <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[#2563eb]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-emerald-500/10 to-transparent rounded-full blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-[#2563eb]/10 border border-[#2563eb]/20 rounded-full px-4 py-1.5">
                  <Star className="h-3.5 w-3.5 text-[#2563eb]" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#2563eb]">Gestão de Estoque Profissional</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-[#0f172a] leading-[1.1]">
                  Controle seu estoque{" "}
                  <span className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] bg-clip-text text-transparent">com inteligência</span>
                </h1>
                <p className="text-lg text-[#64748b] leading-relaxed max-w-lg">
                  Gerencie insumos, evite desperdícios, acompanhe vencimentos e saiba exatamente quanto
                  capital está empregado no seu estoque — tudo em uma plataforma moderna e intuitiva.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2563eb] text-white rounded-2xl font-bold text-sm hover:bg-[#1d4ed8] transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                  >
                    Começar Grátis <span className="text-xs opacity-70">— 14 dias</span>
                  </Link>
                  <a href="#recursos"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-[#e2e8f0] text-[#0f172a] rounded-2xl font-bold text-sm hover:border-[#2563eb] hover:text-[#2563eb] transition-all"
                  >
                    Ver Recursos
                  </a>
                </div>
                <div className="flex items-center gap-6 text-sm text-[#94a3b8]">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Sem cartão de crédito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Cancele quando quiser</span>
                  </div>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="relative bg-white rounded-3xl border-2 border-[#e2e8f0] shadow-2xl overflow-hidden">
                  <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-5 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider ml-2">Dashboard</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[60, 85, 30, 12].map((v, i) => (
                        <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-3.5">
                          <div className="h-1.5 w-12 rounded-full bg-[#f1f5f9] mb-2" />
                          <div className="h-6 w-16 rounded bg-[#f1f5f9] mb-1" />
                          <div className="h-2 w-20 rounded bg-[#f1f5f9]" />
                        </div>
                      ))}
                    </div>
                    <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                      <div className="bg-[#f8fafc] px-3.5 py-2 border-b border-[#e2e8f0] flex justify-between">
                        <div className="h-2 w-16 rounded bg-[#e2e8f0]" />
                        <div className="h-2 w-12 rounded bg-[#e2e8f0]" />
                      </div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between px-3.5 py-2.5 border-b border-[#e2e8f0] last:border-0">
                          <div className="h-3 w-24 rounded bg-[#f1f5f9]" />
                          <div className={`h-3 w-10 rounded ${i === 1 ? "bg-amber-200" : i === 2 ? "bg-emerald-200" : "bg-red-200"}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 shadow-lg">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Economia média</p>
                  <p className="text-2xl font-black text-emerald-600">34%</p>
                  <p className="text-[10px] text-emerald-500">menos desperdício</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── STATS ─── */}
        <section className="py-12 bg-gradient-to-r from-[#2563eb]/5 via-white to-[#2563eb]/5 border-y border-[#e2e8f0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "10k+", label: "Estabelecimentos" },
                { value: "500k+", label: "Itens gerenciados" },
                { value: "98%", label: "Satisfação" },
                { value: "40%", label: "Menos desperdício" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-black text-[#2563eb]">{s.value}</p>
                  <p className="text-sm text-[#64748b] font-semibold mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="recursos" className="py-20 lg:py-28 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#2563eb] bg-[#2563eb]/10 px-3 py-1 rounded-full">
                Funcionalidades
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#0f172a] mt-4">
                Tudo que você precisa para gerenciar seu estoque
              </h2>
              <p className="text-lg text-[#64748b] mt-3">
                Do cadastro de itens aos alertas inteligentes, nossa plataforma cobre cada aspecto da gestão de insumos.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <div key={f.title}
                  className="group bg-white rounded-3xl border-2 border-[#e2e8f0] p-6 hover:border-[#2563eb]/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="h-12 w-12 rounded-2xl bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center mb-4 group-hover:bg-[#2563eb] group-hover:border-[#2563eb] transition-all duration-300">
                    <f.icon className="h-6 w-6 text-[#2563eb] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-base font-bold text-[#0f172a] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#64748b] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="precos" className="py-20 lg:py-28 bg-gradient-to-b from-[#f8fafc] to-white scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#2563eb] bg-[#2563eb]/10 px-3 py-1 rounded-full">
                Planos e Preços
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#0f172a] mt-4">
                Invista no controle do seu negócio
              </h2>
              <p className="text-lg text-[#64748b] mt-3">
                Escolha o plano ideal para o seu restaurante ou bar. Todos os planos incluem 14 dias de teste grátis.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-start">
              {PLANS.map((plan, i) => (
                <PlanCard key={plan.name} plan={plan} index={i} />
              ))}
            </div>
            <p className="text-center text-sm text-[#94a3b8] mt-8">
              * Todos os valores em reais (R$). Planos anuais têm 2 meses de desconto. Entre em contato para condições especiais.
            </p>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section id="depoimentos" className="py-20 lg:py-28 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#2563eb] bg-[#2563eb]/10 px-3 py-1 rounded-full">
                Depoimentos
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#0f172a] mt-4">
                Quem usa, recomenda
              </h2>
              <p className="text-lg text-[#64748b] mt-3">
                Veja o que nossos clientes dizem sobre como o EstoqueRest transformou a gestão dos seus negócios.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={t.name}
                  className="bg-white rounded-3xl border-2 border-[#e2e8f0] p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-[#475569] leading-relaxed mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center text-xs font-black text-[#2563eb]">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0f172a]">{t.name}</p>
                      <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="py-20 lg:py-28 bg-gradient-to-b from-[#f8fafc] to-white scroll-mt-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#2563eb] bg-[#2563eb]/10 px-3 py-1 rounded-full">
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#0f172a] mt-4">
                Perguntas Frequentes
              </h2>
              <p className="text-lg text-[#64748b] mt-3">
                Tire suas dúvidas sobre o EstoqueRest.
              </p>
            </div>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} item={item} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              <div className="relative text-center max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
                  Pronto para transformar seu estoque?
                </h2>
                <p className="text-blue-200 mt-4 text-lg">
                  Comece hoje com 14 dias de teste grátis. Sem compromisso, sem cartão de crédito.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                  <Link href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#2563eb] rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all shadow-2xl"
                  >
                    Criar Conta Gratuita
                  </Link>
                  <a href="#recursos"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white rounded-2xl font-bold text-sm hover:bg-white/10 transition-all"
                  >
                    <Smartphone className="h-4 w-4" /> Ver Funcionalidades
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0f172a] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#2563eb] flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-black tracking-tight text-white">Estoque<span className="text-[#2563eb]">Rest</span></span>
              </Link>
              <p className="text-sm text-[#94a3b8] leading-relaxed">
                Plataforma profissional de gestão de estoque para restaurantes e bares.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-4">Produto</h4>
              <ul className="space-y-2.5">
                {["Recursos", "Preços", "Depoimentos", "FAQ"].map((item) => (
                  <li key={item}>
                    <a href={`#${item === "Depoimentos" ? "depoimentos" : item === "Preços" ? "precos" : item.toLowerCase()}`}
                      className="text-sm text-[#94a3b8] hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-4">Conta</h4>
              <ul className="space-y-2.5">
                <li><Link href="/auth/login" className="text-sm text-[#94a3b8] hover:text-white transition-colors">Entrar</Link></li>
                <li><Link href="/auth/register" className="text-sm text-[#94a3b8] hover:text-white transition-colors">Cadastrar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-[#94a3b8] cursor-not-allowed">Privacidade</span></li>
                <li><span className="text-sm text-[#94a3b8] cursor-not-allowed">Termos de Uso</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#64748b]">
              &copy; {new Date().getFullYear()} EstoqueRest. Todos os direitos reservados.
            </p>
            <p className="text-xs text-[#475569]">
              Feito para restaurantes e bares que levam o controle a sério.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
