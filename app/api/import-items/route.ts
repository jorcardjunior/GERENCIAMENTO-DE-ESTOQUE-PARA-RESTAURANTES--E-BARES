import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { autoFixEncoding } from "@/lib/encoding-fix";
import { deleteFile, getFile } from "@/lib/file-cache";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

const CHUNK = 100;

function normalizeUnit(v: string): string {
  const r = autoFixEncoding(v).toLowerCase().trim();
  if (!r) return "un";
  if (["kg", "quilo", "quilograma"].includes(r)) return "kg";
  if (["g", "grama", "gramas"].includes(r)) return "g";
  if (["l", "litro", "litros"].includes(r)) return "l";
  if (["ml", "mililitro", "mililitros"].includes(r)) return "ml";
  if (["un", "und", "unidade", "unidades"].includes(r)) return "un";
  if (["pct", "pacote", "pacotes"].includes(r)) return "pct";
  if (["cx", "caixa", "caixas"].includes(r)) return "cx";
  return r;
}

function normalizar(s: string) {
  return autoFixEncoding(s)
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s\-]/gu, "")
    .trim();
}

function parseNum(v: string | undefined, fb = 0): number {
  if (!v) return fb;
  const n = v
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.,-]/g, "");
  const p = Number(n);
  return Number.isFinite(p) ? p : fb;
}

const CORES = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#9333ea", "#0d9488"];

function getRowVal(
  row: string[],
  headers: string[],
  campo: string,
  mapping: Record<string, string>,
): string {
  const header = Object.entries(mapping).find(([, v]) => v === campo)?.[0];
  if (!header) return "";
  const idx = headers.indexOf(header);
  return idx >= 0 ? row[idx] || "" : "";
}

function parseCSV(text: string) {
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (c === '"') {
      if (inQ && n === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === ";" && !inQ) {
      row.push(cur);
      cur = "";
    } else if ((c === "\n" || c === "\r") && !inQ) {
      if (c === "\r" && n === "\n") i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else cur += c;
  }
  if (cur || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return {
    headers: (rows[0] || []).map((h) => autoFixEncoding(h.trim())),
    rows: rows.slice(1).filter((r) => r.some((c) => String(c).trim())),
  };
}

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const fileToken = formData.get("fileToken") as string | null;
  const mappingJson = formData.get("mapping") as string | null;
  const mapping: Record<string, string> = mappingJson ? JSON.parse(mappingJson) : {};

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, event: string, data: unknown) => {
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  };

  const stream = new ReadableStream({
    async start(controller) {
      let headers: string[];
      let rows: string[][];

      if (fileToken) {
        const cached = getFile(fileToken);
        if (!cached) {
          send(controller, "error", { message: "Arquivo expirado, envie novamente" });
          controller.close();
          return;
        }
        headers = cached.headers;
        rows = cached.rows;
        deleteFile(fileToken);
      } else if (file) {
        const f = file.name.toLowerCase();
        if (f.endsWith(".csv")) {
          const p = parseCSV(await file.text());
          headers = p.headers;
          rows = p.rows;
        } else if (f.endsWith(".xlsx") || f.endsWith(".xls")) {
          const wb = XLSX.read(await file.arrayBuffer(), { type: "buffer" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const j = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
          headers = (j[0] || []).map((h) => autoFixEncoding(String(h).trim()));
          rows = j.slice(1).filter((r: unknown[]) => r.some((c) => String(c).trim())) as string[][];
        } else {
          send(controller, "error", { message: "Formato nao suportado" });
          controller.close();
          return;
        }
      } else {
        send(controller, "error", { message: "Nenhum dado" });
        controller.close();
        return;
      }

      if (!headers.length) {
        send(controller, "error", { message: "Arquivo vazio" });
        controller.close();
        return;
      }

      let imported = 0;
      let skipped = 0;
      const total = rows.length;
      const errors: string[] = [];
      const createdIds: number[] = [];
      const catCache: Record<string, number> = {};
      let corIdx = 0;

      send(controller, "start", { total });

      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);

        for (const row of chunk) {
          try {
            const catR = getRowVal(row, headers, "category", mapping);
            const nomeR = getRowVal(row, headers, "name", mapping);
            if (!catR || !nomeR) {
              skipped++;
              continue;
            }

            const cat = normalizar(catR);
            const nome = normalizar(nomeR);
            if (!cat || !nome) {
              skipped++;
              continue;
            }

            let catId = catCache[cat];
            if (!catId) {
              const ex = await db
                .select()
                .from(categories)
                .where(eq(categories.name, cat))
                .limit(1);
              if (ex.length > 0) catId = ex[0].id;
              else {
                const [c] = await db
                  .insert(categories)
                  .values({ name: cat, color: CORES[corIdx++ % CORES.length] })
                  .returning();
                catId = c.id;
              }
              catCache[cat] = catId;
            }

            const exist = await db
              .select({ id: items.id })
              .from(items)
              .where(eq(items.name, nome))
              .limit(1);
            if (exist.length > 0) {
              skipped++;
              continue;
            }

            const unit = normalizeUnit(getRowVal(row, headers, "unit", mapping));
            const qty = parseNum(getRowVal(row, headers, "currentQuantity", mapping));
            const min = parseNum(getRowVal(row, headers, "minStock", mapping));
            const price = parseNum(getRowVal(row, headers, "unitPrice", mapping));

            const ins = await db
              .insert(items)
              .values({
                categoryId: catId,
                name: nome,
                unit,
                minStock: String(min),
                currentQuantity: String(qty),
                ...(price > 0 ? { unitPrice: String(price) } : {}),
              })
              .returning({ id: items.id });
            if (ins[0]?.id) createdIds.push(ins[0].id);
            imported++;
          } catch {
            skipped++;
          }
        }

        send(controller, "progress", { imported, skipped, total });
      }

      send(controller, "complete", { imported, skipped, total, errors, createdIds });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export const dynamic = "force-dynamic";
