import { db } from "@/db";
import { user, users } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { normalizeName } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const session = await getSession(request.headers);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!session.mustChangePassword) {
      return NextResponse.json({ error: "Senha já foi alterada" }, { status: 400 });
    }

    const { email, name, currentPassword, password } = await request.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 });
    }

    const changeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        currentPassword: currentPassword || password,
        newPassword: password,
      }),
    });

    if (!changeRes.ok) {
      const err = await changeRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || err.statusText || "Erro ao alterar senha" },
        { status: changeRes.status },
      );
    }

    await db
      .update(user)
      .set({
        email: email || session.email,
        name: name ? normalizeName(name) : session.name,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.userId));

    await db
      .update(users)
      .set({
        email: email || session.email,
        name: name ? normalizeName(name) : session.name,
      })
      .where(eq(users.email, session.email));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
