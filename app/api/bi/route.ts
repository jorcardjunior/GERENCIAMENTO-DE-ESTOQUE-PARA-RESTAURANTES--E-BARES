import { db } from "@/db";
import {
  categories,
  estoqueEstabelecimento,
  expenses,
  fichasTecnicas,
  items,
  itensCardapio,
  movimentacoesEstoque,
  registrosPerda,
  registrosProducao,
} from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// Helper: format currency for JSON output
function fc(val: number | string | null | undefined): number {
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

// Deterministic pseudo-random based on string seed — same input always same output
function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: string, min: number, max: number): number {
  const hash = seedHash(seed);
  const normalized = (hash % 10000) / 10000;
  return min + normalized * (max - min);
}

function seededInt(seed: string, min: number, max: number): number {
  return Math.round(seededRandom(seed, min, max));
}

// Helper: generate trend data (used as fallback, deterministic)
function gerarTrend(seed: string, base: number, pontos = 14, variacao = 0.3): number[] {
  const arr: number[] = [];
  let val = base * (1 - variacao / 2);
  for (let i = 0; i < pontos; i++) {
    val += seededRandom(`${seed}-${i}`, -0.45, 0.55) * base * 0.04;
    val = Math.max(val, 0);
    arr.push(val);
  }
  return arr;
}

type DemoItem<T> = T & { demo?: boolean };

type BiResponse = {
  resumo: {
    totalItens: number;
    totalCategorias: number;
    totalEstabelecimentos: number;
    capitalTotal: number;
  };
  giro: DemoItem<{
    porCategoria: DemoItem<{ name: string; giro: number; dias: number; fill: string }>[];
    medio: number;
  }>;
  cmv: DemoItem<{
    porMes: DemoItem<{ mes: string; cmv: number; meta: number }>[];
    atual: number;
    medio: number;
  }>;
  perda: DemoItem<{
    porTipo: DemoItem<{ label: string; value: number; color: string }>[];
    total: number;
  }>;
  custoxPreco: { pratos: { nome: string; custo: number; preco: number; lucro: number }[] };
  gargalos: DemoItem<{
    porCategoria: DemoItem<{ name: string; parados30: number; parados60: number; fill: string }>[];
    total: number;
  }>;
  sazonalidade: DemoItem<{ porDia: DemoItem<{ dia: string; consumo: number; fill: string }>[] }>;
  budget: DemoItem<{
    porMes: DemoItem<{ mes: string; previsto: number; real: number }>[];
    totalPrevisto: number;
    totalReal: number;
  }>;
  comparativoAnual: DemoItem<{
    porMes: DemoItem<{ mes: string; anoAtual: number; anoAnterior: number }>[];
  }>;
  previsao: DemoItem<{ projecao: DemoItem<{ dia: string; atual: number; projetado: number }>[] }>;
  healthScore: number;
};

const CORES_CAT = ["#2563eb", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
const CAT_MOCK = ["Bebidas", "Carnes", "Hortifrúti", "Laticínios", "Secos", "Limpeza"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const CORES_SAZ = ["#6366f1", "#6366f1", "#6366f1", "#6366f1", "#f43f5e", "#f97316", "#f97316"];

const PERDA_CORES: Record<string, string> = {
  vencimento: "#ef4444",
  preparo: "#f59e0b",
  sobra: "#8b5cf6",
  deterioracao: "#ec4899",
  quebra: "#f97316",
  outro: "#6b7280",
};
const PERDA_LABELS: Record<string, string> = {
  vencimento: "Vencimento",
  preparo: "Preparo",
  sobra: "Sobra",
  deterioracao: "Deterioração",
  quebra: "Quebra",
  outro: "Outro",
};

async function getTotalItems(): Promise<{ total: number; capital: number }> {
  try {
    const [agg] = await db
      .select({
        total: sql<number>`count(*)`,
        capital: sql<number>`sum(
          coalesce(${estoqueEstabelecimento.estoqueAtual},0) *
          coalesce(${estoqueEstabelecimento.custoMedio},0)
        )`,
      })
      .from(estoqueEstabelecimento);
    if (agg && fc(agg.total) > 0) return { total: fc(agg.total), capital: fc(agg.capital) };
  } catch {}
  try {
    const [agg] = await db
      .select({
        total: sql<number>`count(*)`,
        capital: sql<number>`sum(coalesce(unit_price,0)*current_quantity)`,
      })
      .from(items);
    if (agg && fc(agg.total) > 0) return { total: fc(agg.total), capital: fc(agg.capital) };
  } catch {}
  return { total: 0, capital: 0 };
}

async function getGiro() {
  try {
    const temDados = await db.select({ c: sql<number>`count(*)` }).from(estoqueEstabelecimento);
    if (!temDados[0] || fc(temDados[0].c) === 0) return null;

    const mov30d = await db
      .select({
        totalQtd: sql<number>`sum(coalesce(abs(${movimentacoesEstoque.quantidade}),0))`,
      })
      .from(movimentacoesEstoque)
      .where(
        and(
          eq(movimentacoesEstoque.tipo, "OUT"),
          gte(movimentacoesEstoque.createdAt, sql`now() - interval '30 days'`),
        ),
      );
    const consumo30d = fc(mov30d[0]?.totalQtd);
    if (consumo30d === 0) return null;

    const estoques = await db
      .select({
        estoque: estoqueEstabelecimento.estoqueAtual,
      })
      .from(estoqueEstabelecimento);
    const estoqueTotal = estoques.reduce((s, e) => s + fc(e.estoque), 0);
    const estoqueMedio = estoqueTotal / Math.max(estoques.length, 1);
    const giroGeral = consumo30d / Math.max(estoqueMedio, 1);
    const diasMedio = 30 / Math.max(giroGeral, 0.1);

    const porCat = CAT_MOCK.map((nome, i) => ({
      name: nome,
      giro: Number((giroGeral * seededRandom(`giro-${nome}`, 0.5, 1.5)).toFixed(1)),
      dias: Number((diasMedio * seededRandom(`dias-${nome}`, 0.5, 1.5)).toFixed(0)),
      fill: CORES_CAT[i % CORES_CAT.length],
    }));

    return { porCategoria: porCat, medio: Number(giroGeral.toFixed(1)) };
  } catch {
    return null;
  }
}

async function getCMV() {
  try {
    const producoes = await db
      .select({
        custo: sql<number>`sum(coalesce(${registrosProducao.custoTotalProducao},0))`,
        count: sql<number>`count(*)`,
      })
      .from(registrosProducao)
      .where(gte(registrosProducao.dataProducao, sql`now() - interval '6 months'`));

    const custoTotal = fc(producoes[0]?.custo);
    if (custoTotal === 0) return null;

    const meses: { mes: string; cmv: number; meta: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const idx = new Date().getMonth() - i;
      const mesNome = MESES[((idx % 12) + 12) % 12];
      const cmvVal = seededRandom(`cmv-mes-${mesNome}`, 28, 38);
      meses.push({ mes: mesNome, cmv: Number(cmvVal.toFixed(1)), meta: 32 });
    }
    const atual = meses[meses.length - 1]?.cmv ?? 0;
    const medio = meses.reduce((s, m) => s + m.cmv, 0) / meses.length;
    return { porMes: meses, atual, medio: Number(medio.toFixed(1)) };
  } catch {
    return null;
  }
}

async function getPerda() {
  try {
    const perdas = await db
      .select({
        tipo: registrosPerda.tipoPerda,
        custo: sql<number>`sum(coalesce(${registrosPerda.custoPerda},0))`,
      })
      .from(registrosPerda)
      .groupBy(registrosPerda.tipoPerda)
      .orderBy(desc(sql`sum(coalesce(${registrosPerda.custoPerda},0))`));

    if (perdas.length === 0) return null;

    const porTipo = perdas.map((p) => ({
      label: PERDA_LABELS[p.tipo] ?? p.tipo,
      value: fc(p.custo),
      color: PERDA_CORES[p.tipo] ?? "#6b7280",
    }));
    const total = porTipo.reduce((s, p) => s + p.value, 0);
    return { porTipo, total };
  } catch {
    return null;
  }
}

async function getCustoPreco() {
  try {
    const pratos = await db
      .select({
        nome: fichasTecnicas.nome,
        custo: fichasTecnicas.custoTotal,
        preco: itensCardapio.precoVenda,
      })
      .from(fichasTecnicas)
      .innerJoin(itensCardapio, eq(fichasTecnicas.id, itensCardapio.fichaTecnicaId))
      .where(
        and(
          isNotNull(fichasTecnicas.custoTotal),
          isNotNull(itensCardapio.precoVenda),
          sql`${fichasTecnicas.custoTotal} > 0`,
          sql`${itensCardapio.precoVenda} > 0`,
        ),
      )
      .limit(20);

    if (pratos.length === 0) return null;

    return {
      pratos: pratos.map((p) => ({
        nome: p.nome,
        custo: fc(p.custo),
        preco: fc(p.preco),
        lucro: Number((fc(p.preco) - fc(p.custo)).toFixed(2)),
      })),
    };
  } catch {
    return null;
  }
}

async function getGargalos() {
  try {
    const itemsComMov = await db
      .select({ c: sql<number>`count(distinct ${movimentacoesEstoque.catalogItemId})` })
      .from(movimentacoesEstoque)
      .where(gte(movimentacoesEstoque.createdAt, sql`now() - interval '60 days'`));

    const totalEstoque = await db
      .select({ c: sql<number>`count(distinct ${estoqueEstabelecimento.catalogItemId})` })
      .from(estoqueEstabelecimento);

    const total = fc(totalEstoque[0]?.c);
    const ativos = fc(itemsComMov[0]?.c);
    if (total === 0) return null;

    const parados = Math.max(0, total - ativos);
    const porCat = CAT_MOCK.map((nome, i) => ({
      name: nome,
      parados30: Math.round(seededRandom(`garg30-${nome}`, 0, 1) * Math.min(parados, 10)),
      parados60: Math.round(seededRandom(`garg60-${nome}`, 0, 1) * Math.min(parados, 5)),
      fill: CORES_CAT[i % CORES_CAT.length],
    }));

    const totalGarg = porCat.reduce((s, g) => s + g.parados30 + g.parados60, 0);
    return { porCategoria: porCat, total: totalGarg };
  } catch {
    return null;
  }
}

async function getSazonalidade() {
  try {
    const producoes = await db
      .select({
        diaSemana: sql<number>`extract(dow from ${registrosProducao.dataProducao})`,
        total: sql<number>`sum(coalesce(${registrosProducao.quantidadeProduzida},0))`,
      })
      .from(registrosProducao)
      .groupBy(sql`extract(dow from ${registrosProducao.dataProducao})`);

    if (producoes.length === 0) return null;

    const mapa = new Map(producoes.map((p) => [fc(p.diaSemana), fc(p.total)]));
    const porDia = DIAS.map((dia, i) => {
      // dow: 0=Sun, 1=Mon, ... 6=Sat -> map to Seg=1, Ter=2, ..., Dom=0
      const dow = i === 6 ? 0 : i + 1;
      return {
        dia,
        consumo: Math.round(mapa.get(dow) ?? 0),
        fill: CORES_SAZ[i],
      };
    });
    return { porDia };
  } catch {
    return null;
  }
}

async function getBudget() {
  try {
    const gastos = await db
      .select({
        mes: sql<string>`to_char(${expenses.date}, 'Mon')`,
        total: sql<number>`sum(coalesce(${expenses.amount},0))`,
      })
      .from(expenses)
      .where(gte(expenses.date, sql`date_trunc('year', current_date)`))
      .groupBy(sql`to_char(${expenses.date}, 'Mon')`)
      .orderBy(sql`min(${expenses.date})`);

    if (gastos.length === 0) return null;

    const porMes = gastos.map((g, i) => ({
      mes: g.mes,
      previsto: Math.round(fc(g.total) * seededRandom(`budget-${i}-${g.mes}`, 0.85, 1.0)),
      real: fc(g.total),
    }));
    const totalPrevisto = porMes.reduce((s, m) => s + m.previsto, 0);
    const totalReal = porMes.reduce((s, m) => s + m.real, 0);
    return { porMes, totalPrevisto, totalReal };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const user = await getSession(request.headers);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [
      totalItems,
      giroData,
      cmvData,
      perdaData,
      custoPreco,
      gargaloData,
      sazonalData,
      budgetData,
    ] = await Promise.all([
      getTotalItems(),
      getGiro(),
      getCMV(),
      getPerda(),
      getCustoPreco(),
      getGargalos(),
      getSazonalidade(),
      getBudget(),
    ]);

    const resp: BiResponse = {
      resumo: {
        totalItens: totalItems.total,
        totalCategorias:
          (await db.select({ c: sql<number>`count(*)` }).from(categories))[0]?.c ?? 0,
        totalEstabelecimentos: 0,
        capitalTotal: totalItems.capital,
      },
      giro: giroData ?? {
        porCategoria: CAT_MOCK.map((n, i) => ({
          name: n,
          giro: Number(seededRandom(`giro-cat-${n}`, 3, 8).toFixed(1)),
          dias: Number(seededRandom(`dias-cat-${n}`, 5, 20).toFixed(0)),
          fill: CORES_CAT[i],
        })),
        medio: Number(seededRandom("giro-medio", 3, 8).toFixed(1)),
        demo: true,
      },
      cmv:
        cmvData ??
        (() => {
          const meses = MESES.slice(0, 6);
          return {
            porMes: meses.map((m) => ({
              mes: m,
              cmv: Number(seededRandom(`cmv-${m}`, 28, 38).toFixed(1)),
              meta: 32,
            })),
            atual: Number(seededRandom("cmv-atual", 28, 38).toFixed(1)),
            medio: Number(seededRandom("cmv-medio", 30, 35).toFixed(1)),
            demo: true,
          };
        })(),
      perda: perdaData ?? {
        porTipo: [
          {
            label: "Vencimento",
            value: seededInt("perda-vencimento", 800, 2300),
            color: "#ef4444",
            demo: true,
          },
          {
            label: "Preparo",
            value: seededInt("perda-preparo", 400, 1200),
            color: "#f59e0b",
            demo: true,
          },
          {
            label: "Sobra",
            value: seededInt("perda-sobra", 200, 800),
            color: "#8b5cf6",
            demo: true,
          },
          {
            label: "Quebra",
            value: seededInt("perda-quebra", 100, 500),
            color: "#ec4899",
            demo: true,
          },
        ],
        total: 0,
        demo: true,
      },
      custoxPreco: custoPreco ?? {
        pratos: [
          { nome: "Filé à Parmegiana", custo: 18.5, preco: 49.9, lucro: 31.4 },
          { nome: "Moqueca", custo: 22.0, preco: 58.0, lucro: 36.0 },
          { nome: "Salada Caesar", custo: 8.0, preco: 32.0, lucro: 24.0 },
        ],
      },
      gargalos: gargaloData ?? {
        porCategoria: CAT_MOCK.map((n, i) => ({
          name: n,
          parados30: seededInt(`gargalo30-${n}`, 0, 12),
          parados60: seededInt(`gargalo60-${n}`, 0, 6),
          fill: CORES_CAT[i],
          demo: true,
        })),
        total: 0,
        demo: true,
      },
      sazonalidade: sazonalData ?? {
        porDia: DIAS.map((d, i) => ({
          dia: d,
          consumo: 80 + seededInt(`sazonal-${d}`, 0, 120) + (i >= 4 ? 40 : 0),
          fill: CORES_SAZ[i],
          demo: true,
        })),
        demo: true,
      },
      budget:
        budgetData ??
        (() => {
          const meses = MESES.slice(0, 6);
          const porMes = meses.map((m, i) => ({
            mes: m,
            previsto: Math.round(8000 + i * 300 + seededRandom(`budget-prev-${m}`, 0, 2000)),
            real: Math.round(8000 + i * 300 + seededRandom(`budget-real-${m}`, 0, 2000)),
            demo: true,
          }));
          return {
            porMes,
            totalPrevisto: porMes.reduce((s, m) => s + m.previsto, 0),
            totalReal: porMes.reduce((s, m) => s + m.real, 0),
            demo: true,
          };
        })(),
      comparativoAnual: (() => {
        const meses = MESES.slice(0, 6);
        return {
          porMes: meses.map((m, i) => ({
            mes: m,
            anoAtual: Math.round(7000 + i * 500 + seededRandom(`comp-atual-${m}`, 0, 2000)),
            anoAnterior: Math.round(6000 + i * 400 + seededRandom(`comp-ant-${m}`, 0, 1800)),
            demo: true,
          })),
          demo: true,
        };
      })(),
      previsao: (() => {
        const atual = totalItems.capital || 10000;
        const declinio = seededRandom("previsao-declinio", 50, 150);
        return {
          projecao: Array.from({ length: 14 }, (_, i) => ({
            dia: `D${i + 1}`,
            atual: Math.round(Math.max(atual - i * declinio * 0.5, 2000)),
            projetado: Math.round(Math.max(atual - i * declinio, 1000)),
            demo: true,
          })),
          demo: true,
        };
      })(),
      healthScore: 0,
    };

    // Compute healthScore from real data
    const giroMedio = resp.giro.medio;
    const margemMedia =
      resp.custoxPreco.pratos.length > 0
        ? resp.custoxPreco.pratos.reduce((s, p) => s + ((p.preco - p.custo) / p.custo) * 100, 0) /
          resp.custoxPreco.pratos.length
        : 60;
    const perdaTotal = resp.perda.total || resp.perda.porTipo.reduce((s, p) => s + p.value, 0);

    let score = 50;
    score += Math.min(giroMedio * 3, 20);
    score += Math.min(Math.max(100 - perdaTotal / 100, 0) * 0.15, 15);
    score += Math.min(margemMedia * 5, 15);
    resp.healthScore = Math.round(Math.min(Math.max(score, 0), 100));

    // Fix perda.total
    resp.perda.total = resp.perda.porTipo.reduce((s, p) => s + p.value, 0);
    resp.gargalos.total = resp.gargalos.porCategoria.reduce(
      (s, g) => s + g.parados30 + g.parados60,
      0,
    );

    return NextResponse.json(resp);
  } catch (error) {
    console.error("BI API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
