import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Loader2, UserPlus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/register")({
  component: Register,
});

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      if (data?.user) {
        toast.success("Conta criada! Bem-vindo ao Smart Eco Stock.");
        navigate({ to: "/auth/login" });
      }
    } catch (error: any) {
      toast.error(error.message || "Falha ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Background with higher vibrancy */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2000" 
          alt="Kitchen prep" 
          className="w-full h-full object-cover opacity-30 scale-110 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/90 to-emerald-950/40" />
      </div>

      {/* Decorative Blobs */}
      <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-emerald-500/10 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-blue-500/10 blur-[120px] rounded-full z-0" />

      <Card className="w-full max-w-md relative z-10 border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />
        
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto h-20 w-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-2xl">
            <UserPlus className="h-10 w-10 text-emerald-500" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.4em] mb-1">
              <Sparkles className="h-3 w-3" />
              <span>Novas Oportunidades</span>
            </div>
            <CardTitle className="text-4xl font-black tracking-tighter text-white uppercase leading-none">
              Criar <span className="text-emerald-500">CONTA</span>
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium mt-2">
              Junte-se ao Smart_Eco_Stock Pro
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">E-mail para Cadastro</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="ex: voce@restaurante.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-2xl focus:ring-emerald-500 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Escolha uma Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-emerald-500 text-lg"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-6 p-8 pt-6">
            <Button 
              type="submit" 
              className="w-full h-16 text-lg font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 border-none" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "FINALIZAR CADASTRO"}
            </Button>
            
            <p className="text-sm text-slate-500 text-center font-medium">
              Já faz parte da equipe?{" "}
              <Link to="/auth/login" className="text-emerald-500 font-black hover:underline tracking-tight">FAZER LOGIN</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}