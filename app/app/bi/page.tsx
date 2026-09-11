"use client";

import { DonutChart, GaugeChart, Sparkline, calcVariacao, gerarTrend } from "@/components/charts";
import { NeuCard } from "@/components/ui/neu-card";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3,
  BrainCircuit,
  CalendarDays,
  Download,
  Flame,
  LineChart,
  Loader2,
  PiggyBank,
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
  Legend,
  Line,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Category = { id: number; name: string; color: string; items: any[] };

type BiResponse = {
  resumo: {
    totalItens: number;
    totalCategorias: number;
    totalEstabelecimentos: number;
    capitalTotal: number;
  };
  giro: {
    porCategoria: { name: string; giro: number; dias: number; fill: string }[];
    medio: number;
  };
  cmv: { porMes: { mes: string; cmv: number; meta: number }[]; atual: number; medio: number };
  perda: { porTipo: { label: string; value: number; color: string }[]; total: number };
  custoxPreco: { pratos: { nome: string; custo: number; preco: number; lucro: number }[] };
  gargalos: {
    porCategoria: { name: string; parados30: number; parados60: number; fill: string }[];
    total: number;
  };
  sazonalidade: { porDia: { dia: string; consumo: number; fill: string }[] };
  budget: {
    porMes: { mes: string; previsto: number; real: number }[];
    totalPrevisto: number;
    totalReal: number;
  };
  comparativoAnual: { porMes: { mes: string; anoAtual: number; anoAnterior: number }[] };
  previsao: { projecao: { dia: string; atual: number; projetado: number }[] };
  healthScore: number;
};

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function BiPage() {
  const { user } = useAuth();
  const [data, setData] = useState<BiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bi");
      if (res.ok) {
        const json: BiResponse = await res.json();
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

  const giroMedio = useMemo(() => data?.giro.medio ?? 0, [data]);
  const perdaTotal = useMemo(() => data?.perda.total ?? 0, [data]);
  const cmvAtual = useMemo(() => data?.cmv.atual ?? 0, [data]);
  const cmvMedio = useMemo(() => data?.cmv.medio ?? 0, [data]);
  const healthScore = useMemo(() => data?.healthScore ?? 0, [data]);
  const margemMedia = useMemo(() => {
    if (!data?.custoxPreco?.pratos?.length) return 60;
    const margens = data.custoxPreco.pratos.map((d) => ((d.preco - d.custo) / d.custo) * 100);
    return margens.reduce((s, m) => s + m, 0) / margens.length;
  }, [data]);

  const scoreTrend = useMemo(
    () => gerarTrend(healthScore || 50, 14, 0.08).map((v) => Math.min(v, 100)),
    [healthScore],
  );
  const turnoverTrend = useMemo(() => gerarTrend(giroMedio || 3, 14, 0.2), [giroMedio]);
  const lossTrend = useMemo(() => gerarTrend(Math.max(perdaTotal / 10, 5), 14, 0.3), [perdaTotal]);
  const cmvTrend = useMemo(() => gerarTrend(cmvMedio || 30, 14, 0.08), [cmvMedio]);

  const variacoes = useMemo(
    () => ({
      score: calcVariacao(scoreTrend),
      turnover: calcVariacao(turnoverTrend),
      loss: calcVariacao(lossTrend),
      cmv: calcVariacao(cmvTrend),
    }),
    [scoreTrend, turnoverTrend, lossTrend, cmvTrend],
  );

  const totalGargalos = useMemo(() => data?.gargalos.total ?? 0, [data]);
  const budgetDiff = useMemo(() => {
    if (!data?.budget) return "0";
    const { totalPrevisto, totalReal } = data.budget;
    if (totalPrevisto === 0) return "0";
    return `${(((totalReal - totalPrevisto) / totalPrevisto) * 100).toFixed(0)}`;
  }, [data]);
  const perdaPctLabel = useMemo(() => {
    if (!data?.perda?.porTipo?.length) return "0%";
    const topType = data.perda.porTipo.reduce(
      (max, p) => (p.value > max.value ? p : max),
      data.perda.porTipo[0],
    );
    return `${((topType.value / perdaTotal) * 100).toFixed(0)}%`;
  }, [data, perdaTotal]);

  const lucroMedio = useMemo(() => {
    if (!data?.custoxPreco?.pratos?.length) return 0;
    return (
      data.custoxPreco.pratos.reduce((s, d) => s + d.lucro, 0) / data.custoxPreco.pratos.length
    );
  }, [data]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 bg-surface min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );

  const statCards = [
    {
      title: "Saúde do Negócio",
      value: `${healthScore}/100`,
      icon: BrainCircuit,
      color: "#2563eb",
      sub: `Giro ${giroMedio.toFixed(1)}x`,
      trend: scoreTrend,
      variacao: variacoes.score,
    },
    {
      title: "Giro Médio",
      value: `${giroMedio.toFixed(1)}x`,
      icon: TrendingUp,
      color: "#10b981",
      sub: "Rotatividade do estoque",
      trend: turnoverTrend,
      variacao: variacoes.turnover,
    },
    {
      title: "CMV Médio",
      value: `${cmvMedio.toFixed(1)}%`,
      icon: PiggyBank,
      color: "#f59e0b",
      sub: "Custo da Mercadoria Vendida",
      trend: cmvTrend,
      variacao: variacoes.cmv,
    },
    {
      title: "Perda Total",
      value: formatCurrency(perdaTotal),
      icon: Flame,
      color: "#ef4444",
      sub: `${data?.perda.porTipo.length ?? 0} tipos de perda`,
      trend: lossTrend,
      variacao: variacoes.loss,
    },
  ];

  const perdaSlices = data?.perda.porTipo ?? [];
  const sazonalData = data?.sazonalidade.porDia ?? [];
  const budgetData = data?.budget.porMes ?? [];
  const giroCategories = data?.giro.porCategoria ?? [];
  const cmvData = data?.cmv.porMes ?? [];
  const scatterData = data?.custoxPreco.pratos ?? [];
  const gargaloData = data?.gargalos.porCategoria ?? [];
  const comparativoData = data?.comparativoAnual.porMes ?? [];
  const previsaoData = data?.previsao.projecao ?? [];

  function exportCSV() {
    if (!data) return;
    const lines: string[] = [];
    const sec = (label: string) => lines.push(`\n--- ${label} ---`);
    const row = (...vals: (string | number)[]) => lines.push(vals.join(";"));
    sec("Resumo");
    row("Métrica", "Valor");
    row("Total Itens", data.resumo?.totalItens ?? 0);
    row("Capital Total", data.resumo?.capitalTotal ?? 0);
    row("Health Score", healthScore);
    sec("Giro por Categoria");
    row("Categoria", "Giro (x)", "Dias Estoque");
    data.giro.porCategoria.forEach((c) => row(c.name, c.giro, c.dias));
    sec("CMV Mensal");
    row("Mês", "CMV (%)", "Meta (%)");
    data.cmv.porMes.forEach((m) => row(m.mes, m.cmv, m.meta));
    sec("Perda por Tipo");
    row("Tipo", "Valor (R$)");
    data.perda.porTipo.forEach((p) => row(p.label, p.value));
    if (data.custoxPreco.pratos.length) {
      sec("Custo vs Preço");
      row("Prato", "Custo (R$)", "Preço (R$)", "Lucro (R$)");
      data.custoxPreco.pratos.forEach((p) => row(p.nome, p.custo, p.preco, p.lucro));
    }
    sec("Sazonalidade");
    row("Dia", "Consumo");
    data.sazonalidade.porDia.forEach((d) => row(d.dia, d.consumo));
    sec("Budget (Previsto vs Real)");
    row("Mês", "Previsto (R$)", "Real (R$)");
    data.budget.porMes.forEach((b) => row(b.mes, b.previsto, b.real));
    sec("Comparativo Anual");
    row("Mês", "Ano Atual (R$)", "Ano Anterior (R$)");
    data.comparativoAnual.porMes.forEach((c) => row(c.mes, c.anoAtual, c.anoAnterior));
    const csvContent = lines.join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bi_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-3xl p-6 sm:p-8 space-y-6 bg-surface min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">Indicadores</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: 4 }}>
            Visão executiva: giro, perdas, margens, CMV e sazonalidade.
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
          <Download className="w-4 h-4" /> EXPORTAR CSV
        </button>
      </div>

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

      {/* Health Score */}
      <NeuCard className="p-8">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <BrainCircuit className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-text">Saúde do Negócio</h3>
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginBottom: 20 }}>
            Índice composto: {giroMedio.toFixed(1)}x giro | {margemMedia.toFixed(0)}% margem |{" "}
            {perdaPctLabel} perda
          </p>
          <GaugeChart
            value={healthScore}
            max={100}
            size={200}
            color={healthScore > 70 ? "#10b981" : healthScore > 40 ? "#f59e0b" : "#ef4444"}
            label="SAÚDE DO NEGÓCIO"
            subtitle={`${healthScore}/100`}
          />
          <div className="grid grid-cols-3 gap-6 mt-8 w-full max-w-lg">
            {[
              {
                label: "Giro",
                value: `${giroMedio.toFixed(1)}x`,
                pct: Math.min((giroMedio / 10) * 100, 100),
                color: "#10b981",
              },
              {
                label: "Margem",
                value: `${margemMedia.toFixed(0)}%`,
                pct: Math.min(margemMedia, 100),
                color: "#2563eb",
              },
              {
                label: "Perda",
                value: perdaPctLabel,
                pct: Math.max(0, 100 - perdaTotal / 100),
                color: "#f59e0b",
              },
            ].map((m) => (
              <div key={`health-${m.label}`} className="flex flex-col items-center">
                <div
                  className="w-full h-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", marginBottom: 8 }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${m.pct}%`,
                      background: m.color,
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text)" }}>
                  {m.value}
                </p>
                <p style={{ fontSize: "9px", color: "var(--color-text-tertiary)" }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </NeuCard>

      {/* Row: Giro × DIO × Perda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <NeuCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" /> Giro de Estoque
            </h3>
          </div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={giroCategories}
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
                <Bar dataKey="giro" fill="#2563eb" radius={[0, 8, 8, 0]} maxBarSize={32}>
                  {giroCategories.map((entry, idx) => (
                    <Cell key={`giro-${entry.name}-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>

        <NeuCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-warning" /> Dias de Estoque
              (DIO)
            </h3>
          </div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={giroCategories}
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
                <Bar dataKey="dias" fill="#f59e0b" radius={[0, 8, 8, 0]} maxBarSize={32}>
                  {giroCategories.map((entry, idx) => (
                    <Cell key={`dio-${entry.name}-${idx}`} fill="#f59e0b" />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>

        <NeuCard className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-4 h-4 text-danger" />
            <h3 className="text-sm font-bold text-text">Perda por Tipo</h3>
          </div>
          {perdaSlices.length > 0 ? (
            <div className="flex flex-col items-center">
              <DonutChart slices={perdaSlices} size={180} innerRadius={60} total={perdaTotal} />
              <div className="w-full mt-4 space-y-2">
                {perdaSlices.map((p, pi) => (
                  <div
                    key={`perda-${p.label}-${pi}`}
                    className="flex items-center justify-between"
                    style={{ fontSize: "11px" }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: p.color, opacity: 0.7 }}
                      />
                      <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
                        {p.label}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, color: "var(--color-text)" }}>
                      {formatCurrency(p.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p
              style={{
                color: "var(--color-text-tertiary)",
                fontSize: "13px",
                textAlign: "center",
                padding: 20,
              }}
            >
              Nenhum dado disponível
            </p>
          )}
        </NeuCard>
      </div>

      {/* CMV */}
      <NeuCard className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-text">CMV — Custo da Mercadoria Vendida</h3>
            <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
              Percentual da receita gasto em insumos. Referência: 28–35%
            </p>
          </div>
          <div
            style={{
              padding: "4px 14px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: cmvAtual <= 32 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              fontSize: "11px",
              fontWeight: 700,
              color: cmvAtual <= 32 ? "#34d399" : "#f87171",
            }}
          >
            <span style={{ fontSize: "10px", opacity: 0.7 }}>Atual:</span>
            {cmvAtual.toFixed(1)}%
          </div>
        </div>
        <div style={{ width: "100%", minHeight: 260, height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cmvData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fill: "var(--chart-text)", fontSize: 13, fontWeight: 600 }}
                axisLine={{ stroke: "var(--chart-grid)" }}
                tickLine={false}
              />
              <YAxis
                domain={[20, 45]}
                tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
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
                formatter={(value: any, name: any) => [
                  name === "meta" ? `${value}% (meta)` : `${Number(value).toFixed(1)}%`,
                ]}
              />
              <Bar dataKey="cmv" radius={[4, 4, 0, 0]} maxBarSize={36} fill="#2563eb" name="CMV" />
              <Line
                type="monotone"
                dataKey="meta"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                name="meta"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </NeuCard>

      {/* Custo vs Preço */}
      <NeuCard className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-text">Custo vs. Preço de Venda</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
              Cada ponto representa um prato — quanto mais acima da diagonal, maior a margem
            </p>
          </div>
          <div
            style={{
              padding: "6px 16px",
              borderRadius: "8px",
              background: "rgba(16,185,129,0.1)",
              fontSize: "12px",
              fontWeight: 700,
              color: "#34d399",
            }}
          >
            Lucro médio: {formatCurrency(lucroMedio)}
          </div>
        </div>
        <div style={{ width: "100%", minHeight: 350, height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 40, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="custo"
                type="number"
                name="Custo"
                tick={{ fill: "var(--chart-text)", fontSize: 12 }}
                axisLine={{ stroke: "var(--chart-grid)" }}
                tickLine={false}
                label={{
                  value: "Custo (R$)",
                  position: "bottom",
                  offset: 15,
                  fill: "var(--chart-text)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <YAxis
                dataKey="preco"
                type="number"
                name="Preço"
                tick={{ fill: "var(--chart-text)", fontSize: 12 }}
                axisLine={{ stroke: "var(--chart-grid)" }}
                tickLine={false}
                tickFormatter={(v: number) => `R$${v}`}
                label={{
                  value: "Preço (R$)",
                  angle: -90,
                  position: "left",
                  offset: 15,
                  fill: "var(--chart-text)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
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
                formatter={(value: any, name: any) => [
                  name === "Custo" || name === "Preço" ? `R$ ${Number(value).toFixed(2)}` : value,
                ]}
                labelFormatter={(label: any) =>
                  scatterData.find((d) => d.nome === label)?.nome ?? String(label)
                }
              />
              <Legend
                verticalAlign="bottom"
                align="left"
                wrapperStyle={{
                  fontSize: "13px",
                  color: "var(--chart-text)",
                  paddingTop: 10,
                  paddingLeft: 10,
                }}
                formatter={(val: any) => (
                  <span style={{ color: "var(--color-text)", fontSize: 13 }}>{String(val)}</span>
                )}
              />
              <Scatter
                data={scatterData.map((d) => ({ ...d, label: d.nome }))}
                fill="#2563eb"
                fillOpacity={0.7}
                stroke="#2563eb"
                strokeWidth={0.5}
                name="Pratos"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </NeuCard>

      {/* Row: Gargalos × Sazonalidade × Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <NeuCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-danger" /> Gargalos do Estoque
            </h3>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--color-text-tertiary)",
                letterSpacing: "0.1em",
              }}
            >
              {totalGargalos} itens parados
            </span>
          </div>
          <p style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginBottom: 12 }}>
            Itens sem movimentação por categoria
          </p>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={gargaloData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "var(--chart-text)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--chart-grid)" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "var(--chart-text)", fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
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
                <Bar
                  dataKey="parados30"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={14}
                  fill="#f59e0b"
                  name="30+ dias"
                  stackId="a"
                />
                <Bar
                  dataKey="parados60"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={14}
                  fill="#ef4444"
                  name="60+ dias"
                  stackId="a"
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          <div
            className="flex items-center gap-4 mt-3"
            style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}
          >
            <div className="flex items-center gap-1.5">
              <div style={{ width: 8, height: 8, borderRadius: "2px", background: "#f59e0b" }} />
              <span>30+ dias</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 8, height: 8, borderRadius: "2px", background: "#ef4444" }} />
              <span>60+ dias</span>
            </div>
          </div>
        </NeuCard>

        <NeuCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-500" /> Sazonalidade
            </h3>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--color-text-tertiary)",
                letterSpacing: "0.1em",
              }}
            >
              Consumo por dia
            </span>
          </div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={sazonalData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="dia"
                  tick={{ fill: "var(--chart-text)", fontSize: 13, fontWeight: 600 }}
                  axisLine={{ stroke: "var(--chart-grid)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
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
                <Bar dataKey="consumo" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={40}>
                  {sazonalData.map((entry, idx) => (
                    <Cell key={`saz-${entry.dia}-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>

        <NeuCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-brand-600" /> Previsto vs. Real
            </h3>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--color-text-tertiary)",
                letterSpacing: "0.1em",
              }}
            >
              {budgetDiff}% dif
            </span>
          </div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={budgetData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fill: "var(--chart-text)", fontSize: 13, fontWeight: 600 }}
                  axisLine={{ stroke: "var(--chart-grid)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--chart-text)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
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
                  formatter={(value: any) => formatCurrency(Number(value) || 0)}
                />
                <Bar
                  dataKey="previsto"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                  fill="#2563eb"
                  opacity={0.5}
                  name="Previsto"
                />
                <Bar
                  dataKey="real"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                  fill="#f59e0b"
                  name="Real"
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>
      </div>

      {/* Row: Comparativo Anual × Previsão */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeuCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <LineChart className="w-4 h-4 text-brand-600" /> Comparativo Anual
              </h3>
              <p style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
                Receita estimada: ano atual vs. anterior
              </p>
            </div>
            {comparativoData.length > 1 && (
              <div
                style={{
                  padding: "2px 10px",
                  borderRadius: "6px",
                  background: "rgba(37,99,235,0.1)",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#60a5fa",
                }}
              >
                {(
                  (comparativoData.reduce((s, d) => s + d.anoAtual, 0) /
                    comparativoData.reduce((s, d) => s + d.anoAnterior, 0)) *
                    100 -
                  100
                ).toFixed(1)}
                % vs. ano ant.
              </div>
            )}
          </div>
          <div style={{ width: "100%", minHeight: 240, height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={comparativoData}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fill: "var(--chart-text)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
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
                  formatter={(value: any) => formatCurrency(Number(value) || 0)}
                />
                <Area
                  type="monotone"
                  dataKey="anoAtual"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#gradAnoAtual)"
                  dot={{ r: 3, fill: "#2563eb" }}
                  name="Ano Atual"
                />
                <Area
                  type="monotone"
                  dataKey="anoAnterior"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#gradAnoAnt)"
                  strokeDasharray="4 4"
                  dot={{ r: 2, fill: "#8b5cf6" }}
                  name="Ano Anterior"
                />
                <defs>
                  <linearGradient id="gradAnoAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradAnoAnt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>

        <NeuCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <LineChart className="w-4 h-4 text-purple-500" /> Previsão de Estoque
            </h3>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--color-text-tertiary)",
                letterSpacing: "0.1em",
              }}
            >
              Projeção 14 dias
            </span>
          </div>
          <div style={{ width: "100%", minHeight: 200, height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={previsaoData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
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
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
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
                  formatter={(value: any) => formatCurrency(Number(value) || 0)}
                />
                <Area
                  type="monotone"
                  dataKey="atual"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#areaGradAtual)"
                  dot={false}
                  name="Atual"
                />
                <Area
                  type="monotone"
                  dataKey="projetado"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="url(#areaGradProj)"
                  dot={false}
                  name="Projetado"
                />
                <defs>
                  <linearGradient id="areaGradAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="areaGradProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>
      </div>

      {/* Tabela de Indicadores */}
      <NeuCard className="overflow-hidden">
        <div
          className="p-5 border-b border-border flex items-center gap-2"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <BarChart3 className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-text">Indicadores por Categoria</h3>
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
                  Giro
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
                  Dias Estoque
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
                  Cobertura
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
                  Score
                </th>
              </tr>
            </thead>
            <tbody style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              {giroCategories.map((g, gi) => {
                const score = Math.min(
                  100,
                  Math.round((g.giro / 10) * 50 + (1 - g.dias / 30) * 50),
                );
                return (
                  <tr
                    key={`bi-row-${g.name}-${gi}`}
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
                      style={{ padding: "14px 24px", fontWeight: 700, color: "var(--color-text)" }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: g.fill, opacity: 0.7 }}
                        />
                        {g.name}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",
                        textAlign: "right",
                        fontWeight: 800,
                        color: "var(--color-text)",
                      }}
                    >
                      {g.giro}x
                    </td>
                    <td
                      style={{
                        padding: "14px 24px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: "var(--color-text)",
                      }}
                    >
                      {g.dias} dias
                    </td>
                    <td style={{ padding: "14px 24px", textAlign: "right" }}>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background:
                            g.dias <= 10
                              ? "rgba(16,185,129,0.15)"
                              : g.dias <= 20
                                ? "rgba(37,99,235,0.15)"
                                : "rgba(239,68,68,0.15)",
                          color: g.dias <= 10 ? "#34d399" : g.dias <= 20 ? "#60a5fa" : "#f87171",
                        }}
                      >
                        {g.dias <= 10 ? "Ótima" : g.dias <= 20 ? "Média" : "Baixa"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 24px", textAlign: "right" }}>
                      <div className="flex items-center justify-end gap-2">
                        <div
                          style={{
                            width: 40,
                            height: 4,
                            borderRadius: "2px",
                            background: "rgba(255,255,255,0.06)",
                          }}
                        >
                          <div
                            style={{
                              width: `${score}%`,
                              height: "100%",
                              borderRadius: "2px",
                              background:
                                score > 70 ? "#10b981" : score > 40 ? "#f59e0b" : "#ef4444",
                            }}
                          />
                        </div>
                        <span
                          style={{ fontWeight: 800, fontSize: "11px", color: "var(--color-text)" }}
                        >
                          {score}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </NeuCard>
    </div>
  );
}
