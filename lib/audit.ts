import { db } from "@/db";
import { auditEvents } from "@/db/schema";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "SWITCH_USER"
  | "IMPORT"
  | "EXPORT"
  | "APPROVE"
  | "TRANSFER"
  | "ADJUST_STOCK"
  | "CHANGE_PASSWORD"
  | "ROLE_CHANGE"
  | "INVITE"
  | "SETTINGS_CHANGE";

export async function logAudit(params: {
  action: AuditAction;
  tableName: string;
  recordId?: string;
  userId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditEvents).values({
      action: params.action,
      tableName: params.tableName,
      recordId: params.recordId || null,
      userId: params.userId || null,
      oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : null,
      newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : null,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Erro ao registrar auditoria:", error);
    }
  }
}
