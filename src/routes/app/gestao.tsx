import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Package, Plus, Trash2, AlertTriangle, Loader2, FolderPlus, Search, Settings2, GripVertical, X, Database,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SEED_CATEGORIAS } from "@/data/seed-padrao";

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

function GestaoEstoque() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const userName = profile?.name || profile?.email || "Usuário";

  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [newItemCatId, setNewItemCatId] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("kg");

  const [columnDialogTarget, setColumnDialogTarget] = useState<string | null>(null);
  const [columnName, setColumnName] = useState("");
  const [columnType, setColumnType] = useState("text");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, itemRes, colRes, profileRes] = await Promise.all([
        supabase.from("categories").select("id, name, description, created_at, user_id").order("name"),
        supabase.from("catalog_items").select(`
          id, name, unit_default, category_id,
          inventory_items(
            id, current_stock, min_stock, unit, updated_at, custom_fields,
            item_batches(expires_at)
          )
        `).order("name"),
        (supabase as any).from("custom_columns").select("*").order("display_order"),
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

      const groupsMap = new Map<string, CategoryGroup>();
      for (const cat of catRes.data || []) {
        groupsMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          description: (cat as any).description || null,
          items: [],
          columns: colsByCategory[cat.id] || [],
          created_at: (cat as any).created_at || null,
          user_id: (cat as any).user_id || null,
          user_name: (cat as any).user_id ? profileMap[(cat as any).user_id] || null : null,
        });
      }

      for (const ci of itemRes.data || []) {
        const inv = (ci as any).inventory_items?.[0];
        const batch = inv?.item_batches?.[0];
        const row: ItemRow = {
          catalog_item_id: ci.id,
          inventory_id: inv?.id || "",
          item_name: ci.name,
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
    try {
      const { data: ci, error: ciErr } = await supabase
        .from("catalog_items")
        .insert({ name: newItemName.trim(), category_id: newItemCatId, unit_default: newItemUnit })
        .select()
        .single();
      if (ciErr) throw ciErr;

      const { error: invErr } = await supabase
        .from("inventory_items")
        .insert({
          catalog_item_id: ci.id,
          category_id: newItemCatId,
          name: newItemName.trim(),
          unit: newItemUnit,
          current_stock: 0,
          min_stock: 1,
        });
      if (invErr) throw invErr;

      toast.success(`"${newItemName.trim()}" adicionado!`);
      setNewItemName("");
      setItemDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const [seeding, setSeeding] = useState(false);
  const handleSeedDefault = async () => {
    if (!confirm("Carregar todas as categorias e insumos padrão? Isso pulará itens já existentes.")) return;
    setSeeding(true);
    try {
      let created = 0;
      for (const cat of SEED_CATEGORIAS) {
        const { data: newCat, error: catErr } = await supabase
          .from("categories")
          .insert({ name: cat.name, description: cat.description || null, user_id: profile?.id })
          .select()
          .single();
        if (catErr) {
          if (catErr.code === "23505") continue;
          throw catErr;
        }
        const catItems = cat.items.map(item => ({
          name: item.name,
          category_id: newCat.id,
          unit_default: item.unit,
        }));
        const { error: itemsErr } = await supabase.from("catalog_items").insert(catItems);
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
        await supabase.from("stock_movements").delete().eq("inventory_item_id", item.inventory_id);
        await supabase.from("item_batches").delete().eq("inventory_item_id", item.inventory_id);
        await supabase.from("inventory_items").delete().eq("id", item.inventory_id);
      }
      await supabase.from("catalog_items").delete().eq("id", item.catalog_item_id);
      toast.success(`"${item.item_name}" removido.`);
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    }
  };

  const handleAddColumn = async () => {
    if (!columnName.trim() || !columnDialogTarget) return;
    try {
      const group = groups.find(g => g.id === columnDialogTarget);
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
      const { error } = await (supabase as any).from("custom_columns").delete().eq("id", colId);
      if (error) throw error;
      toast.success("Coluna removida.");
      fetchData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const filteredGroups = groups
    .map(g => ({
      ...g,
      items: g.items.filter(i => i.item_name.toLowerCase().includes(search.toLowerCase())),
    }))
    .filter(g => g.items.length > 0);

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff >= 0 && diff < 86400000;
  };

  const isLowStock = (qty: number, min: number) => qty < min;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Gestão de Estoque</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Gerencie categorias, insumos e colunas personalizadas." : "Visualize o estoque do restaurante."}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={handleSeedDefault} disabled={seeding}>
              <Database className={cn("mr-2 h-4 w-4", seeding && "animate-spin")} />
              {seeding ? "Carregando..." : "Carregar Padrão"}
            </Button>
            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><FolderPlus className="mr-2 h-4 w-4" /> Nova Categoria</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={e => { e.preventDefault(); handleCreateCategory(); }}>
                  <DialogHeader>
                    <DialogTitle>Criar Categoria</DialogTitle>
                    <DialogDescription>Ex: Proteínas, Laticínios, Bebidas, etc.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label>Nome da Categoria</Label>
                    <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ex: Proteínas" autoFocus />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={!newCatName.trim()}>Criar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
              <DialogContent>
                <form onSubmit={e => { e.preventDefault(); handleCreateItem(); }}>
                  <DialogHeader>
                    <DialogTitle>Adicionar Insumo</DialogTitle>
                    <DialogDescription>Adicione um novo produto ao estoque.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={newItemCatId} onValueChange={setNewItemCatId}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nome do Produto</Label>
                      <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Ex: Carne do Sol" />
                    </div>
                    <div>
                      <Label>Unidade de Medida</Label>
                      <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["kg", "g", "L", "mL", "un", "cx", "pct", "dz"].map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={!newItemName.trim() || !newItemCatId}>Adicionar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </header>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 max-w-md mx-auto">
          <Package className="h-16 w-16 mx-auto mb-6 opacity-20" />
          <h2 className="text-2xl font-black mb-2">Estoque vazio</h2>
          <p className="text-muted-foreground mb-2">Crie sua primeira categoria e adicione insumos para começar a controlar o estoque.</p>
          <p className="text-sm text-muted-foreground/70 mb-8">Ou carregue nossa lista completa de categorias e insumos padrão para restaurantes.</p>
          {isAdmin && (
            <div className="flex gap-3 justify-center">
              <Button size="lg" onClick={handleSeedDefault} disabled={seeding}>
                <Database className={cn("mr-2 h-5 w-5", seeding && "animate-spin")} />
                {seeding ? "Carregando..." : "Carregar Padrão"}
              </Button>
              <Button size="lg" variant="outline" onClick={() => setCatDialogOpen(true)}>
                <FolderPlus className="mr-2 h-5 w-5" /> Criar Categoria
              </Button>
            </div>
          )}
          {!isAdmin && <p className="text-sm text-muted-foreground">Peça ao administrador para configurar o estoque.</p>}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum resultado para "<strong>{search}</strong>"</p>
          <Button variant="link" onClick={() => setSearch("")}>Limpar busca</Button>
        </div>
      ) : (
        <div className="space-y-10">
          <Dialog open={!!columnDialogTarget} onOpenChange={(open) => { if (!open) setColumnDialogTarget(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerenciar Colunas</DialogTitle>
                <DialogDescription>
                  Adicione ou remova colunas personalizadas para esta categoria.
                  {columnDialogTarget && (() => {
                    const group = groups.find(g => g.id === columnDialogTarget);
                    return group ? ` Categoria: ${group.name}` : "";
                  })()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider">Colunas atuais</Label>
                  {columnDialogTarget && (() => {
                    const group = groups.find(g => g.id === columnDialogTarget);
                    if (!group || group.columns.length === 0) {
                      return <p className="text-sm text-muted-foreground">Nenhuma coluna extra ainda.</p>;
                    }
                    return (
                      <div className="space-y-2">
                        {group.columns.map(col => (
                          <div key={col.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{col.name}</span>
                              <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{col.type}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500"
                              onClick={() => handleRemoveColumn(col.id)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="border-t pt-4">
                  <Label className="text-xs font-bold uppercase tracking-wider mb-2 block">Nova coluna</Label>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        placeholder="Nome da coluna (ex: Fornecedor)"
                        value={columnName}
                        onChange={e => setColumnName(e.target.value)}
                      />
                    </div>
                    <div className="w-28">
                      <Select value={columnType} onValueChange={setColumnType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="number">Número</SelectItem>
                          <SelectItem value="date">Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddColumn} disabled={!columnName.trim()} size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {filteredGroups.map(group => (
            <motion.section
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <h2 className="text-xl font-black uppercase tracking-tight leading-tight">
                    {group.name}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">({group.items.length})</span>
                  </h2>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    {group.user_name ? `criado por ${group.user_name}` : group.user_id ? "criado" : ""}
                    {group.created_at ? ` em ${format(new Date(group.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}` : ""}
                    {group.description && !group.user_name && !group.created_at ? group.description : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {isAdmin && group.columns.length > 0 && (
                    <span className="text-[10px] text-muted-foreground self-center bg-muted/50 px-2 py-1 rounded">
                      +{group.columns.length} cols
                    </span>
                  )}
                  {isAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setColumnDialogTarget(group.id);
                          setColumnName("");
                        }}
                        title="Gerenciar colunas"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNewItemCatId(group.id);
                          setItemDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar Item
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Produto</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Unidade</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Est. Mínimo</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Qtd Atual</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Data Contagem</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Validade</th>
                      <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Responsável</th>
                      {group.columns.map(col => (
                        <th key={col.id} className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap text-emerald-600">
                          {col.name}
                        </th>
                      ))}
                      {isAdmin && <th className="text-right p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.length === 0 ? (
                      <tr>
                        <td colSpan={7 + group.columns.length + (isAdmin ? 1 : 0)} className="p-8 text-center text-muted-foreground">
                          Nenhum insumo nesta categoria ainda.
                          {isAdmin && (
                            <Button variant="link" size="sm" onClick={() => {
                              setNewItemCatId(group.id);
                              setItemDialogOpen(true);
                            }}>
                              Adicionar o primeiro
                            </Button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      group.items.map((item, idx) => {
                        const lowStock = isLowStock(item.current_stock, item.min_stock);
                        const expiring = isExpiringSoon(item.expires_at);
                        return (
                          <tr
                            key={item.catalog_item_id}
                            className={cn(
                              "border-b border-border/50 transition-colors",
                              expiring ? "bg-red-50 dark:bg-red-950/30" : idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                            )}
                          >
                            <td className="p-3 font-semibold whitespace-nowrap">{item.item_name}</td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">{item.unit}</td>
                            <td className="p-3 whitespace-nowrap">{item.min_stock}</td>
                            <td className={cn("p-3 font-bold whitespace-nowrap", lowStock && "text-yellow-600 dark:text-yellow-400")}>
                              {item.current_stock}
                              {lowStock && <AlertTriangle className="inline h-3 w-3 ml-1 text-yellow-500" />}
                            </td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                              {item.updated_at
                                ? format(new Date(item.updated_at), "dd/MM/yyyy", { locale: ptBR })
                                : "—"}
                            </td>
                            <td className={cn("p-3 whitespace-nowrap", expiring && "text-red-600 dark:text-red-400 font-bold")}>
                              {item.expires_at
                                ? format(new Date(item.expires_at), "dd/MM/yyyy", { locale: ptBR })
                                : "—"}
                            </td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">{userName}</td>
                            {group.columns.map(col => (
                              <td key={col.id} className="p-3 text-muted-foreground whitespace-nowrap">
                                {item.custom_fields?.[col.id] || "—"}
                              </td>
                            ))}
                            {isAdmin && (
                              <td className="p-3 text-right whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                  onClick={() => handleDeleteItem(item)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}
