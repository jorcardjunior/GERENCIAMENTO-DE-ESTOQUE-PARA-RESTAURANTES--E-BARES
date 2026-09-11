import { db } from "@/db";
import { fichaTecnicaInsumos, fichasTecnicas } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const insumos = await db.query.fichaTecnicaInsumos.findMany({
    where: eq(fichaTecnicaInsumos.fichaTecnicaId, id),
    with: {
      catalogItem: true,
    },
    orderBy: (insumos, { asc }) => [asc(insumos.ordem)],
  });

  return NextResponse.json(insumos);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.insumoNome || body.quantidade === undefined || !body.unidade) {
      return NextResponse.json(
        { error: "insumoNome, quantidade e unidade são obrigatórios" },
        { status: 400 },
      );
    }

    const [insumo] = await db
      .insert(fichaTecnicaInsumos)
      .values({
        fichaTecnicaId: id,
        catalogItemId: body.catalogItemId || null,
        insumoNome: body.insumoNome,
        quantidade: String(body.quantidade),
        unidade: body.unidade,
        percentualPerda: String(body.percentualPerda || "0"),
        custoUnitario: String(body.custoUnitario || "0"),
        observacao: body.observacao || null,
        ordem: body.ordem || 0,
      })
      .returning();

    // Recalculate custoTotal and precoSugerido
    const allInsumos = await db.query.fichaTecnicaInsumos.findMany({
      where: eq(fichaTecnicaInsumos.fichaTecnicaId, id),
    });

    const custoTotal = allInsumos.reduce((sum, i) => {
      const qtd = Number(i.quantidade) || 0;
      const custo = Number(i.custoUnitario) || 0;
      const perda = Number(i.percentualPerda) || 0;
      return sum + qtd * custo * (1 + perda / 100);
    }, 0);

    await db
      .update(fichasTecnicas)
      .set({
        custoTotal: String(custoTotal),
        precoSugerido: String(custoTotal * 2.5),
        updatedAt: new Date(),
      })
      .where(eq(fichasTecnicas.id, id));

    return NextResponse.json(insumo);
  } catch (error: any) {
    console.error("Erro ao adicionar insumo:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao adicionar insumo" },
      { status: 500 },
    );
  }
}
