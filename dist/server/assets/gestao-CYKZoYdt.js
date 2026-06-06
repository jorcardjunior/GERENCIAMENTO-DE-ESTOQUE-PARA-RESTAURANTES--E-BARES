import { S as reactExports, J as jsxRuntimeExports } from "./server-BSs7-SCa.js";
import { u as useAuth, s as supabase, t as toast } from "./router-BhzvWMaL.js";
import { b as createLucideIcon, B as Button, c as cn } from "./button--0oIo6hY.js";
import { I as Input, L as LoaderCircle } from "./input-GxBtchu_.js";
import { L as Label } from "./label-kzEb_JdA.js";
import { D as Dialog, f as DialogTrigger, a as DialogContent, d as DialogHeader, e as DialogTitle, b as DialogDescription, c as DialogFooter, P as Package, T as Trash2 } from "./dialog-DUOD8Z6G.js";
import { S as Select, d as SelectTrigger, e as SelectValue, b as SelectContent, c as SelectItem } from "./select-BTzJGDMj.js";
import { b as buildFormatLongFn, a as buildLocalizeFn, c as buildMatchFn, d as buildMatchPatternFn, S as Search, T as TriangleAlert, f as format } from "./format-loR1gyOG.js";
import { m as motion } from "./proxy-DCe6fuxN.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$1 = [
  ["path", { d: "M12 10v6", key: "1bos4e" }],
  ["path", { d: "M9 13h6", key: "1uhe8q" }],
  [
    "path",
    {
      d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
      key: "1kt360"
    }
  ]
];
const FolderPlus = createLucideIcon("folder-plus", __iconNode$1);
const __iconNode = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
];
const Plus = createLucideIcon("plus", __iconNode);
const formatDistanceLocale = {
  lessThanXSeconds: {
    one: "menos de um segundo",
    other: "menos de {{count}} segundos"
  },
  xSeconds: {
    one: "1 segundo",
    other: "{{count}} segundos"
  },
  halfAMinute: "meio minuto",
  lessThanXMinutes: {
    one: "menos de um minuto",
    other: "menos de {{count}} minutos"
  },
  xMinutes: {
    one: "1 minuto",
    other: "{{count}} minutos"
  },
  aboutXHours: {
    one: "cerca de 1 hora",
    other: "cerca de {{count}} horas"
  },
  xHours: {
    one: "1 hora",
    other: "{{count}} horas"
  },
  xDays: {
    one: "1 dia",
    other: "{{count}} dias"
  },
  aboutXWeeks: {
    one: "cerca de 1 semana",
    other: "cerca de {{count}} semanas"
  },
  xWeeks: {
    one: "1 semana",
    other: "{{count}} semanas"
  },
  aboutXMonths: {
    one: "cerca de 1 mês",
    other: "cerca de {{count}} meses"
  },
  xMonths: {
    one: "1 mês",
    other: "{{count}} meses"
  },
  aboutXYears: {
    one: "cerca de 1 ano",
    other: "cerca de {{count}} anos"
  },
  xYears: {
    one: "1 ano",
    other: "{{count}} anos"
  },
  overXYears: {
    one: "mais de 1 ano",
    other: "mais de {{count}} anos"
  },
  almostXYears: {
    one: "quase 1 ano",
    other: "quase {{count}} anos"
  }
};
const formatDistance = (token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", String(count));
  }
  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "em " + result;
    } else {
      return "há " + result;
    }
  }
  return result;
};
const dateFormats = {
  full: "EEEE, d 'de' MMMM 'de' y",
  long: "d 'de' MMMM 'de' y",
  medium: "d MMM y",
  short: "dd/MM/yyyy"
};
const timeFormats = {
  full: "HH:mm:ss zzzz",
  long: "HH:mm:ss z",
  medium: "HH:mm:ss",
  short: "HH:mm"
};
const dateTimeFormats = {
  full: "{{date}} 'às' {{time}}",
  long: "{{date}} 'às' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
};
const formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full"
  })
};
const formatRelativeLocale = {
  lastWeek: (date) => {
    const weekday = date.getDay();
    const last = weekday === 0 || weekday === 6 ? "último" : "última";
    return "'" + last + "' eeee 'às' p";
  },
  yesterday: "'ontem às' p",
  today: "'hoje às' p",
  tomorrow: "'amanhã às' p",
  nextWeek: "eeee 'às' p",
  other: "P"
};
const formatRelative = (token, date, _baseDate, _options) => {
  const format2 = formatRelativeLocale[token];
  if (typeof format2 === "function") {
    return format2(date);
  }
  return format2;
};
const eraValues = {
  narrow: ["AC", "DC"],
  abbreviated: ["AC", "DC"],
  wide: ["antes de cristo", "depois de cristo"]
};
const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["T1", "T2", "T3", "T4"],
  wide: ["1º trimestre", "2º trimestre", "3º trimestre", "4º trimestre"]
};
const monthValues = {
  narrow: ["j", "f", "m", "a", "m", "j", "j", "a", "s", "o", "n", "d"],
  abbreviated: [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez"
  ],
  wide: [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro"
  ]
};
const dayValues = {
  narrow: ["D", "S", "T", "Q", "Q", "S", "S"],
  short: ["dom", "seg", "ter", "qua", "qui", "sex", "sab"],
  abbreviated: [
    "domingo",
    "segunda",
    "terça",
    "quarta",
    "quinta",
    "sexta",
    "sábado"
  ],
  wide: [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado"
  ]
};
const dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mn",
    noon: "md",
    morning: "manhã",
    afternoon: "tarde",
    evening: "tarde",
    night: "noite"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "meia-noite",
    noon: "meio-dia",
    morning: "manhã",
    afternoon: "tarde",
    evening: "tarde",
    night: "noite"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "meia-noite",
    noon: "meio-dia",
    morning: "manhã",
    afternoon: "tarde",
    evening: "tarde",
    night: "noite"
  }
};
const formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mn",
    noon: "md",
    morning: "da manhã",
    afternoon: "da tarde",
    evening: "da tarde",
    night: "da noite"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "meia-noite",
    noon: "meio-dia",
    morning: "da manhã",
    afternoon: "da tarde",
    evening: "da tarde",
    night: "da noite"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "meia-noite",
    noon: "meio-dia",
    morning: "da manhã",
    afternoon: "da tarde",
    evening: "da tarde",
    night: "da noite"
  }
};
const ordinalNumber = (dirtyNumber, options) => {
  const number = Number(dirtyNumber);
  if (options?.unit === "week") {
    return number + "ª";
  }
  return number + "º";
};
const localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};
const matchOrdinalNumberPattern = /^(\d+)[ºªo]?/i;
const parseOrdinalNumberPattern = /\d+/i;
const matchEraPatterns = {
  narrow: /^(ac|dc|a|d)/i,
  abbreviated: /^(a\.?\s?c\.?|d\.?\s?c\.?)/i,
  wide: /^(antes de cristo|depois de cristo)/i
};
const parseEraPatterns = {
  any: [/^ac/i, /^dc/i],
  wide: [/^antes de cristo/i, /^depois de cristo/i]
};
const matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^T[1234]/i,
  wide: /^[1234](º)? trimestre/i
};
const parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
const matchMonthPatterns = {
  narrow: /^[jfmajsond]/i,
  abbreviated: /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i,
  wide: /^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
};
const parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^fev/i,
    /^mar/i,
    /^abr/i,
    /^mai/i,
    /^jun/i,
    /^jul/i,
    /^ago/i,
    /^set/i,
    /^out/i,
    /^nov/i,
    /^dez/i
  ]
};
const matchDayPatterns = {
  narrow: /^(dom|[23456]ª?|s[aá]b)/i,
  short: /^(dom|[23456]ª?|s[aá]b)/i,
  abbreviated: /^(dom|seg|ter|qua|qui|sex|s[aá]b)/i,
  wide: /^(domingo|(segunda|ter[cç]a|quarta|quinta|sexta)([- ]feira)?|s[aá]bado)/i
};
const parseDayPatterns = {
  short: [/^d/i, /^2/i, /^3/i, /^4/i, /^5/i, /^6/i, /^s[aá]/i],
  narrow: [/^d/i, /^2/i, /^3/i, /^4/i, /^5/i, /^6/i, /^s[aá]/i],
  any: [/^d/i, /^seg/i, /^t/i, /^qua/i, /^qui/i, /^sex/i, /^s[aá]b/i]
};
const matchDayPeriodPatterns = {
  narrow: /^(a|p|mn|md|(da) (manhã|tarde|noite))/i,
  any: /^([ap]\.?\s?m\.?|meia[-\s]noite|meio[-\s]dia|(da) (manhã|tarde|noite))/i
};
const parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mn|^meia[-\s]noite/i,
    noon: /^md|^meio[-\s]dia/i,
    morning: /manhã/i,
    afternoon: /tarde/i,
    evening: /tarde/i,
    night: /noite/i
  }
};
const match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10)
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any"
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any"
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any"
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any"
  })
};
const ptBR = {
  code: "pt-BR",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
function GestaoEstoque() {
  const {
    profile
  } = useAuth();
  const isAdmin = profile?.role === "admin";
  const userName = profile?.name || profile?.email || "Usuário";
  const [groups, setGroups] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [search, setSearch] = reactExports.useState("");
  const [catDialogOpen, setCatDialogOpen] = reactExports.useState(false);
  const [newCatName, setNewCatName] = reactExports.useState("");
  const [itemDialogOpen, setItemDialogOpen] = reactExports.useState(false);
  const [newItemCatId, setNewItemCatId] = reactExports.useState("");
  const [newItemName, setNewItemName] = reactExports.useState("");
  const [newItemUnit, setNewItemUnit] = reactExports.useState("kg");
  const fetchData = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: categories,
        error: catErr
      } = await supabase.from("categories").select("id, name").order("name");
      if (catErr) throw catErr;
      const {
        data: items,
        error: itemErr
      } = await supabase.from("catalog_items").select(`
          id, name, unit_default, category_id,
          inventory_items(
            id, current_stock, min_stock, unit, updated_at,
            item_batches(expires_at)
          )
        `).order("name");
      if (itemErr) throw itemErr;
      const groupsMap = /* @__PURE__ */ new Map();
      for (const cat of categories || []) {
        groupsMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          items: []
        });
      }
      for (const ci of items || []) {
        const inv = ci.inventory_items?.[0];
        const batch = inv?.item_batches?.[0];
        const row = {
          catalog_item_id: ci.id,
          inventory_id: inv?.id || "",
          item_name: ci.name,
          unit: inv?.unit || ci.unit_default || "un",
          current_stock: inv?.current_stock ?? 0,
          min_stock: inv?.min_stock ?? 1,
          updated_at: inv?.updated_at || null,
          expires_at: batch?.expires_at || null
        };
        const group = groupsMap.get(ci.category_id || "");
        if (group) group.items.push(row);
      }
      setGroups(Array.from(groupsMap.values()));
    } catch (err) {
      toast.error("Erro ao carregar dados: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const {
        error
      } = await supabase.from("categories").insert({
        name: newCatName.trim()
      });
      if (error) throw error;
      toast.success(`Categoria "${newCatName.trim()}" criada!`);
      setNewCatName("");
      setCatDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Erro: " + err.message);
    }
  };
  const handleCreateItem = async () => {
    if (!newItemName.trim() || !newItemCatId) return;
    try {
      const {
        data: ci,
        error: ciErr
      } = await supabase.from("catalog_items").insert({
        name: newItemName.trim(),
        category_id: newItemCatId,
        unit_default: newItemUnit
      }).select().single();
      if (ciErr) throw ciErr;
      const {
        error: invErr
      } = await supabase.from("inventory_items").insert({
        catalog_item_id: ci.id,
        category_id: newItemCatId,
        name: newItemName.trim(),
        unit: newItemUnit,
        current_stock: 0,
        min_stock: 1
      });
      if (invErr) throw invErr;
      toast.success(`"${newItemName.trim()}" adicionado!`);
      setNewItemName("");
      setItemDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Erro: " + err.message);
    }
  };
  const handleDeleteItem = async (item) => {
    if (!confirm(`Remover "${item.item_name}"?`)) return;
    try {
      if (item.inventory_id) {
        await supabase.from("stock_movements").delete().eq("inventory_item_id", item.inventory_id);
        await supabase.from("item_batches").delete().eq("inventory_item_id", item.inventory_id);
        await supabase.from("inventory_items").delete().eq("id", item.inventory_id);
      }
      await supabase.from("catalog_items").delete().eq("id", item.catalog_item_id);
      toast.success(`"${item.item_name}" removido.`);
      fetchData();
    } catch (err) {
      toast.error("Erro ao remover: " + err.message);
    }
  };
  const filteredGroups = groups.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.item_name.toLowerCase().includes(search.toLowerCase()))
  })).filter((g) => g.items.length > 0);
  const isExpiringSoon = (date) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff >= 0 && diff < 864e5;
  };
  const isLowStock = (qty, min) => qty < min;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 animate-in fade-in duration-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tighter uppercase", children: "Gestão de Estoque" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: isAdmin ? "Gerencie categorias e insumos do seu estoque." : "Visualize o estoque do restaurante." })
      ] }),
      isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: catDialogOpen, onOpenChange: setCatDialogOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FolderPlus, { className: "mr-2 h-4 w-4" }),
            " Nova Categoria"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
            e.preventDefault();
            handleCreateCategory();
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Criar Categoria" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Ex: Proteínas, Laticínios, Bebidas, etc." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nome da Categoria" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: newCatName, onChange: (e) => setNewCatName(e.target.value), placeholder: "Ex: Proteínas", autoFocus: true })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: !newCatName.trim(), children: "Criar" }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: itemDialogOpen, onOpenChange: setItemDialogOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
            " Novo Insumo"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
            e.preventDefault();
            handleCreateItem();
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Adicionar Insumo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Adicione um novo produto ao estoque." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Categoria" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newItemCatId, onValueChange: setNewItemCatId, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione..." }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: groups.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: g.id, children: g.name }, g.id)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nome do Produto" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: newItemName, onChange: (e) => setNewItemName(e.target.value), placeholder: "Ex: Carne do Sol" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Unidade de Medida" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: newItemUnit, onValueChange: setNewItemUnit, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: ["kg", "g", "L", "mL", "un", "cx", "pct", "dz"].map((u) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: u, children: u }, u)) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: !newItemName.trim() || !newItemCatId, children: "Adicionar" }) })
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar produto...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-10" })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-emerald-500" }) }) : filteredGroups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-20 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-12 w-12 mx-auto mb-4 opacity-30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium", children: "Nenhum item encontrado." }),
      isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Crie uma categoria e adicione insumos para começar." })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-10", children: filteredGroups.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.section, { initial: {
      opacity: 0,
      y: 10
    }, animate: {
      opacity: 1,
      y: 0
    }, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl font-black uppercase tracking-tight border-b border-border pb-2", children: [
        group.name,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 text-sm font-normal text-muted-foreground", children: [
          "(",
          group.items.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-xl border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-muted/50 border-b", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Produto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Unidade" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Est. Mínimo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Qtd Atual" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Data Contagem" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Validade" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 font-bold uppercase text-[10px] tracking-wider", children: "Responsável" }),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3 font-bold uppercase text-[10px] tracking-wider", children: "Ações" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: group.items.map((item, idx) => {
          const lowStock = isLowStock(item.current_stock, item.min_stock);
          const expiring = isExpiringSoon(item.expires_at);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: cn("border-b border-border/50 transition-colors", expiring ? "bg-red-50 dark:bg-red-950/30" : idx % 2 === 0 ? "bg-background" : "bg-muted/20"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-semibold whitespace-nowrap", children: item.item_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-muted-foreground", children: item.unit }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: item.min_stock }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: cn("p-3 font-bold", lowStock && "text-yellow-600 dark:text-yellow-400"), children: [
              item.current_stock,
              lowStock && /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "inline h-3 w-3 ml-1 text-yellow-500" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-muted-foreground", children: item.updated_at ? format(new Date(item.updated_at), "dd/MM/yyyy", {
              locale: ptBR
            }) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: cn("p-3", expiring && "text-red-600 dark:text-red-400 font-bold"), children: item.expires_at ? format(new Date(item.expires_at), "dd/MM/yyyy", {
              locale: ptBR
            }) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-muted-foreground", children: userName }),
            isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground hover:text-red-500", onClick: () => handleDeleteItem(item), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) }) })
          ] }, item.catalog_item_id);
        }) })
      ] }) })
    ] }, group.id)) })
  ] });
}
export {
  GestaoEstoque as component
};
