export type MinStockSuggestion = {
	suggested: number;
	unit: string;
	reason: string;
};

const UNIT_BASE: Record<string, number> = {
	kg: 5,
	g: 200,
	L: 4,
	mL: 500,
	un: 12,
	cx: 2,
	pct: 6,
	dz: 3,
};

const CATEGORY_MIN_STOCK: Record<string, Record<string, number>> = {
	"Carnes": { kg: 10 },
	"Aves": { kg: 10 },
	"Peixes e Frutos do Mar": { kg: 8 },
	"Hortifrúti": { kg: 8 },
	"Frios e Laticínios": { kg: 3, un: 16, L: 3 },
	"Padaria": { kg: 8, un: 30 },
	"Grãos e Farináceos": { kg: 10, g: 500 },
	"Temperos e Condimentos": { g: 250, mL: 500 },
	"Molhos e Conservas": { mL: 500, un: 6 },
	"Enlatados e Conservas": { un: 12 },
	"Bebidas": { L: 8, cx: 3, un: 12 },
	"Limpeza": { L: 2, un: 4, mL: 500 },
	"Descartáveis": { un: 50, pct: 4 },
	"Higiene": { un: 6, g: 200 },
	"Biscoitos e Snacks": { pct: 10, kg: 3, g: 300 },
	"Café da Manhã / Café": { kg: 3, un: 12 },
	"Ovos": { dz: 3, un: 30 },
	"Bebidas Alcoólicas": { un: 24, cx: 2, L: 6 },
	"Geleias e Doces": { kg: 2, un: 6 },
	"Congelados": { kg: 5, un: 8, pct: 4 },
};

const ITEM_MIN_STOCK: Record<string, { value: number; unit: string }> = {
	paofrances: { value: 50, unit: "un" },
	paodealho: { value: 20, unit: "un" },
	paodelo: { value: 30, unit: "un" },
	ovo: { value: 30, unit: "un" },
	ovobranco: { value: 30, unit: "un" },
	ovocaipira: { value: 30, unit: "un" },
	ovomarrom: { value: 30, unit: "un" },
	ovodecodorna: { value: 30, unit: "un" },
	claras: { value: 12, unit: "un" },
	gemas: { value: 12, unit: "un" },
	leite: { value: 8, unit: "L" },
	leitintegral: { value: 8, unit: "L" },
	leitedesnatado: { value: 8, unit: "L" },
	cafe: { value: 3, unit: "kg" },
	cafeempo: { value: 3, unit: "kg" },
	farinhadetrigo: { value: 10, unit: "kg" },
	acucar: { value: 10, unit: "kg" },
	arroz: { value: 10, unit: "kg" },
	feijao: { value: 8, unit: "kg" },
	oleo: { value: 6, unit: "L" },
	azeite: { value: 3, unit: "L" },
	sal: { value: 3, unit: "kg" },
	manteiga: { value: 3, unit: "kg" },
	margarina: { value: 4, unit: "kg" },
	mussarela: { value: 3, unit: "kg" },
	presunto: { value: 2, unit: "kg" },
	salsicha: { value: 3, unit: "kg" },
	linguica: { value: 5, unit: "kg" },
	linguicacalabresa: { value: 5, unit: "kg" },
	bacon: { value: 2, unit: "kg" },
	frango: { value: 10, unit: "kg" },
	peitodefrango: { value: 10, unit: "kg" },
	sobrecoxa: { value: 8, unit: "kg" },
	alcatra: { value: 8, unit: "kg" },
	picanha: { value: 5, unit: "kg" },
	maminha: { value: 6, unit: "kg" },
	fraldinha: { value: 6, unit: "kg" },
	contrafile: { value: 7, unit: "kg" },
	filemignon: { value: 5, unit: "kg" },
	coxao: { value: 7, unit: "kg" },
	alho: { value: 2, unit: "kg" },
	cebola: { value: 8, unit: "kg" },
	batata: { value: 10, unit: "kg" },
	tomate: { value: 5, unit: "kg" },
	cenoura: { value: 5, unit: "kg" },
	mandioca: { value: 8, unit: "kg" },
	abobora: { value: 5, unit: "kg" },
	alface: { value: 6, unit: "un" },
	cheiroverde: { value: 6, unit: "un" },
	coentro: { value: 6, unit: "un" },
	cebolinha: { value: 6, unit: "un" },
	salsinha: { value: 6, unit: "un" },
	cerveja: { value: 2, unit: "cx" },
	refrigerante: { value: 2, unit: "cx" },
	agua: { value: 3, unit: "cx" },
	aguacomgas: { value: 2, unit: "cx" },
	suco: { value: 6, unit: "L" },
	papeltoalha: { value: 6, unit: "un" },
	papelfilme: { value: 3, unit: "un" },
	papelaluminio: { value: 3, unit: "un" },
	detergente: { value: 6, unit: "un" },
	sabao: { value: 4, unit: "un" },
	sabaoempo: { value: 4, unit: "kg" },
	aguasanitaria: { value: 4, unit: "L" },
	alcool: { value: 4, unit: "L" },
	desinfetante: { value: 4, unit: "L" },
	luva: { value: 4, unit: "pct" },
	luvas: { value: 4, unit: "pct" },
	sabonete: { value: 6, unit: "un" },
	amaciante: { value: 3, unit: "L" },
	biscoito: { value: 6, unit: "pct" },
	bolacha: { value: 6, unit: "pct" },
	salgadinho: { value: 10, unit: "pct" },
	macarrao: { value: 6, unit: "kg" },
	macarraoespaguete: { value: 6, unit: "kg" },
	lasanha: { value: 5, unit: "kg" },
	farinhalactea: { value: 3, unit: "kg" },
	achocolatado: { value: 3, unit: "kg" },
	polvilho: { value: 3, unit: "kg" },
	polvilhodoce: { value: 3, unit: "kg" },
	polvilhoazedo: { value: 3, unit: "kg" },
	farinha: { value: 10, unit: "kg" },
	farinhamandioca: { value: 5, unit: "kg" },
	fermento: { value: 500, unit: "g" },
	fermentobiologico: { value: 500, unit: "g" },
	fermentoquimico: { value: 500, unit: "g" },
	orcamento: { value: 12, unit: "un" },
	bicarbonato: { value: 300, unit: "g" },
	cremedeleite: { value: 6, unit: "un" },
	leitecondensado: { value: 6, unit: "un" },
	iogurte: { value: 8, unit: "un" },
	requeijao: { value: 4, unit: "kg" },
	catupiry: { value: 3, unit: "kg" },
	parmesao: { value: 2, unit: "kg" },
	provolone: { value: 2, unit: "kg" },
	gorgonzola: { value: 1, unit: "kg" },
	molho: { value: 6, unit: "un" },
	molhotomate: { value: 6, unit: "un" },
	molhoshoyu: { value: 3, unit: "mL" },
	vinagre: { value: 4, unit: "L" },
	mostarda: { value: 3, unit: "un" },
	ketchup: { value: 3, unit: "un" },
	maionese: { value: 3, unit: "un" },
	oregano: { value: 250, unit: "g" },
	cominho: { value: 250, unit: "g" },
	colorau: { value: 250, unit: "g" },
	paprica: { value: 200, unit: "g" },
	canela: { value: 200, unit: "g" },
	cocoralado: { value: 2, unit: "kg" },
	leitedecoco: { value: 4, unit: "un" },
	cremedental: { value: 6, unit: "un" },
	inseticida: { value: 3, unit: "un" },
	esponja: { value: 6, unit: "un" },
	sacola: { value: 200, unit: "un" },
	sacolas: { value: 200, unit: "un" },
};

function normalize(str: string): string {
	let out = "";
	for (const ch of str.toLowerCase().normalize("NFD")) {
		if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9")) {
			out += ch;
		}
	}
	return out;
}

function normalizeName(input: string): string {
	const name = input.trim();
	if (!name) return "";
	return name
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => {
			const special = ["da", "de", "do", "das", "dos", "e", "em", "com", "para", "sem"];
			if (special.includes(word)) return word;
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(" ");
}

export function suggestMinStock(
	itemName: string,
	unit: string,
	categoryName?: string,
): MinStockSuggestion | null {
	const key = normalize(itemName);
	if (!key || key.length < 2) return null;

	if (ITEM_MIN_STOCK[key] && ITEM_MIN_STOCK[key].unit === unit) {
		const override = ITEM_MIN_STOCK[key];
		return {
			suggested: override.value,
			unit,
			reason: `Mínimo sugerido para "${normalizeName(itemName)}": ${override.value} ${unit}`,
		};
	}

	for (const [itemKey, override] of Object.entries(ITEM_MIN_STOCK)) {
		if (override.unit !== unit) continue;
		if (key.length >= 3 && itemKey.length >= 3) {
			if (key.startsWith(itemKey) || itemKey.startsWith(key)) {
				return {
					suggested: override.value,
					unit,
					reason: `Mínimo sugerido para "${normalizeName(itemName)}": ${override.value} ${unit}`,
				};
			}
		}
	}

	if (categoryName && CATEGORY_MIN_STOCK[categoryName]?.[unit]) {
		const val = CATEGORY_MIN_STOCK[categoryName][unit];
		return {
			suggested: val,
			unit,
			reason: `Mínimo sugerido para "${categoryName}" (${unit}): ${val} ${unit}`,
		};
	}

	if (UNIT_BASE[unit]) {
		return {
			suggested: UNIT_BASE[unit],
			unit,
			reason: `Mínimo sugerido para itens em "${unit}": ${UNIT_BASE[unit]} ${unit}`,
		};
	}

	return null;
}

export function validateMinStock(
	itemName: string,
	unit: string,
	currentMinStock: string,
	categoryName?: string,
): { valid: boolean; suggested: number | null; message: string | null } {
	const current = parseFloat(currentMinStock);
	if (current > 0) {
		return { valid: true, suggested: null, message: null };
	}

	const suggestion = suggestMinStock(itemName, unit, categoryName);
	if (!suggestion) {
		return { valid: true, suggested: null, message: null };
	}

	return {
		valid: false,
		suggested: suggestion.suggested,
		message: `${suggestion.reason}. Deseja usar este valor?`,
	};
}
