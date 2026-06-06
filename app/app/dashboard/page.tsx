"use client";

import { useAuth } from "@/hooks/use-auth";
import {
	normalizeCategoryName,
	normalizeItemName,
	suggestCategories,
	suggestItemCategory,
	suggestItemCorrection,
	suggestUnits,
	validateItemCategory,
	KNOWN_UNITS,
	UNIT_LABELS,
} from "@/lib/validation";
import {
	AlertTriangle,
	Box,
	Clock,
	Layers,
	Package,
	Plus,
	X,
	DollarSign,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  "#2563eb", "#dc2626", "#16a34a", "#ea580c", "#9333ea",
  "#0d9488", "#ca8a04", "#db2777", "#0891b2", "#52525b",
];

type Category = {
  id: number;
  name: string;
  color: string;
  items: Item[];
};

function AnimatedNumber({
	value,
	duration = 1500,
}: { value: number; duration?: number }) {
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
	const isAdmin = user?.role === "admin";

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
	const [itemSuggestion, setItemSuggestion] = useState<{ message: string; name: string } | null>(null);
	const [unitSuggestion, setUnitSuggestion] = useState<{ units: string[] } | null>(null);
	const [categorySuggestion, setCategorySuggestion] = useState<{ categoryId: number; categoryName: string } | null>(null);

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

	useEffect(() => { loadData(); }, [loadData]);

	const allItems = useMemo(() => categories.flatMap((c) => c.items), [categories]);

	const isExpiringSoon = useCallback((dateStr: string | null) => {
		if (!dateStr) return false;
		const date = new Date(dateStr + "T23:59:59");
		const now = new Date();
		const diff = date.getTime() - now.getTime();
		return diff >= 0 && diff <= expiryDays * 86400000;
	}, [expiryDays]);

	const isLowStock = useCallback((item: Item) => {
		const qty = Number(item.currentQuantity);
		const min = Number(item.minStock);
		return qty <= min * lowStockMultiplier;
	}, [lowStockMultiplier]);

	const isStockCritical = useCallback((item: Item) => {
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
		return { totalItens, estoqueTotal, estoqueBaixo, proximoVencimento, valorEmpregado };
	}, [allItems, isLowStock, isExpiringSoon]);

	const lowStockItems = useMemo(
		() => allItems.filter((i) => isLowStock(i)).sort((a, b) => Number(a.currentQuantity) / Number(a.minStock) - Number(b.currentQuantity) / Number(b.minStock)),
		[allItems, isLowStock],
	);

	const expiringItems = useMemo(
		() => allItems.filter((i) => isExpiringSoon(i.expiryDate)).sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()),
		[allItems, isExpiringSoon],
	);

	async function addCategory() {
		const name = normalizeCategoryName(newCatName);
		if (!name) { toast.error("Digite um nome"); return; }
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
		if (!newItem.categoryId) { toast.error("Selecione uma categoria"); return; }
		const name = normalizeItemName(newItem.name);
		if (!name) { toast.error("Digite um nome"); return; }
		const catName = categories.find((c) => c.id === newItem.categoryId)?.name;
		if (catName) {
			const v = validateItemCategory(name, catName);
			if (!v.valid) { toast.error(v.message!); return; }
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

	const stockRatio = (item: Item) => (Number(item.currentQuantity) / Number(item.minStock || 1)) * 100;

	const statCards = [
		{
			title: "Total de Itens",
			value: stats.totalItens,
			icon: Package,
			iconBg: "bg-emerald-100", iconColor: "text-emerald-600", border: "border-emerald-200",
			sub: `${categories.length} categorias`,
		},
		{
			title: "Estoque Total",
			value: stats.estoqueTotal,
			icon: Layers,
			iconBg: "bg-blue-100", iconColor: "text-blue-600", border: "border-blue-200",
			sub: `${allItems.length} itens cadastrados`,
		},
		{
			title: "Valor em Estoque",
			value: stats.valorEmpregado,
			isCurrency: true,
			icon: DollarSign,
			iconBg: "bg-violet-100", iconColor: "text-violet-600", border: "border-violet-200",
			sub: stats.valorEmpregado > 0 ? "capital empregado" : "nenhum item com valor definido",
		},
		{
			title: "Estoque Baixo",
			value: stats.estoqueBaixo,
			icon: AlertTriangle,
			iconBg: "bg-amber-100", iconColor: "text-amber-600", border: "border-amber-200",
			sub: `tolerância de ${formatPct(lowStockPct)} acima do mínimo`,
		},
		{
			title: "Próx. ao Vencimento",
			value: stats.proximoVencimento,
			icon: Clock,
			iconBg: "bg-rose-100", iconColor: "text-rose-600", border: "border-rose-200",
			sub: `em até ${formatDays(expiryDays)}`,
		},
	];

	return (
		<div className="space-y-8">
			{/* Header with greeting */}
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-[#64748b] font-semibold">
						{greeting}, <span className="text-[#2563eb]">{user?.name || "Usuário"}</span>
					</p>
					<h1 className="text-3xl font-black tracking-tighter uppercase text-[#0f172a] mt-1">
						Dashboard
					</h1>
				</div>
				<div className="text-right">
					<p className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">
						{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
					</p>
					<p className="text-xs text-[#94a3b8]">{user?.role === "admin" ? "Administrador" : "Colaborador"}</p>
				</div>
			</div>

			{/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
				{statCards.map((card) => (
					<div key={card.title} className="relative group bg-white rounded-2xl border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden">
						<div className="p-5">
							<div className="flex items-start justify-between mb-3">
								<div className="space-y-1">
									<p className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.15em]">{card.title}</p>
									<div className="text-3xl font-black tracking-tighter tabular-nums text-[#0f172a]">
										{'isCurrency' in card && card.isCurrency ? (
											<span>{formatCurrency(card.value)}</span>
										) : (
											<AnimatedNumber value={card.value as number} />
										)}
									</div>
								</div>
								<div className={`p-2.5 rounded-2xl border ${card.iconBg} ${card.iconColor} ${card.border} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
									<card.icon className="h-5 w-5" />
								</div>
							</div>
							<p className="text-[10px] text-[#94a3b8] font-semibold">{card.sub}</p>
						</div>
						<div className={`h-1 w-full bg-gradient-to-r ${card.iconColor.replace("text-", "from-")} to-transparent opacity-40`} />
					</div>
				))}
			</div>

			{/* ─── CHARTS SECTION ─── */}
			{categories.length > 0 && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Bar Chart: Items per Category */}
					<div className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-lg p-6">
						<h3 className="text-sm font-black uppercase tracking-wider text-[#0f172a] mb-4">Itens por Categoria</h3>
						<div className="space-y-3">
							{categories.map((cat) => {
								const max = Math.max(...categories.map((c) => c.items.length), 1);
								const pct = (cat.items.length / max) * 100;
								return (
									<div key={cat.id} className="flex items-center gap-3">
										<span className="text-xs font-bold text-[#64748b] w-32 truncate shrink-0">{cat.name}</span>
										<div className="flex-1 h-5 bg-[#f1f5f9] rounded-full overflow-hidden">
											<div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
										</div>
										<span className="text-xs font-black tabular-nums text-[#0f172a] w-8 text-right shrink-0">{cat.items.length}</span>
									</div>
								);
							})}
						</div>
					</div>

					{/* Donut Chart: Stock Status Distribution */}
					<div className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-lg p-6">
						<h3 className="text-sm font-black uppercase tracking-wider text-[#0f172a] mb-4">Distribuição do Estoque</h3>
						<div className="flex items-center justify-center gap-8">
							<svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
								{(() => {
									const total = allItems.length || 1;
									const saudavel = allItems.filter((i) => !isLowStock(i) && !isExpiringSoon(i.expiryDate)).length;
									const baixo = allItems.filter((i) => isLowStock(i) && !isExpiringSoon(i.expiryDate)).length;
									const vencendo = allItems.filter((i) => isExpiringSoon(i.expiryDate)).length;
									const critical = allItems.filter((i) => isStockCritical(i)).length;
									const slices = [
										{ value: saudavel, color: "#16a34a", label: "Saudável" },
										{ value: baixo, color: "#ca8a04", label: "Baixo" },
										{ value: vencendo, color: "#e11d48", label: "Vencendo" },
										{ value: critical, color: "#dc2626", label: "Crítico" },
									].filter((s) => s.value > 0);
									let cumulative = 0;
									const radius = 70;
									const cx = 80;
									const cy = 80;
									return slices.map((slice, i) => {
										const pct = slice.value / total;
										const angle = pct * 360;
										const startAngle = (cumulative / total) * 360;
										cumulative += slice.value;
										const startRad = ((startAngle - 90) * Math.PI) / 180;
										const endRad = ((startAngle + angle - 90) * Math.PI) / 180;
										const x1 = cx + radius * Math.cos(startRad);
										const y1 = cy + radius * Math.sin(startRad);
										const x2 = cx + radius * Math.cos(endRad);
										const y2 = cy + radius * Math.sin(endRad);
										const largeArc = angle > 180 ? 1 : 0;
										if (pct >= 1) {
											return <circle key={i} cx={cx} cy={cy} r={radius} fill={slice.color} />;
										}
										return (
											<path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={slice.color} />
										);
									});
								})()}
								<circle cx="80" cy="80" r="45" fill="white" />
								<text x="80" y="80" textAnchor="middle" dominantBaseline="middle" className="text-sm font-black" fill="#0f172a">
									{allItems.length}
								</text>
							</svg>
							<div className="space-y-2">
								{[
									{ label: "Saudável", color: "#16a34a", count: allItems.filter((i) => !isLowStock(i) && !isExpiringSoon(i.expiryDate)).length },
									{ label: "Baixo", color: "#ca8a04", count: allItems.filter((i) => isLowStock(i) && !isExpiringSoon(i.expiryDate)).length },
									{ label: "Vencendo", color: "#e11d48", count: allItems.filter((i) => isExpiringSoon(i.expiryDate)).length },
									{ label: "Crítico", color: "#dc2626", count: allItems.filter((i) => isStockCritical(i)).length },
								].map((s) => (
									<div key={s.label} className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
										<span className="text-xs text-[#64748b]">{s.label}</span>
										<span className="text-xs font-black tabular-nums text-[#0f172a]">{s.count}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ─── ALERT DETAILS ─── */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Low Stock Alert Card */}
				<div className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-lg overflow-hidden">
					<div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between bg-amber-50/50">
						<h2 className="text-sm font-black uppercase tracking-wider text-[#0f172a] flex items-center gap-2">
							<AlertTriangle className="w-4 h-4 text-amber-600" /> Estoque Baixo
						</h2>
						<span className="text-[10px] text-[#64748b] font-bold">
							{lowStockItems.length} {lowStockItems.length === 1 ? "item" : "itens"}
						</span>
					</div>
					{lowStockItems.length > 0 ? (
						<div className="divide-y divide-[#e2e8f0] max-h-72 overflow-y-auto">
							{lowStockItems.slice(0, 10).map((item) => {
								const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
								const ratio = stockRatio(item);
								return (
									<div key={item.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#f8fafc] transition-colors">
										<div className="flex items-center gap-3 min-w-0 flex-1">
											<div className="shrink-0">
												<div className={`h-2 w-2 rounded-full ${
													isStockCritical(item) ? "bg-red-500" : "bg-amber-400"
												}`} />
											</div>
											<div className="min-w-0">
												<p className="text-sm font-bold text-[#0f172a] truncate">{item.name}</p>
												<p className="text-[10px] text-[#94a3b8]">{cat?.name || "—"}</p>
											</div>
										</div>
										<div className="text-right shrink-0 ml-3">
											<p className={`text-sm font-black tabular-nums ${isStockCritical(item) ? "text-red-600" : "text-amber-600"}`}>
												{item.currentQuantity}
												<span className="text-[9px] font-bold text-[#94a3b8] uppercase ml-0.5">{item.unit}</span>
											</p>
											<p className="text-[9px] text-[#94a3b8]">
												mín: {item.minStock} • {ratio.toFixed(0)}%
											</p>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="p-6 text-center text-sm text-emerald-600 font-medium flex items-center justify-center gap-2">
							<span className="text-lg">✓</span> Nenhum item com estoque baixo
						</div>
					)}
					<div className="px-4 py-2 bg-[#f8fafc] border-t border-[#e2e8f0]">
						<p className="text-[9px] text-[#94a3b8]">
							Tolerância: estoque ≤ {lowStockPct}% acima do mínimo ({formatPct(lowStockPct)})
						</p>
					</div>
				</div>

				{/* Expiry Alert Card */}
				<div className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-lg overflow-hidden">
					<div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between bg-rose-50/50">
						<h2 className="text-sm font-black uppercase tracking-wider text-[#0f172a] flex items-center gap-2">
							<Clock className="w-4 h-4 text-rose-600" /> Próximos ao Vencimento
						</h2>
						<span className="text-[10px] text-[#64748b] font-bold">
							{expiringItems.length} {expiringItems.length === 1 ? "item" : "itens"}
						</span>
					</div>
					{expiringItems.length > 0 ? (
						<div className="divide-y divide-[#e2e8f0] max-h-72 overflow-y-auto">
							{expiringItems.slice(0, 10).map((item) => {
								const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
								const daysLeft = Math.ceil((new Date(item.expiryDate!).getTime() - Date.now()) / 86400000);
								return (
									<div key={item.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#f8fafc] transition-colors">
										<div className="flex items-center gap-3 min-w-0 flex-1">
											<div className="shrink-0">
												<div className={`h-2 w-2 rounded-full ${
													daysLeft <= 3 ? "bg-red-500" : daysLeft <= 7 ? "bg-rose-400" : "bg-amber-400"
												}`} />
											</div>
											<div className="min-w-0">
												<p className="text-sm font-bold text-[#0f172a] truncate">{item.name}</p>
												<p className="text-[10px] text-[#94a3b8]">{cat?.name || "—"}</p>
											</div>
										</div>
										<div className="text-right shrink-0 ml-3">
											<p className={`text-sm font-black tabular-nums ${
												daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-rose-600" : "text-amber-600"
											}`}>
												{daysLeft} {daysLeft === 1 ? "dia" : "dias"}
											</p>
											<p className="text-[9px] text-[#94a3b8]">
												venc: {new Date(item.expiryDate!).toLocaleDateString("pt-BR")}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="p-6 text-center text-sm text-emerald-600 font-medium flex items-center justify-center gap-2">
							<span className="text-lg">✓</span> Nenhum item próximo ao vencimento
						</div>
					)}
					<div className="px-4 py-2 bg-[#f8fafc] border-t border-[#e2e8f0]">
						<p className="text-[9px] text-[#94a3b8]">
							Janela de alerta: {formatDays(expiryDays)} de antecedência
						</p>
					</div>
				</div>
			</div>

			{/* Recent items preview */}
			{allItems.length > 0 && (
				<div className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-lg overflow-hidden">
					<div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
						<h2 className="text-sm font-black uppercase tracking-wider text-[#0f172a] flex items-center gap-2">
							<Box className="w-4 h-4 text-[#2563eb]" /> Itens Recentes
						</h2>
						<span className="text-[10px] text-[#94a3b8] font-bold">{allItems.length} no total</span>
					</div>
					<div className="divide-y divide-[#e2e8f0]">
						{allItems.slice(-8).reverse().map((item) => (
							<div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#f8fafc] transition-colors">
								<div className="flex items-center gap-3">
									<div className={`h-7 w-7 rounded-lg flex items-center justify-center border-2 ${
										isExpiringSoon(item.expiryDate)
											? "bg-rose-100 border-rose-200 text-rose-600"
											: isLowStock(item)
												? "bg-amber-100 border-amber-200 text-amber-600"
												: "bg-emerald-100 border-emerald-200 text-emerald-600"
									}`}>
										<Package className="h-3.5 w-3.5" />
									</div>
									<div>
										<p className="text-sm font-bold text-[#0f172a]">{item.name}</p>
										<p className="text-[10px] text-[#94a3b8]">
											{categories.find((c) => c.items.some((i) => i.id === item.id))?.name || "—"}
										</p>
									</div>
								</div>
								<div className="text-right">
									<p className={`text-sm font-black tabular-nums ${Number(item.currentQuantity) <= 0 ? "text-red-600" : isLowStock(item) ? "text-amber-600" : "text-[#0f172a]"}`}>
										{item.currentQuantity} <span className="text-[9px] font-bold text-[#94a3b8] uppercase">{item.unit}</span>
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* ─── ITEM MODAL ─── */}
			{showItemModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={resetItemForm} />
					<div className="relative bg-white rounded-2xl shadow-2xl border-2 border-[#e2e8f0] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-black uppercase tracking-tight text-[#0f172a]">Adicionar Item</h2>
							<button onClick={resetItemForm} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="space-y-4">
							<div className="relative">
								<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Categoria</label>
								<select
									value={newItem.categoryId ?? ""}
									onChange={(e) => setNewItem({ ...newItem, categoryId: Number(e.target.value) || null })}
									className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white ${
										categorySuggestion ? "border-purple-300 bg-purple-50" : "border-[#e2e8f0]"
									}`}
								>
									<option value="">Selecione categoria</option>
									{categories.map((cat) => (
										<option key={cat.id} value={cat.id}>{cat.name}</option>
									))}
								</select>
								{categorySuggestion && (
									<div className="flex items-center gap-1.5 mt-1.5">
										<span className="text-[9px] text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
											Sugerido: {categorySuggestion.categoryName}
										</span>
										<button type="button" onClick={() => { setNewItem({ ...newItem, categoryId: categorySuggestion.categoryId }); setCategorySuggestion(null); }}
											className="text-[9px] font-bold text-purple-700 bg-purple-200 hover:bg-purple-300 px-2 py-0.5 rounded-full transition-colors">
											Usar
										</button>
									</div>
								)}
							</div>
							<div className="relative">
								<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Nome do Item</label>
								<input type="text" placeholder="Ex: Peito de Frango"
									value={newItem.name}
									onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
									className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white ${
										itemSuggestion ? "border-amber-300 bg-amber-50" : "border-[#e2e8f0]"
									}`}
								/>
								{itemSuggestion && (
									<div className="flex items-center gap-1.5 mt-1.5">
										<span className="text-[9px] text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">{itemSuggestion.message}</span>
										<button type="button" onClick={() => { setNewItem({ ...newItem, name: itemSuggestion.name }); setItemSuggestion(null); }}
											className="text-[9px] font-bold text-amber-700 bg-amber-200 hover:bg-amber-300 px-2 py-0.5 rounded-full transition-colors">Usar este</button>
									</div>
								)}
							</div>
							<div className="grid grid-cols-3 gap-3">
								<div>
									<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Qtd. Inicial</label>
									<input type="number" value={newItem.currentQuantity}
										onChange={(e) => setNewItem({ ...newItem, currentQuantity: e.target.value })}
										className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
									/>
								</div>
								<div>
									<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Unidade</label>
									<div className="relative">
										<select value={newItem.unit}
											onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
											className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white ${
												unitSuggestion ? "border-orange-300 bg-orange-50" : "border-[#e2e8f0]"
											}`}
										>
											{KNOWN_UNITS.map((u) => (
												<option key={u} value={u}>{u} - {UNIT_LABELS[u]}</option>
											))}
										</select>
										{unitSuggestion && (
											<div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
												{unitSuggestion.units.map((u) => (
													<button key={u} type="button" onClick={() => { setNewItem({ ...newItem, unit: u }); setUnitSuggestion(null); }}
														className="text-[9px] font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-200 px-2.5 py-0.5 rounded-full transition-colors">
														{u} — {UNIT_LABELS[u]}
													</button>
												))}
											</div>
										)}
									</div>
								</div>
								<div>
									<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Est. Mínimo</label>
									<input type="number" value={newItem.minStock}
										onChange={(e) => setNewItem({ ...newItem, minStock: e.target.value })}
										className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
									/>
								</div>
							</div>
						</div>
						<div className="flex gap-3 mt-6 pt-4 border-t border-[#e2e8f0]">
							<button onClick={addItem}
								className="flex-1 px-4 py-3 bg-[#ea580c] text-white rounded-xl hover:bg-[#c2410c] transition-all text-sm font-bold shadow-lg shadow-orange-500/20">
								Salvar Item
							</button>
							<button onClick={resetItemForm}
								className="px-6 py-3 bg-[#f1f5f9] text-[#64748b] rounded-xl hover:bg-[#e2e8f0] transition-all text-sm font-medium">
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ─── CATEGORY MODAL ─── */}
			{showCatModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowCatModal(false); setNewCatName(""); setCatSuggestions([]); }} />
					<div className="relative bg-white rounded-2xl shadow-2xl border-2 border-[#e2e8f0] w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-black uppercase tracking-tight text-[#0f172a]">Nova Categoria</h2>
							<button onClick={() => { setShowCatModal(false); setNewCatName(""); setCatSuggestions([]); }}
								className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="relative">
							<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Nome da Categoria</label>
							<input type="text" placeholder="Digite o nome ou escolha uma sugestão..."
								value={newCatName}
								onChange={(e) => {
									const val = e.target.value;
									setNewCatName(val);
									const suggestions = suggestCategories(val);
									setCatSuggestions(suggestions);
									setCatSuggestionIndex(-1);
								}}
								onKeyDown={(e) => {
									if (catSuggestions.length === 0) return;
									if (e.key === "ArrowDown") { e.preventDefault(); setCatSuggestionIndex((p) => p < catSuggestions.length - 1 ? p + 1 : 0); }
									if (e.key === "ArrowUp") { e.preventDefault(); setCatSuggestionIndex((p) => p > 0 ? p - 1 : catSuggestions.length - 1); }
									if (e.key === "Enter" && catSuggestionIndex >= 0) { e.preventDefault(); setNewCatName(catSuggestions[catSuggestionIndex]); setCatSuggestions([]); setCatSuggestionIndex(-1); }
									if (e.key === "Escape") { setCatSuggestions([]); setCatSuggestionIndex(-1); }
								}}
								className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
							/>
							{catSuggestions.length > 0 && (
								<div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border-2 border-[#e2e8f0] rounded-xl shadow-xl overflow-hidden">
									{catSuggestions.map((s, i) => (
										<button key={s} type="button"
											className={`w-full text-left px-3 py-2 text-sm transition-colors ${
												i === catSuggestionIndex ? "bg-[#2563eb] text-white" : "hover:bg-[#f1f5f9] text-[#0f172a]"
											}`}
											onClick={() => { setNewCatName(s); setCatSuggestions([]); setCatSuggestionIndex(-1); }}>
											{s}
										</button>
									))}
								</div>
							)}
						</div>
						<div className="mt-4">
							<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-2">Cor da Categoria</label>
							<div className="flex gap-2.5 flex-wrap">
								{CATEGORY_COLORS.map((c) => (
									<button
										key={c}
										type="button"
										onClick={() => setNewCatColor(c)}
										className={`h-7 w-7 rounded-full transition-all duration-200 ${
											newCatColor === c
												? "ring-2 ring-offset-2 ring-[#0f172a] scale-110"
												: "hover:scale-110"
										}`}
										style={{ backgroundColor: c }}
										title={c}
									/>
								))}
							</div>
						</div>
						<div className="flex gap-3 mt-6 pt-4 border-t border-[#e2e8f0]">
							<button onClick={addCategory}
								className="flex-1 px-4 py-3 text-white rounded-xl hover:brightness-110 transition-all text-sm font-bold shadow-lg"
								style={{ backgroundColor: newCatColor }}>
								Criar Categoria
							</button>
							<button onClick={() => { setShowCatModal(false); setNewCatName(""); setNewCatColor(CATEGORY_COLORS[0]); setCatSuggestions([]); }}
								className="px-6 py-3 bg-[#f1f5f9] text-[#64748b] rounded-xl hover:bg-[#e2e8f0] transition-all text-sm font-medium">
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
