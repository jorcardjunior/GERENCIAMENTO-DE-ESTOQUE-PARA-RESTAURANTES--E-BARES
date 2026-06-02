import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, color = "text-primary", className }: StatCardProps) {
  return (
    <Card className={cn("border-white/5 hover:border-primary/20 group cursor-default", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
          {label}
        </CardTitle>
        <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-white italic tracking-tighter">{value}</div>
      </CardContent>
    </Card>
  );
}
