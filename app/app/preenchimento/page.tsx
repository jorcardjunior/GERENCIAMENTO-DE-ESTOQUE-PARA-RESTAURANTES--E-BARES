"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Search, Save, X } from "lucide-react";

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

type ItemChange = {
  id: number;
  currentQuantity: string;
  expiryDate: string;
  countDate: string;
  responsibleUser: number;
};

export default function PreenchimentoPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<number | "all">("all");
  const [changes, setChanges] = useState<Record<number, ItemChange>>({});
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  const loadData = useCallback(async () => {
    const [catRes, userRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/users"),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (userRes.ok) setUsers(await userRes.json());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function todayStr() {
    return new Date().toISOString().split("T")[0];
  }

  function initChange(item: Item): ItemChange {
    return {
      id: item.id,
      currentQuantity: item.currentQuantity,
      expiryDate: item.expiryDate || "",
      countDate: item.countDate || todayStr(),
      responsibleUser: item.responsibleUser || user?.id || 0,
    };
  }

  function getChange(item: Item): ItemChange {
    return changes[item.id] || initChange(item);
  }

  function updateChange(itemId: number, field: keyof ItemChange, value: string | number) {
    setChanges((prev) => {
      const item = categories.flatMap((c) => c.items).find((i) => i.id === itemId);
      if (!item) return prev;
      const current = prev[itemId] || initChange(item);
      return { ...prev, [itemId]: { ...current, [field]: value } };
    });
  }

  function hasChanges(item: Item): boolean {
    const c = changes[item.id];
    if (!c) return false;
    return (
      c.currentQuantity !== item.currentQuantity ||
      c.expiryDate !== (item.expiryDate || "") ||
      c.countDate !== (item.countDate || todayStr()) ||
      c.responsibleUser !== (item.responsibleUser || user?.id || 0)
    );
  }

  const filteredItems = categories
    .filter((cat) => filterCat === "all" || cat.id === filterCat)
    .flatMap((cat) => cat.items)
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  function handleKeyDown(e: React.KeyboardEvent, itemId: number, field: string) {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const fields = ["currentQuantity", "expiryDate", "countDate", "responsibleUser"];
      const currentIdx = fields.indexOf(field);
      const nextField = fields[currentIdx + 1];
      if (nextField) {
        const nextInput = inputRefs.current[`${itemId}-${nextField}`];
        nextInput?.focus();
      } else {
        const items = filteredItems;
        const currentItemIdx = items.findIndex((i) => i.id === itemId);
        const nextItem = items[currentItemIdx + 1];
        if (nextItem) {
          const nextInput = inputRefs.current[`${nextItem.id}-currentQuantity`];
          nextInput?.focus();
        }
      }
    }
  }

  async function saveAll() {
    setSaving(true);
    const changedItems = Object.values(changes).filter((c) => {
      const item = categories.flatMap((cat) => cat.items).find((i) => i.id === c.id);
      return item && hasChanges(item);
    });

    if (changedItems.length === 0) {
      toast.info("Nenhuma alteração para salvar");
      setSaving(false);
      return;
    }

    let success = 0;
    let errors = 0;

    for (const change of changedItems) {
      const res = await fetch(`/api/items/${change.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentQuantity: change.currentQuantity,
          expiryDate: change.expiryDate || null,
          countDate: change.countDate,
          responsibleUser: change.responsibleUser,
        }),
      });
      if (res.ok) success++;
      else errors++;
    }

    if (errors === 0) {
      toast.success(`${success} item(ns) atualizado(s) com sucesso!`);
    } else {
      toast.error(`${success} salvo(s), ${errors} erro(s)`);
    }

    setChanges({});
    loadData();
    setSaving(false);
  }

  function discardAll() {
    setChanges({});
    toast.info("Alterações descartadas");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a]">Preenchimento de Estoque</h1>
        <div className="flex gap-2">
          <button
            onClick={discardAll}
            className="flex items-center gap-2 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f1f5f9] transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" /> Descartar
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg hover:bg-[#15803d] transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        >
          <option value="all">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] text-[#64748b] text-left">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Unidade</th>
                <th className="px-4 py-3 font-medium">Est. Mín</th>
                <th className="px-4 py-3 font-medium">Qtd Atual</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Validade</th>
                <th className="px-4 py-3 font-medium">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const change = getChange(item);
                const modified = hasChanges(item);
                return (
                  <tr
                    key={item.id}
                    className={`border-t border-[#e2e8f0] hover:bg-[#f8fafc] ${
                      modified ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-[#0f172a]">{item.name}</td>
                    <td className="px-4 py-2.5 text-[#64748b]">{item.unit}</td>
                    <td className="px-4 py-2.5 text-[#64748b]">{item.minStock}</td>
                    <td className="px-4 py-2.5">
                      <input
                        ref={(el) => { inputRefs.current[`${item.id}-currentQuantity`] = el; }}
                        type="number"
                        step="0.01"
                        value={change.currentQuantity}
                        onChange={(e) => updateChange(item.id, "currentQuantity", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, item.id, "currentQuantity")}
                        className={`w-20 px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${
                          Number(change.currentQuantity) < Number(item.minStock)
                            ? "border-yellow-400 bg-yellow-50"
                            : "border-[#e2e8f0]"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        ref={(el) => { inputRefs.current[`${item.id}-countDate`] = el; }}
                        type="date"
                        value={change.countDate}
                        onChange={(e) => updateChange(item.id, "countDate", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, item.id, "countDate")}
                        className="w-36 px-2 py-1.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        ref={(el) => { inputRefs.current[`${item.id}-expiryDate`] = el; }}
                        type="date"
                        value={change.expiryDate}
                        onChange={(e) => updateChange(item.id, "expiryDate", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, item.id, "expiryDate")}
                        className="w-36 px-2 py-1.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        ref={(el) => { inputRefs.current[`${item.id}-responsibleUser`] = el; }}
                        value={change.responsibleUser}
                        onChange={(e) => updateChange(item.id, "responsibleUser", Number(e.target.value))}
                        onKeyDown={(e) => handleKeyDown(e, item.id, "responsibleUser")}
                        className="px-2 py-1.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      >
                        <option value={0}>Selecione</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-[#64748b]">
            Nenhum item encontrado
          </div>
        )}
      </div>

      {Object.keys(changes).length > 0 && (
        <div className="mt-4 text-sm text-[#64748b]">
          {Object.values(changes).filter((c) => {
            const item = categories.flatMap((cat) => cat.items).find((i) => i.id === c.id);
            return item && hasChanges(item);
          }).length} item(ns) modificado(s)
        </div>
      )}
    </div>
  );
}
