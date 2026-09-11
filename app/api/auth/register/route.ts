import { db } from "@/db";
import { estabelecimentos, user, users } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { normalizeName } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Provisiona um novo tenant no cadastro público.
 *
 * Fluxo: o cliente já chamou `authClient.signUp.email` (better-auth), o que
 * criou o `user` e a sessão. Esta rota é chamada em seguida, já autenticada,
 * para criar o `estabelecimentos` (tenant), definir o usuário como `owner`
 * e manter o espelho na tabela legada `users`.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { error: "Sessão não encontrada. Faça o cadastro novamente." },
        { status: 401 },
      );
    }

    // Usuário já provisionado não pode criar outra empresa por aqui
    if (session.companyId) {
      return NextResponse.json(
        {
          error: "Este usuário já está vinculado a um estabelecimento.",
          companyId: session.companyId,
        },
        { status: 409 },
      );
    }

    const body = await request.json();
    const companyName = normalizeName(body?.companyName);
    if (!companyName) {
      return NextResponse.json({ error: "Nome do estabelecimento é obrigatório" }, { status: 400 });
    }

    // 1. Cria o tenant
    const [company] = await db
      .insert(estabelecimentos)
      .values({
        nome: companyName,
        ownerId: session.userId,
        plan: "free",
        status: "ativo",
      })
      .returning({ id: estabelecimentos.id, nome: estabelecimentos.nome });

    // 2. Promove o usuário a owner + vincula à empresa
    const [updated] = await db
      .update(user)
      .set({
        role: "owner",
        companyId: company.id,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.userId))
      .returning({ id: user.id, name: user.name, email: user.email });

    // 3. Espelho na tabela legada (mantém compatibilidade)
    const [existingLegacy] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.email))
      .limit(1);

    if (!existingLegacy) {
      await db.insert(users).values({
        email: session.email,
        name: updated?.name || session.name,
        password: "managed-by-better-auth",
        role: "staff",
        authRole: "owner",
        companyId: company.id,
        betterAuthId: session.userId,
      });
    } else {
      await db
        .update(users)
        .set({
          name: updated?.name || session.name,
          authRole: "owner",
          companyId: company.id,
          betterAuthId: session.userId,
        })
        .where(eq(users.email, session.email));
    }

    return NextResponse.json({
      success: true,
      companyId: company.id,
      companyName: company.nome,
      role: "owner",
    });
  } catch (error) {
    console.error("Erro ao provisionar empresa:", error);
    return NextResponse.json({ error: "Erro interno ao criar estabelecimento" }, { status: 500 });
  }
}
