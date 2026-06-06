import { ITEM_CATEGORY_MAP } from "./item-category-map";

const UNIT_RULES: [RegExp, string][] = [
  [/^agua\b/, "L"],
  [/^(leite|lei[td])\b/, "L"],
  [/^(oleo|azeite)\b/, "L"],
  [/^vinagre\b/, "L"],
  [/^suco\b/, "L"],
  [/^refrigerante|refri|guarana\b/, "L"],
  [/^cerveja|ceva|breja\b/, "L"],
  [/^agua[s_]sanitaria|alcool|desinfetante\b/, "L"],
  [/^shoyu\b/, "mL"],
  [/^molho\b/, "mL"],
  [/^essencia\b/, "mL"],
  [/^corante\b/, "mL"],

  [/^(oregano|cominho|colorau|paprica|canela|curcuma|noz[\s_]?moscada)\b/, "g"],
  [/^(fermento|bicarbonato|sal\b)/, "g"],
  [/^(baunilha|essencia)\b/, "g"],
  [/^(chocolate[\s_]?em[\s_]?po|cacau)\b/, "g"],
  [/^(creme[\s_]?dental|pasta[\s_]?dente)\b/, "g"],

  [/^(arroz|feijao|farinha|acucar|polvilho)\b/, "kg"],
  [/^(macarrao|macarrao[\s_]?espaguete|espaguete|lasanha|massa)\b/, "kg"],
  [/^cafe\b/, "kg"],
  [/^(leite[\s_]?em[\s_]?po|leite[\s_]?po|achocolatado)\b/, "kg"],
  [/^(farinha[\s_]?lactea)\b/, "kg"],
  [/^(batata|cebola|tomate|cenoura|mandioca|abobora|alho)\b/, "kg"],
  [/^(frango|peito|sobrecoxa|coxinha|asa)\b/, "kg"],
  [/^(alcatra|picanha|maminha|fraldinha|contrafile|file|mignon|coxao)\b/, "kg"],
  [/^(linguica|calabresa|toscana|salsicha|presunto|bacon)\b/, "kg"],
  [/^(mussarela|muzarela|parmesao|provolone|gorgonzola|requeijao|catupiry)\b/, "kg"],
  [/^(manteiga|margarina)\b/, "kg"],
  [/^(pao|pao[\s_]?de[\s_]?alho)\b/, "kg"],
  [/^(biscoito|bolacha)\b/, "kg"],
  [/^(coco[\s_]?ralado)\b/, "kg"],

  [/^(ovo|ovos)\b/, "dz"],
  [/^pao[\s_]?frances\b/, "un"],
  [/^(luva|luvas|saco|sacola)\b/, "un"],
  [/^(papel[\s_]?toalha|papel[\s_]?filme|papel[\s_]?aluminio|aluminio)\b/, "un"],
  [/^(esponja|detergente|sabao|sabonete|amaciante)\b/, "un"],
  [/^(inseticida)\b/, "un"],

  [/^(cerveja[\s_]?(long.?neck|garrafa|lata))\b/, "un"],
  [/^(refrigerante[\s_]?(lata|garrafa))\b/, "un"],
  [/^(agua[\s_]?(garrafa|copo))\b/, "un"],

  [/^(fardo|caixa[\s_]?de[\s_]?(cerveja|refrigerante))\b/, "cx"],
  [/^(cerveja.*(cx|caixa))\b/, "cx"],

  [/^(sal\b.*(pacote|pct))/, "pct"],
  [/^(biscoito|bolacha|salgadinho)\b/, "pct"],
];

const UNIT_PATTERNS: [RegExp, string][] = [
  [/\b(kg|quilo|quilograma)s?\b/i, "kg"],
  [/\b(g|grama)s?\b/i, "g"],
  [/\b(l|litro)s?\b/i, "L"],
  [/\b(ml|mililitro)s?\b/i, "mL"],
  [/\b(un|unidade|peca|pca?)\b/i, "un"],
  [/\b(cx|caixa)s?\b/i, "cx"],
  [/\b(pct|pacote|embalagem)\b/i, "pct"],
  [/\b(dz|duzia)s?\b/i, "dz"],
];

export const KNOWN_UNITS = ["kg", "g", "L", "mL", "un", "cx", "pct", "dz"];

export const UNIT_LABELS: Record<string, string> = {
  kg: "Quilograma",
  g: "Grama",
  L: "Litro",
  mL: "Mililitro",
  un: "Unidade",
  cx: "Caixa",
  pct: "Pacote",
  dz: "Dúzia",
};

export function suggestUnit(itemName: string): string | null {
  const normalized = normalize(itemName);
  if (!normalized) return null;

  for (const [pattern, unit] of UNIT_RULES) {
    if (pattern.test(normalized)) return unit;
  }

  for (const [pattern, unit] of UNIT_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) return unit;
  }

  const words = normalized.split(/[\s_]+/);
  const lastWord = words[words.length - 1];
  if (["kg", "kilos", "quilos", "quilo"].includes(lastWord)) return "kg";
  if (["g", "gramas", "grama"].includes(lastWord)) return "g";
  if (["l", "litros", "litro"].includes(lastWord)) return "L";
  if (["ml", "mililitros"].includes(lastWord)) return "mL";

  return null;
}

const AMBIGUOUS_UNITS: Record<string, string[]> = {
  ervilha: ["kg", "un"],
  milho: ["kg", "un"],
  atum: ["kg", "un"],
  sardinha: ["kg", "un"],
  palmito: ["kg", "un"],
  seleta: ["kg", "un"],
  "creme de leite": ["mL", "un"],
  "leite condensado": ["mL", "un"],
  tomate: ["kg", "un"],
  "molho de tomate": ["mL", "un"],
  "extrato de tomate": ["g", "un"],
  doce: ["kg", "un"],
  geleia: ["kg", "un"],
  compota: ["kg", "un"],
};

export function suggestUnits(itemName: string): string[] {
  const normalized = normalize(itemName);
  if (!normalized) return [];

  const single = suggestUnit(itemName);
  if (single) return [single];

  for (const [key, units] of Object.entries(AMBIGUOUS_UNITS)) {
    if (normalized.includes(normalize(key))) return units;
  }

  if (/^(ervilha|milho|atum|sardinha|palmito)/i.test(normalized)) {
    return ["kg", "un"];
  }

  return ["kg", "un", "L", "g", "mL", "pct"];
}

export function validateItemUnit(
  itemName: string,
  selectedUnit: string,
): { valid: boolean; suggestedUnit: string | null; message: string | null } {
  const suggested = suggestUnit(itemName);
  if (!suggested) {
    return { valid: true, suggestedUnit: null, message: null };
  }
  if (suggested !== selectedUnit) {
    return {
      valid: true,
      suggestedUnit: suggested,
      message: `"${normalizeItemName(itemName)}" é mais comum em "${suggested}" (${UNIT_LABELS[suggested]}) do que "${selectedUnit}". Deseja corrigir?`,
    };
  }
  return { valid: true, suggestedUnit: null, message: null };
}

export function suggestItemCategory(itemName: string): string | null {
  const key = normalize(itemName);
  if (!key || key.length < 2) return null;

  if (ITEM_CATEGORY_MAP[key]) return ITEM_CATEGORY_MAP[key];

  const entries = Object.entries(ITEM_CATEGORY_MAP);

  for (const [mapKey, category] of entries) {
    if (mapKey.length >= 3 && key.startsWith(mapKey)) {
      return category;
    }
  }

  for (const [mapKey, category] of entries) {
    if (mapKey.length >= 4 && key.includes(mapKey)) {
      return category;
    }
  }

  const words = key.split(/[\s_]+/);
  for (const word of words) {
    if (word.length < 3) continue;
    for (const [mapKey, category] of entries) {
      if (mapKey.length >= 3 && (mapKey.startsWith(word) || word.startsWith(mapKey))) {
        return category;
      }
    }
  }

  return null;
}

const leetMap: Record<string, string> = {
	"0": "o",
	"1": "i",
	"2": "z",
	"3": "e",
	"4": "a",
	"5": "s",
	"6": "g",
	"7": "t",
	"8": "b",
	"9": "p",
};

const FOOD_DICT: Record<string, string[]> = {
	arros: ["Arroz"],
	aroz: ["Arroz"],
	feijao: ["Feijão"],
	frango: ["Frango"],
	cebola: ["Cebola"],
	alface: ["Alface"],
	tomate: ["Tomate"],
	cenoura: ["Cenoura"],
	batata: ["Batata"],
	mandioca: ["Mandioca"],
	alcatra: ["Alcatra"],
	picanha: ["Picanha"],
	maminha: ["Maminha"],
	fraldinha: ["Fraldinha"],
	contrafile: ["Contrafilé"],
	mignon: ["Filé Mignon"],
	mignom: ["Filé Mignon"],
	file: ["Filé"],
	coxao: ["Coxão Mole"],
	mussarela: ["Queijo Mussarela", "Mussarela"],
	muzarela: ["Queijo Mussarela", "Mussarela"],
	mucarela: ["Queijo Mussarela", "Mussarela"],
	parmesao: ["Queijo Parmesão Ralado", "Parmesão Ralado"],
	provolone: ["Queijo Provolone"],
	gorgonzola: ["Queijo Gorgonzola"],
	requeijao: ["Requeijão"],
	catupiry: ["Requeijão"],
	catupiri: ["Requeijão"],
	manteiga: ["Manteiga"],
	mantega: ["Manteiga"],
	margarina: ["Margarina"],
	leite: ["Leite Integral"],
	leit: ["Leite Integral"],
	condensado: ["Leite Condensado"],
	iogurte: ["Iogurte Natural"],
	iogurt: ["Iogurte Natural"],
	ioigurte: ["Iogurte Natural"],
	polvilho: ["Polvilho Doce", "Polvilho Azedo"],
	farinha: ["Farinha de Trigo"],
	farinha_trigo: ["Farinha de Trigo"],
	trigo: ["Farinha de Trigo"],
	acucar: ["Açúcar"],
	assucar: ["Açúcar"],
	sal: ["Sal"],
	calabresa: ["Linguiça Calabresa"],
	calabreza: ["Linguiça Calabresa"],
	toscana: ["Linguiça Toscana"],
	linguica: ["Linguiça"],
	salsicha: ["Salsicha"],
	presunto: ["Presunto Cozido"],
	prezunto: ["Presunto Cozido"],
	peito: ["Peito de Frango"],
	sobrecoxa: ["Sobrecoxa de Frango"],
	coxinha: ["Coxinha da Asa"],
	bacon: ["Bacon"],
	beicon: ["Bacon"],
	pao: ["Pão"],
	miojo: ["Macarrão Instantâneo"],
	macarrao: ["Macarrão"],
	macarrao_espaguete: ["Macarrão Espaguete"],
	espaguete: ["Macarrão Espaguete"],
	espaguetti: ["Macarrão Espaguete"],
	lasanha: ["Massa para Lasanha"],
	lasagna: ["Massa para Lasanha"],
	pizza: ["Massa de Pizza"],
	cerveja: ["Cerveja"],
	ceva: ["Cerveja"],
	breja: ["Cerveja"],
	refri: ["Refrigerante"],
	refrigerante: ["Refrigerante"],
	guarana: ["Guaraná"],
	suco: ["Suco"],
	agua: ["Água"],
	oleo: ["Óleo de Soja"],
	azeite: ["Azeite de Oliva"],
	azeyte: ["Azeite de Oliva"],
	vinagre: ["Vinagre"],
	vinagri: ["Vinagre"],
	shoyu: ["Molho Shoyu"],
	molho: ["Molho"],
	mostarda: ["Mostarda"],
	mustarda: ["Mostarda"],
	ketchup: ["Ketchup"],
	catchup: ["Ketchup"],
	maionese: ["Maionese"],
	maiones: ["Maionese"],
	mionese: ["Maionese"],
	oregano: ["Orégano"],
	oregan: ["Orégano"],
	cominho: ["Cominho"],
	cuminho: ["Cominho"],
	colorau: ["Colorau"],
	paprica: ["Páprica"],
	canela: ["Canela"],
	chocolate: ["Chocolate"],
	chocolat: ["Chocolate"],
	baunilha: ["Baunilha"],
	baunilia: ["Baunilha"],
	coco: ["Coco Ralado", "Coco"],
	leitedecoco: ["Leite de Coco"],
	fermento: ["Fermento Biológico", "Fermento Químico"],
	fermendo: ["Fermento Biológico", "Fermento Químico"],
	bicarbonato: ["Bicarbonato de Sódio"],
	detergente: ["Detergente"],
	luva: ["Luva Descartável"],
	luvas: ["Luva Descartável"],
	sacola: ["Sacola Plástica"],
	papeltoalha: ["Papel Toalha"],
	papelfilme: ["Papel Filme"],
	papelaluminio: ["Papel Alumínio"],
	aluminio: ["Papel Alumínio"],
	esponja: ["Esponja"],
	sabao: ["Sabão em Pó"],
	sabonete: ["Sabonete"],
	amaciante: ["Amaciante"],
	aguasanitaria: ["Água Sanitária"],
	alcool: ["Álcool 70%"],
	desinfetante: ["Desinfetante"],
	inseticida: ["Inseticida"],
	cafe: ["Café"],
	po_de_cafe: ["Café"],
	pocafe: ["Café"],
	leiteempo: ["Leite em Pó"],
	leitepo: ["Leite em Pó"],
	achocolatado: ["Achocolatado"],
	toddy: ["Achocolatado"],
	neston: ["Achocolatado"],
	ovomaltine: ["Achocolatado"],
	biscoito: ["Biscoito"],
	biscoto: ["Biscoito"],
	bolacha: ["Bolacha"],
	creme_dental: ["Creme Dental"],
	tempero: ["Tempero"],
	alho: ["Alho"],
	cebolinha: ["Cebolinha"],
	salsinha: ["Salsinha"],
	coentro: ["Coentro"],
	manjericao: ["Manjericão"],
	hortela: ["Hortelã"],
	alecrim: ["Alecrim"],
	tomilho: ["Tomilho"],
	louro: ["Louro"],
	farinhalactea: ["Farinha Láctea"],
	achocolatadoempo: ["Achocolatado em Pó"],
};

function levenshtein(a: string, b: string): number {
	const m = a.length;
	const n = b.length;
	const dp: number[][] = Array.from({ length: m + 1 }, () =>
		Array(n + 1).fill(0),
	);
	for (let i = 0; i <= m; i++) dp[i][0] = i;
	for (let j = 0; j <= n; j++) dp[0][j] = j;
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			dp[i][j] = Math.min(
				dp[i - 1][j] + 1,
				dp[i][j - 1] + 1,
				dp[i - 1][j - 1] + cost,
			);
		}
	}
	return dp[m][n];
}

function normalize(str: string): string {
	let out = "";
	for (const ch of str.toLowerCase().normalize("NFD")) {
		if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9")) {
			out += ch;
		}
	}
	return out;
}

const NORMALIZED_DICT: Record<string, string[]> = {};
for (const key of Object.keys(FOOD_DICT)) {
	NORMALIZED_DICT[normalize(key)] = FOOD_DICT[key];
}

export function normalizeName(input: string): string {
	const name = input.trim();
	if (!name) return "";

	let normalized = name
		.toLowerCase()
		.split("")
		.map((char) => leetMap[char] || char)
		.join("");

	normalized = normalized
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => {
			const special = [
				"da",
				"de",
				"do",
				"das",
				"dos",
				"e",
				"em",
				"com",
				"para",
				"sem",
			];
			if (special.includes(word)) return word;
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(" ");

	return normalized;
}

export function normalizeCategoryName(input: string): string {
	return normalizeName(input);
}

export function normalizeItemName(input: string): string {
	return normalizeName(input);
}

export const KNOWN_CATEGORIES: string[] = [
	...new Set(Object.values(ITEM_CATEGORY_MAP)),
].sort((a, b) => a.localeCompare(b, "pt-BR"));

export function suggestCategories(input: string): string[] {
	const q = normalize(input);
	if (!q || q.length < 1) return [];
	return KNOWN_CATEGORIES.filter((cat) => {
		const norm = normalize(cat);
		return norm.startsWith(q) || norm.includes(q);
	}).slice(0, 8);
}

export type SuggestionResult = {
	normalized: string;
	suggestions: string[];
	hasSuggestion: boolean;
	message: string | null;
};

export function validateItemCategory(
	itemName: string,
	selectedCategory: string,
): { valid: boolean; expectedCategory: string | null; message: string | null } {
	const key = normalize(itemName);
	const expected = ITEM_CATEGORY_MAP[key];
	if (!expected) {
		return { valid: true, expectedCategory: null, message: null };
	}
	if (expected !== selectedCategory) {
		return {
			valid: false,
			expectedCategory: expected,
			message: `"${normalizeItemName(itemName)}" pertence à categoria "${expected}", não a "${selectedCategory}". Selecione a categoria correta.`,
		};
	}
	return { valid: true, expectedCategory: null, message: null };
}

export function suggestItemCorrection(
	input: string,
	existingItems: string[] = [],
): SuggestionResult {
	const trimmed = input.trim();
	if (!trimmed) {
		return {
			normalized: "",
			suggestions: [],
			hasSuggestion: false,
			message: null,
		};
	}

	const normalized = normalizeItemName(trimmed);
	const key = normalize(trimmed);

	const dictMatch = NORMALIZED_DICT[key];
	if (dictMatch && normalized !== dictMatch[0]) {
		return {
			normalized,
			suggestions: dictMatch,
			hasSuggestion: true,
			message: `Você quis dizer "${dictMatch[0]}"?`,
		};
	}

	const similar: Array<{ name: string; distance: number }> = [];

	for (const existing of existingItems) {
		const normExisting = normalize(existing);
		const dist = levenshtein(key, normExisting);
		const similarity = 1 - dist / Math.max(key.length, normExisting.length);
		if (similarity >= 0.55 && dist > 0) {
			similar.push({ name: existing, distance: dist });
		}
	}

	for (const [dictKey, suggestions] of Object.entries(NORMALIZED_DICT)) {
		const dist = levenshtein(key, dictKey);
		const similarity = 1 - dist / Math.max(key.length, dictKey.length);
		if (
			similarity >= 0.6 &&
			dist > 0 &&
			!similar.some((s) => suggestions.includes(s.name))
		) {
			similar.push({ name: suggestions[0], distance: dist });
		}
	}

	similar.sort((a, b) => a.distance - b.distance);

	if (similar.length > 0) {
		const best = similar.slice(0, 3).map((s) => s.name);
		return {
			normalized,
			suggestions: best,
			hasSuggestion: true,
			message: `Você quis dizer "${best[0]}"?`,
		};
	}

	return {
		normalized,
		suggestions: [],
		hasSuggestion: false,
		message: null,
	};
}
