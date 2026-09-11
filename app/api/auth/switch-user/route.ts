import { db } from "@/db";
import { user } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { auth, getSession } from "@/lib/auth-server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const currentSession = await getSession(request.headers);
    if (!currentSession) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { targetEmail, targetPassword } = await request.json();
    if (!targetEmail || !targetPassword) {
      return NextResponse.json(
        { error: "Email e senha do usuário alvo são obrigatórios" },
        { status: 400 },
      );
    }

    const [targetUser] = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.email, targetEmail))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const signInRes = await auth.api.signInEmail({
      body: { email: targetEmail, password: targetPassword },
      headers: new Headers({ cookie: cookieHeader }),
    });

    if (!signInRes?.token) {
      return NextResponse.json({ error: "Senha do usuário alvo incorreta" }, { status: 401 });
    }

    await logAudit({
      action: "SWITCH_USER",
      tableName: "user",
      recordId: targetUser.id,
      userId: currentSession.userId,
      newValues: {
        switchedToUserId: targetUser.id,
        switchedToEmail: targetUser.email,
        switchedToName: targetUser.name,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
    });
  } catch (error: any) {
    console.error("Erro ao trocar de usuário:", error);
    return NextResponse.json({ error: "Erro interno ao trocar de usuário" }, { status: 500 });
  }
}
