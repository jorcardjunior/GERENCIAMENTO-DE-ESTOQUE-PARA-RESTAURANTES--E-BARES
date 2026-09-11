import { db } from "@/db";
import { estabelecimentos, transferencias } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const origemNome = searchParams.get("origemNome");
  const destinoNome = searchParams.get("destinoNome");
  const status = searchParams.get("status");
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  const conditions = [];

  if (status) {
    conditions.push(eq(transferencias.status, status as any));
  }
  if (dataInicio) {
    conditions.push(sql`${transferencias.createdAt} >= ${new Date(dataInicio)}`);
  }
  if (dataFim) {
    conditions.push(sql`${transferencias.createdAt} <= ${new Date(dataFim)}`);
  }
  if (origemNome) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM ${estabelecimentos} WHERE ${estabelecimentos.id} = ${transferencias.estabelecimentoOrigemId} AND ${ilike(estabelecimentos.nome, `%${origemNome}%`)})`,
    );
  }
  if (destinoNome) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM ${estabelecimentos} WHERE ${estabelecimentos.id} = ${transferencias.estabelecimentoDestinoId} AND ${ilike(estabelecimentos.nome, `%${destinoNome}%`)})`,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
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
      itensCount: sql<number>`(SELECT COUNT(*) FROM transferencia_itens WHERE transferencia_id = ${transferencias.id})`,
    })
    .from(transferencias)
    .where(where)
    .orderBy(desc(transferencias.createdAt));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { estabelecimentoOrigemId, estabelecimentoDestinoId, observacao } = body;

  if (!estabelecimentoOrigemId) {
    return NextResponse.json({ error: "Estabelecimento de origem é obrigatório" }, { status: 400 });
  }
  if (!estabelecimentoDestinoId) {
    return NextResponse.json(
      { error: "Estabelecimento de destino é obrigatório" },
      { status: 400 },
    );
  }
  if (estabelecimentoOrigemId === estabelecimentoDestinoId) {
    return NextResponse.json({ error: "Origem e destino devem ser diferentes" }, { status: 400 });
  }

  const [transferencia] = await db
    .insert(transferencias)
    .values({
      estabelecimentoOrigemId,
      estabelecimentoDestinoId,
      observacao: observacao || null,
      createdBy: String(session.legacyUserId),
    })
    .returning();

  return NextResponse.json(transferencia, { status: 201 });
}
