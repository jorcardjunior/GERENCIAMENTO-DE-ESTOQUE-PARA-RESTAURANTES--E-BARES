"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  Building2,
  ChefHat,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Layers,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Estabelecimento = { id: string; nome: string };
type CatalogItem = { id: string; name: string; unitDefault: string };

type FichaTecnica = {
  id: string;
  estabelecimentoId: string;
  nome: string;
  categoria: string;
  rendimento: string;
  unidadeRendimento: string;
  tempoPreparoMin: number | null;
  modoPreparo: string | null;
  custoTotal: string | null;
  precoSugerido: string | null;
  status: string;
  versao: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  estabelecimentoNome?: string | null;
  insumosCount?: number;
};

type Insumo = {
  id: string;
  fichaTecnicaId: string;
  catalogItemId: string | null;
  insumoNome: string;
  quantidade: string;
  unidade: string;
  percentualPerda: string;
  custoUnitario: string;
  observacao: string | null;
  ordem: number;
  catalogItem?: { id: string; name: string } | null;
};

const CATEGORIAS = [
  "entrada",
  "principal",
  "sobremesa",
  "bebida",
  "lanche",
  "guarnicao",
  "molho",
  "preparo_base",
];

const CATEGORIA_STYLES: Record<string, string> = {
  entrada: "bg-emerald-100 text-emerald-700 border-emerald-300",
  principal: "bg-blue-100 text-blue-700 border-blue-300",
  sobremesa: "bg-pink-100 text-pink-700 border-pink-300",
  bebida: "bg-cyan-100 text-cyan-700 border-cyan-300",
  lanche: "bg-amber-100 text-amber-700 border-amber-300",
  guarnicao: "bg-purple-100 text-purple-700 border-purple-300",
  molho: "bg-orange-100 text-orange-700 border-orange-300",
  preparo_base: "bg-slate-100 text-slate-700 border-slate-300",
};

const formatCurrency = (val: number) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function calcSubtotal(insumo: {
  quantidade: string;
  custoUnitario: string;
  percentualPerda: string;
}) {
  const qtd = Number(insumo.quantidade) || 0;
  const custo = Number(insumo.custoUnitario) || 0;
  const perda = Number(insumo.percentualPerda) || 0;
  return qtd * custo * (1 + perda / 100);
}

export default function FichasTecnicasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const [list, setList] = useState<FichaTecnica[]>([]);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [_catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEstab, setFilterEstab] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<FichaTecnica | null>(null);

  const [form, setForm] = useState({
    estabelecimentoId: "",
    nome: "",
    categoria: "principal",
    rendimento: "1",
    unidadeRendimento: "porcao",
    tempoPreparoMin: "",
    modoPreparo: "",
    status: "ativo",
  });

  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [newInsumo, setNewInsumo] = useState({
    catalogItemId: "",
    insumoNome: "",
    quantidade: "0",
    unidade: "g",
    percentualPerda: "0",
    custoUnitario: "0",
    observacao: "",
    ordem: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fichasRes, estabRes, catalogRes] = await Promise.all([
        fetch("/api/fichas-tecnicas"),
        fetch("/api/estabelecimentos"),
        fetch("/api/items"),
      ]);
      if (fichasRes.ok) setList(await fichasRes.json());
      if (estabRes.ok) setEstabelecimentos(await estabRes.json());
      if (catalogRes.ok) setCatalogItems(await catalogRes.json());
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    let items = list;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) => f.nome.toLowerCase().includes(q) || f.categoria.toLowerCase().includes(q),
      );
    }
    if (filterEstab) {
      items = items.filter((f) => f.estabelecimentoId === filterEstab);
    }
    return items;
  }, [list, search, filterEstab]);

  function resetForm() {
    setForm({
      estabelecimentoId: "",
      nome: "",
      categoria: "principal",
      rendimento: "1",
      unidadeRendimento: "porcao",
      tempoPreparoMin: "",
      modoPreparo: "",
      status: "ativo",
    });
    setInsumos([]);
    setNewInsumo({
      catalogItemId: "",
      insumoNome: "",
      quantidade: "0",
      unidade: "g",
      percentualPerda: "0",
      custoUnitario: "0",
      observacao: "",
      ordem: 0,
    });
    setSelectedFicha(null);
    setEditMode(false);
  }

  function openNew() {
    resetForm();
    setShowModal(true);
  }

  async function openEdit(ficha: FichaTecnica) {
    setSelectedFicha(ficha);
    setEditMode(true);
    setForm({
      estabelecimentoId: ficha.estabelecimentoId,
      nome: ficha.nome,
      categoria: ficha.categoria,
      rendimento: ficha.rendimento,
      unidadeRendimento: ficha.unidadeRendimento,
      tempoPreparoMin: ficha.tempoPreparoMin?.toString() || "",
      modoPreparo: ficha.modoPreparo || "",
      status: ficha.status,
    });

    try {
      const res = await fetch(`/api/fichas-tecnicas/${ficha.id}`);
      if (res.ok) {
        const full = await res.json();
        setInsumos(full.insumos || []);
      }
    } catch {
      setInsumos([]);
    }

    setShowModal(true);
  }

  async function handleSave() {
    if (!form.estabelecimentoId || !form.nome) {
      toast.error("Estabelecimento e nome são obrigatórios");
      return;
    }

    const body = {
      ...form,
      tempoPreparoMin: form.tempoPreparoMin ? Number(form.tempoPreparoMin) : null,
      rendimento: form.rendimento,
    };

    try {
      if (editMode && selectedFicha) {
        const res = await fetch(`/api/fichas-tecnicas/${selectedFicha.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error);
        }
        toast.success("Ficha técnica atualizada");
      } else {
        const res = await fetch("/api/fichas-tecnicas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error);
        }
        toast.success("Ficha técnica criada");
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    }
  }

  async function handleDelete(ficha: FichaTecnica) {
    if (!confirm(`Excluir a ficha "${ficha.nome}"?`)) return;
    try {
      const res = await fetch(`/api/fichas-tecnicas/${ficha.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast.success("Ficha técnica excluída");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    }
  }

  async function handleAddInsumo() {
    if (!selectedFicha) return;
    if (!newInsumo.insumoNome || !newInsumo.quantidade || !newInsumo.unidade) {
      toast.error("Nome, quantidade e unidade do insumo são obrigatórios");
      return;
    }

    const body = {
      catalogItemId: newInsumo.catalogItemId || null,
      insumoNome: newInsumo.insumoNome,
      quantidade: newInsumo.quantidade,
      unidade: newInsumo.unidade,
      percentualPerda: newInsumo.percentualPerda,
      custoUnitario: newInsumo.custoUnitario,
      observacao: newInsumo.observacao || null,
      ordem: insumos.length,
    };

    try {
      const res = await fetch(`/api/fichas-tecnicas/${selectedFicha.id}/insumos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast.success("Insumo adicionado");
      setNewInsumo({
        catalogItemId: "",
        insumoNome: "",
        quantidade: "0",
        unidade: "g",
        percentualPerda: "0",
        custoUnitario: "0",
        observacao: "",
        ordem: 0,
      });
      // Reload insumos and ficha
      const fichaRes = await fetch(`/api/fichas-tecnicas/${selectedFicha.id}`);
      if (fichaRes.ok) {
        const full = await fichaRes.json();
        setInsumos(full.insumos || []);
        setSelectedFicha({
          ...selectedFicha,
          custoTotal: full.custoTotal,
          precoSugerido: full.precoSugerido,
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar insumo");
    }
  }

  const computedCustoTotal = useMemo(() => {
    return insumos.reduce((sum, i) => sum + calcSubtotal(i), 0);
  }, [insumos]);

  const computedPrecoSugerido = computedCustoTotal * 2.5;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-text">
            Fichas Técnicas
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Gerencie receitas, custos e preços sugeridos.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#ea580c] text-white rounded-xl hover:bg-[#c2410c] transition-all text-sm font-bold shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> Nova Ficha
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar por nome ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm bg-surface"
          />
        </div>
        <select
          value={filterEstab}
          onChange={(e) => setFilterEstab(e.target.value)}
          className="px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
        >
          <option value="">Todos estabelecimentos</option>
          {estabelecimentos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-20 text-text-secondary" />
          <p className="text-text-secondary text-lg font-medium">
            {search || filterEstab
              ? "Nenhuma ficha encontrada"
              : "Nenhuma ficha técnica cadastrada"}
          </p>
          {isAdmin && !search && !filterEstab && (
            <button
              onClick={openNew}
              className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-[#1d4ed8] text-sm font-bold"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Criar Primeira Ficha
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ficha) => (
            <div
              key={ficha.id}
              className="bg-surface rounded-2xl border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-text truncate">{ficha.nome}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-text-tertiary" />
                        <span className="text-[10px] text-text-tertiary truncate">
                          {ficha.estabelecimentoNome || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(ficha);
                        }}
                        className="p-1.5 text-brand-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ficha);
                        }}
                        className="p-1.5 text-[#dc2626] hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${CATEGORIA_STYLES[ficha.categoria] || CATEGORIA_STYLES.principal}`}
                  >
                    {ficha.categoria}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      ficha.status === "ativo"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                        : "bg-red-100 text-red-700 border-red-300"
                    }`}
                  >
                    {ficha.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <ChefHat className="h-3.5 w-3.5" />
                    <span>
                      <strong className="text-text">{ficha.rendimento}</strong>{" "}
                      {ficha.unidadeRendimento}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Layers className="h-3.5 w-3.5" />
                    <span>
                      <strong className="text-text">{ficha.insumosCount || 0}</strong> insumos
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>
                      Custo:{" "}
                      <strong className="text-text">
                        {formatCurrency(Number(ficha.custoTotal) || 0)}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>
                      Venda:{" "}
                      <strong className="text-[#16a34a]">
                        {formatCurrency(Number(ficha.precoSugerido) || 0)}
                      </strong>
                    </span>
                  </div>
                </div>

                {ficha.tempoPreparoMin && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-text-secondary">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{ficha.tempoPreparoMin} min</span>
                  </div>
                )}
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-[#2563eb] to-[#ea580c] opacity-40" />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          />
          <div className="relative bg-surface rounded-2xl shadow-2xl border-2 border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-text">
                {editMode ? "Editar Ficha Técnica" : "Nova Ficha Técnica"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1.5 rounded-lg hover:bg-surface-active text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Estabelecimento
                  </label>
                  <select
                    value={form.estabelecimentoId}
                    onChange={(e) => setForm({ ...form, estabelecimentoId: e.target.value })}
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
                    Nome
                  </label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Categoria
                  </label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Rendimento
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.rendimento}
                    onChange={(e) => setForm({ ...form, rendimento: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Unidade Rendimento
                  </label>
                  <input
                    type="text"
                    value={form.unidadeRendimento}
                    onChange={(e) => setForm({ ...form, unidadeRendimento: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Tempo (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.tempoPreparoMin}
                    onChange={(e) => setForm({ ...form, tempoPreparoMin: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                  Modo de Preparo
                </label>
                <textarea
                  rows={3}
                  value={form.modoPreparo}
                  onChange={(e) => setForm({ ...form, modoPreparo: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface resize-y"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Status
                  </span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="px-3 py-2 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Insumos Section */}
            {editMode && selectedFicha && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-text flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-brand-600" /> Insumos
                  </h3>
                  <div className="text-right text-xs text-text-secondary space-x-4">
                    <span>
                      Custo Total:{" "}
                      <strong className="text-text">
                        {formatCurrency(computedCustoTotal)}
                      </strong>
                    </span>
                    <span>
                      Preço Sugerido:{" "}
                      <strong className="text-[#16a34a]">
                        {formatCurrency(computedPrecoSugerido)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Insumo list */}
                {insumos.length > 0 && (
                  <div className="overflow-x-auto mb-4 rounded-xl border-2 border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface-secondary border-b-2 border-border">
                          <th className="text-left p-3 font-bold uppercase tracking-widest text-text-secondary">
                            Nome
                          </th>
                          <th className="text-left p-3 font-bold uppercase tracking-widest text-text-secondary">
                            Qtd
                          </th>
                          <th className="text-left p-3 font-bold uppercase tracking-widest text-text-secondary">
                            Un
                          </th>
                          <th className="text-left p-3 font-bold uppercase tracking-widest text-text-secondary">
                            Perda%
                          </th>
                          <th className="text-left p-3 font-bold uppercase tracking-widest text-text-secondary">
                            Custo Un.
                          </th>
                          <th className="text-right p-3 font-bold uppercase tracking-widest text-text-secondary">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {insumos.map((i) => (
                          <tr key={i.id} className="border-b border-border hover:bg-surface-hover">
                            <td className="p-3 font-medium text-text">{i.insumoNome}</td>
                            <td className="p-3 font-black tabular-nums">{i.quantidade}</td>
                            <td className="p-3 text-text-secondary">{i.unidade}</td>
                            <td className="p-3">{i.percentualPerda}%</td>
                            <td className="p-3">{formatCurrency(Number(i.custoUnitario) || 0)}</td>
                            <td className="p-3 text-right font-black tabular-nums text-text">
                              {formatCurrency(calcSubtotal(i))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add insumo form */}
                <div className="bg-surface-secondary rounded-xl border-2 border-border p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Adicionar Insumo
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-bold text-text-secondary mb-0.5">
                        Nome
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do insumo"
                        value={newInsumo.insumoNome}
                        onChange={(e) => setNewInsumo({ ...newInsumo, insumoNome: e.target.value })}
                        className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-text-secondary mb-0.5">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={newInsumo.quantidade}
                        onChange={(e) => setNewInsumo({ ...newInsumo, quantidade: e.target.value })}
                        className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-text-secondary mb-0.5">
                        Unidade
                      </label>
                      <input
                        type="text"
                        value={newInsumo.unidade}
                        onChange={(e) => setNewInsumo({ ...newInsumo, unidade: e.target.value })}
                        className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-text-secondary mb-0.5">
                        Perda %
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newInsumo.percentualPerda}
                        onChange={(e) =>
                          setNewInsumo({ ...newInsumo, percentualPerda: e.target.value })
                        }
                        className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-text-secondary mb-0.5">
                        Custo Unitário (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newInsumo.custoUnitario}
                        onChange={(e) =>
                          setNewInsumo({ ...newInsumo, custoUnitario: e.target.value })
                        }
                        className="w-full px-2.5 py-2 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddInsumo}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-[#1d4ed8] transition-all text-xs font-bold shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Insumo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-[#ea580c] text-white rounded-xl hover:bg-[#c2410c] transition-all text-sm font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {editMode ? "Salvar Alterações" : "Criar Ficha"}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-6 py-3 bg-surface-tertiary text-text-secondary rounded-xl hover:bg-[#e2e8f0] transition-all text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
