-- Professional multi-tenant migration
-- Companies plan, roles, invitations

-- New enums
CREATE TYPE "public"."auth_role" AS ENUM('owner','admin','gerente','funcionario','visualizador');
CREATE TYPE "public"."company_plan" AS ENUM('free','basic','professional','enterprise');
CREATE TYPE "public"."invitation_status" AS ENUM('pending','accepted','expired','cancelled');

-- Add plan and ownerId to estabelecimentos
ALTER TABLE "estabelecimentos" ADD COLUMN "plan" "company_plan" DEFAULT 'free' NOT NULL;
ALTER TABLE "estabelecimentos" ADD COLUMN "owner_id" text;

-- Rename estabelecimento_id -> company_id in user table, change role to new enum
ALTER TABLE "user" RENAME COLUMN "estabelecimento_id" TO "company_id";
ALTER TABLE "user" ALTER COLUMN "role" TYPE "auth_role" USING "role"::text::auth_role;
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'funcionario';
ALTER TABLE "user" ADD CONSTRAINT "user_company_id_estabelecimentos_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."estabelecimentos"("id");

-- Add auth_role and company_id to legacy users table
ALTER TABLE "users" ADD COLUMN "auth_role" "auth_role" DEFAULT 'funcionario' NOT NULL;
ALTER TABLE "users" ADD COLUMN "company_id" uuid REFERENCES "public"."estabelecimentos"("id");

-- Invitations table
CREATE TABLE IF NOT EXISTS "invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" uuid NOT NULL REFERENCES "public"."estabelecimentos"("id"),
  "email" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "role" "auth_role" NOT NULL DEFAULT 'funcionario',
  "token" text NOT NULL UNIQUE,
  "status" "invitation_status" NOT NULL DEFAULT 'pending',
  "invited_by" text REFERENCES "public"."user"("id"),
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
