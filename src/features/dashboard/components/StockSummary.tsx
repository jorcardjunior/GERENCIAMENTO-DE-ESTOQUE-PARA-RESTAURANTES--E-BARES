import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingDown, CircleDollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useInventoryStats } from "@/features/inventory/hooks/useInventory";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        const startTime = performance.now();
        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(value * eased);
            if (progress < 1) requestAnimationFrame(animate);
            else setDisplay(value);
        };
        requestAnimationFrame(animate);
    }, [value, duration]);

    return <>{Math.round(display).toLocaleString("pt-BR")}</>;
}

/**
 * Componente de Sumário do Dashboard para o EcoStock Moderno.
 * Apresenta métricas críticas de estoque com visual vibrante e moderno.
 */
export const StockSummary = () => {
  const { data: stats, isLoading } = useInventoryStats();

  if (isLoading) return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 animate-pulse">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-800/40 rounded-3xl" />)}
    </div>
  );

  const cards = [
    {
      title: "Total de Itens",
      value: stats?.totalItems || 0,
      icon: Package,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      trend: "+2.5%",
      isPositive: true
    },
    {
      title: "Estoque Baixo",
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      trend: "-5%",
      isPositive: true
    },
    {
      title: "Vencendo / Crítico",
      value: stats?.criticalStockCount || 0,
      icon: TrendingDown,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      trend: "+12%",
      isPositive: false
    },
    {
      title: "Valor em Estoque",
      value: "R$ 0,00",
      icon: CircleDollarSign,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      trend: "Estável",
      isPositive: true
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Card className={cn(
            "relative overflow-hidden border-none shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/5",
            "bg-slate-900/40 backdrop-blur-xl border border-white/5 group rounded-[2rem] h-full"
          )}>
          {/* Decorative Glow */}
          <div className={cn(
            "absolute -right-4 -top-4 w-20 h-20 blur-3xl opacity-20 transition-opacity group-hover:opacity-40",
            card.bg.replace('/10', '/30')
          )} />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest">{card.title}</CardTitle>
            <div className={cn("p-2.5 rounded-2xl border shadow-lg transition-transform duration-300 group-hover:rotate-12 animate-icon-glow", card.bg, card.color, card.border)}>
              <card.icon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col gap-1">
              <div className="text-3xl font-black tracking-tighter text-white tabular-nums">
                {typeof card.value === "number" ? <AnimatedNumber value={card.value} /> : card.value}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5",
                  card.isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                )}>
                  {card.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {card.trend}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">vs último mês</span>
              </div>
            </div>
          </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};