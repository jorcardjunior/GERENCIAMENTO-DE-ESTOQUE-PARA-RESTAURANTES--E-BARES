"use client";

import { DonutChart, GaugeChart, Sparkline, calcVariacao, gerarTrend } from "@/components/charts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeuCard } from "@/components/ui/neu-card";
import { OnboardingGuide } from "@/components/ui/onboarding-guide";
import { useAuth } from "@/hooks/use-auth";
import { downloadCSV } from "@/lib/export-csv";
import {
  KNOWN_UNITS,
  UNIT_LABELS,
  normalizeCategoryName,
  normalizeItemName,
  suggestCategories,
  suggestItemCategory,
  suggestItemCorrection,
  suggestUnits,
  validateItemCategory,
} from "@/lib/validation";
import {
  AlertTriangle,
  ArrowUpRight,
  Clock,
  DollarSign,
  Download,
  Layers,
  Package,
  PieChart,
  Plus,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const CATEGORY_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#ea580c",
  "#9333ea",
  "#0d9488",
  "#ca8a04",
  "#db2777",
  "#0891b2",
  "#52525b",
];

type Category = {
  id: number;
  name: string;
  color: string;
  items: Item[];
};

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    started.current = false;
    const timeout = setTimeout(() => {
      started.current = true;
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        setDisplay(value * eased);
        if (progress < 1) requestAnimationFrame(animate);
        else setDisplay(value);
      };
      requestAnimationFrame(animate);
    }, 100);
    return () => clearTimeout(timeout);
  }, [value, duration]);
  return <>{Math.round(display).toLocaleString("pt-BR")}</>;
}

function formatDays(days: number): string {
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

function formatPct(pct: number): string {
  return `${pct}%`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const _isAdmin = user?.role === "admin";
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState({ alert_expiry_days: "7", alert_low_stock_pct: "10" });
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [catSuggestions, setCatSuggestions] = useState<string[]>([]);
  const [catSuggestionIndex, setCatSuggestionIndex] = useState(-1);

  const [newItem, setNewItem] = useState({
    categoryId: null as number | null,
    name: "",
    unit: "kg",
    minStock: "0",
    currentQuantity: "0",
  });
  const [itemSuggestion, setItemSuggestion] = useState<{ message: string; name: string } | null>(
    null,
  );
  const [_unitSuggestion, setUnitSuggestion] = useState<{ units: string[] } | null>(null);
  const [categorySuggestion, setCategorySuggestion] = useState<{
    categoryId: number;
    categoryName: string;
  } | null>(null);

  const expiryDays = Number(settings.alert_expiry_days) || 7;
  const lowStockPct = Number(settings.alert_low_stock_pct) || 10;
  const lowStockMultiplier = 1 + lowStockPct / 100;

  const allItemNames = useMemo(
    () => categories.flatMap((c) => c.items.map((i) => i.name)),
    [categories],
  );

  useEffect(() => {
    if (newItem.name.trim().length < 3) {
      setItemSuggestion(null);
      setUnitSuggestion(null);
      setCategorySuggestion(null);
      return;
    }
    const result = suggestItemCorrection(newItem.name, allItemNames);
    if (result.hasSuggestion && result.normalized !== result.suggestions[0]) {
      setItemSuggestion({ message: result.message ?? "", name: result.suggestions[0] });
    } else {
      setItemSuggestion(null);
    }
    const suggested = suggestUnits(newItem.name);
    const filtered = suggested.filter((u) => u !== newItem.unit);
    if (filtered.length > 0) {
      setUnitSuggestion({ units: filtered });
    } else {
      setUnitSuggestion(null);
    }
    const suggestedCatName = suggestItemCategory(newItem.name);
    if (suggestedCatName) {
      const match = categories.find((c) => c.name === suggestedCatName);
      if (match && match.id !== newItem.categoryId) {
        setCategorySuggestion({ categoryId: match.id, categoryName: suggestedCatName });
      } else {
        setCategorySuggestion(null);
      }
    } else {
      setCategorySuggestion(null);
    }
  }, [newItem.name, newItem.unit, newItem.categoryId, allItemNames, categories]);

  const loadData = useCallback(async () => {
    const [catRes, settingsRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/settings"),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (settingsRes.ok) setSettings(await settingsRes.json());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allItems = useMemo(() => categories.flatMap((c) => c.items), [categories]);

  const isExpiringSoon = useCallback(
    (dateStr: string | null) => {
      if (!dateStr) return false;
      const date = new Date(`${dateStr}T23:59:59`);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      return diff >= 0 && diff <= expiryDays * 86400000;
    },
    [expiryDays],
  );

  const isLowStock = useCallback(
    (item: Item) => {
      const qty = Number(item.currentQuantity);
      const min = Number(item.minStock);
      return qty <= min * lowStockMultiplier;
    },
    [lowStockMultiplier],
  );

  const _isStockCritical = useCallback((item: Item) => {
    return Number(item.currentQuantity) <= 0;
  }, []);

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const stats = useMemo(() => {
    const totalItens = allItems.length;
    const estoqueTotal = allItems.reduce((s, i) => s + Number(i.currentQuantity), 0);
    const estoqueBaixo = allItems.filter((i) => isLowStock(i)).length;
    const proximoVencimento = allItems.filter((i) => isExpiringSoon(i.expiryDate)).length;
    const valorEmpregado = allItems.reduce((s, i) => {
      const price = Number(i.unitPrice);
      return s + (price > 0 ? price * Number(i.currentQuantity) : 0);
    }, 0);
    const saudavel = allItems.filter((i) => !isLowStock(i) && !isExpiringSoon(i.expiryDate)).length;
    return { totalItens, estoqueTotal, estoqueBaixo, proximoVencimento, valorEmpregado, saudavel };
  }, [allItems, isLowStock, isExpiringSoon]);

  const lowStockItems = useMemo(
    () =>
      allItems
        .filter((i) => isLowStock(i))
        .sort(
          (a, b) =>
            Number(a.currentQuantity) / Number(a.minStock) -
            Number(b.currentQuantity) / Number(b.minStock),
        ),
    [allItems, isLowStock],
  );

  const expiringItems = useMemo(
    () =>
      allItems
        .filter((i) => isExpiringSoon(i.expiryDate))
        .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()),
    [allItems, isExpiringSoon],
  );

  async function addCategory() {
    const name = normalizeCategoryName(newCatName);
    if (!name) {
      toast.error("Digite um nome");
      return;
    }
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color: newCatColor }),
    });
    if (res.ok) {
      toast.success("Categoria criada");
      setNewCatName("");
      setNewCatColor(CATEGORY_COLORS[0]);
      setShowCatModal(false);
      loadData();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao criar");
    }
  }

  async function addItem() {
    if (!newItem.categoryId) {
      toast.error("Selecione uma categoria");
      return;
    }
    const name = normalizeItemName(newItem.name);
    if (!name) {
      toast.error("Digite um nome");
      return;
    }
    const catName = categories.find((c) => c.id === newItem.categoryId)?.name;
    if (catName) {
      const v = validateItemCategory(name, catName);
      if (!v.valid) {
        toast.error(v.message!);
        return;
      }
    }
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: newItem.categoryId,
        name,
        unit: newItem.unit,
        minStock: newItem.minStock,
        currentQuantity: newItem.currentQuantity,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Erro ao adicionar");
      return;
    }
    toast.success("Item adicionado");
    setNewItem({ categoryId: null, name: "", unit: "kg", minStock: "0", currentQuantity: "0" });
    setShowItemModal(false);
    setItemSuggestion(null);
    setUnitSuggestion(null);
    setCategorySuggestion(null);
    loadData();
  }

  function resetItemForm() {
    setNewItem({ categoryId: null, name: "", unit: "kg", minStock: "0", currentQuantity: "0" });
    setItemSuggestion(null);
    setUnitSuggestion(null);
    setCategorySuggestion(null);
    setShowItemModal(false);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const trends = useMemo(
    () => ({
      nivel: gerarTrend(stats.estoqueTotal),
      capital: gerarTrend(stats.valorEmpregado < 100 ? 5000 : stats.valorEmpregado),
      baixo: gerarTrend(Math.max(stats.estoqueBaixo, 3), 14, 0.5).map((v) => Math.max(v, 1)),
      itens: gerarTrend(stats.totalItens),
    }),
    [stats],
  );
  const variacoes = useMemo(
    () => ({
      nivel: calcVariacao(trends.nivel),
      capital: calcVariacao(trends.capital),
      baixo: calcVariacao(trends.baixo),
      itens: calcVariacao(trends.itens),
    }),
    [trends],
  );

  const areaChartData = useMemo(
    () =>
      trends.nivel.map((v, i) => ({
        dia: `${i + 1}`,
        valor: Math.round(v),
        capital: Math.round(trends.capital[i]),
      })),
    [trends],
  );

  const stockRatio = (item: Item) =>
    (Number(item.currentQuantity) / Number(item.minStock || 1)) * 100;

  const barChartData = useMemo(
    () =>
      categories.map((cat) => ({
        name: cat.name,
        value: cat.items.length,
        fill: cat.color || "#2563eb",
      })),
    [categories],
  );

  const healthPct = allItems.length > 0 ? (stats.saudavel / allItems.length) * 100 : 0;
  const coverPct =
    categories.length > 0
      ? Math.min(100, (allItems.length / Math.max(1, categories.length * 3)) * 100)
      : 0;
  const expiryPct =
    allItems.length > 0 ? ((allItems.length - stats.proximoVencimento) / allItems.length) * 100 : 0;

  const statCards = [
    {
      title: "Nível de Estoque",
      value: stats.estoqueTotal.toLocaleString("pt-BR"),
      icon: Layers,
      color: "#2563eb",
      sub: `${stats.totalItens} itens no total`,
      trend: trends.nivel,
      variacao: variacoes.nivel,
    },
    {
      title: "Capital Investido",
      value: formatCurrency(stats.valorEmpregado),
      icon: DollarSign,
      color: "#16a34a",
      sub: "Valor total em estoque",
      trend: trends.capital,
      variacao: variacoes.capital,
    },
    {
      title: "Estoque Baixo",
      value: stats.estoqueBaixo.toLocaleString("pt-BR"),
      icon: AlertTriangle,
      color: "#ea580c",
      sub: stats.estoqueBaixo === 1 ? "1 item crítico" : `${stats.estoqueBaixo} itens críticos`,
      trend: trends.baixo,
      variacao: variacoes.baixo,
    },
    {
      title: "Itens Cadastrados",
      value: stats.totalItens.toLocaleString("pt-BR"),
      icon: Package,
      color: "#ca8a04",
      sub: `${categories.length} categorias ativas`,
      trend: trends.itens,
      variacao: variacoes.itens,
    },
  ];

  function exportCSV() {
    const headers = [
      "Categoria",
      "Item",
      "Unidade",
      "Quantidade",
      "Estoque Mínimo",
      "Valor Unitário",
      "Validade",
    ];
    const rows = allItems.map((item) => {
      const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
      return [
        cat?.name || "",
        item.name,
        item.unit,
        item.currentQuantity,
        item.minStock,
        item.unitPrice || "0",
        item.expiryDate || "",
      ];
    });
    downloadCSV(`estoque_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  }

  return (
    <div className="rounded-3xl p-6 sm:p-8 space-y-6 bg-surface min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
            {greeting}, {user?.name?.split(" ")[0] || "usuário"}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "8px 14px",
              color: "var(--color-text)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              letterSpacing: "0.03em",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            }}
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "4px",
            }}
          >
            <select
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text)",
                fontSize: "11px",
                fontWeight: 700,
                padding: "6px 12px",
                outline: "none",
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
            >
              <option className="bg-surface text-text">Últimos 7 dias</option>
              <option className="bg-surface text-text">Este mês</option>
              <option className="bg-surface text-text">Este ano</option>
            </select>
          </div>
          <button
            onClick={() => setShowItemModal(true)}
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              border: "none",
              borderRadius: "12px",
              padding: "8px 18px",
              color: "var(--color-text)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              letterSpacing: "0.03em",
            }}
          >
            <Plus className="w-3.5 h-3.5" /> NOVO ITEM
          </button>
          <button
            onClick={() => setShowCatModal(true)}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "8px 18px",
              color: "var(--color-text)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              letterSpacing: "0.03em",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
          >
            <Plus className="w-3.5 h-3.5" /> NOVA CATEGORIA
          </button>
        </div>
      </div>

      {/* AI Insights */}
      <NeuCard className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(37,99,235,0.25)",
              flexShrink: 0,
            }}
          >
            <Sparkles className="w-6 h-6 text-text" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
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
                INSIGHT IA
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                Agorinha mesmo
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-text mb-2">
              {stats.estoqueBaixo > 0
                ? `Atenção, ${stats.estoqueBaixo} itens precisam de reposição.`
                : "Seu estoque está saudável e organizado hoje!"}
            </h2>
            <p className="text-sm text-text/50 max-w-xl leading-relaxed">
              {stats.estoqueBaixo > 0
                ? `O item "${lowStockItems[0]?.name}" está ${Math.round(stockRatio(lowStockItems[0]))}% abaixo do mínimo. Sugiro gerar um pedido de compra agora.`
                : "Tudo sob controle. Nenhuma ação crítica necessária nas próximas 24 horas."}
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            {stats.estoqueBaixo > 0 && (
              <button
                onClick={() => router.push("/app/gestao")}
                style={{
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  border: "none",
                  borderRadius: "14px",
                  color: "var(--color-text)",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Resolver Agora <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => router.push("/app/relatorios")}
              style={{
                padding: "10px 24px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                color: "var(--color-text)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Ver Detalhes
            </button>
          </div>
        </div>
      </NeuCard>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, _idx) => (
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
            <div className="flex items-center justify-between">
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{card.sub}</p>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "var(--color-text-tertiary)",
                  letterSpacing: "0.05em",
                }}
              >
                VS MÊS ANT.
              </span>
            </div>
          </NeuCard>
        ))}
      </div>

      {/* Charts Row: Bar Chart + Area + Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-color Bar Chart */}
        <NeuCard className="lg:col-span-2 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-base font-bold text-text">Fluxo por Categoria</h3>
              <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
                Distribuição de itens cadastrados
              </p>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: "10px",
                padding: "3px",
              }}
            >
              <select
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  outline: "none",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                <option className="bg-surface text-text">Este período</option>
                <option className="bg-surface text-text">Período anterior</option>
              </select>
            </div>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={barChartData}
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
                  <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={48}>
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

        {/* Status Overview with Donut + Gauges */}
        <NeuCard className="p-6 sm:p-8 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-text">Status Geral</h3>
            <PieChart className="w-4 h-4" style={{ color: "var(--color-text-tertiary)" }} />
          </div>
          <div className="flex flex-col items-center gap-3 mb-6">
            <DonutChart
              slices={[
                {
                  value: allItems.filter((i) => !isLowStock(i) && !isExpiringSoon(i.expiryDate))
                    .length,
                  color: "#16a34a",
                  label: "Saudável",
                },
                {
                  value: allItems.filter((i) => isLowStock(i)).length,
                  color: "#ca8a04",
                  label: "Crítico",
                },
                {
                  value: allItems.filter((i) => isExpiringSoon(i.expiryDate)).length,
                  color: "#dc2626",
                  label: "Vencendo",
                },
              ].filter((s) => s.value > 0)}
              size={140}
              innerRadius={45}
            />
            <div className="w-full space-y-2.5">
              {[
                {
                  label: "Saudável",
                  color: "#16a34a",
                  val: allItems.filter((i) => !isLowStock(i) && !isExpiringSoon(i.expiryDate))
                    .length,
                },
                {
                  label: "Estoque Baixo",
                  color: "#ca8a04",
                  val: allItems.filter((i) => isLowStock(i)).length,
                },
                {
                  label: "Próx. Vencimento",
                  color: "#dc2626",
                  val: allItems.filter((i) => isExpiringSoon(i.expiryDate)).length,
                },
              ].map((s, di) => (
                <div key={`${s.label}-${di}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: s.color,
                        opacity: 0.7,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-secondary)",
                        fontWeight: 500,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text)" }}>
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full border-t border-border pt-6 mt-2">
            <div className="grid grid-cols-3 gap-2">
              <GaugeChart
                value={healthPct}
                size={110}
                color="#2563eb"
                label="SAÚDE"
                subtitle={`${stats.saudavel} itens`}
              />
              <GaugeChart
                value={coverPct}
                size={110}
                color="#16a34a"
                label="COBERTURA"
                subtitle={`${categories.length} cats`}
              />
              <GaugeChart
                value={expiryPct}
                size={110}
                color="#ea580c"
                label="VALIDADES"
                subtitle={`${allItems.length - stats.proximoVencimento} ok`}
              />
            </div>
          </div>
        </NeuCard>
      </div>

      {/* Area Chart - Tendência do Estoque */}
      <NeuCard className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-text">Evolução do Estoque</h3>
            <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
              Tendência de valor nos últimos 14 dias
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 8, height: 8, borderRadius: "2px", background: "#2563eb" }} />
              <span
                style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 600 }}
              >
                Nível
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 8, height: 8, borderRadius: "2px", background: "#16a34a" }} />
              <span
                style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 600 }}
              >
                Capital
              </span>
            </div>
          </div>
        </div>
        <div style={{ width: "100%", minHeight: 240, height: 240 }}>
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
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#areaGrad1)"
                dot={false}
                activeDot={{ r: 4, fill: "#2563eb" }}
              />
              <Area
                type="monotone"
                dataKey="capital"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#areaGrad2)"
                dot={false}
                activeDot={{ r: 4, fill: "#16a34a" }}
              />
              <defs>
                <linearGradient id="areaGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </NeuCard>

      {/* Alertas */}
      <NeuCard className="overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text">Alertas Críticos</h3>
            <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2 }}>
              Itens que precisam de atenção imediata
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#dc2626",
                animation: "ping 1.5s ease infinite",
              }}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#dc2626",
                letterSpacing: "0.1em",
              }}
            >
              AO VIVO
            </span>
          </div>
        </div>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {[...lowStockItems, ...expiringItems].length > 0 ? (
            [...lowStockItems, ...expiringItems].slice(0, 8).map((item, idx) => {
              const isExpiring = isExpiringSoon(item.expiryDate);
              const uniqueKey = `${item.id}-${isExpiring ? "exp" : "low"}-${idx}`;
              return (
                <div
                  key={uniqueKey}
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        background: isExpiring ? "rgba(220,38,38,0.1)" : "rgba(202,138,4,0.1)",
                      }}
                    >
                      {isExpiring ? (
                        <Clock className="w-5 h-5" style={{ color: "#dc2626" }} />
                      ) : (
                        <TrendingDown className="w-5 h-5" style={{ color: "#ca8a04" }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text truncate">{item.name}</p>
                      <p
                        style={{
                          fontSize: "10px",
                          color: "var(--color-text-tertiary)",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          marginTop: 2,
                        }}
                      >
                        {isExpiring
                          ? `Vence em ${Math.ceil((new Date(item.expiryDate!).getTime() - Date.now()) / 86400000)} dias`
                          : `Estoque em ${Math.round(stockRatio(item))}% do mínimo`}
                      </p>
                    </div>
                  </div>
                  <button
                    style={{
                      padding: "8px 16px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      color: "var(--color-text-secondary)",
                      fontSize: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                      letterSpacing: "0.05em",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#2563eb";
                      e.currentTarget.style.borderColor = "#2563eb";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                    }}
                  >
                    RESOLVER
                  </button>
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "16px",
                  background: "rgba(22,163,74,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Package className="w-7 h-7" style={{ color: "#16a34a" }} />
              </div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#16a34a",
                  letterSpacing: "0.1em",
                }}
              >
                TUDO REGULARIZADO
              </p>
            </div>
          )}
        </div>
      </NeuCard>

      {/* ─── MODALS ─── */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent
          className="max-w-lg bg-surface text-text border-border shadow-2xl"
          style={{
            border: "1px solid var(--color-border)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-text">Adicionar Novo Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label style={{ color: "var(--color-text-secondary)" }}>Categoria</Label>
              <select
                value={newItem.categoryId ?? ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, categoryId: Number(e.target.value) || null })
                }
                style={{
                  width: "100%",
                  height: 40,
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--color-text)",
                  padding: "0 12px",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="" className="bg-surface text-text-secondary">
                  Selecione categoria
                </option>
                {categories.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    className="bg-surface text-text"
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
              {categorySuggestion && (
                <div className="flex items-center gap-2 mt-1">
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#60a5fa",
                      background: "rgba(37,99,235,0.15)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    Sugestão: {categorySuggestion.categoryName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewItem({ ...newItem, categoryId: categorySuggestion.categoryId });
                      setCategorySuggestion(null);
                    }}
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#60a5fa",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    USAR
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label style={{ color: "var(--color-text-secondary)" }}>Nome do Item</Label>
              <Input
                placeholder="Ex: Peito de Frango"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                style={{
                  ...(itemSuggestion
                    ? { borderColor: "#ca8a04", background: "rgba(202,138,4,0.05)" }
                    : {}),
                }}
              />
              {itemSuggestion && (
                <div className="flex items-center gap-2 mt-1">
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#ca8a04",
                      background: "rgba(202,138,4,0.15)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {itemSuggestion.message}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewItem({ ...newItem, name: itemSuggestion.name });
                      setItemSuggestion(null);
                    }}
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#ca8a04",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    CORRIGIR
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label style={{ color: "var(--color-text-secondary)" }}>Qtd. Inicial</Label>
                <Input
                  type="number"
                  value={newItem.currentQuantity}
                  onChange={(e) => setNewItem({ ...newItem, currentQuantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: "var(--color-text-secondary)" }}>Unidade</Label>
                <select
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  style={{
                    width: "100%",
                    height: 40,
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--color-text)",
                    padding: "0 12px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  {KNOWN_UNITS.map((u) => (
                    <option key={u} value={u} className="bg-surface text-text">
                      {u} - {UNIT_LABELS[u]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: "var(--color-text-secondary)" }}>Est. Mínimo</Label>
                <Input
                  type="number"
                  value={newItem.minStock}
                  onChange={(e) => setNewItem({ ...newItem, minStock: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div
            className="flex justify-end gap-3 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={resetItemForm}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={addItem}
              style={{
                padding: "8px 24px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none",
                borderRadius: "12px",
                color: "var(--color-text)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
              }}
            >
              Salvar Item
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCatModal} onOpenChange={setShowCatModal}>
        <DialogContent
          className="max-w-md bg-surface text-text border-border shadow-2xl"
          style={{
            border: "1px solid var(--color-border)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-text">Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2 relative">
              <Label style={{ color: "var(--color-text-secondary)" }}>Nome da Categoria</Label>
              <Input
                placeholder="Ex: Carnes, Bebidas..."
                value={newCatName}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewCatName(val);
                  setCatSuggestions(suggestCategories(val));
                  setCatSuggestionIndex(-1);
                }}
              />
              {catSuggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    zIndex: 50,
                    width: "100%",
                    marginTop: 4,
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  {catSuggestions.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 16px",
                        fontSize: "13px",
                        color:
                          i === catSuggestionIndex
                            ? "var(--color-text)"
                            : "var(--color-text-secondary)",
                        background: i === catSuggestionIndex ? "#2563eb" : "transparent",
                        border: "none",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (i !== catSuggestionIndex)
                          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        if (i !== catSuggestionIndex)
                          e.currentTarget.style.background = "transparent";
                      }}
                      onClick={() => {
                        setNewCatName(s);
                        setCatSuggestions([]);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label style={{ color: "var(--color-text-secondary)" }}>Identificador Visual</Label>
              <div className="flex gap-3 flex-wrap">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: c,
                      border:
                        newCatColor === c
                          ? "3px solid rgba(255,255,255,0.3)"
                          : "3px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      transform: newCatColor === c ? "scale(1.15)" : "scale(1)",
                      opacity: newCatColor === c ? 1 : 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div
            className="flex justify-end gap-3 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => setShowCatModal(false)}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={addCategory}
              style={{
                padding: "8px 24px",
                backgroundColor: newCatColor,
                border: "none",
                borderRadius: "12px",
                color: "var(--color-text)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: `0 4px 16px ${newCatColor}40`,
              }}
            >
              Criar Categoria
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {allItems.length === 0 && <OnboardingGuide />}
      <style>{`
				@keyframes ping {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.3; }
				}
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
			`}</style>
    </div>
  );
}
