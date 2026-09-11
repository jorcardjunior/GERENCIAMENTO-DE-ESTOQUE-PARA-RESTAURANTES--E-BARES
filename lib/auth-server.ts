import { db } from "@/db";
import { estabelecimentos, user, users } from "@/db/schema";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";
import { resend } from "@/lib/resend";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";

export type AuthRole = "owner" | "admin" | "gerente" | "funcionario" | "visualizador";

export const ROLE_HIERARCHY: Record<AuthRole, number> = {
  visualizador: 0,
  funcionario: 1,
  gerente: 2,
  admin: 3,
  owner: 4,
};

export function canManage(target: AuthRole, actor: AuthRole): boolean {
  return ROLE_HIERARCHY[actor] > ROLE_HIERARCHY[target];
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: false,
    schema,
  }),
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "EstoqueRest <noreply@seudominio.com>",
        to: user.email,
        subject: "Redefinição de senha",
        html: `<p>Clique no link abaixo para redefinir sua senha:</p><a href="${url}">${url}</a>`,
      });
    },
  },
  rateLimit: {
    window: 60,
    max: 5,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: env.isProd,
      sameSite: "strict",
    },
  },
});

export type AuthSession = {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  };
};

export type TokenPayload = {
  userId: string;
  legacyUserId: number | null;
  name: string;
  email: string;
  role: AuthRole;
  companyId: string | null;
  companyName: string | null;
  mustChangePassword: boolean;
};

export async function getSession(headers: Headers): Promise<TokenPayload | null> {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.email) return null;

  const [authUser] = await db
    .select({
      role: user.role,
      companyId: user.companyId,
      mustChangePassword: user.mustChangePassword,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const [company] = authUser?.companyId
    ? await db
        .select({ name: estabelecimentos.nome })
        .from(estabelecimentos)
        .where(eq(estabelecimentos.id, authUser.companyId))
        .limit(1)
    : [];

  const [legacyUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  return {
    userId: session.user.id,
    legacyUserId: legacyUser?.id || null,
    name: session.user.name || "",
    email: session.user.email,
    role: (authUser?.role as AuthRole) || "funcionario",
    companyId: authUser?.companyId || null,
    companyName: company?.name || null,
    mustChangePassword: authUser?.mustChangePassword || false,
  };
}
