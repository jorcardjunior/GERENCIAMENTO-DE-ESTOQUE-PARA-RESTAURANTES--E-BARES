import { db } from "@/db";
import { items } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth-server";
import { normalizeItemName } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const result = await db.query.items.findMany({
      with: { category: true, responsible: true },
      orderBy: (items, { asc }) => [asc(items.name)],
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao listar itens:", error);
    return NextResponse.json({ error: "Erro interno ao listar itens" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    let { categoryId, name, unit, minStock, currentQuantity, unitPrice } = await request.json();
    name = normalizeItemName(name);

    if (!categoryId || !name) {
      return NextResponse.json({ error: "Categoria e nome são obrigatórios" }, { status: 400 });
    }

    const [item] = await db
      .insert(items)
      .values({
        categoryId,
        name,
        unit: unit || "un",
        minStock: String(Number(minStock) || 0),
        currentQuantity: String(Number(currentQuantity) || 0),
        unitPrice:
          unitPrice === null || unitPrice === "" || unitPrice === undefined
            ? null
            : String(Number(unitPrice) || 0),
      })
      .returning();

    await logAudit({
      action: "CREATE",
      tableName: "items",
      recordId: String(item.id),
      userId: session.userId,
      newValues: { categoryId, name, unit, minStock, currentQuantity, unitPrice },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Erro ao adicionar item:", error);
    return NextResponse.json({ error: "Erro interno ao adicionar item" }, { status: 500 });
  }
}
