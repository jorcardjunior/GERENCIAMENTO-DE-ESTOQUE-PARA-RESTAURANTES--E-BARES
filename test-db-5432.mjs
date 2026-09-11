import postgres from "postgres";
const sql = postgres("postgresql://postgres:postgres@localhost:5432/postgres");
try {
  const result = await sql`SELECT 1 as connected`;
  console.log("Successfully connected to DB on port 5432:", result);

  const tables = await sql`
    SELECT table_name, table_schema 
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name
  `;
  console.log("Tables found:", tables.length);
  for (const t of tables) {
    console.log(`  ${t.table_schema}.${t.table_name}`);
  }
  await sql.end();
} catch (e) {
  console.log("ERROR:", e.message);
}
