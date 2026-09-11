"use client";

import { NeuCard } from "@/components/ui/neu-card";
import { useAuth } from "@/hooks/use-auth";
import {
  Building2,
  Clock,
  DollarSign,
  Download,
  Loader2,
  PieChart,
  Plus,
  Search,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DonutChart, Sparkline, calcVariacao, gerarTrend } from "@/components/charts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadCSV } from "@/lib/export-csv";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Expense = {
  id: number;
  description: string;
  amount: string;
  date: string;
  categoryId: number;
  estabelecimentoId: number;
  paid: boolean;
  category?: {
    id: number;
    name: string;
    color: string;
  };
};

type ExpenseCategory = {
  id: number;
  name: string;
  color: string;
  estabelecimentoId: number;
};

type Estabelecimento = {
  id: number;
  nome: string;
};

export default function FinanceiroPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedEstabId, setSelectedEstabId] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState<"despesas" | "receitas" | "fluxo">("despesas");
  const [showModal, setShowModal] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "" as number | "",
    paid: false,
  });

  const isRevenueCategory = (cat: ExpenseCategory) => cat.name.startsWith("Receita: ");
  const revenueCats = useMemo(() => categories.filter(isRevenueCategory), [categories]);
  const expenseCats = useMemo(() => categories.filter((c) => !isRevenueCategory(c)), [categories]);

  const revenues = useMemo(
    () => expenses.filter((e) => revenueCats.some((rc) => rc.id === e.categoryId)),
    [expenses, revenueCats],
  );
  const despesas = useMemo(
    () => expenses.filter((e) => expenseCats.some((ec) => ec.id === e.categoryId)),
    [expenses, expenseCats],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = selectedEstabId ? `?estabelecimentoId=${selectedEstabId}` : "";
      const [expRes, catRes, estabRes] = await Promise.all([
        fetch(`/api/expenses${queryParams}`),
        fetch(`/api/expense-categories${queryParams}`),
        fetch("/api/estabelecimentos"),
      ]);

      if (expRes.ok) setExpenses(await expRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (estabRes.ok) {
        const estabs = await estabRes.json();
        setEstabelecimentos(estabs);
        if (estabs.length > 0 && !selectedEstabId) {
          setSelectedEstabId(estabs[0].id);
        }
      }
    } catch (_err) {
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  }, [selectedEstabId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeData = useMemo(
    () => (activeTab === "despesas" ? despesas : activeTab === "receitas" ? revenues : expenses),
    [activeTab, despesas, revenues, expenses],
  );
  const activeCats = useMemo(
    () =>
      activeTab === "despesas" ? expenseCats : activeTab === "receitas" ? revenueCats : categories,
    [activeTab, expenseCats, revenueCats, categories],
  );

  const totals = useMemo(() => {
    const total = activeData.reduce((s, e) => s + Number(e.amount), 0);
    const paid = activeData.filter((e) => e.paid).reduce((s, e) => s + Number(e.amount), 0);
    const pending = total - paid;
    return { total, paid, pending };
  }, [activeData]);

  const receitaTotal = useMemo(
    () => revenues.reduce((s, e) => s + Number(e.amount), 0),
    [revenues],
  );
  const despesaTotal = useMemo(
    () => despesas.reduce((s, e) => s + Number(e.amount), 0),
    [despesas],
  );

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const trends = useMemo(
    () => ({
      total: gerarTrend(totals.total || 5000),
      pago: gerarTrend(totals.paid || 3000),
      pendente: gerarTrend(totals.pending || 1000),
      saldo: gerarTrend(Math.max(receitaTotal - despesaTotal || 0, 1000)),
    }),
    [totals.total, totals.paid, totals.pending, receitaTotal, despesaTotal],
  );

  const variacoes = useMemo(
    () => ({
      total: calcVariacao(trends.total),
      pago: calcVariacao(trends.pago),
      pendente: calcVariacao(trends.pendente),
      saldo: calcVariacao(trends.saldo),
    }),
    [trends],
  );

  const areaChartData = useMemo(
    () =>
      trends.total.map((v, i) => ({
        dia: `${i + 1}`,
        gasto: Math.round(v),
        pago: Math.round(trends.pago[i]),
      })),
    [trends],
  );

  const stackedData = useMemo(() => {
    return activeCats
      .map((cat) => {
        const catExpenses = activeData.filter((e) => e.categoryId === cat.id);
        const paid = catExpenses.filter((e) => e.paid).reduce((s, e) => s + Number(e.amount), 0);
        const pending = catExpenses
          .filter((e) => !e.paid)
          .reduce((s, e) => s + Number(e.amount), 0);
        return {
          name: cat.name.replace("Receita: ", ""),
          Pago: paid,
          Pendente: pending,
          fill: cat.color,
        };
      })
      .filter((c) => c.Pago > 0 || c.Pendente > 0);
  }, [activeData, activeCats]);

  const categoryData = useMemo(() => {
    return activeCats
      .map((cat) => ({
        name: cat.name.replace("Receita: ", ""),
        value: activeData
          .filter((e) => e.categoryId === cat.id)
          .reduce((s, e) => s + Number(e.amount), 0),
        fill: cat.color,
      }))
      .filter((c) => c.value > 0);
  }, [activeData, activeCats]);

  async function handleAddCategory() {
    if (!newCatName.trim() || !selectedEstabId) {
      toast.error("Preencha o nome da categoria e selecione um estabelecimento");
      return;
    }

    setSaving(true);
    try {
      const isReceita = activeTab === "receitas";
      const catName = isReceita ? `Receita: ${newCatName.trim()}` : newCatName.trim();
      const colors = isReceita
        ? ["#16a34a", "#22c55e", "#10b981", "#059669", "#34d399", "#4ade80", "#2dd4bf"]
        : ["#ef4444", "#22c55e", "#06b6d4", "#f43f5e", "#8b5cf6", "#f97316", "#3b82f6", "#6366f1"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const res = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: catName,
          color: randomColor,
          estabelecimentoId: selectedEstabId,
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar categoria");

      const category = await res.json();
      setCategories([...categories, category]);
      setNewExpense({ ...newExpense, categoryId: category.id });
      setNewCatName("");
      setShowAddCat(false);
      toast.success("Categoria adicionada!");
    } catch (_err) {
      toast.error("Erro ao adicionar categoria");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveExpense() {
    if (
      !newExpense.description ||
      !newExpense.amount ||
      !newExpense.categoryId ||
      !selectedEstabId
    ) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newExpense,
          estabelecimentoId: selectedEstabId,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar despesa");

      const expense = await res.json();
      const cat = categories.find((c) => c.id === expense.categoryId);
      setExpenses([{ ...expense, category: cat }, ...expenses]);

      setShowModal(false);
      toast.success("Despesa registrada com sucesso!");
      setNewExpense({
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        categoryId: "",
        paid: false,
      });
    } catch (_err) {
      toast.error("Erro ao salvar despesa");
    } finally {
      setSaving(false);
    }
  }

  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 bg-surface min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const statCards =
    activeTab === "receitas"
      ? [
          {
            title: "Total Recebido",
            value: formatCurrency(totals.total),
            icon: TrendingUp,
            color: "#16a34a",
            sub: "Entrada total do período",
            trend: trends.total,
            variacao: variacoes.total,
          },
          {
            title: "Recebido",
            value: formatCurrency(totals.paid),
            icon: Wallet,
            color: "#22c55e",
            sub: "Receitas confirmadas",
            trend: trends.pago,
            variacao: variacoes.pago,
          },
          {
            title: "A Receber",
            value: formatCurrency(totals.pending),
            icon: Clock,
            color: "#ca8a04",
            sub: "Pendente de recebimento",
            trend: trends.pendente,
            variacao: variacoes.pendente,
          },
          {
            title: "Média Diária",
            value: formatCurrency(totals.total / 30 || 0),
            icon: DollarSign,
            color: "#0891b2",
            sub: "Média nos últimos 30 dias",
            trend: trends.saldo,
            variacao: variacoes.saldo,
          },
        ]
      : activeTab === "fluxo"
        ? [
            {
              title: "Receitas",
              value: formatCurrency(receitaTotal),
              icon: TrendingUp,
              color: "#16a34a",
              sub: "Total de entradas",
              trend: gerarTrend(receitaTotal || 5000),
              variacao: calcVariacao(gerarTrend(receitaTotal || 5000)),
            },
            {
              title: "Despesas",
              value: formatCurrency(despesaTotal),
              icon: TrendingDown,
              color: "#dc2626",
              sub: "Total de saídas",
              trend: gerarTrend(despesaTotal || 5000),
              variacao: calcVariacao(gerarTrend(despesaTotal || 5000)),
            },
            {
              title: "Saldo Líquido",
              value: formatCurrency(receitaTotal - despesaTotal),
              icon: DollarSign,
              color: receitaTotal - despesaTotal >= 0 ? "#16a34a" : "#dc2626",
              sub: receitaTotal - despesaTotal >= 0 ? "Positivo" : "Negativo",
              trend: trends.saldo,
              variacao: variacoes.saldo,
            },
            {
              title: "Margem",
              value:
                receitaTotal > 0
                  ? `${(((receitaTotal - despesaTotal) / receitaTotal) * 100).toFixed(1)}%`
                  : "—",
              icon: Wallet,
              color: "#8b5cf6",
              sub: receitaTotal > 0 ? "Margem líquida" : "Sem receitas",
              trend: gerarTrend(
                receitaTotal > 0 ? ((receitaTotal - despesaTotal) / receitaTotal) * 100 : 0,
              ),
              variacao: calcVariacao(
                gerarTrend(
                  receitaTotal > 0 ? ((receitaTotal - despesaTotal) / receitaTotal) * 100 : 0,
                ),
              ),
            },
          ]
        : [
            {
              title: "Total Gasto",
              value: formatCurrency(totals.total),
              icon: DollarSign,
              color: "#2563eb",
              sub: "Saída mensal total",
              trend: trends.total,
              variacao: variacoes.total,
            },
            {
              title: "Total Pago",
              value: formatCurrency(totals.paid),
              icon: Wallet,
              color: "#16a34a",
              sub: "Despesas quitadas",
              trend: trends.pago,
              variacao: variacoes.pago,
            },
            {
              title: "A Pagar",
              value: formatCurrency(totals.pending),
              icon: TrendingDown,
              color: "#ea580c",
              sub: "Pendente de pagamento",
              trend: trends.pendente,
              variacao: variacoes.pendente,
            },
            {
              title: "Média Diária",
              value: formatCurrency(totals.total / 30 || 0),
              icon: TrendingUp,
              color: "#0891b2",
              sub: "Média nos últimos 30 dias",
              trend: trends.saldo,
              variacao: variacoes.saldo,
            },
          ];

  function exportCSV() {
    const headers = ["Tipo", "Descrição", "Valor", "Data", "Categoria", "Pago"];
    const rows = activeData.map((e) => [
      revenueCats.some((rc) => rc.id === e.categoryId) ? "Receita" : "Despesa",
      e.description,
      e.amount,
      e.date,
      e.category?.name?.replace("Receita: ", "") ?? "—",
      e.paid ? "Sim" : "Não",
    ]);
    downloadCSV(
      `financeiro_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`,
      headers,
      rows,
    );
  }

  return (
    <div className="rounded-3xl p-6 sm:p-8 space-y-6 bg-surface min-h-full">
      {/* Header */}
      <NeuCard className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(37,99,235,0.25)",
                flexShrink: 0,
              }}
            >
              <TrendingUp className="w-7 h-7 text-text" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#60a5fa",
                    background: "rgba(37,99,235,0.15)",
                    padding: "2px 10px",
                    borderRadius: "999px",
                    letterSpacing: "0.1em",
                  }}
                >
                  INSIGHTS FINANCEIROS
                </span>
                <Sparkles className="w-3 h-3" style={{ color: "#60a5fa" }} />
              </div>
              <h1 className="text-2xl font-bold text-text tracking-tight">Análise Financeira</h1>
              <div className="flex items-center gap-4 mt-2">
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  Balanço geral de gastos.
                </p>
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-surface-secondary border border-border"
                >
                  <Building2
                    className="w-3.5 h-3.5 text-text-tertiary"
                  />
                  <select
                    value={selectedEstabId}
                    onChange={(e) => setSelectedEstabId(Number(e.target.value))}
                    className="bg-transparent border-none text-text text-[11px] font-bold outline-none cursor-pointer"
                  >
                    {estabelecimentos.map((e) => (
                      <option
                        key={e.id}
                        value={e.id}
                        className="bg-surface text-text"
                      >
                        {e.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-5 py-3 rounded-[14px] bg-surface-secondary border border-border text-text text-xs font-bold cursor-pointer tracking-wide whitespace-nowrap transition-all hover:bg-surface-active"
            >
              <Download className="w-4 h-4" /> EXPORTAR CSV
            </button>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "12px 24px",
                background:
                  activeTab === "receitas"
                    ? "linear-gradient(135deg, #16a34a, #15803d)"
                    : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none",
                borderRadius: "14px",
                color: "var(--color-text)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow:
                  activeTab === "receitas"
                    ? "0 4px 16px rgba(22,163,74,0.3)"
                    : "0 4px 16px rgba(37,99,235,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
              }}
            >
              <Plus className="w-4 h-4" />{" "}
              {activeTab === "receitas" ? "REGISTRAR RECEITA" : "REGISTRAR GASTO"}
            </button>
          </div>
        </div>
      </NeuCard>

      {/* Abas: Despesas | Receitas | Fluxo de Caixa */}
      <div
        className="flex gap-1 bg-surface-secondary/50 rounded-2xl p-1 w-fit"
        style={{ border: "1px solid var(--color-border)" }}
      >
        {(["despesas", "receitas", "fluxo"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              border: "none",
              background:
                activeTab === tab
                  ? tab === "receitas"
                    ? "rgba(22,163,74,0.15)"
                    : tab === "fluxo"
                      ? "rgba(139,92,246,0.15)"
                      : "rgba(37,99,235,0.15)"
                  : "transparent",
              color: activeTab === tab ? "var(--color-text)" : "var(--color-text-tertiary)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.03em",
              transition: "all 0.2s",
            }}
          >
            {tab === "despesas"
              ? "💰 Despesas"
              : tab === "receitas"
                ? "🟢 Receitas"
                : "📊 Fluxo de Caixa"}
          </button>
        ))}
      </div>

      {/* DRE Card (apenas no Fluxo de Caixa) */}
      {activeTab === "fluxo" && (
        <NeuCard className="p-6 sm:p-8" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div className="flex items-center justify-between mb-2">
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#8b5cf6",
                letterSpacing: "0.1em",
              }}
            >
              DRE SIMPLIFICADO
            </span>
            <Sparkles className="w-4 h-4" style={{ color: "#8b5cf6" }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
            <div>
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: 4 }}>
                Receita Total
              </p>
              <p className="text-xl font-bold" style={{ color: "#16a34a" }}>
                {formatCurrency(receitaTotal)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: 4 }}>
                Despesas
              </p>
              <p className="text-xl font-bold" style={{ color: "#dc2626" }}>
                {formatCurrency(despesaTotal)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: 4 }}>
                Saldo Líquido
              </p>
              <p
                className="text-xl font-bold"
                style={{ color: receitaTotal - despesaTotal >= 0 ? "#16a34a" : "#dc2626" }}
              >
                {formatCurrency(receitaTotal - despesaTotal)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: 4 }}>
                Margem
              </p>
              <p className="text-xl font-bold" style={{ color: "#8b5cf6" }}>
                {receitaTotal > 0
                  ? `${(((receitaTotal - despesaTotal) / receitaTotal) * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </NeuCard>
      )}

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
        {/* Multi-color Bar Chart */}
        <NeuCard className="lg:col-span-2 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-base font-bold text-text">
                {activeTab === "receitas"
                  ? "Receitas por Categoria"
                  : activeTab === "fluxo"
                    ? "Receitas vs Despesas"
                    : "Gastos por Categoria"}
              </h3>
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
                {activeTab === "fluxo"
                  ? "Comparação de entradas e saídas"
                  : "Distribuição total acumulada"}
              </p>
            </div>
            <PieChart className="w-4 h-4" style={{ color: "var(--color-text-tertiary)" }} />
          </div>
          <div style={{ width: "100%", height: 300 }}>
            {activeTab === "fluxo" ? (
              <FluxoChart
                despesaTotal={despesaTotal}
                receitaTotal={receitaTotal}
                formatCurrency={formatCurrency}
              />
            ) : categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={categoryData}
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
                  />
                  <YAxis
                    tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrency(v)}
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
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), "Total"]}
                  />
                  <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <PieChart
                    className="w-10 h-10 mx-auto mb-3"
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: "13px" }}>
                    Sem dados para exibir
                  </p>
                </div>
              </div>
            )}
          </div>
        </NeuCard>

        {/* Donut + Category List */}
        <NeuCard className="p-6 sm:p-8 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-text">
              {activeTab === "receitas" ? "Distribuição de Receitas" : "Distribuição de Gastos"}
            </h3>
            <PieChart className="w-4 h-4" style={{ color: "var(--color-text-tertiary)" }} />
          </div>
          {categoryData.length > 0 ? (
            <>
              <DonutChart
                slices={categoryData.map((c) => ({ label: c.name, value: c.value, color: c.fill }))}
                size={180}
                innerRadius={60}
              />
              <div className="w-full mt-6 space-y-3 px-2">
                {categoryData.map((s, idx) => (
                  <div key={`${s.name}-${idx}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.fill, opacity: 0.7 }}
                      />
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--color-text-secondary)",
                          fontWeight: 500,
                        }}
                      >
                        {s.name}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text)" }}>
                      {Math.round((s.value / (totals.total || 1)) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <Tag
                className="w-10 h-10 mx-auto mb-3"
                style={{ color: "var(--color-text-tertiary)" }}
              />
              <p style={{ color: "var(--color-text-tertiary)", fontSize: "13px" }}>
                Nenhuma categoria
              </p>
            </div>
          )}
        </NeuCard>
      </div>

      {/* Area Chart - Evolução */}
      <NeuCard className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-text">
              {activeTab === "receitas"
                ? "Evolução das Receitas"
                : activeTab === "fluxo"
                  ? "Evolução do Saldo"
                  : "Evolução dos Gastos"}
            </h3>
            <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
              {activeTab === "fluxo"
                ? "Saldo líquido nos últimos 14 dias"
                : `Tendência nos últimos 14 dias`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "fluxo" ? (
              <>
                <div className="flex items-center gap-1.5">
                  <div
                    style={{ width: 8, height: 8, borderRadius: "2px", background: "#16a34a" }}
                  />
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Saldo
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "2px",
                      background: activeTab === "receitas" ? "#16a34a" : "#2563eb",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {activeTab === "receitas" ? "Receita" : "Gasto"}
                  </span>
                </div>
                {activeTab !== "receitas" && (
                  <div className="flex items-center gap-1.5">
                    <div
                      style={{ width: 8, height: 8, borderRadius: "2px", background: "#16a34a" }}
                    />
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--color-text-secondary)",
                        fontWeight: 600,
                      }}
                    >
                      Pago
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div style={{ width: "100%", minHeight: 220, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="dia"
                tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                axisLine={{ stroke: "var(--chart-grid)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
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
                formatter={(value: any) => [formatCurrency(Number(value) || 0)]}
              />
              <Area
                type="monotone"
                dataKey="gasto"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#areaGradF1)"
                dot={false}
                activeDot={{ r: 4, fill: "#2563eb" }}
              />
              <Area
                type="monotone"
                dataKey="pago"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#areaGradF2)"
                dot={false}
                activeDot={{ r: 4, fill: "#16a34a" }}
              />
              <defs>
                <linearGradient id="areaGradF1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="areaGradF2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </NeuCard>

      {/* Stacked Bar - Composição Pago/Pendente por Categoria */}
      {stackedData.length > 0 && (
        <NeuCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-text">Composição por Categoria</h3>
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
                Relação pago vs. pendente
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div style={{ width: 8, height: 8, borderRadius: "2px", background: "#16a34a" }} />
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Pago
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 8, height: 8, borderRadius: "2px", background: "#ca8a04" }} />
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Pendente
                </span>
              </div>
            </div>
          </div>
          <div style={{ width: "100%", minHeight: 280, height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={stackedData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--chart-text)", fontSize: 13, fontWeight: 600 }}
                  axisLine={{ stroke: "var(--chart-grid)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--chart-text)", fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
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
                  formatter={(value: any) => [formatCurrency(Number(value) || 0)]}
                />
                <Bar
                  dataKey="Pago"
                  stackId="a"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="Pendente"
                  stackId="a"
                  fill="#ca8a04"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>
      )}

      {/* Transaction History Table */}
      <NeuCard className="overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-text">Histórico de Movimentações</h3>
            <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
              {activeTab === "fluxo" ? "Todos os registros financeiros" : "Últimos registros"}
            </p>
          </div>
          <div style={{ position: "relative", width: "100%", maxWidth: 256 }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === "receitas" ? "receita" : "gasto"}...`}
              className="w-full py-2.5 pl-9 pr-3 bg-surface border border-border rounded-[10px] text-text text-xs outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {activeData.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {activeTab === "fluxo" && (
                    <th
                      style={{
                        textAlign: "left",
                        padding: "14px 16px",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Tipo
                    </th>
                  )}
                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 24px",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--color-text-tertiary)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Descrição
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 16px",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--color-text-tertiary)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Categoria
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 16px",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--color-text-tertiary)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Data
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "14px 16px",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--color-text-tertiary)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Valor
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "14px 24px",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--color-text-tertiary)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="border-t border-border">
                {activeData.map((exp) => {
                  const ehReceita = revenueCats.some((rc) => rc.id === exp.categoryId);
                  return (
                    <tr
                      key={exp.id}
                      className="border-b border-border/50 transition-colors hover:bg-surface-secondary"
                    >
                      {activeTab === "fluxo" && (
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "9px",
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                              background: ehReceita
                                ? "rgba(22,163,74,0.15)"
                                : "rgba(220,38,38,0.15)",
                              color: ehReceita ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {ehReceita ? "RECEITA" : "DESPESA"}
                          </span>
                        </td>
                      )}
                      <td style={{ padding: "16px 24px" }}>
                        <p className="text-sm font-bold text-text">{exp.description}</p>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span className="px-3 py-1 bg-surface-tertiary text-text text-[10px] font-bold rounded-lg border border-border">
                          {exp.category?.name?.replace("Receita: ", "") || "Sem categoria"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                          fontWeight: 500,
                        }}
                      >
                        {new Date(exp.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          textAlign: "right",
                          fontWeight: 800,
                          fontSize: "13px",
                          color: ehReceita ? "#16a34a" : "var(--color-text)",
                        }}
                      >
                        {ehReceita ? "+" : ""}
                        {formatCurrency(Number(exp.amount))}
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "8px",
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            background: exp.paid
                              ? ehReceita
                                ? "rgba(22,163,74,0.15)"
                                : "rgba(22,163,74,0.15)"
                              : "rgba(202,138,4,0.15)",
                            color: exp.paid ? "#16a34a" : "#ca8a04",
                          }}
                        >
                          {exp.paid ? (ehReceita ? "Recebido" : "Pago") : "Pendente"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <Search
                className="w-10 h-10 mx-auto mb-3"
                style={{ color: "var(--color-text-tertiary)" }}
              />
              <p style={{ color: "var(--color-text-tertiary)", fontSize: "13px" }}>
                {activeTab === "receitas"
                  ? "Nenhuma receita registrada"
                  : "Nenhum registro encontrado"}
              </p>
            </div>
          )}
        </div>
      </NeuCard>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="max-w-lg bg-surface text-text border-border shadow-2xl"
          style={{
            border: "1px solid var(--color-border)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-text font-bold text-xl">
              {activeTab === "receitas" ? "Registrar Nova Receita" : "Registrar Nova Despesa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                }}
              >
                {activeTab === "receitas" ? "Descrição da Receita" : "Descrição do Gasto"}
              </Label>
              <Input
                placeholder={
                  activeTab === "receitas"
                    ? "Ex: Vendas do dia, Delivery..."
                    : "Ex: Compra de hortifruti, Aluguel..."
                }
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="rounded-xl border-2 border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  Valor (R$)
                </Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="rounded-xl border-2 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  Data
                </Label>
                <Input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="rounded-xl border-2 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Label
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  Categoria
                </Label>
                <button
                  onClick={() => setShowAddCat(!showAddCat)}
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: activeTab === "receitas" ? "#16a34a" : "#60a5fa",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                  }}
                >
                  {showAddCat ? "Selecionar Existente" : "+ Nova Categoria"}
                </button>
              </div>

              {showAddCat ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da categoria..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="rounded-[10px] border-2 border-border"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={saving}
                    style={{
                      padding: "0 16px",
                      background:
                        activeTab === "receitas"
                          ? "linear-gradient(135deg, #16a34a, #15803d)"
                          : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                      border: "none",
                      borderRadius: "10px",
                      color: "var(--color-text)",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                      minWidth: 50,
                    }}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "OK"}
                  </button>
                </div>
              ) : (
                <select
                  value={newExpense.categoryId}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, categoryId: Number(e.target.value) || "" })
                  }
                  className="w-12 h-12 rounded-xl border-2 border-border bg-surface text-text px-4 text-[13px] font-bold outline-none"
                >
                  <option value="" className="bg-surface text-text-secondary">
                    Selecione categoria
                  </option>
                  {(activeTab === "receitas" ? revenueCats : expenseCats).map((cat) => (
                    <option
                      key={cat.id}
                      value={cat.id}
                      className="bg-surface text-text"
                    >
                      {cat.name.replace("Receita: ", "")}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Label
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                }}
              >
                {activeTab === "receitas" ? "Recebido?" : "Pago?"}
              </Label>
              <button
                onClick={() => setNewExpense({ ...newExpense, paid: !newExpense.paid })}
                className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${
                  newExpense.paid ? "bg-success" : "bg-surface-tertiary"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    newExpense.paid ? "left-[28px]" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="flex gap-4 pt-6 border-t border-border">
            <button
              onClick={() => setShowModal(false)}
              style={{
                flex: 1,
                padding: "14px 0",
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--color-text-secondary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >
              CANCELAR
            </button>
            <button
              onClick={handleSaveExpense}
              disabled={saving}
              style={{
                flex: 2,
                padding: "14px 0",
                background:
                  activeTab === "receitas"
                    ? "linear-gradient(135deg, #16a34a, #15803d)"
                    : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none",
                borderRadius: "14px",
                color: "var(--color-text)",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow:
                  activeTab === "receitas"
                    ? "0 4px 16px rgba(22,163,74,0.25)"
                    : "0 4px 16px rgba(37,99,235,0.25)",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "SALVAR REGISTRO"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes ping {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

function FluxoChart({
  receitaTotal,
  despesaTotal,
  formatCurrency,
}: {
  receitaTotal: number;
  despesaTotal: number;
  formatCurrency: (v: number) => string;
}) {
  const data = [
    { name: "Receitas", value: receitaTotal, fill: "#16a34a" },
    { name: "Despesas", value: despesaTotal, fill: "#dc2626" },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "var(--chart-text)", fontSize: 13, fontWeight: 600 }}
          axisLine={{ stroke: "var(--chart-grid)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--chart-text)", fontSize: 13 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatCurrency(v)}
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
          formatter={(value: any) => [formatCurrency(Number(value) || 0)]}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
