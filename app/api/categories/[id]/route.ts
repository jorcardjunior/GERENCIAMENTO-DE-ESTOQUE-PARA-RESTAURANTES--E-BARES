import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

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
