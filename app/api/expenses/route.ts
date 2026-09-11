import { db } from "@/db";
import { expenses } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const user = await getSession(req.headers);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const estabId = searchParams.get("estabelecimentoId");

    const allExpenses = await db.query.expenses.findMany({
      where: estabId ? eq(expenses.estabelecimentoId, estabId) : undefined,
      orderBy: [desc(expenses.date)],
      with: {
        category: true,
      },
    });

    return NextResponse.json(allExpenses);
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
    const { description, amount, date, categoryId, estabelecimentoId } = body;

    if (!description || !amount || !date || !categoryId || !estabelecimentoId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newExpense = await db
      .insert(expenses)
      .values({
        description,
        amount: String(amount),
        date,
        categoryId,
        estabelecimentoId,
        paid: body.paid || false,
      })
      .returning();

    return NextResponse.json(newExpense[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
