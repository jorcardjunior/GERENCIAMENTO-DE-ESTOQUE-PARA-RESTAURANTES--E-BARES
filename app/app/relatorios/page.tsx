"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  FileDown, Package, AlertTriangle, Clock, BarChart3,
  Loader2, Download, Table as TableIcon,
} from "lucide-react";

type Responsible = { id: number; name: string } | null;
type Item = {
  id: number; name: string; unit: string; minStock: string;
  currentQuantity: string; unitPrice: string | null;
  countDate: string | null; expiryDate: string | null;
  responsibleUser: number | null; responsible: Responsible;
};
type Category = { id: number; name: string; color: string; items: Item[] };

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isExpiringSoon(dateStr: string | null, days = 7) {
  if (!dateStr) return false;
  const date = new Date(dateStr + "T23:59:59");
  const diff = date.getTime() - Date.now();
  return diff >= 0 && diff <= days * 86400000;
}

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ alert_expiry_days: "7", alert_low_stock_pct: "10" });
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [catRes, settingsRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/settings"),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (settingsRes.ok) setSettings(await settingsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const allItems = useMemo(() => categories.flatMap((c) => c.items), [categories]);
  const expiryDays = Number(settings.alert_expiry_days) || 7;
  const lowStockPct = Number(settings.alert_low_stock_pct) || 10;
  const lowStockMultiplier = 1 + lowStockPct / 100;

  const stats = useMemo(() => ({
    totalItens: allItems.length,
    totalCategorias: categories.length,
    estoqueTotal: allItems.reduce((s, i) => s + Number(i.currentQuantity), 0),
    valorEstoque: allItems.reduce((s, i) => {
      const price = Number(i.unitPrice);
      return s + (price > 0 ? price * Number(i.currentQuantity) : 0);
    }, 0),
    estoqueBaixo: allItems.filter((i) => Number(i.currentQuantity) <= Number(i.minStock) * lowStockMultiplier).length,
    proximoVencimento: allItems.filter((i) => isExpiringSoon(i.expiryDate, expiryDays)).length,
    itensCriticos: allItems.filter((i) => Number(i.currentQuantity) <= 0).length,
  }), [allItems, lowStockMultiplier, expiryDays]);

  function exportCSV() {
    setExporting(true);
    try {
      const headers = [
        "Categoria", "Item", "Unidade", "Quantidade", "Estoque Minimo",
        "Valor Unitario (R$)", "Valor Total (R$)", "Validade", "Responsavel", "Status",
      ];
      const rows = allItems.map((item) => {
        const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
        const qty = Number(item.currentQuantity);
        const min = Number(item.minStock);
        const price = Number(item.unitPrice);
        const totalValue = price > 0 ? price * qty : 0;
        const expiring = isExpiringSoon(item.expiryDate, expiryDays);
        const low = qty <= min * lowStockMultiplier;
        const critical = qty <= 0;
        let status = "Saudavel";
        if (critical) status = "Critico";
        else if (expiring) status = "Vencendo";
        else if (low) status = "Baixo";
        return [
          cat?.name || "", item.name, item.unit, item.currentQuantity, item.minStock,
          price > 0 ? price.toFixed(2) : "", totalValue > 0 ? totalValue.toFixed(2) : "",
          item.expiryDate || "", item.responsible?.name || "",
          status,
        ];
      });
      const csvContent = [
        headers.join(";"),
        ...rows.map((r) => r.join(";")),
      ].join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estoque_relatorio_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Relatorio exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar");
    } finally {
      setExporting(false);
    }
  }

  function exportLowStockCSV() {
    setExporting(true);
    try {
      const lowItems = allItems.filter((i) => Number(i.currentQuantity) <= Number(i.minStock) * lowStockMultiplier);
      const headers = ["Categoria", "Item", "Unidade", "Quantidade", "Estoque Minimo", "Status"];
      const rows = lowItems.map((item) => {
        const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
        const qty = Number(item.currentQuantity);
        const status = qty <= 0 ? "Critico" : "Baixo";
        return [cat?.name || "", item.name, item.unit, item.currentQuantity, item.minStock, status];
      });
      const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estoque_baixo_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Relatorio exportado!");
    } catch {
      toast.error("Erro ao exportar");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-[#0f172a]">Relatorios</h1>
          <p className="text-[#64748b] text-sm">Visualize e exporte dados do estoque.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Total de Itens", value: stats.totalItens, icon: Package, color: "text-blue-600 bg-blue-100" },
          { title: "Valor em Estoque", value: formatCurrency(stats.valorEstoque), icon: BarChart3, color: "text-violet-600 bg-violet-100" },
          { title: "Estoque Baixo", value: stats.estoqueBaixo, icon: AlertTriangle, color: "text-amber-600 bg-amber-100" },
          { title: "Prox. Vencimento", value: stats.proximoVencimento, icon: Clock, color: "text-rose-600 bg-rose-100" },
        ].map((s) => (
          <div key={s.title} className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-lg p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.15em]">{s.title}</p>
              <div className={`p-2 rounded-xl ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black tracking-tighter tabular-nums text-[#0f172a]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <button onClick={exportCSV} disabled={exporting || allItems.length === 0}
          className="flex items-center gap-2 px-5 py-3 bg-[#2563eb] text-white rounded-xl hover:bg-[#1d4ed8] transition-all text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar Estoque Completo (CSV)
        </button>
        <button onClick={exportLowStockCSV} disabled={exporting || stats.estoqueBaixo === 0}
          className="flex items-center gap-2 px-5 py-3 bg-[#ea580c] text-white rounded-xl hover:bg-[#c2410c] transition-all text-sm font-bold shadow-lg shadow-orange-500/20 disabled:opacity-50">
          <FileDown className="w-4 h-4" />
          Exportar Estoque Baixo (CSV)
        </button>
      </div>

      {/* Tabela de Itens */}
      {allItems.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-20 text-[#64748b]" />
          <p className="text-[#64748b]">Nenhum item cadastrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-lg overflow-hidden">
          <div className="p-4 border-b border-[#e2e8f0] flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-[#2563eb]" />
            <span className="text-sm font-black uppercase tracking-wider text-[#0f172a]">Detalhamento do Estoque</span>
            <span className="text-xs text-[#94a3b8] ml-auto">{allItems.length} itens</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8fafc] border-b-2 border-[#e2e8f0]">
                  <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-[#64748b]">Categoria</th>
                  <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-[#64748b]">Item</th>
                  <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-[#64748b]">Qtd</th>
                  <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-[#64748b]">Min</th>
                  <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-[#64748b]">Un</th>
                  <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-[#64748b]">Valor Un.</th>
                  <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-[#64748b]">Valor Total</th>
                  <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-[#64748b]">Validade</th>
                  <th className="text-left p-3 font-bold uppercase text-[10px] tracking-widest text-[#64748b]">Responsavel</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item) => {
                  const cat = categories.find((c) => c.items.some((i) => i.id === item.id));
                  const qty = Number(item.currentQuantity);
                  const price = Number(item.unitPrice);
                  const totalValue = price > 0 ? price * qty : 0;
                  const min = Number(item.minStock);
                  const low = qty <= min * lowStockMultiplier;
                  const critical = qty <= 0;
                  const expiring = isExpiringSoon(item.expiryDate, expiryDays);
                  const rowBg = critical ? "bg-red-50" : expiring ? "bg-rose-50" : low ? "bg-amber-50" : "";
                  return (
                    <tr key={item.id} className={`border-b border-[#e2e8f0] hover:bg-[#f8fafc] transition-all ${rowBg}`}>
                      <td className="p-3 text-[#64748b]">{cat?.name || "—"}</td>
                      <td className="p-3 font-bold text-[#0f172a]">{item.name}</td>
                      <td className={`p-3 font-black tabular-nums ${critical ? "text-red-600" : low ? "text-amber-600" : "text-emerald-600"}`}>{item.currentQuantity}</td>
                      <td className="p-3 text-[#64748b]">{item.minStock}</td>
                      <td className="p-3"><span className="text-[10px] font-black text-[#64748b] uppercase bg-slate-100 px-2 py-0.5 rounded">{item.unit}</span></td>
                      <td className="p-3 font-semibold tabular-nums">{price > 0 ? formatCurrency(price) : "—"}</td>
                      <td className="p-3 font-black tabular-nums">{totalValue > 0 ? formatCurrency(totalValue) : "—"}</td>
                      <td className={`p-3 text-xs font-semibold ${expiring ? "text-rose-600" : "text-[#64748b]"}`}>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="p-3 text-[#64748b]">{item.responsible?.name || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}