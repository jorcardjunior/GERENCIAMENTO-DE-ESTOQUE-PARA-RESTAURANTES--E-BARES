"use client";

import { useAuth } from "@/hooks/use-auth";
import { downloadCSV } from "@/lib/export-csv";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Download,
  Loader2,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type SugestaoItem = {
  catalogItemId: string;
  nome: string;
  categoria: string;
  unidade: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  consumoMedioDiario: number;
  diasAteFaltar: number;
  quantidadeSugerida: number;
  custoMedio: number;
  custoEstimado: number;
  prioridade: "alta" | "media" | "baixa";
};

type SugestaoResponse = {
  itens: SugestaoItem[];
  totalItens: number;
  totalCustoEstimado: number;
  dataGeracao: string;
};

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const PRIORIDADE_CONFIG = {
  alta: { label: "Alta", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  media: { label: "Média", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  baixa: { label: "Baixa", color: "text-green-400 bg-green-500/10 border-green-500/20" },
};

function NeuCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        boxShadow:
          "6px 6px 14px rgba(0,0,0,0.4), -4px -4px 12px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  );
}

export default function SugestaoCompraPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SugestaoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bi/sugestao-compra");
      if (res.ok) {
        const json: SugestaoResponse = await res.json();
        setData(json);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (!data) return;
    if (selectedIds.size === data.itens.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.itens.map((i) => i.catalogItemId)));
    }
  }

  const totalSelecionado =
    data?.itens
      .filter((i) => selectedIds.has(i.catalogItemId))
      .reduce((s, i) => s + i.custoEstimado, 0) ?? 0;

  function exportCSV() {
    if (!data) return;
    const headers = [
      "Item",
      "Categoria",
      "Estoque Atual",
      "Estoque Mínimo",
      "Consumo/Dia",
      "Dias Restantes",
      "Qtd. Sugerida",
      "Custo Médio",
      "Custo Estimado",
      "Prioridade",
    ];
    const rows = data.itens.map((i) => [
      i.nome,
      i.categoria,
      i.estoqueAtual,
      i.estoqueMinimo,
      i.consumoMedioDiario,
      i.diasAteFaltar,
      i.quantidadeSugerida,
      i.custoMedio,
      i.custoEstimado,
      i.prioridade,
    ]);
    downloadCSV(`sugestao_compra_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app/bi"
            className="p-2 rounded-xl hover:bg-surface-secondary transition-colors text-text-tertiary hover:text-text"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-brand-400" />
              Sugestão de Compra
            </h1>
            <p className="text-sm text-text-tertiary mt-0.5">
              Itens recomendados para reposição baseados no consumo dos últimos 30 dias
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary
              hover:text-text bg-surface-secondary hover:bg-surface-tertiary transition-all border border-border-light"
          >
            <Sparkles className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary
              hover:text-text bg-surface-secondary hover:bg-surface-tertiary transition-all border border-border-light"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {!data || data.itens.length === 0 ? (
        <NeuCard className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-text-tertiary mb-3" />
          <p className="text-text-secondary font-medium">Nenhum item precisa de reposição</p>
          <p className="text-sm text-text-tertiary mt-1">
            Todos os itens estão com estoque adequado.
          </p>
        </NeuCard>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <NeuCard className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-tertiary">Itens para Comprar</p>
                <Package className="w-5 h-5 text-brand-400" />
              </div>
              <p className="text-2xl font-bold text-text mt-1">{data.totalItens}</p>
            </NeuCard>
            <NeuCard className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-tertiary">Custo Total Estimado</p>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-text mt-1">
                {formatCurrency(data.totalCustoEstimado)}
              </p>
            </NeuCard>
            <NeuCard className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-tertiary">Prioridade Alta</p>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-text mt-1">
                {data.itens.filter((i) => i.prioridade === "alta").length}
              </p>
            </NeuCard>
            <NeuCard className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-tertiary">Selecionado</p>
                <CheckCircle className="w-5 h-5 text-brand-400" />
              </div>
              <p className="text-2xl font-bold text-text mt-1">
                {formatCurrency(totalSelecionado)}
              </p>
            </NeuCard>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                text-text-secondary hover:text-text bg-surface-secondary hover:bg-surface-tertiary
                transition-all border border-border-light"
            >
              {selectedIds.size === data.itens.length
                ? "Desmarcar Todos"
                : `Selecionar Todos (${data.itens.length})`}
            </button>
            {selectedIds.size > 0 && (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/20"
              >
                <CheckCircle className="w-4 h-4" />
                Aprovar {selectedIds.size} Item{selectedIds.size > 1 ? "ns" : ""}
              </button>
            )}
          </div>

          {/* Table */}
          <NeuCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="p-4 text-left w-10">
                      <input
                        type="checkbox"
                        checked={data.itens.length > 0 && selectedIds.size === data.itens.length}
                        onChange={selectAll}
                        className="rounded border-border bg-surface-secondary accent-brand-500"
                      />
                    </th>
                    <th className="p-4 text-left text-text-tertiary font-medium">Item</th>
                    <th className="p-4 text-left text-text-tertiary font-medium">Categoria</th>
                    <th className="p-4 text-right text-text-tertiary font-medium">Estoque</th>
                    <th className="p-4 text-right text-text-tertiary font-medium">Consumo/Dia</th>
                    <th className="p-4 text-right text-text-tertiary font-medium">
                      Dias Restantes
                    </th>
                    <th className="p-4 text-right text-text-tertiary font-medium">Qtd. Sugerida</th>
                    <th className="p-4 text-right text-text-tertiary font-medium">
                      Custo Estimado
                    </th>
                    <th className="p-4 text-center text-text-tertiary font-medium">Prioridade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.itens.map((item) => {
                    const cfg = PRIORIDADE_CONFIG[item.prioridade];
                    return (
                      <tr
                        key={item.catalogItemId}
                        className="border-b border-border-light/50 hover:bg-surface-secondary/50 transition-colors"
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.catalogItemId)}
                            onChange={() => toggleItem(item.catalogItemId)}
                            className="rounded border-border bg-surface-secondary accent-brand-500"
                          />
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-text font-medium">{item.nome}</p>
                            <p className="text-xs text-text-tertiary">
                              Est. mínimo: {item.estoqueMinimo} {item.unidade}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-text-secondary">{item.categoria}</td>
                        <td className="p-4 text-right">
                          <span
                            className={`font-medium tabular-nums ${
                              item.estoqueAtual <= item.estoqueMinimo ? "text-red-400" : "text-text"
                            }`}
                          >
                            {item.estoqueAtual} {item.unidade}
                          </span>
                        </td>
                        <td className="p-4 text-right text-text-secondary tabular-nums">
                          {item.consumoMedioDiario} {item.unidade}
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={`font-medium tabular-nums ${
                              item.diasAteFaltar <= 3
                                ? "text-red-400"
                                : item.diasAteFaltar <= 7
                                  ? "text-yellow-400"
                                  : "text-text-secondary"
                            }`}
                          >
                            {item.diasAteFaltar >= 999 ? "∞" : item.diasAteFaltar}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold text-text tabular-nums">
                            {item.quantidadeSugerida} {item.unidade}
                          </span>
                        </td>
                        <td className="p-4 text-right text-text-secondary tabular-nums">
                          {formatCurrency(item.custoEstimado)}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cfg.color}`}
                          >
                            {item.prioridade === "alta" ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : item.prioridade === "media" ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </NeuCard>

          {/* Footer Info */}
          <p className="text-xs text-text-tertiary text-center">
            Gerado em {data.dataGeracao ? new Date(data.dataGeracao).toLocaleString("pt-BR") : "—"}{" "}
            · Lead time considerado: 7 dias · Consumo base: últimos 30 dias
          </p>
        </>
      )}
    </div>
  );
}
