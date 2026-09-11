import { db } from "@/db";
import { estabelecimentos, user } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [authUser] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, session.userId))
    .limit(1);

  if (!authUser) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const [company] = authUser.companyId
    ? await db
        .select({ name: estabelecimentos.nome, plan: estabelecimentos.plan })
        .from(estabelecimentos)
        .where(eq(estabelecimentos.id, authUser.companyId))
        .limit(1)
    : [];

  return NextResponse.json({ user: { ...authUser, company: company || null } });
}
