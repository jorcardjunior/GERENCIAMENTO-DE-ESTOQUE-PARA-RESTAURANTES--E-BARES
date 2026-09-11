import postgres from "postgres";

async function check() {
  const sql = postgres("postgresql://postgres:postgres@localhost:54322/postgres", { max: 1 });
  try {
    const tables =
      await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user', 'session', 'account', 'verification')`;
    console.log("Tabelas Better-Auth:", tables);
  } catch (e: any) {
    console.error(e.message);
  } finally {
    await sql.end();
  }
}
check();
