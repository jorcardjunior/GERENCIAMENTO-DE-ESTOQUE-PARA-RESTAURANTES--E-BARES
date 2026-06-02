import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "../services/inventoryService";
import { toast } from "sonner";
import { StockMovement } from "@/types/inventory/index";

/**
 * Hook para buscar estatísticas do dashboard.
 */
export const useInventoryStats = () => {
  return useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const items = await inventoryService.getInventoryItems();
      const lowStockCount = items.filter(i => i.current_stock <= i.yellow_threshold).length;
      const criticalStockCount = items.filter(i => i.current_stock <= i.red_threshold).length;
      
      return {
        totalItems: items.length,
        lowStockCount,
        criticalStockCount,
        items
      };
    },
  });
};

/**
 * Hook para buscar todos os itens do inventário.
 */
export const useInventoryItems = () => {
  return useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => inventoryService.getInventoryItems(),
  });
};

/**
 * Hook para adicionar uma nova movimentação de estoque.
 */
export const useAddMovement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (movement: any) => inventoryService.addMovement(movement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-movements'] });
      toast.success("Movimentação registrada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao registrar movimentação: ${error.message}`);
    }
  });
};

/**
 * Hook para buscar solicitações de itens (para admin).
 */
export const useItemRequests = () => {
  return useQuery({
    queryKey: ['item-requests'],
    queryFn: () => inventoryService.getItemRequests(),
  });
};

/**
 * Hook para criar uma nova solicitação de item.
 */
export const useCreateItemRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: any) => inventoryService.createItemRequest(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-requests'] });
      toast.success("Solicitação enviada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar solicitação: ${error.message}`);
    }
  });
};

/**
 * Hook para atualizar status de uma solicitação.
 */
export const useUpdateItemRequestStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => 
      inventoryService.updateRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-requests'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-items'] });
      toast.success("Status da solicitação atualizado!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar solicitação: ${error.message}`);
    }
  });
};
