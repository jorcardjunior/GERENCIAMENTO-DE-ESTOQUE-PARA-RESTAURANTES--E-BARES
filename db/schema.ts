import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ==========================================
// ENUMS
// ==========================================
export const roleEnum = pgEnum("role", [
  "admin",
  "gerente",
  "chef",
  "bartender",
  "garcom",
  "estoquista",
  "staff",
]);
export const companyPlanEnum = pgEnum("company_plan", [
  "free",
  "basic",
  "professional",
  "enterprise",
]);
export const authRoleEnum = pgEnum("auth_role", [
  "owner",
  "admin",
  "gerente",
  "funcionario",
  "visualizador",
]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "cancelled",
]);
export const stockMovementTypeEnum = pgEnum("stock_movement_type", ["IN", "OUT", "LOSS", "ADJUST"]);
export const perdaTipoEnum = pgEnum("perda_tipo", [
  "vencimento",
  "preparo",
  "sobra",
  "deterioracao",
  "quebra",
  "outro",
]);
export const fichaCategoriaEnum = pgEnum("ficha_categoria", [
  "entrada",
  "principal",
  "sobremesa",
  "bebida",
  "lanche",
  "guarnicao",
  "molho",
  "preparo_base",
]);
export const estabelecimentoStatusEnum = pgEnum("estabelecimento_status", [
  "ativo",
  "inativo",
  "fechado",
]);
export const pedidoStatusEnum = pgEnum("pedido_status", [
  "rascunho",
  "enviado",
  "recebido_parcial",
  "recebido",
  "cancelado",
]);
export const transferenciaStatusEnum = pgEnum("transferencia_status", [
  "pendente",
  "enviado",
  "recebido",
  "cancelado",
]);
export const cargoEnum = pgEnum("cargo", [
  "admin",
  "gerente",
  "chef",
  "bartender",
  "garcom",
  "estoquista",
  "funcionario",
  "cozinheiro",
]);
export const cardapioCategoriaEnum = pgEnum("cardapio_categoria", [
  "entrada",
  "principal",
  "sobremesa",
  "bebida",
  "lanche",
  "infantil",
]);

// ==========================================
// BETTER-AUTH TABLES
// ==========================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: authRoleEnum("role").notNull().default("funcionario"),
  companyId: uuid("company_id").references(() => estabelecimentos.id),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => estabelecimentos.id),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: authRoleEnum("role").notNull().default("funcionario"),
  token: text("token").notNull().unique(),
  status: invitationStatusEnum("status").notNull().default("pending"),
  invitedBy: text("invited_by").references(() => user.id),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==========================================
// TABELAS EXISTENTES (App JWT - legadas)
// ==========================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("staff"),
  authRole: authRoleEnum("auth_role").notNull().default("funcionario"),
  companyId: uuid("company_id").references(() => estabelecimentos.id),
  betterAuthId: text("better_auth_id").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).notNull().default("#2563eb"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  name: varchar("name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  minStock: decimal("min_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  currentQuantity: decimal("current_quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  countDate: date("count_date"),
  expiryDate: date("expiry_date"),
  responsibleUser: integer("responsible_user").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: varchar("value", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==========================================
// TABELAS SUPABASE (já existem no banco)
// ==========================================

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 50 }).notNull().default("staff"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  canAddItems: boolean("can_add_items").notNull().default(true),
  canViewReports: boolean("can_view_reports").notNull().default(true),
  canManageSuppliers: boolean("can_manage_suppliers").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const catalogItems = pgTable("catalog_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  categoryId: varchar("category_id", { length: 50 }).notNull(),
  unitDefault: varchar("unit_default", { length: 20 }).notNull().default("un"),
  synonyms: text("synonyms"),
  trackExpiry: boolean("track_expiry").notNull().default(false),
  yellowThreshold: decimal("yellow_threshold", { precision: 10, scale: 2 }).notNull().default("10"),
  redThreshold: decimal("red_threshold", { precision: 10, scale: 2 }).notNull().default("5"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  catalogItemId: uuid("catalog_item_id")
    .notNull()
    .references(() => catalogItems.id),
  currentStock: decimal("current_stock", { precision: 10, scale: 3 }).notNull().default("0"),
  reorderPoint: decimal("reorder_point", { precision: 10, scale: 3 }).notNull().default("0"),
  yellowThreshold: decimal("yellow_threshold", { precision: 10, scale: 3 }).notNull().default("10"),
  redThreshold: decimal("red_threshold", { precision: 10, scale: 3 }).notNull().default("5"),
  active: boolean("active").notNull().default(true),
  countDate: timestamp("count_date", { withTimezone: true }),
  countedBy: text("counted_by"),
  customFields: jsonb("custom_fields").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const itemBatches = pgTable("item_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  inventoryItemId: uuid("inventory_item_id")
    .notNull()
    .references(() => inventoryItems.id),
  batchCode: varchar("batch_code", { length: 100 }),
  qtyCurrent: decimal("qty_current", { precision: 10, scale: 3 }).notNull().default("0"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  inventoryItemId: uuid("inventory_item_id")
    .notNull()
    .references(() => inventoryItems.id),
  batchId: uuid("batch_id").references(() => itemBatches.id),
  type: stockMovementTypeEnum("type").notNull(),
  qty: decimal("qty", { precision: 10, scale: 3 }).notNull(),
  reason: text("reason"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  cnpj: varchar("cnpj", { length: 18 }),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const itemRequests = pgTable("item_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  inventoryItemId: uuid("inventory_item_id").references(() => inventoryItems.id),
  catalogItemId: uuid("catalog_item_id").references(() => catalogItems.id),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  notes: text("notes"),
  requestedBy: uuid("requested_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: text("record_id"),
  action: varchar("action", { length: 50 }).notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  userId: text("user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customColumns = pgTable("custom_columns", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: varchar("category_id", { length: 50 }),
  name: text("name").notNull(),
  type: text("type").notNull().default("text"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==========================================
// NOVAS TABELAS PROFISSIONAIS (Grocy-style)
// ==========================================

export const estabelecimentos = pgTable("estabelecimentos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  nomeFantasia: varchar("nome_fantasia", { length: 255 }),
  cnpj: varchar("cnpj", { length: 18 }),
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 50 }),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  status: estabelecimentoStatusEnum("status").notNull().default("ativo"),
  plan: companyPlanEnum("plan").notNull().default("free"),
  logoUrl: text("logo_url"),
  ownerId: text("owner_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usuarioEstabelecimento = pgTable(
  "usuario_estabelecimento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    estabelecimentoId: uuid("estabelecimento_id")
      .notNull()
      .references(() => estabelecimentos.id),
    cargo: cargoEnum("cargo").notNull().default("funcionario"),
    ativo: boolean("ativo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqUserEstab: uniqueIndex("uq_usuario_estabelecimento").on(t.userId, t.estabelecimentoId),
  }),
);

export const fichasTecnicas = pgTable("fichas_tecnicas", {
  id: uuid("id").primaryKey().defaultRandom(),
  estabelecimentoId: uuid("estabelecimento_id")
    .notNull()
    .references(() => estabelecimentos.id),
  nome: varchar("nome", { length: 255 }).notNull(),
  categoria: fichaCategoriaEnum("categoria").notNull().default("principal"),
  rendimento: decimal("rendimento", { precision: 10, scale: 2 }).notNull().default("1"),
  unidadeRendimento: varchar("unidade_rendimento", { length: 20 }).notNull().default("porcao"),
  tempoPreparoMin: integer("tempo_preparo_min"),
  modoPreparo: text("modo_preparo"),
  custoTotal: decimal("custo_total", { precision: 10, scale: 2 }).default("0"),
  precoSugerido: decimal("preco_sugerido", { precision: 10, scale: 2 }).default("0"),
  status: varchar("status", { length: 20 }).notNull().default("ativo"),
  versao: integer("versao").notNull().default(1),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const fichaTecnicaInsumos = pgTable("ficha_tecnica_insumos", {
  id: uuid("id").primaryKey().defaultRandom(),
  fichaTecnicaId: uuid("ficha_tecnica_id")
    .notNull()
    .references(() => fichasTecnicas.id),
  catalogItemId: uuid("catalog_item_id").references(() => catalogItems.id),
  insumoNome: varchar("insumo_nome", { length: 255 }).notNull(),
  quantidade: decimal("quantidade", { precision: 10, scale: 3 }).notNull(),
  unidade: varchar("unidade", { length: 20 }).notNull(),
  percentualPerda: decimal("percentual_perda", { precision: 5, scale: 2 }).default("0"),
  custoUnitario: decimal("custo_unitario", { precision: 10, scale: 2 }).default("0"),
  observacao: text("observacao"),
  ordem: integer("ordem").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fichaTecnicaSubReceitas = pgTable(
  "ficha_tecnica_sub_receitas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fichaTecnicaPaiId: uuid("ficha_tecnica_pai_id")
      .notNull()
      .references(() => fichasTecnicas.id),
    fichaTecnicaFilhaId: uuid("ficha_tecnica_filha_id")
      .notNull()
      .references(() => fichasTecnicas.id),
    quantidade: decimal("quantidade", { precision: 10, scale: 3 }).notNull().default("1"),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => ({
    uniqSubReceita: uniqueIndex("uq_sub_receita").on(t.fichaTecnicaPaiId, t.fichaTecnicaFilhaId),
  }),
);

export const estoqueEstabelecimento = pgTable(
  "estoque_estabelecimento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    estabelecimentoId: uuid("estabelecimento_id")
      .notNull()
      .references(() => estabelecimentos.id),
    catalogItemId: uuid("catalog_item_id")
      .notNull()
      .references(() => catalogItems.id),
    estoqueAtual: decimal("estoque_atual", { precision: 10, scale: 3 }).notNull().default("0"),
    estoqueMinimo: decimal("estoque_minimo", { precision: 10, scale: 3 }).default("0"),
    estoqueMaximo: decimal("estoque_maximo", { precision: 10, scale: 3 }),
    lote: varchar("lote", { length: 50 }),
    validade: date("validade"),
    localizacao: varchar("localizacao", { length: 100 }),
    custoMedio: decimal("custo_medio", { precision: 10, scale: 2 }).default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqEstoqueLote: uniqueIndex("uq_estoque_lote").on(
      t.estabelecimentoId,
      t.catalogItemId,
      t.lote,
    ),
  }),
);

export const movimentacoesEstoque = pgTable("movimentacoes_estoque", {
  id: uuid("id").primaryKey().defaultRandom(),
  estabelecimentoId: uuid("estabelecimento_id")
    .notNull()
    .references(() => estabelecimentos.id),
  catalogItemId: uuid("catalog_item_id")
    .notNull()
    .references(() => catalogItems.id),
  tipo: varchar("tipo", { length: 30 }).notNull(),
  quantidade: decimal("quantidade", { precision: 10, scale: 3 }).notNull(),
  saldoAnterior: decimal("saldo_anterior", { precision: 10, scale: 3 }).notNull().default("0"),
  saldoPosterior: decimal("saldo_posterior", { precision: 10, scale: 3 }).notNull().default("0"),
  custoUnitario: decimal("custo_unitario", { precision: 10, scale: 2 }),
  fichaTecnicaId: uuid("ficha_tecnica_id").references(() => fichasTecnicas.id),
  pedidoId: uuid("pedido_id"),
  observacao: text("observacao"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pedidosCompra = pgTable("pedidos_compra", {
  id: uuid("id").primaryKey().defaultRandom(),
  estabelecimentoId: uuid("estabelecimento_id")
    .notNull()
    .references(() => estabelecimentos.id),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  fornecedorNome: varchar("fornecedor_nome", { length: 255 }),
  numeroPedido: varchar("numero_pedido", { length: 50 }),
  status: pedidoStatusEnum("status").notNull().default("rascunho"),
  dataPedido: date("data_pedido").defaultNow(),
  dataPrevista: date("data_prevista"),
  dataRecebimento: timestamp("data_recebimento", { withTimezone: true }),
  valorTotal: decimal("valor_total", { precision: 10, scale: 2 }).default("0"),
  observacao: text("observacao"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pedidoCompraItens = pgTable("pedido_compra_itens", {
  id: uuid("id").primaryKey().defaultRandom(),
  pedidoCompraId: uuid("pedido_compra_id")
    .notNull()
    .references(() => pedidosCompra.id),
  catalogItemId: uuid("catalog_item_id").references(() => catalogItems.id),
  itemNome: varchar("item_nome", { length: 255 }).notNull(),
  quantidade: decimal("quantidade", { precision: 10, scale: 3 }).notNull(),
  unidade: varchar("unidade", { length: 20 }).notNull(),
  quantidadeRecebida: decimal("quantidade_recebida", { precision: 10, scale: 3 }).default("0"),
  valorUnitario: decimal("valor_unitario", { precision: 10, scale: 2 }).default("0"),
  observacao: text("observacao"),
});

export const transferencias = pgTable("transferencias", {
  id: uuid("id").primaryKey().defaultRandom(),
  estabelecimentoOrigemId: uuid("estabelecimento_origem_id")
    .notNull()
    .references(() => estabelecimentos.id),
  estabelecimentoDestinoId: uuid("estabelecimento_destino_id")
    .notNull()
    .references(() => estabelecimentos.id),
  status: transferenciaStatusEnum("status").notNull().default("pendente"),
  observacao: text("observacao"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transferenciaItens = pgTable("transferencia_itens", {
  id: uuid("id").primaryKey().defaultRandom(),
  transferenciaId: uuid("transferencia_id")
    .notNull()
    .references(() => transferencias.id),
  catalogItemId: uuid("catalog_item_id")
    .notNull()
    .references(() => catalogItems.id),
  quantidade: decimal("quantidade", { precision: 10, scale: 3 }).notNull(),
  unidade: varchar("unidade", { length: 20 }).notNull(),
  lote: varchar("lote", { length: 50 }),
});

export const registrosProducao = pgTable("registros_producao", {
  id: uuid("id").primaryKey().defaultRandom(),
  estabelecimentoId: uuid("estabelecimento_id")
    .notNull()
    .references(() => estabelecimentos.id),
  fichaTecnicaId: uuid("ficha_tecnica_id")
    .notNull()
    .references(() => fichasTecnicas.id),
  quantidadeProduzida: decimal("quantidade_produzida", { precision: 10, scale: 2 }).notNull(),
  custoTotalProducao: decimal("custo_total_producao", { precision: 10, scale: 2 }).default("0"),
  dataProducao: timestamp("data_producao", { withTimezone: true }).defaultNow(),
  observacao: text("observacao"),
  producedBy: uuid("produced_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const registrosPerda = pgTable("registros_perda", {
  id: uuid("id").primaryKey().defaultRandom(),
  estabelecimentoId: uuid("estabelecimento_id")
    .notNull()
    .references(() => estabelecimentos.id),
  catalogItemId: uuid("catalog_item_id")
    .notNull()
    .references(() => catalogItems.id),
  quantidade: decimal("quantidade", { precision: 10, scale: 3 }).notNull(),
  unidade: varchar("unidade", { length: 20 }).notNull(),
  tipoPerda: perdaTipoEnum("tipo_perda").notNull(),
  custoPerda: decimal("custo_perda", { precision: 10, scale: 2 }).default("0"),
  observacao: text("observacao"),
  registeredBy: uuid("registered_by"),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
});

export const itensCardapio = pgTable("itens_cardapio", {
  id: uuid("id").primaryKey().defaultRandom(),
  estabelecimentoId: uuid("estabelecimento_id")
    .notNull()
    .references(() => estabelecimentos.id),
  fichaTecnicaId: uuid("ficha_tecnica_id")
    .notNull()
    .references(() => fichasTecnicas.id),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  categoria: cardapioCategoriaEnum("categoria"),
  precoVenda: decimal("preco_venda", { precision: 10, scale: 2 }).notNull().default("0"),
  disponivel: boolean("disponivel").notNull().default(true),
  imagemUrl: text("imagem_url"),
  ordem: integer("ordem").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const centrosCusto = pgTable("centros_custo", {
  id: uuid("id").primaryKey().defaultRandom(),
  estabelecimentoId: uuid("estabelecimento_id")
    .notNull()
    .references(() => estabelecimentos.id),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const historicoPrecos = pgTable("historico_precos", {
  id: uuid("id").primaryKey().defaultRandom(),
  catalogItemId: uuid("catalog_item_id")
    .notNull()
    .references(() => catalogItems.id),
  estabelecimentoId: uuid("estabelecimento_id").references(() => estabelecimentos.id),
  precoAnterior: decimal("preco_anterior", { precision: 10, scale: 2 }),
  precoNovo: decimal("preco_novo", { precision: 10, scale: 2 }).notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  observacao: text("observacao"),
  registeredBy: uuid("registered_by"),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
});

// ==========================================
// FINANCEIRO & GASTOS
// ==========================================

export const expenseCategories = pgTable("expense_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  estabelecimentoId: uuid("estabelecimento_id")
    .notNull()
    .references(() => estabelecimentos.id),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).notNull().default("#3b82f6"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  estabelecimentoId: uuid("estabelecimento_id")
    .notNull()
    .references(() => estabelecimentos.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => expenseCategories.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  paid: boolean("paid").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==========================================
// RELACIONAMENTOS (tabelas existentes)
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  items: many(items),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.createdBy], references: [users.id] }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  category: one(categories, { fields: [items.categoryId], references: [categories.id] }),
  responsible: one(users, { fields: [items.responsibleUser], references: [users.id] }),
}));

// ==========================================
// RELACIONAMENTOS (novas tabelas)
// ==========================================

export const estabelecimentosRelations = relations(estabelecimentos, ({ many }) => ({
  usuarios: many(usuarioEstabelecimento),
  fichasTecnicas: many(fichasTecnicas),
  estoque: many(estoqueEstabelecimento),
  movimentacoes: many(movimentacoesEstoque),
  pedidosCompra: many(pedidosCompra),
  transferenciasOrigem: many(transferencias, { relationName: "origem" }),
  transferenciasDestino: many(transferencias, { relationName: "destino" }),
  producoes: many(registrosProducao),
  perdas: many(registrosPerda),
  itensCardapio: many(itensCardapio),
  centrosCusto: many(centrosCusto),
}));

export const fichasTecnicasRelations = relations(fichasTecnicas, ({ one, many }) => ({
  estabelecimento: one(estabelecimentos, {
    fields: [fichasTecnicas.estabelecimentoId],
    references: [estabelecimentos.id],
  }),
  insumos: many(fichaTecnicaInsumos),
  subReceitasPai: many(fichaTecnicaSubReceitas, { relationName: "pai" }),
  subReceitasFilha: many(fichaTecnicaSubReceitas, { relationName: "filha" }),
  producoes: many(registrosProducao),
  itensCardapio: many(itensCardapio),
}));

export const fichaTecnicaInsumosRelations = relations(fichaTecnicaInsumos, ({ one }) => ({
  fichaTecnica: one(fichasTecnicas, {
    fields: [fichaTecnicaInsumos.fichaTecnicaId],
    references: [fichasTecnicas.id],
  }),
  catalogItem: one(catalogItems, {
    fields: [fichaTecnicaInsumos.catalogItemId],
    references: [catalogItems.id],
  }),
}));

export const estoqueEstabelecimentoRelations = relations(estoqueEstabelecimento, ({ one }) => ({
  estabelecimento: one(estabelecimentos, {
    fields: [estoqueEstabelecimento.estabelecimentoId],
    references: [estabelecimentos.id],
  }),
  catalogItem: one(catalogItems, {
    fields: [estoqueEstabelecimento.catalogItemId],
    references: [catalogItems.id],
  }),
}));

export const catalogItemsRelations = relations(catalogItems, ({ many }) => ({
  inventoryItems: many(inventoryItems),
  estoqueEstabelecimento: many(estoqueEstabelecimento),
  fichaTecnicaInsumos: many(fichaTecnicaInsumos),
  movimentacoes: many(movimentacoesEstoque),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  catalogItem: one(catalogItems, {
    fields: [inventoryItems.catalogItemId],
    references: [catalogItems.id],
  }),
  batches: many(itemBatches),
  movements: many(stockMovements),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  estabelecimento: one(estabelecimentos, {
    fields: [expenses.estabelecimentoId],
    references: [estabelecimentos.id],
  }),
}));
