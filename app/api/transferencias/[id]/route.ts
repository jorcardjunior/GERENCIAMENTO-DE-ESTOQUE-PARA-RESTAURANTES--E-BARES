import { db } from "@/db";
import { catalogItems, estabelecimentos, transferenciaItens, transferencias } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pendente: ["enviado", "cancelado"],
  enviado: ["recebido", "cancelado"],
  recebido: [],
  cancelado: [],
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const [transferencia] = await db
    .select({
      id: transferencias.id,
      estabelecimentoOrigemId: transferencias.estabelecimentoOrigemId,
      estabelecimentoDestinoId: transferencias.estabelecimentoDestinoId,
      status: transferencias.status,
      observacao: transferencias.observacao,
      createdBy: transferencias.createdBy,
      createdAt: transferencias.createdAt,
      updatedAt: transferencias.updatedAt,
      origemNome: sql<string>`(SELECT nome FROM ${estabelecimentos} WHERE id = ${transferencias.estabelecimentoOrigemId})`,
      destinoNome: sql<string>`(SELECT nome FROM ${estabelecimentos} WHERE id = ${transferencias.estabelecimentoDestinoId})`,
    })
    .from(transferencias)
    .where(eq(transferencias.id, id));

  if (!transferencia) {
    return NextResponse.json({ error: "Transferência não encontrada" }, { status: 404 });
  }

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

  return NextResponse.json({ ...transferencia, itens });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.select().from(transferencias).where(eq(transferencias.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Transferência não encontrada" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    if (body.status !== undefined) {
      const validNext = VALID_TRANSITIONS[existing.status];
      if (!validNext.includes(body.status)) {
        return NextResponse.json(
          { error: `Transição inválida: ${existing.status} -> ${body.status}` },
          { status: 400 },
        );
      }
      updateData.status = body.status;
    }

    if (body.observacao !== undefined) {
      updateData.observacao = body.observacao;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    const [updated] = await db
      .update(transferencias)
      .set(updateData)
      .where(eq(transferencias.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Erro ao atualizar transferência:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao atualizar transferência" },
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
      { error: "Apenas administradores podem excluir transferências" },
      { status: 403 },
    );
  }

  const { id } = await params;

  await db.delete(transferenciaItens).where(eq(transferenciaItens.transferenciaId, id));
  await db.delete(transferencias).where(eq(transferencias.id, id));

  return NextResponse.json({ success: true });
}
