function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DEFAULT_UNITS = new Set([
  "kg",
  "g",
  "l",
  "ml",
  "un",
  "und",
  "unidade",
  "pacote",
  "pct",
  "cx",
  "caixa",
  "litro",
  "grama",
  "gramas",
  "quilograma",
]);

export type Campo =
  | "name"
  | "category"
  | "currentQuantity"
  | "unit"
  | "minStock"
  | "unitPrice"
  | null;

export type ColunaDetectada = {
  index: number;
  header: string;
  campo: Campo;
  confianca: "alta" | "media" | "baixa";
};

const MAPEAMENTOS: { regex: RegExp; campo: Campo; peso: number }[] = [
  {
    regex:
      /^(nome|item|produto|description|descricao|prod|product|item_name|nome_item|nome_produto)$/i,
    campo: "name",
    peso: 10,
  },
  {
    regex: /^(categoria|category|grupo|tipo|categ|categor|departamento|secao|departament)$/i,
    campo: "category",
    peso: 10,
  },
  {
    regex:
      /^(quantidade|qtd|qty|current_quantity|currentquantity|estoque_atual|quantidade_atual|quant|qtde)$/i,
    campo: "currentQuantity",
    peso: 10,
  },
  { regex: /^(unidade|un|unit|uom|unidad|unid_medida|medida)$/i, campo: "unit", peso: 10 },
  {
    regex: /^(estoque_minimo|min_stock|minstock|min|est_min|minimo|minimo_estoque)$/i,
    campo: "minStock",
    peso: 10,
  },
  {
    regex: /^(preco|preco_unitario|unit_price|price|valor|custo|preco_medio|preco_compra)$/i,
    campo: "unitPrice",
    peso: 10,
  },
  { regex: /^(name|nome)$/i, campo: "name", peso: 9 },
  { regex: /^(min|minimo)$/i, campo: "minStock", peso: 9 },
  { regex: /^(price|preco)$/i, campo: "unitPrice", peso: 9 },
  { regex: /^(quantidade_em_estoque|qtd_estoque|estoque)$/i, campo: "currentQuantity", peso: 9 },
];

export function detectarColunas(headers: string[], samples: string[][]): ColunaDetectada[] {
  const usados = new Set<Campo>();
  const resultado: ColunaDetectada[] = [];

  const indicesRestantes = headers.map((_, i) => i);

  const combinacoes = indicesRestantes.map((i) => ({
    index: i,
    header: headers[i],
    normalizado: normalizar(headers[i]),
  }));

  const acertados = new Set<number>();

  for (const m of MAPEAMENTOS) {
    for (const c of combinacoes) {
      if (acertados.has(c.index)) continue;
      if (usados.has(m.campo)) continue;
      if (m.regex.test(c.header) || m.regex.test(c.normalizado)) {
        resultado.push({ index: c.index, header: c.header, campo: m.campo, confianca: "alta" });
        usados.add(m.campo);
        acertados.add(c.index);
        break;
      }
    }
  }

  for (const c of combinacoes) {
    if (acertados.has(c.index)) continue;
    const amostra = samples.map((r) => r[c.index]).filter(Boolean);
    const temNumero = amostra.some((v) => /^\d+[.,]?\d*$/.test(v.trim()));
    const temUnidade = amostra.some((v) => DEFAULT_UNITS.has(normalizar(v)));
    const comprimentoMedio =
      amostra.reduce((s, v) => s + v.length, 0) / Math.max(amostra.length, 1);

    if (temUnidade && !usados.has("unit")) {
      resultado.push({ index: c.index, header: c.header, campo: "unit", confianca: "media" });
      usados.add("unit");
      acertados.add(c.index);
    } else if (temNumero && !usados.has("currentQuantity")) {
      resultado.push({
        index: c.index,
        header: c.header,
        campo: "currentQuantity",
        confianca: "media",
      });
      usados.add("currentQuantity");
      acertados.add(c.index);
    } else if (comprimentoMedio > 15 && !usados.has("name")) {
      resultado.push({ index: c.index, header: c.header, campo: "name", confianca: "baixa" });
      usados.add("name");
      acertados.add(c.index);
    }
  }

  for (const c of combinacoes) {
    if (!acertados.has(c.index)) {
      resultado.push({ index: c.index, header: c.header, campo: null, confianca: "baixa" });
    }
  }

  return resultado;
}
