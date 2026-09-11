"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Notificacao = {
  id: string;
  tipo: "critico" | "alerta" | "vencimento";
  mensagem: string;
  itemNome: string;
  detalhe: string;
  gravidade: number;
};

type NotificacoesResponse = {
  notificacoes: Notificacao[];
  total: number;
  criticos: number;
  alertas: number;
};

export function useNotificacoes() {
  const [data, setData] = useState<NotificacoesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotificacoes = useCallback(async () => {
    try {
      const res = await fetch("/api/notificacoes");
      if (res.ok) {
        const json: NotificacoesResponse = await res.json();
        setData(json);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificacoes();
    intervalRef.current = setInterval(fetchNotificacoes, 60000); // poll every 60s
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotificacoes]);

  return { data, loading, refetch: fetchNotificacoes };
}
