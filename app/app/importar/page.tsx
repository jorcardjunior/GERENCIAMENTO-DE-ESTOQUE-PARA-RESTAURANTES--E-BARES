"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  ChefHat,
  Database,
  FileSpreadsheet,
  ListChecks,
  Loader2,
  Settings2,
  Truck,
  Undo2,
  Upload,
  Zap,
} from "lucide-react";
import * as React from "react";

type Campo = "name" | "category" | "currentQuantity" | "unit" | "minStock" | "unitPrice" | null;
type Coluna = {
  index: number;
  header: string;
  campo: Campo;
  confianca: "alta" | "media" | "baixa";
};
type Validacao = {
  linhasSemNome: number;
  linhasSemCategoria: number;
  duplicatas: number;
  categoriasNovas: string[];
  valorEstimado: number;
};

type DetectData = {
  fileToken: string;
  filename: string;
  totalRows: number;
  sheetNames: string[];
  colunas: Coluna[];
  headers: string[];
  sampleRows: string[][];
  validacao: Validacao;
};

type ProgressData = { imported: number; skipped: number; total: number };
type CompleteData = {
  imported: number;
  skipped: number;
  total: number;
  errors: string[];
  createdIds: number[];
};

type Modulo = "itens" | "fichas" | "fornecedores";

const MODULOS: {
  key: Modulo;
  label: string;
  icon: React.FC<{ className?: string }>;
  desc: string;
}[] = [
  { key: "itens", label: "Itens", icon: Database, desc: "Importe itens, categorias, precos" },
  {
    key: "fichas",
    label: "Fichas Tecnicas",
    icon: ChefHat,
    desc: "Receitas com ingredientes e custos",
  },
  { key: "fornecedores", label: "Fornecedores", icon: Truck, desc: "Lista de contatos e produtos" },
];

const OPCOES_CAMPO: { value: Campo; label: string }[] = [
  { value: "name", label: "Nome do Item" },
  { value: "category", label: "Categoria" },
  { value: "currentQuantity", label: "Quantidade" },
  { value: "unit", label: "Unidade" },
  { value: "minStock", label: "Estoque Minimo" },
  { value: "unitPrice", label: "Preco Unitario" },
  { value: null, label: "Ignorar coluna" },
];

function BadgeConf({ c }: { c: string }) {
  const map: Record<string, string> = {
    alta: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    media: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    baixa: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  };
  const txt: Record<string, string> = { alta: "Auto", media: "Sugerido", baixa: "Manual" };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${map[c] || map.baixa}`}>
      {txt[c] || txt.baixa}
    </span>
  );
}

export default function ImportarPage() {
  const [modulo, setModulo] = React.useState<Modulo>("itens");
  const [arquivo, setArquivo] = React.useState<File | null>(null);
  const [detect, setDetect] = React.useState<DetectData | null>(null);
  const [mapCol, setMapCol] = React.useState<Record<number, Campo>>({});
  const [loading, setLoading] = React.useState(false);
  const [importando, setImportando] = React.useState(false);
  const [progresso, setProgresso] = React.useState<ProgressData | null>(null);
  const [completo, setCompleto] = React.useState<CompleteData | null>(null);
  const [erro, setErro] = React.useState("");
  const [arrastando, setArrastando] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const enviarDetect = async (f: File, mod: Modulo) => {
    if (mod !== "itens") {
      setErro("Modulo em desenvolvimento. Use 'Itens'.");
      return;
    }
    setArquivo(f);
    setDetect(null);
    setCompleto(null);
    setProgresso(null);
    setErro("");
    setLoading(true);

    const fd = new FormData();
    fd.append("file", f);
    try {
      const r = await fetch("/api/import-detect", { method: "POST", body: fd });
      const d: DetectData = await r.json();
      if (!d.colunas) {
        setErro("Arquivo invalido");
        setArquivo(null);
        return;
      }
      setDetect(d);
      const m: Record<number, Campo> = {};
      for (const c of d.colunas) m[c.index] = c.campo;
      setMapCol(m);
    } catch {
      setErro("Erro de conexao");
      setArquivo(null);
    } finally {
      setLoading(false);
    }
  };

  const importar = async () => {
    if (!detect) return;
    setImportando(true);
    setProgresso({ imported: 0, skipped: 0, total: detect.totalRows });
    setCompleto(null);
    setErro("");

    const mapping: Record<string, string> = {};
    for (const [idx, campo] of Object.entries(mapCol)) {
      if (campo) mapping[detect.headers[Number(idx)]] = campo;
    }

    const fd = new FormData();
    fd.append("fileToken", detect.fileToken);
    fd.append("mapping", JSON.stringify(mapping));

    try {
      const res = await fetch("/api/import-items", { method: "POST", body: fd });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Erro ao ler resposta do servidor");
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const parts = buf.split("\n\n");
        buf = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          const ev = lines.find((l) => l.startsWith("event: "))?.slice(7);
          const dt = lines.find((l) => l.startsWith("data: "))?.slice(6);
          if (!ev || !dt) continue;
          const data = JSON.parse(dt);
          if (ev === "progress") setProgresso(data);
          else if (ev === "complete") {
            setCompleto(data);
            setImportando(false);
          } else if (ev === "error") {
            setErro(data.message);
            setImportando(false);
          }
        }
      }
    } catch {
      setErro("Falha na conexao");
      setImportando(false);
    }
  };

  const desfazer = async () => {
    if (!completo?.createdIds?.length) return;
    try {
      await fetch("/api/import-rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createdIds: completo.createdIds }),
      });
      setCompleto(null);
      setDetect(null);
      setArquivo(null);
      setProgresso(null);
    } catch {
      setErro("Erro ao desfazer");
    }
  };

  const resetar = () => {
    setArquivo(null);
    setDetect(null);
    setCompleto(null);
    setProgresso(null);
    setErro("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    const f = e.dataTransfer.files?.[0];
    if (f) enviarDetect(f, modulo);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(true);
  };
  const handleDragLeave = () => setArrastando(false);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) enviarDetect(f, modulo);
  };

  const pct =
    progresso && progresso.total > 0 ? Math.round((progresso.imported / progresso.total) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Importacao Inteligente</h1>
        <p className="text-sm text-text-tertiary mt-1">
          Arraste seu arquivo CSV ou Excel — a IA mapeia e importa tudo automaticamente
        </p>
      </div>

      {/* Modulos tabs */}
      <div className="flex gap-1 bg-surface-tertiary/50 p-1 rounded-xl border border-border w-fit">
        {MODULOS.map((m) => {
          const Icon = m.icon;
          const ativo = modulo === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setModulo(m.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${ativo ? "bg-surface text-text shadow-sm" : "text-text-tertiary hover:text-text"}`}
            >
              <Icon className={`w-4 h-4 ${ativo ? "text-brand-600" : ""}`} />
              <span className="hidden sm:inline">{m.label}</span>
              <span className="text-[10px] text-text-tertiary font-normal ml-1">{m.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Upload zone */}
      {!arquivo && !loading && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${arrastando ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-[1.01]" : "border-border hover:border-brand-400 hover:bg-surface-tertiary/50"}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFile}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
              <Upload className="w-8 h-8 text-brand-600" />
            </div>
            <div>
              <p className="text-base font-bold text-text">Arraste seu arquivo aqui</p>
              <p className="text-sm text-text-tertiary mt-1">ou clique para selecionar</p>
            </div>
            <div className="flex gap-4 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
              </span>
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" /> XLSX
              </span>
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" /> XLS
              </span>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm text-text-tertiary">Analisando arquivo...</p>
        </div>
      )}
      {erro && !completo && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 text-sm text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {erro}
          <button onClick={resetar} className="ml-auto text-xs font-bold underline">
            OK
          </button>
        </div>
      )}

      {/* Preview + Mapping */}
      {detect && !completo && (
        <div className="space-y-6">
          {/* File info + validation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="glass rounded-xl p-4 border border-brand-500/10 flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-brand-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-text truncate">{detect.filename}</p>
                <p className="text-xs text-text-tertiary">
                  {detect.totalRows.toLocaleString()} linhas
                </p>
              </div>
            </div>
            <div className="glass rounded-xl p-4 border border-brand-500/10 flex items-center gap-3">
              <ListChecks className="w-5 h-5 text-brand-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-text">Validacao</p>
                <div className="flex gap-3 text-xs text-text-tertiary mt-0.5">
                  {detect.validacao.duplicatas > 0 && (
                    <span className="text-amber-600 font-medium">
                      {detect.validacao.duplicatas} duplicata(s)
                    </span>
                  )}
                  {detect.validacao.linhasSemNome > 0 && (
                    <span className="text-danger font-medium">
                      {detect.validacao.linhasSemNome} sem nome
                    </span>
                  )}
                  {detect.validacao.linhasSemCategoria > 0 && (
                    <span className="text-amber-600 font-medium">
                      {detect.validacao.linhasSemCategoria} sem categoria
                    </span>
                  )}
                  {detect.validacao.linhasSemNome === 0 &&
                    detect.validacao.linhasSemCategoria === 0 &&
                    detect.validacao.duplicatas === 0 && (
                      <span className="text-emerald-600 font-medium">OK</span>
                    )}
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-4 border border-brand-500/10 flex items-center gap-3">
              <Database className="w-5 h-5 text-brand-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-text">Valor estimado</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  R${" "}
                  {detect.validacao.valorEstimado.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Validation details */}
          {detect.validacao.categoriasNovas.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold">
                  {detect.validacao.categoriasNovas.length} categorias serao criadas:
                </span>{" "}
                {detect.validacao.categoriasNovas.join(", ")}
              </div>
            </div>
          )}

          {/* Column mapping table */}
          <div>
            <h2 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-brand-600" /> Mapeamento de Colunas
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-tertiary/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-tertiary uppercase tracking-wider">
                      Coluna no arquivo
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-tertiary uppercase tracking-wider w-56">
                      Mapear como
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-tertiary uppercase tracking-wider">
                      Amostras (3 primeiras)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {detect.colunas.map((col) => (
                    <tr key={col.index} className="hover:bg-surface-tertiary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text">{col.header}</span>
                          <BadgeConf c={col.confianca} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={mapCol[col.index] ?? ""}
                          onChange={(e) =>
                            setMapCol((p) => ({
                              ...p,
                              [col.index]:
                                (e.target.value as Campo | "") === ""
                                  ? null
                                  : (e.target.value as Campo),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-surface border border-input rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        >
                          {OPCOES_CAMPO.map((o) => (
                            <option key={o.value ?? ""} value={o.value ?? ""}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {detect.sampleRows.slice(0, 3).map((row, ri) => {
                            const v = row[col.index];
                            return v ? (
                              <span
                                key={ri}
                                className="text-xs bg-surface-tertiary/50 px-2 py-0.5 rounded text-text-secondary truncate max-w-[160px]"
                              >
                                {v}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import button */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={resetar}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text transition-colors rounded-lg hover:bg-surface-tertiary"
            >
              Cancelar
            </button>
            <button
              onClick={importar}
              disabled={importando || !Object.values(mapCol).some(Boolean)}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-600/50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
            >
              {importando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Importando...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" /> Importar {detect.totalRows.toLocaleString()}{" "}
                  itens
                </>
              )}
            </button>
          </div>

          {/* Real progress */}
          {importando && progresso && (
            <div className="space-y-3 glass rounded-xl p-5 border border-brand-500/10">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-text">Importando...</span>
                <span className="text-text-tertiary">{pct}%</span>
              </div>
              <div className="h-3 bg-surface-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>{progresso.imported.toLocaleString()} importados</span>
                <span>{progresso.skipped.toLocaleString()} pulados</span>
                <span>{progresso.total.toLocaleString()} total</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {completo && (
        <div className="glass rounded-2xl p-8 border border-brand-500/10 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            {completo.imported > 0 ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <Ban className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">
              {completo.imported > 0
                ? `${completo.imported} itens importados com sucesso`
                : "Nenhum item foi importado"}
            </h2>
            <div className="flex justify-center gap-8 mt-4">
              <div>
                <p className="text-2xl font-bold text-brand-600">{completo.imported}</p>
                <p className="text-xs text-text-tertiary">Importados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{completo.skipped}</p>
                <p className="text-xs text-text-tertiary">Pulados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{completo.total}</p>
                <p className="text-xs text-text-tertiary">Total</p>
              </div>
            </div>
            <p className="text-xs text-text-tertiary mt-3">Tempo real com chunks de 100 linhas</p>
          </div>

          {completo.errors?.length > 0 && (
            <div className="bg-danger/5 border border-danger/20 rounded-xl p-3 text-left max-w-md mx-auto">
              <p className="text-xs font-bold text-danger mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {completo.errors.length} erro(s)
              </p>
              {completo.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs text-text-tertiary">
                  {e}
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetar}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all"
            >
              Importar outro arquivo
            </button>
            {completo.createdIds?.length > 0 && (
              <button
                onClick={desfazer}
                className="px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 rounded-xl transition-all flex items-center gap-2"
              >
                <Undo2 className="w-4 h-4" /> Desfazer importacao
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state for other modules */}
      {arquivo && modulo !== "itens" && !loading && (
        <div className="glass rounded-2xl p-12 border border-brand-500/10 text-center">
          <ChefHat className="w-12 h-12 text-brand-600/50 mx-auto mb-3" />
          <p className="text-sm font-bold text-text">Modulo em desenvolvimento</p>
          <p className="text-xs text-text-tertiary mt-1">
            Importacao de fichas tecnicas e fornecedores estara disponivel em breve.
          </p>
          <button
            onClick={resetar}
            className="mt-4 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
          >
            Voltar
          </button>
        </div>
      )}
    </div>
  );
}
