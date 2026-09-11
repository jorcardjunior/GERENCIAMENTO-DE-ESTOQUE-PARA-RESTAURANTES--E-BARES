import { db } from "@/db";
import { categories, items } from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

type AdviceResult = {
  diagnostico: string;
  metricas: {
    capitalParado: number;
    itensCriticos: number;
    margemMedia: number | null;
    percPerda: number | null;
    giroEstoque: number | null;
  };
  insights: string[];
  citacao: string;
  acoes: string[];
};

const CITACOES = [
  "O que nao e medido nao e gerenciado.",
  "A vantagem competitiva nao esta na imitacao, mas na diferenciacao.",
  "Nao se gerencia o que nao se controla, nao se controla o que nao se mede.",
  "Gestao e, acima de tudo, uma pratica, onde arte, ciencia e oficio se encontram.",
  "Elimine o desperdicio. O lucro vem da reducao de custos, nao do aumento de precos.",
  "O que voce mede e o que voce consegue gerenciar.",
];

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const [totalEstoque, itensBaixo, categoriasCount] = await Promise.all([
      db
        .select({
          total: sql<number>`sum(current_quantity)`,
          valorTotal: sql<number>`sum(coalesce(unit_price, 0) * current_quantity)`,
          totalItens: sql<number>`count(*)`,
          mediaMin: sql<number>`avg(min_stock)`,
        })
        .from(items),

      db
        .select({ count: sql<number>`count(*)` })
        .from(items)
        .where(sql`current_quantity <= min_stock`),

      db.select({ total: sql<number>`count(*)` }).from(categories),
    ]);

    const e = totalEstoque[0];
    const capitalParado = Number(e?.valorTotal ?? 0);
    const itensCriticos = Number(itensBaixo[0]?.count ?? 0);
    const totalCadastrados = Number(e?.totalItens ?? 0);
    const totalCategorias = Number(categoriasCount[0]?.total ?? 0);
    const mediaMin = Number(e?.mediaMin ?? 0);
    const estoqueTotalQtd = Number(e?.total ?? 0);

    // Análise
    const percCritico = totalCadastrados > 0 ? (itensCriticos / totalCadastrados) * 100 : 0;
    const percEstoqueMin =
      mediaMin > 0 ? (estoqueTotalQtd / (mediaMin * totalCadastrados)) * 100 : 0;

    // ===================== INSIGHTS =====================
    const insights: string[] = [];
    const acoes: string[] = [];

    // Capital parado → Peter Drucker / Kaplan
    if (capitalParado > 5000) {
      insights.push(
        `Capital parado em estoque: R$ ${capitalParado.toFixed(2)}. Capital imobilizado reduz liquidez. Considere revisar o mix de produtos.`,
      );
      acoes.push(
        "Revisar itens com alto valor unitario e baixo giro. Aplicar analise ABC para priorizar gestao.",
      );
    } else {
      insights.push(
        `Capital em estoque controlado (R$ ${capitalParado.toFixed(2)}). O fluxo de caixa e prioridade.`,
      );
    }

    if (percCritico > 20) {
      insights.push(
        `${percCritico.toFixed(0)}% dos itens estao abaixo do estoque minimo (${itensCriticos} itens). A qualidade e responsabilidade de todos. Reveja os parametros de reposicao.`,
      );
      acoes.push(
        `Ajustar parametros de estoque minimo para os ${itensCriticos} itens criticos. Criar alerta automatico quando atingirem 80% do minimo.`,
      );
    } else if (percCritico > 5) {
      insights.push(
        `${itensCriticos} itens em estado de alerta (${percCritico.toFixed(0)}% do total). Padronizar processos para evitar surpresas.`,
      );
      acoes.push(
        `Monitorar a rotatividade dos ${itensCriticos} itens para evitar ruptura de estoque.`,
      );
    } else {
      insights.push(
        `Nivel de abastecimento saudavel. Apenas ${itensCriticos} itens abaixo do minimo.`,
      );
    }

    const itensComPreco = await db
      .select({ unitPrice: items.unitPrice })
      .from(items)
      .where(sql`unit_price is not null and unit_price > 0`);

    if (itensComPreco.length > 0) {
      const margem =
        itensComPreco.reduce((s, p) => s + Number(p.unitPrice), 0) / itensComPreco.length;
      insights.push(
        `Preco medio dos itens com valor cadastrado: R$ ${margem.toFixed(2)}. Avalie se seus precos cobrem custos e geram lucro.`,
      );
      acoes.push(
        "Auditar periodicamente os custos unitarios. Se a margem bruta for menor que 40%, renegociar fornecedores.",
      );
    }

    // Cobertura de estoque
    if (percEstoqueMin > 0 && percEstoqueMin < 150) {
      insights.push(
        `Cobertura de estoque apertada (${percEstoqueMin.toFixed(0)}% em relacao ao minimo). Busque o equilibrio entre atender demanda e nao imobilizar capital.`,
      );
      acoes.push(
        "Implementar Just-in-Time para itens de alto giro. Reduza estoque de seguranca gradualmente.",
      );
    } else if (percEstoqueMin >= 150) {
      insights.push(
        `Estoque elevado (${percEstoqueMin.toFixed(0)}% acima do minimo). O excesso de estoque esconde problemas. Reveja prazos de entrega dos fornecedores.`,
      );
      acoes.push("Reduzir lotes de compra. Negociar entregas fracionadas com fornecedores.");
    }

    // Categorias
    insights.push(
      `${totalCategorias} categorias cadastradas para organizar ${totalCadastrados} itens. Revise se as categorias refletem seu modelo de negocio.`,
    );

    acoes.push(
      "Agendar revisao mensal de estoque com equipe. Envolver compras, cozinha e financeiro.",
    );
    if (capitalParado > 10000 || percCritico > 15) {
      acoes.push(
        "Prioridade alta: elaborar plano de acao para reducao de capital parado e regularizacao de estoque critico.",
      );
    }

    const citacao = CITACOES[Math.floor(Math.random() * CITACOES.length)];

    let diagnostico: string;
    if (capitalParado > 10000 && percCritico > 20) {
      diagnostico =
        "Situacao critica. Capital elevado parado em estoque combinado com alto percentual de itens abaixo do minimo. " +
        "Sinais de falta de planejamento de compras e gestao de inventario deficiente. " +
        "Sugiro reuniao urgente com a equipe para redefinir politicas de reposicao.";
    } else if (capitalParado > 5000 || percCritico > 10) {
      diagnostico =
        "Atencao. Alguns indicadores merecem acompanhamento proximo. " +
        "Com ajustes pontuais nas politicas de compra e revisao de estoque minimo, e possivel melhorar o fluxo de caixa.";
    } else {
      diagnostico =
        "Saudavel. Seus indicadores de estoque estao dentro de parametros aceitaveis. " +
        "Mantenha a disciplina e foque em inovacao e diferenciacao. " +
        "O proximo nivel e otimizar custos e aumentar margens.";
    }

    const result: AdviceResult = {
      diagnostico,
      metricas: {
        capitalParado,
        itensCriticos,
        margemMedia:
          itensComPreco.length > 0
            ? itensComPreco.reduce((s, p) => s + Number(p.unitPrice), 0) / itensComPreco.length
            : null,
        percPerda: null,
        giroEstoque: null,
      },
      insights,
      citacao,
      acoes,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro no business advice:", error);
    return NextResponse.json({ error: "Erro ao analisar" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
