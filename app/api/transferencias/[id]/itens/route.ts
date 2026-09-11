import { db } from "@/db";
import { catalogItems, transferenciaItens, transferencias } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const itens = await db
    .select({
      id: transferenciaItens.id,
      transferenciaId: transferenciaItens.transferenciaId,
      catalogItemId: transferenciaItens.catalogItemId,
      quantidade: transferenciaItens.quantidade,
      unidade: transferenciaItens.unidade,
      lote: transferenciaItens.lote,
      catalogItemNome: sql<string>`(SELECT name FROM ${catalogItems} WHERE id = ${transferenciaItens.catalogItemId})`,
    })
    .from(transferenciaItens)
    .where(eq(transferenciaItens.transferenciaId, id));

  return NextResponse.json(itens);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { catalogItemId, quantidade, unidade, lote } = body;

    const [transferencia] = await db.select().from(transferencias).where(eq(transferencias.id, id));

    if (!transferencia) {
      return NextResponse.json({ error: "Transferência não encontrada" }, { status: 404 });
    }

    if (!catalogItemId) {
      return NextResponse.json({ error: "Item de catálogo é obrigatório" }, { status: 400 });
    }
    if (!quantidade) {
      return NextResponse.json({ error: "Quantidade é obrigatória" }, { status: 400 });
    }
    if (!unidade) {
      return NextResponse.json({ error: "Unidade é obrigatória" }, { status: 400 });
    }

    const [item] = await db
      .insert(transferenciaItens)
      .values({
        transferenciaId: id,
        catalogItemId,
        quantidade,
        unidade,
        lote: lote || null,
      })
      .returning();

    const [itemWithName] = await db
      .select({
        id: transferenciaItens.id,
        transferenciaId: transferenciaItens.transferenciaId,
        catalogItemId: transferenciaItens.catalogItemId,
        quantidade: transferenciaItens.quantidade,
        unidade: transferenciaItens.unidade,
        lote: transferenciaItens.lote,
        catalogItemNome: sql<string>`(SELECT name FROM ${catalogItems} WHERE id = ${transferenciaItens.catalogItemId})`,
      })
      .from(transferenciaItens)
      .where(eq(transferenciaItens.id, item.id));

    return NextResponse.json(itemWithName, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao adicionar item:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao adicionar item" },
      { status: 500 },
    );
  }
}
