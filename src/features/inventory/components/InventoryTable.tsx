import { useInventoryItems } from "@/features/inventory/hooks/useInventory";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, ArrowUpRight, ArrowDownRight, MoreHorizontal, Package } from "lucide-react";
import { useState } from "react";
import { MovementModal } from "@/features/movements/components/MovementModal";
import { cn } from "@/lib/utils";

/**
 * Tabela de Itens de Inventário do EcoStock.
 * Apresenta a lista de insumos com indicadores de status e ações rápidas.
 * Adaptada para ser responsiva: tabela no desktop, cards no mobile.
 */
export const InventoryTable = () => {
  const { data: items, isLoading } = useInventoryItems();
  const [selectedItem, setSelectedItem] = useState<{id: string, name: string} | null>(null);

  if (isLoading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 w-full bg-slate-800/40 animate-pulse rounded-xl" />
      ))}
    </div>
  );

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-900/20">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="font-bold text-lg">Nenhum item cadastrado ainda.</p>
        <p className="text-sm">Comece adicionando seu primeiro insumo ao catálogo.</p>
      </div>
    );
  }

  const getStockStatus = (current: number, red: number, yellow: number) => {
    if (current <= red) return { label: "Crítico", variant: "destructive" as const, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
    if (current <= yellow) return { label: "Baixo", variant: "outline" as const, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    return { label: "Saudável", variant: "secondary" as const, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest px-6">Insumo</TableHead>
              <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest px-6">Categoria</TableHead>
              <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest px-6">Estoque</TableHead>
              <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest px-6">Status</TableHead>
              <TableHead className="text-right text-slate-400 font-black uppercase text-[10px] tracking-widest px-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: any) => {
              const status = getStockStatus(item.current_stock, item.red_threshold, item.yellow_threshold);
              const catalog = item.catalog_item;
              return (
                <TableRow key={item.id} className="hover:bg-white/5 transition-colors border-white/5 group">
                  <TableCell className="px-6 py-4">
                    <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{catalog?.name}</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{catalog?.unit_default}</div>
                  </TableCell>
                  <TableCell className="px-6">
                    <Badge variant="outline" className="font-bold text-[10px] uppercase border-white/10 bg-white/5 text-slate-400">
                      {catalog?.category?.name || 'Geral'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6">
                    <div className="flex flex-col">
                      <span className={cn(
                        "font-black text-lg",
                        item.current_stock <= item.yellow_threshold ? "text-amber-400" : "text-white"
                      )}>
                        {item.current_stock}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold -mt-1 uppercase">Mín: {item.reorder_point}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6">
                    <Badge variant={status.variant} className={cn("font-black text-[10px] uppercase border", status.color)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                        onClick={() => setSelectedItem({ id: item.id, name: catalog?.name })}
                      >
                        <HistoryIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {items.map((item: any) => {
          const status = getStockStatus(item.current_stock, item.red_threshold, item.yellow_threshold);
          const catalog = item.catalog_item;
          return (
            <div 
              key={item.id}
              className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-xl relative overflow-hidden"
            >
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-10",
                status.color.split(' ')[1]
              )} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2 font-bold text-[9px] uppercase border-white/10 bg-white/5 text-slate-400">
                    {catalog?.category?.name || 'Geral'}
                  </Badge>
                  <h4 className="font-black text-lg text-white leading-tight">{catalog?.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{catalog?.unit_default}</p>
                </div>
                <Badge className={cn("font-black text-[9px] uppercase border", status.color)}>
                  {status.label}
                </Badge>
              </div>
              
              <div className="flex items-end justify-between">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Atual</span>
                    <span className={cn(
                      "text-2xl font-black leading-none",
                      item.current_stock <= item.yellow_threshold ? "text-amber-400" : "text-white"
                    )}>{item.current_stock}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Mínimo</span>
                    <span className="text-2xl font-black leading-none text-slate-700">{item.reorder_point}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="rounded-xl h-10 px-4 font-bold text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
                    onClick={() => setSelectedItem({ id: item.id, name: catalog?.name })}
                  >
                    <HistoryIcon className="h-4 w-4 mr-2" /> Histórico
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <MovementModal
          isOpen={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          itemId={selectedItem.id}
          itemName={selectedItem.name}
        />
      )}
    </div>
  );
};