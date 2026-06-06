import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Package, Save, Loader2, Box, User, Lightbulb, AlertTriangle, CheckCircle2, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/preenchimento")({
  component: PreenchimentoEstoque,
});

type CatalogItem = {
  id: string;
  name: string;
  unit_default: string;
  category_id: string;
  inventory_items: {
    id: string;
    current_stock: number;
    min_stock: number;
    unit: string;
    item_batches: { id: string; expires_at: string | null }[];
  }[];
};

function PreenchimentoEstoque() {
  const { profile } = useAuth();

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCatId, setSelectedCatId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("un");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<{ total: number; low: number; expiring: number } | null>(null);

  const filteredItems = catalogItems.filter(
    (i) => !selectedCatId || i.category_id === selectedCatId,
  );

  const selectedItem = catalogItems.find((i) => i.id === selectedItemId);
  const inv = selectedItem?.inventory_items?.[0];
  const currentStock = inv?.current_stock ?? 0;
  const minStock = inv?.min_stock ?? 0;

  const getStockStatus = (stock: number, min: number) => {
    if (stock <= 0) return { label: "Crítico", color: "text-red-500 bg-red-500/10 border-red-500/30" };
    if (stock < min) return { label: "Baixo", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" };
    return { label: "Saudável", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("catalog_items").select(`
          id, name, unit_default, category_id,
          inventory_items(id, current_stock, min_stock, unit,
            item_batches(id, expires_at)
          )
        `).order("name"),
      ]);

      if (catsRes.error) throw catsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setCategories(catsRes.data || []);
      setCatalogItems(itemsRes.data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (selectedItem) {
      setUnit(selectedItem.unit_default || "un");
    }
  }, [selectedItem]);

  const handleRegister = async () => {
    if (!selectedItemId || !quantity) {
      toast.error("Selecione um item e informe a quantidade.");
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) {
      toast.error("Quantidade inválida.");
      return;
    }
    setSaving(true);
    const today = new Date().toISOString();

    try {
      if (inv?.id) {
        const { error } = await supabase
          .from("inventory_items")
          .update({ current_stock: qty, updated_at: today } as any)
          .eq("id", inv.id);
        if (error) throw error;

        if (expiryDate) {
          const batchId = inv.item_batches?.[0]?.id;
          if (batchId) {
            await supabase
              .from("item_batches")
              .update({ expires_at: expiryDate, updated_at: today })
              .eq("id", batchId);
          } else {
            await supabase.from("item_batches").insert({
              inventory_item_id: inv.id,
              qty_current: qty,
              expires_at: expiryDate,
              batch_code: "LOTE-" + Date.now(),
            });
          }
        }
      } else {
        const { data: newInv, error: invErr } = await supabase
          .from("inventory_items")
          .insert({
            catalog_item_id: selectedItemId,
            name: selectedItem!.name,
            unit: unit,
            current_stock: qty,
            min_stock: 1,
          } as any)
          .select()
          .single();
        if (invErr) throw invErr;

        if (expiryDate) {
          await supabase.from("item_batches").insert({
            inventory_item_id: newInv.id,
            qty_current: qty,
            expires_at: expiryDate,
            batch_code: "LOTE-" + Date.now(),
          });
        }
      }

      setSummary({ total: 1, low: qty < minStock ? 1 : 0, expiring: 0 });
      toast.success(`${selectedItem!.name} registrado com sucesso!`);

      await fetchData();
      setQuantity("");
      setExpiryDate("");
    } catch (err: any) {
      toast.error("Erro ao registrar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const status = selectedItem ? getStockStatus(currentStock, minStock) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Preenchimento de Estoque</h1>
        <p className="text-muted-foreground">Registre contagens, entradas e data de vencimento dos itens.</p>
      </header>

      {/* Summary Banner */}
      {summary && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-medium">
            <strong>{summary.total}</strong> {summary.total === 1 ? "item registrado" : "itens registrados"}.
            {summary.low > 0 && (
              <span className="text-amber-500 ml-2">
                <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
                Abaixo do estoque mínimo.
              </span>
            )}
          </p>
          <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setSummary(null)}>OK</Button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── LEFT CARD: Registrar Estoque ─── */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Registrar Estoque</h2>
              <p className="text-sm text-muted-foreground">Selecione o item e informe a quantidade atual</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Categoria</label>
              <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSelectedItemId(""); }}>
                <SelectTrigger className="bg-slate-900/40 border-white/5">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Item */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Item</label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId} disabled={!selectedCatId}>
                <SelectTrigger className="bg-slate-900/40 border-white/5">
                  <SelectValue placeholder={selectedCatId ? "Selecione o item" : "Escolha uma categoria primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredItems.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantidade + Unidade */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Quantidade</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!selectedItemId}
                  className="flex-1 bg-slate-900/40 border-white/5 h-10 text-lg font-black tabular-nums"
                />
                <div className="w-20">
                  <Select value={unit} onValueChange={setUnit} disabled>
                    <SelectTrigger className="bg-slate-900/40 border-white/5 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={unit}>{unit}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Data de Vencimento <span className="text-slate-600 font-normal normal-case">(opcional)</span></label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={!selectedItemId}
                className="bg-slate-900/40 border-white/5 h-10"
              />
              <p className="text-[10px] text-slate-500 mt-1">Deixe em branco se o item não tem data de vencimento.</p>
            </div>
          </div>

          {/* Registrar Button */}
          <Button
            onClick={handleRegister}
            disabled={!selectedItemId || !quantity || saving}
            className="w-full h-12 rounded-xl font-bold text-base bg-orange-600 hover:bg-orange-700 disabled:opacity-40 shadow-lg shadow-orange-600/20"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Registrar Estoque
          </Button>
        </div>

        {/* ─── RIGHT SIDE CARDS ─── */}
        <div className="space-y-4">

          {/* Card: Informações do Item */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Informações do Item</h3>
            </div>
            {selectedItem ? (
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Nome</p>
                  <p className="text-sm font-bold text-white">{selectedItem.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Unidade</p>
                    <p className="text-sm font-bold text-white">{unit}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Mínimo</p>
                    <p className="text-sm font-bold text-white">{minStock}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Estoque Atual</p>
                  <p className={cn(
                    "text-2xl font-black tabular-nums",
                    currentStock <= 0 ? "text-red-400" : currentStock < minStock ? "text-amber-400" : "text-emerald-400",
                  )}>
                    {currentStock}
                  </p>
                </div>
                {status && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</p>
                    <span className={cn("inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border", status.color)}>
                      {status.label}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Nenhum item selecionado.</p>
            )}
          </div>

          {/* Card: Responsável */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Responsável</h3>
            </div>
            <p className="text-sm font-bold text-white">{profile?.name || profile?.email || "—"}</p>
            {profile?.role && (
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{profile.role === "admin" ? "Administrador" : "Funcionário"}</p>
            )}
          </div>

          {/* Card: Dicas Importantes */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Dicas Importantes</h3>
            </div>
            <ul className="space-y-2.5">
              <li className="flex gap-2 text-xs text-slate-400">
                <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                <span>Confira sempre a unidade de medida antes de inserir a quantidade.</span>
              </li>
              <li className="flex gap-2 text-xs text-slate-400">
                <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                <span>A data de vencimento é opcional, mas é recomendada para controle de qualidade e segurança.</span>
              </li>
              <li className="flex gap-2 text-xs text-slate-400">
                <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                <span>Este registro substituirá o registro atual do item — o valor anterior será sobrescrito.</span>
              </li>
              <li className="flex gap-2 text-xs text-slate-400">
                <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                <span>Se o item não aparecer na lista, cadastre-o primeiro na página "Gestão de Estoque".</span>
              </li>
              <li className="flex gap-2 text-xs text-slate-400">
                <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                <span>Itens com quantidade abaixo do mínimo serão destacados como "Baixo" no painel principal.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Footer action */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => { fetchData(); setSummary(null); }}>
          <RotateCcw className="mr-2 h-4 w-4" /> Descartar alterações
        </Button>
      </div>
    </div>
  );
}
