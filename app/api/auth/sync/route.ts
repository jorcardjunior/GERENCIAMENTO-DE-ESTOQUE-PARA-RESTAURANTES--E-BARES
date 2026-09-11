import { db } from "@/db";
import { user, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = body;
    if (!email) {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    }

    const [existingUser] = await db
      .select({ id: user.id, name: user.name, role: user.role })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json({ error: "Usuário não encontrado no auth" }, { status: 404 });
    }

    const [existingLegacy] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existingLegacy) {
      await db.insert(users).values({
        email,
        name: name || existingUser.name,
        password: "better-auth",
        role: (existingUser.role as any) || "staff",
        betterAuthId: existingUser.id,
      });
    } else {
      await db
        .update(users)
        .set({ name: name || existingUser.name, betterAuthId: existingUser.id })
        .where(eq(users.email, email));
    }

    return NextResponse.json({ synced: true });
  } catch (error) {
    console.error("Erro ao sincronizar usuário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
