import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, UserPlus, Shield, User, Loader2, Trash2, Check, X, Package, BarChart3, Truck } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/app/admin/")({
  component: AdminUserManagement,
});

interface PermissionToggle {
  key: string;
  label: string;
  icon: typeof Package;
  description: string;
}

const PERMISSIONS: PermissionToggle[] = [
  { key: "can_add_items", label: "Cadastrar Insumos", icon: Package, description: "Permite adicionar novos itens ao catálogo" },
  { key: "can_view_reports", label: "Ver Relatórios", icon: BarChart3, description: "Acesso a métricas e gráficos do dashboard" },
  { key: "can_manage_suppliers", label: "Gerenciar Fornecedores", icon: Truck, description: "Pode cadastrar e editar fornecedores" },
];

function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("funcionario");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar usuários: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const togglePermission = async (userId: string, permission: string, currentValue: boolean) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [permission]: !currentValue } as any)
        .eq("id", userId);
      
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [permission]: !currentValue } : u));
      queryClient.invalidateQueries({ queryKey: ['users-with-permissions'] });
    } catch (error: any) {
      toast.error("Erro ao atualizar permissão: " + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role }
        }
      });

      if (error) throw error;

      if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ role })
            .eq("id", data.user.id);
          
          if (profileError) console.error("Erro ao atualizar papel:", profileError);
      }

      toast.success("Usuário convidado com sucesso!");
      setIsModalOpen(false);
      setEmail("");
      setPassword("");
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro ao adicionar usuário: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Adicione e gerencie as permissões da sua equipe.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="mr-2 h-4 w-4" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddUser}>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Crie uma nova conta para um membro da sua equipe.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input 
                    id="new-email" 
                    type="email" 
                    placeholder="funcionario@restaurante.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Senha Temporária</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    placeholder="******" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-role">Cargo / Papel</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                      <SelectItem value="funcionario">Funcionário (Apenas Estoque)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Usuário
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{user.name || "Sem Nome"}</div>
                        <div className="text-xs text-muted-foreground">{user.email || "Sem email"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' ? (
                        <Shield className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <User className="h-3 w-3 text-zinc-500" />
                      )}
                      <span className={`text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'text-emerald-600' : 'text-zinc-500'}`}>
                        {user.role}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total</span>
                    ) : (
                      <div className="flex gap-3">
                        {PERMISSIONS.map(p => (
                          <div key={p.key} className="flex items-center gap-1 group relative">
                            <Switch
                              checked={user[p.key] ?? false}
                              onCheckedChange={() => togglePermission(user.id, p.key, user[p.key] ?? false)}
                              disabled={updating === user.id}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                            <p.icon className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                              <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap border border-white/10">
                                {p.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
