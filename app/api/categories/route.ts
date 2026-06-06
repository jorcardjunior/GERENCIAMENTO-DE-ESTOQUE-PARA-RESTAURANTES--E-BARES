import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { normalizeCategoryName } from "@/lib/validation";
import { eq } from "drizzle-orm";

export async function GET() {
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
  const session = await getSession();
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
    .values({ name, color, createdBy: session.id })
    .returning();

  return NextResponse.json(category);
}
