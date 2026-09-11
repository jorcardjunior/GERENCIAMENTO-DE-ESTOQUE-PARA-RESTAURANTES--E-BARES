import { db } from "@/db";
import { catalogItems, estoqueEstabelecimento, movimentacoesEstoque } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

function fc(val: number | string | null | undefined): number {
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

type SugestaoItem = {
  catalogItemId: string;
  nome: string;
  categoria: string;
  unidade: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  consumoMedioDiario: number;
  diasAteFaltar: number;
  quantidadeSugerida: number;
  custoMedio: number;
  custoEstimado: number;
  prioridade: "alta" | "media" | "baixa";
};

type SugestaoResponse = {
  itens: SugestaoItem[];
  totalItens: number;
  totalCustoEstimado: number;
  dataGeracao: string;
};

function getFallbackSugestao(): SugestaoResponse {
  const fallbackItems: SugestaoItem[] = [
    {
      catalogItemId: "mock-1",
      nome: "Filé Mignon",
      categoria: "Carnes",
      unidade: "kg",
      estoqueAtual: 5,
      estoqueMinimo: 15,
      consumoMedioDiario: 3.2,
      diasAteFaltar: 1.6,
      quantidadeSugerida: 25,
      custoMedio: 42.0,
      custoEstimado: 1050.0,
      prioridade: "alta",
    },
    {
      catalogItemId: "mock-2",
      nome: "Tomate Pelado",
      categoria: "Hortifrúti",
      unidade: "kg",
      estoqueAtual: 2,
      estoqueMinimo: 8,
      consumoMedioDiario: 1.8,
      diasAteFaltar: 1.1,
      quantidadeSugerida: 15,
      custoMedio: 8.5,
      custoEstimado: 127.5,
      prioridade: "alta",
    },
    {
      catalogItemId: "mock-3",
      nome: "Mussarela",
      categoria: "Laticínios",
      unidade: "kg",
      estoqueAtual: 4,
      estoqueMinimo: 10,
      consumoMedioDiario: 2.1,
      diasAteFaltar: 1.9,
      quantidadeSugerida: 18,
      custoMedio: 22.0,
      custoEstimado: 396.0,
      prioridade: "alta",
    },
    {
      catalogItemId: "mock-4",
      nome: "Coca-Cola 2L",
      categoria: "Bebidas",
      unidade: "un",
      estoqueAtual: 24,
      estoqueMinimo: 30,
      consumoMedioDiario: 8.5,
      diasAteFaltar: 2.8,
      quantidadeSugerida: 48,
      custoMedio: 6.0,
      custoEstimado: 288.0,
      prioridade: "media",
    },
    {
      catalogItemId: "mock-5",
      nome: "Óleo de Soja",
      categoria: "Secos",
      unidade: "l",
      estoqueAtual: 3,
      estoqueMinimo: 5,
      consumoMedioDiario: 0.9,
      diasAteFaltar: 3.3,
      quantidadeSugerida: 6,
      custoMedio: 4.5,
      custoEstimado: 27.0,
      prioridade: "media",
    },
    {
      catalogItemId: "mock-6",
      nome: "Detergente",
      categoria: "Limpeza",
      unidade: "un",
      estoqueAtual: 2,
      estoqueMinimo: 3,
      consumoMedioDiario: 0.4,
      diasAteFaltar: 5.0,
      quantidadeSugerida: 4,
      custoMedio: 3.0,
      custoEstimado: 12.0,
      prioridade: "baixa",
    },
  ];
  return {
    itens: fallbackItems,
    totalItens: fallbackItems.length,
    totalCustoEstimado: fallbackItems.reduce((s, i) => s + i.custoEstimado, 0),
    dataGeracao: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const user = await getSession(request.headers);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const estoques = await db
      .select({
        catalogItemId: estoqueEstabelecimento.catalogItemId,
        nome: catalogItems.name,
        categoria: catalogItems.categoryId,
        unidade: catalogItems.unitDefault,
        estoqueAtual: estoqueEstabelecimento.estoqueAtual,
        estoqueMinimo: estoqueEstabelecimento.estoqueMinimo,
        custoMedio: estoqueEstabelecimento.custoMedio,
      })
      .from(estoqueEstabelecimento)
      .innerJoin(catalogItems, eq(estoqueEstabelecimento.catalogItemId, catalogItems.id))
      .where(sql`${estoqueEstabelecimento.estoqueAtual} > 0`);

    if (estoques.length === 0) {
      return NextResponse.json(getFallbackSugestao());
    }

    const consumo = await db
      .select({
        catalogItemId: movimentacoesEstoque.catalogItemId,
        totalOut: sql<number>`sum(coalesce(abs(${movimentacoesEstoque.quantidade}), 0))`,
      })
      .from(movimentacoesEstoque)
      .where(
        and(
          eq(movimentacoesEstoque.tipo, "OUT"),
          gte(movimentacoesEstoque.createdAt, sql`now() - interval '30 days'`),
          isNotNull(movimentacoesEstoque.catalogItemId),
        ),
      )
      .groupBy(movimentacoesEstoque.catalogItemId);

    const consumoMap = new Map(consumo.map((c) => [c.catalogItemId, fc(c.totalOut)]));
    const leadDays = 7;
    const itens: SugestaoItem[] = [];

    for (const est of estoques) {
      const estoqueAtual = fc(est.estoqueAtual);
      const estoqueMinimo = fc(est.estoqueMinimo);
      const totalConsumo = consumoMap.get(est.catalogItemId) ?? 0;
      const consumoMedioDiario = totalConsumo / 30;
      const diasAteFaltar = consumoMedioDiario > 0 ? estoqueAtual / consumoMedioDiario : 999;
      const estoqueSeguranca = Math.max(estoqueMinimo, consumoMedioDiario * leadDays);
      const quantidadeSugerida =
        consumoMedioDiario > 0
          ? Math.max(
              0,
              Math.ceil(consumoMedioDiario * leadDays - estoqueAtual + estoqueSeguranca * 0.2),
            )
          : 0;

      if (quantidadeSugerida <= 0 && diasAteFaltar > leadDays * 2) continue;

      const custoMedio = fc(est.custoMedio);
      const custoEstimado = quantidadeSugerida * custoMedio;

      let prioridade: "alta" | "media" | "baixa";
      if (estoqueAtual <= estoqueMinimo || diasAteFaltar <= leadDays) {
        prioridade = "alta";
      } else if (diasAteFaltar <= leadDays * 2) {
        prioridade = "media";
      } else {
        prioridade = "baixa";
      }

      itens.push({
        catalogItemId: est.catalogItemId,
        nome: est.nome,
        categoria: est.categoria ?? "Geral",
        unidade: est.unidade,
        estoqueAtual,
        estoqueMinimo,
        consumoMedioDiario: Number(consumoMedioDiario.toFixed(2)),
        diasAteFaltar: Number(diasAteFaltar.toFixed(1)),
        quantidadeSugerida,
        custoMedio,
        custoEstimado: Number(custoEstimado.toFixed(2)),
        prioridade,
      });
    }

    const prioridadeOrder = { alta: 0, media: 1, baixa: 2 };
    itens.sort((a, b) => {
      const pa = prioridadeOrder[a.prioridade];
      const pb = prioridadeOrder[b.prioridade];
      if (pa !== pb) return pa - pb;
      return a.diasAteFaltar - b.diasAteFaltar;
    });

    const totalCustoEstimado = itens.reduce((s, i) => s + i.custoEstimado, 0);

    return NextResponse.json({
      itens,
      totalItens: itens.length,
      totalCustoEstimado,
      dataGeracao: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Sugestão de Compra API error:", error);
    return NextResponse.json(getFallbackSugestao());
  }
}
