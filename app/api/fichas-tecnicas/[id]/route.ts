import { db } from "@/db";
import { fichaTecnicaInsumos, fichaTecnicaSubReceitas, fichasTecnicas } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const ficha = await db.query.fichasTecnicas.findFirst({
    where: eq(fichasTecnicas.id, id),
    with: {
      estabelecimento: true,
      insumos: {
        with: {
          catalogItem: true,
        },
        orderBy: (insumos, { asc }) => [asc(insumos.ordem)],
      },
      subReceitasPai: {
        with: {
          fichaTecnicaFilha: true,
        },
      },
      subReceitasFilha: {
        with: {
          fichaTecnicaPai: true,
        },
      },
    },
  });

  if (!ficha) {
    return NextResponse.json({ error: "Ficha técnica não encontrada" }, { status: 404 });
  }

  return NextResponse.json(ficha);
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

    if (body.nome !== undefined) updateData.nome = body.nome;
    if (body.estabelecimentoId !== undefined) updateData.estabelecimentoId = body.estabelecimentoId;
    if (body.categoria !== undefined) updateData.categoria = body.categoria;
    if (body.rendimento !== undefined) updateData.rendimento = String(body.rendimento);
    if (body.unidadeRendimento !== undefined) updateData.unidadeRendimento = body.unidadeRendimento;
    if (body.tempoPreparoMin !== undefined) updateData.tempoPreparoMin = body.tempoPreparoMin;
    if (body.modoPreparo !== undefined) updateData.modoPreparo = body.modoPreparo;
    if (body.custoTotal !== undefined) updateData.custoTotal = String(body.custoTotal);
    if (body.precoSugerido !== undefined) updateData.precoSugerido = String(body.precoSugerido);
    if (body.status !== undefined) updateData.status = body.status;

    updateData.updatedAt = new Date();

    const [ficha] = await db
      .update(fichasTecnicas)
      .set(updateData)
      .where(eq(fichasTecnicas.id, id))
      .returning();

    return NextResponse.json(ficha);
  } catch (error: any) {
    console.error("Erro ao atualizar ficha técnica:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao atualizar ficha técnica" },
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
    return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 });
  }

  const { id } = await params;

  await db.delete(fichaTecnicaInsumos).where(eq(fichaTecnicaInsumos.fichaTecnicaId, id));
  await db.delete(fichaTecnicaSubReceitas).where(eq(fichaTecnicaSubReceitas.fichaTecnicaPaiId, id));
  await db
    .delete(fichaTecnicaSubReceitas)
    .where(eq(fichaTecnicaSubReceitas.fichaTecnicaFilhaId, id));
  await db.delete(fichasTecnicas).where(eq(fichasTecnicas.id, id));

  return NextResponse.json({ success: true });
}
