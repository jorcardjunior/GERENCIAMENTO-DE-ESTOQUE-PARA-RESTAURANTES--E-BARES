import postgres from "postgres";

async function check() {
  const sql = postgres("postgresql://postgres:postgres@localhost:54322/postgres", { max: 1 });
  try {
    for (const table of ["user", "session", "account", "verification"]) {
      const cols =
        await sql`SELECT column_name FROM information_schema.columns WHERE table_name = ${table}`;
      console.log(`\n${table}:`, cols.map((c) => c.column_name).join(", "));
    }
  } catch (e: any) {
    console.error("ERRO:", e.message);
  } finally {
    await sql.end();
  }
}
check();
