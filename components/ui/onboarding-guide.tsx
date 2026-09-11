"use client";

import { BarChart3, Bell, Package, Users, X } from "lucide-react";
import { useState } from "react";

const STEPS = [
  {
    icon: Package,
    title: "Cadastre seus itens",
    description:
      "Adicione produtos, insumos e ingredientes ao seu estoque com categorias personalizadas.",
  },
  {
    icon: Bell,
    title: "Ative os alertas",
    description: "Receba notificações sobre estoque baixo e produtos próximos ao vencimento.",
  },
  {
    icon: BarChart3,
    title: "Acompanhe relatórios",
    description: "Visualize dashboards com indicadores em tempo real do seu negócio.",
  },
  {
    icon: Users,
    title: "Convide sua equipe",
    description: "Adicione colaboradores com permissões personalizadas para cada função.",
  },
];

export function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];

  return (
    <div className="fixed bottom-6 left-6 z-40 max-w-sm w-full">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Passo {currentStep + 1} de {STEPS.length}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Fechar guia"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <step.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{step.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Voltar
              </button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                Começar!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
