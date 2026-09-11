import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth-server";
import { normalizeCategoryName } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const categoryId = Number(id);

    const [oldCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

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

    await logAudit({
      action: "UPDATE",
      tableName: "categories",
      recordId: String(categoryId),
      userId: session.userId,
      oldValues: oldCategory,
      newValues: { ...oldCategory, ...updateData },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar categoria" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const categoryId = Number(id);

  const [oldCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  await db.delete(items).where(eq(items.categoryId, categoryId));
  await db.delete(categories).where(eq(categories.id, categoryId));

  await logAudit({
    action: "DELETE",
    tableName: "categories",
    recordId: String(categoryId),
    userId: session.userId,
    oldValues: oldCategory,
  });

  return NextResponse.json({ success: true });
}
