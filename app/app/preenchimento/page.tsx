"use client";

import { ROLE_LABELS, useAuth } from "@/hooks/use-auth";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Package,
  Save,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
type Category = {
  id: number;
  name: string;
  items: Item[];
};

export default function PreenchimentoPage() {
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCatId, setSelectedCatId] = useState<number | "">("");
  const [selectedItemId, setSelectedItemId] = useState<number | "">("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<{ name: string; total: number; low: boolean } | null>(
    null,
  );

  const filteredItems = categories
    .filter((c) => !selectedCatId || c.id === selectedCatId)
    .flatMap((c) => c.items);

  const selectedItem =
    categories.flatMap((c) => c.items).find((i) => i.id === selectedItemId) || null;

  const currentStock = Number(selectedItem?.currentQuantity ?? 0);
  const minStock = Number(selectedItem?.minStock ?? 0);

  const getStockStatus = (stock: number, min: number) => {
    if (stock <= 0) return { label: "Crítico", color: "text-status-danger-text bg-status-danger-bg border-status-danger-border" };
    if (stock < min)
      return { label: "Baixo", color: "text-status-warning-text bg-status-warning-bg border-status-warning-border" };
    return { label: "Saudável", color: "text-status-success-text bg-status-success-bg border-status-success-border" };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, _userRes] = await Promise.all([fetch("/api/categories"), fetch("/api/users")]);
      if (catRes.ok) setCategories(await catRes.json());
      if (!catRes.ok) throw new Error("Erro ao carregar categorias");
    } catch (err: any) {
      toast.error(`Erro ao carregar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedItem) {
      setQuantity(selectedItem.currentQuantity);
    }
  }, [selectedItem]);

  const handleRegister = async () => {
    if (!selectedItemId || !quantity) {
      toast.error("Selecione um item e informe a quantidade.");
      return;
    }
    const qty = Number.parseFloat(quantity);
    if (Number.isNaN(qty) || qty < 0) {
      toast.error("Quantidade inválida.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/items/${selectedItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentQuantity: String(qty),
          expiryDate: expiryDate || null,
          countDate: new Date().toISOString().split("T")[0],
          responsibleUser: user?.id || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao registrar");
      }
      setSummary({ name: selectedItem?.name ?? "", total: 1, low: qty < minStock });
      toast.success(`${selectedItem?.name} registrado com sucesso!`);
      await loadData();
      setQuantity("");
      setExpiryDate("");
      setSelectedItemId("");
      setSelectedCatId("");
    } catch (err: any) {
      toast.error(`Erro ao registrar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const status = selectedItem ? getStockStatus(currentStock, minStock) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-text">Preenchimento de Estoque</h1>
        <p className="text-text-secondary text-sm mt-1">
          Registre contagens, entradas e data de vencimento dos itens.
        </p>
      </header>

      {/* Summary Banner */}
      {summary && (
        <div className="rounded-xl border border-status-success-border bg-status-success-bg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-status-success-text shrink-0" />
          <p className="text-sm font-medium text-text">
            <strong>{summary.name}</strong> registrado com sucesso.
            {summary.low && (
              <span className="text-amber-600 ml-2 inline-flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Abaixo do estoque mínimo.
              </span>
            )}
          </p>
          <button
            onClick={() => setSummary(null)}
            className="ml-auto text-xs font-medium text-text-secondary hover:text-text px-2 py-1 rounded hover:bg-surface/50 transition-colors"
          >
            OK
          </button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── MAIN CARD: Registrar Estoque ─── */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-600/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">Registrar Estoque</h2>
              <p className="text-sm text-text-secondary">
                Selecione o item e informe a quantidade atual
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Categoria</label>
              <select
                value={selectedCatId}
                onChange={(e) => {
                  setSelectedCatId(e.target.value ? Number(e.target.value) : "");
                  setSelectedItemId("");
                }}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              >
                <option value="">Selecione a categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Item */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Item</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : "")}
                disabled={!selectedCatId}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent disabled:bg-disabled-bg disabled:text-disabled-text"
              >
                <option value="">
                  {selectedCatId ? "Selecione o item" : "Escolha uma categoria primeiro"}
                </option>
                {filteredItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantidade + Unidade */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Quantidade</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!selectedItemId}
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent disabled:bg-disabled-bg disabled:text-disabled-text"
                />
                <div className="w-20 shrink-0">
                  <select
                    value={selectedItem?.unit || "un"}
                    disabled
                    className="w-full px-2 py-2 border border-border rounded-lg text-sm bg-surface-secondary text-text-secondary cursor-not-allowed"
                  >
                    <option value={selectedItem?.unit || "un"}>{selectedItem?.unit || "un"}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Data de Vencimento <span className="text-text-tertiary font-normal">(opcional)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={!selectedItemId}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent disabled:bg-disabled-bg disabled:text-disabled-text"
              />
              <p className="text-xs text-text-tertiary mt-1">
                Deixe em branco se o item não tem data de vencimento.
              </p>
            </div>
          </div>

          {/* Registrar Button */}
          <button
            onClick={handleRegister}
            disabled={!selectedItemId || !quantity || saving}
            className="w-full h-11 rounded-lg font-bold text-sm text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Registrar Estoque
          </button>
        </div>

        {/* ─── RIGHT SIDE CARDS ─── */}
        <div className="space-y-4">
          {/* Card: Informações do Item */}
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-brand-600" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Informações do Item
              </h3>
            </div>
            {selectedItem ? (
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Nome</p>
                  <p className="text-sm font-semibold text-text">{selectedItem.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Unidade</p>
                    <p className="text-sm font-semibold text-text">{selectedItem.unit}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
                      Est. Mínimo
                    </p>
                    <p className="text-sm font-semibold text-text">{minStock}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
                    Valor Unidade
                  </p>
                  <p className="text-sm font-semibold text-text">
                    {selectedItem.unitPrice && Number(selectedItem.unitPrice) > 0
                      ? Number(selectedItem.unitPrice).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      : "Não preenchido"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
                    Estoque Atual
                  </p>
                  <p
                    className={`text-2xl font-bold tabular-nums ${
                      currentStock <= 0
                        ? "text-red-600"
                        : currentStock < minStock
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {currentStock}
                  </p>
                </div>
                {status && (
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
                      Status
                    </p>
                    <span
                      className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary italic">Nenhum item selecionado.</p>
            )}
          </div>

          {/* Card: Responsável */}
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-brand-600" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Responsável
              </h3>
            </div>
            <p className="text-sm font-semibold text-text">
              {user?.name || user?.email || "—"}
            </p>
            {user?.role && (
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
                {ROLE_LABELS[user.role] || user.role}
              </p>
            )}
          </div>

          {/* Card: Dicas Importantes */}
          <div className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Dicas Importantes
              </h3>
            </div>
            <ul className="space-y-2.5">
              <li className="flex gap-2 text-xs text-text-secondary">
                <span className="text-brand-600 shrink-0 mt-0.5">•</span>
                <span>Confira sempre a unidade de medida antes de inserir a quantidade.</span>
              </li>
              <li className="flex gap-2 text-xs text-text-secondary">
                <span className="text-brand-600 shrink-0 mt-0.5">•</span>
                <span>
                  A data de vencimento é opcional, mas é recomendada para controle de qualidade e
                  segurança.
                </span>
              </li>
              <li className="flex gap-2 text-xs text-text-secondary">
                <span className="text-brand-600 shrink-0 mt-0.5">•</span>
                <span>
                  Este registro substituirá o registro atual do item — o valor anterior será
                  sobrescrito.
                </span>
              </li>
              <li className="flex gap-2 text-xs text-text-secondary">
                <span className="text-brand-600 shrink-0 mt-0.5">•</span>
                <span>
                  Se o item não aparecer na lista, cadastre-o primeiro na página "Gestão de
                  Estoque".
                </span>
              </li>
              <li className="flex gap-2 text-xs text-text-secondary">
                <span className="text-brand-600 shrink-0 mt-0.5">•</span>
                <span>
                  Itens com quantidade abaixo do mínimo serão destacados como "Baixo" no painel
                  principal.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
