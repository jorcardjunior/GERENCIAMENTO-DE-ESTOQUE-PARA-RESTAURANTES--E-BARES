import { useState } from "react";
import { ItemRequestModal } from "@/features/inventory/components/ItemRequestModal";
import { useInventoryItems, useAddMovement } from "@/features/inventory/hooks/useInventory";
import { inventoryService } from "@/features/inventory/services/inventoryService";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Minus, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  History as HistoryIcon,
  Clock,
  ArrowRightLeft,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const OperationalForm = () => {
  const { data: items } = useInventoryItems();
  const { data: recentMovements } = useQuery({
    queryKey: ['recent-movements'],
    queryFn: () => inventoryService.getMyRecentMovements()
  });
  
  const addMovement = useAddMovement();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [qty, setQty] = useState("");
  const [type, setType] = useState<"IN" | "OUT" | "LOSS" | "ADJUST">("OUT");
  const [reason, setReason] = useState("");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const filteredItems = items?.filter(item => 
    item.catalog_item?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !qty) return;

    await addMovement.mutateAsync({
      inventory_item_id: selectedItemId,
      qty: parseFloat(qty),
      type,
      reason
    });

    setQty("");
    setReason("");
    setSelectedItemId("");
    setSearchTerm("");
  };

  const getTypeIcon = (t: string) => {
    switch(t) {
      case 'IN': return <Plus className="h-4 w-4 text-emerald-400" />;
      case 'OUT': return <Minus className="h-4 w-4 text-blue-400" />;
      case 'LOSS': return <AlertCircle className="h-4 w-4 text-rose-400" />;
      default: return <CheckCircle2 className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 items-start">
      {/* Coluna Esquerda: Formulário */}
      <Card className="lg:col-span-7 border-none shadow-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 opacity-50" />
        <CardHeader className="pt-8 px-8">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-white uppercase tracking-tighter">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <Plus className="h-6 w-6" />
            </div>
            Lançamento Rápido
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleQuickSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tipo de Operação</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'OUT', label: 'Saída', icon: Minus, color: 'hover:border-blue-500/40 hover:bg-blue-500/10 active:bg-blue-500/20', active: 'bg-blue-500 text-white border-blue-500' },
                  { id: 'IN', label: 'Entrada', icon: Plus, color: 'hover:border-emerald-500/40 hover:bg-emerald-500/10 active:bg-emerald-500/20', active: 'bg-emerald-500 text-white border-emerald-500' },
                  { id: 'LOSS', label: 'Perda', icon: AlertCircle, color: 'hover:border-rose-500/40 hover:bg-rose-500/10 active:bg-rose-500/20', active: 'bg-rose-500 text-white border-rose-500' },
                  { id: 'ADJUST', label: 'Ajuste', icon: CheckCircle2, color: 'hover:border-slate-500/40 hover:bg-slate-500/10 active:bg-slate-500/20', active: 'bg-slate-500 text-white border-slate-500' },
                ].map((btn) => (
                  <Button 
                    key={btn.id}
                    type="button"
                    variant="outline"
                    className={cn(
                      "rounded-2xl h-14 font-black text-[10px] uppercase tracking-widest transition-all duration-300 border-white/5 bg-white/5",
                      type === btn.id ? btn.active : cn("text-slate-400", btn.color)
                    )}
                    onClick={() => setType(btn.id as any)}
                  >
                    <btn.icon className="mr-2 h-4 w-4" /> {btn.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Item para Movimentação</Label>
              <div className="relative group/input">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors" />
                <Input 
                  placeholder="Pesquise pelo nome do insumo..." 
                  className="pl-12 h-14 bg-white/5 border-white/5 text-white placeholder:text-slate-600 rounded-2xl focus:ring-emerald-500/50 transition-all text-lg font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <AnimatePresence>
                {searchTerm && filteredItems.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="mt-2 max-h-60 overflow-auto rounded-3xl border border-white/10 bg-slate-900 shadow-2xl p-2 z-20 relative backdrop-blur-3xl"
                  >
                    {filteredItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full text-left px-5 py-4 rounded-2xl hover:bg-emerald-500/10 transition-all flex items-center justify-between group/btn"
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setSearchTerm(item.catalog_item.name);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover/btn:text-emerald-400 transition-colors">{item.catalog_item.name}</span>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.catalog_item.category?.name || 'Geral'}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-slate-300">{item.current_stock}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{item.catalog_item.unit_default}</span>
                        </div>
                      </button>
                    ))}
                    <div className="p-2 border-t border-white/5 mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full justify-between text-emerald-500 hover:bg-emerald-500/10 rounded-xl font-bold py-6 group/req"
                        onClick={() => setIsRequestModalOpen(true)}
                      >
                        <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> NÃO ENCONTROU?</span>
                        <ArrowRight className="h-4 w-4 group-hover/req:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ItemRequestModal isOpen={isRequestModalOpen} onOpenChange={setIsRequestModalOpen} />

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Quantidade</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  className="h-14 bg-white/5 border-white/5 text-white rounded-2xl focus:ring-emerald-500/50 text-xl font-black"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Observação</Label>
                <Input 
                  placeholder="Ex: Quebra de estoque..." 
                  className="h-14 bg-white/5 border-white/5 text-white rounded-2xl focus:ring-emerald-500/50"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 text-xl font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] border-none mt-4"
              disabled={addMovement.isPending || !selectedItemId}
            >
              {addMovement.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>PROCESSANDO...</span>
                </div>
              ) : "CONFIRMAR MOVIMENTAÇÃO"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Coluna Direita: Últimos Lançamentos */}
      <Card className="lg:col-span-5 border-none shadow-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="pt-8 px-8">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-white uppercase tracking-tighter">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
              <ArrowRightLeft className="h-6 w-6" />
            </div>
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <div className="space-y-4">
            {!recentMovements || recentMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-slate-800/30 flex items-center justify-center opacity-20">
                  <HistoryIcon className="h-8 w-8 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-bold uppercase tracking-tight">Nenhuma Atividade</p>
                  <p className="text-slate-500 text-sm">Seus lançamentos de hoje aparecerão aqui.</p>
                </div>
              </div>
            ) : (
              recentMovements.map((move: any) => (
                <div 
                  key={move.id} 
                  className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {getTypeIcon(move.type)}
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{move.inventory_item?.catalog_item?.name}</div>
                      <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(move.created_at), "HH:mm '•' dd MMM", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className={cn(
                      "text-xl font-black tracking-tighter",
                      move.type === 'IN' ? 'text-emerald-400' : 'text-slate-200'
                    )}>
                      {move.type === 'IN' ? '+' : '-'}{move.qty}
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/5 px-2 bg-white/5 text-slate-400">
                      {move.type}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};