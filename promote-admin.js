const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");

const sql = postgres("postgresql://postgres:postgres@localhost:54322/postgres");
const _db = drizzle(sql);

async function promote(email) {
  const result = await sql`
    UPDATE "user" SET 
      "role" = 'admin'
    WHERE email = ${email}
    RETURNING id, email, name, role;
  `;
  console.log("Promovido:", result);
  await sql.end();
}

const email = process.argv[2] || "seu@email.com";
promote(email).catch(console.error);
