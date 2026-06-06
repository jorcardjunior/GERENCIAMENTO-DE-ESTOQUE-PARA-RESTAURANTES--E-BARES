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
	Pencil,
	Plus,
	Search,
	Settings2,
	Trash2,
	X,
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
	categoryId?: number | null;
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
	return days === 1 ? "1 dia" : `${days} dias`;
}

function isExpiringSoon(dateStr: string | null, days = 7) {
	if (!dateStr) return false;
	const date = new Date(dateStr + "T23:59:59");
	const now = new Date();
	const diff = date.getTime() - now.getTime();
	return diff >= 0 && diff <= days * 86400000;
}

function getStockStatus(qty: number, min: number, expiry: string | null, lowStockPct = 10) {
	const threshold = min * (1 + lowStockPct / 100);
	if (isExpiringSoon(expiry)) {
		return {
			label: "Vencendo",
			color: "text-rose-600 bg-rose-100 border-rose-300",
		};
	}
	if (qty <= 0) {
		return {
			label: "Crítico",
			color: "text-red-600 bg-red-100 border-red-300",
		};
	}
	if (qty <= threshold) {
		return {
			label: "Baixo",
			color: "text-amber-600 bg-amber-100 border-amber-300",
		};
	}
	return {
		label: "Saudável",
		color: "text-emerald-600 bg-emerald-100 border-emerald-300",
	};
}

export default function GestaoPage() {
	const { user } = useAuth();
	const isAdmin = user?.role === "admin";

	const [categories, setCategories] = useState<Category[]>([]);
	const [settings, setSettings] = useState({ alert_expiry_days: "7", alert_low_stock_pct: "10" });
	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [showNewCat, setShowNewCat] = useState(false);
  const [catSuggestions, setCatSuggestions] = useState<string[]>([]);
  const [catSuggestionIndex, setCatSuggestionIndex] = useState(-1);
	const [newItem, setNewItem] = useState<{
		categoryId: number | null;
		name: string;
		unit: string;
		minStock: string;
		currentQuantity: string;
		unitPrice: string;
	}>({
		categoryId: null,
		name: "",
		unit: "kg",
		minStock: "0",
		currentQuantity: "0",
		unitPrice: "",
	});
	const [showNewItem, setShowNewItem] = useState(false);
	const [recentIds, setRecentIds] = useState<number[]>([]);
	const [itemSuggestion, setItemSuggestion] = useState<{
		message: string;
		name: string;
	} | null>(null);
	const [unitSuggestion, setUnitSuggestion] = useState<{
		units: string[];
	} | null>(null);
	const [categorySuggestion, setCategorySuggestion] = useState<{
		categoryId: number;
		categoryName: string;
	} | null>(null);

	const [showColumnModal, setShowColumnModal] = useState(false);

	const [editItem, setEditItem] = useState<Item | null>(null);
	const [showEditItem, setShowEditItem] = useState(false);
	const [editCat, setEditCat] = useState<{ id: number; name: string; color: string } | null>(null);
	const [showEditCat, setShowEditCat] = useState(false);
	const [editCatName, setEditCatName] = useState("");
	const [editCatColor, setEditCatColor] = useState(CATEGORY_COLORS[0]);

	const [customColumns, setCustomColumns] = useState<{ id: string; name: string }[]>(() => {
		if (typeof window === "undefined") return [];
		try {
			const saved = localStorage.getItem("gestao_custom_columns");
			return saved ? JSON.parse(saved) : [];
		} catch { return []; }
	});
	const [newCustomColName, setNewCustomColName] = useState("");

	const addCustomColumn = () => {
		const name = newCustomColName.trim();
		if (!name) return;
		const col = { id: `custom_${Date.now()}`, name };
		const next = [...customColumns, col];
		setCustomColumns(next);
		try { localStorage.setItem("gestao_custom_columns", JSON.stringify(next)); } catch {}
		setNewCustomColName("");
	};

	const deleteCustomColumn = (id: string) => {
		const next = customColumns.filter((c) => c.id !== id);
		setCustomColumns(next);
		try { localStorage.setItem("gestao_custom_columns", JSON.stringify(next)); } catch {}
		setVisibleColumns((prev) => {
			const filtered = prev.filter((c) => c !== id);
			try { localStorage.setItem("gestao_visible_columns", JSON.stringify(filtered)); } catch {}
			return filtered;
		});
	};

	const COLUMN_DEFS: { id: string; label: string; always?: boolean; defaultVisible?: boolean; builtin?: boolean; admin?: boolean }[] = useMemo(() => [
		{ id: "nome", label: "Nome", always: true, builtin: true },
		{ id: "estoqueAtual", label: "Estoque Atual", defaultVisible: true, builtin: true },
		{ id: "estoqueMinimo", label: "Estoque Mínimo", defaultVisible: true, builtin: true },
		{ id: "unidade", label: "Unidade", defaultVisible: true, builtin: true },
		{ id: "valorUnitario", label: "Valor Un. (R$)", defaultVisible: false, builtin: true },
		{ id: "status", label: "Status", defaultVisible: true, builtin: true },
		{ id: "validade", label: "Validade", defaultVisible: true, builtin: true },
		{ id: "responsavel", label: "Responsável", defaultVisible: false, builtin: true },
		{ id: "acoes", label: "Ações", defaultVisible: true, admin: true, builtin: true },
		...customColumns.map((c) => ({ id: c.id, label: c.name, defaultVisible: true })),
	], [customColumns]);

	const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
		if (typeof window === "undefined") return COLUMN_DEFS.filter((c) => c.defaultVisible !== false || c.always).map((c) => c.id);
		try {
			const saved = localStorage.getItem("gestao_visible_columns");
			if (saved) {
				const parsed = JSON.parse(saved) as string[];
				const always = COLUMN_DEFS.filter((c) => c.always).map((c) => c.id);
				const merged = [...new Set([...always, ...parsed])];
				return merged;
			}
		} catch {}
		return COLUMN_DEFS.filter((c) => c.defaultVisible !== false || c.always).map((c) => c.id);
	});

	const toggleColumn = (id: string) => {
		setVisibleColumns((prev) => {
			const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
			try { localStorage.setItem("gestao_visible_columns", JSON.stringify(next)); } catch {}
			return next;
		});
	};

	const [customFieldValues, setCustomFieldValues] = useState<Record<string, Record<string, string>>>({});

	const setCustomField = (itemId: number, colId: string, value: string) => {
		setCustomFieldValues((prev) => ({
			...prev,
			[itemId]: { ...(prev[itemId] || {}), [colId]: value },
		}));
	};

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
			setItemSuggestion({
				message: result.message ?? "",
				name: result.suggestions[0],
			});
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
			const matchingCat = categories.find((c) => c.name === suggestedCatName);
			if (matchingCat && matchingCat.id !== newItem.categoryId) {
				setCategorySuggestion({ categoryId: matchingCat.id, categoryName: suggestedCatName });
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

	const allItems = useMemo(
		() => categories.flatMap((c) => c.items),
		[categories],
	);

	const expiryDays = Number(settings.alert_expiry_days) || 7;
	const lowStockPct = Number(settings.alert_low_stock_pct) || 10;
	const lowStockMultiplier = 1 + lowStockPct / 100;

	const stats = useMemo(() => {
		const totalItens = allItems.length;
		const estoqueTotal = allItems.reduce(
			(sum, i) => sum + Number(i.currentQuantity),
			0,
		);
		const estoqueBaixo = allItems.filter(
			(i) => Number(i.currentQuantity) <= Number(i.minStock) * lowStockMultiplier,
		).length;
		const proximoVencimento = allItems.filter((i) =>
			isExpiringSoon(i.expiryDate, expiryDays),
		).length;
		return { totalItens, estoqueTotal, estoqueBaixo, proximoVencimento };
	}, [allItems, lowStockMultiplier, expiryDays]);

	const filteredItems = useMemo(() => {
		let items = allItems;
		if (search) {
			const q = search.toLowerCase();
			items = items.filter((i) => i.name.toLowerCase().includes(q));
		}
		if (activeCategory) {
			items = items.filter((i) => {
				const cat = categories.find((c) => c.id === activeCategory);
				return cat?.items.some((ci) => ci.id === i.id);
			});
		}
		return items;
	}, [allItems, search, activeCategory, categories]);

	async function addCategory() {
		const name = normalizeCategoryName(newCatName);
		if (!name) {
			toast.error("Digite um nome válido para a categoria");
			return;
		}
		const res = await fetch("/api/categories", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, color: newCatColor }),
		});
		if (res.ok) {
			const data = await res.json();
			toast.success("Categoria adicionada");
			setNewCatName("");
			setNewCatColor(CATEGORY_COLORS[0]);
			setShowNewCat(false);
			setRecentIds((prev) => [...prev, data.id]);
			setTimeout(
				() => setRecentIds((prev) => prev.filter((id) => id !== data.id)),
				4000,
			);
			loadData();
		} else {
			const data = await res.json();
			toast.error(data.error || "Erro ao adicionar categoria");
		}
	}

	async function deleteCategory(id: number) {
		if (!confirm("Excluir esta categoria e todos os seus itens?")) return;
		const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
		if (res.ok) {
			toast.success("Categoria excluída");
			loadData();
		} else {
			toast.error("Erro ao excluir categoria");
		}
	}

	async function deleteItem(id: number) {
		if (!confirm("Excluir este item?")) return;
		const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
		if (res.ok) {
			toast.success("Item excluído");
			loadData();
		} else {
			toast.error("Erro ao excluir item");
		}
	}

	async function addItem() {
		if (!newItem.categoryId) {
			toast.error("Selecione uma categoria");
			return;
		}
		const name = normalizeItemName(newItem.name);
		if (!name) {
			toast.error("Digite um nome válido para o item");
			return;
		}
		const catName = categories.find((c) => c.id === newItem.categoryId)?.name;
		if (catName) {
			const validation = validateItemCategory(name, catName);
			if (!validation.valid) {
				toast.error(validation.message!);
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
				unitPrice: newItem.unitPrice || null,
			}),
		});

		if (!res.ok) {
			const data = await res.json();
			toast.error(data.error || "Erro ao adicionar item");
			return;
		}

		const data = await res.json();
		toast.success("Item adicionado");
		setRecentIds((prev) => [...prev, data.id]);
		setTimeout(
			() => setRecentIds((prev) => prev.filter((id) => id !== data.id)),
			4000,
		);
		setNewItem({ categoryId: null, name: "", unit: "kg", minStock: "0", currentQuantity: "0", unitPrice: "" });
		setShowNewItem(false);
		setItemSuggestion(null);
		setUnitSuggestion(null);
		setCategorySuggestion(null);
		loadData();
	}

	async function startEditItem(item: Item) {
		setEditItem(item);
		setNewItem({
			categoryId: item.categoryId || null,
			name: item.name,
			unit: item.unit,
			minStock: item.minStock,
			currentQuantity: item.currentQuantity,
			unitPrice: item.unitPrice || "",
		});
		setShowEditItem(true);
	}

	async function saveEditItem() {
		if (!editItem) return;
		const name = normalizeItemName(newItem.name);
		if (!name) { toast.error("Digite um nome válido"); return; }
		const res = await fetch(`/api/items/${editItem.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name,
				unit: newItem.unit,
				minStock: newItem.minStock,
				currentQuantity: newItem.currentQuantity,
				unitPrice: newItem.unitPrice || null,
			}),
		});
		if (res.ok) {
			toast.success("Item atualizado");
			setShowEditItem(false);
			setEditItem(null);
			setNewItem({ categoryId: null, name: "", unit: "kg", minStock: "0", currentQuantity: "0", unitPrice: "" });
			loadData();
		} else {
			const data = await res.json();
			toast.error(data.error || "Erro ao atualizar");
		}
	}

	function startEditCategory(cat: Category) {
		setEditCat({ id: cat.id, name: cat.name, color: cat.color });
		setEditCatName(cat.name);
		setEditCatColor(cat.color);
		setShowEditCat(true);
	}

	async function saveEditCategory() {
		if (!editCat) return;
		const name = normalizeCategoryName(editCatName);
		if (!name) { toast.error("Digite um nome válido"); return; }
		const res = await fetch(`/api/categories/${editCat.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, color: editCatColor }),
		});
		if (res.ok) {
			toast.success("Categoria atualizada");
			setShowEditCat(false);
			setEditCat(null);
			loadData();
		} else {
			const data = await res.json();
			toast.error(data.error || "Erro ao atualizar");
		}
	}

	const formatCurrency = (val: number) =>
		val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

	const valorEmEstoque = allItems.reduce((s, i) => {
		const price = Number(i.unitPrice);
		return s + (price > 0 ? price * Number(i.currentQuantity) : 0);
	}, 0);

	const statCards = [
		{
			title: "Total de Itens",
			value: stats.totalItens,
			icon: Package,
			iconBg: "bg-emerald-100",
			iconColor: "text-emerald-600",
			border: "border-emerald-200",
			sub: `${categories.length} categorias`,
		},
		{
			title: "Valor em Estoque",
			value: valorEmEstoque,
			isCurrency: true,
			icon: Layers,
			iconBg: "bg-violet-100",
			iconColor: "text-violet-600",
			border: "border-violet-200",
			sub: valorEmEstoque > 0 ? "capital empregado" : "nenhum item com valor",
		},
		{
			title: "Estoque Baixo",
			value: stats.estoqueBaixo,
			icon: AlertTriangle,
			iconBg: "bg-amber-100",
			iconColor: "text-amber-600",
			border: "border-amber-200",
			sub: `tolerância de ${lowStockPct}% acima do mínimo`,
		},
		{
			title: "Próx. ao Vencimento",
			value: stats.proximoVencimento,
			icon: Clock,
			iconBg: "bg-rose-100",
			iconColor: "text-rose-600",
			border: "border-rose-200",
			sub: `em até ${formatDays(expiryDays)}`,
		},
	];

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-black tracking-tighter uppercase text-[#0f172a]">
						Gestão de Estoque
					</h1>
					<p className="text-[#64748b] text-sm">
						Gerencie categorias, insumos e níveis de estoque.
					</p>
				</div>
			</div>

			{/* 4 Stat Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{statCards.map((card, index) => (
					<div
						key={card.title}
						className="relative group bg-white rounded-2xl border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden"
						style={{ animationDelay: `${index * 80}ms` }}
					>
						<div className="p-5">
							<div className="flex items-start justify-between mb-3">
								<div className="space-y-1">
									<p className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.15em]">
										{card.title}
									</p>
									<div className="text-3xl font-black tracking-tighter tabular-nums text-[#0f172a]">
										{'isCurrency' in card && card.isCurrency ? (
											<span className="text-2xl">{formatCurrency(card.value as number)}</span>
										) : (
											<AnimatedNumber value={card.value as number} />
										)}
									</div>
								</div>
								<div
									className={`p-2.5 rounded-2xl border ${card.iconBg} ${card.iconColor} ${card.border} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
								>
									<card.icon className="h-5 w-5" />
								</div>
							</div>
							<p className="text-[10px] text-[#94a3b8] font-semibold">
								{card.sub}
							</p>
						</div>
						<div
							className={`h-1 w-full bg-gradient-to-r ${card.iconColor.replace("text-", "from-")} to-transparent opacity-40`}
						/>
					</div>
				))}
			</div>

			{/* Search + Action Buttons */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
					<input
						type="text"
						placeholder="Buscar produto em todas as categorias..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-10 pr-4 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-sm bg-white"
					/>
				</div>
				{isAdmin && (
					<div className="flex gap-2 shrink-0">
						<button
							onClick={() => setShowNewItem(true)}
							className="flex items-center gap-2 px-5 py-2.5 bg-[#ea580c] text-white rounded-xl hover:bg-[#c2410c] transition-all text-sm font-bold shadow-lg shadow-orange-500/20"
						>
							<Plus className="w-4 h-4" /> Adicionar Item
						</button>
						<button
							onClick={() => setShowNewCat(true)}
							className="flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white rounded-xl hover:bg-[#1d4ed8] transition-all text-sm font-bold shadow-lg shadow-blue-500/20"
						>
							<Plus className="w-4 h-4" /> Nova Categoria
						</button>
					</div>
				)}
				<button
					onClick={() => setShowColumnModal(true)}
					className="flex items-center gap-2 px-3 py-2.5 bg-white text-[#64748b] border-2 border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc] hover:border-[#2563eb] hover:text-[#2563eb] transition-all text-sm font-bold shrink-0"
					title="Personalizar colunas"
				>
					<Settings2 className="w-4 h-4" /> Colunas
				</button>
			</div>

			{/* ─── ITEM MODAL ─── */}
			{showNewItem && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowNewItem(false); setNewItem({ categoryId: null, name: "", unit: "kg", minStock: "0", currentQuantity: "0", unitPrice: "" }); setItemSuggestion(null); setUnitSuggestion(null); setCategorySuggestion(null); }} />
					<div className="relative bg-white rounded-2xl shadow-2xl border-2 border-[#e2e8f0] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-black uppercase tracking-tight text-[#0f172a]">Adicionar Item</h2>
							<button onClick={() => { setShowNewItem(false); setNewItem({ categoryId: null, name: "", unit: "kg", minStock: "0", currentQuantity: "0", unitPrice: "" }); setItemSuggestion(null); setUnitSuggestion(null); setCategorySuggestion(null); }}
								className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
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
										<span className="text-[9px] text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">Sugerido: {categorySuggestion.categoryName}</span>
										<button type="button" onClick={() => { setNewItem({ ...newItem, categoryId: categorySuggestion.categoryId }); setCategorySuggestion(null); }}
											className="text-[9px] font-bold text-purple-700 bg-purple-200 hover:bg-purple-300 px-2 py-0.5 rounded-full transition-colors">Usar</button>
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
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
								<div>
									<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Valor Un. (R$) <span className="text-[#94a3b8]">(opcional)</span></label>
									<input type="number" step="0.01" min="0" placeholder="0,00"
										value={newItem.unitPrice}
										onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
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
							<button onClick={() => { setShowNewItem(false); setNewItem({ categoryId: null, name: "", unit: "kg", minStock: "0", currentQuantity: "0", unitPrice: "" }); setItemSuggestion(null); setUnitSuggestion(null); setCategorySuggestion(null); }}
								className="px-6 py-3 bg-[#f1f5f9] text-[#64748b] rounded-xl hover:bg-[#e2e8f0] transition-all text-sm font-medium">
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ─── EDIT ITEM MODAL ─── */}
			{showEditItem && editItem && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowEditItem(false); setEditItem(null); }} />
					<div className="relative bg-white rounded-2xl shadow-2xl border-2 border-[#e2e8f0] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-black uppercase tracking-tight text-[#0f172a]">Editar Item</h2>
							<button onClick={() => { setShowEditItem(false); setEditItem(null); }}
								className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="space-y-4">
							<div className="relative">
								<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Categoria</label>
								<select
									value={newItem.categoryId ?? ""}
									onChange={(e) => setNewItem({ ...newItem, categoryId: Number(e.target.value) || null })}
									className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
								>
									<option value="">Selecione categoria</option>
									{categories.map((cat) => (
										<option key={cat.id} value={cat.id}>{cat.name}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Nome do Item</label>
								<input type="text" value={newItem.name}
									onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
									className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
								/>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								<div>
									<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Qtd. Atual</label>
									<input type="number" value={newItem.currentQuantity}
										onChange={(e) => setNewItem({ ...newItem, currentQuantity: e.target.value })}
										className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
									/>
								</div>
								<div>
									<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Unidade</label>
									<select value={newItem.unit}
										onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
										className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
									>
										{KNOWN_UNITS.map((u) => (
											<option key={u} value={u}>{u} - {UNIT_LABELS[u]}</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Est. Mínimo</label>
									<input type="number" value={newItem.minStock}
										onChange={(e) => setNewItem({ ...newItem, minStock: e.target.value })}
										className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
									/>
								</div>
								<div>
									<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Valor Un. (R$) <span className="text-[#94a3b8]">(opcional)</span></label>
									<input type="number" step="0.01" min="0" value={newItem.unitPrice}
										onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
										className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
									/>
								</div>
							</div>
						</div>
						<div className="flex gap-3 mt-6 pt-4 border-t border-[#e2e8f0]">
							<button onClick={saveEditItem}
								className="flex-1 px-4 py-3 bg-[#2563eb] text-white rounded-xl hover:bg-[#1d4ed8] transition-all text-sm font-bold shadow-lg shadow-blue-500/20">
								Salvar Alterações
							</button>
							<button onClick={() => { setShowEditItem(false); setEditItem(null); }}
								className="px-6 py-3 bg-[#f1f5f9] text-[#64748b] rounded-xl hover:bg-[#e2e8f0] transition-all text-sm font-medium">
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ─── CATEGORY MODAL ─── */}
			{showNewCat && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowNewCat(false); setNewCatName(""); setCatSuggestions([]); setCatSuggestionIndex(-1); }} />
					<div className="relative bg-white rounded-2xl shadow-2xl border-2 border-[#e2e8f0] w-full max-w-lg p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-black uppercase tracking-tight text-[#0f172a]">Nova Categoria</h2>
							<button onClick={() => { setShowNewCat(false); setNewCatName(""); setCatSuggestions([]); setCatSuggestionIndex(-1); }}
								className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="relative">
							<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Nome da Categoria</label>
							<input
								type="text"
								placeholder="Digite o nome ou escolha uma sugestão..."
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
									if (e.key === "ArrowDown") {
										e.preventDefault();
										setCatSuggestionIndex((prev) =>
											prev < catSuggestions.length - 1 ? prev + 1 : 0,
										);
									} else if (e.key === "ArrowUp") {
										e.preventDefault();
										setCatSuggestionIndex((prev) =>
											prev > 0 ? prev - 1 : catSuggestions.length - 1,
										);
									} else if (e.key === "Enter" && catSuggestionIndex >= 0) {
										e.preventDefault();
										setNewCatName(catSuggestions[catSuggestionIndex]);
										setCatSuggestions([]);
										setCatSuggestionIndex(-1);
									} else if (e.key === "Escape") {
										setCatSuggestions([]);
										setCatSuggestionIndex(-1);
									}
								}}
								className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
							/>
							{catSuggestions.length > 0 && (
								<div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border-2 border-[#e2e8f0] rounded-xl shadow-xl overflow-hidden">
									{catSuggestions.map((s, i) => (
										<button
											key={s}
											type="button"
											className={`w-full text-left px-3 py-2 text-sm transition-colors ${
												i === catSuggestionIndex
													? "bg-[#2563eb] text-white"
													: "hover:bg-[#f1f5f9] text-[#0f172a]"
											}`}
											onClick={() => {
												setNewCatName(s);
												setCatSuggestions([]);
												setCatSuggestionIndex(-1);
											}}
										>
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
								Salvar Categoria
							</button>
							<button onClick={() => { setShowNewCat(false); setNewCatName(""); setNewCatColor(CATEGORY_COLORS[0]); setCatSuggestions([]); setCatSuggestionIndex(-1); }}
								className="px-6 py-3 bg-[#f1f5f9] text-[#64748b] rounded-xl hover:bg-[#e2e8f0] transition-all text-sm font-medium">
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ─── EDIT CATEGORY MODAL ─── */}
			{showEditCat && editCat && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowEditCat(false); setEditCat(null); }} />
					<div className="relative bg-white rounded-2xl shadow-2xl border-2 border-[#e2e8f0] w-full max-w-lg p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-black uppercase tracking-tight text-[#0f172a]">Editar Categoria</h2>
							<button onClick={() => { setShowEditCat(false); setEditCat(null); }}
								className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						<div>
							<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-1">Nome da Categoria</label>
							<input type="text" value={editCatName}
								onChange={(e) => setEditCatName(e.target.value)}
								className="w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
							/>
						</div>
						<div className="mt-4">
							<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-2">Cor da Categoria</label>
							<div className="flex gap-2.5 flex-wrap">
								{CATEGORY_COLORS.map((c) => (
									<button key={c} type="button" onClick={() => setEditCatColor(c)}
										className={`h-7 w-7 rounded-full transition-all duration-200 ${editCatColor === c ? "ring-2 ring-offset-2 ring-[#0f172a] scale-110" : "hover:scale-110"}`}
										style={{ backgroundColor: c }} title={c} />
								))}
							</div>
						</div>
						<div className="flex gap-3 mt-6 pt-4 border-t border-[#e2e8f0]">
							<button onClick={saveEditCategory}
								className="flex-1 px-4 py-3 text-white rounded-xl hover:brightness-110 transition-all text-sm font-bold shadow-lg"
								style={{ backgroundColor: editCatColor }}>
								Salvar Categoria
							</button>
							<button onClick={() => { setShowEditCat(false); setEditCat(null); }}
								className="px-6 py-3 bg-[#f1f5f9] text-[#64748b] rounded-xl hover:bg-[#e2e8f0] transition-all text-sm font-medium">
								Cancelar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Categorias com suas tabelas */}
			{allItems.length === 0 ? (
				<div className="text-center py-20 max-w-md mx-auto">
					<Package className="h-16 w-16 mx-auto mb-6 opacity-20 text-[#64748b]" />
					<h2 className="text-2xl font-black text-[#0f172a] mb-2">Estoque vazio</h2>
					<p className="text-[#64748b] mb-2">Crie sua primeira categoria e adicione insumos para começar.</p>
					{isAdmin && (
						<button onClick={() => setShowNewCat(true)} className="mt-6 px-4 py-2 bg-[#2563eb] text-white rounded-xl hover:bg-[#1d4ed8] text-sm font-bold">
							<Plus className="w-4 h-4 inline mr-1" /> Criar Categoria
						</button>
					)}
				</div>
			) : (
				<div className="space-y-8">
					{categories.map((cat) => {
						const filtered = cat.items.filter((i) =>
							!search || i.name.toLowerCase().includes(search.toLowerCase())
						);
						if (filtered.length === 0 && search) return null;
						return (
							<section key={cat.id} className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
											<Box className="h-3.5 w-3.5" />
										</div>
										<h2 className="text-xl font-black uppercase tracking-tight" style={{ color: cat.color }}>{cat.name}</h2>
										<span className="text-xs font-bold text-[#94a3b8] bg-slate-100 px-2 py-0.5 rounded-full">
											{filtered.length} {filtered.length === 1 ? "item" : "itens"}
										</span>
									</div>
									{isAdmin && (
										<div className="flex items-center gap-1">
											<button
												onClick={() => startEditCategory(cat)}
												className="p-1.5 text-[#2563eb] hover:bg-blue-50 rounded-lg transition-colors"
												title="Editar categoria"
											>
												<Pencil className="w-4 h-4" />
											</button>
											<button
												onClick={() => deleteCategory(cat.id)}
												className="p-1.5 text-[#dc2626] hover:bg-red-50 rounded-lg transition-colors"
												title="Excluir categoria"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									)}
								</div>

								<div className="overflow-x-auto rounded-2xl border-2 border-[#e2e8f0] bg-white shadow-lg" style={{ borderTopColor: cat.color, borderTopWidth: "3px" }}>
									<table className="w-full text-sm">
										<thead>
											<tr className="bg-[#f8fafc] border-b-2 border-[#e2e8f0]">
												{COLUMN_DEFS.map((col) => {
													if (col.admin && !isAdmin) return null;
													if (!visibleColumns.includes(col.id)) return null;
													return (
														<th key={col.id} className={`text-left p-4 font-bold uppercase text-[10px] tracking-widest text-[#64748b] whitespace-nowrap ${col.id === "acoes" ? "text-right" : ""}`}>{col.label}</th>
													);
												})}
											</tr>
										</thead>
										<tbody>
											{filtered.length === 0 ? (
												<tr>
													<td colSpan={COLUMN_DEFS.filter((c) => { if (c.admin && !isAdmin) return false; return visibleColumns.includes(c.id); }).length} className="p-8 text-center text-[#94a3b8]">
														Nenhum item nesta categoria.
													</td>
												</tr>
											) : (
												filtered.map((item, idx) => {
													const qty = Number(item.currentQuantity);
													const min = Number(item.minStock);
													const status = getStockStatus(qty, min, item.expiryDate, lowStockPct);
													const isRecent = recentIds.includes(item.id);
													const price = Number(item.unitPrice);
													return (
														<tr key={item.id} className={`border-b border-[#e2e8f0] hover:bg-[#f8fafc] transition-all ${
															isExpiringSoon(item.expiryDate) ? "bg-rose-50/50" : idx % 2 === 0 ? "bg-white" : "bg-[#fafbfc]"
														} ${isRecent ? "bg-green-50" : ""}`}>
															{visibleColumns.includes("nome") && (
																<td className="p-4">
																	<div className="flex items-center gap-3">
																		<div className={`h-8 w-8 rounded-lg flex items-center justify-center border-2 ${
																			isExpiringSoon(item.expiryDate)
																				? "bg-rose-100 border-rose-200 text-rose-600"
																				: qty < min
																					? "bg-amber-100 border-amber-200 text-amber-600"
																					: "bg-emerald-100 border-emerald-200 text-emerald-600"
																		}`}>
																			<Package className="h-4 w-4" />
																		</div>
																		<div>
																			<span className={`font-bold text-[#0f172a] ${isRecent ? "text-[#16a34a]" : ""}`}>{item.name}</span>
																			{isRecent && <span className="ml-2 text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase">NOVO</span>}
																			{isExpiringSoon(item.expiryDate) && (
																				<span className="ml-2 text-[9px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
																					Expira {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("pt-BR") : ""}
																				</span>
																			)}
																		</div>
																	</div>
																</td>
															)}
															{visibleColumns.includes("estoqueAtual") && (
																<td className={`p-4 ${qty <= 0 ? "bg-red-50" : qty <= min * lowStockMultiplier ? "bg-amber-50" : "bg-emerald-50"}`}>
																	<span className={`font-black text-lg tabular-nums ${qty <= 0 ? "text-red-600" : qty <= min * lowStockMultiplier ? "text-amber-600" : "text-emerald-600"}`}>
																		{item.currentQuantity}
																	</span>
																</td>
															)}
															{visibleColumns.includes("estoqueMinimo") && (
																<td className="p-4 text-[#64748b] font-semibold">{item.minStock}</td>
															)}
															{visibleColumns.includes("unidade") && (
																<td className="p-4">
																	<span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">{item.unit}</span>
																</td>
															)}
															{visibleColumns.includes("valorUnitario") && (
																<td className="p-4">
																	<span className="font-black tabular-nums text-sm text-[#0f172a]">
																		{price > 0 ? formatCurrency(price) : "—"}
																	</span>
																</td>
															)}
															{visibleColumns.includes("status") && (
																<td className="p-4">
																	<span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border-2 ${status.color}`}>{status.label}</span>
																</td>
															)}
															{visibleColumns.includes("validade") && (
																<td className={`p-4 ${isExpiringSoon(item.expiryDate, expiryDays) ? "bg-amber-50" : ""}`}>
																	<span className={`text-xs font-semibold ${isExpiringSoon(item.expiryDate, expiryDays) ? "text-amber-700" : "text-[#64748b]"}`}>
																		{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("pt-BR") : "Não preenchido"}
																	</span>
																</td>
															)}
															{visibleColumns.includes("responsavel") && (
																<td className="p-4">
																	<span className="text-xs text-[#64748b]">
																		{item.responsible?.name || "Não preenchido"}
																	</span>
																</td>
															)}
															{customColumns.filter((col) => visibleColumns.includes(col.id)).map((col) => (
																<td key={col.id} className="p-4">
																	<span className="text-xs text-[#64748b]">{customFieldValues[item.id]?.[col.id] || "—"}</span>
																</td>
															))}
															{isAdmin && visibleColumns.includes("acoes") && (
																<td className="p-4 text-right whitespace-nowrap">
																	<button onClick={() => startEditItem(item)} className="p-1.5 text-[#2563eb] hover:bg-blue-50 rounded-lg transition-colors mr-1" title="Editar item">
																		<Pencil className="w-4 h-4" />
																	</button>
																	<button onClick={() => deleteItem(item.id)} className="p-1.5 text-[#dc2626] hover:bg-red-50 rounded-lg transition-colors" title="Excluir item">
																		<Trash2 className="w-4 h-4" />
																	</button>
																</td>
															)}
														</tr>
													);
												})
											)}
										</tbody>
									</table>
								</div>
							</section>
						);
					})}

					{/* No results message */}
					{search && categories.every((cat) =>
						cat.items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())).length === 0
					) && (
						<div className="text-center py-16 text-[#64748b]">
							<Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
							<p className="text-lg font-medium">Nenhum resultado para "<strong>{search}</strong>"</p>
							<button onClick={() => setSearch("")} className="text-[#2563eb] underline text-sm mt-2">Limpar busca</button>
						</div>
					)}

					{/* Legend */}
					{!search || categories.some((cat) =>
						cat.items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())).length > 0
					) ? (
						<div className="flex items-center justify-between text-xs text-[#94a3b8] pt-4 border-t border-[#e2e8f0]">
							<span>{allItems.length} itens no total</span>
							<div className="flex gap-3">
								<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Saudável</span>
								<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Baixo</span>
								<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Vencendo</span>
								<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Crítico</span>
							</div>
						</div>
					) : null}
				</div>
			)}
			{/* ─── COLUMN VISIBILITY MODAL ─── */}
			{showColumnModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowColumnModal(false)} />
					<div className="relative bg-white rounded-2xl shadow-2xl border-2 border-[#e2e8f0] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-black uppercase tracking-tight text-[#0f172a]">Sessões / Colunas</h2>
							<button onClick={() => setShowColumnModal(false)}
								className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						<p className="text-xs text-[#94a3b8] mb-4">Escolha quais colunas exibir na tabela. Colunas padrão não podem ser excluídas.</p>
						<div className="space-y-2">
							{COLUMN_DEFS.map((col) => {
								if (col.admin && !isAdmin) return null;
								const isVisible = visibleColumns.includes(col.id);
								const isBuiltin = col.builtin || col.always;
								return (
									<label
										key={col.id}
										className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
											isVisible ? "border-[#2563eb] bg-blue-50" : "border-[#e2e8f0] bg-white hover:bg-[#f8fafc]"
										}`}
									>
										<div className="flex items-center gap-3">
											<div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
												isVisible ? "bg-[#2563eb] border-[#2563eb]" : "border-[#cbd5e1]"
											}`}>
												{isVisible && (
													<svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
													</svg>
												)}
											</div>
											<span className="text-sm font-bold text-[#0f172a]">{col.label}</span>
											{isBuiltin && (
												<span className="text-[9px] font-bold text-[#94a3b8] bg-slate-100 px-1.5 py-0.5 rounded uppercase">Padrão</span>
											)}
										</div>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={(e) => { e.preventDefault(); toggleColumn(col.id); }}
												className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg transition-all ${
													isVisible
														? "text-[#2563eb] bg-blue-100 hover:bg-blue-200"
														: "text-[#94a3b8] bg-[#f1f5f9] hover:bg-[#e2e8f0]"
												}`}
											>
												{isVisible ? "Visível" : "Oculto"}
											</button>
											{!isBuiltin && (
												<button
													type="button"
													onClick={(e) => { e.preventDefault(); deleteCustomColumn(col.id); }}
													className="p-1 text-[#dc2626] hover:bg-red-50 rounded-lg transition-colors"
													title="Excluir coluna"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											)}
										</div>
									</label>
								);
							})}
						</div>

						{/* Nova coluna personalizada */}
						<div className="mt-6 pt-4 border-t border-[#e2e8f0]">
							<label className="block text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-2">Nova Coluna Personalizada</label>
							<div className="flex gap-2">
								<input
									type="text"
									placeholder="Nome da coluna (ex: Fornecedor)"
									value={newCustomColName}
									onChange={(e) => setNewCustomColName(e.target.value)}
									onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomColumn(); } }}
									className="flex-1 px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
								/>
								<button
									onClick={addCustomColumn}
									disabled={!newCustomColName.trim()}
									className="px-4 py-2.5 bg-[#2563eb] text-white rounded-xl hover:bg-[#1d4ed8] transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
								>
									<Plus className="w-4 h-4" />
								</button>
							</div>
							<p className="text-[10px] text-[#94a3b8] mt-1">Colunas personalizadas são sempre do tipo texto.</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
