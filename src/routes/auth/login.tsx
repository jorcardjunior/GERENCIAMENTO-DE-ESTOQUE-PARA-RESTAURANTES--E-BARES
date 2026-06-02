import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function CreateTestUsersButton() {
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    let count = 0;
    const users = [
      { email: "admin@gmail.com", password: "Ky7#mP9xL2$wQ8" },
      { email: "staff@gmail.com", password: "Gt4&nR7kZ1!vB9" },
    ];
    for (const u of users) {
      await new Promise(r => setTimeout(r, 1500));
      const { error } = await supabase.auth.signUp({
        email: u.email,
        password: u.password,
      });
      if (error && !error.message.toLowerCase().includes("already")) {
        toast.error(`${u.email}: ${error.message}`);
      } else {
        count++;
      }
    }
    if (count > 0) {
      toast.success(`${count} conta(s) criada(s)! Faça login.`);
    }
    setCreating(false);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full h-9 text-[10px] font-black uppercase tracking-widest border-emerald-500/20 text-emerald-400 hover:text-emerald-300"
      onClick={handleCreate}
      disabled={creating}
    >
      {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
      {creating ? "Criando..." : "Criar Contas de Teste"}
    </Button>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Bem-vindo de volta!");
      navigate({ to: "/app" });
    } catch (error: any) {
      toast.error(error.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Vibrant Background Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000" 
          alt="Luxury Restaurant" 
          className="w-full h-full object-cover opacity-40 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-emerald-950/50" />
      </div>

      {/* Decorative Blobs */}
      <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full z-0" />
      <div className="absolute bottom-[10%] left-[10%] w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full z-0" />

      <Card className="w-full max-w-md relative z-10 border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />
        
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto h-20 w-20 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/40 border border-white/20">
            <ChefHat className="h-10 w-10 text-white" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.4em] mb-1">
              <Sparkles className="h-3 w-3" />
              <span>Plataforma Profissional</span>
            </div>
            <CardTitle className="text-4xl font-black tracking-tighter text-white uppercase leading-none">
              SMART_ECO<span className="text-emerald-500">_STOCK</span>
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium mt-2">
              Gestão de Estoque para Restaurantes
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">E-mail Corporativo</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="ex: admin@restaurante.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500 transition-all text-lg"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-slate-400 text-xs font-black uppercase tracking-widest">Senha de Acesso</Label>
                <button type="button" className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest">Esqueceu?</button>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-emerald-500 transition-all text-lg"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-6 p-8 pt-6">
            <Button 
              type="submit" 
              className="w-full h-16 text-lg font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 border-none" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "ACESSAR SISTEMA"}
            </Button>
            
            <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
              <p className="text-[10px] font-black text-emerald-500 text-center uppercase tracking-widest mb-3">Contas de Teste</p>
              <div className="grid grid-cols-2 gap-3 text-[10px] mb-4">
                <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5">
                  <p className="font-black text-white mb-1 uppercase tracking-tighter">Admin</p>
                  <p className="text-slate-500 truncate italic">admin@gmail.com</p>
                  <p className="text-emerald-500 font-bold text-[9px] mt-1">senha: Ky7#mP9xL2$wQ8</p>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5">
                  <p className="font-black text-white mb-1 uppercase tracking-tighter">Staff</p>
                  <p className="text-slate-500 truncate italic">staff@gmail.com</p>
                  <p className="text-emerald-500 font-bold text-[9px] mt-1">senha: Gt4&nR7kZ1!vB9</p>
                </div>
              </div>
              <CreateTestUsersButton />
            </div>

            <p className="text-sm text-slate-500 text-center font-medium">
              Novo no sistema?{" "}
              <Link to="/auth/register" className="text-emerald-500 font-black hover:underline tracking-tight">CRIAR CONTA AGORA</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}