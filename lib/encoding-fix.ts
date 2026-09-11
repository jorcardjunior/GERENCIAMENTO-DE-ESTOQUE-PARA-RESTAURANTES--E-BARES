export const MOJIBAKE_PATTERNS: Record<string, string> = {
  "\u00c3\u00a0": "\u00e0",
  "\u00c3\u00a1": "\u00e1",
  "\u00c3\u00a2": "\u00e2",
  "\u00c3\u00a3": "\u00e3",
  "\u00c3\u00a4": "\u00e4",
  "\u00c3\u00a5": "\u00e5",
  "\u00c3\u00a6": "\u00e6",
  "\u00c3\u00a7": "\u00e7",
  "\u00c3\u00a8": "\u00e8",
  "\u00c3\u00a9": "\u00e9",
  "\u00c3\u00aa": "\u00ea",
  "\u00c3\u00ab": "\u00eb",
  "\u00c3\u00ac": "\u00ec",
  "\u00c3\u00ad": "\u00ed",
  "\u00c3\u00ae": "\u00ee",
  "\u00c3\u00af": "\u00ef",
  "\u00c3\u00b0": "\u00f0",
  "\u00c3\u00b1": "\u00f1",
  "\u00c3\u00b2": "\u00f2",
  "\u00c3\u00b3": "\u00f3",
  "\u00c3\u00b4": "\u00f4",
  "\u00c3\u00b5": "\u00f5",
  "\u00c3\u00b6": "\u00f6",
  "\u00c3\u00b8": "\u00f8",
  "\u00c3\u00b9": "\u00f9",
  "\u00c3\u00ba": "\u00fa",
  "\u00c3\u00bb": "\u00fb",
  "\u00c3\u00bc": "\u00fc",
  "\u00c3\u00bd": "\u00fd",
  "\u00c3\u00bf": "\u00ff",
  "\u00c2\u00a0": " ",
  "\u00c2\u00a1": "\u00a1",
  "\u00c2\u00a2": "\u00a2",
  "\u00c2\u00a3": "\u00a3",
  "\u00c2\u00a4": "\u00a4",
  "\u00c2\u00a5": "\u00a5",
  "\u00c2\u00a6": "\u00a6",
  "\u00c2\u00a7": "\u00a7",
  "\u00c2\u00a8": "\u00a8",
  "\u00c2\u00a9": "\u00a9",
  "\u00c2\u00aa": "\u00aa",
  "\u00c2\u00ab": "\u00ab",
  "\u00c2\u00ac": "\u00ac",
  "\u00c2\u00ad": "\u00ad",
  "\u00c2\u00ae": "\u00ae",
  "\u00c2\u00af": "\u00af",
};

export const COMMON_FIXES: Record<string, string> = {
  "Latic??nios": "Laticínios",
  "Camar??o": "Camarão",
  "Pora??o": "Porção",
  "Feij??o": "Feijão",
  "Fil??": "Filé",
  "Bistr??": "Bistrô",
  "S??o": "São",
  "Bar do Z??": "Bar do Zé",
  "Sacola pl??stica": "Sacola plástica",
  "Por????o": "Porção",
  "Molho Madeira": "Molho Madeira",
  "Risoto de Camar??o": "Risoto de Camarão",
  "Feij??o Tropeiro": "Feijão Tropeiro",
  "Picanha na Chapa": "Picanha na Chapa",
  "Bruschetta Caprese": "Bruschetta Caprese",
  "Petisco da Casa": "Petisco da Casa",
  "Combo Chopp": "Combo Chopp",
  "Nhoque da Nonna": "Nhoque da Nonna",
  "Ravioli de Ricota": "Ravioli de Ricota",
  "Costela no Bafo": "Costela no Bafo",
  "Cupim Grelhado": "Cupim Grelhado",
  "Cantina da Nonna": "Cantina da Nonna",
  "Restaurante Sabor da Terra": "Restaurante Sabor da Terra",
};

export function fixMojibake(text: string): string {
  let result = text;

  for (const [wrong, correct] of Object.entries(MOJIBAKE_PATTERNS)) {
    result = result.split(wrong).join(correct);
  }

  for (const [wrong, correct] of Object.entries(COMMON_FIXES)) {
    result = result.split(wrong).join(correct);
  }

  result = result.replace(/\?\?/g, (_match, offset, string) => {
    const before = string[offset - 1] || "";
    const after = string[offset + 2] || "";

    const context = (before + after).toLowerCase();

    if (context.includes("a") || context.includes("o")) return "ã";
    if (context.includes("e") || context.includes("i")) return "é";
    if (context.includes("o") && (before === "ç" || after === "a")) return "õ";
    if (context.includes("c")) return "ç";
    if (context.includes("u")) return "ú";

    return "ã";
  });

  return result;
}

export function fixLatin1ToUtf8(text: string): string {
  try {
    const bytes = new TextEncoder().encode(text);
    const decoder = new TextDecoder("latin1");
    return decoder.decode(bytes);
  } catch {
    return text;
  }
}

export function autoFixEncoding(text: string): string {
  if (!text || typeof text !== "string") return text;

  let result = text.trim();

  if (/[\u00c0-\u00ff][\u0080-\u00ff]/.test(result)) {
    result = fixLatin1ToUtf8(result);
  }

  result = fixMojibake(result);

  result = result
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, "")
    .trim();

  return result;
}

export function normalizeForMatching(text: string): string {
  return autoFixEncoding(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectEncodingIssues(text: string): {
  hasIssues: boolean;
  issues: string[];
  suggestedFix: string;
} {
  const issues: string[] = [];

  if (/\?\?/.test(text)) {
    issues.push("Caracteres '??' detectados (provável encoding corrompido)");
  }

  if (/[\u00c0-\u00ff][\u0080-\u00ff]/.test(text)) {
    issues.push("Sequência suspeita de Latin1 mal interpretado");
  }

  if (/[^\x20-\x7E\u00A0-\uFFFF]/.test(text)) {
    issues.push("Caracteres de controle invisíveis detectados");
  }

  const fixed = autoFixEncoding(text);

  return {
    hasIssues: issues.length > 0,
    issues,
    suggestedFix: fixed,
  };
}
