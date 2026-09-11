CREATE TYPE "public"."cardapio_categoria" AS ENUM('entrada', 'principal', 'sobremesa', 'bebida', 'lanche', 'infantil');--> statement-breakpoint
CREATE TYPE "public"."cargo" AS ENUM('admin', 'gerente', 'funcionario', 'cozinheiro');--> statement-breakpoint
CREATE TYPE "public"."estabelecimento_status" AS ENUM('ativo', 'inativo', 'fechado');--> statement-breakpoint
CREATE TYPE "public"."ficha_categoria" AS ENUM('entrada', 'principal', 'sobremesa', 'bebida', 'lanche', 'guarnicao', 'molho', 'preparo_base');--> statement-breakpoint
CREATE TYPE "public"."pedido_status" AS ENUM('rascunho', 'enviado', 'recebido_parcial', 'recebido', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."perda_tipo" AS ENUM('vencimento', 'preparo', 'sobra', 'deterioracao', 'quebra', 'outro');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('IN', 'OUT', 'LOSS', 'ADJUST');--> statement-breakpoint
CREATE TYPE "public"."transferencia_status" AS ENUM('pendente', 'enviado', 'recebido', 'cancelado');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid,
	"action" varchar(50) NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" varchar(50) NOT NULL,
	"unit_default" varchar(20) DEFAULT 'un' NOT NULL,
	"synonyms" text,
	"track_expiry" boolean DEFAULT false NOT NULL,
	"yellow_threshold" numeric(10, 2) DEFAULT '10' NOT NULL,
	"red_threshold" numeric(10, 2) DEFAULT '5' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"color" varchar(7) DEFAULT '#2563eb' NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "centros_custo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estabelecimento_id" uuid NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar(50),
	"name" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estabelecimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"nome_fantasia" varchar(255),
	"cnpj" varchar(18),
	"endereco" text,
	"cidade" varchar(100),
	"estado" varchar(50),
	"telefone" varchar(20),
	"email" varchar(255),
	"status" "estabelecimento_status" DEFAULT 'ativo' NOT NULL,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estoque_estabelecimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estabelecimento_id" uuid NOT NULL,
	"catalog_item_id" uuid NOT NULL,
	"estoque_atual" numeric(10, 3) DEFAULT '0' NOT NULL,
	"estoque_minimo" numeric(10, 3) DEFAULT '0',
	"estoque_maximo" numeric(10, 3),
	"lote" varchar(50),
	"validade" date,
	"localizacao" varchar(100),
	"custo_medio" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ficha_tecnica_insumos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ficha_tecnica_id" uuid NOT NULL,
	"catalog_item_id" uuid,
	"insumo_nome" varchar(255) NOT NULL,
	"quantidade" numeric(10, 3) NOT NULL,
	"unidade" varchar(20) NOT NULL,
	"percentual_perda" numeric(5, 2) DEFAULT '0',
	"custo_unitario" numeric(10, 2) DEFAULT '0',
	"observacao" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ficha_tecnica_sub_receitas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ficha_tecnica_pai_id" uuid NOT NULL,
	"ficha_tecnica_filha_id" uuid NOT NULL,
	"quantidade" numeric(10, 3) DEFAULT '1' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fichas_tecnicas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estabelecimento_id" uuid NOT NULL,
	"nome" varchar(255) NOT NULL,
	"categoria" "ficha_categoria" DEFAULT 'principal' NOT NULL,
	"rendimento" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unidade_rendimento" varchar(20) DEFAULT 'porcao' NOT NULL,
	"tempo_preparo_min" integer,
	"modo_preparo" text,
	"custo_total" numeric(10, 2) DEFAULT '0',
	"preco_sugerido" numeric(10, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'ativo' NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historico_precos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_item_id" uuid NOT NULL,
	"estabelecimento_id" uuid,
	"preco_anterior" numeric(10, 2),
	"preco_novo" numeric(10, 2) NOT NULL,
	"supplier_id" uuid,
	"observacao" text,
	"registered_by" uuid,
	"registered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_item_id" uuid NOT NULL,
	"current_stock" numeric(10, 3) DEFAULT '0' NOT NULL,
	"reorder_point" numeric(10, 3) DEFAULT '0' NOT NULL,
	"yellow_threshold" numeric(10, 3) DEFAULT '10' NOT NULL,
	"red_threshold" numeric(10, 3) DEFAULT '5' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"count_date" timestamp with time zone,
	"counted_by" text,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"batch_code" varchar(100),
	"qty_current" numeric(10, 3) DEFAULT '0' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid,
	"catalog_item_id" uuid,
	"quantity" numeric(10, 3) NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"requested_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"min_stock" numeric(10, 2) DEFAULT '0' NOT NULL,
	"current_quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit_price" numeric(10, 2),
	"count_date" date,
	"expiry_date" date,
	"responsible_user" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itens_cardapio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estabelecimento_id" uuid NOT NULL,
	"ficha_tecnica_id" uuid NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"categoria" "cardapio_categoria",
	"preco_venda" numeric(10, 2) DEFAULT '0' NOT NULL,
	"disponivel" boolean DEFAULT true NOT NULL,
	"imagem_url" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movimentacoes_estoque" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estabelecimento_id" uuid NOT NULL,
	"catalog_item_id" uuid NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"quantidade" numeric(10, 3) NOT NULL,
	"saldo_anterior" numeric(10, 3) DEFAULT '0' NOT NULL,
	"saldo_posterior" numeric(10, 3) DEFAULT '0' NOT NULL,
	"custo_unitario" numeric(10, 2),
	"ficha_tecnica_id" uuid,
	"pedido_id" uuid,
	"observacao" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedido_compra_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_compra_id" uuid NOT NULL,
	"catalog_item_id" uuid,
	"item_nome" varchar(255) NOT NULL,
	"quantidade" numeric(10, 3) NOT NULL,
	"unidade" varchar(20) NOT NULL,
	"quantidade_recebida" numeric(10, 3) DEFAULT '0',
	"valor_unitario" numeric(10, 2) DEFAULT '0',
	"observacao" text
);
--> statement-breakpoint
CREATE TABLE "pedidos_compra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estabelecimento_id" uuid NOT NULL,
	"supplier_id" uuid,
	"fornecedor_nome" varchar(255),
	"numero_pedido" varchar(50),
	"status" "pedido_status" DEFAULT 'rascunho' NOT NULL,
	"data_pedido" date DEFAULT now(),
	"data_prevista" date,
	"data_recebimento" timestamp with time zone,
	"valor_total" numeric(10, 2) DEFAULT '0',
	"observacao" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'staff' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"can_add_items" boolean DEFAULT true NOT NULL,
	"can_view_reports" boolean DEFAULT true NOT NULL,
	"can_manage_suppliers" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "registros_perda" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estabelecimento_id" uuid NOT NULL,
	"catalog_item_id" uuid NOT NULL,
	"quantidade" numeric(10, 3) NOT NULL,
	"unidade" varchar(20) NOT NULL,
	"tipo_perda" "perda_tipo" NOT NULL,
	"custo_perda" numeric(10, 2) DEFAULT '0',
	"observacao" text,
	"registered_by" uuid,
	"registered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registros_producao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estabelecimento_id" uuid NOT NULL,
	"ficha_tecnica_id" uuid NOT NULL,
	"quantidade_produzida" numeric(10, 2) NOT NULL,
	"custo_total_producao" numeric(10, 2) DEFAULT '0',
	"data_producao" timestamp with time zone DEFAULT now(),
	"observacao" text,
	"produced_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" varchar(255) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"batch_id" uuid,
	"type" "stock_movement_type" NOT NULL,
	"qty" numeric(10, 3) NOT NULL,
	"reason" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_name" varchar(255),
	"phone" varchar(20),
	"email" varchar(255),
	"address" text,
	"cnpj" varchar(18),
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transferencia_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transferencia_id" uuid NOT NULL,
	"catalog_item_id" uuid NOT NULL,
	"quantidade" numeric(10, 3) NOT NULL,
	"unidade" varchar(20) NOT NULL,
	"lote" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "transferencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estabelecimento_origem_id" uuid NOT NULL,
	"estabelecimento_destino_id" uuid NOT NULL,
	"status" "transferencia_status" DEFAULT 'pendente' NOT NULL,
	"observacao" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'staff' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usuario_estabelecimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"estabelecimento_id" uuid NOT NULL,
	"cargo" "cargo" DEFAULT 'funcionario' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centros_custo" ADD CONSTRAINT "centros_custo_estabelecimento_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque_estabelecimento" ADD CONSTRAINT "estoque_estabelecimento_estabelecimento_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque_estabelecimento" ADD CONSTRAINT "estoque_estabelecimento_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha_tecnica_insumos" ADD CONSTRAINT "ficha_tecnica_insumos_ficha_tecnica_id_fichas_tecnicas_id_fk" FOREIGN KEY ("ficha_tecnica_id") REFERENCES "public"."fichas_tecnicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha_tecnica_insumos" ADD CONSTRAINT "ficha_tecnica_insumos_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha_tecnica_sub_receitas" ADD CONSTRAINT "ficha_tecnica_sub_receitas_ficha_tecnica_pai_id_fichas_tecnicas_id_fk" FOREIGN KEY ("ficha_tecnica_pai_id") REFERENCES "public"."fichas_tecnicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha_tecnica_sub_receitas" ADD CONSTRAINT "ficha_tecnica_sub_receitas_ficha_tecnica_filha_id_fichas_tecnicas_id_fk" FOREIGN KEY ("ficha_tecnica_filha_id") REFERENCES "public"."fichas_tecnicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fichas_tecnicas" ADD CONSTRAINT "fichas_tecnicas_estabelecimento_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_precos" ADD CONSTRAINT "historico_precos_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_precos" ADD CONSTRAINT "historico_precos_estabelecimento_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_precos" ADD CONSTRAINT "historico_precos_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_batches" ADD CONSTRAINT "item_batches_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_requests" ADD CONSTRAINT "item_requests_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_requests" ADD CONSTRAINT "item_requests_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_responsible_user_users_id_fk" FOREIGN KEY ("responsible_user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_cardapio" ADD CONSTRAINT "itens_cardapio_estabelecimento_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_cardapio" ADD CONSTRAINT "itens_cardapio_ficha_tecnica_id_fichas_tecnicas_id_fk" FOREIGN KEY ("ficha_tecnica_id") REFERENCES "public"."fichas_tecnicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_estabelecimento_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_ficha_tecnica_id_fichas_tecnicas_id_fk" FOREIGN KEY ("ficha_tecnica_id") REFERENCES "public"."fichas_tecnicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_compra_itens" ADD CONSTRAINT "pedido_compra_itens_pedido_compra_id_pedidos_compra_id_fk" FOREIGN KEY ("pedido_compra_id") REFERENCES "public"."pedidos_compra"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_compra_itens" ADD CONSTRAINT "pedido_compra_itens_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_estabelecimento_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_perda" ADD CONSTRAINT "registros_perda_estabelecimento_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_perda" ADD CONSTRAINT "registros_perda_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_producao" ADD CONSTRAINT "registros_producao_estabelecimento_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_producao" ADD CONSTRAINT "registros_producao_ficha_tecnica_id_fichas_tecnicas_id_fk" FOREIGN KEY ("ficha_tecnica_id") REFERENCES "public"."fichas_tecnicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batch_id_item_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."item_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transferencia_itens" ADD CONSTRAINT "transferencia_itens_transferencia_id_transferencias_id_fk" FOREIGN KEY ("transferencia_id") REFERENCES "public"."transferencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transferencia_itens" ADD CONSTRAINT "transferencia_itens_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_estabelecimento_origem_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_origem_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_estabelecimento_destino_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_destino_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_estabelecimento" ADD CONSTRAINT "usuario_estabelecimento_estabelecimento_id_estabelecimentos_id_fk" FOREIGN KEY ("estabelecimento_id") REFERENCES "public"."estabelecimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_estoque_lote" ON "estoque_estabelecimento" USING btree ("estabelecimento_id","catalog_item_id","lote");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sub_receita" ON "ficha_tecnica_sub_receitas" USING btree ("ficha_tecnica_pai_id","ficha_tecnica_filha_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_usuario_estabelecimento" ON "usuario_estabelecimento" USING btree ("user_id","estabelecimento_id");