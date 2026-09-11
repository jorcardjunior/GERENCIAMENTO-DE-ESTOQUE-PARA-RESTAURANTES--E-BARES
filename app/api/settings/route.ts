import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { ADMIN_SETTINGS_KEYS, DEFAULT_SETTINGS } from "@/lib/settings";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const ALLOWED_KEYS = new Set(ADMIN_SETTINGS_KEYS);

export async function GET(request: Request) {
  try {
    const session = await getSession(request.headers);
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
    const session = await getSession(request.headers);
    if (!session || (session.role !== "admin" && session.role !== "owner")) {
      return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, string>;

    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_KEYS.has(key as any)) continue;

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
        await db.insert(settings).values({ key, value });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erro ao salvar configurações" },
      { status: 500 },
    );
  }
}
