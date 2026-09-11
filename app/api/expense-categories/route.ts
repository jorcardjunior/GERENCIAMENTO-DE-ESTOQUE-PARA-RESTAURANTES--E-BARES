import { db } from "@/db";
import { expenseCategories } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const user = await getSession(req.headers);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const estabId = searchParams.get("estabelecimentoId");

    const categories = await db.query.expenseCategories.findMany({
      where: estabId ? eq(expenseCategories.estabelecimentoId, estabId) : undefined,
      orderBy: [asc(expenseCategories.name)],
    });

    return NextResponse.json(categories);
  } catch (_error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSession(req.headers);
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, color, estabelecimentoId } = body;

    if (!name || !estabelecimentoId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newCategory = await db
      .insert(expenseCategories)
      .values({
        name,
        color: color || "#3b82f6",
        estabelecimentoId,
      })
      .returning();

    return NextResponse.json(newCategory[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
