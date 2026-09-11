import postgres from "postgres";

async function test() {
  const sql = postgres("postgresql://postgres:postgres@localhost:54322/postgres", { max: 1 });

  try {
    const result = await sql`SELECT 1 as ok`;
    console.log("DB OK:", result);
  } catch (e: any) {
    console.error("DB ERRO:", e.message);
  } finally {
    await sql.end();
  }
}

test();
