import { db } from "@/db";
import {
  catalogItems,
  estabelecimentos,
  pedidoCompraItens,
  pedidosCompra,
  suppliers,
} from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const [pedido] = await db
      .select({
        id: pedidosCompra.id,
        estabelecimentoId: pedidosCompra.estabelecimentoId,
        supplierId: pedidosCompra.supplierId,
        fornecedorNome: pedidosCompra.fornecedorNome,
        numeroPedido: pedidosCompra.numeroPedido,
        status: pedidosCompra.status,
        dataPedido: pedidosCompra.dataPedido,
        dataPrevista: pedidosCompra.dataPrevista,
        dataRecebimento: pedidosCompra.dataRecebimento,
        valorTotal: pedidosCompra.valorTotal,
        observacao: pedidosCompra.observacao,
        createdBy: pedidosCompra.createdBy,
        createdAt: pedidosCompra.createdAt,
        updatedAt: pedidosCompra.updatedAt,
        estabelecimento: estabelecimentos,
        supplier: suppliers,
      })
      .from(pedidosCompra)
      .leftJoin(estabelecimentos, eq(pedidosCompra.estabelecimentoId, estabelecimentos.id))
      .leftJoin(suppliers, eq(pedidosCompra.supplierId, suppliers.id))
      .where(eq(pedidosCompra.id, id));

    if (!pedido) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const itens = await db
      .select({
        id: pedidoCompraItens.id,
        pedidoCompraId: pedidoCompraItens.pedidoCompraId,
        catalogItemId: pedidoCompraItens.catalogItemId,
        itemNome: pedidoCompraItens.itemNome,
        quantidade: pedidoCompraItens.quantidade,
        unidade: pedidoCompraItens.unidade,
        quantidadeRecebida: pedidoCompraItens.quantidadeRecebida,
        valorUnitario: pedidoCompraItens.valorUnitario,
        observacao: pedidoCompraItens.observacao,
        catalogItemNome: catalogItems.name,
      })
      .from(pedidoCompraItens)
      .leftJoin(catalogItems, eq(pedidoCompraItens.catalogItemId, catalogItems.id))
      .where(eq(pedidoCompraItens.pedidoCompraId, id))
      .orderBy(pedidoCompraItens.id);

    return NextResponse.json({ ...pedido, itens });
  } catch (error: any) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao buscar pedido" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {};

    if (body.estabelecimentoId !== undefined) updateData.estabelecimentoId = body.estabelecimentoId;
    if (body.supplierId !== undefined) updateData.supplierId = body.supplierId || null;
    if (body.fornecedorNome !== undefined) updateData.fornecedorNome = body.fornecedorNome;
    if (body.numeroPedido !== undefined) updateData.numeroPedido = body.numeroPedido;
    if (body.dataPedido !== undefined) updateData.dataPedido = body.dataPedido;
    if (body.dataPrevista !== undefined) updateData.dataPrevista = body.dataPrevista || null;
    if (body.observacao !== undefined) updateData.observacao = body.observacao;

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "recebido") {
        updateData.dataRecebimento = new Date();
      }
    }

    updateData.updatedAt = new Date();

    const [pedido] = await db
      .update(pedidosCompra)
      .set(updateData)
      .where(eq(pedidosCompra.id, id))
      .returning();

    if (body.status === "recebido") {
      const itens = await db
        .select()
        .from(pedidoCompraItens)
        .where(eq(pedidoCompraItens.pedidoCompraId, id));

      const valorTotal = itens.reduce((sum, item) => {
        const qtdRecebida = Number(item.quantidadeRecebida) || Number(item.quantidade) || 0;
        const valorUn = Number(item.valorUnitario) || 0;
        return sum + qtdRecebida * valorUn;
      }, 0);

      await db
        .update(pedidosCompra)
        .set({ valorTotal: String(valorTotal), updatedAt: new Date() })
        .where(eq(pedidosCompra.id, id));

      pedido.valorTotal = String(valorTotal);
    }

    return NextResponse.json(pedido);
  } catch (error: any) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao atualizar pedido" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (session.role !== "admin" && session.role !== "owner") {
    return NextResponse.json(
      { error: "Apenas administradores podem excluir pedidos" },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;

    await db.delete(pedidoCompraItens).where(eq(pedidoCompraItens.pedidoCompraId, id));
    await db.delete(pedidosCompra).where(eq(pedidosCompra.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir pedido:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao excluir pedido" },
      { status: 500 },
    );
  }
}
