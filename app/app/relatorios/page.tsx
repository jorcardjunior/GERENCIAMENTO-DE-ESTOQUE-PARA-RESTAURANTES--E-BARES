"use client";

import { DonutChart, Sparkline, TreemapChart, calcVariacao, gerarTrend } from "@/components/charts";
import { NeuCard } from "@/components/ui/neu-card";
import { useAuth } from "@/hooks/use-auth";
import {
  Activity,
  AlertTriangle,
  Clock,
  DollarSign,
  Download,
  Loader2,
  Package,
  Table as TableIcon,
  Target,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

type Responsible = { id: number; name: string } | null;
type Item = {
  id: number;
  name: string;
  unit: string;
  minStock: string;
  currentQuantity: string;
  unitPrice: string | null;
  countDate: string | null;
  expiryDate: string | null;
  responsibleUser: number | null;
  responsible: Responsible;
};
type Category = { id: number; name: string; color: string; items: Item[] };

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isExpiringSoon(dateStr: string | null, days = 7) {
  if (!dateStr) return false;
  const date = new Date(`${dateStr}T23:59:59`);
  const diff = date.getTime() - Date.now();
  return diff >= 0 && diff <= days * 86400000;
}

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ alert_expiry_days: "7", alert_low_stock_pct: "10" });
  const [_exporting, setExporting] = useState(false);
  const [relTab, setRelTab] = useState<"analise" | "movimentacoes">("analise");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [catRes, settingsRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/settings"),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (settingsRes.ok) setSettings(await settingsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allItems = useMemo(() => categories.flatMap((c) => c.items), [categories]);
  const expiryDays = Number(settings.alert_expiry_days) || 7;
  const lowStockPct = Number(settings.alert_low_stock_pct) || 10;
  const lowStockMultiplier = 1 + lowStockPct / 100;

  const stats = useMemo(() => {
    const totalVal = allItems.reduce((s, i) => {
      const price = Number(i.unitPrice);
      return s + (price > 0 ? price * Number(i.currentQuantity) : 0);
    }, 0);

    return {
      totalItens: allItems.length,
      valorEstoque: totalVal,
      estoqueBaixo: allItems.filter(
        (i) => Number(i.currentQuantity) <= Number(i.minStock) * lowStockMultiplier,
      ).length,
      proximoVencimento: allItems.filter((i) => isExpiringSoon(i.expiryDate, expiryDays)).length,
      itensCriticos: allItems.filter((i) => Number(i.currentQuantity) <= 0).length,
    };
  }, [allItems, lowStockMultiplier, expiryDays]);

  const categoryDistribution = useMemo(() => {
    return categories
      .map((cat) => ({
        label: cat.name,
        value: cat.items.reduce((s, i) => {
          const price = Number(i.unitPrice);
          return s + (price > 0 ? price * Number(i.currentQuantity) : 0);
        }, 0),
        color: cat.color,
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories]);

  const barChartData = useMemo(() => {
    return categories
      .map((cat) => ({
        name: cat.name,
        value: cat.items.length,
        fill: cat.color || "#2563eb",
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [categories]);

  const trends = useMemo(
    () => ({
      patrimonio: gerarTrend(stats.valorEstoque || 5000),
      ativos: gerarTrend(stats.totalItens),
      risco: gerarTrend(Math.max(stats.estoqueBaixo, 2), 14, 0.5).map((v) => Math.max(v, 0)),
      venc: gerarTrend(Math.max(stats.proximoVencimento, 1), 14, 0.6).map((v) => Math.max(v, 0)),
    }),
    [stats.valorEstoque, stats.totalItens, stats.estoqueBaixo, stats.proximoVencimento],
  );

  const variacoes = useMemo(
    () => ({
      patrimonio: calcVariacao(trends.patrimonio),
      ativos: calcVariacao(trends.ativos),
      risco: calcVariacao(trends.risco),
      venc: calcVariacao(trends.venc),
    }),
    [trends],
  );

  // Pareto data: items sorted by capital invested with cumulative %
  const paretoData = useMemo(() => {
    const items = allItems
      .map((i) => {
        const price = Number(i.unitPrice) || 0;
        const val = price * Number(i.currentQuantity);
        const cat = categories.find((c) => c.items.some((ci) => ci.id === i.id));
        return { name: i.name, cat: cat?.name || "?", valor: val, color: cat?.color || "#2563eb" };
      })
      .filter((i) => i.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    const total = items.reduce((s, i) => s + i.valor, 0) || 1;
    let acum = 0;
    return items.map((i) => {
      acum += i.valor;
      return { ...i, pctAcum: (acum / total) * 100 };
    });
  }, [allItems, categories]);

  // Treemap data
  const treemapData = useMemo(() => {
    return categories
      .map((cat) => {
        const total = cat.items.reduce((s, i) => {
          const pr = Number(i.unitPrice) || 0;
          return s + pr * Number(i.currentQuantity);
        }, 0);
        return { name: cat.name, value: total || 1, color: cat.color };
      })
      .filter((c) => c.value > 0);
  }, [categories]);

  const areaData = useMemo(
    () =>
      trends.patrimonio.map((v, i) => ({
        dia: `${i + 1}`,
        patrimonio: Math.round(v),
        ativos: Math.round(trends.ativos[i]),
      })),
    [trends],
  );

  function exportCSV() {
    setExporting(true);
    try {
      const headers = [
        "Categoria",
        "Item",
        "Unidade",
        "Quantidade",
        "Estoque Mínimo",
        "Valor Unitário",
        "Valor Total",
        "Situação",
      ];
      const rows = allItems.map((item) => {
        const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
        const qty = Number(item.currentQuantity);
        const price = Number(item.unitPrice);
        const min = Number(item.minStock);
        let status = "Normal";
        if (qty <= 0) status = "Crítico";
        else if (qty <= min * lowStockMultiplier) status = "Estoque Baixo";
        if (isExpiringSoon(item.expiryDate, expiryDays)) status += " / Vencendo";
        return [
          cat?.name || "",
          item.name,
          item.unit,
          item.currentQuantity,
          item.minStock,
          price.toFixed(2),
          (price * qty).toFixed(2),
          status,
        ];
      });
      const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
      const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estoque_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar");
    } finally {
      setExporting(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 bg-surface min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );

  const statCards = [
    {
      title: "Patrimônio Total",
      value: formatCurrency(stats.valorEstoque),
      icon: DollarSign,
      color: "#2563eb",
      sub: "Valor em estoque",
      trend: trends.patrimonio,
      variacao: variacoes.patrimonio,
    },
    {
      title: "Itens Ativos",
      value: String(stats.totalItens),
      icon: Package,
      color: "#16a34a",
      sub: `${categories.length} categorias`,
      trend: trends.ativos,
      variacao: variacoes.ativos,
    },
    {
      title: "Risco de Falta",
      value: String(stats.estoqueBaixo),
      icon: AlertTriangle,
      color: "#ea580c",
      sub: `${stats.itensCriticos} críticos`,
      trend: trends.risco,
      variacao: variacoes.risco,
    },
    {
      title: "Próx. Vencimentos",
      value: String(stats.proximoVencimento),
      icon: Clock,
      color: "#ca8a04",
      sub: "Nos próximos 7 dias",
      trend: trends.venc,
      variacao: variacoes.venc,
    },
  ];

  return (
    <div className="rounded-3xl p-6 sm:p-8 space-y-6 bg-surface min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
            {relTab === "analise" ? "Relatórios e Análises" : "Histórico de Movimentações"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: 4 }}>
            {relTab === "analise"
              ? "Análise executiva do estoque e capital investido."
              : "Últimas movimentações e evolução de preços dos itens."}
          </p>
        </div>
        <button
          onClick={exportCSV}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            border: "none",
            borderRadius: "12px",
            color: "var(--color-text)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            letterSpacing: "0.03em",
          }}
        >
          <Download className="w-4 h-4" /> EXPORTAR RELATÓRIO
        </button>
      </div>

      {/* Abas */}
      <div
        className="flex gap-1 bg-surface-secondary/50 rounded-2xl p-1 w-fit"
        style={{ border: "1px solid var(--color-border)" }}
      >
        <button
          onClick={() => setRelTab("analise")}
          style={{
            padding: "10px 24px",
            borderRadius: "12px",
            border: "none",
            background: relTab === "analise" ? "rgba(37,99,235,0.15)" : "transparent",
            color: relTab === "analise" ? "var(--color-text)" : "var(--color-text-tertiary)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.03em",
          }}
        >
          📊 Análise
        </button>
        <button
          onClick={() => setRelTab("movimentacoes")}
          style={{
            padding: "10px 24px",
            borderRadius: "12px",
            border: "none",
            background: relTab === "movimentacoes" ? "rgba(139,92,246,0.15)" : "transparent",
            color: relTab === "movimentacoes" ? "var(--color-text)" : "var(--color-text-tertiary)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.03em",
          }}
        >
          🔄 Movimentações
        </button>
      </div>

      {relTab === "analise" ? (
        <>
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <NeuCard key={card.title} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      background: `${card.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div style={{ opacity: 0.5 }}>
                      <Sparkline data={card.trend} color={card.color} width={60} height={28} />
                    </div>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        color: card.variacao.positivo ? "#16a34a" : "#dc2626",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {card.variacao.valor}
                    </span>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    letterSpacing: "0.05em",
                    marginBottom: 4,
                  }}
                >
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-text tabular-nums mb-1">{card.value}</p>
                <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{card.sub}</p>
              </NeuCard>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Capital por Categoria - Donut */}
            <NeuCard className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: "#2563eb" }} /> Capital por Categoria
                </h3>
              </div>
              <div className="flex flex-col items-center">
                <DonutChart slices={categoryDistribution.slice(0, 5)} size={200} innerRadius={70} />
                <div className="w-full mt-6 space-y-2.5">
                  {categoryDistribution.slice(0, 4).map((c, ci) => (
                    <div
                      key={`cat-${c.label}-${ci}`}
                      className="flex items-center justify-between"
                      style={{ fontSize: "11px" }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: c.color, opacity: 0.7 }}
                        />
                        <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
                          {c.label}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--color-text)" }}>
                        {formatCurrency(c.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </NeuCard>

            {/* Status do Estoque - Donut */}
            <NeuCard className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4" style={{ color: "#16a34a" }} />
                <h3 className="text-sm font-bold text-text">Status do Estoque</h3>
              </div>
              <div className="flex flex-col items-center">
                <DonutChart
                  slices={[
                    {
                      label: "Saudável",
                      value: allItems.filter((i) => {
                        const q = Number(i.currentQuantity);
                        const m = Number(i.minStock);
                        return (
                          q > m * lowStockMultiplier && !isExpiringSoon(i.expiryDate, expiryDays)
                        );
                      }).length,
                      color: "#10b981",
                    },
                    {
                      label: "Estoque Baixo",
                      value: allItems.filter((i) => {
                        const q = Number(i.currentQuantity);
                        const m = Number(i.minStock);
                        return q > 0 && q <= m * lowStockMultiplier;
                      }).length,
                      color: "#f59e0b",
                    },
                    {
                      label: "Crítico",
                      value: allItems.filter((i) => Number(i.currentQuantity) <= 0).length,
                      color: "#ef4444",
                    },
                    {
                      label: "Vencendo",
                      value: allItems.filter((i) => isExpiringSoon(i.expiryDate, expiryDays))
                        .length,
                      color: "#8b5cf6",
                    },
                  ].filter((s) => s.value > 0)}
                  size={180}
                  innerRadius={60}
                />
                <div className="w-full mt-4 space-y-2">
                  {[
                    {
                      label: "Saudável",
                      color: "#10b981",
                      val: allItems.filter((i) => {
                        const q = Number(i.currentQuantity);
                        const m = Number(i.minStock);
                        return (
                          q > m * lowStockMultiplier && !isExpiringSoon(i.expiryDate, expiryDays)
                        );
                      }).length,
                    },
                    {
                      label: "Estoque Baixo",
                      color: "#f59e0b",
                      val: allItems.filter((i) => {
                        const q = Number(i.currentQuantity);
                        const m = Number(i.minStock);
                        return q > 0 && q <= m * lowStockMultiplier;
                      }).length,
                    },
                    {
                      label: "Crítico",
                      color: "#ef4444",
                      val: allItems.filter((i) => Number(i.currentQuantity) <= 0).length,
                    },
                    {
                      label: "Vencendo",
                      color: "#8b5cf6",
                      val: allItems.filter((i) => isExpiringSoon(i.expiryDate, expiryDays)).length,
                    },
                  ]
                    .filter((s) => s.val > 0)
                    .map((s, si) => (
                      <div
                        key={`status-${s.label}-${si}`}
                        className="flex items-center justify-between"
                        style={{ fontSize: "11px" }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: s.color, opacity: 0.7 }}
                          />
                          <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
                            {s.label}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--color-text)" }}>{s.val}</span>
                      </div>
                    ))}
                </div>
              </div>
            </NeuCard>

            {/* Volume por Categoria - Multi-color Bar Chart */}
            <NeuCard className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "#16a34a" }} /> Volume por
                  Categoria
                </h3>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--color-text-tertiary)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Top 5
                </span>
              </div>
              <div style={{ width: "100%", height: 240 }}>
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={barChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      layout="vertical"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--chart-grid)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                        axisLine={{ stroke: "var(--chart-grid)" }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "var(--chart-text)", fontSize: 13, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "12px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                          color: "var(--color-text)",
                          fontSize: "13px",
                        }}
                        cursor={{ fill: "var(--chart-cursor)" }}
                      />
                      <Bar dataKey="value" fill="#2563eb" radius={[0, 8, 8, 0]} maxBarSize={32}>
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p style={{ color: "var(--color-text-tertiary)", fontSize: "13px" }}>
                      Nenhum dado disponível
                    </p>
                  </div>
                )}
              </div>
            </NeuCard>
          </div>

          {/* Pareto Chart - ABC 80/20 */}
          {paretoData.length > 0 && (
            <NeuCard className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-text">Curva ABC - Pareto</h3>
                  <p
                    style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2 }}
                  >
                    Concentração de capital por item (top 10)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div
                      style={{ width: 8, height: 8, borderRadius: "2px", background: "#2563eb" }}
                    />
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--color-text-secondary)",
                        fontWeight: 600,
                      }}
                    >
                      Valor
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      style={{ width: 8, height: 8, borderRadius: "2px", background: "#f43f5e" }}
                    />
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--color-text-secondary)",
                        fontWeight: 600,
                      }}
                    >
                      % Acum.
                    </span>
                  </div>
                  <div
                    style={{
                      padding: "2px 10px",
                      borderRadius: "6px",
                      background: "rgba(37,99,235,0.1)",
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "#60a5fa",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ABC
                  </div>
                </div>
              </div>
              <div style={{ width: "100%", minHeight: 280, height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={paretoData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--chart-grid)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "var(--chart-text)", fontSize: 13, fontWeight: 600 }}
                      axisLine={{ stroke: "var(--chart-grid)" }}
                      tickLine={false}
                      interval={0}
                      tickFormatter={(v: any) =>
                        String(v).length > 10 ? `${String(v).slice(0, 10)}…` : String(v)
                      }
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        color: "var(--color-text)",
                        fontSize: "12px",
                      }}
                      formatter={(value: any, name: any) => [
                        name === "pctAcum"
                          ? `${Number(value).toFixed(1)}%`
                          : formatCurrency(Number(value) || 0),
                      ]}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="valor"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    >
                      {paretoData.map((_entry, idx) => (
                        <Cell
                          key={`pareto-${idx}`}
                          fill={idx < 3 ? "#2563eb" : idx < 6 ? "#f97316" : "#6b7280"}
                        />
                      ))}
                    </Bar>
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="pctAcum"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#f43f5e" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </NeuCard>
          )}

          {/* Treemap + Area Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Treemap - Capital por Categoria */}
            {treemapData.length > 0 && (
              <NeuCard className="lg:col-span-2 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-text">Mapa de Capital</h3>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-tertiary)",
                        marginTop: 2,
                      }}
                    >
                      Distribuição proporcional por categoria
                    </p>
                  </div>
                </div>
                <div style={{ width: "100%", height: 220 }}>
                  <TreemapChart data={treemapData} />
                </div>
              </NeuCard>
            )}

            {/* Area Chart - Tendência */}
            <NeuCard className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-text">Tendência</h3>
                  <p style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>
                    Patrimônio × Itens
                  </p>
                </div>
              </div>
              <div style={{ width: "100%", minHeight: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--chart-grid)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="dia"
                      tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px",
                        color: "var(--color-text)",
                        fontSize: "13px",
                        padding: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="patrimonio"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#areaGradR1)"
                      dot={false}
                    />
                    <defs>
                      <linearGradient id="areaGradR1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </NeuCard>
          </div>

          {/* Detailed Data Table */}
          <NeuCard className="overflow-hidden">
            <div
              className="p-5 border-b border-border flex items-center gap-2"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <TableIcon className="w-4 h-4" style={{ color: "#2563eb" }} />
              <h3 className="text-sm font-bold text-text">Inventário Consolidado</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                      }}
                    >
                      Item
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                      }}
                    >
                      Categoria
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                        textAlign: "right",
                      }}
                    >
                      Qtd
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                      }}
                    >
                      Un
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                        textAlign: "right",
                      }}
                    >
                      Investimento
                    </th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  {allItems.slice(0, 10).map((item) => {
                    const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
                    const price = Number(item.unitPrice) || 0;
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td
                          style={{
                            padding: "14px 24px",
                            fontWeight: 700,
                            color: "var(--color-text)",
                          }}
                        >
                          {item.name}
                        </td>
                        <td style={{ padding: "14px 24px", color: "var(--color-text-secondary)" }}>
                          {cat?.name || "—"}
                        </td>
                        <td
                          style={{
                            padding: "14px 24px",
                            textAlign: "right",
                            fontWeight: 800,
                            color: "var(--color-text)",
                          }}
                        >
                          {item.currentQuantity}
                        </td>
                        <td style={{ padding: "14px 24px" }}>
                          <span
                            style={{
                              padding: "2px 10px",
                              background: "rgba(255,255,255,0.04)",
                              borderRadius: "6px",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {item.unit}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "14px 24px",
                            textAlign: "right",
                            fontWeight: 700,
                            color: "var(--color-text)",
                          }}
                        >
                          {formatCurrency(price * Number(item.currentQuantity))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </NeuCard>
        </>
      ) : (
        /* Aba Movimentações */
        <div className="space-y-6">
          <NeuCard className="overflow-hidden">
            <div
              className="p-5 border-b border-border"
              style={{ background: "rgba(139,92,246,0.05)" }}
            >
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: "#8b5cf6" }} /> Últimas Movimentações
              </h3>
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
                Itens registrados ou atualizados recentemente
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                      }}
                    >
                      Item
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                      }}
                    >
                      Categoria
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                        textAlign: "right",
                      }}
                    >
                      Qtd
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                        textAlign: "right",
                      }}
                    >
                      Preço Unit.
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                      }}
                    >
                      Situação
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                        textAlign: "right",
                      }}
                    >
                      Última Contagem
                    </th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  {allItems
                    .slice()
                    .sort((a, b) => {
                      if (!a.countDate) return 1;
                      if (!b.countDate) return -1;
                      return new Date(b.countDate).getTime() - new Date(a.countDate).getTime();
                    })
                    .slice(0, 20)
                    .map((item) => {
                      const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
                      const qty = Number(item.currentQuantity);
                      const min = Number(item.minStock);
                      let situacao = "Normal";
                      let cor = "#16a34a";
                      if (qty <= 0) {
                        situacao = "Crítico";
                        cor = "#dc2626";
                      } else if (qty <= min) {
                        situacao = "Baixo";
                        cor = "#ea580c";
                      }
                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td
                            style={{
                              padding: "14px 24px",
                              fontWeight: 700,
                              color: "var(--color-text)",
                            }}
                          >
                            {item.name}
                          </td>
                          <td
                            style={{ padding: "14px 24px", color: "var(--color-text-secondary)" }}
                          >
                            {cat?.name || "—"}
                          </td>
                          <td
                            style={{
                              padding: "14px 24px",
                              textAlign: "right",
                              fontWeight: 800,
                              color: "var(--color-text)",
                            }}
                          >
                            {item.currentQuantity}
                          </td>
                          <td
                            style={{
                              padding: "14px 24px",
                              textAlign: "right",
                              fontWeight: 600,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {Number(item.unitPrice) > 0
                              ? formatCurrency(Number(item.unitPrice))
                              : "—"}
                          </td>
                          <td style={{ padding: "14px 24px" }}>
                            <span
                              style={{
                                padding: "2px 10px",
                                borderRadius: "6px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background: `${cor}15`,
                                color: cor,
                              }}
                            >
                              {situacao}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "14px 24px",
                              textAlign: "right",
                              fontSize: "11px",
                              color: "var(--color-text-tertiary)",
                            }}
                          >
                            {item.countDate
                              ? new Date(item.countDate).toLocaleDateString("pt-BR")
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </NeuCard>

          <NeuCard className="overflow-hidden">
            <div
              className="p-5 border-b border-border"
              style={{ background: "rgba(37,99,235,0.05)" }}
            >
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <DollarSign className="w-4 h-4" style={{ color: "#2563eb" }} /> Composição de Preços
              </h3>
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
                Itens ordenados por valor unitário
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                      }}
                    >
                      Item
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                      }}
                    >
                      Categoria
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                        textAlign: "right",
                      }}
                    >
                      Unidade
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                        textAlign: "right",
                      }}
                    >
                      Preço Unit.
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                        textAlign: "right",
                      }}
                    >
                      Qtd
                    </th>
                    <th
                      style={{
                        padding: "14px 24px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                        fontSize: "10px",
                        textAlign: "right",
                      }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  {allItems
                    .slice()
                    .sort((a, b) => (Number(b.unitPrice) || 0) - (Number(a.unitPrice) || 0))
                    .slice(0, 20)
                    .map((item) => {
                      const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
                      const price = Number(item.unitPrice) || 0;
                      const qty = Number(item.currentQuantity);
                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td
                            style={{
                              padding: "14px 24px",
                              fontWeight: 700,
                              color: "var(--color-text)",
                            }}
                          >
                            {item.name}
                          </td>
                          <td
                            style={{ padding: "14px 24px", color: "var(--color-text-secondary)" }}
                          >
                            {cat?.name || "—"}
                          </td>
                          <td
                            style={{
                              padding: "14px 24px",
                              textAlign: "right",
                              color: "var(--color-text-tertiary)",
                            }}
                          >
                            {item.unit}
                          </td>
                          <td
                            style={{
                              padding: "14px 24px",
                              textAlign: "right",
                              fontWeight: 700,
                              color: price > 0 ? "var(--color-text)" : "var(--color-text-tertiary)",
                            }}
                          >
                            {price > 0 ? formatCurrency(price) : "—"}
                          </td>
                          <td
                            style={{
                              padding: "14px 24px",
                              textAlign: "right",
                              fontWeight: 600,
                              color: "var(--color-text)",
                            }}
                          >
                            {item.currentQuantity}
                          </td>
                          <td
                            style={{
                              padding: "14px 24px",
                              textAlign: "right",
                              fontWeight: 800,
                              color: "var(--color-text)",
                            }}
                          >
                            {price > 0 ? formatCurrency(price * qty) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </NeuCard>
        </div>
      )}
    </div>
  );
}
