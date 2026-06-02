import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Save, RotateCcw, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const Route = createFileRoute("/app/preenchimento")({
  component: PreenchimentoEstoque,
});

type EditRow = {
  inventory_id: string;
  catalog_item_id: string;
  item_name: string;
  unit: string;
  min_stock: number;
  current_stock: number;
  expires_at: string | null;
  batch_id: string | null;
  isNew: boolean;
  custom_fields: Record<string, string>;
};

function PreenchimentoEstoque() {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<EditRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<{ total: number; low: number; expiring: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const [columnsByCat, setColumnsByCat] = useState<Record<string, any[]>>({});
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    const el = inputRefs.current[index];
    if (el) {
      el.focus();
      if (el.type === "number") el.select();
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number, total: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const dir = e.shiftKey ? -1 : 1;
      let next = index + dir;
      if (next < 0) next = total - 1;
      if (next >= total) next = 0;
      focusInput(next);
    }
  }, [focusInput]);

  const registerInput = useCallback((el: HTMLInputElement | null, index: number) => {
    inputRefs.current[index] = el;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, items, cols] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("catalog_items").select(`
          id, name, unit_default, category_id,
          inventory_items(
            id, current_stock, min_stock, unit, updated_at, custom_fields,
            item_batches(id, qty_current, expires_at)
          )
        `).order("name"),
        (supabase as any).from("custom_columns").select("*").order("display_order"),
      ]);

      if (cats.error) throw cats.error;
      if (items.error) throw items.error;

      setCategories(cats.data || []);

      const colsByCat: Record<string, any[]> = {};
      for (const col of (cols.data || []) as any[]) {
        const catId = col.category_id || "";
        if (!colsByCat[catId]) colsByCat[catId] = [];
        colsByCat[catId].push(col);
      }
      setColumnsByCat(colsByCat);

      const mapped: EditRow[] = (items.data || []).map((ci: any) => {
        const inv = ci.inventory_items?.[0];
        const batch = inv?.item_batches?.[0];
        return {
          inventory_id: inv?.id || "",
          catalog_item_id: ci.id,
          item_name: ci.name,
          unit: inv?.unit || ci.unit_default || "un",
          min_stock: inv?.min_stock ?? 1,
          current_stock: inv?.current_stock ?? 0,
          expires_at: batch?.expires_at || "",
          batch_id: batch?.id || null,
          isNew: !inv || !batch,
          custom_fields: inv?.custom_fields || {},
        };
      });

      setRows(mapped);
      setSummary(null);
    } catch (err: any) {
      toast.error("Erro ao carregar: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [catItemMap, setCatItemMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCatalogCategories = async () => {
      const { data } = await supabase.from("catalog_items").select("id, category_id");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((ci: any) => { map[ci.id] = ci.category_id; });
        setCatItemMap(map);
      }
    };
    fetchCatalogCategories();
  }, []);

  const displayRows = rows.filter(r => {
    if (categoryFilter !== "all") {
      return catItemMap[r.catalog_item_id] === categoryFilter;
    }
    return true;
  }).filter(r => search ? r.item_name.toLowerCase().includes(search.toLowerCase()) : true);

  const getColsForRow = (row: EditRow) => {
    const catId = catItemMap[row.catalog_item_id] || "";
    return columnsByCat[catId] || [];
  };

  const updateQty = (catalogItemId: string, value: string) => {
    const num = parseFloat(value);
    setRows(prev => prev.map(r =>
      r.catalog_item_id === catalogItemId ? { ...r, current_stock: isNaN(num) ? 0 : num } : r
    ));
  };

  const updateExpiry = (catalogItemId: string, value: string) => {
    setRows(prev => prev.map(r =>
      r.catalog_item_id === catalogItemId ? { ...r, expires_at: value || null } : r
    ));
  };

  const updateCustomField = (catalogItemId: string, colId: string, value: string) => {
    setRows(prev => prev.map(r =>
      r.catalog_item_id === catalogItemId
        ? { ...r, custom_fields: { ...r.custom_fields, [colId]: value } }
        : r
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    let updated = 0;
    let lowCount = 0;
    let expiringCount = 0;

    try {
      const today = new Date().toISOString();

      for (const row of displayRows) {
        const changed = rows.find(r => r.catalog_item_id === row.catalog_item_id);
        if (!changed) continue;

        if (changed.current_stock < changed.min_stock) lowCount++;
        if (changed.expires_at) {
          const diff = new Date(changed.expires_at).getTime() - Date.now();
          if (diff >= 0 && diff < 86400000) expiringCount++;
        }

        if (row.inventory_id) {
          const { error } = await supabase
            .from("inventory_items")
            .update({
              current_stock: changed.current_stock,
              updated_at: today,
              custom_fields: changed.custom_fields,
            } as any)
            .eq("id", row.inventory_id);
          if (error) throw error;

          if (changed.expires_at) {
            if (row.batch_id) {
              await supabase
                .from("item_batches")
                .update({ expires_at: changed.expires_at, updated_at: today })
                .eq("id", row.batch_id);
            } else {
              const { data: newBatch } = await supabase
                .from("item_batches")
                .insert({
                  inventory_item_id: row.inventory_id,
                  qty_current: changed.current_stock,
                  expires_at: changed.expires_at,
                  batch_code: "LOTE-" + Date.now(),
                })
                .select()
                .single();
              if (newBatch) {
                setRows(prev => prev.map(r =>
                  r.catalog_item_id === row.catalog_item_id
                    ? { ...r, batch_id: newBatch.id, isNew: false }
                    : r
                ));
              }
            }
          }
        } else {
          const { data: inv, error: invErr } = await supabase
            .from("inventory_items")
            .insert({
              catalog_item_id: row.catalog_item_id,
              name: row.item_name,
              unit: row.unit,
              current_stock: changed.current_stock,
              min_stock: changed.min_stock,
              custom_fields: changed.custom_fields,
            } as any)
            .select()
            .single();
          if (invErr) throw invErr;

          if (changed.expires_at) {
            await supabase.from("item_batches").insert({
              inventory_item_id: inv.id,
              qty_current: changed.current_stock,
              expires_at: changed.expires_at,
              batch_code: "LOTE-" + Date.now(),
            });
          }

          setRows(prev => prev.map(r =>
            r.catalog_item_id === row.catalog_item_id
              ? { ...r, inventory_id: inv.id }
              : r
          ));
        }
        updated++;
      }

      setSummary({ total: updated, low: lowCount, expiring: expiringCount });
      toast.success(`${updated} itens salvos com sucesso!`);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    fetchData();
    setSummary(null);
    toast.info("Alterações descartadas.");
  };

  const isExpiring = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff >= 0 && diff < 86400000;
  };

  const lowStock = (qty: number, min: number) => qty < min;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Preenchimento de Estoque</h1>
          <p className="text-muted-foreground">Insira rapidamente as quantidades e validades dos produtos.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDiscard}>
            <RotateCcw className="mr-2 h-4 w-4" /> Descartar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {summary && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-medium">
            Foram atualizados <strong>{summary.total}</strong> itens.
            {summary.low > 0 && (
              <span className="text-yellow-600 ml-2">
                <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
                {summary.low} {summary.low === 1 ? "está abaixo" : "estão abaixo"} do estoque mínimo.
              </span>
            )}
            {summary.expiring > 0 && (
              <span className="text-red-600 ml-2">
                {summary.expiring} {summary.expiring === 1 ? "item próximo" : "itens próximos"} do vencimento.
              </span>
            )}
          </p>
          <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setSummary(null)}>
            OK
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Produto</th>
              <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Unidade</th>
              <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Est. Mínimo</th>
              <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Qtd Atual</th>
              <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Data</th>
              <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Validade</th>
              {displayRows.length > 0 && getColsForRow(displayRows[0]).map((col: any) => (
                <th key={col.id} className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap text-emerald-600">
                  {col.name}
                </th>
              ))}
              <th className="text-left p-3 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={99} className="p-10 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              displayRows.map((row, idx) => {
                const expiring = isExpiring(row.expires_at);
                const low = lowStock(row.current_stock, row.min_stock);
                const cols = getColsForRow(row);
                let colIndex = 0;
                const totalEditable = 2 + cols.length;

                return (
                  <tr
                    key={row.catalog_item_id}
                    className={cn(
                      "border-b border-border/50 transition-colors",
                      expiring ? "bg-red-50 dark:bg-red-950/30" : idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                    )}
                  >
                    <td className="p-3 font-semibold whitespace-nowrap">{row.item_name}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{row.unit}</td>
                    <td className="p-3 whitespace-nowrap">{row.min_stock}</td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={row.current_stock}
                        onChange={e => updateQty(row.catalog_item_id, e.target.value)}
                        onKeyDown={e => {
                          const total = displayRows.length * totalEditable;
                          handleKeyDown(e, idx * totalEditable + 0, total);
                        }}
                        ref={el => registerInput(el, idx * totalEditable + 0)}
                        inputMode="decimal"
                        className={cn(
                          "h-12 w-full min-w-[5rem] text-center font-bold border-2 text-base",
                          low
                            ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
                            : "border-blue-200 dark:border-blue-800 focus:border-blue-400"
                        )}
                      />
                      {low && <p className="text-[10px] text-yellow-600 mt-1">Abaixo do mínimo</p>}
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(), "dd/MM/yyyy")}
                    </td>
                    <td className="p-3" style={{ minWidth: '140px' }}>
                      <Input
                        type="date"
                        value={row.expires_at?.split("T")[0] || ""}
                        onChange={e => updateExpiry(row.catalog_item_id, e.target.value)}
                        onKeyDown={e => {
                          const total = displayRows.length * totalEditable;
                          handleKeyDown(e, idx * totalEditable + 1, total);
                        }}
                        ref={el => registerInput(el, idx * totalEditable + 1)}
                        className={cn(
                          "h-12 w-full min-w-[8rem] border-2 text-base",
                          expiring
                            ? "border-red-400 bg-red-50 dark:bg-red-950/20"
                            : "border-blue-200 dark:border-blue-800 focus:border-blue-400"
                        )}
                      />
                      {expiring && <p className="text-[10px] text-red-600 mt-1">Vence amanhã!</p>}
                    </td>
                    {cols.map((col: any, ci: number) => (
                      <td key={col.id} className="p-3">
                        <Input
                          type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
                          value={row.custom_fields?.[col.id] || ""}
                          onChange={e => updateCustomField(row.catalog_item_id, col.id, e.target.value)}
                          onKeyDown={e => {
                            const total = displayRows.length * totalEditable;
                            handleKeyDown(e, idx * totalEditable + 2 + ci, total);
                          }}
                          ref={el => registerInput(el, idx * totalEditable + 2 + ci)}
                          placeholder={col.name}
                          className={cn(
                            "h-12 w-full min-w-[6rem] border-2 text-base",
                            "border-blue-200 dark:border-blue-800 focus:border-blue-400"
                          )}
                        />
                      </td>
                    ))}
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{profile?.name || profile?.email || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {displayRows.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {displayRows.length} {displayRows.length === 1 ? "produto" : "produtos"} — Use Tab/Enter para navegar entre células
        </div>
      )}
    </div>
  );
}
