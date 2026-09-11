import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { autoFixEncoding } from "@/lib/encoding-fix";
import { storeFile } from "@/lib/file-cache";
import { detectarColunas } from "@/lib/import-cols";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

function parseCSV(text: string, fileName: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (char === ";" && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else current += char;
  }
  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }
  const headers = (rows[0] || []).map((h) => autoFixEncoding(h.trim()));
  return {
    headers,
    rows: rows.slice(1).filter((r) => r.some((c) => String(c).trim())),
    sheetNames: [fileName],
  };
}

function parseXLSX(buffer: ArrayBuffer, _fileName: string) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetNames = wb.SheetNames;
  const first = wb.Sheets[sheetNames[0]];
  const json = XLSX.utils.sheet_to_json<string[]>(first, { header: 1 });
  const headers = (json[0] || []).map((h) => autoFixEncoding(String(h).trim()));
  return {
    headers,
    rows: json.slice(1).filter((r) => r.some((c) => String(c).trim())) as string[][],
    sheetNames,
  };
}

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

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Nenhum arquivo" }, { status: 400 });

    const name = file.name.toLowerCase();
    const text = name.endsWith(".csv") ? await file.text() : "";
    const buffer =
      name.endsWith(".xlsx") || name.endsWith(".xls") ? await file.arrayBuffer() : null;

    if (!text && !buffer)
      return NextResponse.json({ error: "Formato nao suportado" }, { status: 400 });

    const parsed = text ? parseCSV(text, file.name) : parseXLSX(buffer!, file.name);
    const { headers, rows, sheetNames } = parsed;

    if (!headers.length) return NextResponse.json({ error: "Arquivo vazio" }, { status: 400 });

    const sample = rows.slice(0, 10);
    const colunas = detectarColunas(headers, sample);

    const mapping: Record<string, string> = {};
    for (const c of colunas) {
      if (c.campo) mapping[c.header] = c.campo;
    }

    // Validação previa
    let linhasSemNome = 0;
    let linhasSemCategoria = 0;
    let duplicatas = 0;
    const categoriasNovas = new Set<string>();
    const categoriasExistentes = await db.select({ name: categories.name }).from(categories);

    for (const row of rows) {
      const nome = autoFixEncoding(getRowVal(row, headers, "name", mapping)).trim();
      const cat = autoFixEncoding(getRowVal(row, headers, "category", mapping)).trim();
      if (!nome) linhasSemNome++;
      if (!cat) linhasSemCategoria++;
      if (cat && !categoriasExistentes.some((c) => c.name === cat)) categoriasNovas.add(cat);
    }

    // Checar duplicatas reais no banco
    const todosNomes = rows
      .map((r) => autoFixEncoding(getRowVal(r, headers, "name", mapping)).trim())
      .filter(Boolean);
    if (todosNomes.length > 0) {
      const existentes = await db
        .select({ name: items.name })
        .from(items)
        .where(
          sql`name = ANY(ARRAY[${sql.join(
            todosNomes.map((n) => sql`${n}`),
            sql`, `,
          )}])`,
        );
      duplicatas = todosNomes.filter((n) => existentes.some((e) => e.name === n)).length;
    }

    // Valor estimado com base nos precos
    let valorEstimado = 0;
    for (const row of rows) {
      const preco = Number.parseFloat(
        getRowVal(row, headers, "unitPrice", mapping).replace(",", "."),
      );
      const qtd = Number.parseFloat(
        getRowVal(row, headers, "currentQuantity", mapping).replace(",", "."),
      );
      if (!Number.isNaN(preco) && !Number.isNaN(qtd)) valorEstimado += preco * qtd;
    }

    const fileToken = storeFile(headers, rows, file.name);

    return NextResponse.json({
      fileToken,
      filename: file.name,
      totalRows: rows.length,
      sheetNames,
      colunas,
      headers,
      sampleRows: sample,
      validacao: {
        linhasSemNome,
        linhasSemCategoria,
        duplicatas,
        categoriasNovas: Array.from(categoriasNovas),
        valorEstimado: Math.round(valorEstimado * 100) / 100,
      },
    });
  } catch (err) {
    console.error("Detect error:", err);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
