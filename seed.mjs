import postgres from "postgres";
import bcrypt from "bcryptjs";

const sql = postgres(process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:54322/postgres");

const adminHash = bcrypt.hashSync("admin", 10);
const staffHash = bcrypt.hashSync("staff", 10);

await sql`INSERT INTO "users" (email, password, name, role) VALUES (${"admin@gmail.com"}, ${adminHash}, ${"Admin"}, ${"admin"}) ON CONFLICT (email) DO NOTHING`;
await sql`INSERT INTO "users" (email, password, name, role) VALUES (${"staff@gmail.com"}, ${staffHash}, ${"Staff"}, ${"staff"}) ON CONFLICT (email) DO NOTHING`;

console.log("Usuários criados!");
await sql.end();
process.exit(0);
