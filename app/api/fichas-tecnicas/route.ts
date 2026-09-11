import { db } from "@/db";
import { fichasTecnicas } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const result = await db.query.fichasTecnicas.findMany({
    with: {
      estabelecimento: true,
      insumos: true,
    },
    orderBy: (fichasTecnicas, { asc }) => [asc(fichasTecnicas.nome)],
  });

  const list = result.map((f) => ({
    ...f,
    estabelecimentoNome: f.estabelecimento?.nome || null,
    insumosCount: f.insumos?.length || 0,
    estabelecimento: undefined,
    insumos: undefined,
  }));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.estabelecimentoId || !body.nome) {
      return NextResponse.json(
        { error: "estabelecimentoId e nome são obrigatórios" },
        { status: 400 },
      );
    }

    const [ficha] = await db
      .insert(fichasTecnicas)
      .values({
        estabelecimentoId: body.estabelecimentoId,
        nome: body.nome,
        categoria: body.categoria || "principal",
        rendimento: String(body.rendimento || "1"),
        unidadeRendimento: body.unidadeRendimento || "porcao",
        tempoPreparoMin: body.tempoPreparoMin || null,
        modoPreparo: body.modoPreparo || null,
        status: body.status || "ativo",
        createdBy: String(session.legacyUserId),
      })
      .returning();

    return NextResponse.json(ficha);
  } catch (error: any) {
    console.error("Erro ao criar ficha técnica:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao criar ficha técnica" },
      { status: 500 },
    );
  }
}
