import crypto from "node:crypto";
import { db } from "@/db";
import { user, users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@admin.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const name = process.env.SEED_ADMIN_NAME || "Admin";

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log("Admin já existe. Pulando seed.");
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const uuid = crypto.randomUUID();
  const now = new Date();

  await db.insert(user).values({
    id: uuid,
    name,
    email,
    emailVerified: true,
    role: "admin",
    mustChangePassword: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(users).values({
    email,
    password: hash,
    name,
    role: "admin",
    betterAuthId: uuid,
    createdAt: now,
  });

  console.log("Admin criado com sucesso!");
  console.log(`  Email: ${email}`);
  console.log(`  Senha: ${password}`);
  console.log(`  Role: admin`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  });
