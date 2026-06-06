import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { suggestCategories, suggestItemCategory, suggestItemCorrection, suggestUnit, validateItemCategory, validateItemUnit, KNOWN_UNITS, UNIT_LABELS } from "@/lib/validation";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
	AlertTriangle,
	Box,
	Clock,
	Layers,
	Package,
	Plus,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/dashboard")({
	component: DashboardPage,
});

type ItemRow = {
	inventory_id: string;
	catalog_item_id: string;
	item_name: string;
	category_name: string;
	category_id: string;
	unit: string;
	current_stock: number;
	min_stock: number;
	expires_at: string | null;
};

type CategoryGroup = {
	id: string;
	name: string;
	items: ItemRow[];
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
				const eased = 1 - Math.pow(1 - progress, 3);
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

function DashboardPage() {
	const { profile } = useAuth();
	const isAdmin = profile?.role === "admin";

	const [groups, setGroups] = useState<CategoryGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [showItemModal, setShowItemModal] = useState(false);
	const [showCatModal, setShowCatModal] = useState(false);

	const [newCatName, setNewCatName] = useState("");
	const [catSuggestions, setCatSuggestions] = useState<string[]>([]);
	const [catSuggestionIndex, setCatSuggestionIndex] = useState(-1);

	const [newItemCatId, setNewItemCatId] = useState("");
	const [newItemName, setNewItemName] = useState("");
	const [newItemUnit, setNewItemUnit] = useState("kg");
	const [newItemInitialStock, setNewItemInitialStock] = useState("0");
	const [newItemMinStock, setNewItemMinStock] = useState("1");
	const [itemSuggestion, setItemSuggestion] = useState<{ message: string; name: string } | null>(null);
	const [unitSuggestion, setUnitSuggestion] = useState<{ unit: string } | null>(null);
	const [categorySuggestion, setCategorySuggestion] = useState<{ categoryId: string; categoryName: string } | null>(null);

	const allItemNames = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.item_name)), [groups]);

	useEffect(() => {
		if (newItemName.trim().length < 3) {
			setItemSuggestion(null);
			setUnitSuggestion(null);
			setCategorySuggestion(null);
			return;
		}
		const result = suggestItemCorrection(newItemName, allItemNames);
		if (result.hasSuggestion && result.normalized !== result.suggestions[0]) {
			setItemSuggestion({ message: result.message ?? "", name: result.suggestions[0] });
		} else { setItemSuggestion(null); }
		const suggested = suggestUnit(newItemName);
		if (suggested && suggested !== newItemUnit) {
			setUnitSuggestion({ unit: suggested });
		} else { setUnitSuggestion(null); }
		const suggestedCatName = suggestItemCategory(newItemName);
		if (suggestedCatName) {
			const match = groups.find((g) => g.name === suggestedCatName);
			if (match && match.id !== newItemCatId) {
				setCategorySuggestion({ categoryId: match.id, categoryName: suggestedCatName });
			} else { setCategorySuggestion(null); }
		} else { setCategorySuggestion(null); }
	}, [newItemName, newItemUnit, newItemCatId, allItemNames, groups]);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const [catRes, itemRes] = await Promise.all([
				supabase.from("categories").select("id, name").order("name"),
				supabase.from("catalog_items").select(`
					id, name, unit_default, category_id,
					inventory_items(id, current_stock, min_stock, unit, item_batches(expires_at))
				`).order("name"),
			]);
			if (catRes.error) throw catRes.error;
			if (itemRes.error) throw itemRes.error;

			const catMap = new Map<string, string>();
			const groupsMap = new Map<string, CategoryGroup>();
			for (const cat of catRes.data || []) {
				catMap.set(cat.id, cat.name);
				groupsMap.set(cat.id, { id: cat.id, name: cat.name, items: [] });
			}
			for (const ci of itemRes.data || []) {
				const inv = (ci as any).inventory_items?.[0];
				const batch = inv?.item_batches?.[0];
				const catName = catMap.get(ci.category_id || "") || "Sem categoria";
				const row: ItemRow = {
					catalog_item_id: ci.id,
					inventory_id: inv?.id || "",
					item_name: ci.name,
					category_name: catName,
					category_id: ci.category_id || "",
					unit: inv?.unit || ci.unit_default || "un",
					current_stock: inv?.current_stock ?? 0,
					min_stock: inv?.min_stock ?? 1,
					expires_at: batch?.expires_at || null,
				};
				const group = groupsMap.get(ci.category_id || "");
				if (group) group.items.push(row);
			}
			setGroups(Array.from(groupsMap.values()));
		} catch (err: any) {
			toast.error("Erro ao carregar: " + err.message);
		} finally { setLoading(false); }
	}, []);

	useEffect(() => { fetchData(); }, [fetchData]);

	const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

	const stats = useMemo(() => {
		const totalItens = allItems.length;
		const estoqueTotal = allItems.reduce((s, i) => s + Number(i.current_stock), 0);
		const estoqueBaixo = allItems.filter((i) => Number(i.current_stock) < Number(i.min_stock)).length;
		const now = new Date();
		const soon = new Date(now.getTime() + 7 * 86400000);
		const proximoVencimento = allItems.filter((i) => {
			if (!i.expires_at) return false;
			const exp = new Date(i.expires_at);
			return exp >= now && exp <= soon;
		}).length;
		return { totalItens, estoqueTotal, estoqueBaixo, proximoVencimento };
	}, [allItems]);

	async function addCategory() {
		const name = newCatName.trim();
		if (!name) { toast.error("Digite um nome"); return; }
		try {
			const { error } = await supabase.from("categories").insert({ name, user_id: profile?.id });
			if (error) throw error;
			toast.success(`Categoria "${name}" criada!`);
			setNewCatName("");
			setShowCatModal(false);
			fetchData();
		} catch (err: any) { toast.error("Erro: " + err.message); }
	}

	async function addItem() {
		if (!newItemName.trim() || !newItemCatId) return;
		const catName = groups.find((g) => g.id === newItemCatId)?.name;
		if (catName) {
			const v = validateItemCategory(newItemName.trim(), catName);
			if (!v.valid) { toast.error(v.message!); return; }
		}
		const u = validateItemUnit(newItemName.trim(), newItemUnit);
		if (!u.valid) { toast.error(u.message!); return; }
		try {
			const { data: ci, error: ciErr } = await supabase.from("catalog_items").insert({
				name: newItemName.trim(), category_id: newItemCatId, unit_default: newItemUnit,
			}).select().single();
			if (ciErr) throw ciErr;
			const { error: invErr } = await supabase.from("inventory_items").insert({
				catalog_item_id: ci.id, category_id: newItemCatId, name: newItemName.trim(),
				unit: newItemUnit, current_stock: Number(newItemInitialStock) || 0,
				min_stock: Number(newItemMinStock) || 1,
			});
			if (invErr) throw invErr;
			toast.success(`"${newItemName.trim()}" adicionado!`);
			setNewItemName(""); setNewItemInitialStock("0"); setNewItemMinStock("1");
			setShowItemModal(false);
			setItemSuggestion(null); setUnitSuggestion(null); setCategorySuggestion(null);
			fetchData();
		} catch (err: any) { toast.error("Erro: " + err.message); }
	}

	function resetItemForm() {
		setNewItemName(""); setNewItemInitialStock("0"); setNewItemMinStock("1");
		setItemSuggestion(null); setUnitSuggestion(null); setCategorySuggestion(null);
		setShowItemModal(false);
	}

	const hour = new Date().getHours();
	const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

	const statCards = [
		{
			title: "Total de Itens", value: stats.totalItens, icon: Package,
			gradient: "from-emerald-500/20 to-emerald-600/5", iconBg: "bg-emerald-500/15",
			iconColor: "text-emerald-400", border: "border-emerald-500/20",
			sub: `${groups.length} categorias`,
		},
		{
			title: "Estoque Total", value: stats.estoqueTotal, icon: Layers,
			gradient: "from-blue-500/20 to-blue-600/5", iconBg: "bg-blue-500/15",
			iconColor: "text-blue-400", border: "border-blue-500/20",
			sub: `${allItems.length} itens cadastrados`,
		},
		{
			title: "Estoque Baixo", value: stats.estoqueBaixo, icon: AlertTriangle,
			gradient: "from-amber-500/20 to-amber-600/5", iconBg: "bg-amber-500/15",
			iconColor: "text-amber-400", border: "border-amber-500/20",
			sub: stats.estoqueBaixo === 1 ? "item abaixo do mínimo" : "itens abaixo do mínimo",
		},
		{
			title: "Próx. ao Vencimento", value: stats.proximoVencimento, icon: Clock,
			gradient: "from-rose-500/20 to-rose-600/5", iconBg: "bg-rose-500/15",
			iconColor: "text-rose-400", border: "border-rose-500/20",
			sub: "em 7 dias",
		},
	];

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-slate-400 font-semibold">
						{greeting}, <span className="text-emerald-400">{profile?.name || "Usuário"}</span>
					</p>
					<h1 className="text-3xl font-black tracking-tighter uppercase text-white mt-1">Dashboard</h1>
				</div>
				<div className="text-right">
					<p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
						{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
					</p>
					<p className="text-xs text-slate-500">{profile?.role === "admin" ? "Administrador" : "Colaborador"}</p>
				</div>
			</div>

			{/* Stat Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{statCards.map((card, i) => (
					<motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
						<div className={cn("relative overflow-hidden rounded-[1.5rem] border shadow-2xl transition-all duration-500 h-full",
							"bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl",
							card.border, "hover:scale-[1.02] hover:shadow-emerald-500/5")}>
							<div className={cn("absolute inset-0 opacity-30", `bg-gradient-to-br ${card.gradient}`)} />
							<div className={cn("absolute -right-6 -top-6 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40", card.iconBg)} />
							<div className="relative p-5">
								<div className="flex items-start justify-between mb-3">
									<div className="space-y-1">
										<p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{card.title}</p>
										<div className="text-3xl font-black tracking-tighter tabular-nums text-white">
											<AnimatedNumber value={card.value} />
										</div>
									</div>
									<div className={cn("p-2.5 rounded-2xl border shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-6", card.iconBg, card.iconColor, card.border)}>
										<card.icon className="h-5 w-5" />
									</div>
								</div>
								<p className="text-[10px] text-slate-500 font-semibold mt-1">{card.sub}</p>
							</div>
							<div className={cn("absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-60",
								card.iconBg.replace("bg-", "from-").replace("/15", "/30"), "to-transparent")} />
						</div>
					</motion.div>
				))}
			</div>



			{/* Recent items */}
			{!loading && allItems.length > 0 && (
				<div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl overflow-hidden">
					<div className="p-4 border-b border-white/5 flex items-center justify-between">
						<h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
							<Box className="w-4 h-4 text-emerald-500" /> Itens Recentes
						</h2>
						<span className="text-[10px] text-slate-500 font-bold">{allItems.length} no total</span>
					</div>
					<div className="divide-y divide-white/5">
						{allItems.slice(-8).reverse().map((item) => {
							const isExpiring = item.expires_at && (() => {
								const diff = new Date(item.expires_at!).getTime() - Date.now();
								return diff >= 0 && diff <= 7 * 86400000;
							})();
							return (
								<div key={item.catalog_item_id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors">
									<div className="flex items-center gap-3">
										<div className={cn("h-7 w-7 rounded-lg flex items-center justify-center border",
											isExpiring ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
												: item.current_stock < item.min_stock ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
													: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400")}>
											<Package className="h-3.5 w-3.5" />
										</div>
										<div>
											<p className="text-sm font-bold text-white">{item.item_name}</p>
											<p className="text-[10px] text-slate-500">{item.category_name}</p>
										</div>
									</div>
									<p className={cn("text-sm font-black tabular-nums",
										item.current_stock <= 0 ? "text-red-400" : item.current_stock < item.min_stock ? "text-amber-400" : "text-white")}>
										{item.current_stock} <span className="text-[9px] font-bold text-slate-500 uppercase">{item.unit}</span>
									</p>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* ─── ITEM MODAL ─── */}
			{showItemModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={resetItemForm} />
					<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
						className="relative bg-slate-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-black uppercase tracking-tight text-white">Adicionar Item</h2>
							<button onClick={resetItemForm} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="space-y-4">
							<div className="relative">
								<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</Label>
								<Select value={newItemCatId} onValueChange={setNewItemCatId}>
									<SelectTrigger className={cn("mt-1", categorySuggestion ? "border-purple-500" : "")}>
										<SelectValue placeholder="Selecione..." />
									</SelectTrigger>
									<SelectContent>
										{groups.map((g) => (
											<SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
								{categorySuggestion && (
									<div className="flex items-center gap-1.5 mt-1.5">
										<span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
											Sugerido: {categorySuggestion.categoryName}
										</span>
										<button type="button" onClick={() => { setNewItemCatId(categorySuggestion.categoryId); setCategorySuggestion(null); }}
											className="text-[10px] font-bold text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 px-2 py-0.5 rounded-full transition-colors">Usar</button>
									</div>
								)}
							</div>
							<div className="relative">
								<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Item</Label>
								<Input value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
									placeholder="Ex: Peito de Frango"
									className={cn("mt-1", itemSuggestion ? "border-amber-500 ring-amber-500/30" : "")} />
								{itemSuggestion && (
									<div className="flex items-center gap-1.5 mt-1.5">
										<span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{itemSuggestion.message}</span>
										<button type="button" onClick={() => { setNewItemName(itemSuggestion.name); setItemSuggestion(null); }}
											className="text-[10px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded-full transition-colors">Usar este</button>
									</div>
								)}
							</div>
							<div className="grid grid-cols-3 gap-3">
								<div>
									<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estoque Inicial</Label>
									<Input type="number" value={newItemInitialStock} onChange={(e) => setNewItemInitialStock(e.target.value)}
										placeholder="0" className="mt-1" />
								</div>
								<div>
									<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidade</Label>
									<div className="relative mt-1">
										<Select value={newItemUnit} onValueChange={(v) => { setNewItemUnit(v); setUnitSuggestion(null); }}>
											<SelectTrigger className={unitSuggestion ? "border-orange-500" : ""}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{KNOWN_UNITS.map((u) => (
													<SelectItem key={u} value={u}>{u} — {UNIT_LABELS[u]}</SelectItem>
												))}
											</SelectContent>
										</Select>
										{unitSuggestion && (
											<div className="flex items-center gap-1.5 mt-1.5">
												<span className="text-[10px] text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">Sugerido: {unitSuggestion.unit}</span>
												<button type="button" onClick={() => { setNewItemUnit(unitSuggestion.unit); setUnitSuggestion(null); }}
													className="text-[10px] font-bold text-orange-300 bg-orange-500/20 hover:bg-orange-500/30 px-2 py-0.5 rounded-full transition-colors">Usar</button>
											</div>
										)}
									</div>
								</div>
								<div>
									<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Est. Mínimo</Label>
									<Input type="number" value={newItemMinStock} onChange={(e) => setNewItemMinStock(e.target.value)}
										placeholder="1" className="mt-1" />
								</div>
							</div>
						</div>
						<div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
							<Button onClick={addItem}
								className="flex-1 h-12 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20">
								Salvar Item
							</Button>
							<Button variant="outline" onClick={resetItemForm}
								className="h-12 px-6 rounded-xl text-sm font-medium">
								Cancelar
							</Button>
						</div>
					</motion.div>
				</div>
			)}

			{/* ─── CATEGORY MODAL ─── */}
			{showCatModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => { setShowCatModal(false); setNewCatName(""); setCatSuggestions([]); }} />
					<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
						className="relative bg-slate-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-md p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-black uppercase tracking-tight text-white">Nova Categoria</h2>
							<button onClick={() => { setShowCatModal(false); setNewCatName(""); setCatSuggestions([]); }}
								className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="relative">
							<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome da Categoria</Label>
							<Input value={newCatName}
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
								placeholder="Ex: Carnes" className="mt-1" autoFocus />
							{catSuggestions.length > 0 && (
								<div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
									{catSuggestions.map((s, i) => (
										<button key={s} type="button"
											className={`w-full text-left px-3 py-2 text-sm transition-colors ${
												i === catSuggestionIndex ? "bg-emerald-500/20 text-emerald-300" : "hover:bg-white/5 text-white"
											}`}
											onClick={() => { setNewCatName(s); setCatSuggestions([]); setCatSuggestionIndex(-1); }}>
											{s}
										</button>
									))}
								</div>
							)}
						</div>
						<div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
							<Button onClick={addCategory}
								className="flex-1 h-12 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
								Criar Categoria
							</Button>
							<Button variant="outline" onClick={() => { setShowCatModal(false); setNewCatName(""); setCatSuggestions([]); }}
								className="h-12 px-6 rounded-xl text-sm font-medium">
								Cancelar
							</Button>
						</div>
					</motion.div>
				</div>
			)}
		</div>
	);
}
