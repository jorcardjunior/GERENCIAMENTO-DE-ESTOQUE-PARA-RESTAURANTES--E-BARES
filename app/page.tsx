"use client";

import {
  ArrowRight,
  Box,
  Building2,
  Check,
  ClipboardList,
  MessageCircle,
  Package,
  Play,
  ShoppingCart,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function useAuthStatus() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    fetch("/api/auth/me", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);
  return { user };
}

const C = {
  brand: "#2563eb",
  brandLight: "#3b82f6",
  accent1: "#f43f5e",
  accent2: "#f97316",
};

const styles = {
  section: "py-28 px-6 sm:px-10 lg:px-16",
  container: "max-w-7xl mx-auto",
  tag: "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[.2em]",
  h2: "text-5xl sm:text-6xl lg:text-7xl font-black leading-[.92] tracking-[-.02em] text-text uppercase",
  h2Accent:
    "bg-gradient-to-r from-[#f43f5e] via-[#f97316] to-[#f59e0b] bg-clip-text text-transparent italic",
  card: "rounded-2xl backdrop-blur-sm transition-all duration-300",
};

function useMouseGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return ref;
}

export default function LandingPage() {
  const { user } = useAuthStatus();
  const _glowRef = useMouseGlow();

  const features = [
    {
      icon: Box,
      title: "Controle de Estoque",
      desc: "Cadastre itens, defina mínimos, acompanhe validades e receba alertas automáticos.",
      color: "#2563eb",
    },
    {
      icon: ClipboardList,
      title: "Fichas Técnicas",
      desc: "Registre receitas com custo por porção, insumos e margem de lucro.",
      color: "#16a34a",
    },
    {
      icon: ShoppingCart,
      title: "Pedidos de Compra",
      desc: "Gere pedidos com base no estoque real e gerencie fornecedores.",
      color: "#f97316",
    },
    {
      icon: Building2,
      title: "Multi-unidades",
      desc: "Gerencie vários estabelecimentos com visão centralizada.",
      color: "#8b5cf6",
    },
    {
      icon: TrendingDown,
      title: "Controle de Perdas",
      desc: "Registre quebras, vencimentos e sobras para reduzir desperdício.",
      color: "#f43f5e",
    },
    {
      icon: Sparkles,
      title: "Consultor IA",
      desc: "Assistente inteligente que analisa dados reais do seu estoque e responde dúvidas de negócio.",
      color: "#f43f5e",
    },
  ];

  const testimonials = [
    {
      name: "Carlos Mendes",
      role: "Proprietário — Restaurante Sabor Caseiro",
      avatar: "CM",
      quote:
        "Reduzimos o desperdício em 40% nos primeiros meses. O alerta de vencimento nos salvou de perder centenas de reais em insumos.",
      color: "from-[#f43f5e] to-[#f97316]",
    },
    {
      name: "Ana Lúcia",
      role: "Gerente — Bar do Zé",
      avatar: "AL",
      quote:
        "A interface é intuitiva e o preenchimento de estoque ficou muito mais rápido. Minha equipe inteira aprendeu a usar em um dia.",
      color: "from-[#2563eb] to-[#8b5cf6]",
    },
    {
      name: "Ricardo Oliveira",
      role: "CEO — Grupo Oliveira Restaurantes",
      avatar: "RO",
      quote:
        "Usamos em 5 unidades diferentes. O plano nos deu a flexibilidade que precisávamos para padronizar a gestão.",
      color: "from-[#16a34a] to-[#06b6d4]",
    },
  ];

  const plans = [
    {
      name: "Mensal",
      price: "97",
      period: "mês",
      desc: "Essencial para pequenos negócios",
      features: ["1 estabelecimento", "Até 500 itens", "Controle básico", "2 usuários"],
      popular: false,
      discount: null,
    },
    {
      name: "Semestral",
      price: "79,90",
      period: "mês",
      desc: "O equilíbrio perfeito para crescer",
      features: ["3 estabelecimentos", "Até 2.000 itens", "Alertas inteligentes", "Até 5 usuários"],
      popular: false,
      discount: "18% OFF",
    },
    {
      name: "Anual",
      price: "57,90",
      period: "mês",
      desc: "Gestão profissional completa",
      features: [
        "Até 10 estabelecimentos",
        "Itens ilimitados",
        "Relatórios avançados",
        "Usuários ilimitados",
      ],
      popular: true,
      discount: "40% OFF",
    },
  ];

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-surface text-text"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${C.brand}, #1d4ed8)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-text tracking-tight">
              Estoque<span className="text-brand-600">Rest</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {["Recursos", "Preços", "FAQ"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="text-sm font-medium text-text-secondary hover:text-text transition-colors"
              >
                {l}
              </a>
            ))}
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-text-secondary hover:text-text transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-bold px-5 py-2 rounded-full transition-all bg-text text-surface"
            >
              Teste Grátis
            </Link>
          </nav>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-text p-2">
            <div className="w-5 h-0.5 mb-1 bg-text-secondary" />
            <div className="w-5 h-0.5 mb-1 bg-text-secondary" />
            <div className="w-5 h-0.5 bg-text-secondary" />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-30"
            style={{
              background: C.brand,
              filter: "blur(100px)",
              top: "10%",
              left: "20%",
              animation: "blob1 20s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-25"
            style={{
              background: C.accent1,
              filter: "blur(100px)",
              top: "30%",
              right: "10%",
              animation: "blob2 25s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-15"
            style={{
              background: C.accent2,
              filter: "blur(100px)",
              bottom: "0%",
              left: "40%",
              animation: "blob1 18s ease-in-out infinite reverse",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20">
          <div className="max-w-4xl">
            <div
              className="inline-flex items-center gap-3 mb-8 text-text-secondary"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: ".25em",
                textTransform: "uppercase",
              }}
            >
              <span className="w-8 h-px bg-brand-600" />
              Gestão de Estoque Profissional
            </div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black leading-[.88] tracking-[-.03em] uppercase mb-8">
              <span className="text-text">CONTROLE</span>
              <br />
              <span className="bg-gradient-to-r from-[#f43f5e] via-[#f97316] to-[#f59e0b] bg-clip-text text-transparent italic">
                SEU ESTOQUE
              </span>
              <br />
              <span
                className="text-text-tertiary/20"
                style={{ WebkitTextStroke: "1.5px currentColor", color: "transparent" }}
              >
                COM INTELIGÊNCIA
              </span>
            </h1>
            <p
              className="text-lg sm:text-xl max-w-2xl mb-10 text-text-secondary"
              style={{ lineHeight: 1.6 }}
            >
              Gerencie insumos, evite desperdícios, acompanhe vencimentos e tenha total controle do
              capital investido no seu restaurante ou bar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link
                  href="/app/dashboard"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all bg-text text-surface"
                >
                  Ir para Dashboard{" "}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all hover:opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${C.brand}, #1d4ed8)`,
                      color: "white",
                      boxShadow: `0 8px 32px ${C.brand}33`,
                    }}
                  >
                    Começar Teste Grátis{" "}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg border border-border transition-all text-text-secondary"
                  >
                    <Play className="w-5 h-5" /> Ver Demo
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {[
              { value: "10k+", label: "Estabelecimentos" },
              { value: "500k+", label: "Itens gerenciados" },
              { value: "98%", label: "Satisfação" },
              { value: "40%", label: "Menos desperdício" },
            ].map((s) => (
              <div
                key={s.label}
                className="text-center p-5 border border-border rounded-2xl bg-surface-secondary"
              >
                <div className="text-3xl sm:text-4xl font-black text-text mb-1">{s.value}</div>
                <div className="text-text-secondary" style={{ fontSize: "13px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-y border-border overflow-hidden" style={{ padding: "18px 0" }}>
        <div
          className="flex gap-12 whitespace-nowrap animate-marquee"
          style={{
            fontSize: "28px",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-.01em",
          }}
        >
          <span className="flex items-center gap-12">
            <span>Controle de Estoque</span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span
              style={{
                background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ★ Fichas Técnicas ★
            </span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span>Pedidos de Compra</span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span
              style={{
                background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ★ Transferências ★
            </span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span>Relatórios</span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span
              style={{
                background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ★ Financeiro ★
            </span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span
              style={{
                background: `linear-gradient(135deg, ${C.brand}, #8b5cf6)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ✦ CONSULTOR IA ✦
            </span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
          </span>
          <span className="flex items-center gap-12" aria-hidden="true">
            <span>Controle de Estoque</span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span
              style={{
                background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ★ Fichas Técnicas ★
            </span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span>Pedidos de Compra</span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span
              style={{
                background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ★ Transferências ★
            </span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span>Relatórios</span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span
              style={{
                background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ★ Financeiro ★
            </span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
            <span
              style={{
                background: `linear-gradient(135deg, ${C.brand}, #8b5cf6)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ✦ CONSULTOR IA ✦
            </span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
            />
          </span>
        </div>
      </div>

      {/* FEATURES - Núcleo style service list */}
      <section id="recursos" className={styles.section}>
        <div className={styles.container}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16 lg:mb-24">
            <div>
              <div
                className="text-text-secondary"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: ".25em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                /02 — O que entregamos
              </div>
              <h2 className={styles.h2}>
                TUDO QUE
                <br />
                VOCÊ <span className={styles.h2Accent}>PRECISA</span>
              </h2>
            </div>
            <div
              className="text-text-secondary"
              style={{
                fontSize: "16px",
                lineHeight: 1.7,
                maxWidth: 420,
                alignSelf: "flex-end",
              }}
            >
              Sete módulos integrados, um sistema só. Do controle de insumos às fichas técnicas, dos
              pedidos ao consultor de IA.
            </div>
          </div>

          <div className="flex flex-col">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group grid grid-cols-[60px_1fr_auto] lg:grid-cols-[80px_1fr_auto_120px] items-center gap-6 py-6 lg:py-8 cursor-pointer transition-all border-t border-border"
                onMouseEnter={(e) => {
                  e.currentTarget.style.paddingLeft = "16px";
                  e.currentTarget.style.paddingRight = "16px";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.paddingLeft = "0";
                  e.currentTarget.style.paddingRight = "0";
                }}
              >
                <div className="text-2xl lg:text-3xl font-black text-text-tertiary">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="text-2xl lg:text-4xl xl:text-5xl font-black uppercase tracking-[-.01em] leading-none text-text group-hover:bg-gradient-to-r group-hover:from-[#f43f5e] group-hover:via-[#f97316] group-hover:to-[#f59e0b] group-hover:bg-clip-text group-hover:text-transparent transition-all">
                    {f.title}
                  </div>
                  <div className="text-sm mt-2 lg:hidden text-text-secondary">
                    {f.desc}
                  </div>
                </div>
                <div className="hidden lg:flex gap-2">
                  {f.desc
                    .split(" ")
                    .slice(0, 3)
                    .map((w, j) => (
                      <span
                        key={j}
                        className="border border-border px-2.5 py-[3px] rounded-full text-[10px] uppercase tracking-[.1em] text-text-secondary"
                      >
                        {w.replace(/[.,]/g, "")}
                      </span>
                    ))}
                </div>
                <div className="hidden lg:block text-2xl text-center text-text-tertiary">
                  ↗
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS - Núcleo cases grid */}
      <section className="bg-surface-secondary">
        <div className={styles.section}>
          <div className={styles.container}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16 lg:mb-24">
              <div>
                <div
                  className="text-text-secondary"
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: ".25em",
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  /03 — Quem usa recomenda
                </div>
                <h2 className={styles.h2}>
                  CASOS <span className={styles.h2Accent}>REAIS</span>
                  <br />
                  DE <span className={styles.h2Accent}>QUEM</span>
                  <br />
                  USA
                </h2>
              </div>
              <div
                className="text-text-secondary"
                style={{
                  fontSize: "16px",
                  lineHeight: 1.7,
                  maxWidth: 400,
                  alignSelf: "flex-end",
                }}
              >
                Donos de restaurantes e bares que transformaram a gestão do estoque com o
                EstoqueRest.
              </div>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-6 gap-4"
              style={{ gridAutoRows: "260px" }}
            >
              <div
                className="relative rounded-2xl overflow-hidden md:col-span-4 md:row-span-2 group cursor-pointer border border-border"
              >
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${C.accent1} 0%, #6b0e4a 100%)` }}
                >
                  <div
                    className="ph h-full"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,.3)",
                      fontSize: "12px",
                      letterSpacing: ".1em",
                    }}
                  >
                    <MessageCircle className="w-6 h-6 mr-2" /> Depoimento em vídeo
                  </div>
                </div>
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,.8) 100%)",
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    color: "white",
                  }}
                >
                  <span
                    style={{
                      alignSelf: "flex-start",
                      background: "rgba(255,255,255,.15)",
                      backdropFilter: "blur(10px)",
                      padding: "4px 12px",
                      fontSize: "10px",
                      letterSpacing: ".15em",
                      borderRadius: "999px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {testimonials[0].role}
                  </span>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black uppercase leading-tight tracking-[-.01em]">
                      &ldquo;{testimonials[0].quote}&rdquo;
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                        {testimonials[0].avatar}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{testimonials[0].name}</div>
                        <div className="text-[10px] uppercase tracking-widest opacity-60">
                          {testimonials[0].role}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="relative rounded-2xl overflow-hidden md:col-span-2 md:row-span-1 group cursor-pointer border border-border"
              >
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${C.brand} 0%, #1e3a8a 100%)` }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,.8) 100%)",
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    color: "white",
                  }}
                >
                  <span
                    style={{
                      alignSelf: "flex-start",
                      background: "rgba(255,255,255,.15)",
                      backdropFilter: "blur(10px)",
                      padding: "3px 10px",
                      fontSize: "9px",
                      letterSpacing: ".15em",
                      borderRadius: "999px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Depoimento
                  </span>
                  <div>
                    <div className="text-lg font-black leading-tight">
                      &ldquo;{testimonials[1].quote.substring(0, 80)}&hellip;&rdquo;
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                        {testimonials[1].avatar}
                      </div>
                      <div className="text-xs font-medium">
                        {testimonials[1].name.split(" ")[0]}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="relative rounded-2xl overflow-hidden md:col-span-2 md:row-span-1 group cursor-pointer border border-border"
              >
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #065f46 100%)" }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,.8) 100%)",
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    color: "white",
                  }}
                >
                  <span
                    style={{
                      alignSelf: "flex-start",
                      background: "rgba(255,255,255,.15)",
                      backdropFilter: "blur(10px)",
                      padding: "3px 10px",
                      fontSize: "9px",
                      letterSpacing: ".15em",
                      borderRadius: "999px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Depoimento
                  </span>
                  <div>
                    <div className="text-lg font-black leading-tight">
                      &ldquo;{testimonials[2].quote.substring(0, 80)}&hellip;&rdquo;
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                        {testimonials[2].avatar}
                      </div>
                      <div className="text-xs font-medium">
                        {testimonials[2].name.split(" ")[0]}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="preços" className={styles.section}>
        <div className={styles.container}>
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
            <div
              className="text-text-secondary"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: ".25em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              /04 — Planos
            </div>
            <h2 className={styles.h2}>
              PREÇOS <span className={styles.h2Accent}>JUSTOS</span>
            </h2>
            <p className="mt-6 text-text-secondary" style={{ fontSize: "16px" }}>
              Comece com teste grátis de 15 dias. Sem cartão de crédito.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="relative rounded-2xl p-8 transition-all duration-300"
                style={{
                  background: plan.popular
                    ? "linear-gradient(135deg, #f43f5e20, #f9731620)"
                    : undefined,
                  border: plan.popular ? "1px solid #f43f5e44" : undefined,
                  transform: plan.popular ? "scale(1.05)" : "none",
                  zIndex: plan.popular ? 1 : 0,
                }}
              >
                {plan.discount && (
                  <div
                    className="absolute -top-3 right-6 px-3 py-1 rounded-full text-xs font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})` }}
                  >
                    {plan.discount}
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-xl font-bold text-text mb-1">{plan.name}</div>
                  <div className="text-text-secondary" style={{ fontSize: "13px" }}>{plan.desc}</div>
                </div>
                <div className="mb-8">
                  <span className="text-text-secondary" style={{ fontSize: "16px" }}>R$ </span>
                  <span className="text-4xl font-black text-text">{plan.price}</span>
                  <span className="text-text-secondary" style={{ fontSize: "13px" }}>/{plan.period}</span>
                </div>
                <div className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#16a34a" }} />
                      <span className="text-text-secondary" style={{ fontSize: "14px" }}>{f}</span>
                    </div>
                  ))}
                </div>
                {user ? (
                  <Link
                    href="/app/dashboard"
                    className="block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all bg-surface-tertiary text-text border border-border"
                  >
                    Ir para Tela Inicial
                  </Link>
                ) : (
                  <Link
                    href="/auth/register"
                    className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                      plan.popular
                        ? "bg-text text-surface"
                        : "text-text border border-border"
                    }`}
                  >
                    Começar Teste Grátis
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Núcleo style big band */}
      <section
        className={styles.section}
        style={{ textAlign: "center", overflow: "hidden", position: "relative" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: C.brand, filter: "blur(120px)", top: "-20%", left: "-10%" }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-15"
            style={{ background: C.accent1, filter: "blur(120px)", bottom: "-20%", right: "-10%" }}
          />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black leading-[.85] tracking-[-.03em] uppercase">
            <span
              className="text-text-tertiary/20"
              style={{ WebkitTextStroke: "1.5px currentColor", color: "transparent" }}
            >
              VAMOS
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#f43f5e] via-[#f97316] to-[#f59e0b] bg-clip-text text-transparent italic">
              COMEÇAR
            </span>
            <br />
            <span className="text-text">DE VERDADE?</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all bg-text text-surface"
            >
              Começar Projeto <ArrowRight className="w-5 h-5" />
            </Link>
            <div
              className="text-xl sm:text-2xl font-black italic"
              style={{
                background: `linear-gradient(135deg, ${C.accent1}, ${C.accent2})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              contato@estoquerset.com
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border" style={{ padding: "28px 0" }}>
        <div
          className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-4 text-text-secondary"
          style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: ".2em",
          }}
        >
          <div>© EstoqueRest · est. 2024</div>
          <div>SP · BR · sac@estoquerset.com</div>
          <div className="flex gap-6">
            <Link href="/auth/login" className="text-text-secondary hover:text-text transition-colors">
              Entrar
            </Link>
            <Link href="/auth/register" className="text-text-secondary hover:text-text transition-colors">
              Cadastrar
            </Link>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <a
        href="https://wa.me/5513997768299?text=Ol%C3%A1%2C%20ainda%20tenho%20d%C3%BAvidas%20sobre%20o%20sistema"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-6 right-6 z-50 group inline-flex items-center gap-2 text-white font-semibold text-sm px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        style={{ background: "#25D366" }}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 fill-white shrink-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="hidden sm:inline">Ainda tem dúvidas?</span>
      </a>

      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(40px,-30px) scale(1.1); }
          66% { transform: translate(-30px,40px) scale(.9); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-50px,30px) scale(1.15); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}</style>
    </div>
  );
}
