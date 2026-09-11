import { db } from "@/db";
import { user, users } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { normalizeName } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

/** Garante que o session tem permissão de gestão (owner|admin) e tenant. */
function ensureManager(s: Awaited<ReturnType<typeof getSession>>) {
  if (!s) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (s.role !== "owner" && s.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }
  if (!s.companyId) {
    return NextResponse.json({ error: "Sem estabelecimento vinculado" }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  const denied = ensureManager(session);
  if (denied) return denied;
  const companyId = session!.companyId!;

  // Lista apenas os membros da empresa (tenant) do usuário logado
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      authRole: users.authRole,
      mustChangePassword: user.mustChangePassword,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(user, eq(users.betterAuthId, user.id))
    .where(eq(users.companyId, companyId))
    .orderBy(users.name);

  return NextResponse.json(allUsers);
}

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  const denied = ensureManager(session);
  if (denied) return denied;
  const companyId = session!.companyId!;

  let { name, email, password, role } = await request.json();
  name = normalizeName(name);
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 });
  }

  // Use better-auth sign-up to create user with correct password hashing
  const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({ name, email, password }),
  });

  if (!signUpRes.ok) {
    const err = await signUpRes.json();
    return NextResponse.json(
      { error: err.message || err.code || "Erro ao criar usuário" },
      { status: signUpRes.status },
    );
  }

  const data = await signUpRes.json();
  const userId = data.user.id;

  await db
    .update(user)
    .set({ role: role || "funcionario", companyId, mustChangePassword: true })
    .where(eq(user.id, userId));

  const existingLegacy = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!existingLegacy) {
    await db.insert(users).values({
      email,
      name,
      password: "managed-by-better-auth",
      role: role || "staff",
      authRole: role || "funcionario",
      companyId,
      betterAuthId: userId,
    });
  } else {
    await db
      .update(users)
      .set({
        name,
        role: role || "staff",
        authRole: role || "funcionario",
        companyId,
        betterAuthId: userId,
      })
      .where(eq(users.email, email));
  }

  const [created] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return NextResponse.json({ user: created });
}
