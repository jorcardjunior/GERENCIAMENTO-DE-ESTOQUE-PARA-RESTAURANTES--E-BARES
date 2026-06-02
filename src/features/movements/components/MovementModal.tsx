import { Button } from "@/components/ui/button";
import { inventoryService } from "@/features/inventory/services/inventoryService";
import { FileText, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useState } from "react";
import { useAddMovement } from "@/features/inventory/hooks/useInventory";

interface MovementModalProps {
  itemId: string;
  itemName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal para registro de movimentações de estoque.
 * Permite ao usuário registrar entradas, saídas e perdas de forma rápida.
 */
export const MovementModal = ({ itemId, itemName, isOpen, onOpenChange }: MovementModalProps) => {
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState<'IN' | 'OUT' | 'LOSS' | 'ADJUST'>('IN');
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const addMovement = useAddMovement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) return;

    let documentUrl = undefined;
    if (file) {
      setIsUploading(true);
      try {
        const path = `${itemId}/${Date.now()}_${file.name}`;
        documentUrl = await inventoryService.uploadFile('movement-docs', path, file);
      } catch (err) {
        console.error("Upload error", err);
      } finally {
        setIsUploading(false);
      }
    }

    await addMovement.mutateAsync({
      inventory_item_id: itemId,
      qty: parseFloat(quantity),
      type,
      reason: reason || undefined,
      document_url: documentUrl,
      document_type: file?.type.includes('pdf') ? 'pdf' : 'image'
    });

    onOpenChange(false);
    setQuantity("");
    setReason("");
    setFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Movimentação</DialogTitle>
            <DialogDescription>
              Ajuste o estoque de <strong>{itemName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo de Operação</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Entrada (Compra/Reposição)</SelectItem>
                  <SelectItem value="OUT">Saída (Consumo/Venda)</SelectItem>
                  <SelectItem value="LOSS">Perda (Vencimento/Quebra)</SelectItem>
                  <SelectItem value="ADJUST">Ajuste (Correção de Inventário)</SelectItem>

                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Observação (Opcional)</Label>
              <Input
                id="reason"
                placeholder="Ex: Nota Fiscal #123 ou Vencimento"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Comprovante / Anexo (Opcional)</Label>
              {!file ? (
                <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-white/5 transition-colors cursor-pointer relative">
                  <Upload className="h-6 w-6 text-slate-500 mb-2" />
                  <span className="text-xs text-slate-500 font-medium">Clique para anexar PDF ou Imagem</span>
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept="image/*,application/pdf"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-emerald-500 font-bold truncate">{file.name}</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={addMovement.isPending || isUploading} className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-black">
              {addMovement.isPending || isUploading ? "Processando..." : "Confirmar Movimentação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
