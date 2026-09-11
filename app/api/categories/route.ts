import { db } from "@/db";
import { categories } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth-server";
import { normalizeCategoryName } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const result = await db.query.categories.findMany({
    with: {
      items: {
        with: {
          responsible: true,
        },
      },
      user: true,
    },
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let { name, color } = await request.json();
  name = normalizeCategoryName(name);
  if (!name) {
    return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
  }
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    color = "#2563eb";
  }

  const [category] = await db
    .insert(categories)
    .values({ name, color, createdBy: session.legacyUserId })
    .returning();

  await logAudit({
    action: "CREATE",
    tableName: "categories",
    recordId: String(category.id),
    userId: session.userId,
    newValues: { name, color },
  });

  return NextResponse.json(category);
}
