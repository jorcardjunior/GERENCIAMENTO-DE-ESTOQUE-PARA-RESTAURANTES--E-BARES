"use client";

import { RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunk = error.message?.includes("ChunkLoadError") || error.name === "ChunkLoadError";

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-status-danger-bg border-2 border-status-danger-border flex items-center justify-center text-status-danger-text">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-text mb-2">
          {isChunk ? "Falha no carregamento" : "Algo deu errado"}
        </h2>
        <p className="text-text-secondary mb-6">
          {isChunk
            ? "Ocorreu um erro ao carregar esta página. Pode ser um problema de cache ou conexão."
            : error.message || "Erro inesperado ao renderizar a página."}
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all text-sm font-bold shadow-lg shadow-blue-500/20"
        >
          Tentar novamente
        </button>
        {isChunk && (
          <p className="mt-4 text-xs text-text-tertiary">
            Se o erro persistir, limpe o cache do navegador ou reinicie o servidor.
          </p>
        )}
      </div>
    </div>
  );
}
