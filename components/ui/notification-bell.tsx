"use client";

import { useNotificacoes } from "@/hooks/use-notificacoes";
import { useSettings } from "@/hooks/use-settings";
import { playNotificationSound } from "@/lib/sound";
import { AlertTriangle, Bell, Info, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function NotificationBell() {
  const { data, loading } = useNotificacoes();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prevTotalRef = useRef(0);
  const soundPlayedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Play sound on new notifications
  useEffect(() => {
    if (!data || loading) return;
    const soundEnabled = settings.alert_sound_enabled === "true" && !soundMuted;
    const soundType = settings.alert_sound_type || "beep";
    const volume = Number(settings.alert_sound_volume) || 50;

    if (!soundEnabled || soundType === "none") return;

    const newNotifs = data.notificacoes.filter((n) => !soundPlayedRef.current.has(n.id));
    if (newNotifs.length === 0) return;

    const hasCritical = newNotifs.some((n) => n.tipo === "critico");
    const hasAlert = newNotifs.some((n) => n.tipo === "alerta");
    const hasExpiry = newNotifs.some((n) => n.tipo === "vencimento");

    if (hasCritical) {
      playNotificationSound("critico", volume);
    } else if (hasAlert || hasExpiry) {
      playNotificationSound("alerta", volume);
    }

    newNotifs.forEach((n) => soundPlayedRef.current.add(n.id));
    prevTotalRef.current = data.total;
  }, [data, loading, settings, soundMuted]);

  const total = data?.total ?? 0;
  const criticos = data?.criticos ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl glass border-brand-500/20 hover:scale-110 active:scale-95 transition-all group shadow-elevated"
        aria-label="Notificações"
      >
        <Bell
          className={`w-4 h-4 ${total > 0 ? "text-yellow-400" : "text-text-tertiary"} group-hover:text-text transition-colors`}
        />
        {total > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-lg">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-3 w-80 max-h-96 overflow-y-auto rounded-2xl bg-surface border border-border shadow-elevated z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-4 border-b border-border-light">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text">Notificações</h3>
              <div className="flex items-center gap-2">
                {criticos > 0 && (
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                    {criticos} crítico{criticos > 1 ? "s" : ""}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSoundMuted(!soundMuted);
                  }}
                  className="p-1 rounded-lg hover:bg-surface-secondary transition-colors"
                  title={soundMuted ? "Ativar som" : "Silenciar"}
                >
                  {soundMuted ? (
                    <VolumeX className="w-4 h-4 text-text-tertiary" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-text-tertiary" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {loading ? (
              <p className="text-xs text-text-tertiary text-center py-4">Carregando...</p>
            ) : total === 0 ? (
              <div className="text-center py-6">
                <Info className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
                <p className="text-sm text-text-secondary">Nenhuma notificação</p>
                <p className="text-xs text-text-tertiary mt-1">
                  Todos os itens estão com estoque adequado.
                </p>
              </div>
            ) : (
              data?.notificacoes.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl text-sm transition-colors ${
                    n.tipo === "critico"
                      ? "bg-red-500/10 border border-red-500/20"
                      : n.tipo === "vencimento"
                        ? "bg-purple-500/10 border border-purple-500/20"
                        : "bg-yellow-500/10 border border-yellow-500/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        n.tipo === "critico"
                          ? "text-red-400"
                          : n.tipo === "vencimento"
                            ? "text-purple-400"
                            : "text-yellow-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text text-xs">{n.mensagem}</p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">{n.detalhe}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {total > 0 && (
            <div className="p-3 border-t border-border-light text-center">
              <a
                href="/app/bi/sugestao-compra"
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
              >
                Ver sugestão de compra →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
