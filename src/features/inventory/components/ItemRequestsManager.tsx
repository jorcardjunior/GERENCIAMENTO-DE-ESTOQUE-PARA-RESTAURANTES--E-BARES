import { useState } from "react";
import { useItemRequests, useUpdateItemRequestStatus } from "@/features/inventory/hooks/useInventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const ItemRequestsManager = () => {
  const { data: requests, isLoading } = useItemRequests();
  const updateStatus = useUpdateItemRequestStatus();

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem]">
      <CardHeader>
        <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">Solicitações de Novos Itens</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests?.map((req: any) => (
            <div key={req.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <p className="font-bold text-white">{req.name}</p>
                <p className="text-xs text-slate-400">Solicitado por: {req.requested_by_profile?.name} em {format(new Date(req.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                {req.notes && <p className="text-sm mt-1 text-slate-300 italic">"{req.notes}"</p>}
              </div>
              {req.status === 'pending' ? (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-emerald-500 hover:bg-emerald-600 rounded-xl"
                    onClick={() => updateStatus.mutate({ id: req.id, status: 'approved' })}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-rose-500 hover:bg-rose-600 rounded-xl"
                    onClick={() => updateStatus.mutate({ id: req.id, status: 'rejected' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span className={`font-black uppercase text-[10px] ${req.status === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {req.status}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};