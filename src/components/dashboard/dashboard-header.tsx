import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
}

export function DashboardHeader({ title, subtitle, badge, className }: DashboardHeaderProps) {
  return (
    <header className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4", className)}>
      <div className="space-y-1">
        {badge && (
          <p className="text-primary font-bold uppercase tracking-[0.2em] text-xs">
            {badge}
          </p>
        )}
        <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white leading-none uppercase">
          {title}
        </h1>
      </div>
      {subtitle && (
        <p className="text-zinc-500 max-w-[250px] text-sm leading-tight md:text-right italic">
          {subtitle}
        </p>
      )}
    </header>
  );
}
