import { db } from "@/db";
import { items } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { createdIds } = (await request.json()) as { createdIds: number[] };
    if (!createdIds?.length) {
      return NextResponse.json({ error: "Nenhum ID informado" }, { status: 400 });
    }

    const result = await db.delete(items).where(inArray(items.id, createdIds));
    const undone = Array.isArray(result) ? result.length : createdIds.length;

    return NextResponse.json({ undone, message: `${undone} itens removidos` });
  } catch (err) {
    console.error("Rollback error:", err);
    return NextResponse.json({ error: "Erro ao desfazer" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
