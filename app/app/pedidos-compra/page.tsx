"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  Eye,
  FileText,
  Pencil,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Estabelecimento = { id: string; nome: string };
type Supplier = { id: string; name: string };
type CatalogItem = { id: string; name: string; unitDefault: string };
type PedidoItem = {
  id: string;
  pedidoCompraId: string;
  catalogItemId: string | null;
  itemNome: string;
  quantidade: string;
  unidade: string;
  quantidadeRecebida: string | null;
  valorUnitario: string | null;
  observacao: string | null;
  catalogItemNome?: string | null;
};
type Pedido = {
  id: string;
  estabelecimentoId: string;
  supplierId: string | null;
  fornecedorNome: string | null;
  numeroPedido: string | null;
  status: string;
  dataPedido: string | null;
  dataPrevista: string | null;
  dataRecebimento: string | null;
  valorTotal: string | null;
  observacao: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  estabelecimentoNome?: string | null;
  supplierNome?: string | null;
  itemsCount?: number;
  estabelecimento?: Estabelecimento | null;
  supplier?: Supplier | null;
  itens?: PedidoItem[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> =
  {
    rascunho: {
      label: "Rascunho",
      color: "text-text-secondary",
      bg: "bg-surface-tertiary",
      border: "border-border",
    },
    enviado: {
      label: "Enviado",
      color: "text-status-info-text",
      bg: "bg-status-info-bg",
      border: "border-status-info-text/30",
    },
    recebido_parcial: {
      label: "Recebido Parcial",
      color: "text-status-warning-text",
      bg: "bg-status-warning-bg",
      border: "border-status-warning-text/30",
    },
    recebido: {
      label: "Recebido",
      color: "text-status-success-text",
      bg: "bg-status-success-bg",
      border: "border-status-success-text/30",
    },
    cancelado: {
      label: "Cancelado",
      color: "text-status-danger-text",
      bg: "bg-status-danger-bg",
      border: "border-status-danger-text/30",
    },
  };

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.rascunho;
  return (
    <span
      className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border-2 ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}

function formatCurrency(val: string | number | null) {
  const n = Number(val) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + (dateStr.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("pt-BR");
}

export default function PedidosCompraPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [estabFilter, setEstabFilter] = useState("");
  const [viewMode, setViewMode] = useState<"lista" | "kanban">("lista");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [selectedPedidoItens, setSelectedPedidoItens] = useState<PedidoItem[]>([]);
  const [detailPedido, setDetailPedido] = useState<Pedido | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [formData, setFormData] = useState({
    estabelecimentoId: "",
    supplierId: "",
    fornecedorNome: "",
    numeroPedido: "",
    dataPedido: new Date().toISOString().split("T")[0],
    dataPrevista: "",
    observacao: "",
  });

  const [newItemForm, setNewItemForm] = useState({
    catalogItemId: "",
    itemNome: "",
    quantidade: "1",
    unidade: "un",
    valorUnitario: "0",
    observacao: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pedidosRes, estabRes, suppRes, catRes] = await Promise.all([
        fetch("/api/pedidos-compra"),
        fetch("/api/estabelecimentos"),
        fetch("/api/suppliers"),
        fetch("/api/catalog-items"),
      ]);
      if (pedidosRes.ok) setPedidos(await pedidosRes.json());
      if (estabRes.ok) setEstabelecimentos(await estabRes.json());
      if (suppRes.ok) setSuppliers(await suppRes.json());
      if (catRes.ok) setCatalogItems(await catRes.json());
    } catch (_err: any) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPedidos = useMemo(() => {
    let result = pedidos;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.numeroPedido?.toLowerCase().includes(q) || p.fornecedorNome?.toLowerCase().includes(q),
      );
    }
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (estabFilter) {
      result = result.filter((p) => p.estabelecimentoId === estabFilter);
    }
    return result;
  }, [pedidos, search, statusFilter, estabFilter]);

  const stats = useMemo(() => {
    const total = pedidos.length;
    const rascunhos = pedidos.filter((p) => p.status === "rascunho").length;
    const enviados = pedidos.filter((p) => p.status === "enviado").length;
    const recebidos = pedidos.filter((p) => p.status === "recebido").length;
    const valorTotal = pedidos.reduce((s, p) => s + (Number(p.valorTotal) || 0), 0);
    return { total, rascunhos, enviados, recebidos, valorTotal };
  }, [pedidos]);

  async function openCreateModal() {
    setEditMode(false);
    setSelectedPedido(null);
    setSelectedPedidoItens([]);
    setFormData({
      estabelecimentoId: "",
      supplierId: "",
      fornecedorNome: "",
      numeroPedido: "",
      dataPedido: new Date().toISOString().split("T")[0],
      dataPrevista: "",
      observacao: "",
    });
    setNewItemForm({
      catalogItemId: "",
      itemNome: "",
      quantidade: "1",
      unidade: "un",
      valorUnitario: "0",
      observacao: "",
    });
    setShowModal(true);
  }

  async function openEditModal(pedido: Pedido) {
    setEditMode(true);
    setSelectedPedido(pedido);
    setFormData({
      estabelecimentoId: pedido.estabelecimentoId,
      supplierId: pedido.supplierId || "",
      fornecedorNome: pedido.fornecedorNome || "",
      numeroPedido: pedido.numeroPedido || "",
      dataPedido: pedido.dataPedido || "",
      dataPrevista: pedido.dataPrevista || "",
      observacao: pedido.observacao || "",
    });

    try {
      const res = await fetch(`/api/pedidos-compra/${pedido.id}/itens`);
      if (res.ok) {
        const itens = await res.json();
        setSelectedPedidoItens(itens);
      } else {
        setSelectedPedidoItens([]);
      }
    } catch {
      setSelectedPedidoItens([]);
    }

    setNewItemForm({
      catalogItemId: "",
      itemNome: "",
      quantidade: "1",
      unidade: "un",
      valorUnitario: "0",
      observacao: "",
    });
    setShowModal(true);
  }

  async function savePedido() {
    if (!formData.estabelecimentoId) {
      toast.error("Selecione um estabelecimento");
      return;
    }

    const url =
      editMode && selectedPedido
        ? `/api/pedidos-compra/${selectedPedido.id}`
        : "/api/pedidos-compra";
    const method = editMode && selectedPedido ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar pedido");
      }

      toast.success(editMode ? "Pedido atualizado" : "Pedido criado");
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function addItemToPedido() {
    if (!selectedPedido) return;
    if (!newItemForm.itemNome || !newItemForm.quantidade || !newItemForm.unidade) {
      toast.error("Preencha nome, quantidade e unidade do item");
      return;
    }

    try {
      const res = await fetch(`/api/pedidos-compra/${selectedPedido.id}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItemForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao adicionar item");
      }

      toast.success("Item adicionado");
      setNewItemForm({
        catalogItemId: "",
        itemNome: "",
        quantidade: "1",
        unidade: "un",
        valorUnitario: "0",
        observacao: "",
      });

      const itensRes = await fetch(`/api/pedidos-compra/${selectedPedido.id}/itens`);
      if (itensRes.ok) setSelectedPedidoItens(await itensRes.json());
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function deletePedido(id: string) {
    if (!confirm("Excluir este pedido de compra permanentemente?")) return;
    try {
      const res = await fetch(`/api/pedidos-compra/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir");
      }
      toast.success("Pedido excluído");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/pedidos-compra/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar status");
      }
      toast.success(`Status alterado para ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function openDetail(pedido: Pedido) {
    try {
      const res = await fetch(`/api/pedidos-compra/${pedido.id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailPedido(data);
        setShowDetail(true);
      }
    } catch {
      toast.error("Erro ao carregar detalhes");
    }
  }

  function getAvailableActions(status: string) {
    switch (status) {
      case "rascunho":
        return [
          {
            label: "Enviar",
            nextStatus: "enviado",
            icon: Send,
            color: "text-blue-600 hover:bg-blue-50",
            confirm: "Enviar pedido?",
          },
        ];
      case "enviado":
        return [
          {
            label: "Receber Parcial",
            nextStatus: "recebido_parcial",
            icon: FileText,
            color: "text-yellow-600 hover:bg-yellow-50",
            confirm: "Marcar como recebido parcial?",
          },
          {
            label: "Receber Completo",
            nextStatus: "recebido",
            icon: CheckCircle,
            color: "text-green-600 hover:bg-green-50",
            confirm: "Confirmar recebimento completo?",
          },
          {
            label: "Cancelar",
            nextStatus: "cancelado",
            icon: AlertCircle,
            color: "text-red-600 hover:bg-red-50",
            confirm: "Cancelar pedido?",
          },
        ];
      case "recebido_parcial":
        return [
          {
            label: "Receber Completo",
            nextStatus: "recebido",
            icon: CheckCircle,
            color: "text-green-600 hover:bg-green-50",
            confirm: "Confirmar recebimento completo?",
          },
          {
            label: "Cancelar",
            nextStatus: "cancelado",
            icon: AlertCircle,
            color: "text-red-600 hover:bg-red-50",
            confirm: "Cancelar pedido?",
          },
        ];
      default:
        return [];
    }
  }

  const kanbanColumns = ["rascunho", "enviado", "recebido_parcial", "recebido", "cancelado"];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-text">
            Pedidos de Compra
          </h1>
          <p className="text-text-secondary text-sm">
            Gerencie pedidos de compra para seus estabelecimentos.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ea580c] text-white rounded-xl hover:bg-[#c2410c] transition-all text-sm font-bold shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" /> Novo Pedido
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            title: "Total Pedidos",
            value: stats.total,
            icon: ShoppingCart,
            color: "text-status-info-text bg-status-info-bg border-status-info-text/20",
          },
          {
            title: "Rascunhos",
            value: stats.rascunhos,
            icon: FileText,
            color: "text-text-secondary bg-surface-tertiary border-border",
          },
          {
            title: "Enviados",
            value: stats.enviados,
            icon: Send,
            color: "text-status-info-text bg-status-info-bg border-status-info-text/20",
          },
          {
            title: "Recebidos",
            value: stats.recebidos,
            icon: CheckCircle,
            color: "text-status-success-text bg-status-success-bg border-status-success-text/20",
          },
          {
            title: "Valor Total",
            value: stats.valorTotal,
            icon: DollarSign,
            color: "text-status-info-text bg-status-info-bg border-status-info-text/20",
            isCurrency: true,
          },
        ].map((card) => (
          <div
            key={card.title}
            className="relative group bg-surface rounded-2xl border-2 border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em]">
                    {card.title}
                  </p>
                  <div className="text-3xl font-black tracking-tighter tabular-nums text-text">
                    {"isCurrency" in card && card.isCurrency ? (
                      <span className="text-2xl">{formatCurrency(card.value as number)}</span>
                    ) : (
                      (card.value as number).toLocaleString("pt-BR")
                    )}
                  </div>
                </div>
                <div
                  className={`p-2.5 rounded-2xl border ${card.color} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
                >
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-brand-600 to-transparent opacity-40" />
          </div>
        ))}
      </div>

      {/* Filters + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar por Nº Pedido ou Fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm bg-surface"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface min-w-[140px]"
        >
          <option value="">Todos Status</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>
        <select
          value={estabFilter}
          onChange={(e) => setEstabFilter(e.target.value)}
          className="px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface min-w-[180px]"
        >
          <option value="">Todos Estabelecimentos</option>
          {estabelecimentos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
        <div className="flex bg-surface-tertiary rounded-xl p-0.5 border-2 border-border">
          <button
            onClick={() => setViewMode("lista")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "lista" ? "bg-surface text-text shadow-sm" : "text-text-secondary hover:text-text"}`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "kanban" ? "bg-surface text-text shadow-sm" : "text-text-secondary hover:text-text"}`}
          >
            Kanban
          </button>
        </div>
      </div>

      {/* ─── LIST VIEW ─── */}
      {viewMode === "lista" && (
        <div className="overflow-x-auto rounded-2xl border-2 border-border bg-surface shadow-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary border-b-2 border-border">
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary whitespace-nowrap">
                  Nº Pedido
                </th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary whitespace-nowrap">
                  Fornecedor
                </th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary whitespace-nowrap">
                  Estabelecimento
                </th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary whitespace-nowrap">
                  Data
                </th>
                <th className="text-right p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary whitespace-nowrap">
                  Valor Total
                </th>
                <th className="text-center p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary whitespace-nowrap">
                  Status
                </th>
                <th className="text-right p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary whitespace-nowrap">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-tertiary">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum pedido encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredPedidos.map((pedido, idx) => {
                  const actions = getAvailableActions(pedido.status);
                  return (
                    <tr
                      key={pedido.id}
                      className={`border-b border-border hover:bg-surface-hover transition-all ${idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary"}`}
                    >
                      <td className="p-4">
                        <span className="font-bold text-text">
                          {pedido.numeroPedido || "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-text-secondary" />
                          <span className="text-text">
                            {pedido.fornecedorNome || pedido.supplierNome || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-text-secondary" />
                          <span className="text-text">
                            {pedido.estabelecimentoNome || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-text-secondary" />
                          <span className="text-text-secondary">{formatDate(pedido.dataPedido)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-black tabular-nums text-text">
                          {formatCurrency(pedido.valorTotal)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <StatusBadge status={pedido.status} />
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetail(pedido)}
                            className="p-1.5 text-brand-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(pedido)}
                            className="p-1.5 text-status-warning-text hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {actions.map((action) => (
                            <button
                              key={action.nextStatus}
                              onClick={() => {
                                if (confirm(action.confirm))
                                  updateStatus(pedido.id, action.nextStatus);
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${action.color}`}
                              title={action.label}
                            >
                              <action.icon className="w-4 h-4" />
                            </button>
                          ))}
                          {isAdmin && (
                            <button
                              onClick={() => deletePedido(pedido.id)}
                              className="p-1.5 text-status-danger-text hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── KANBAN VIEW ─── */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {kanbanColumns.map((col) => {
            const cfg = STATUS_CONFIG[col];
            const colPedidos = filteredPedidos.filter((p) => p.status === col);
            return (
              <div key={col} className="bg-surface-secondary rounded-2xl border-2 border-border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${cfg.bg} border ${cfg.border}`} />
                    <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary">
                      {cfg.label}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
                  >
                    {colPedidos.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {colPedidos.length === 0 ? (
                    <p className="text-xs text-text-tertiary text-center py-8">Nenhum pedido</p>
                  ) : (
                    colPedidos.map((pedido) => (
                      <div
                        key={pedido.id}
                        className="bg-surface rounded-xl border-2 border-border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => openDetail(pedido)}
                      >
                        <p className="text-xs font-bold text-text mb-1">
                          {pedido.numeroPedido || "Sem nº"}
                        </p>
                        <p className="text-[10px] text-text-secondary mb-1">
                          {pedido.fornecedorNome || pedido.supplierNome || "—"}
                        </p>
                        <p className="text-[10px] text-text-secondary mb-2">
                          {pedido.estabelecimentoNome || "—"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-text-secondary">
                            {formatDate(pedido.dataPedido)}
                          </span>
                          <span className="text-[10px] font-black">
                            {formatCurrency(pedido.valorTotal)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CREATE/EDIT MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-surface rounded-2xl shadow-2xl border-2 border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-text">
                {editMode ? "Editar Pedido" : "Novo Pedido"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface-active text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Estabelecimento *
                  </label>
                  <select
                    value={formData.estabelecimentoId}
                    onChange={(e) =>
                      setFormData({ ...formData, estabelecimentoId: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  >
                    <option value="">Selecione</option>
                    {estabelecimentos.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Fornecedor
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  >
                    <option value="">Selecione</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Nome do Fornecedor
                  </label>
                  <input
                    type="text"
                    placeholder="Nome livre"
                    value={formData.fornecedorNome}
                    onChange={(e) => setFormData({ ...formData, fornecedorNome: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Nº Pedido
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PO-001"
                    value={formData.numeroPedido}
                    onChange={(e) => setFormData({ ...formData, numeroPedido: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Data do Pedido
                  </label>
                  <input
                    type="date"
                    value={formData.dataPedido}
                    onChange={(e) => setFormData({ ...formData, dataPedido: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Data Prevista
                  </label>
                  <input
                    type="date"
                    value={formData.dataPrevista}
                    onChange={(e) => setFormData({ ...formData, dataPrevista: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                  Observação
                </label>
                <textarea
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface resize-none"
                />
              </div>
            </div>

            {/* Items Section (only in edit mode) */}
            {editMode && (
              <div className="mt-6 pt-4 border-t border-border">
                <h3 className="text-sm font-black uppercase tracking-tight text-text mb-4">
                  Itens do Pedido
                </h3>

                {/* Items list */}
                {selectedPedidoItens.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-border mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-secondary border-b border-border">
                          <th className="text-left p-2.5 font-bold uppercase text-[9px] tracking-widest text-text-secondary">
                            Item
                          </th>
                          <th className="text-center p-2.5 font-bold uppercase text-[9px] tracking-widest text-text-secondary">
                            Qtd
                          </th>
                          <th className="text-center p-2.5 font-bold uppercase text-[9px] tracking-widest text-text-secondary">
                            Un
                          </th>
                          <th className="text-right p-2.5 font-bold uppercase text-[9px] tracking-widest text-text-secondary">
                            Valor Un.
                          </th>
                          <th className="text-right p-2.5 font-bold uppercase text-[9px] tracking-widest text-text-secondary">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPedidoItens.map((item) => {
                          const qtd = Number(item.quantidade) || 0;
                          const valUn = Number(item.valorUnitario) || 0;
                          const subtotal = qtd * valUn;
                          return (
                            <tr
                              key={item.id}
                              className="border-b border-border hover:bg-surface-hover"
                            >
                              <td className="p-2.5">
                                <span className="font-semibold text-text">
                                  {item.itemNome}
                                </span>
                              </td>
                              <td className="p-2.5 text-center font-semibold">{qtd}</td>
                              <td className="p-2.5 text-center">
                                <span className="text-[10px] font-bold text-text-secondary bg-surface-tertiary px-1.5 py-0.5 rounded">
                                  {item.unidade}
                                </span>
                              </td>
                              <td className="p-2.5 text-right">{formatCurrency(valUn)}</td>
                              <td className="p-2.5 text-right font-bold">
                                {formatCurrency(subtotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-surface-secondary border-t-2 border-border">
                          <td
                            colSpan={4}
                            className="p-2.5 text-right font-black text-[10px] uppercase tracking-widest text-text-secondary"
                          >
                            Total
                          </td>
                          <td className="p-2.5 text-right font-black text-text">
                            {formatCurrency(
                              selectedPedidoItens.reduce(
                                (s, item) =>
                                  s +
                                  (Number(item.quantidade) || 0) *
                                    (Number(item.valorUnitario) || 0),
                                0,
                              ),
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Add item form */}
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-text-secondary mb-1">
                      Item
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={newItemForm.catalogItemId}
                        onChange={(e) => {
                          const selected = catalogItems.find((ci) => ci.id === e.target.value);
                          setNewItemForm({
                            ...newItemForm,
                            catalogItemId: e.target.value,
                            itemNome: selected?.name || "",
                            unidade: selected?.unitDefault || newItemForm.unidade,
                          });
                        }}
                        className="flex-1 px-2 py-2 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-xs bg-surface"
                      >
                        <option value="">Catálogo</option>
                        {catalogItems.map((ci) => (
                          <option key={ci.id} value={ci.id}>
                            {ci.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Ou digite nome"
                      value={newItemForm.itemNome}
                      onChange={(e) => setNewItemForm({ ...newItemForm, itemNome: e.target.value })}
                      className="w-full px-2 py-1.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-xs bg-surface mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-text-secondary mb-1">
                      Qtd
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={newItemForm.quantidade}
                      onChange={(e) =>
                        setNewItemForm({ ...newItemForm, quantidade: e.target.value })
                      }
                      className="w-full px-2 py-2 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-xs bg-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-text-secondary mb-1">
                      Un
                    </label>
                    <input
                      type="text"
                      value={newItemForm.unidade}
                      onChange={(e) => setNewItemForm({ ...newItemForm, unidade: e.target.value })}
                      className="w-full px-2 py-2 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-xs bg-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-text-secondary mb-1">
                      Valor Un.
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newItemForm.valorUnitario}
                      onChange={(e) =>
                        setNewItemForm({ ...newItemForm, valorUnitario: e.target.value })
                      }
                      className="w-full px-2 py-2 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-xs bg-surface"
                    />
                  </div>
                  <div>
                    <button
                      onClick={addItemToPedido}
                      className="w-full px-3 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 inline mr-1" /> Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={savePedido}
                className="flex-1 px-4 py-3 bg-[#ea580c] text-white rounded-xl hover:bg-[#c2410c] transition-all text-sm font-bold shadow-lg shadow-orange-500/20"
              >
                {editMode ? "Salvar Alterações" : "Criar Pedido"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-surface-tertiary text-text-secondary rounded-xl hover:bg-surface-active transition-all text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DETAIL MODAL ─── */}
      {showDetail && detailPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetail(false)}
          />
          <div className="relative bg-surface rounded-2xl shadow-2xl border-2 border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-text">
                Pedido {detailPedido.numeroPedido || ""}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-lg hover:bg-surface-active text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  Status
                </p>
                <StatusBadge status={detailPedido.status} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  Valor Total
                </p>
                <p className="text-xl font-black text-text">
                  {formatCurrency(detailPedido.valorTotal)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  Estabelecimento
                </p>
                <p className="text-sm font-bold text-text">
                  {detailPedido.estabelecimento?.nome || detailPedido.estabelecimentoNome || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  Fornecedor
                </p>
                <p className="text-sm font-bold text-text">
                  {detailPedido.fornecedorNome ||
                    detailPedido.supplier?.name ||
                    detailPedido.supplierNome ||
                    "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  Data do Pedido
                </p>
                <p className="text-sm font-bold text-text">
                  {formatDate(detailPedido.dataPedido)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  Data Prevista
                </p>
                <p className="text-sm font-bold text-text">
                  {formatDate(detailPedido.dataPrevista)}
                </p>
              </div>
              {detailPedido.observacao && (
                <div className="col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Observação
                  </p>
                  <p className="text-sm text-text">{detailPedido.observacao}</p>
                </div>
              )}
            </div>

            {/* Items */}
            {detailPedido.itens && detailPedido.itens.length > 0 && (
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-text mb-3">
                  Itens
                </h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-border">
                        <th className="text-left p-2.5 font-bold uppercase text-[9px] tracking-widest text-text-secondary">
                          Item
                        </th>
                        <th className="text-center p-2.5 font-bold uppercase text-[9px] tracking-widest text-text-secondary">
                          Qtd
                        </th>
                        <th className="text-center p-2.5 font-bold uppercase text-[9px] tracking-widest text-text-secondary">
                          Un
                        </th>
                        <th className="text-right p-2.5 font-bold uppercase text-[9px] tracking-widest text-text-secondary">
                          Valor Un.
                        </th>
                        <th className="text-right p-2.5 font-bold uppercase text-[9px] tracking-widest text-text-secondary">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailPedido.itens.map((item) => (
                        <tr key={item.id} className="border-b border-border hover:bg-surface-hover">
                          <td className="p-2.5">
                            <span className="font-semibold text-text">{item.itemNome}</span>
                          </td>
                          <td className="p-2.5 text-center font-semibold">
                            {Number(item.quantidade) || 0}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="text-[10px] font-bold text-text-secondary bg-surface-tertiary px-1.5 py-0.5 rounded">
                              {item.unidade}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">{formatCurrency(item.valorUnitario)}</td>
                          <td className="p-2.5 text-right font-bold">
                            {formatCurrency(
                              (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface-secondary border-t-2 border-border">
                        <td
                          colSpan={4}
                          className="p-2.5 text-right font-black text-[10px] uppercase tracking-widest text-text-secondary"
                        >
                          Total
                        </td>
                        <td className="p-2.5 text-right font-black text-text">
                          {formatCurrency(detailPedido.valorTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <button
                onClick={() => setShowDetail(false)}
                className="px-6 py-3 bg-surface-tertiary text-text-secondary rounded-xl hover:bg-surface-active transition-all text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
