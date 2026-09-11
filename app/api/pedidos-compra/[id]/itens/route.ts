import { db } from "@/db";
import { pedidoCompraItens, pedidosCompra } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const itens = await db
      .select()
      .from(pedidoCompraItens)
      .where(eq(pedidoCompraItens.pedidoCompraId, id))
      .orderBy(pedidoCompraItens.id);

    return NextResponse.json(itens);
  } catch (error: any) {
    console.error("Erro ao listar itens do pedido:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao listar itens" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.itemNome || !body.quantidade || !body.unidade) {
      return NextResponse.json(
        { error: "Nome do item, quantidade e unidade são obrigatórios" },
        { status: 400 },
      );
    }

    const [item] = await db
      .insert(pedidoCompraItens)
      .values({
        pedidoCompraId: id,
        catalogItemId: body.catalogItemId || null,
        itemNome: body.itemNome,
        quantidade: String(body.quantidade),
        unidade: body.unidade,
        valorUnitario: body.valorUnitario !== undefined ? String(body.valorUnitario) : "0",
        observacao: body.observacao || null,
      })
      .returning();

    const totalResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(quantidade AS NUMERIC) * CAST(valor_unitario AS NUMERIC)), '0')`,
      })
      .from(pedidoCompraItens)
      .where(eq(pedidoCompraItens.pedidoCompraId, id));

    const valorTotal = totalResult[0]?.total || "0";

    await db
      .update(pedidosCompra)
      .set({ valorTotal, updatedAt: new Date() })
      .where(eq(pedidosCompra.id, id));

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Erro ao adicionar item:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao adicionar item" },
      { status: 500 },
    );
  }
}
