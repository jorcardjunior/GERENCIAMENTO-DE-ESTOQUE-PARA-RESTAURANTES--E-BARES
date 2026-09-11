import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const data = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.active, true))
    .orderBy(asc(suppliers.name));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const [supplier] = await db
    .insert(suppliers)
    .values({
      name: body.name,
      contactName: body.contactName,
      phone: body.phone,
      email: body.email,
      address: body.address,
      cnpj: body.cnpj,
      notes: body.notes,
    })
    .returning();

  return NextResponse.json(supplier);
}
