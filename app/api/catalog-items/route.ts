import { db } from "@/db";
import { catalogItems } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = await db.select().from(catalogItems).orderBy(asc(catalogItems.name));

  return NextResponse.json(data);
}
