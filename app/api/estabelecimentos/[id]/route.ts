import { db } from "@/db";
import { estabelecimentos } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const [estabelecimento] = await db
      .select()
      .from(estabelecimentos)
      .where(eq(estabelecimentos.id, id));

    if (!estabelecimento) {
      return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 404 });
    }

    return NextResponse.json(estabelecimento);
  } catch (error: any) {
    console.error("Erro ao buscar estabelecimento:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao buscar estabelecimento" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "nome",
      "nomeFantasia",
      "cnpj",
      "endereco",
      "cidade",
      "estado",
      "telefone",
      "email",
      "status",
      "logoUrl",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] =
          field === "cnpj"
            ? body[field]?.replace(/\D/g, "")
            : typeof body[field] === "string"
              ? body[field].trim()
              : body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualizar" }, { status: 400 });
    }

    const [estabelecimento] = await db
      .update(estabelecimentos)
      .set(updateData)
      .where(eq(estabelecimentos.id, id))
      .returning();

    if (!estabelecimento) {
      return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 404 });
    }

    return NextResponse.json(estabelecimento);
  } catch (error: any) {
    console.error("Erro ao atualizar estabelecimento:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao atualizar estabelecimento" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (session.role !== "admin" && session.role !== "owner") {
    return NextResponse.json(
      { error: "Apenas administradores podem excluir estabelecimentos" },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;

    const [estabelecimento] = await db
      .delete(estabelecimentos)
      .where(eq(estabelecimentos.id, id))
      .returning();

    if (!estabelecimento) {
      return NextResponse.json({ error: "Estabelecimento não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir estabelecimento:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao excluir estabelecimento" },
      { status: 500 },
    );
  }
}
