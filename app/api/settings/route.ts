import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

const DEFAULT_SETTINGS = {
  alert_expiry_days: "7",
  alert_low_stock_pct: "10",
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const rows = await db.select().from(settings);
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }

    return NextResponse.json({ ...DEFAULT_SETTINGS, ...map });
  } catch {
    return NextResponse.json({ ...DEFAULT_SETTINGS });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
    }

    const body = await request.json() as Record<string, string>;

    for (const [key, value] of Object.entries(body)) {
      if (!(key in DEFAULT_SETTINGS)) continue;

      const existing = await db
        .select({ id: settings.id })
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ value, updatedAt: new Date() })
          .where(eq(settings.key, key));
      } else {
        await db
          .insert(settings)
          .values({ key, value });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}
