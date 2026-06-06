import { NextResponse } from "next/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { normalizeItemName } from "@/lib/validation";
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
    const itemId = Number(id);

    const body = await request.json();

    const updateData: Record<string, any> = {};

    if (body.currentQuantity !== undefined || body.current_quantity !== undefined) {
      const val = body.currentQuantity !== undefined ? body.currentQuantity : body.current_quantity;
      updateData.currentQuantity = String(Number(val) || 0);
    }
    if (body.expiryDate !== undefined || body.expiry_date !== undefined) {
      const val = body.expiryDate !== undefined ? body.expiryDate : body.expiry_date;
      updateData.expiryDate = val || null;
    }
    if (body.countDate !== undefined || body.count_date !== undefined) {
      const val = body.countDate !== undefined ? body.countDate : body.count_date;
      updateData.countDate = val;
    }
    if (body.responsibleUser !== undefined || body.responsible_user !== undefined) {
      const val = body.responsibleUser !== undefined ? body.responsibleUser : body.responsible_user;
      updateData.responsibleUser = val || null;
    }
    if (body.minStock !== undefined || body.min_stock !== undefined) {
      const val = body.minStock !== undefined ? body.minStock : body.min_stock;
      updateData.minStock = String(Number(val) || 0);
    }
    if (body.name !== undefined) {
      updateData.name = normalizeItemName(body.name);
    }
    if (body.unit !== undefined) {
      updateData.unit = body.unit;
    }
    if (body.unitPrice !== undefined || body.unit_price !== undefined) {
      const val = body.unitPrice !== undefined ? body.unitPrice : body.unit_price;
      updateData.unitPrice = val === null || val === "" ? null : String(Number(val) || 0);
    }

    updateData.updatedAt = new Date();

    const [item] = await db
      .update(items)
      .set(updateData)
      .where(eq(items.id, itemId))
      .returning();

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Erro ao atualizar item:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao atualizar item" },
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
  const itemId = Number(id);

  await db.delete(items).where(eq(items.id, itemId));

  return NextResponse.json({ success: true });
}
