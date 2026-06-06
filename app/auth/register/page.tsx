"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { normalizeName } from "@/lib/validation";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(normalizeName(name), email, password, "staff");
      toast.success("Conta criada com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <Card className="w-full max-w-md border-white/10 bg-slate-900/80 backdrop-blur-3xl">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-2xl">
            <UserPlus className="h-10 w-10 text-emerald-500" />
          </div>
          <CardTitle className="text-4xl font-black tracking-tighter text-white uppercase">
            Criar <span className="text-emerald-500">CONTA</span>
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium mt-2">
            Junte-se ao Smart Eco Stock
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Nome</Label>
              <Input id="name" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required
                className="h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-2xl text-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">E-mail</Label>
              <Input id="email" type="email" placeholder="voce@restaurante.com" value={email}
                onChange={e => setEmail(e.target.value)} required
                className="h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-2xl text-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Senha</Label>
              <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password}
                onChange={e => setPassword(e.target.value)} required
                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl text-lg" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 p-8 pt-6">
            <Button type="submit" disabled={loading}
              className="w-full h-16 text-lg font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "FINALIZAR CADASTRO"}
            </Button>
            <p className="text-sm text-slate-500 text-center font-medium">
              Já tem conta?{" "}
              <Link href="/auth/login" className="text-emerald-500 font-black hover:underline tracking-tight">FAZER LOGIN</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
