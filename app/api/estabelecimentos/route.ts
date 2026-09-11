import { db } from "@/db";
import { estabelecimentos } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = await db.select().from(estabelecimentos).orderBy(asc(estabelecimentos.nome));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nome, nomeFantasia, cnpj, endereco, cidade, estado, telefone, email, status } = body;

    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const [estabelecimento] = await db
      .insert(estabelecimentos)
      .values({
        nome: nome.trim(),
        nomeFantasia: nomeFantasia?.trim() || null,
        cnpj: cnpj?.replace(/\D/g, "") || null,
        endereco: endereco?.trim() || null,
        cidade: cidade?.trim() || null,
        estado: estado?.trim() || null,
        telefone: telefone?.trim() || null,
        email: email?.trim() || null,
        status: status || "ativo",
      })
      .returning();

    return NextResponse.json(estabelecimento);
  } catch (error: any) {
    console.error("Erro ao criar estabelecimento:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao criar estabelecimento" },
      { status: 500 },
    );
  }
}
