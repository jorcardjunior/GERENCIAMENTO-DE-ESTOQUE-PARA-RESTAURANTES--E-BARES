"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Plus, Trash2, Search, ShieldOff, Package } from "lucide-react";
import { isBefore, addDays, parseISO } from "date-fns";

type Responsible = { id: number; name: string } | null;
type Item = {
  id: number;
  name: string;
  unit: string;
  minStock: string;
  currentQuantity: string;
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

export default function GestaoPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [newItem, setNewItem] = useState<{ categoryId: number | null; name: string; unit: string; minStock: string }>({
    categoryId: null,
    name: "",
    unit: "kg",
    minStock: "0",
  });

  const loadData = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldOff className="w-16 h-16 text-[#dc2626] mb-4" />
        <h2 className="text-2xl font-bold text-[#0f172a]">Acesso Restrito</h2>
        <p className="text-[#64748b] mt-2">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim() }),
    });
    if (res.ok) {
      toast.success("Categoria adicionada");
      setNewCatName("");
      setShowNewCat(false);
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
    if (!newItem.categoryId || !newItem.name.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: newItem.categoryId,
        name: newItem.name.trim(),
        unit: newItem.unit,
        minStock: newItem.minStock,
        _action: "item",
      }),
    });

    await fetch(`/api/items/${0}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newItem.name.trim(),
        unit: newItem.unit,
        minStock: newItem.minStock,
        categoryId: newItem.categoryId,
      }),
    });

    const itemRes = await fetch("/api/categories");
    const data = await itemRes.json();
    const cat = data.find((c: any) => c.id === newItem.categoryId);
    if (cat) {
      const existing = cat.items.find((i: any) => i.name === newItem.name.trim());
      if (!existing) {
        const res2 = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `_item:${newItem.categoryId}:${newItem.name.trim()}:${newItem.unit}:${newItem.minStock}`,
          }),
        });
        if (!res2.ok) {
          toast.error("Erro ao adicionar item");
          return;
        }
      }
    }

    toast.success("Item adicionado");
    setNewItem({ categoryId: null, name: "", unit: "kg", minStock: "0" });
    loadData();
  }

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0 || !search);

  function isExpiringSoon(dateStr: string | null) {
    if (!dateStr) return false;
    const date = parseISO(dateStr);
    const tomorrow = addDays(new Date(), 1);
    return isBefore(date, tomorrow);
  }

  function isLowStock(qty: string, min: string) {
    return Number(qty) < Number(min);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a]">Gestão de Estoque</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewCat(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Adicionar Categoria
          </button>
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
        <input
          type="text"
          placeholder="Buscar itens..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
        />
      </div>

      {showNewCat && (
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Nome da categoria"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            autoFocus
          />
          <button
            onClick={addCategory}
            className="px-4 py-2 bg-[#16a34a] text-white rounded-lg hover:bg-[#15803d] transition-colors text-sm font-medium"
          >
            Salvar
          </button>
          <button
            onClick={() => { setShowNewCat(false); setNewCatName(""); }}
            className="px-4 py-2 bg-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#cbd5e1] transition-colors text-sm"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6 p-4 bg-white rounded-lg border border-[#e2e8f0]">
        <select
          value={newItem.categoryId ?? ""}
          onChange={(e) => setNewItem({ ...newItem, categoryId: Number(e.target.value) || null })}
          className="px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        >
          <option value="">Selecione categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Nome do item"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          className="flex-1 px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
        <select
          value={newItem.unit}
          onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
          className="px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        >
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="L">L</option>
          <option value="mL">mL</option>
          <option value="un">un</option>
          <option value="cx">cx</option>
          <option value="pct">pct</option>
        </select>
        <input
          type="number"
          placeholder="Est. mín"
          value={newItem.minStock}
          onChange={(e) => setNewItem({ ...newItem, minStock: e.target.value })}
          className="w-24 px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
        <button
          onClick={addItem}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Adicionar Item
        </button>
      </div>

      <div className="space-y-6">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#f8fafc] border-b border-[#e2e8f0]">
              <h2 className="text-lg font-semibold text-[#0f172a]">{cat.name}</h2>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="p-1.5 text-[#dc2626] hover:bg-[#fef2f2] rounded-lg transition-colors"
                title="Excluir categoria"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b] text-left">
                    <th className="px-6 py-3 font-medium">Nome</th>
                    <th className="px-6 py-3 font-medium">Unidade</th>
                    <th className="px-6 py-3 font-medium">Est. Mín</th>
                    <th className="px-6 py-3 font-medium">Qtd Atual</th>
                    <th className="px-6 py-3 font-medium">Data Contagem</th>
                    <th className="px-6 py-3 font-medium">Validade</th>
                    <th className="px-6 py-3 font-medium">Responsável</th>
                    <th className="px-6 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {cat.items.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-t border-[#e2e8f0] hover:bg-[#f8fafc] ${
                        isExpiringSoon(item.expiryDate) ? "bg-red-50" : ""
                      }`}
                    >
                      <td className={`px-6 py-3 font-medium text-[#0f172a] ${
                        isExpiringSoon(item.expiryDate) ? "text-red-600" : ""
                      }`}>
                        {item.name}
                      </td>
                      <td className="px-6 py-3 text-[#64748b]">{item.unit}</td>
                      <td className="px-6 py-3 text-[#64748b]">{item.minStock}</td>
                      <td className={`px-6 py-3 font-medium ${
                        isLowStock(item.currentQuantity, item.minStock)
                          ? "bg-yellow-100 text-yellow-800"
                          : "text-[#0f172a]"
                      }`}>
                        {item.currentQuantity}
                      </td>
                      <td className="px-6 py-3 text-[#64748b]">{item.countDate || "-"}</td>
                      <td className={`px-6 py-3 ${
                        isExpiringSoon(item.expiryDate) ? "text-red-600 font-medium" : "text-[#64748b]"
                      }`}>
                        {item.expiryDate || "-"}
                      </td>
                      <td className="px-6 py-3 text-[#64748b]">{item.responsible?.name || "-"}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1 text-[#dc2626] hover:bg-[#fef2f2] rounded transition-colors"
                          title="Excluir item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-[#64748b]">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum item encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
