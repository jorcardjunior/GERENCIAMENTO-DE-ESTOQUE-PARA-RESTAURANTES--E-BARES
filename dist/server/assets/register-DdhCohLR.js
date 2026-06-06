import { S as reactExports, J as jsxRuntimeExports } from "./server-BSs7-SCa.js";
import { d as useNavigate, L as Link, s as supabase, t as toast } from "./router-BhzvWMaL.js";
import { B as Button } from "./button--0oIo6hY.js";
import { I as Input, L as LoaderCircle } from "./input-GxBtchu_.js";
import { L as Label } from "./label-kzEb_JdA.js";
import { C as Card, d as CardHeader, S as Sparkles, e as CardTitle, b as CardDescription, a as CardContent, c as CardFooter } from "./card-C-SD-ZTO.js";
import { U as UserPlus } from "./user-plus-RhE7KvaD.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
function Register() {
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const navigate = useNavigate();
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password
      });
      if (error) throw error;
      if (data?.user) {
        toast.success("Conta criada! Bem-vindo ao Smart Eco Stock.");
        navigate({
          to: "/auth/login"
        });
      }
    } catch (error) {
      toast.error(error.message || "Falha ao criar conta");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 z-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2000", alt: "Kitchen prep", className: "w-full h-full object-cover opacity-30 scale-110 blur-[2px]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/90 to-emerald-950/40" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-[20%] left-[10%] w-72 h-72 bg-emerald-500/10 blur-[120px] rounded-full z-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-[20%] right-[10%] w-72 h-72 bg-blue-500/10 blur-[120px] rounded-full z-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md relative z-10 border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "text-center pb-8 pt-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto h-20 w-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-2xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-10 w-10 text-emerald-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.4em] mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Novas Oportunidades" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-4xl font-black tracking-tighter text-white uppercase leading-none", children: [
            "Criar ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-500", children: "CONTA" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-slate-400 font-medium mt-2", children: "Junte-se ao Smart_Eco_Stock Pro" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleRegister, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6 px-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "email", className: "text-slate-400 text-xs font-black uppercase tracking-widest ml-1", children: "E-mail para Cadastro" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", type: "email", placeholder: "ex: voce@restaurante.com", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-2xl focus:ring-emerald-500 text-lg" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "password", className: "text-slate-400 text-xs font-black uppercase tracking-widest ml-1", children: "Escolha uma Senha" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "password", type: "password", placeholder: "Mínimo 6 caracteres", value: password, onChange: (e) => setPassword(e.target.value), required: true, className: "h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-emerald-500 text-lg" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardFooter, { className: "flex flex-col space-y-6 p-8 pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full h-16 text-lg font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 border-none", disabled: loading, children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) : "FINALIZAR CADASTRO" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-slate-500 text-center font-medium", children: [
            "Já faz parte da equipe?",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth/login", className: "text-emerald-500 font-black hover:underline tracking-tight", children: "FAZER LOGIN" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Register as component
};
