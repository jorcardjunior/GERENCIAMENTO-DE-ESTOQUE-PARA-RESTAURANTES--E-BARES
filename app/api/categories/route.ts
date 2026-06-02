import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { getSession } from "@/lib/auth";
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
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const [category] = await db
    .insert(categories)
    .values({ name, createdBy: session.id })
    .returning();

  return NextResponse.json(category);
}
