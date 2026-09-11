import { db } from "@/db";
import { estabelecimentos, invitations, user, users } from "@/db/schema";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const BASE_URL = env.BETTER_AUTH_URL || "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const { token, name, password } = await request.json();
    if (!token || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Token e senha (mín. 6 caracteres) são obrigatórios" },
        { status: 400 },
      );
    }

    const [invite] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: "Convite inválido ou expirado" }, { status: 404 });
    }
    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Este convite já foi utilizado" }, { status: 400 });
    }
    if (new Date(invite.expiresAt) < new Date()) {
      await db.update(invitations).set({ status: "expired" }).where(eq(invitations.id, invite.id));
      return NextResponse.json({ error: "Convite expirado. Solicite um novo." }, { status: 410 });
    }

    // Create user via better-auth API
    const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({
        name: name || invite.name,
        email: invite.email,
        password,
      }),
    });

    if (!signUpRes.ok) {
      const err = await signUpRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || err.code || "Erro ao criar conta" },
        { status: signUpRes.status },
      );
    }

    const data = await signUpRes.json();
    const betterUserId = data.user.id;

    // Link to company and set role
    await db
      .update(user)
      .set({
        companyId: invite.companyId,
        role: invite.role,
        name: name || invite.name,
        mustChangePassword: false,
      })
      .where(eq(user.id, betterUserId));

    // Create legacy user entry
    await db
      .insert(users)
      .values({
        email: invite.email,
        password: "managed-by-better-auth",
        name: name || invite.name,
        role: "staff",
        authRole: invite.role,
        companyId: invite.companyId,
        betterAuthId: betterUserId,
      })
      .onConflictDoNothing({ target: users.email });

    // Mark invitation as accepted
    await db
      .update(invitations)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(invitations.id, invite.id));

    return NextResponse.json({ success: true, message: "Conta ativada com sucesso!" });
  } catch (error) {
    console.error("Erro ao ativar conta:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token é obrigatório" }, { status: 400 });
  }

  const [invite] = await db
    .select({
      email: invitations.email,
      name: invitations.name,
      role: invitations.role,
      companyName: estabelecimentos.nome,
    })
    .from(invitations)
    .where(eq(invitations.token, token))
    .leftJoin(estabelecimentos, eq(invitations.companyId, estabelecimentos.id))
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "Convite inválido" }, { status: 404 });
  }

  return NextResponse.json({ invite });
}
