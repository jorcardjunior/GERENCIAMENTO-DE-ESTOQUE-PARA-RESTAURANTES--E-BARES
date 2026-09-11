import { db } from "@/db";
import {
  catalogItems,
  categories,
  estabelecimentos,
  estoqueEstabelecimento,
  expenseCategories,
  expenses,
  fichasTecnicas,
  inventoryItems,
  items,
  registrosPerda,
  registrosProducao,
} from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { ESPECIALISTAS, SISTEMA_KB } from "@/lib/consultoria-kb";
import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function match(str: string, ...termos: string[]): boolean {
  const n = normalizar(str);
  return termos.some((t) => n.includes(normalizar(t)));
}

function fraseAleatoria(area?: string) {
  const f = area ? ESPECIALISTAS.filter((e) => e.area === area) : ESPECIALISTAS;
  return f[Math.floor(Math.random() * f.length)] ?? ESPECIALISTAS[0];
}

function formatarData(d: string | null | undefined): string {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
}

function formatarMoeda(val: number): string {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarNumero(val: number, decimais = 2): string {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
}

function formatarPercentual(val: number, decimais = 1): string {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }) + "%";
}

async function gerarRelatorioCompleto() {
  const linhas: string[] = [];
  const agora = new Date();
  const h = agora.getHours();
  const saudacao = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";

  linhas.push(
    `${saudacao}! Aqui está o panorama completo do seu negócio, baseado em todas as fontes de dados.`,
  );

  // -- Consulta principal: estoque_estabelecimento (mais completa) --
  let cap = 0;
  let tot = 0;
  let crit = 0;
  try {
    const [aggNovo] = await db
      .select({
        capital: sql<number>`sum(coalesce(${estoqueEstabelecimento.estoqueAtual},0)*coalesce(${estoqueEstabelecimento.custoMedio},0))`,
        registros: sql<number>`count(*)`,
      })
      .from(estoqueEstabelecimento);

    const [catCnt] = await db.select({ total: sql<number>`count(*)` }).from(catalogItems);

    if (catCnt && Number(catCnt.total) > 0) {
      tot = Number(catCnt.total);
      cap = Number(aggNovo?.capital ?? 0);
    }
  } catch {}

  // -- Fallback: tabela items (legado) --
  if (tot === 0) {
    try {
      const [legado] = await db
        .select({
          qtd: sql<number>`sum(current_quantity)`,
          capital: sql<number>`sum(coalesce(unit_price,0)*current_quantity)`,
          tot: sql<number>`count(*)`,
        })
        .from(items);
      if (legado && Number(legado.tot) > 0) {
        tot = Number(legado.tot);
        cap = Number(legado.capital ?? 0);
      }
    } catch {}
  }

  // -- Itens criticos (abaixo do minimo) --
  try {
    const baixo = await db
      .select({ c: sql<number>`count(*)` })
      .from(estoqueEstabelecimento)
      .where(
        and(
          sql`${estoqueEstabelecimento.estoqueAtual} is not null`,
          sql`${estoqueEstabelecimento.estoqueMinimo} is not null`,
          sql`${estoqueEstabelecimento.estoqueAtual} <= ${estoqueEstabelecimento.estoqueMinimo}`,
        ),
      );
    crit = Number(baixo[0]?.c ?? 0);
  } catch {
    try {
      const baixo = await db
        .select({ c: sql<number>`count(*)` })
        .from(items)
        .where(sql`current_quantity <= min_stock`);
      crit = Number(baixo[0]?.c ?? 0);
    } catch {}
  }

  const pct = tot > 0 ? ((crit / tot) * 100) : 0;

  linhas.push("");
  linhas.push("**Financeiro**");
  linhas.push(`- Produtos cadastrados: ${formatarNumero(tot, 0)}.`);
  linhas.push(`- Capital estimado em estoque: ${formatarMoeda(cap)}.`);
  linhas.push(`- Itens abaixo do mínimo: ${formatarNumero(crit, 0)} (${formatarPercentual(pct)}).`);

  const c1 = fraseAleatoria("Gestao Estrategica");
  if (cap > 10000 && crit > tot * 0.2) {
    linhas.push("");
    linhas.push(`Atenção: capital elevado combinado com muitos itens críticos. "${c1.frase}"`);
    linhas.push("Sugiro revisar políticas de compra e aplicar análise ABC.");
  } else if (cap > 5000 || crit > tot * 0.1) {
    linhas.push("");
    linhas.push(`Acompanhamento necessário. "${c1.frase}"`);
    linhas.push(
      "Ajuste os parâmetros de estoque mínimo e monitore o giro dos itens de maior valor.",
    );
  }

  try {
    const perdas = await db
      .select({
        total: sql<number>`count(*)`,
        custo: sql<number>`sum(coalesce(custo_perda,0))`,
        tipo: registrosPerda.tipoPerda,
      })
      .from(registrosPerda)
      .groupBy(registrosPerda.tipoPerda)
      .orderBy(desc(sql`sum(coalesce(custo_perda,0))`));

    if (perdas.length > 0) {
      const totalPerdas = perdas.reduce((s, p) => s + Number(p.custo ?? 0), 0);
      const totalOcorr = perdas.reduce((s, p) => s + Number(p.total), 0);
      linhas.push("");
      linhas.push("**Perdas**");
      linhas.push(`Total: ${formatarNumero(totalOcorr, 0)} ocorrências | Custo: ${formatarMoeda(totalPerdas)}.`);
      for (const p of perdas) {
        const nome =
          p.tipo === "vencimento"
            ? "Vencimento"
            : p.tipo === "preparo"
              ? "Erro de preparo"
              : p.tipo === "sobra"
                ? "Sobra"
                : p.tipo === "deterioracao"
                  ? "Deterioração"
                  : p.tipo === "quebra"
                    ? "Quebra"
                    : (p.tipo ?? "Outro");
        linhas.push(`  ${nome}: ${formatarNumero(Number(p.total), 0)} ocorrências | ${formatarMoeda(Number(p.custo ?? 0))}.`);
      }
    }
  } catch {}

  try {
    const contas = await db
      .select({
        desc: expenses.description,
        valor: expenses.amount,
        data: expenses.date,
        cat: expenseCategories.name,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(eq(expenses.paid, false))
      .orderBy(expenses.date)
      .limit(10);

    if (contas.length > 0) {
      const total = contas.reduce((s, c) => s + Number(c.valor ?? 0), 0);
      linhas.push("");
      linhas.push("**Contas a pagar**");
      linhas.push(`Total: ${formatarNumero(contas.length, 0)} contas | ${formatarMoeda(total)}.`);
      for (const c of contas) {
        linhas.push(
          `  ${formatarData(c.data)} — ${c.desc ?? "-"} | ${formatarMoeda(Number(c.valor ?? 0))}.`,
        );
      }
    }
  } catch {}

  try {
    const fichas = await db
      .select({
        nome: fichasTecnicas.nome,
        custo: fichasTecnicas.custoTotal,
        preco: fichasTecnicas.precoSugerido,
      })
      .from(fichasTecnicas)
      .where(
        and(sql`${fichasTecnicas.custoTotal} is not null`, sql`${fichasTecnicas.custoTotal} > 0`),
      )
      .limit(5);

    if (fichas.length > 0) {
      linhas.push("");
      linhas.push("**Margem dos pratos**");
      for (const f of fichas) {
        const c = Number(f.custo ?? 0);
        const p = Number(f.preco ?? 0);
        const m = p > 0 ? ((p - c) / p) * 100 : 0;
        linhas.push(
          `  ${f.nome}: custo ${formatarMoeda(c)} | venda ${formatarMoeda(p)} | margem ${formatarPercentual(m)}.`,
        );
      }
    }
  } catch {}

  const cFim = fraseAleatoria();
  linhas.push("");
  linhas.push(`"${cFim.frase}"`);

  return linhas.join("\n");
}

async function handlerContas(pergunta: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeStr = hoje.toISOString().split("T")[0];

  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const inicioMes = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-01`;
  const fimMes = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-31`;

  try {
    const baseQuery = db
      .select({
        desc: expenses.description,
        valor: expenses.amount,
        data: expenses.date,
        paga: expenses.paid,
        cat: expenseCategories.name,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id));

    if (match(pergunta, "hoje", "agora", "di")) {
      const contasHoje = await baseQuery
        .where(and(eq(expenses.date, hojeStr), eq(expenses.paid, false)))
        .orderBy(expenses.date)
        .limit(30);

      if (contasHoje.length === 0) {
        return { texto: "Nenhuma conta para pagar hoje.", rota: "contas_hoje" };
      }

      const total = contasHoje.reduce((s, c) => s + Number(c.valor ?? 0), 0);
      const linhas: string[] = [
        `Contas para pagar hoje (${hoje.toLocaleDateString("pt-BR")}):`,
        "",
      ];
      for (const c of contasHoje) {
        linhas.push(`  ${c.desc ?? "-"} | ${formatarMoeda(Number(c.valor ?? 0))}`);
      }
      linhas.push("");
      linhas.push(`Total: ${formatarMoeda(total)}`);
      return { texto: linhas.join("\n"), rota: "contas_hoje" };
    }

    if (match(pergunta, "mes", "mens")) {
      const contasMes = await baseQuery
        .where(
          and(gte(expenses.date, inicioMes), lte(expenses.date, fimMes), eq(expenses.paid, false)),
        )
        .orderBy(expenses.date)
        .limit(50);

      if (contasMes.length === 0) {
        const nomeMes = hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        return { texto: `Nenhuma conta pendente para ${nomeMes}.`, rota: "contas_mes" };
      }

      const total = contasMes.reduce((s, c) => s + Number(c.valor ?? 0), 0);
      const nomesMes = [
        "Janeiro",
        "Fevereiro",
        "Marco",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ];
      const linhas: string[] = [
        `Contas de ${nomesMes[mesAtual - 1]} ${anoAtual} (${contasMes.length} pendentes):`,
        "",
      ];
      for (const c of contasMes) {
        linhas.push(
          `  ${formatarData(c.data)} — ${c.desc ?? "-"} | ${formatarMoeda(Number(c.valor ?? 0))}`,
        );
      }
      linhas.push("");
      linhas.push(`Total a pagar no mês: ${formatarMoeda(total)}`);
      return { texto: linhas.join("\n"), rota: "contas_mes" };
    }

    const contas = await baseQuery.where(eq(expenses.paid, false)).orderBy(expenses.date).limit(30);

    if (contas.length === 0) {
      return { texto: "Nenhuma conta pendente. Tudo em dia!", rota: "contas" };
    }

    const total = contas.reduce((s, c) => s + Number(c.valor ?? 0), 0);
    const linhas: string[] = [
      `Contas a pagar (${contas.length} pendentes, ${formatarMoeda(total)}):`,
      "",
    ];
    for (const c of contas) {
      const venceu = c.data && c.data < hojeStr ? " (VENCIDA)" : "";
      linhas.push(
        `  ${formatarData(c.data)} — ${c.desc ?? "-"} | ${formatarMoeda(Number(c.valor ?? 0))}${venceu}`,
      );
    }
    return { texto: linhas.join("\n"), rota: "contas" };
  } catch {
    return {
      texto: "Nenhuma conta registrada. Cadastre as contas no módulo Financeiro.",
      rota: "contas",
    };
  }
}

async function handlerEstoqueDetalhado() {
  // Tenta a tabela mais completa primeiro: estoque_estabelecimento
  try {
    const dados = await db
      .select({
        estabNome: estabelecimentos.nome,
        itemNome: catalogItems.name,
        qtd: estoqueEstabelecimento.estoqueAtual,
        min: estoqueEstabelecimento.estoqueMinimo,
        custo: estoqueEstabelecimento.custoMedio,
        local: estoqueEstabelecimento.localizacao,
        lote: estoqueEstabelecimento.lote,
      })
      .from(estoqueEstabelecimento)
      .leftJoin(estabelecimentos, eq(estoqueEstabelecimento.estabelecimentoId, estabelecimentos.id))
      .leftJoin(catalogItems, eq(estoqueEstabelecimento.catalogItemId, catalogItems.id))
      .orderBy(estabelecimentos.nome, catalogItems.name);

    if (dados.length > 0) {
      const grupos: Record<string, string[]> = {};
      for (const d of dados) {
        const chave = d.estabNome ?? "Sem estabelecimento";
        if (!grupos[chave]) grupos[chave] = [];
        const partes = [`  ${d.itemNome ?? "?"}: ${formatarNumero(Number(d.qtd), 3)}`];
        if (d.local) partes.push(`[${d.local}]`);
        if (Number(d.min) > 0) partes.push(`(mín: ${formatarNumero(Number(d.min), 3)})`);
        if (Number(d.custo) > 0) partes.push(`${formatarMoeda(Number(d.custo))}`);
        grupos[chave].push(partes.join(" "));
      }
      const linhas = [
        `Estoque detalhado (${dados.length} registros em ${Object.keys(grupos).length} unidades):`,
        "",
      ];
      for (const [estab, itens] of Object.entries(grupos)) {
        linhas.push(`**${estab}:**`);
        linhas.push(...itens);
        linhas.push("");
      }
      return { texto: linhas.join("\n"), rota: "estoque" };
    }
  } catch {}

  // Fallback: tabela items legada
  const cats = await db
    .select({
      catName: categories.name,
      itemName: items.name,
      qtd: items.currentQuantity,
      un: items.unit,
      min: items.minStock,
      preco: items.unitPrice,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .orderBy(categories.name, items.name);

  if (cats.length === 0) return { texto: "Estoque vazio. Cadastre seus itens.", rota: "estoque" };

  const grupos: Record<string, string[]> = {};
  for (const c of cats) {
    const chave = c.catName ?? "Sem categoria";
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(
      `  ${c.itemName}: ${c.qtd} ${c.un} (mín: ${c.min})${Number(c.preco) > 0 ? ` | ${formatarMoeda(Number(c.preco))}` : ""}`,
    );
  }

  const linhas = [`Estoque (${cats.length} itens):`, ""];
  for (const [cat, itens] of Object.entries(grupos)) {
    linhas.push(`${cat}:`);
    linhas.push(...itens);
    linhas.push("");
  }
  return { texto: linhas.join("\n"), rota: "estoque" };
}

async function handlerProduto(nome: string) {
  if (!nome) return { texto: "Digite o nome do produto.", rota: "produto" };

  // Tenta estoque_estabelecimento + catalog_items primeiro
  try {
    const itens = await db
      .select({
        itemNome: catalogItems.name,
        qtd: estoqueEstabelecimento.estoqueAtual,
        min: estoqueEstabelecimento.estoqueMinimo,
        custo: estoqueEstabelecimento.custoMedio,
        estab: estabelecimentos.nome,
        local: estoqueEstabelecimento.localizacao,
      })
      .from(estoqueEstabelecimento)
      .leftJoin(catalogItems, eq(estoqueEstabelecimento.catalogItemId, catalogItems.id))
      .leftJoin(estabelecimentos, eq(estoqueEstabelecimento.estabelecimentoId, estabelecimentos.id))
      .where(
        or(
          like(catalogItems.name, `%${nome}%`),
          like(catalogItems.name, `%${nome.toUpperCase()}%`),
          ...(nome
            .split(" ")
            .map((p) => (p.length > 2 ? like(catalogItems.name, `%${p}%`) : undefined))
            .filter(Boolean) as any),
        ),
      )
      .orderBy(estabelecimentos.nome)
      .limit(10);

    if (itens.length > 0) {
      return {
        texto: itens
          .map(
            (i) =>
              `${i.itemNome ?? "?"} @ ${i.estab ?? "?"}: ${formatarNumero(Number(i.qtd), 3)}${Number(i.min) > 0 ? ` (mín: ${formatarNumero(Number(i.min), 3)})` : ""}${i.local ? ` [${i.local}]` : ""}${Number(i.custo) > 0 ? ` | ${formatarMoeda(Number(i.custo))}` : ""}`,
          )
          .join("\n"),
        rota: "produto",
      };
    }
  } catch {}

  // Fallback: tabela items legada
  const itens = await db
    .select()
    .from(items)
    .where(
      or(
        like(items.name, `%${nome}%`),
        like(items.name, `%${nome.toUpperCase()}%`),
        ...(nome
          .split(" ")
          .map((p) => (p.length > 2 ? like(items.name, `%${p}%`) : undefined))
          .filter(Boolean) as any),
      ),
    )
    .limit(5);

  if (itens.length === 0) return { texto: `Não encontrei "${nome}" no estoque.`, rota: "produto" };
  return {
    texto: itens
      .map(
        (i) =>
          `${i.name}: ${i.currentQuantity} ${i.unit} (mín: ${i.minStock})${Number(i.unitPrice) > 0 ? ` | ${formatarMoeda(Number(i.unitPrice))}` : ""}`,
      )
      .join("\n"),
    rota: "produto",
  };
}

async function handlerEstoqueBaixo() {
  // Tenta estoque_estabelecimento primeiro
  try {
    const low = await db
      .select({
        itemNome: catalogItems.name,
        qtd: estoqueEstabelecimento.estoqueAtual,
        min: estoqueEstabelecimento.estoqueMinimo,
        estab: estabelecimentos.nome,
        local: estoqueEstabelecimento.localizacao,
        custo: estoqueEstabelecimento.custoMedio,
      })
      .from(estoqueEstabelecimento)
      .leftJoin(catalogItems, eq(estoqueEstabelecimento.catalogItemId, catalogItems.id))
      .leftJoin(estabelecimentos, eq(estoqueEstabelecimento.estabelecimentoId, estabelecimentos.id))
      .where(
        and(
          sql`${estoqueEstabelecimento.estoqueAtual} is not null`,
          sql`${estoqueEstabelecimento.estoqueMinimo} is not null`,
          sql`${estoqueEstabelecimento.estoqueAtual} <= ${estoqueEstabelecimento.estoqueMinimo}`,
        ),
      )
      .orderBy(estabelecimentos.nome, catalogItems.name)
      .limit(20);

    if (low.length > 0) {
      return {
        texto: `Itens com estoque baixo (${low.length}):\n${low
          .map(
            (i) =>
              `  ${i.itemNome ?? "?"} @ ${i.estab ?? "?"}: ${formatarNumero(Number(i.qtd), 3)}${Number(i.min) > 0 ? ` / ${formatarNumero(Number(i.min), 3)} mín` : ""}${i.local ? ` [${i.local}]` : ""}${Number(i.custo) > 0 ? ` | ${formatarMoeda(Number(i.custo))}` : ""}`,
          )
          .join("\n")}`,
        rota: "estoque_baixo",
      };
    }
  } catch {}

  // Fallback: tabela items legada
  const low = await db.select().from(items).where(sql`current_quantity <= min_stock`).limit(15);

  if (low.length === 0) return { texto: "Nenhum item abaixo do mínimo.", rota: "estoque_baixo" };
  return {
    texto: `Itens com estoque baixo (${low.length}):\n${low
      .map(
        (i) =>
          `  ${i.name}: ${i.currentQuantity}/${i.minStock} ${i.unit}${Number(i.unitPrice) > 0 ? ` (${formatarMoeda(Number(i.unitPrice))}/un)` : ""}`,
      )
      .join("\n")}`,
    rota: "estoque_baixo",
  };
}

async function handlerLucroDia() {
  try {
    const hoje = new Date().toISOString().split("T")[0];

    const prod = await db
      .select({
        qtd: sql<number>`sum(coalesce(quantidade_produzida,0))`,
        custo: sql<number>`sum(coalesce(custo_total_producao,0))`,
      })
      .from(registrosProducao)
      .where(sql`date(data_producao) = ${hoje}`);

    const qtd = Number(prod[0]?.qtd ?? 0);
    const custo = Number(prod[0]?.custo ?? 0);

    const fichas = await db
      .select({ custo: fichasTecnicas.custoTotal, preco: fichasTecnicas.precoSugerido })
      .from(fichasTecnicas)
      .where(
        and(sql`${fichasTecnicas.custoTotal} is not null`, sql`${fichasTecnicas.custoTotal} > 0`),
      )
      .limit(10);

    const linhas: string[] = [];

    if (qtd > 0) {
      linhas.push(`Produção: ${formatarNumero(qtd, 0)} unidades | Custo: ${formatarMoeda(custo)}.`);
      if (fichas.length > 0) {
        const precoMedio = fichas.reduce((s, f) => s + Number(f.preco ?? 0), 0) / fichas.length;
        const receita = qtd * precoMedio;
        const lucro = receita - custo;
        const margem = receita > 0 ? ((lucro / receita) * 100) : 0;
        linhas.push(
          `Receita estimada: ${formatarMoeda(receita)} | Lucro: ${formatarMoeda(lucro)} (${formatarPercentual(margem)}).`,
        );
      }
    } else {
      linhas.push("Nenhuma produção registrada hoje.");
    }

    const mes = new Date().getMonth() + 1;
    const ano = new Date().getFullYear();
    const contasMes = await db
      .select({ valor: expenses.amount, paga: expenses.paid })
      .from(expenses)
      .where(
        and(
          gte(expenses.date, `${ano}-${String(mes).padStart(2, "0")}-01`),
          lte(expenses.date, `${ano}-${String(mes).padStart(2, "0")}-31`),
        ),
      );

    if (contasMes.length > 0) {
      const totalMes = contasMes.reduce((s, c) => s + Number(c.valor ?? 0), 0);
      const pagas = contasMes.filter((c) => c.paga).reduce((s, c) => s + Number(c.valor ?? 0), 0);
      linhas.push(`Gastos do mês: ${formatarMoeda(totalMes)} (pago: ${formatarMoeda(pagas)}).`);
    }

    return { texto: linhas.join("\n"), rota: "lucro" };
  } catch {
    return {
      texto: "Dados insuficientes para calcular lucro do dia. Cadastre fichas técnicas e produção.",
      rota: "lucro",
    };
  }
}

async function handlerAjuda(termo: string) {
  const entry = Object.entries(SISTEMA_KB).find(([key, v]) => {
    const t = normalizar(termo);
    return [key, v.titulo].some((s) => normalizar(s).includes(t));
  });
  if (entry) {
    const [_, v] = entry;
    return {
      texto: `${v.titulo}\n\n${v.descricao}\n\nDicas:\n${v.dicas.map((d, i) => `${i + 1}. ${d}`).join("\n")}`,
      rota: "ajuda",
    };
  }
  return null;
}

function detectarFollowUp(q: string, ultimaPergunta: string | undefined): string | null {
  if (!ultimaPergunta) return null;
  const nq = normalizar(q);
  const nu = normalizar(ultimaPergunta);

  const eCurto = /^(e|mas|entao|então)\s/.test(nq) || nq.split(" ").length <= 3;

  if (match(nq, "sim", "ss", "si", "pode ser", "isso", "exato", "corret", "claro", "com certeza")) {
    if (match(nu, "conta", "pag", "boleto", "fatur")) return "contas_mes";
    if (match(nu, "estoque", "iten", "produt")) return "estoque";
    return "relatorio";
  }

  if (!eCurto) return null;

  if (match(nu, "conta", "pag", "boleto", "fatur", "mensal")) {
    if (match(nq, "mes")) return "contas_mes";
    if (match(nq, "hoje", "agora", "di")) return "contas_hoje";
    if (match(nq, "semana")) return "contas_mes";
    return "contas_mes";
  }

  if (match(nu, "estoque", "iten", "insum", "produt", "merce")) {
    if (match(nq, "baixo", "critic", "falt", "compr", "repor")) return "estoque_baixo";
    if (match(nq, "total", "quantos", "todos")) return "estoque";
    return "estoque";
  }

  if (match(nu, "lucro", "receit", "ganh", "fature", "dia")) {
    return "lucro";
  }

  return null;
}

async function executarRota(rota: string, pergunta: string) {
  switch (rota) {
    case "contas_hoje":
    case "contas_mes":
    case "contas":
      return handlerContas(
        rota === "contas_hoje" ? "hoje" : rota === "contas_mes" ? "mes" : "todas",
      );
    case "estoque":
      return handlerEstoqueDetalhado();
    case "estoque_baixo":
      return handlerEstoqueBaixo();
    case "lucro":
      return handlerLucroDia();
    case "produto":
      return handlerProduto(pergunta);
    case "relatorio":
      return { texto: await gerarRelatorioCompleto(), rota: "relatorio" };
    default:
      return { texto: await gerarRelatorioCompleto(), rota: "relatorio" };
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request.headers);
    const { pergunta, ultimaPergunta } = (await request.json()) as {
      pergunta: string;
      ultimaPergunta?: string;
    };

    if (!session) {
      return NextResponse.json({ resposta: "Faça login para usar o assistente.", rota: "" });
    }

    const isAdmin = session.role === "admin" || session.role === "owner";

    if (!pergunta) {
      return NextResponse.json({
        resposta: "Digite sua pergunta. Ex: 'O que vou pagar hoje?'",
        rota: "",
      });
    }

    const q = pergunta.trim();

    // Saudacao / primeiro contato
    if (
      match(
        q,
        "oi",
        "ola",
        "bom dia",
        "boa tarde",
        "boa noite",
        "hey",
        "hello",
        "e ai",
        "e aí",
        "iae",
        "olá",
      )
    ) {
      const h = new Date().getHours();
      const saudacao = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
      const comum =
        "- Tour guiado pelo sistema (peça: 'quero fazer o tour')\n" +
        "- Estoque detalhado por categoria\n" +
        "- Itens com estoque baixo ou produtos especificos\n" +
        "- Dicas sobre cada módulo do sistema\n" +
        "- Importacao inteligente de dados";
      const admin =
        "- Relatorio completo do negocio (financas, perdas, margens)\n" +
        "- Contas a pagar (hoje, este mes, ou todas)\n" +
        "- Calcular lucro do dia\n";
      return NextResponse.json({
        resposta: `${saudacao}, ${session.name}! Sou a consultora do EstoqueRest. Posso te ajudar com:\n\n${
          isAdmin
            ? admin + comum
            : `${comum}\n\nNota: informações financeiras são restritas a administradores.`
        }\n\nO que voce gostaria de saber?`,
        rota: "saudacao",
      });
    }

    // Tour guiado / aprender o sistema (prioridade: antes de qualquer outra rota)
    if (
      match(
        q,
        "tour",
        "aprender",
        "tutorial",
        "passeio",
        "conhecer o sistema",
        "conhecer o programa",
        "como funciona",
        "novo por aqui",
        "primeira vez",
        "mostrar o sistema",
        "mostrar o programa",
        "quero conhecer",
        "quero aprender",
        "quero ver como funciona",
        "pode me mostrar",
        "me guiar",
        "fazer tour",
        "iniciar tour",
        "comecar tour",
        "me ensinar",
        "sou novo",
        "estou começando",
      )
    ) {
      return NextResponse.json({
        resposta:
          "Claro! Vou iniciar o tour guiado para você conhecer todos os módulos do sistema. 🎯\n\nPasse pelos destaques para aprender na prática!",
        rota: "iniciar_tour",
      });
    }

    // Follow-up detection
    const rotaFollowUp = detectarFollowUp(q, ultimaPergunta);
    if (rotaFollowUp) {
      if (
        !isAdmin &&
        ["contas", "contas_hoje", "contas_mes", "lucro", "relatorio"].includes(rotaFollowUp)
      ) {
        return NextResponse.json({
          resposta: "Apenas administradores podem acessar informações financeiras.",
          rota: "restrito",
        });
      }
      const result = await executarRota(rotaFollowUp, q);
      return NextResponse.json({ resposta: result.texto, rota: result.rota });
    }

    // Ajuda sobre o sistema
    const ajuda = await handlerAjuda(q);
    if (ajuda) return NextResponse.json({ resposta: ajuda.texto, rota: ajuda.rota });

    // Contas (admin only)
    if (match(q, "conta", "pag", "boleto", "fatur", "devo", "divid", "mensal")) {
      if (!isAdmin)
        return NextResponse.json({
          resposta: "Apenas administradores podem consultar contas.",
          rota: "restrito",
        });
      const result = await handlerContas(q);
      return NextResponse.json({ resposta: result.texto, rota: result.rota });
    }

    // Consultoria / relatorio completo (admin only)
    if (
      match(
        q,
        "financ",
        "gasto",
        "dinheir",
        "lucr",
        "prejui",
        "dica",
        "conselh",
        "consultor",
        "relatorio",
        "diagnostic",
        "analis",
        "melhor",
        "negoci",
        "empreended",
        "estrategi",
        "gesta",
        "saud",
        "onde estou err",
        "ponto critic",
        "resumo",
        "panorama",
        "completo",
        "quero sabe",
        "preciso sabe",
        "me ajuda",
      )
    ) {
      if (!isAdmin)
        return NextResponse.json({
          resposta: "Apenas administradores podem acessar análises financeiras.",
          rota: "restrito",
        });
      return NextResponse.json({ resposta: await gerarRelatorioCompleto(), rota: "relatorio" });
    }

    // Estoque detalhado
    if (
      match(
        q,
        "oque tem",
        "o que tem",
        "listar",
        "mostra",
        "exibe",
        "estoque complet",
        "todos os iten",
      )
    ) {
      const result = await handlerEstoqueDetalhado();
      return NextResponse.json({ resposta: result.texto, rota: result.rota });
    }

    // Estoque total (mais preciso: consulta todas as fontes)
    if (match(q, "estoque total", "total de iten", "quantos iten", "quantidad")) {
      const parts: string[] = [];

      // 1. Tabela nova: estoque_estabelecimento (estoque real por estabelecimento + catálogo)
      try {
        const porEstab = await db
          .select({
            nome: estabelecimentos.nome,
            total: sql<number>`sum(coalesce(${estoqueEstabelecimento.estoqueAtual}, 0))`,
            itens: sql<number>`count(*)`,
          })
          .from(estoqueEstabelecimento)
          .leftJoin(
            estabelecimentos,
            eq(estoqueEstabelecimento.estabelecimentoId, estabelecimentos.id),
          )
          .groupBy(estabelecimentos.nome, estabelecimentos.id)
          .orderBy(estabelecimentos.nome);

        const [agg] = await db
          .select({
            total: sql<number>`sum(coalesce(${estoqueEstabelecimento.estoqueAtual}, 0))`,
            registros: sql<number>`count(*)`,
          })
          .from(estoqueEstabelecimento);

        const [catCnt] = await db.select({ total: sql<number>`count(*)` }).from(catalogItems);

        if (agg && Number(agg.total) > 0) {
          parts.push(`**Estoque por estabelecimento (${Number(agg.registros)} registros):**`);
          for (const e of porEstab) {
            parts.push(
              `  ${e.nome ?? "Sem nome"}: ${formatarNumero(Number(e.total), 2)} unidades (${e.itens} itens)`,
            );
          }
          parts.push(
            `**Total geral (estoque_estabelecimento): ${formatarNumero(Number(agg.total), 2)} unidades**`,
          );
          parts.push(`**Produtos no catálogo:** ${Number(catCnt?.total ?? 0)} itens`);
        }
      } catch {}

      // 2. Tabela legada: items (mantida para compatibilidade)
      try {
        const [legado] = await db
          .select({
            total: sql<number>`sum(current_quantity)`,
            qtd: sql<number>`count(*)`,
          })
          .from(items);
        if (legado && Number(legado.total) > 0) {
          parts.push(
            `**Tabela auxiliar (items):** ${formatarNumero(Number(legado.total), 2)} unidades (${Number(legado.qtd)} itens)`,
          );
        }
      } catch {}

      // 3. Tabela inventory_items
      try {
        const [inv] = await db
          .select({
            total: sql<number>`sum(coalesce(${inventoryItems.currentStock}, 0))`,
            qtd: sql<number>`count(*)`,
          })
          .from(inventoryItems);
        if (inv && Number(inv.total) > 0) {
          parts.push(
            `**Inventário (inventory_items):** ${formatarNumero(Number(inv.total), 2)} unidades (${Number(inv.qtd)} itens)`,
          );
        }
      } catch {}

      if (parts.length === 0) {
        return NextResponse.json({
          resposta: "Nenhum estoque registrado no sistema.",
          rota: "estoque",
        });
      }

      return NextResponse.json({ resposta: parts.join("\n"), rota: "estoque" });
    }

    // Produto especifico
    if (match(q, "quanto tem", "busca", "localiz", "estoque d", "tem de", "acha", "procur")) {
      const nome = q.replace(/.*?(?:de|:|\s+)\s*/i, "").trim();
      const result = await handlerProduto(nome || q);
      return NextResponse.json({ resposta: result.texto, rota: result.rota });
    }

    // Estoque baixo
    if (
      match(q, "baixo", "compr", "repor", "critic", "falt", "precis", "alerta", "urgent", "reposi")
    ) {
      const result = await handlerEstoqueBaixo();
      return NextResponse.json({ resposta: result.texto, rota: result.rota });
    }

    // Lucro / dia (admin only)
    if (match(q, "lucro", "receit", "ganh", "fature", "faturament")) {
      if (!isAdmin)
        return NextResponse.json({
          resposta: "Apenas administradores podem consultar lucro e receitas.",
          rota: "restrito",
        });
      const result = await handlerLucroDia();
      return NextResponse.json({ resposta: result.texto, rota: result.rota });
    }

    // Transferencias
    if (match(q, "transferenc", "movimentac", "envi", "receb", "origem", "destino")) {
      const origem = await db
        .select({ id: estabelecimentos.id, nome: estabelecimentos.nome })
        .from(estabelecimentos)
        .limit(5);
      const total = origem.length;
      if (total === 0)
        return NextResponse.json({
          resposta: "Nenhum estabelecimento cadastrado para realizar transferências.",
          rota: "transferencias",
        });
      return NextResponse.json({
        resposta: `📦 **Transferências entre Unidades**\n\nO módulo de transferências permite movimentar itens entre estabelecimentos.\n\nEstabelecimentos disponíveis (${total}):\n${origem.map((e) => `  • ${e.nome}`).join("\n")}\n\nPara criar uma transferência, acesse a aba Transferências no menu lateral.`,
        rota: "transferencias",
      });
    }

    // Indicadores / BI
    if (
      match(
        q,
        "indicador",
        "bi",
        "grafic",
        "kpi",
        "health",
        "healthscore",
        "score",
        "giro",
        "cmv",
        "performance",
      )
    ) {
      if (!isAdmin)
        return NextResponse.json({
          resposta: "Apenas administradores podem acessar os indicadores de desempenho.",
          rota: "restrito",
        });
      return NextResponse.json({
        resposta:
          "📊 **Indicadores (BI)**\n\nO módulo de Indicadores oferece:\n  • Giro de estoque por categoria\n  • CMV (Custo da Mercadoria Vendida) histórico\n  • Perdas por tipo (vencimento, preparo, sobra)\n  • Custo vs Preço de venda por prato\n  • Gargalos (itens parados 30/60 dias)\n  • Sazonalidade (consumo por dia da semana)\n  • Orçado vs Realizado\n  • Projeção de estoque para 14 dias\n  • HealthScore geral do negócio\n\nAcesse Indicadores no menu lateral para visualizar os dashboards completos.",
        rota: "indicadores",
      });
    }

    // Sugestao de compra
    if (
      match(
        q,
        "sugestao de compr",
        "sugestão de compr",
        "recomendac",
        "o que comprar",
        "o que pedir",
        "comprar hoje",
      )
    ) {
      return NextResponse.json({
        resposta:
          "🛒 **Sugestão de Compra**\n\nO sistema analisa o consumo dos últimos 30 dias e sugere:\n  • Quanto comprar de cada item\n  • Fornecedores sugeridos\n  • Prioridades baseadas em estoque mínimo\n\nAcesse Indicadores > Sugestão de Compra no menu ou clique no link dentro das notificações.",
        rota: "sugestao-compra",
      });
    }

    // Preenchimento
    if (
      match(q, "preenchimento", "contagem", "inventario", "inventário", "ajustar estoque", "físic")
    ) {
      return NextResponse.json({
        resposta:
          "📋 **Preenchimento de Estoque**\n\nO módulo de preenchimento permite:\n  • Registrar contagem física dos itens\n  • Ajustar divergências entre estoque teórico e real\n  • Ideal para inventários periódicos\n\nAcesse Preenchimento no menu lateral.",
        rota: "preenchimento",
      });
    }

    // Configuracoes
    if (
      match(q, "configurac", "config", "preferencia", "tema", "som", "alerta sonoro", "notificac")
    ) {
      return NextResponse.json({
        resposta:
          "⚙️ **Configurações do Sistema**\n\nVocê pode configurar:\n  • Som de alerta (ativar/desativar, tipo, volume)\n  • Tema (claro, escuro ou automático)\n  • Preferências de notificação\n\nAcesse Configurações no menu lateral para ajustar.",
        rota: "configuracoes",
      });
    }

    // Perfil
    if (match(q, "perfil", "profile", "minha conta", "meus dados", "meu nome")) {
      const p = session;
      return NextResponse.json({
        resposta: `👤 **Meu Perfil**\n\n  • Nome: ${p.name}\n  • Email: ${p.email}\n  • Cargo: ${p.role}\n  • Empresa: ${p.companyName || "Não vinculada"}\n\nAcesse Meu Perfil no menu do usuário (canto inferior esquerdo) para mais detalhes.`,
        rota: "perfil",
      });
    }

    // Fornecedores
    if (match(q, "fornecedor", "supplier", "proveedo")) {
      return NextResponse.json({
        resposta:
          "🏢 **Fornecedores**\n\nO sistema permite cadastrar e gerenciar fornecedores:\n  • Nome, contato e CNPJ\n  • Associação de itens a fornecedores preferenciais\n  • Histórico de preços por fornecedor\n\nAcesse a gestão de itens para vincular fornecedores aos seus insumos.",
        rota: "fornecedores",
      });
    }

    // Notificacoes
    if (match(q, "notificac", "alerta", "sininho", "sino", "avis", "badge")) {
      return NextResponse.json({
        resposta:
          '🔔 **Notificações**\n\nA central de notificações mostra:\n  • Itens com estoque baixo ou crítico\n  • Produtos próximos ao vencimento\n  • Total de alertas no ícone do sino\n\nClique no sino no canto superior direito para abrir a central. Você pode clicar em "Ver sugestão de compra" para agir rapidamente.',
        rota: "notificacoes",
      });
    }

    // Categorias
    if (match(q, "categoria", "grupo")) {
      const cats = await db.select().from(categories).orderBy(categories.name);
      if (cats.length === 0)
        return NextResponse.json({ resposta: "Nenhuma categoria cadastrada.", rota: "categorias" });
      return NextResponse.json({
        resposta: `Categorias (${cats.length}):\n${cats.map((c) => `  ${c.name}`).join("\n")}`,
        rota: "categorias",
      });
    }

    // Menus / pratos / cardapio
    if (match(q, "cardapio", "menu", "prato", "receita")) {
      const r = await db.select({ nome: fichasTecnicas.nome }).from(fichasTecnicas).limit(20);
      if (r.length === 0)
        return NextResponse.json({
          resposta: "Nenhum prato cadastrado no cardapio.",
          rota: "cardapio",
        });
      return NextResponse.json({
        resposta: `Pratos cadastrados (${r.length}):\n${r.map((p) => `  ${p.nome}`).join("\n")}`,
        rota: "cardapio",
      });
    }

    // O que voce sabe
    if (
      match(
        q,
        "o que voce sab",
        "o que você sab",
        "oque voce sab",
        "oque você sab",
        "what do you know",
        "oque sabe",
        "o que sabe",
        "vc sabe",
        "você sab",
        "me aju",
        "help",
        "comandos",
        "pergunt",
      )
    ) {
      return NextResponse.json({
        resposta:
          "🤖 **O que eu posso fazer?**\n\nPosso responder perguntas sobre:\n\n🎯 **Tour Guiado**\n  • Fazer o tour completo pelo sistema\n\n📦 **Estoque**\n  • Itens cadastrados, quantidades atuais\n  • Itens próximos ao vencimento\n  • Valor total do estoque\n  • Alertas de estoque baixo ou crítico\n\n📋 **Preenchimento / Contagem**\n  • Registrar contagem física de itens\n  • Ajustar divergências\n\n🔄 **Transferências**\n  • Movimentar itens entre unidades\n\n📊 **Indicadores**\n  • Giro de estoque, CMV, perdas\n  • HealthScore, projeções\n  • Sugestão de compra\n\n🍽️ **Cardápio**\n  • Pratos cadastrados e fichas técnicas\n\n🏷️ **Categorias**\n  • Grupos de itens cadastrados\n\n🔔 **Notificações**\n  • Alertas e central de notificações\n\n⚙️ **Configurações**\n  • Som, tema, preferências\n\n👤 **Perfil**\n  • Seus dados de usuário\n\n🏢 **Fornecedores**\n  • Cadastro e gestão\n\nÉ só me perguntar sobre qualquer um desses tópicos!",
        rota: null,
      });
    }

    // Fallback — não entendeu
    return NextResponse.json({
      resposta:
        "Desculpe, não entendi sua pergunta. Tente perguntar sobre:\n  • 🎯 Tour guiado pelo sistema\n  • Estoque (itens, quantidades, validade)\n  • Categorias\n  • Cardápio / Pratos\n  • Preenchimento / Contagem\n  • Transferências entre unidades\n  • Indicadores\n  • Notificações\n  • Sugestão de compra\n  • Configurações\n  • Perfil\n  • Fornecedores",
      rota: null,
    });
  } catch (err) {
    console.error("Erro:", err);
    return NextResponse.json({ resposta: "Erro interno. Tente novamente." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
