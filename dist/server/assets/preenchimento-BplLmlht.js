import { S as reactExports, J as jsxRuntimeExports } from "./server-BSs7-SCa.js";
import { u as useAuth, s as supabase, t as toast } from "./router-BhzvWMaL.js";
import { b as createLucideIcon, B as Button, c as cn } from "./button--0oIo6hY.js";
import { L as LoaderCircle, I as Input } from "./input-GxBtchu_.js";
import { S as Select, d as SelectTrigger, e as SelectValue, b as SelectContent, c as SelectItem } from "./select-BTzJGDMj.js";
import { S as Search, T as TriangleAlert, f as format } from "./format-loR1gyOG.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$2 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
];
const CircleCheck = createLucideIcon("circle-check", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }]
];
const RotateCcw = createLucideIcon("rotate-ccw", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
];
const Save = createLucideIcon("save", __iconNode);
function PreenchimentoEstoque() {
  const {
    profile
  } = useAuth();
  const [categories, setCategories] = reactExports.useState([]);
  const [categoryFilter, setCategoryFilter] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const [rows, setRows] = reactExports.useState([]);
  const [saving, setSaving] = reactExports.useState(false);
  const [summary, setSummary] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const inputRefs = reactExports.useRef([]);
  const focusInput = reactExports.useCallback((index) => {
    const el = inputRefs.current[index];
    if (el) {
      el.focus();
      if (el.type === "number") el.select();
    }
  }, []);
  const handleKeyDown = reactExports.useCallback((e, index, total) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const dir = e.shiftKey ? -1 : 1;
      let next = index + dir;
      if (next < 0) next = total - 1;
      if (next >= total) next = 0;
      focusInput(next);
    }
  }, [focusInput]);
  const registerInput = reactExports.useCallback((el, index) => {
    inputRefs.current[index] = el;
  }, []);
  const fetchData = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: cats,
        error: catErr
      } = await supabase.from("categories").select("id, name").order("name");
      if (catErr) throw catErr;
      setCategories(cats || []);
      const {
        data: items,
        error: itemErr
      } = await supabase.from("catalog_items").select(`
          id, name, unit_default, category_id,
          inventory_items(
            id, current_stock, min_stock, unit, updated_at,
            item_batches(id, qty_current, expires_at)
          )
        `).order("name");
      if (itemErr) throw itemErr;
      const today = (/* @__PURE__ */ new Date()).toISOString();
      const mapped = (items || []).map((ci) => {
        const inv = ci.inventory_items?.[0];
        const batch = inv?.item_batches?.[0];
        return {
          inventory_id: inv?.id || "",
          catalog_item_id: ci.id,
          item_name: ci.name,
          unit: inv?.unit || ci.unit_default || "un",
          min_stock: inv?.min_stock ?? 1,
          current_stock: inv?.current_stock ?? 0,
          expires_at: batch?.expires_at || "",
          batch_id: batch?.id || null,
          isNew: !inv || !batch
        };
      });
      setRows(mapped);
      setSummary(null);
    } catch (err) {
      toast.error("Erro ao carregar: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    fetchData();
  }, [fetchData]);
  const [catItemMap, setCatItemMap] = reactExports.useState({});
  reactExports.useEffect(() => {
    const fetchCatalogCategories = async () => {
      const {
        data
      } = await supabase.from("catalog_items").select("id, category_id");
      if (data) {
        const map = {};
        data.forEach((ci) => {
          map[ci.id] = ci.category_id;
        });
        setCatItemMap(map);
      }
    };
    fetchCatalogCategories();
  }, []);
  const displayRows = rows.filter((r) => {
    if (categoryFilter !== "all") {
      return catItemMap[r.catalog_item_id] === categoryFilter;
    }
    return true;
  }).filter((r) => search ? r.item_name.toLowerCase().includes(search.toLowerCase()) : true);
  const updateQty = (catalogItemId, value) => {
    const num = parseFloat(value);
    setRows((prev) => prev.map((r) => r.catalog_item_id === catalogItemId ? {
      ...r,
      current_stock: isNaN(num) ? 0 : num
    } : r));
  };
  const updateExpiry = (catalogItemId, value) => {
    setRows((prev) => prev.map((r) => r.catalog_item_id === catalogItemId ? {
      ...r,
      expires_at: value || null
    } : r));
  };
  const handleSave = async () => {
    setSaving(true);
    let updated = 0;
    let lowCount = 0;
    let expiringCount = 0;
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString();
      for (const row of displayRows) {
        const changed = rows.find((r) => r.catalog_item_id === row.catalog_item_id);
        if (!changed) continue;
        if (changed.current_stock < changed.min_stock) lowCount++;
        if (changed.expires_at) {
          const diff = new Date(changed.expires_at).getTime() - Date.now();
          if (diff >= 0 && diff < 864e5) expiringCount++;
        }
        if (row.inventory_id) {
          const {
            error
          } = await supabase.from("inventory_items").update({
            current_stock: changed.current_stock,
            updated_at: today
          }).eq("id", row.inventory_id);
          if (error) throw error;
          if (changed.expires_at) {
            if (row.batch_id) {
              await supabase.from("item_batches").update({
                expires_at: changed.expires_at,
                updated_at: today
              }).eq("id", row.batch_id);
            } else {
              const {
                data: newBatch
              } = await supabase.from("item_batches").insert({
                inventory_item_id: row.inventory_id,
                qty_current: changed.current_stock,
                expires_at: changed.expires_at,
                batch_code: "LOTE-" + Date.now()
              }).select().single();
              if (newBatch) {
                setRows((prev) => prev.map((r) => r.catalog_item_id === row.catalog_item_id ? {
                  ...r,
                  batch_id: newBatch.id,
                  isNew: false
                } : r));
              }
            }
          }
        } else {
          const {
            data: inv,
            error: invErr
          } = await supabase.from("inventory_items").insert({
            catalog_item_id: row.catalog_item_id,
            name: row.item_name,
            unit: row.unit,
            current_stock: changed.current_stock,
            min_stock: changed.min_stock
          }).select().single();
          if (invErr) throw invErr;
          if (changed.expires_at) {
            await supabase.from("item_batches").insert({
              inventory_item_id: inv.id,
              qty_current: changed.current_stock,
              expires_at: changed.expires_at,
              batch_code: "LOTE-" + Date.now()
            });
          }
          setRows((prev) => prev.map((r) => r.catalog_item_id === row.catalog_item_id ? {
            ...r,
            inventory_id: inv.id
          } : r));
        }
        updated++;
      }
      setSummary({
        total: updated,
        low: lowCount,
        expiring: expiringCount
      });
      toast.success(`${updated} itens salvos com sucesso!`);
    } catch (err) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleDiscard = () => {
    fetchData();
    setSummary(null);
    toast.info("Alterações descartadas.");
  };
  const isExpiring = (date) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff >= 0 && diff < 864e5;
  };
  const lowStock = (qty, min) => qty < min;
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-emerald-500" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 animate-in fade-in duration-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tighter uppercase", children: "Preenchimento de Estoque" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Insira rapidamente as quantidades e validades dos produtos." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleDiscard, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-2 h-4 w-4" }),
          " Descartar"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSave, disabled: saving, className: "bg-emerald-600 hover:bg-emerald-700", children: [
          saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
          "Salvar Alterações"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full sm:w-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: categoryFilter, onValueChange: setCategoryFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Todas as categorias" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas as Categorias" }),
          categories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c.id, children: c.name }, c.id))
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 max-w-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar produto...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-10" })
      ] })
    ] }),
    summary && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5 text-emerald-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium", children: [
        "Foram atualizados ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: summary.total }),
        " itens.",
        summary.low > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-yellow-600 ml-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "inline h-3.5 w-3.5 mr-1" }),
          summary.low,
          " ",
          summary.low === 1 ? "está abaixo" : "estão abaixo",
          " do estoque mínimo."
        ] }),
        summary.expiring > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-red-600 ml-2", children: [
          summary.expiring,
          " ",
          summary.expiring === 1 ? "item próximo" : "itens próximos",
          " do vencimento."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "ml-auto text-xs", onClick: () => setSummary(null), children: "OK" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-xl border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-muted/50 border-b", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Produto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Unidade" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Est. Mínimo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Qtd Atual" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Data" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Validade" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Responsável" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: displayRows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "p-10 text-center text-muted-foreground", children: "Nenhum produto encontrado." }) }) : displayRows.map((row, idx) => {
        const expiring = isExpiring(row.expires_at);
        const low = lowStock(row.current_stock, row.min_stock);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: cn("border-b border-border/50 transition-colors", expiring ? "bg-red-50 dark:bg-red-950/30" : idx % 2 === 0 ? "bg-background" : "bg-muted/20"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-semibold whitespace-nowrap", children: row.item_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-muted-foreground", children: row.unit }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: row.min_stock }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.1", min: "0", value: row.current_stock, onChange: (e) => updateQty(row.catalog_item_id, e.target.value), onKeyDown: (e) => {
              const total = displayRows.length * 2;
              handleKeyDown(e, idx * 2, total);
            }, ref: (el) => registerInput(el, idx * 2), inputMode: "decimal", className: cn("h-12 w-full min-w-[5rem] text-center font-bold border-2 text-base", low ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20" : "border-blue-200 dark:border-blue-800 focus:border-blue-400") }),
            low && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-yellow-600 mt-1", children: "Abaixo do mínimo" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-muted-foreground whitespace-nowrap", children: format(/* @__PURE__ */ new Date(), "dd/MM/yyyy") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: row.expires_at?.split("T")[0] || "", onChange: (e) => updateExpiry(row.catalog_item_id, e.target.value), onKeyDown: (e) => {
              const total = displayRows.length * 2;
              handleKeyDown(e, idx * 2 + 1, total);
            }, ref: (el) => registerInput(el, idx * 2 + 1), className: cn("h-12 w-full min-w-[8rem] border-2 text-base", expiring ? "border-red-400 bg-red-50 dark:bg-red-950/20" : "border-blue-200 dark:border-blue-800 focus:border-blue-400") }),
            expiring && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-red-600 mt-1", children: "Vence amanhã!" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-muted-foreground", children: profile?.name || profile?.email || "—" })
        ] }, row.catalog_item_id);
      }) })
    ] }) }),
    displayRows.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground text-center", children: [
      displayRows.length,
      " ",
      displayRows.length === 1 ? "produto" : "produtos",
      " — Clique nas células para editar"
    ] })
  ] });
}
export {
  PreenchimentoEstoque as component
};
