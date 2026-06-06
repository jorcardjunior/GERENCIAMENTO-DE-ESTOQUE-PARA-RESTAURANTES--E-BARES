import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { normalizeCategoryName } from "@/lib/validation";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const categoryId = Number(id);
    const body = await request.json();

    const updateData: Record<string, any> = {};

    if (body.name !== undefined) {
      updateData.name = normalizeCategoryName(body.name);
    }
    if (body.color !== undefined) {
      updateData.color = body.color;
    }

    const [category] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning();

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao atualizar categoria" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const categoryId = Number(id);

  await db.delete(items).where(eq(items.categoryId, categoryId));
  await db.delete(categories).where(eq(categories.id, categoryId));

  return NextResponse.json({ success: true });
}
