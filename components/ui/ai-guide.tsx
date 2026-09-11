"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronRight, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";

const PAGE_GUIDES: Record<string, { title: string; tips: string[] }> = {
  "/app/dashboard": {
    title: "Dashboard Central",
    tips: [
      "Visão 360º do seu negócio em tempo real.",
      "Card de AI Insights: Avisos proativos sobre estoque e vencimentos.",
      "Atalhos Rápidos: Use os botões de ação para criar itens ou categorias.",
      "Barra de Busca: Pressione CMD+K para comandos por voz/texto.",
    ],
  },
  "/app/gestao": {
    title: "Gestão de Estoque",
    tips: [
      "Inventário Completo: Liste e gerencie todos os insumos.",
      "Estoque Mínimo: Configure alertas para nunca ficar sem produto.",
      "Histórico: Veja quem e quando alterou as quantidades.",
      "Filtros Rápidos: Localize itens por categoria ou status crítico.",
    ],
  },
  "/app/financeiro": {
    title: "Controle Financeiro",
    tips: [
      "Fluxo de Caixa: Registre todas as despesas (fixas e variáveis).",
      "Categorias Customizadas: Organize gastos por Aluguel, Insumos, etc.",
      "Análise PowerBI: Gráficos automáticos mostram seu balanço mensal.",
      "Status de Pagamento: Controle o que já foi pago e o que está pendente.",
    ],
  },
  "/app/usuarios": {
    title: "Equipe & Colaboradores",
    tips: [
      "Cargos Específicos: Atribua funções como Chef, Bartender ou Garçom.",
      "Permissões: Administradores têm controle total sobre o sistema.",
      "Segurança: Garanta que cada colaborador tenha seu próprio acesso.",
      "Status Ativo: Monitore quem está na equipe no momento.",
    ],
  },
  "/app/relatorios": {
    title: "Análise de Dados",
    tips: [
      "Exportação Inteligente: Gere arquivos CSV para contabilidade.",
      "Valor Imobilizado: Saiba quanto dinheiro você tem parado em estoque.",
      "Previsão de Demanda: Use os dados para planejar suas próximas compras.",
      "Relatórios de Perda: Identifique onde você está perdendo dinheiro.",
    ],
  },
  "/app/fichas-tecnicas": {
    title: "Fichas Técnicas",
    tips: [
      "Engenharia de Cardápio: Calcule o custo exato de cada prato.",
      "Insumos: Vincule itens do estoque para atualização automática.",
      "Modo de Preparo: Padronize a produção da sua cozinha.",
      "Preço Sugerido: Calcule margem de lucro com base nos custos.",
    ],
  },
  "/app/pedidos-compra": {
    title: "Pedidos de Compra",
    tips: [
      "Gestão de Fornecedores: Tenha o contato de todos em um só lugar.",
      "Histórico de Preços: Acompanhe a inflação dos seus insumos.",
      "Recebimento: Registre a entrada de mercadorias no estoque.",
      "Rastreabilidade: Saiba exatamente quando cada pedido foi feito.",
    ],
  },
  "/app/estabelecimentos": {
    title: "Estabelecimentos",
    tips: [
      "Cadastre cada filial ou unidade como um estabelecimento separado.",
      "Atribua colaboradores com cargos específicos por unidade.",
      "Monitore o status (ativo/inativo/fechado) de cada unidade.",
      "Configure logotipo e dados de contato por estabelecimento.",
    ],
  },
  "/app/transferencias": {
    title: "Transferências",
    tips: [
      "Transfira itens entre estabelecimentos de forma rápida.",
      "Acompanhe o status: rascunho, enviado ou recebido.",
      "Registre recebimento parcial para controle de remessas.",
      "Consulte o histórico completo de transferências.",
    ],
  },
  "/app/bi": {
    title: "Indicadores (BI)",
    tips: [
      "Visualize giro de estoque, CMV e saúde geral do negócio.",
      "Acompanhe custo vs preço de cada prato do cardápio.",
      "Identifique itens parados há 30 ou 60 dias (gargalos).",
      "Projeção de estoque para os próximos 14 dias.",
    ],
  },
  "/app/bi/sugestao-compra": {
    title: "Sugestão de Compra",
    tips: [
      "Recomendações baseadas no consumo dos últimos 30 dias.",
      "Considere estoque atual e ponto de ressuprimento.",
      "Sugere quantidades ideais e fornecedores para cada item.",
      "Gere pedidos de compra diretamente das sugestões.",
    ],
  },
  "/app/preenchimento": {
    title: "Preenchimento de Estoque",
    tips: [
      "Faça contagem física dos itens diretamente no sistema.",
      "Registre ajustes de estoque de forma simplificada.",
      "Identifique divergências entre estoque teórico e real.",
      "Ideal para inventários periódicos.",
    ],
  },
  "/app/importar": {
    title: "Importação Inteligente",
    tips: [
      "Arraste arquivos CSV ou Excel para importar em massa.",
      "A IA detecta automaticamente o significado de cada coluna.",
    ],
  },
  "/app/configuracoes": {
    title: "Configurações",
    tips: [
      "Configure sons de alerta (tipo e volume).",
      "Ajuste tema claro, escuro ou automático.",
      "Configurações salvas e sincronizadas automaticamente.",
    ],
  },
  "/app/profile": {
    title: "Meu Perfil",
    tips: [
      "Veja seu nome, email e cargo no sistema.",
      "Informações da empresa vinculada à sua conta.",
      "Acesse configurações de segurança.",
    ],
  },
};

type Mensagem = {
  id: number;
  tipo: "user" | "bot";
  texto: string;
};

export function AIGuide() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [mode, setMode] = React.useState<"tips" | "chat">("tips");
  const [mensagem, setMensagem] = React.useState("");
  const [carregando, setCarregando] = React.useState(false);
  const [historico, setHistorico] = React.useState<Mensagem[]>([]);
  const [ultimaPergunta, setUltimaPergunta] = React.useState("");
  const pathname = usePathname();
  const chatRef = React.useRef<HTMLDivElement>(null);

  const guide = PAGE_GUIDES[pathname] || {
    title: "Assistente Inteligente",
    tips: [
      "Navegue pelas abas para ver dicas específicas de cada seção.",
      "Pressione os cards para saber como economizar.",
    ],
  };

  React.useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [historico]);

  const enviarPergunta = async () => {
    if (!mensagem.trim()) return;

    const pergunta = mensagem.trim();
    setMensagem("");
    setHistorico((prev) => [...prev, { id: Date.now(), tipo: "user", texto: pergunta }]);
    setCarregando(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta, ultimaPergunta }),
      });
      const data = await res.json();
      setUltimaPergunta(pergunta);
      setHistorico((prev) => [
        ...prev,
        { id: Date.now() + 1, tipo: "bot", texto: data.resposta || "Erro ao processar." },
      ]);
      if (data.rota === "iniciar_tour") {
        window.dispatchEvent(new CustomEvent("start-tour"));
      }
    } catch {
      setHistorico((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          tipo: "bot",
          texto: "Não consegui conectar ao servidor. Tente novamente.",
        },
      ]);
    } finally {
      setCarregando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarPergunta();
    }
  };

  return (
    <>
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-20 right-6 z-50 bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 px-4 py-2 rounded-2xl shadow-xl border border-brand-500/20 text-xs font-bold pointer-events-none"
          >
            Posso ajudar?
            <div className="absolute -bottom-1 right-5 w-2 h-2 bg-white dark:bg-slate-800 border-r border-b border-brand-500/20 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => {
          setIsOpen(true);
          setShowTooltip(false);
          setMode("tips");
        }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-brand-600 text-white shadow-xl shadow-brand-500/30 flex items-center justify-center border border-white/20 overflow-hidden"
      >
        <Sparkles className="w-5 h-5" />
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="absolute inset-0 bg-white/20 skew-x-12"
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-end p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass border-brand-500/20 shadow-2xl rounded-3xl overflow-hidden pointer-events-auto"
              style={{ maxHeight: "min(80vh, 600px)" }}
            >
              <div className="bg-brand-600 p-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 fill-white" />
                  <span className="font-bold text-sm uppercase tracking-widest">
                    Estoque Inteligente
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMode(mode === "tips" ? "chat" : "tips")}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title={mode === "tips" ? "Perguntar algo" : "Ver dicas"}
                  >
                    {mode === "tips" ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : (
                      <BookOpen className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {mode === "tips" ? (
                <div className="p-6 space-y-6 overflow-y-auto">
                  <div>
                    <h3 className="text-lg font-bold text-text mb-1 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-brand-500" /> {guide.title}
                    </h3>
                    <p className="text-xs text-text-tertiary font-medium">
                      O que você pode fazer nesta tela:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {guide.tips.map((tip, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex gap-3 p-3 bg-surface-tertiary/50 rounded-2xl border border-border group hover:border-brand-500/30 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0 text-[10px] font-bold">
                          {i + 1}
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed font-medium">
                          {tip}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => setMode("chat")}
                      className="text-xs font-bold text-brand-600 hover:text-brand-500 transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                      Faça uma pergunta sobre o sistema <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col h-full"
                  style={{ maxHeight: "calc(min(80vh, 600px) - 56px)" }}
                >
                  <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {historico.length === 0 && (
                      <div className="text-center py-8">
                        <Sparkles className="w-10 h-10 text-brand-600/50 mx-auto mb-3" />
                        <p className="text-sm font-bold text-text mb-1">
                          Pergunte algo sobre o sistema
                        </p>
                        <p className="text-xs text-text-tertiary">
                          Ex: "Qual o estoque total?", "Quanto temos de camarão?",
                          <br />
                          "Quais itens estão com estoque baixo?"
                        </p>
                      </div>
                    )}
                    {historico.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.tipo === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                            msg.tipo === "user"
                              ? "bg-brand-600 text-white rounded-br-md"
                              : "bg-surface-tertiary text-text rounded-bl-md border border-border"
                          }`}
                        >
                          {msg.texto}
                        </div>
                      </div>
                    ))}
                    {carregando && (
                      <div className="flex justify-start">
                        <div className="bg-surface-tertiary px-4 py-2 rounded-2xl rounded-bl-md border border-border">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" />
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce"
                              style={{ animationDelay: "0.15s" }}
                            />
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce"
                              style={{ animationDelay: "0.3s" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-border bg-surface-secondary shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua pergunta..."
                        className="flex-1 px-3 py-2 bg-surface border border-input rounded-xl text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        disabled={carregando}
                      />
                      <button
                        onClick={enviarPergunta}
                        disabled={carregando || !mensagem.trim()}
                        className="px-3 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-600/50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
