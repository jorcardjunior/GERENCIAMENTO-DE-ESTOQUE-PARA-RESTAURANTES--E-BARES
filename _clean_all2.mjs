import postgres from "postgres";
const sql = postgres("postgresql://postgres:postgres@localhost:54322/postgres");

// Disable triggers temporarily
await sql`SET session_replication_role = 'replica'`;

// Clean in order
await sql`DELETE FROM "invitations"`;
await sql`DELETE FROM "session"`;
await sql`DELETE FROM "account"`;
await sql`DELETE FROM "catalog_items"`;
await sql`DELETE FROM "inventory_items"`;
await sql`DELETE FROM "categories"`;
await sql`DELETE FROM "items"`;
await sql`DELETE FROM "users"`;
await sql`DELETE FROM "user"`;
await sql`DELETE FROM "estabelecimentos"`;

await sql`SET session_replication_role = 'origin'`;
console.log("All data cleaned");

await sql.end();
process.exit(0);
