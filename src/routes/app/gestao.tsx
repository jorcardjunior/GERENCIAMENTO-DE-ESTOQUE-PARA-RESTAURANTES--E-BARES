import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SEED_CATEGORIAS } from "@/data/seed-padrao";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { suggestCategories, suggestItemCategory, suggestItemCorrection, suggestUnit, validateItemCategory, validateItemUnit, KNOWN_UNITS, UNIT_LABELS } from "@/lib/validation";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
	AlertTriangle,
	Box,
	Clock,
	Database,
	FolderPlus,
	GripVertical,
	Layers,
	Loader2,
	Package,
	Plus,
	Search,
	Settings2,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/gestao")({
	component: GestaoEstoque,
});

type CustomColumn = {
	id: string;
	name: string;
	type: string;
	display_order: number;
};

type ItemRow = {
	inventory_id: string;
	catalog_item_id: string;
	item_name: string;
	category_name: string;
	category_id: string;
	unit: string;
	current_stock: number;
	min_stock: number;
	updated_at: string | null;
	expires_at: string | null;
	custom_fields: Record<string, string>;
};

type CategoryGroup = {
	id: string;
	name: string;
	description: string | null;
	items: ItemRow[];
	columns: CustomColumn[];
	created_at: string | null;
	user_id: string | null;
	user_name: string | null;
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

function GestaoEstoque() {
	const { profile } = useAuth();
	const isAdmin = profile?.role === "admin";
	const userName = profile?.name || profile?.email || "Usuário";

	const [groups, setGroups] = useState<CategoryGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const [catDialogOpen, setCatDialogOpen] = useState(false);
	const [newCatName, setNewCatName] = useState("");
	const [catSuggestions, setCatSuggestions] = useState<string[]>([]);
	const [catSuggestionIndex, setCatSuggestionIndex] = useState(-1);

	const [itemDialogOpen, setItemDialogOpen] = useState(false);
	const [newItemCatId, setNewItemCatId] = useState("");
	const [newItemName, setNewItemName] = useState("");
	const [newItemUnit, setNewItemUnit] = useState("kg");
	const [newItemInitialStock, setNewItemInitialStock] = useState("0");
	const [newItemMinStock, setNewItemMinStock] = useState("1");
	const [itemSuggestion, setItemSuggestion] = useState<{
		message: string;
		name: string;
	} | null>(null);
	const [unitSuggestion, setUnitSuggestion] = useState<{
		unit: string;
	} | null>(null);
	const [categorySuggestion, setCategorySuggestion] = useState<{
		categoryId: string;
		categoryName: string;
	} | null>(null);

	const allItemNames = useMemo(
		() => groups.flatMap((g) => g.items.map((i) => i.item_name)),
		[groups],
	);

	useEffect(() => {
		if (newItemName.trim().length < 3) {
			setItemSuggestion(null);
			setUnitSuggestion(null);
			setCategorySuggestion(null);
			return;
		}
		const result = suggestItemCorrection(newItemName, allItemNames);
		if (result.hasSuggestion && result.normalized !== result.suggestions[0]) {
			setItemSuggestion({
				message: result.message ?? "",
				name: result.suggestions[0],
			});
		} else {
			setItemSuggestion(null);
		}
		const suggested = suggestUnit(newItemName);
		if (suggested && suggested !== newItemUnit) {
			setUnitSuggestion({ unit: suggested });
		} else {
			setUnitSuggestion(null);
		}
		const suggestedCatName = suggestItemCategory(newItemName);
		if (suggestedCatName) {
			const matchingCat = groups.find((g) => g.name === suggestedCatName);
			if (matchingCat && matchingCat.id !== newItemCatId) {
				setCategorySuggestion({ categoryId: matchingCat.id, categoryName: suggestedCatName });
			} else {
				setCategorySuggestion(null);
			}
		} else {
			setCategorySuggestion(null);
		}
	}, [newItemName, newItemUnit, newItemCatId, allItemNames, groups]);

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

	const COLUMN_DEFS = useMemo(() => [
		{ id: "nome", label: "Nome", always: true, builtin: true },
		{ id: "estoqueAtual", label: "Estoque Atual", defaultVisible: true, builtin: true },
		{ id: "estoqueMinimo", label: "Estoque Mínimo", defaultVisible: true, builtin: true },
		{ id: "unidade", label: "Unidade", defaultVisible: true, builtin: true },
		{ id: "status", label: "Status", defaultVisible: true, builtin: true },
		{ id: "validade", label: "Validade", defaultVisible: true, builtin: true },
		{ id: "responsavel", label: "Responsável", defaultVisible: false, builtin: true },
		{ id: "acoes", label: "Ações", defaultVisible: true, admin: true, builtin: true },
		...customColumns.map((c) => ({ id: c.id, label: c.name, defaultVisible: true })),
	], [customColumns]);
	const [showColumnModal, setShowColumnModal] = useState(false);
	const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
		if (typeof window === "undefined") return COLUMN_DEFS.filter((c) => c.defaultVisible !== false || c.always).map((c) => c.id);
		try {
			const saved = localStorage.getItem("gestao_visible_columns");
			if (saved) {
				const parsed = JSON.parse(saved) as string[];
				const always = COLUMN_DEFS.filter((c) => c.always).map((c) => c.id);
				return [...new Set([...always, ...parsed])];
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

	const [columnDialogTarget, setColumnDialogTarget] = useState<string | null>(
		null,
	);
	const [columnName, setColumnName] = useState("");
	const [columnType, setColumnType] = useState("text");

	const EXPIRY_SOON_DAYS = 7;

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const [catRes, itemRes, colRes, profileRes] = await Promise.all([
				supabase
					.from("categories")
					.select("id, name, description, created_at, user_id")
					.order("name"),
				supabase
					.from("catalog_items")
					.select(`
          id, name, unit_default, category_id,
          inventory_items(
            id, current_stock, min_stock, unit, updated_at, custom_fields,
            item_batches(expires_at)
          )
        `)
					.order("name"),
				(supabase as any)
					.from("custom_columns")
					.select("*")
					.order("display_order"),
				supabase.from("profiles").select("id, name"),
			]);

			if (catRes.error) throw catRes.error;
			if (itemRes.error) throw itemRes.error;

			const profileMap: Record<string, string> = {};
			for (const p of profileRes.data || []) {
				profileMap[p.id] = p.name || "Usuário";
			}

			const allColumns = (colRes.data || []) as CustomColumn[];
			const colsByCategory: Record<string, CustomColumn[]> = {};
			for (const col of allColumns) {
				const catId = (col as any).category_id || "";
				if (!colsByCategory[catId]) colsByCategory[catId] = [];
				colsByCategory[catId].push(col);
			}

			const catMap = new Map<string, { id: string; name: string }>();
			const groupsMap = new Map<string, CategoryGroup>();
			for (const cat of catRes.data || []) {
				catMap.set(cat.id, { id: cat.id, name: cat.name });
				groupsMap.set(cat.id, {
					id: cat.id,
					name: cat.name,
					description: (cat as any).description || null,
					items: [],
					columns: colsByCategory[cat.id] || [],
					created_at: (cat as any).created_at || null,
					user_id: (cat as any).user_id || null,
					user_name: (cat as any).user_id
						? profileMap[(cat as any).user_id] || null
						: null,
				});
			}

			for (const ci of itemRes.data || []) {
				const inv = (ci as any).inventory_items?.[0];
				const batch = inv?.item_batches?.[0];
				const catName =
					catMap.get(ci.category_id || "")?.name || "Sem categoria";
				const row: ItemRow = {
					catalog_item_id: ci.id,
					inventory_id: inv?.id || "",
					item_name: ci.name,
					category_name: catName,
					category_id: ci.category_id || "",
					unit: inv?.unit || ci.unit_default || "un",
					current_stock: inv?.current_stock ?? 0,
					min_stock: inv?.min_stock ?? 1,
					updated_at: inv?.updated_at || null,
					expires_at: batch?.expires_at || null,
					custom_fields: inv?.custom_fields || {},
				};
				const group = groupsMap.get(ci.category_id || "");
				if (group) group.items.push(row);
			}

			setGroups(Array.from(groupsMap.values()));
		} catch (err: any) {
			toast.error("Erro ao carregar dados: " + err.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const allItems = useMemo(() => {
		return groups.flatMap((g) => g.items);
	}, [groups]);

	const uniqueCategories = useMemo(() => {
		return groups.map((g) => ({ id: g.id, name: g.name }));
	}, [groups]);

	const stats = useMemo(() => {
		const totalItens = allItems.length;
		const estoqueTotal = allItems.reduce((sum, i) => sum + i.current_stock, 0);
		const estoqueBaixo = allItems.filter(
			(i) => i.current_stock < i.min_stock,
		).length;
		const now = new Date();
		const soon = new Date(now.getTime() + EXPIRY_SOON_DAYS * 86400000);
		const proximoVencimento = allItems.filter((i) => {
			if (!i.expires_at) return false;
			const exp = new Date(i.expires_at);
			return exp >= now && exp <= soon;
		}).length;
		return { totalItens, estoqueTotal, estoqueBaixo, proximoVencimento };
	}, [allItems]);

	const getStockStatus = (item: ItemRow) => {
		if (item.expires_at) {
			const exp = new Date(item.expires_at);
			const now = new Date();
			const diff = exp.getTime() - now.getTime();
			if (diff >= 0 && diff <= EXPIRY_SOON_DAYS * 86400000) {
				return {
					label: "Vencendo",
					variant: "destructive" as const,
					color: "text-rose-500 bg-rose-500/10 border-rose-500/30",
				};
			}
		}
		if (item.current_stock <= 0) {
			return {
				label: "Crítico",
				variant: "destructive" as const,
				color: "text-red-500 bg-red-500/10 border-red-500/30",
			};
		}
		if (item.current_stock < item.min_stock) {
			return {
				label: "Baixo",
				variant: "outline" as const,
				color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
			};
		}
		return {
			label: "Saudável",
			variant: "secondary" as const,
			color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
		};
	};

	const handleCreateCategory = async () => {
		if (!newCatName.trim()) return;
		try {
			const { error } = await supabase.from("categories").insert({
				name: newCatName.trim(),
				user_id: profile?.id,
			});
			if (error) throw error;
			toast.success(`Categoria "${newCatName.trim()}" criada!`);
			setNewCatName("");
			setCatDialogOpen(false);
			fetchData();
		} catch (err: any) {
			toast.error("Erro: " + err.message);
		}
	};

	const handleCreateItem = async () => {
		if (!newItemName.trim() || !newItemCatId) return;
		const catName = groups.find((g) => g.id === newItemCatId)?.name;
		if (catName) {
			const validation = validateItemCategory(newItemName.trim(), catName);
			if (!validation.valid) {
				toast.error(validation.message!);
				return;
			}
		}
		const unitValidation = validateItemUnit(newItemName.trim(), newItemUnit);
		if (!unitValidation.valid) {
			toast.error(unitValidation.message!);
			return;
		}
		try {
			const { data: ci, error: ciErr } = await supabase
				.from("catalog_items")
				.insert({
					name: newItemName.trim(),
					category_id: newItemCatId,
					unit_default: newItemUnit,
				})
				.select()
				.single();
			if (ciErr) throw ciErr;

			const { error: invErr } = await supabase.from("inventory_items").insert({
				catalog_item_id: ci.id,
				category_id: newItemCatId,
				name: newItemName.trim(),
				unit: newItemUnit,
				current_stock: Number(newItemInitialStock) || 0,
				min_stock: Number(newItemMinStock) || 1,
			});
			if (invErr) throw invErr;

			toast.success(`"${newItemName.trim()}" adicionado!`);
			setNewItemName("");
			setNewItemInitialStock("0");
			setNewItemMinStock("1");
			setItemDialogOpen(false);
			setItemSuggestion(null);
			setUnitSuggestion(null);
			setCategorySuggestion(null);
			fetchData();
		} catch (err: any) {
			toast.error("Erro: " + err.message);
		}
	};

	const [seeding, setSeeding] = useState(false);
	const handleSeedDefault = async () => {
		if (
			!confirm(
				"Carregar todas as categorias e insumos padrão? Isso pulará itens já existentes.",
			)
		)
			return;
		setSeeding(true);
		try {
			let created = 0;
			for (const cat of SEED_CATEGORIAS) {
				const { data: newCat, error: catErr } = await supabase
					.from("categories")
					.insert({
						name: cat.name,
						description: cat.description || null,
						user_id: profile?.id,
					})
					.select()
					.single();
				if (catErr) {
					if (catErr.code === "23505") continue;
					throw catErr;
				}
				const catItems = cat.items.map((item) => ({
					name: item.name,
					category_id: newCat.id,
					unit_default: item.unit,
				}));
				const { error: itemsErr } = await supabase
					.from("catalog_items")
					.insert(catItems);
				if (itemsErr && itemsErr.code !== "23505") {
					if (itemsErr.code === "23505") continue;
					throw itemsErr;
				}
				created++;
			}
			toast.success(`${created} categorias carregadas com sucesso!`);
			fetchData();
		} catch (err: any) {
			toast.error("Erro ao carregar padrão: " + err.message);
		} finally {
			setSeeding(false);
		}
	};

	const handleDeleteItem = async (item: ItemRow) => {
		if (!confirm(`Remover "${item.item_name}"?`)) return;
		try {
			if (item.inventory_id) {
				await supabase
					.from("stock_movements")
					.delete()
					.eq("inventory_item_id", item.inventory_id);
				await supabase
					.from("item_batches")
					.delete()
					.eq("inventory_item_id", item.inventory_id);
				await supabase
					.from("inventory_items")
					.delete()
					.eq("id", item.inventory_id);
			}
			await supabase
				.from("catalog_items")
				.delete()
				.eq("id", item.catalog_item_id);
			toast.success(`"${item.item_name}" removido.`);
			fetchData();
		} catch (err: any) {
			toast.error("Erro ao remover: " + err.message);
		}
	};

	const handleAddColumn = async () => {
		if (!columnName.trim() || !columnDialogTarget) return;
		try {
			const group = groups.find((g) => g.id === columnDialogTarget);
			const nextOrder = group ? group.columns.length : 0;
			const { error } = await (supabase as any).from("custom_columns").insert({
				category_id: columnDialogTarget,
				name: columnName.trim(),
				type: columnType,
				display_order: nextOrder,
			});
			if (error) throw error;
			toast.success(`Coluna "${columnName.trim()}" adicionada!`);
			setColumnName("");
			setColumnType("text");
			fetchData();
		} catch (err: any) {
			toast.error("Erro: " + err.message);
		}
	};

	const handleRemoveColumn = async (colId: string) => {
		if (!confirm("Remover esta coluna? Os dados serão perdidos.")) return;
		try {
			const { error } = await (supabase as any)
				.from("custom_columns")
				.delete()
				.eq("id", colId);
			if (error) throw error;
			toast.success("Coluna removida.");
			fetchData();
		} catch (err: any) {
			toast.error("Erro: " + err.message);
		}
	};

	const statCards = [
		{
			title: "Total de Itens",
			value: stats.totalItens,
			icon: Package,
			gradient: "from-emerald-500/20 to-emerald-600/5",
			iconBg: "bg-emerald-500/15",
			iconColor: "text-emerald-400",
			border: "border-emerald-500/20",
			sub: `${uniqueCategories.length} categorias`,
		},
		{
			title: "Categorias",
			value: uniqueCategories.length,
			icon: Layers,
			gradient: "from-blue-500/20 to-blue-600/5",
			iconBg: "bg-blue-500/15",
			iconColor: "text-blue-400",
			border: "border-blue-500/20",
			sub: `${allItems.length} itens distribuídos`,
		},
		{
			title: "Estoque Baixo",
			value: stats.estoqueBaixo,
			icon: AlertTriangle,
			gradient: "from-amber-500/20 to-amber-600/5",
			iconBg: "bg-amber-500/15",
			iconColor: "text-amber-400",
			border: "border-amber-500/20",
			sub:
				stats.estoqueBaixo === 1
					? "item abaixo do mínimo"
					: "itens abaixo do mínimo",
		},
		{
			title: "Próx. ao Vencimento",
			value: stats.proximoVencimento,
			icon: Clock,
			gradient: "from-rose-500/20 to-rose-600/5",
			iconBg: "bg-rose-500/15",
			iconColor: "text-rose-400",
			border: "border-rose-500/20",
			sub: `em ${EXPIRY_SOON_DAYS} dias`,
		},
	];

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			{/* Header */}
			<header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-black tracking-tighter uppercase">
						Gestão de Estoque
					</h1>
					<p className="text-muted-foreground">
						{isAdmin
							? "Gerencie categorias, insumos e colunas personalizadas."
							: "Visualize o estoque do restaurante."}
					</p>
				</div>
				<div className="flex gap-3 flex-wrap">
					<Button variant="outline" onClick={() => setShowColumnModal(true)}>
						<Settings2 className="mr-2 h-4 w-4" /> Colunas
					</Button>
					{isAdmin && (
						<Button
							variant="outline"
							onClick={handleSeedDefault}
							disabled={seeding}
						>
							<Database
								className={cn("mr-2 h-4 w-4", seeding && "animate-spin")}
							/>
							{seeding ? "Carregando..." : "Carregar Padrão"}
						</Button>
					)}
				</div>
			</header>

			{/* 4 Modern Stat Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{statCards.map((card, index) => (
					<motion.div
						key={card.title}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: index * 0.08 }}
						className="relative group"
					>
						<div
							className={cn(
								"relative overflow-hidden rounded-[1.5rem] border shadow-2xl transition-all duration-500 h-full",
								"bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl",
								card.border,
								"hover:scale-[1.02] hover:shadow-emerald-500/5",
							)}
						>
							<div
								className={cn(
									"absolute inset-0 opacity-30",
									`bg-gradient-to-br ${card.gradient}`,
								)}
							/>
							<div
								className={cn(
									"absolute -right-6 -top-6 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40",
									card.iconBg,
								)}
							/>
							<div className="relative p-5">
								<div className="flex items-start justify-between mb-3">
									<div className="space-y-1">
										<p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
											{card.title}
										</p>
										<div className="text-3xl font-black tracking-tighter tabular-nums text-white">
											<AnimatedNumber value={card.value} />
										</div>
									</div>
									<div
										className={cn(
											"p-2.5 rounded-2xl border shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
											card.iconBg,
											card.iconColor,
											card.border,
										)}
									>
										<card.icon className="h-5 w-5" />
									</div>
								</div>
								<p className="text-[10px] text-slate-500 font-semibold mt-1">
									{card.sub}
								</p>
							</div>
							<div
								className={cn(
									"absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-60",
									card.iconBg.replace("bg-", "from-").replace("/15", "/30"),
									`to-transparent`,
								)}
							/>
						</div>
					</motion.div>
				))}
			</div>

			{/* Search + Category Chips + Add Button */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1 min-w-0">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar produto em todas as categorias..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-10 h-10 rounded-xl bg-slate-900/40 border-white/5"
					/>
				</div>
				<div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0 scrollbar-thin">
					<button
						onClick={() => setActiveCategory(null)}
						className={cn(
							"px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border",
							!activeCategory
								? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
								: "bg-slate-800/40 text-slate-400 border-white/5 hover:bg-slate-700/40",
						)}
					>
						Todos
					</button>
					{uniqueCategories.map((cat) => (
						<button
							key={cat.id}
							onClick={() =>
								setActiveCategory(activeCategory === cat.id ? null : cat.id)
							}
							className={cn(
								"px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border",
								activeCategory === cat.id
									? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
									: "bg-slate-800/40 text-slate-400 border-white/5 hover:bg-slate-700/40",
							)}
						>
							{cat.name}
						</button>
					))}
				</div>
				{isAdmin && (
					<div className="flex gap-2 shrink-0">
						<Dialog open={itemDialogOpen} onOpenChange={(open) => { setItemDialogOpen(open); if (!open) { setUnitSuggestion(null); setItemSuggestion(null); setCategorySuggestion(null); } }}>
							<DialogTrigger asChild>
								<Button className="h-10 px-4 rounded-xl font-bold shrink-0 bg-orange-600 hover:bg-orange-700 text-white">
									<Plus className="h-4 w-4 mr-1" /> Adicionar Item
								</Button>
							</DialogTrigger>
							<DialogContent>
								<form
									onSubmit={(e) => {
										e.preventDefault();
										handleCreateItem();
									}}
								>
									<DialogHeader>
										<DialogTitle>Adicionar Insumo</DialogTitle>
										<DialogDescription>
											Adicione um novo produto ao estoque.
										</DialogDescription>
									</DialogHeader>
									<div className="grid gap-4 py-4">
									<div className="relative">
										<Label>Categoria</Label>
										<Select
											value={newItemCatId}
											onValueChange={setNewItemCatId}
										>
											<SelectTrigger className={categorySuggestion ? "border-purple-500" : ""}>
												<SelectValue placeholder="Selecione..." />
											</SelectTrigger>
											<SelectContent>
												{groups.map((g) => (
													<SelectItem key={g.id} value={g.id}>
														{g.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{categorySuggestion && (
											<div className="flex items-center gap-1.5 mt-1.5">
													<span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
													Sugerido: {categorySuggestion.categoryName}
												</span>
												<button
													type="button"
													onClick={() => {
														setNewItemCatId(categorySuggestion.categoryId);
														setCategorySuggestion(null);
													}}
													className="text-[10px] font-bold text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 px-2 py-0.5 rounded-full transition-colors"
												>
													Usar
												</button>
											</div>
										)}
									</div>
										<div className="relative">
											<Label>Nome do Produto</Label>
											<Input
												value={newItemName}
												onChange={(e) => {
													setNewItemName(e.target.value);
												}}
												placeholder="Ex: Peito de Frango"
												className={itemSuggestion ? "border-amber-500" : ""}
											/>
											{itemSuggestion && (
												<div className="flex items-center gap-1.5 mt-1.5">
													<span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
														{itemSuggestion.message}
													</span>
													<button
														type="button"
														onClick={() => {
															setNewItemName(itemSuggestion.name);
															setItemSuggestion(null);
														}}
														className="text-[10px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded-full transition-colors"
													>
														Usar este
													</button>
												</div>
											)}
										</div>
										<div className="grid grid-cols-3 gap-4">
											<div>
												<Label>Qtd. Inicial</Label>
												<Input
													type="number"
													value={newItemQty}
													onChange={(e) => setNewItemQty(e.target.value)}
													placeholder="0"
												/>
											</div>
											<div className="relative">
												<Label>Unidade</Label>
												<Select value={newItemUnit} onValueChange={setNewItemUnit}>
													<SelectTrigger className={unitSuggestion ? "border-orange-500" : ""}>
														<SelectValue placeholder="kg" />
													</SelectTrigger>
													<SelectContent>
														{KNOWN_UNITS.map((u) => (
															<SelectItem key={u} value={u}>
																{u} - {UNIT_LABELS[u]}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{unitSuggestion && (
													<div className="flex items-center gap-1.5 mt-1.5">
														<span className="text-[10px] text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
															Sugerido: {unitSuggestion.unit}
														</span>
														<button
															type="button"
															onClick={() => {
																setNewItemUnit(unitSuggestion.unit);
																setUnitSuggestion(null);
															}}
															className="text-[10px] font-bold text-orange-300 bg-orange-500/20 hover:bg-orange-500/30 px-2 py-0.5 rounded-full transition-colors"
														>
															Usar
														</button>
													</div>
												)}
											</div>
											<div>
												<Label>Est. Mínimo</Label>
												<Input
													type="number"
													value={newItemMinStock}
													onChange={(e) => setNewItemMinStock(e.target.value)}
													placeholder="0"
												/>
											</div>
										</div>
									</div>
									<DialogFooter>
										<Button
											type="submit"
											disabled={!newItemName.trim() || !newItemCatId}
										>
											Adicionar
										</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
						<Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
							<DialogTrigger asChild>
								<Button className="h-10 px-4 rounded-xl font-bold shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white">
									<FolderPlus className="h-4 w-4 mr-1" /> Nova Categoria
								</Button>
							</DialogTrigger>
							<DialogContent>
								<form
									onSubmit={(e) => {
										e.preventDefault();
										handleCreateCategory();
									}}
								>
									<DialogHeader>
										<DialogTitle>Criar Categoria</DialogTitle>
										<DialogDescription>
											Digite o nome ou escolha uma sugestão abaixo.
										</DialogDescription>
									</DialogHeader>
									<div className="py-4 relative">
										<Label>Nome da Categoria</Label>
										<Input
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
											placeholder="Ex: Carnes"
											autoFocus
										/>
										{catSuggestions.length > 0 && (
											<div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
												{catSuggestions.map((s, i) => (
													<button
														key={s}
														type="button"
														className={`w-full text-left px-3 py-2 text-sm transition-colors ${
															i === catSuggestionIndex
																? "bg-emerald-500/20 text-emerald-300"
																: "hover:bg-white/5 text-white"
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
									<DialogFooter>
										<Button type="submit" disabled={!newCatName.trim()}>
											Criar
										</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
					</div>
				)}
								</div>
									<div className="relative">
										<Label>Nome do Produto</Label>
										<Input
											value={newItemName}
											onChange={(e) => setNewItemName(e.target.value)}
											placeholder="Ex: Carne do Sol"
											className={
												itemSuggestion
													? "border-amber-500 ring-amber-500/30"
													: ""
											}
										/>
										{itemSuggestion && (
											<div className="flex items-center gap-1.5 mt-1.5">
												<span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
													{itemSuggestion.message}
												</span>
												<button
													type="button"
													onClick={() => {
														setNewItemName(itemSuggestion.name);
														setItemSuggestion(null);
														setUnitSuggestion(null);
													}}
													className="text-[10px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded-full transition-colors"
												>
													Usar este
												</button>
											</div>
										)}
									</div>
										<div className="grid grid-cols-3 gap-3">
											<div>
												<Label>Estoque Inicial</Label>
												<Input
													type="number"
													value={newItemInitialStock}
													onChange={(e) => setNewItemInitialStock(e.target.value)}
													placeholder="0"
												/>
											</div>
											<div>
												<Label>Estoque Mínimo</Label>
												<Input
													type="number"
													value={newItemMinStock}
													onChange={(e) => setNewItemMinStock(e.target.value)}
													placeholder="1"
												/>
											</div>
											<div>
												<Label>Unidade de Medida</Label>
												<Select
													value={newItemUnit}
													onValueChange={(v) => { setNewItemUnit(v); setUnitSuggestion(null); }}
												>
													<SelectTrigger className={unitSuggestion ? "border-orange-500" : ""}>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{KNOWN_UNITS.map(
															(u) => (
																<SelectItem key={u} value={u}>
																	{u} — {UNIT_LABELS[u]}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
												{unitSuggestion && (
													<div className="flex items-center gap-1.5 mt-1.5">
														<span className="text-[10px] text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
															Sugerido: {unitSuggestion.unit}
														</span>
														<button
															type="button"
															onClick={() => {
																setNewItemUnit(unitSuggestion.unit);
																setUnitSuggestion(null);
															}}
															className="text-[10px] font-bold text-orange-300 bg-orange-500/20 hover:bg-orange-500/30 px-2 py-0.5 rounded-full transition-colors"
														>
															Usar
														</button>
													</div>
												)}
											</div>
										</div>
									</div>
									<DialogFooter>
									<Button
										type="submit"
										disabled={!newItemName.trim() || !newItemCatId}
									>
										Adicionar
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				)}
			</div>

			{/* Loading */}
			{loading ? (
				<div className="flex items-center justify-center py-20">
					<Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
				</div>
			) : allItems.length === 0 ? (
				<div className="text-center py-20 max-w-md mx-auto">
					<Package className="h-16 w-16 mx-auto mb-6 opacity-20" />
					<h2 className="text-2xl font-black mb-2">Estoque vazio</h2>
					<p className="text-muted-foreground mb-2">
						Crie sua primeira categoria e adicione insumos para começar a
						controlar o estoque.
					</p>
					<p className="text-sm text-muted-foreground/70 mb-8">
						Ou carregue nossa lista completa de categorias e insumos padrão
						para restaurantes.
					</p>
					{isAdmin && (
						<div className="flex gap-3 justify-center">
							<Button
								size="lg"
								onClick={handleSeedDefault}
								disabled={seeding}
							>
								<Database
									className={cn("mr-2 h-5 w-5", seeding && "animate-spin")}
								/>
								{seeding ? "Carregando..." : "Carregar Padrão"}
							</Button>
							<Button
								size="lg"
								variant="outline"
								onClick={() => setCatDialogOpen(true)}
							>
								<FolderPlus className="mr-2 h-5 w-5" /> Criar Categoria
							</Button>
						</div>
					)}
					{!isAdmin && (
						<p className="text-sm text-muted-foreground">
							Peça ao administrador para configurar o estoque.
						</p>
					)}
				</div>
			) : (
				<div className="space-y-8">
					{groups.map((group) => {
						const filtered = group.items.filter((i) =>
							!search || i.item_name.toLowerCase().includes(search.toLowerCase())
						);
						if (filtered.length === 0 && search) return null;
						if (activeCategory && group.id !== activeCategory) return null;
						return (
							<section key={group.id} className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Box className="h-5 w-5 text-emerald-500" />
										<h2 className="text-xl font-black uppercase tracking-tight text-white">{group.name}</h2>
										<span className="text-xs font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
											{filtered.length} {filtered.length === 1 ? "item" : "itens"}
										</span>
									</div>
									{isAdmin && (
										<Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setColumnDialogTarget(group.id)}>
											<Settings2 className="w-3.5 h-3.5 mr-1" /> Colunas
										</Button>
									)}
									{isAdmin && (
										<p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
											{visibleColumns.length} colunas ativas
										</p>
									)}
								</div>

								<div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
									<table className="w-full text-sm">
										<thead>
											<tr className="bg-white/5 border-b border-white/5">
												{COLUMN_DEFS.map((col) => {
													if (col.admin && !isAdmin) return null;
													if (!visibleColumns.includes(col.id)) return null;
													return (
														<th key={col.id} className={`text-left p-4 font-bold uppercase text-[10px] tracking-widest text-slate-400 whitespace-nowrap ${col.id === "acoes" ? "text-right" : ""}`}>{col.label}</th>
													);
												})}
											</tr>
										</thead>
										<tbody>
											{filtered.length === 0 ? (
												<tr>
													<td colSpan={COLUMN_DEFS.filter((c) => { if (c.admin && !isAdmin) return false; return visibleColumns.includes(c.id); }).length} className="p-8 text-center text-slate-500">
														Nenhum item nesta categoria.
													</td>
												</tr>
											) : (
												filtered.map((item, idx) => {
													const status = getStockStatus(item);
													const isExpiring = item.expires_at && (() => {
														const diff = new Date(item.expires_at!).getTime() - Date.now();
														return diff >= 0 && diff <= EXPIRY_SOON_DAYS * 86400000;
													})();
													return (
														<motion.tr
															key={item.catalog_item_id}
															initial={{ opacity: 0, y: 4 }}
															animate={{ opacity: 1, y: 0 }}
															transition={{ duration: 0.2, delay: idx * 0.02 }}
															className={cn(
																"border-b border-white/5 transition-all duration-200 hover:bg-white/[0.03]",
																isExpiring && "bg-rose-500/5",
															)}
														>
															{visibleColumns.includes("nome") && (
																<td className="p-4">
																	<div className="flex items-center gap-3">
																		<div className={cn(
																			"h-8 w-8 rounded-lg flex items-center justify-center border",
																			isExpiring
																				? "bg-rose-500/10 border-rose-500/20 text-rose-400"
																				: item.current_stock < item.min_stock
																					? "bg-amber-500/10 border-amber-500/20 text-amber-400"
																					: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
																		)}>
																			<Package className="h-4 w-4" />
																		</div>
																		<div>
																			<span className="font-bold text-white">{item.item_name}</span>
																			{isExpiring && (
																				<span className="ml-2 text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
																					Expira {format(new Date(item.expires_at!), "dd/MM", { locale: ptBR })}
																				</span>
																			)}
																		</div>
																	</div>
																</td>
															)}
															{visibleColumns.includes("estoqueAtual") && (
																<td className="p-4">
																	<span className={cn(
																		"font-black text-lg tabular-nums",
																		item.current_stock <= 0 ? "text-red-400" : item.current_stock < item.min_stock ? "text-amber-400" : "text-white",
																	)}>
																		{item.current_stock}
																	</span>
																</td>
															)}
															{visibleColumns.includes("estoqueMinimo") && (
																<td className="p-4 text-slate-400 font-semibold">{item.min_stock}</td>
															)}
															{visibleColumns.includes("unidade") && (
																<td className="p-4">
																	<span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/30 px-2 py-1 rounded">{item.unit}</span>
																</td>
															)}
															{visibleColumns.includes("status") && (
																<td className="p-4">
																	<span className={cn("inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border", status.color)}>
																		{status.label}
																	</span>
																</td>
															)}
															{visibleColumns.includes("validade") && (
																<td className="p-4">
																	<span className={cn("text-xs font-semibold", isExpiring ? "text-rose-400" : "text-slate-400")}>
																		{item.expires_at ? format(new Date(item.expires_at), "dd/MM/yyyy", { locale: ptBR }) : "Não preenchido"}
																	</span>
																</td>
															)}
															{visibleColumns.includes("responsavel") && (
																<td className="p-4">
																	<span className="text-xs text-slate-500">Não preenchido</span>
																</td>
															)}
															{customColumns.filter((col) => visibleColumns.includes(col.id)).map((col) => (
																<td key={col.id} className="p-4">
																	<span className="text-xs text-slate-400">—</span>
																</td>
															))}
															{isAdmin && visibleColumns.includes("acoes") && (
																<td className="p-4 text-right">
																	<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" onClick={() => handleDeleteItem(item)}>
																		<Trash2 className="h-4 w-4" />
																	</Button>
																</td>
															)}
														</motion.tr>
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
					{search && groups.every((g) =>
						g.items.filter((i) => i.item_name.toLowerCase().includes(search.toLowerCase())).length === 0
					) && (
						<div className="text-center py-16 text-slate-500">
							<Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
							<p className="text-lg font-medium">Nenhum resultado para "<strong>{search}</strong>"</p>
							<Button variant="link" onClick={() => { setSearch(""); setActiveCategory(null); }}>Limpar busca</Button>
						</div>
					)}

					{/* Legend */}
					{(!search || groups.some((g) =>
						g.items.filter((i) => i.item_name.toLowerCase().includes(search.toLowerCase())).length > 0
					)) && (
						<div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/5">
							<span>{allItems.length} itens no total</span>
							<div className="flex gap-3">
								<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Saudável</span>
								<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Baixo</span>
								<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Vencendo</span>
								<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Crítico</span>
							</div>
						</div>
					)}
				</div>
			)}

			{/* ─── COLUMN VISIBILITY DIALOG ─── */}
			<Dialog open={showColumnModal} onOpenChange={setShowColumnModal}>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Sessões / Colunas</DialogTitle>
						<DialogDescription>
							Escolha quais colunas exibir na tabela. Colunas padrão não podem ser excluídas.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2 py-2">
						{COLUMN_DEFS.map((col) => {
							if (col.admin && !isAdmin) return null;
							const isVisible = visibleColumns.includes(col.id);
							const isBuiltin = col.builtin || col.always;
							return (
								<label
									key={col.id}
									className={cn(
										"flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
										isVisible
											? "border-emerald-500/30 bg-emerald-500/5"
											: "border-white/5 bg-slate-900/40 hover:bg-slate-800/40",
									)}
								>
									<div className="flex items-center gap-3">
										<div className={cn(
											"w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
											isVisible ? "bg-emerald-500 border-emerald-500" : "border-slate-600",
										)}>
											{isVisible && (
												<svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
												</svg>
											)}
										</div>
										<span className="text-sm font-bold text-white">{col.label}</span>
										{isBuiltin && (
											<span className="text-[9px] font-bold text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded uppercase">Padrão</span>
										)}
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="sm"
											className={cn("h-7 text-[11px] font-bold uppercase tracking-wider", isVisible ? "text-emerald-400" : "text-slate-500")}
											onClick={(e) => { e.preventDefault(); toggleColumn(col.id); }}
										>
											{isVisible ? "Visível" : "Oculto"}
										</Button>
										{!isBuiltin && (
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
												onClick={(e) => { e.preventDefault(); deleteCustomColumn(col.id); }}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										)}
									</div>
								</label>
							);
						})}
					</div>

					{/* Nova coluna personalizada */}
					<div className="pt-4 border-t border-white/5">
						<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nova Coluna Personalizada</Label>
						<div className="flex gap-2">
							<Input
								placeholder="Nome da coluna (ex: Fornecedor)"
								value={newCustomColName}
								onChange={(e) => setNewCustomColName(e.target.value)}
								onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomColumn(); } }}
								className="flex-1 bg-slate-900/40 border-white/5"
							/>
							<Button
								onClick={addCustomColumn}
								disabled={!newCustomColName.trim()}
								size="sm"
								className="shrink-0"
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
						<p className="text-[10px] text-slate-500 mt-1">Colunas personalizadas são sempre do tipo texto.</p>
					</div>
				</DialogContent>
			</Dialog>

			{/* Custom Columns Dialog */}
			<Dialog
				open={!!columnDialogTarget}
				onOpenChange={(open) => {
					if (!open) setColumnDialogTarget(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Gerenciar Colunas</DialogTitle>
						<DialogDescription>
							Adicione ou remova colunas personalizadas para esta categoria.
							{columnDialogTarget &&
								(() => {
									const group = groups.find((g) => g.id === columnDialogTarget);
									return group ? ` Categoria: ${group.name}` : "";
								})()}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label className="text-xs font-bold uppercase tracking-wider">
								Colunas atuais
							</Label>
							{columnDialogTarget &&
								(() => {
									const group = groups.find((g) => g.id === columnDialogTarget);
									if (!group || group.columns.length === 0) {
										return (
											<p className="text-sm text-muted-foreground">
												Nenhuma coluna extra ainda.
											</p>
										);
									}
									return (
										<div className="space-y-2">
											{group.columns.map((col) => (
												<div
													key={col.id}
													className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
												>
													<div className="flex items-center gap-2">
														<GripVertical className="h-4 w-4 text-muted-foreground" />
														<span className="text-sm font-medium">
															{col.name}
														</span>
														<span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
															{col.type}
														</span>
													</div>
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-muted-foreground hover:text-red-500"
														onClick={() => handleRemoveColumn(col.id)}
													>
														<X className="h-3.5 w-3.5" />
													</Button>
												</div>
											))}
										</div>
									);
								})()}
						</div>

						<div className="border-t pt-4">
							<Label className="text-xs font-bold uppercase tracking-wider mb-2 block">
								Nova coluna
							</Label>
							<div className="flex gap-2 items-end">
								<div className="flex-1">
									<Input
										placeholder="Nome da coluna (ex: Fornecedor)"
										value={columnName}
										onChange={(e) => setColumnName(e.target.value)}
									/>
								</div>
								<div className="w-28">
									<Select value={columnType} onValueChange={setColumnType}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="text">Texto</SelectItem>
											<SelectItem value="number">Número</SelectItem>
											<SelectItem value="date">Data</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<Button
									onClick={handleAddColumn}
									disabled={!columnName.trim()}
									size="sm"
								>
									<Plus className="h-4 w-4 mr-1" /> Add
								</Button>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
