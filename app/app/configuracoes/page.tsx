"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Save, Loader2, Clock, AlertTriangle, Settings2 } from "lucide-react";

export default function ConfiguracoesPage() {
  const { user } = useAuth();

  const [expiryDays, setExpiryDays] = useState("7");
  const [lowStockPct, setLowStockPct] = useState("10");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setExpiryDays(data.alert_expiry_days || "7");
        setLowStockPct(data.alert_low_stock_pct || "10");
      })
      .catch(() => toast.error("Erro ao carregar configurações"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_expiry_days: expiryDays,
          alert_low_stock_pct: lowStockPct,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-[#0f172a]">Configurações do Sistema</h1>
        <p className="text-[#64748b] text-sm mt-1">
          Defina os limites para alertas de vencimento e estoque baixo.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Alerta de Vencimento */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0f172a]">Alerta de Vencimento</h2>
              <p className="text-sm text-[#64748b]">
                Defina com quantos dias de antecedência o sistema deve alertar sobre itens próximos ao vencimento.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              Dias de antecedência
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="365"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-24 px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              />
              <span className="text-sm text-[#64748b]">dias</span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-2">
              Exemplo: com 7 dias, itens com vencimento em até 7 dias serão destacados no painel.
            </p>
          </div>
        </div>

        {/* Card: Alerta de Estoque Baixo */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0f172a]">Alerta de Estoque Baixo</h2>
              <p className="text-sm text-[#64748b]">
                Defina a porcentagem acima do estoque mínimo para considerar um item como estoque baixo.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              Percentual de tolerância
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="100"
                value={lowStockPct}
                onChange={(e) => setLowStockPct(e.target.value)}
                className="w-24 px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              />
              <span className="text-sm text-[#64748b]">%</span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-2">
              Exemplo: com 10%, itens com estoque até 10% acima do mínimo serão considerados como estoque baixo.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 h-11 rounded-lg font-bold text-sm text-white bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          Salvar Configurações
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-[#64748b]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">Sobre as Configurações</h3>
        </div>
        <p className="text-sm text-[#64748b] leading-relaxed">
          As configurações definidas aqui são aplicadas globalmente no sistema. Os alertas de vencimento e
          estoque baixo aparecerão no painel principal (Dashboard) e nas páginas de gestão, destacando os
          itens que precisam de atenção. Apenas administradores podem alterar estas configurações.
        </p>
      </div>
    </div>
  );
}
