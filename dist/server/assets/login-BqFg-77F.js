import { S as reactExports, J as jsxRuntimeExports } from "./server-BSs7-SCa.js";
import { d as useNavigate, L as Link, s as supabase, t as toast } from "./router-BhzvWMaL.js";
import { B as Button } from "./button--0oIo6hY.js";
import { I as Input, L as LoaderCircle } from "./input-GxBtchu_.js";
import { L as Label } from "./label-kzEb_JdA.js";
import { C as Card, d as CardHeader, S as Sparkles, e as CardTitle, b as CardDescription, a as CardContent, c as CardFooter } from "./card-C-SD-ZTO.js";
import { C as ChefHat } from "./chef-hat-BU22Lb7H.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
function Login() {
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      toast.success("Bem-vindo de volta!");
      navigate({
        to: "/app"
      });
    } catch (error) {
      toast.error(error.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 z-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000", alt: "Luxury Restaurant", className: "w-full h-full object-cover opacity-40 scale-110" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-emerald-950/50" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-[10%] right-[10%] w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full z-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-[10%] left-[10%] w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full z-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md relative z-10 border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "text-center pb-8 pt-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto h-20 w-20 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/40 border border-white/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChefHat, { className: "h-10 w-10 text-white" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.4em] mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Plataforma Profissional" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-4xl font-black tracking-tighter text-white uppercase leading-none", children: [
            "SMART_ECO",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-500", children: "_STOCK" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-slate-400 font-medium mt-2", children: "Gestão de Estoque para Restaurantes" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleLogin, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6 px-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "email", className: "text-slate-400 text-xs font-black uppercase tracking-widest ml-1", children: "E-mail Corporativo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", type: "email", placeholder: "ex: admin@restaurante.com", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500 transition-all text-lg" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center ml-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "password", className: "text-slate-400 text-xs font-black uppercase tracking-widest", children: "Senha de Acesso" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest", children: "Esqueceu?" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, className: "h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-emerald-500 transition-all text-lg" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardFooter, { className: "flex flex-col space-y-6 p-8 pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full h-16 text-lg font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 border-none", disabled: loading, children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) : "ACESSAR SISTEMA" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black text-emerald-500 text-center uppercase tracking-widest mb-3", children: "Contas de Teste" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 text-[10px]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-slate-950/50 rounded-xl border border-white/5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-black text-white mb-1 uppercase tracking-tighter", children: "Admin" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 truncate italic", children: "admin@gmail.com" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-emerald-500 font-bold text-[9px] mt-1", children: "senha: admin" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-slate-950/50 rounded-xl border border-white/5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-black text-white mb-1 uppercase tracking-tighter", children: "Staff" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 truncate italic", children: "staff@gmail.com" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-emerald-500 font-bold text-[9px] mt-1", children: "senha: staff" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-slate-500 text-center font-medium", children: [
            "Novo no sistema?",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth/register", className: "text-emerald-500 font-black hover:underline tracking-tight", children: "CRIAR CONTA AGORA" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Login as component
};
