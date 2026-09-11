const BASE = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const email = process.env.SEED_ADMIN_EMAIL || "admin@admin.com";
const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
const name = process.env.SEED_ADMIN_NAME || "Admin";
const companyName = process.env.SEED_COMPANY_NAME || "Restaurante Exemplo";

import postgres from "postgres";
const sql = postgres(
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:54322/postgres",
);

// Check if already exists
const existing = await sql`SELECT id FROM "user" WHERE email = ${email} LIMIT 1`;
if (existing.length) {
  console.log("Admin já existe.");
  await sql.end();
  process.exit(0);
}

// 1. Create the company (estabelecimento)
const [company] = await sql`
  INSERT INTO "estabelecimentos" (nome, status, plan)
  VALUES (${companyName}, 'ativo', 'professional')
  RETURNING id
`;
console.log(`✅ Empresa criada: ${companyName} (${company.id})`);

// 2. Create admin user via better-auth API
const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE },
  body: JSON.stringify({ name, email, password }),
});
if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  console.error("Erro ao criar admin:", err.message || err.code || res.status);
  process.exit(1);
}
const data = await res.json();
const userId = data.user.id;
console.log("✅ Admin criado via better-auth");

// 3. Set role, company, and must_change_password
await sql`UPDATE "user" SET role = 'owner', company_id = ${company.id}, must_change_password = true WHERE id = ${userId}`;

// 4. Set company owner
await sql`UPDATE "estabelecimentos" SET owner_id = ${userId} WHERE id = ${company.id}`;

// 5. Create legacy user entry
await sql`
  INSERT INTO "users" (email, password, name, role, auth_role, company_id, better_auth_id)
  VALUES (${email}, 'managed-by-better-auth', ${name}, 'admin', 'owner', ${company.id}, ${userId})
  ON CONFLICT (email) DO UPDATE
  SET role = 'admin', auth_role = 'owner', company_id = ${company.id}, better_auth_id = ${userId}
`;

console.log("\n🎉 Seed concluído com sucesso!");
console.log(`   Empresa: ${companyName}`);
console.log(`   Login:   ${email}`);
console.log(`   Senha:   ${password}`);
console.log("   No primeiro login, crie uma nova senha.");

await sql.end();
process.exit(0);
