"use client";

import { isManagerRole, useAuth } from "@/hooks/use-auth";
import {
  AlertCircle,
  Building2,
  Check,
  Eye,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const ESTADOS_BR = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

type Estabelecimento = {
  id: string;
  nome: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  email: string | null;
  status: "ativo" | "inativo" | "fechado";
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusConfig = {
  ativo: { class: "bg-status-success-bg text-status-success-text border-status-success-border", label: "Ativo" },
  inativo: { class: "bg-status-warning-bg text-status-warning-text border-status-warning-border", label: "Inativo" },
  fechado: { class: "bg-status-danger-bg text-status-danger-text border-status-danger-border", label: "Fechado" },
};

const emptyForm = {
  nome: "",
  nomeFantasia: "",
  cnpj: "",
  endereco: "",
  cidade: "",
  estado: "",
  telefone: "",
  email: "",
  status: "ativo" as "ativo" | "inativo" | "fechado",
};

export default function EstabelecimentosPage() {
  const { user } = useAuth();
  const isAdmin = isManagerRole(user?.role);

  const [list, setList] = useState<Estabelecimento[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [_deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/estabelecimentos");
      if (res.ok) setList(await res.json());
    } catch {
      toast.error("Erro ao carregar estabelecimentos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = list.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.nome.toLowerCase().includes(q) || (e.cidade?.toLowerCase() || "").includes(q);
  });

  const stats = {
    total: list.length,
    ativos: list.filter((e) => e.status === "ativo").length,
    inativos: list.filter((e) => e.status === "inativo").length,
  };

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(est: Estabelecimento) {
    setEditId(est.id);
    setForm({
      nome: est.nome,
      nomeFantasia: est.nomeFantasia || "",
      cnpj: est.cnpj || "",
      endereco: est.endereco || "",
      cidade: est.cidade || "",
      estado: est.estado || "",
      telefone: est.telefone || "",
      email: est.email || "",
      status: est.status,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const method = editId ? "PATCH" : "POST";
      const url = editId ? `/api/estabelecimentos/${editId}` : "/api/estabelecimentos";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      toast.success(editId ? "Estabelecimento atualizado" : "Estabelecimento criado");
      setModalOpen(false);
      loadData();
    } catch {
      toast.error("Erro ao salvar estabelecimento");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este estabelecimento?")) return;
    try {
      const res = await fetch(`/api/estabelecimentos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir");
        return;
      }
      toast.success("Estabelecimento excluído");
      setDeleteConfirm(null);
      loadData();
    } catch {
      toast.error("Erro ao excluir estabelecimento");
    }
  }

  const statCards = [
    {
      title: "Total",
      value: stats.total,
      icon: Building2,
      iconBg: "bg-brand-100",
      iconColor: "text-brand-600",
      border: "border-brand-200",
      sub: "estabelecimentos",
    },
    {
      title: "Ativos",
      value: stats.ativos,
      icon: Check,
      iconBg: "bg-status-success-bg",
      iconColor: "text-status-success-text",
      border: "border-status-success-border",
      sub: "em operação",
    },
    {
      title: "Inativos",
      value: stats.inativos,
      icon: AlertCircle,
      iconBg: "bg-status-warning-bg",
      iconColor: "text-status-warning-text",
      border: "border-status-warning-border",
      sub: "não operantes",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-text">
            Estabelecimentos
          </h1>
          <p className="text-text-secondary text-sm">Gerencie suas unidades, filiais e restaurantes.</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all text-sm font-bold shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Novo Estabelecimento
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="relative group bg-surface rounded-2xl border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden"
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
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-text-tertiary font-semibold">{card.sub}</p>
            </div>
            <div
              className={`h-1 w-full bg-gradient-to-r ${card.iconColor.replace("text-", "from-")} to-transparent opacity-40`}
            />
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar por nome ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm bg-surface"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 max-w-md mx-auto">
          <Store className="h-16 w-16 mx-auto mb-6 opacity-20 text-text-secondary" />
          <h2 className="text-2xl font-black text-text mb-2">
            {search ? "Nenhum resultado" : "Nenhum estabelecimento"}
          </h2>
          <p className="text-text-secondary mb-2">
            {search
              ? `Nada encontrado para "${search}"`
              : "Cadastre seu primeiro estabelecimento para começar."}
          </p>
          {!search && isAdmin && (
            <button
              onClick={openCreate}
              className="mt-6 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 text-sm font-bold"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Criar Estabelecimento
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-border bg-surface shadow-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary border-b-2 border-border">
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  Nome
                </th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  Cidade/Estado
                </th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  Telefone
                </th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  Status
                </th>
                <th className="text-right p-4 font-bold uppercase text-[10px] tracking-widest text-text-secondary">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((est) => {
                const cfg = statusConfig[est.status];
                return (
                  <tr
                    key={`${est.id}-${Date.now().toString()}`}
                    className="border-b border-border hover:bg-surface-secondary transition-all"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-brand-100 border-2 border-brand-200 text-brand-600 flex items-center justify-center">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-text">{est.nome}</span>
                          {est.nomeFantasia && (
                            <span className="ml-2 text-[11px] text-text-tertiary">
                              ({est.nomeFantasia})
                            </span>
                          )}
                          {est.cnpj && (
                            <div className="text-[10px] text-text-tertiary font-medium">
                              CNPJ: {est.cnpj}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{[est.cidade, est.estado].filter(Boolean).join(", ") || "—"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{est.telefone || "—"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border-2 ${cfg.class}`}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setViewId(viewId === est.id ? null : est.id)}
                        className="p-1.5 text-text-secondary hover:bg-surface-active rounded-lg transition-colors mr-1"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEdit(est)}
                            className="p-1.5 text-brand-600 hover:bg-blue-50 rounded-lg transition-colors mr-1"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(est.id)}
                            className="p-1.5 text-status-danger-text hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border text-xs text-text-tertiary flex justify-between">
            <span>
              {filtered.length} de {list.length} estabelecimentos
            </span>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-surface rounded-2xl shadow-2xl border-2 border-border w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-text">
                {editId ? "Editar Estabelecimento" : "Novo Estabelecimento"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-active text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                  Nome <span className="text-status-danger-text">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nome do estabelecimento"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  placeholder="Nome fantasia"
                  value={form.nomeFantasia}
                  onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro"
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Estado
                  </label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  >
                    <option value="">Selecione</option>
                    {ESTADOS_BR.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  />
                </div>
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as "ativo" | "inativo" | "fechado",
                      })
                    }
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-surface"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="fechado">Fechado</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {saving ? "Salvando..." : editId ? "Salvar Alterações" : "Criar Estabelecimento"}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 bg-surface-tertiary text-text-secondary rounded-xl hover:bg-border transition-all text-sm font-medium"
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
