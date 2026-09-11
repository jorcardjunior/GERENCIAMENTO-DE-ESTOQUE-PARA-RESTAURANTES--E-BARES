import { db } from "@/db";
import {
  catalogItems,
  estoqueEstabelecimento,
  items,
  settings as settingsTable,
} from "@/db/schema";
import { getSession } from "@/lib/auth-server";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

function fc(val: number | string | null | undefined): number {
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

type Notificacao = {
  id: string;
  tipo: "critico" | "alerta" | "vencimento";
  mensagem: string;
  itemNome: string;
  detalhe: string;
  gravidade: number;
};

async function loadSettings(): Promise<Record<string, string>> {
  try {
    const rows = await db.select().from(settingsTable);
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    return { ...DEFAULT_SETTINGS, ...map };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function GET(request: Request) {
  try {
    const user = await getSession(request.headers);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cfg = await loadSettings();
    const lowStockMult = 1 + fc(cfg.alert_low_stock_pct) / 100;
    const criticalMult = 1 + fc(cfg.alert_critical_stock_pct) / 100;
    const _expiryDays = fc(cfg.alert_expiry_days);
    const notifySameDay = cfg.alert_expiry_same_day === "true";
    const notifyDayBefore = cfg.alert_expiry_day_before === "true";

    const notificacoes: Notificacao[] = [];
    let idCounter = 0;

    // Stock notifications
    try {
      const baixos = await db
        .select({
          itemId: estoqueEstabelecimento.id,
          nome: catalogItems.name,
          estoqueAtual: estoqueEstabelecimento.estoqueAtual,
          estoqueMinimo: estoqueEstabelecimento.estoqueMinimo,
          validade: estoqueEstabelecimento.validade,
          unidade: catalogItems.unitDefault,
        })
        .from(estoqueEstabelecimento)
        .innerJoin(catalogItems, eq(estoqueEstabelecimento.catalogItemId, catalogItems.id))
        .where(
          and(
            isNotNull(estoqueEstabelecimento.estoqueMinimo),
            sql`${estoqueEstabelecimento.estoqueAtual} > 0`,
            lte(
              estoqueEstabelecimento.estoqueAtual,
              sql`${estoqueEstabelecimento.estoqueMinimo} * ${lowStockMult}`,
            ),
          ),
        );

      for (const item of baixos) {
        const atual = fc(item.estoqueAtual);
        const min = fc(item.estoqueMinimo);
        const isCritico = atual <= min * criticalMult;
        notificacoes.push({
          id: `est-${idCounter++}`,
          tipo: isCritico ? "critico" : "alerta",
          mensagem: isCritico
            ? `${item.nome} está CRÍTICO (${atual} ${item.unidade})`
            : `${item.nome} está baixo (${atual}/${min} ${item.unidade})`,
          itemNome: item.nome,
          detalhe: isCritico
            ? `Estoque (${atual} ${item.unidade}) abaixo do mínimo (${min} ${item.unidade})`
            : `Estoque (${atual} ${item.unidade}) próximo do mínimo (${min} ${item.unidade})`,
          gravidade: isCritico ? 10 : 5,
        });

        // Expiry check
        if (item.validade && (notifySameDay || notifyDayBefore)) {
          const valDate = new Date(`${item.validade}T23:59:59`);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffMs = valDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffMs / 86400000);

          if ((notifyDayBefore && diffDays === 1) || (notifySameDay && diffDays === 0)) {
            notificacoes.push({
              id: `exp-${idCounter++}`,
              tipo: "vencimento",
              mensagem: `${item.nome} vence ${diffDays === 0 ? "HOJE" : "AMANHÃ"}`,
              itemNome: item.nome,
              detalhe: `Validade: ${item.validade} · Estoque: ${atual} ${item.unidade}`,
              gravidade: diffDays === 0 ? 9 : 7,
            });
          }
        }
      }
    } catch {}

    // Fallback to legacy items table
    if (notificacoes.filter((n) => n.tipo !== "vencimento").length === 0) {
      try {
        const legacyItems = await db
          .select()
          .from(items)
          .where(
            and(
              isNotNull(items.minStock),
              sql`${items.currentQuantity} > 0`,
              lte(items.currentQuantity, sql`${items.minStock} * ${lowStockMult}`),
            ),
          );

        for (const item of legacyItems) {
          const atual = fc(item.currentQuantity);
          const min = fc(item.minStock);
          const isCritico = atual <= min * criticalMult;
          notificacoes.push({
            id: `leg-${idCounter++}`,
            tipo: isCritico ? "critico" : "alerta",
            mensagem: isCritico
              ? `${item.name} está CRÍTICO (${atual} ${item.unit})`
              : `${item.name} está baixo (${atual}/${min} ${item.unit})`,
            itemNome: item.name,
            detalhe: isCritico
              ? `Estoque (${atual} ${item.unit}) abaixo do mínimo (${min} ${item.unit})`
              : `Estoque (${atual} ${item.unit}) próximo do mínimo (${min} ${item.unit})`,
            gravidade: isCritico ? 10 : 5,
          });

          // Legacy expiry check
          if (item.expiryDate && (notifySameDay || notifyDayBefore)) {
            const valDate = new Date(`${item.expiryDate}T23:59:59`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffMs = valDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffMs / 86400000);
            if ((notifyDayBefore && diffDays === 1) || (notifySameDay && diffDays === 0)) {
              notificacoes.push({
                id: `lexp-${idCounter++}`,
                tipo: "vencimento",
                mensagem: `${item.name} vence ${diffDays === 0 ? "HOJE" : "AMANHÃ"}`,
                itemNome: item.name,
                detalhe: `Validade: ${item.expiryDate} · Estoque: ${atual} ${item.unit}`,
                gravidade: diffDays === 0 ? 9 : 7,
              });
            }
          }
        }
      } catch {}
    }

    notificacoes.sort((a, b) => b.gravidade - a.gravidade);

    return NextResponse.json({
      notificacoes,
      total: notificacoes.length,
      criticos: notificacoes.filter((n) => n.tipo === "critico").length,
      alertas: notificacoes.filter((n) => n.tipo === "alerta").length,
      vencimentos: notificacoes.filter((n) => n.tipo === "vencimento").length,
    });
  } catch (error) {
    console.error("Notificações API error:", error);
    return NextResponse.json({
      notificacoes: [],
      total: 0,
      criticos: 0,
      alertas: 0,
      vencimentos: 0,
    });
  }
}
