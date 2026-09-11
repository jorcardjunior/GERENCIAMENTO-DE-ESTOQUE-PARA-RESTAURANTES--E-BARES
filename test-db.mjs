import postgres from "postgres";
const sql = postgres("postgresql://postgres:postgres@localhost:54322/postgres");
try {
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
  if (tables.length === 0) {
    console.log("No user tables found. Need to run migrations.");
  }
  await sql.end();
} catch (e) {
  console.log("ERROR:", e.message);
}
