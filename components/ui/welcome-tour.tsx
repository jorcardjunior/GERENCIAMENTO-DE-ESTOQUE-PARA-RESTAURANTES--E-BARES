"use client";

import { useAuth } from "@/hooks/use-auth";
import { ChefHat, ChevronRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const WELCOME_KEY = "estoquerest_welcome_done";

type TourStep = {
  target: string;
  label: string;
  description: string;
  icon: string;
  side: "right" | "left" | "bottom" | "top";
};

const TOUR_STEPS: TourStep[] = [
  {
    target: "nav a[href='/app/dashboard']",
    label: "Tela Inicial",
    description:
      "Resumo completo do estoque: alertas, gráficos e atalhos rápidos para o dia a dia.",
    icon: "LayoutDashboard",
    side: "right",
  },
  {
    target: "nav a[href='/app/gestao']",
    label: "Gestão de Estoque",
    description:
      "Cadastre e gerencie itens com categorias personalizadas e controle de quantidades.",
    icon: "Package",
    side: "right",
  },
  {
    target: "nav a[href='/app/estabelecimentos']",
    label: "Estabelecimentos",
    description: "Gerencie múltiplas unidades separadamente.",
    icon: "Store",
    side: "right",
  },
  {
    target: "nav a[href='/app/fichas-tecnicas']",
    label: "Fichas Técnicas",
    description: "Registre receitas com custos detalhados dos seus pratos.",
    icon: "FileText",
    side: "right",
  },
  {
    target: "nav a[href='/app/pedidos-compra']",
    label: "Pedidos de Compra",
    description: "Crie e acompanhe pedidos de reposição de estoque.",
    icon: "ShoppingCart",
    side: "right",
  },
  {
    target: "nav a[href='/app/transferencias']",
    label: "Transferências",
    description: "Transfira itens entre estabelecimentos com controle total de saída e entrada.",
    icon: "ArrowLeftRight",
    side: "right",
  },
  {
    target: "nav a[href='/app/preenchimento']",
    label: "Preenchimento de Estoque",
    description: "Registre entrada e saída de itens de forma rápida, com busca inteligente.",
    icon: "ClipboardList",
    side: "right",
  },
  {
    target: "nav a[href='/app/importar']",
    label: "Importar Dados",
    description: "Importe planilhas para cadastrar itens em lote de forma ágil.",
    icon: "Upload",
    side: "right",
  },
  {
    target: "nav a[href='/app/financeiro']",
    label: "Financeiro",
    description: "Acompanhe receitas, despesas e a saúde financeira do negócio.",
    icon: "DollarSign",
    side: "right",
  },
  {
    target: "nav a[href='/app/relatorios']",
    label: "Relatórios",
    description: "Visualize gráficos completos e indicadores de desempenho.",
    icon: "BarChart3",
    side: "right",
  },
];

const ADMIN_STEPS: TourStep[] = [
  {
    target: "nav a[href='/app/bi']",
    label: "Indicadores",
    description:
      "Acompanhe métricas avançadas, gráficos interativos e sugestão inteligente de compras.",
    icon: "BrainCircuit",
    side: "right",
  },
  {
    target: "nav a[href='/app/usuarios']",
    label: "Usuários",
    description: "Gerencie colaboradores, cargos e permissões de acesso ao sistema.",
    icon: "Users",
    side: "right",
  },
  {
    target: "nav a[href='/app/configuracoes']",
    label: "Configurações",
    description: "Personalize alertas, margens, lead times e o funcionamento do sistema.",
    icon: "Settings",
    side: "right",
  },
];

function useElementPosition(selector: string) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      setReady(true);
    } else {
      const id = setTimeout(() => {
        const retry = document.querySelector(selector) as HTMLElement | null;
        if (retry) {
          const rect = retry.getBoundingClientRect();
          setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
          setReady(true);
        }
      }, 300);
      return () => clearTimeout(id);
    }
  }, [selector]);

  return { pos, ready };
}

function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const { pos, ready } = useElementPosition(step.target);

  if (!ready) return null;

  const tooltipPos =
    step.side === "right"
      ? { top: pos.top, left: pos.left + pos.width + 12 }
      : step.side === "left"
        ? { top: pos.top, left: pos.left - 280 }
        : { top: pos.top + pos.height + 12, left: pos.left };

  const arrowPos =
    step.side === "right"
      ? { top: 16, left: -6 }
      : step.side === "left"
        ? { top: 16, right: -6 }
        : { top: -6, left: 16 };

  return (
    <>
      {/* Glowing highlight on target */}
      <div
        className="fixed z-[90] rounded-lg ring-2 ring-brand-500 ring-offset-2 ring-offset-surface animate-pulse pointer-events-none"
        style={{
          top: pos.top - 4,
          left: pos.left - 4,
          width: pos.width + 8,
          height: pos.height + 8,
        }}
      />

      {/* Tooltip card */}
      <div
        className="fixed z-[100] w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        {/* Arrow */}
        <div
          className="absolute w-3 h-3 bg-white dark:bg-slate-900 border-l border-t border-border rotate-[-45deg]"
          style={arrowPos}
        />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
              {stepIndex + 1} / {totalSteps}
            </span>
            <span className="text-[10px] font-semibold text-text-tertiary">{step.label}</span>
          </div>

          {/* Body */}
          <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>

          {/* Progress dots */}
          <div className="flex gap-1 my-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i <= stepIndex ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-border-light">
            <button
              onClick={onSkip}
              className="text-[11px] font-medium text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Pular
            </button>
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={onPrev}
                  className="px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
                >
                  Voltar
                </button>
              )}
              <button
                onClick={onNext}
                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold rounded-lg shadow-lg shadow-brand-500/20 transition-all flex items-center gap-1"
              >
                {stepIndex < totalSteps - 1 ? (
                  <>
                    Próximo
                    <ChevronRight className="w-3 h-3" />
                  </>
                ) : (
                  "Finalizar"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function WelcomeTour() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(WELCOME_KEY);
    if (!done) setShowWelcome(true);
    setChecked(true);
  }, [user]);

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(WELCOME_KEY);
      setShowWelcome(false);
      setShowTour(true);
      setTourStep(0);
    };
    window.addEventListener("start-tour", handler);
    return () => window.removeEventListener("start-tour", handler);
  }, []);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setShowTour(true);
    setTourStep(0);
  }, []);

  const skipAll = useCallback(() => {
    setShowWelcome(false);
    setShowTour(false);
    localStorage.setItem(WELCOME_KEY, "true");
  }, []);

  const nextStep = useCallback(() => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep((s) => s + 1);
    } else {
      skipAll();
    }
  }, [tourStep, skipAll]);

  const prevStep = useCallback(() => {
    if (tourStep > 0) setTourStep((s) => s - 1);
  }, []);

  if (!user || !checked) return null;

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="h-2 bg-gradient-to-r from-brand-500 via-violet-500 to-brand-500" />
          <div className="p-8 sm:p-10 text-center">
            <div className="w-20 h-20 rounded-[1.25rem] bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-500/25">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-text mb-2">
              Seja bem-vindo, <span className="text-brand-600">{user.name.split(" ")[0]}!</span>
            </h2>
            <p className="text-text-secondary text-sm mb-1 leading-relaxed">
              Olá! Eu sou o <strong className="text-text">Estoque Inteligente</strong>, o sistema
              que vai ajudar você a gerenciar seu estoque de forma simples e eficiente.
            </p>
            <p className="text-text-tertiary text-xs mb-8 leading-relaxed">
              Quer conhecer os principais recursos em um tour rápido?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={startTour}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Fazer Tour
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={skipAll}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-tertiary hover:bg-surface text-text-secondary font-semibold rounded-xl transition-all text-sm"
              >
                Pular Tour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showTour) {
    return (
      <>
        {TOUR_STEPS.map((step, i) =>
          i === tourStep ? (
            <div key={i} className="fixed inset-0 z-[80] pointer-events-none">
              <TourTooltip
                step={step}
                stepIndex={i}
                totalSteps={TOUR_STEPS.length}
                onNext={nextStep}
                onPrev={prevStep}
                onSkip={skipAll}
              />
            </div>
          ) : null,
        )}
      </>
    );
  }

  return null;
}
