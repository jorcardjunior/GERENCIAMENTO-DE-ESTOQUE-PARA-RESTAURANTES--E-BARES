import { NextResponse } from "next/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const itemId = Number(id);

  const body = await request.json();
  const allowedFields = [
    "currentQuantity",
    "current_quantity",
    "expiryDate",
    "expiry_date",
    "countDate",
    "count_date",
    "responsibleUser",
    "responsible_user",
    "minStock",
    "min_stock",
    "name",
    "unit",
  ];

  const updateData: Record<string, any> = {};
  for (const key of allowedFields) {
    const dbKey = key.replace(/[A-Z]/g, (m: string) => `_${m.toLowerCase()}`);
    if (body[key] !== undefined) {
      updateData[dbKey] = body[key];
    }
  }

  if (body.responsibleUser !== undefined) {
    updateData.responsible_user = body.responsibleUser;
  }

  updateData.updated_at = new Date();

  const [item] = await db
    .update(items)
    .set(updateData)
    .where(eq(items.id, itemId))
    .returning();

  return NextResponse.json(item);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  const { id } = await params;
  const itemId = Number(id);

  await db.delete(items).where(eq(items.id, itemId));

  return NextResponse.json({ success: true });
}
