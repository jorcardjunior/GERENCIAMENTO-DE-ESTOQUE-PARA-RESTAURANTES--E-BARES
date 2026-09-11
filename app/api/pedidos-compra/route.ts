import { db } from "@/db";
import { estabelecimentos, pedidosCompra, suppliers } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const pedidos = await db
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
        estabelecimentoNome: estabelecimentos.nome,
        supplierNome: suppliers.name,
        itemsCount: sql<number>`(SELECT COUNT(*) FROM pedido_compra_itens WHERE pedido_compra_itens.pedido_compra_id = ${pedidosCompra.id})`,
      })
      .from(pedidosCompra)
      .leftJoin(estabelecimentos, eq(pedidosCompra.estabelecimentoId, estabelecimentos.id))
      .leftJoin(suppliers, eq(pedidosCompra.supplierId, suppliers.id))
      .orderBy(desc(pedidosCompra.createdAt));

    return NextResponse.json(pedidos);
  } catch (error: any) {
    console.error("Erro ao listar pedidos:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao listar pedidos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.estabelecimentoId) {
      return NextResponse.json({ error: "Estabelecimento é obrigatório" }, { status: 400 });
    }

    const [pedido] = await db
      .insert(pedidosCompra)
      .values({
        estabelecimentoId: body.estabelecimentoId,
        supplierId: body.supplierId || null,
        fornecedorNome: body.fornecedorNome || null,
        numeroPedido: body.numeroPedido || null,
        dataPedido: body.dataPedido || new Date().toISOString().split("T")[0],
        dataPrevista: body.dataPrevista || null,
        observacao: body.observacao || null,
        createdBy: String(session.legacyUserId),
      })
      .returning();

    return NextResponse.json(pedido);
  } catch (error: any) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao criar pedido" },
      { status: 500 },
    );
  }
}
