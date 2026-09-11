import { randomUUID } from "node:crypto";
import postgres from "postgres";

async function test() {
  const sql = postgres("postgresql://postgres:postgres@localhost:54322/postgres", { max: 1 });
  try {
    // Check columns
    const cols =
      await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'user'`;
    console.log("Colunas:", cols);

    const id = randomUUID();
    const result = await sql`
      INSERT INTO "user" (id, name, email, "email_verified", "created_at", "updated_at")
      VALUES (${id}, 'Teste Admin', 'teste@admin.com', true, NOW(), NOW())
      RETURNING id, name, email;
    `;
    console.log("Insert OK:", result);
  } catch (e: any) {
    console.error("Insert ERRO:", e.message, e.code, e.detail);
  } finally {
    await sql.end();
  }
}
test();
