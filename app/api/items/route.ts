import { NextResponse } from "next/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { normalizeItemName } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getSession();
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
        unitPrice: unitPrice === null || unitPrice === "" || unitPrice === undefined ? null : String(Number(unitPrice) || 0),
      })
      .returning();

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Erro ao adicionar item:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao adicionar item" },
      { status: 500 }
    );
  }
}
