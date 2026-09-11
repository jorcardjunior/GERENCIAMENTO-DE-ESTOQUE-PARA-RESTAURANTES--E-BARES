"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Ban,
  Building2,
  CheckCircle,
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Estabelecimento = {
  id: string;
  nome: string;
};

type CatalogItem = {
  id: string;
  name: string;
};

type TransferenciaItem = {
  id: string;
  transferenciaId: string;
  catalogItemId: string;
  quantidade: string;
  unidade: string;
  lote: string | null;
  catalogItemNome: string;
};

type Transferencia = {
  id: string;
  estabelecimentoOrigemId: string;
  estabelecimentoDestinoId: string;
  status: "pendente" | "enviado" | "recebido" | "cancelado";
  observacao: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  origemNome: string;
  destinoNome: string;
  itensCount: number;
  itens?: TransferenciaItem[];
};

const STATUS_CONFIG = {
  pendente: {
    label: "Pendente",
    color: "text-status-warning-text bg-status-warning-bg border-status-warning-text/30",
    icon: AlertCircle,
  },
  enviado: { label: "Enviado", color: "text-status-info-text bg-status-info-bg border-status-info-text/30", icon: Send },
  recebido: {
    label: "Recebido",
    color: "text-status-success-text bg-status-success-bg border-status-success-text/30",
    icon: CheckCircle,
  },
  cancelado: { label: "Cancelado", color: "text-status-danger-text bg-status-danger-bg border-status-danger-text/30", icon: Ban },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateId(id: string) {
  return `${id.slice(0, 8)}...`;
}

export default function TransferenciasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const [list, setList] = useState<Transferencia[]>([]);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [selectedTransferencia, setSelectedTransferencia] = useState<Transferencia | null>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);

  const [formOrigem, setFormOrigem] = useState("");
  const [formDestino, setFormDestino] = useState("");
  const [formObservacao, setFormObservacao] = useState("");
  const [formItens, setFormItens] = useState<
    { catalogItemId: string; quantidade: string; unidade: string; lote: string }[]
  >([]);
  const [catalogSearch, setCatalogSearch] = useState("");

  const loadList = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("origemNome", search);
      if (statusFilter) params.set("status", statusFilter);
      if (dataInicio) params.set("dataInicio", dataInicio);
      if (dataFim) params.set("dataFim", dataFim);

      const res = await fetch(`/api/transferencias?${params.toString()}`);
      if (res.ok) setList(await res.json());
    } catch {
      toast.error("Erro ao carregar transferências");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dataInicio, dataFim]);

  const loadAux = useCallback(async () => {
    const [estRes, catRes] = await Promise.all([
      fetch("/api/estabelecimentos"),
      fetch("/api/catalog-items"),
    ]);
    if (estRes.ok) setEstabelecimentos(await estRes.json());
    if (catRes.ok) setCatalogItems(await catRes.json());
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadAux();
  }, [loadAux]);

  const openCreate = () => {
    setEditMode(false);
    setEditId(null);
    setFormOrigem("");
    setFormDestino("");
    setFormObservacao("");
    setFormItens([]);
    setCatalogSearch("");
    setModalAberto(true);
  };

  const openEdit = (t: Transferencia) => {
    setEditMode(true);
    setEditId(t.id);
    setFormOrigem(t.estabelecimentoOrigemId);
    setFormDestino(t.estabelecimentoDestinoId);
    setFormObservacao(t.observacao || "");
    fetch(`/api/transferencias/${t.id}/itens`).then((res) => {
      if (res.ok)
        res.json().then((itens) =>
          setFormItens(
            itens.map((i: TransferenciaItem) => ({
              catalogItemId: i.catalogItemId,
              quantidade: i.quantidade,
              unidade: i.unidade,
              lote: i.lote || "",
            })),
          ),
        );
    });
    setCatalogSearch("");
    setModalAberto(true);
  };

  const openDetalhes = async (t: Transferencia) => {
    const res = await fetch(`/api/transferencias/${t.id}`);
    if (res.ok) {
      setSelectedTransferencia(await res.json());
      setDetalhesAberto(true);
    }
  };

  async function salvar() {
    if (!formOrigem || !formDestino) {
      toast.error("Selecione origem e destino");
      return;
    }
    if (formOrigem === formDestino) {
      toast.error("Origem e destino devem ser diferentes");
      return;
    }

    const method = editMode ? "PATCH" : "POST";
    const url = editMode ? `/api/transferencias/${editId}` : "/api/transferencias";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estabelecimentoOrigemId: formOrigem,
        estabelecimentoDestinoId: formDestino,
        observacao: formObservacao || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Erro ao salvar transferência");
      return;
    }

    const transferencia = await res.json();
    const transferenciaId = transferencia.id || editId;

    if (formItens.length > 0) {
      for (const item of formItens) {
        await fetch(`/api/transferencias/${transferenciaId}/itens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
    }

    toast.success(editMode ? "Transferência atualizada" : "Transferência criada");
    setModalAberto(false);
    loadList();
  }

  async function updateStatus(id: string, newStatus: string) {
    const res = await fetch(`/api/transferencias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success(
        `Status alterado para ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG].label}`,
      );
      loadList();
      if (detalhesAberto && selectedTransferencia?.id === id) {
        const updated = await res.json();
        setSelectedTransferencia((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao atualizar status");
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta transferência permanentemente?")) return;
    const res = await fetch(`/api/transferencias/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Transferência excluída");
      setDetalhesAberto(false);
      loadList();
    } else {
      toast.error("Erro ao excluir transferência");
    }
  }

  function addItemRow() {
    setFormItens([...formItens, { catalogItemId: "", quantidade: "", unidade: "un", lote: "" }]);
  }

  function removeItemRow(index: number) {
    setFormItens(formItens.filter((_, i) => i !== index));
  }

  function updateItemRow(index: number, field: string, value: string) {
    const updated = [...formItens];
    (updated[index] as any)[field] = value;
    setFormItens(updated);
  }

  const filteredCatalog = catalogSearch
    ? catalogItems.filter((i) => i.name.toLowerCase().includes(catalogSearch.toLowerCase()))
    : catalogItems;

  const stats = {
    total: list.length,
    pendente: list.filter((t) => t.status === "pendente").length,
    enviado: list.filter((t) => t.status === "enviado").length,
    recebido: list.filter((t) => t.status === "recebido").length,
    cancelado: list.filter((t) => t.status === "cancelado").length,
  };

  const statCards = [
    {
      title: "Total",
      value: stats.total,
      icon: ArrowLeftRight,
      iconBg: "bg-status-info-bg",
      iconColor: "text-status-info-text",
      border: "border-status-info-text/20",
    },
    {
      title: "Pendentes",
      value: stats.pendente,
      icon: AlertCircle,
      iconBg: "bg-status-warning-bg",
      iconColor: "text-status-warning-text",
      border: "border-status-warning-text/20",
    },
    {
      title: "Enviadas",
      value: stats.enviado,
      icon: Send,
      iconBg: "bg-status-info-bg",
      iconColor: "text-status-info-text",
      border: "border-status-info-text/20",
    },
    {
      title: "Recebidas",
      value: stats.recebido,
      icon: CheckCircle,
      iconBg: "bg-status-success-bg",
      iconColor: "text-status-success-text",
      border: "border-status-success-text/20",
    },
    {
      title: "Canceladas",
      value: stats.cancelado,
      icon: Ban,
      iconBg: "bg-status-danger-bg",
      iconColor: "text-status-danger-text",
      border: "border-status-danger-text/20",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-text">
            Transferências
          </h1>
          <p className="text-text-secondary text-sm">
            Gerencie transferências de estoque entre estabelecimentos.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all text-sm font-bold shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Nova Transferência
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
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
                      {card.value}
                    </div>
                  </div>
                  <div
                    className={`p-2.5 rounded-2xl border ${card.iconBg} ${card.iconColor} ${card.border} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div
                className={`h-1 w-full bg-gradient-to-r ${card.iconColor.replace("text-", "from-")} to-transparent opacity-40`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar por estabelecimento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm bg-surface"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="enviado">Enviado</option>
          <option value="recebido">Recebido</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
          title="Data início"
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
          title="Data fim"
        />
        {(search || statusFilter || dataInicio || dataFim) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setDataInicio("");
              setDataFim("");
            }}
            className="flex items-center gap-1 px-3 py-2.5 text-sm text-text-secondary bg-surface border-2 border-border rounded-xl hover:bg-surface-hover transition-all"
          >
            <X className="w-4 h-4" /> Limpar
          </button>
        )}
      </div>

      <div className="bg-surface rounded-2xl border-2 border-border shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary border-b-2 border-border">
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  ID
                </th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  Origem
                </th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  Destino
                </th>
                <th className="text-center p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  Itens
                </th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  Status
                </th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  Data
                </th>
                <th className="text-right p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-tertiary">
                      <ArrowLeftRight className="w-12 h-12 opacity-30" />
                      <p className="font-medium">Nenhuma transferência encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                list.map((t) => {
                  const statusCfg = STATUS_CONFIG[t.status];
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-border hover:bg-surface-hover transition-all"
                    >
                      <td className="p-4 font-mono text-xs text-text-secondary font-bold">
                        {truncateId(t.id)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-brand-600" />
                          <span className="font-semibold text-text">{t.origemNome}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-success" />
                          <span className="font-semibold text-text">{t.destinoNome}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-text-secondary bg-surface-tertiary px-2 py-1 rounded-full">
                          {t.itensCount}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border-2 ${statusCfg.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-text-secondary font-semibold">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetalhes(t)}
                            className="p-1.5 text-brand-600 hover:bg-status-info-bg rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {t.status === "pendente" && (
                            <>
                              <button
                                onClick={() => updateStatus(t.id, "enviado")}
                                className="p-1.5 text-brand-600 hover:bg-status-info-bg rounded-lg transition-colors"
                                title="Enviar"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEdit(t)}
                                className="p-1.5 text-status-warning-text hover:bg-status-warning-bg rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(t.id, "cancelado")}
                                className="p-1.5 text-status-danger-text hover:bg-status-danger-bg rounded-lg transition-colors"
                                title="Cancelar"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {t.status === "enviado" && (
                            <>
                              <button
                                onClick={() => updateStatus(t.id, "recebido")}
                                className="p-1.5 text-success hover:bg-status-success-bg rounded-lg transition-colors"
                                title="Receber"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(t.id, "cancelado")}
                                className="p-1.5 text-status-danger-text hover:bg-status-danger-bg rounded-lg transition-colors"
                                title="Cancelar"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => excluir(t.id)}
                              className="p-1.5 text-status-danger-text hover:bg-status-danger-bg rounded-lg transition-colors"
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
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalAberto(false)}
          />
          <div className="relative bg-surface rounded-2xl shadow-2xl border-2 border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-text">
                {editMode ? "Editar Transferência" : "Nova Transferência"}
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1.5 rounded-lg hover:bg-surface-active text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Origem
                  </label>
                  <select
                    value={formOrigem}
                    onChange={(e) => setFormOrigem(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  >
                    <option value="">Selecione origem</option>
                    {estabelecimentos
                      .filter((e) => e.id !== formDestino)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nome}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Destino
                  </label>
                  <select
                    value={formDestino}
                    onChange={(e) => setFormDestino(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  >
                    <option value="">Selecione destino</option>
                    {estabelecimentos
                      .filter((e) => e.id !== formOrigem)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                  Observação
                </label>
                <textarea
                  value={formObservacao}
                  onChange={(e) => setFormObservacao(e.target.value)}
                  placeholder="Observações opcionais..."
                  rows={2}
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface resize-none"
                />
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-text flex items-center gap-2">
                    <Package className="w-4 h-4" /> Itens
                  </h3>
                  <button
                    onClick={addItemRow}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-brand-600 bg-status-info-bg border border-status-info-text/20 rounded-lg hover:bg-status-info-bg/80 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Adicionar Item
                  </button>
                </div>

                {formItens.length === 0 && (
                  <p className="text-xs text-text-tertiary text-center py-4">
                    Nenhum item adicionado. Clique em "Adicionar Item" para incluir produtos.
                  </p>
                )}

                <div className="space-y-3">
                  {formItens.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-surface-secondary rounded-xl border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Buscar item do catálogo..."
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface mb-1"
                          />
                          <select
                            value={item.catalogItemId}
                            onChange={(e) => updateItemRow(index, "catalogItemId", e.target.value)}
                            className="w-full px-3 py-2 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                          >
                            <option value="">Selecione um item</option>
                            {filteredCatalog.map((ci) => (
                              <option key={ci.id} value={ci.id}>
                                {ci.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">
                              Qtd
                            </label>
                            <input
                              type="number"
                              step="0.001"
                              value={item.quantidade}
                              onChange={(e) => updateItemRow(index, "quantidade", e.target.value)}
                              className="w-full px-2 py-1.5 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">
                              Un
                            </label>
                            <input
                              type="text"
                              value={item.unidade}
                              onChange={(e) => updateItemRow(index, "unidade", e.target.value)}
                              placeholder="kg, un, l..."
                              className="w-full px-2 py-1.5 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">
                              Lote
                            </label>
                            <input
                              type="text"
                              value={item.lote}
                              onChange={(e) => updateItemRow(index, "lote", e.target.value)}
                              placeholder="Opcional"
                              className="w-full px-2 py-1.5 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItemRow(index)}
                        className="p-1.5 text-status-danger-text hover:bg-status-danger-bg rounded-lg transition-colors mt-1 shrink-0"
                        title="Remover item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={salvar}
                className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all text-sm font-bold shadow-lg shadow-blue-500/20"
              >
                {editMode ? "Salvar Alterações" : "Criar Transferência"}
              </button>
              <button
                onClick={() => setModalAberto(false)}
                className="px-6 py-3 bg-surface-tertiary text-text-secondary rounded-xl hover:bg-surface-active transition-all text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {detalhesAberto && selectedTransferencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDetalhesAberto(false)}
          />
          <div className="relative bg-surface rounded-2xl shadow-2xl border-2 border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-text">
                Detalhes da Transferência
              </h2>
              <button
                onClick={() => setDetalhesAberto(false)}
                className="p-1.5 rounded-lg hover:bg-surface-active text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4 p-4 bg-surface-secondary rounded-xl border border-border">
                <div className="text-center">
                  <Building2 className="w-8 h-8 text-brand-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-text">
                    {selectedTransferencia.origemNome}
                  </p>
                  <p className="text-[10px] text-text-secondary">Origem</p>
                </div>
                <ArrowRight className="w-6 h-6 text-text-tertiary" />
                <div className="text-center">
                  <Building2 className="w-8 h-8 text-success mx-auto mb-1" />
                  <p className="text-sm font-bold text-text">
                    {selectedTransferencia.destinoNome}
                  </p>
                  <p className="text-[10px] text-text-secondary">Destino</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Status
                  </span>
                  <div className="mt-1">
                    {(() => {
                      const sc = STATUS_CONFIG[selectedTransferencia.status];
                      const Si = sc.icon;
                      return (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full border-2 ${sc.color}`}
                        >
                          <Si className="w-3 h-3" /> {sc.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Data
                  </span>
                  <p className="mt-1 font-semibold text-text">
                    {formatDate(selectedTransferencia.createdAt)}
                  </p>
                </div>
              </div>

              {selectedTransferencia.observacao && (
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Observação
                  </span>
                  <p className="mt-1 text-sm text-text-secondary bg-surface-secondary p-3 rounded-xl border border-border">
                    {selectedTransferencia.observacao}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-text mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Itens ({selectedTransferencia.itens?.length || 0})
                </h3>
                {selectedTransferencia.itens && selectedTransferencia.itens.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-secondary border-b border-border">
                          <th className="text-left p-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            Item
                          </th>
                          <th className="text-right p-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            Qtd
                          </th>
                          <th className="text-center p-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            Un
                          </th>
                          <th className="text-left p-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            Lote
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransferencia.itens.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-border hover:bg-surface-hover"
                          >
                            <td className="p-3 font-semibold text-text">
                              {item.catalogItemNome}
                            </td>
                            <td className="p-3 text-right font-bold tabular-nums text-text">
                              {item.quantidade}
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-[10px] font-bold text-text-secondary bg-surface-tertiary px-2 py-0.5 rounded">
                                {item.unidade}
                              </span>
                            </td>
                            <td className="p-3 text-text-secondary">{item.lote || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary text-center py-4">
                    Nenhum item nesta transferência
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {selectedTransferencia.status === "pendente" && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedTransferencia.id, "enviado")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all text-sm font-bold shadow-lg shadow-blue-500/20"
                    >
                      <Send className="w-4 h-4" /> Marcar como Enviado
                    </button>
                    <button
                      onClick={() => updateStatus(selectedTransferencia.id, "cancelado")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-status-danger-bg text-status-danger-text rounded-xl hover:bg-status-danger-bg/80 transition-all text-sm font-bold"
                    >
                      <Ban className="w-4 h-4" /> Cancelar
                    </button>
                  </>
                )}
                {selectedTransferencia.status === "enviado" && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedTransferencia.id, "recebido")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-success text-white rounded-xl hover:bg-success/90 transition-all text-sm font-bold shadow-lg shadow-green-500/20"
                    >
                      <CheckCircle className="w-4 h-4" /> Confirmar Recebimento
                    </button>
                    <button
                      onClick={() => updateStatus(selectedTransferencia.id, "cancelado")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-status-danger-bg text-status-danger-text rounded-xl hover:bg-status-danger-bg/80 transition-all text-sm font-bold"
                    >
                      <Ban className="w-4 h-4" /> Cancelar
                    </button>
                  </>
                )}
                {isAdmin && (
                  <button
                    onClick={() => excluir(selectedTransferencia.id)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-danger text-white rounded-xl hover:bg-danger/90 transition-all text-sm font-bold shadow-lg shadow-red-500/20 ml-auto"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
