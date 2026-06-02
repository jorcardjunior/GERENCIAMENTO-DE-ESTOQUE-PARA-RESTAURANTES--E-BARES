import { useState } from "react";
import { useCreateItemRequest } from "@/features/inventory/hooks/useInventory";
import { inventoryService } from "@/features/inventory/services/inventoryService";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ItemRequestModal = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (o: boolean) => void }) => {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => inventoryService.getCategories() });
  const createRequest = useCreateItemRequest();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRequest.mutateAsync({
      name,
      suggested_category_id: categoryId || undefined,
      unit,
      notes
    });
    onOpenChange(false);
    setName("");
    setCategoryId("");
    setUnit("");
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white rounded-[2rem]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Solicitar Novo Item</DialogTitle>
            <DialogDescription className="text-slate-400">
              Não encontrou o que precisa? Solicite a inclusão no catálogo oficial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome do Item</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ex: Suco de Laranja Integral" 
                className="bg-white/5 border-white/5 h-12 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unidade</Label>
                <Input 
                  value={unit} 
                  onChange={e => setUnit(e.target.value)} 
                  placeholder="Ex: KG, UN, LT" 
                  className="bg-white/5 border-white/5 h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria (Sugestão)</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="bg-white/5 border-white/5 h-12 rounded-xl">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Observações</Label>
              <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Por que este item é necessário?" 
                className="bg-white/5 border-white/5 rounded-xl min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 font-black uppercase tracking-widest rounded-xl"
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};