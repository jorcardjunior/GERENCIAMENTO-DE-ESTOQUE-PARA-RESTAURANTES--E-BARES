import { S as reactExports, J as jsxRuntimeExports, O as Outlet } from "./server-BSs7-SCa.js";
import { u as useAuth, d as useNavigate, L as Link } from "./router-BhzvWMaL.js";
import { b as createLucideIcon, B as Button, c as cn } from "./button--0oIo6hY.js";
import { C as ChefHat } from "./chef-hat-BU22Lb7H.js";
import { m as motion } from "./proxy-DCe6fuxN.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$4 = [
  ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0", key: "vwvbt9" }],
  [
    "path",
    {
      d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
      key: "11g9vi"
    }
  ]
];
const Bell = createLucideIcon("bell", __iconNode$4);
const __iconNode$3 = [
  ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1", key: "tgr4d6" }],
  [
    "path",
    {
      d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
      key: "116196"
    }
  ],
  ["path", { d: "M12 11h4", key: "1jrz19" }],
  ["path", { d: "M12 16h4", key: "n85exb" }],
  ["path", { d: "M8 11h.01", key: "1dfujw" }],
  ["path", { d: "M8 16h.01", key: "18s6g9" }]
];
const ClipboardList = createLucideIcon("clipboard-list", __iconNode$3);
const __iconNode$2 = [
  ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1", key: "10lvy0" }],
  ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1", key: "16une8" }],
  ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1", key: "1hutg5" }],
  ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1", key: "ldoo1y" }]
];
const LayoutDashboard = createLucideIcon("layout-dashboard", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "m16 17 5-5-5-5", key: "1bji2h" }],
  ["path", { d: "M21 12H9", key: "dn1m92" }],
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }]
];
const LogOut = createLucideIcon("log-out", __iconNode$1);
const __iconNode = [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
];
const Users = createLucideIcon("users", __iconNode);
function AppLayout() {
  const {
    user,
    profile,
    loading,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/auth/login"
      });
    }
  }, [user, loading, navigate]);
  const particles = reactExports.useMemo(() => Array.from({
    length: 20
  }, () => ({
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 4 + 2}px`,
    delay: `${Math.random() * 12}s`,
    duration: `${Math.random() * 10 + 10}s`,
    opacity: Math.random() * 0.3 + 0.05
  })), []);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" }) });
  }
  const navItems = [{
    label: "Gestão",
    icon: LayoutDashboard,
    to: "/app/gestao"
  }, {
    label: "Preenchimento",
    icon: ClipboardList,
    to: "/app/preenchimento"
  }, {
    label: "Usuários",
    icon: Users,
    to: "/app/admin"
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen flex-col bg-background text-foreground selection:bg-emerald-500/30", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 overflow-hidden pointer-events-none z-0", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/15 blur-[120px] animate-blob" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] animate-blob-reverse", style: {
        animationDelay: "1s"
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-emerald-600/15 blur-[120px] animate-blob", style: {
        animationDelay: "2s"
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-[40%] left-[40%] w-[25%] h-[25%] rounded-full bg-violet-500/8 blur-[100px] animate-blob-reverse", style: {
        animationDelay: "3s",
        animationDuration: "7s"
      } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none fixed inset-0 z-[1] overflow-hidden", "aria-hidden": "true", children: particles.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "particle", style: {
      left: p.left,
      bottom: 0,
      width: p.size,
      height: p.size,
      opacity: p.opacity,
      animationDelay: p.delay,
      animationDuration: p.duration
    } }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none fixed inset-0 z-[2] overflow-hidden", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/[0.03] to-transparent sweep-light" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex min-h-screen flex-col md:flex-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "hidden w-72 flex-col border-r border-white/5 bg-slate-950/40 backdrop-blur-2xl p-6 md:flex h-screen sticky top-0 shadow-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-12 px-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChefHat, { className: "h-7 w-7 text-white" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-black text-white tracking-tighter leading-tight text-xl", children: "SMART_ECO" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-emerald-500 tracking-[0.2em] uppercase -mt-1", children: "Stock Pro" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex-1 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-4", children: "Menu Principal" }),
          navItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: item.to, className: "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition-all duration-300 hover:bg-emerald-500/10 hover:text-emerald-400", activeProps: {
            className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: "h-5 w-5 transition-transform duration-300 group-hover:scale-110" }),
            item.label
          ] }, item.to))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-auto pt-6 border-t border-white/5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6 p-4 rounded-2xl bg-slate-900/50 border border-white/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-500 font-bold", children: profile?.name?.[0] || "U" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col overflow-hidden", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold text-white truncate", children: profile?.name || "Usuário" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-500 uppercase font-black tracking-widest", children: profile?.role || "Acesso" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", className: "w-full justify-start gap-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-12 rounded-xl transition-colors", onClick: () => signOut(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-5 w-5" }),
            "Sair do Sistema"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-20 items-center justify-between border-b border-white/5 bg-slate-950/60 backdrop-blur-xl px-6 md:hidden sticky top-0 z-40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { whileTap: {
            scale: 0.9
          }, className: "h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChefHat, { className: "h-6 w-6 text-white" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-black text-white tracking-tighter text-lg leading-none uppercase", children: "ECO_STOCK" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em]", children: "Restaurante Pro" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", className: "h-10 w-10 p-0 rounded-xl bg-white/5 border-white/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4 text-slate-400" }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 p-5 sm:p-10 overflow-x-hidden relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: {
        opacity: 0,
        y: 10
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        duration: 0.4
      }, className: "mx-auto max-w-6xl pb-32 md:pb-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md md:hidden z-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "h-18 rounded-[2rem] border border-white/10 bg-slate-900/60 backdrop-blur-3xl px-4 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)]", children: [
        navItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: item.to, className: "relative flex flex-col items-center gap-1 py-2 group", activeProps: {
          className: "text-emerald-400"
        }, inactiveProps: {
          className: "text-slate-500"
        }, children: ({
          isActive
        }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          isActive && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { layoutId: "nav-active", className: "absolute inset-0 bg-emerald-500/10 rounded-2xl -z-10", transition: {
            type: "spring",
            bounce: 0.2,
            duration: 0.6
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: cn("h-6 w-6 transition-transform duration-300", isActive && "scale-110") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-black uppercase tracking-[0.1em]", children: item.label })
        ] }) }, item.to)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => signOut(), className: "flex flex-col items-center gap-1 text-slate-500 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-6 w-6" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-black uppercase tracking-[0.1em]", children: "Sair" })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  AppLayout as component
};
