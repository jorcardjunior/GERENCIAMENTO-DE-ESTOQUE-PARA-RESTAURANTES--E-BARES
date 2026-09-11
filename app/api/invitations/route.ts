import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { invitations, user } from "@/db/schema";
import { type AuthRole, getSession } from "@/lib/auth-server";
import { env } from "@/lib/env";
import { normalizeName } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const BASE_URL = env.BETTER_AUTH_URL || "http://localhost:3000";

const ROLE_LABELS: Record<AuthRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  gerente: "Gerente",
  funcionario: "Funcionário",
  visualizador: "Visualizador",
};

export async function POST(request: Request) {
  const s = await getSession(request.headers);
  if (!s || !s.companyId) {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  let { name, email, role } = await request.json();
  name = normalizeName(name);
  role = (role || "funcionario") as AuthRole;

  if (!name || !email) {
    return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
  }

  // Hierarchy check: only owner/admin can invite
  if (s.role !== "owner" && s.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas proprietários e administradores podem convidar" },
      { status: 403 },
    );
  }

  // Only owner can create admin
  if (role === "admin" && s.role !== "owner") {
    return NextResponse.json(
      { error: "Apenas o proprietário pode criar administradores" },
      { status: 403 },
    );
  }

  // Cannot create another owner
  if (role === "owner") {
    return NextResponse.json({ error: "Não é possível criar outro proprietário" }, { status: 403 });
  }

  // Check if user already exists in this company
  const existingUser = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existingUser.length) {
    return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 });
  }

  // Generate invitation token
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(invitations).values({
    companyId: s.companyId,
    email,
    name,
    role,
    token: rawToken,
    invitedBy: s.userId,
    expiresAt,
  });

  // TODO: Send email with activation link
  const activateUrl = `${BASE_URL}/auth/activate?token=${rawToken}`;
  console.log(`📧 Convite para ${email}: ${activateUrl}`);

  return NextResponse.json({
    success: true,
    message: `Convite enviado para ${email}`,
    inviteUrl: activateUrl,
  });
}

export async function GET(request: Request) {
  const s = await getSession(request.headers);
  if (!s || !s.companyId) {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  if (s.role !== "owner" && s.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  const invites = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      name: invitations.name,
      role: invitations.role,
      status: invitations.status,
      createdAt: invitations.createdAt,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .where(eq(invitations.companyId, s.companyId))
    .orderBy(invitations.createdAt);

  return NextResponse.json(invites);
}
