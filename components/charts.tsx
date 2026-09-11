"use client";

import type React from "react";
import { useMemo } from "react";

export function gerarTrend(base: number, pontos = 14, variacao = 0.3): number[] {
  const arr: number[] = [];
  let val = base * (1 - variacao / 2);
  for (let i = 0; i < pontos; i++) {
    val += (Math.random() - 0.45) * base * 0.04;
    val = Math.max(val, 0);
    arr.push(val);
  }
  return arr;
}

export function calcVariacao(trend: number[]): { valor: string; positivo: boolean } {
  if (trend.length < 2) return { valor: "+0%", positivo: true };
  const primeiro = trend[0];
  const ultimo = trend[trend.length - 1];
  const pct = primeiro > 0 ? ((ultimo - primeiro) / primeiro) * 100 : 0;
  return {
    valor: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
    positivo: pct >= 0,
  };
}

export function Sparkline({
  data,
  color = "#2563eb",
  height = 36,
  width = 80,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const pontos = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const area = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * w;
      const y = pad + h - ((v - min) / range) * h;
      const baseY = pad + h;
      return `${i === 0 ? "M" : "L"}${x},${y}${i === data.length - 1 ? ` L${x},${baseY} L${pad},${baseY} Z` : ""}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`spark-grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-grad-${color.replace("#", "")})`} />
      <polyline
        points={pontos.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pontos[pontos.length - 1].split(",")[0]}
        cy={pontos[pontos.length - 1].split(",")[1]}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

export function TreemapChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  const tiles = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const largura = 300;
    const altura = 200;

    const areaTotal = largura * altura;
    const resultado: {
      x: number;
      y: number;
      w: number;
      h: number;
      name: string;
      value: number;
      color: string;
      pct: number;
    }[] = [];
    let xAtual = 0;
    let yAtual = 0;
    let linhaAlt = altura;

    for (const item of sorted) {
      const pct = item.value / total;
      const area = areaTotal * pct;
      if (xAtual + largura * 0.35 > largura) {
        xAtual = 0;
        yAtual += linhaAlt;
        linhaAlt = altura - yAtual;
      }
      const w = Math.max(40, Math.min(largura * 0.98, Math.sqrt(area * (largura / altura))));
      const h = Math.max(30, area / w);
      if (yAtual + h > altura) break;
      if (xAtual + w > largura) {
        const sobra = largura - xAtual;
        resultado.push({
          x: xAtual,
          y: yAtual,
          w: sobra,
          h,
          name: item.name,
          value: item.value,
          color: item.color,
          pct: pct * 100,
        });
        xAtual = 0;
        yAtual += h;
        resultado.push({
          x: xAtual,
          y: yAtual,
          w: largura * pct,
          h,
          name: item.name,
          value: item.value,
          color: item.color,
          pct: pct * 100,
        });
        xAtual += largura * pct;
      } else {
        resultado.push({
          x: xAtual,
          y: yAtual,
          w,
          h,
          name: item.name,
          value: item.value,
          color: item.color,
          pct: pct * 100,
        });
        xAtual += w;
      }
    }
    return resultado;
  }, [data, total]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 200, position: "relative" }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 200"
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        {tiles.map((t, _i) => (
          <g key={t.name}>
            <rect
              x={t.x}
              y={t.y}
              width={t.w}
              height={t.h}
              fill={t.color}
              rx={4}
              opacity={0.85}
              style={{ transition: "opacity 0.2s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.85";
              }}
            />
            {t.w > 50 && t.h > 30 && (
              <>
                <text
                  x={t.x + 6}
                  y={t.y + 14}
                  fill="white"
                  fontSize={9}
                  fontWeight={700}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {t.name.length > 12 ? `${t.name.slice(0, 12)}…` : t.name}
                </text>
                <text
                  x={t.x + 6}
                  y={t.y + 26}
                  fill="rgba(255,255,255,0.7)"
                  fontSize={8}
                  fontWeight={600}
                >
                  {t.pct.toFixed(1)}%
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

type Slice = {
  value: number;
  color: string;
  label: string;
};

export function DonutChart({
  slices,
  size = 180,
  innerRadius = 60,
  total,
}: {
  slices: Slice[];
  size?: number;
  innerRadius?: number;
  total?: number;
}) {
  const totalVal = total ?? slices.reduce((sum, s) => sum + s.value, 0);
  const radius = size / 2 - 10;

  if (totalVal === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="currentColor"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="currentColor"
          className="text-white dark:text-slate-900"
        />
      </svg>
    );
  }

  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      <g>
        {(() => {
          let cumulative = 0;
          return slices
            .filter((s) => s.value > 0)
            .map((slice, idx) => {
              const pct = slice.value / totalVal;
              const angle = pct * 360;
              const startAngle = (cumulative / totalVal) * 360;
              cumulative += slice.value;
              const startRad = ((startAngle - 90) * Math.PI) / 180;
              const endRad = ((startAngle + angle - 90) * Math.PI) / 180;
              const x1 = cx + radius * Math.cos(startRad);
              const y1 = cy + radius * Math.sin(startRad);
              const x2 = cx + radius * Math.cos(endRad);
              const y2 = cy + radius * Math.sin(endRad);
              const largeArc = angle > 180 ? 1 : 0;

              return (
                <path
                  key={`${slice.label}-${idx}`}
                  style={{
                    opacity: 0,
                    animation: `fadeSlice 0.4s ease-out ${idx * 0.05}s forwards`,
                  }}
                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={slice.color}
                />
              );
            });
        })()}
      </g>
      <circle
        cx={cx}
        cy={cy}
        r={innerRadius}
        fill="currentColor"
        className="text-white dark:text-slate-900"
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xl font-bold tracking-tight"
        fill="currentColor"
      >
        {totalVal > 1000 ? `${(totalVal / 1000).toFixed(1)}k` : totalVal}
      </text>
      <style>{`
        @keyframes fadeSlice { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </svg>
  );
}

export function BarChart({
  data,
  maxValue,
  color,
}: {
  data: { label: string; value: number }[];
  maxValue?: number;
  color?: string;
}) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item, i) => {
        const pct = (item.value / max) * 100;
        return (
          <div key={`${item.label}-${i}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-text-secondary truncate pr-4">
                {item.label}
              </span>
              <span className="text-xs font-bold tabular-nums text-text">{item.value}</span>
            </div>
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bar-grow"
                style={{
                  backgroundColor: color ?? "var(--color-brand-600)",
                  width: `${pct}%`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
      <style>{`
        .bar-grow { animation: barGrow 0.8s ease-out both; }
        @keyframes barGrow { from { width: 0 } }
      `}</style>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient?: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm hover:border-brand-500/30 transition-colors stat-card-enter">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-2 rounded-xl ${gradient ?? "bg-brand-500/10 text-brand-600"}`}>
          {Icon && <Icon className="h-4 w-4" />}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-text tracking-tight tabular-nums">{value}</p>
        {trend && (
          <span
            className={`text-[10px] font-bold ${trend.positive ? "text-emerald-500" : "text-rose-500"}`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {sub && <p className="text-[11px] font-medium text-text-tertiary mt-1">{sub}</p>}
      <style>{`
        .stat-card-enter { animation: statEnter 0.35s ease-out both; }
        @keyframes statEnter { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}

export function ThreeDContainer({
  children,
  className,
}: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function GaugeChart({
  value = 0,
  max = 100,
  size = 160,
  color = "#2563eb",
  label = "",
  subtitle,
}: {
  value?: number;
  max?: number;
  size?: number;
  color?: string;
  label?: string;
  subtitle?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2 - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcDeg = 270;
  const arcLength = (circumference * arcDeg) / 360;
  const dashOffset = arcLength - (pct / 100) * arcLength;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg
        width={size}
        height={size / 2 + 40}
        viewBox={`0 0 ${size} ${size / 2 + 40}`}
        className="overflow-visible"
      >
        <g transform={`rotate(135 ${size / 2} ${size / 2 + 15})`}>
          <circle
            cx={size / 2}
            cy={size / 2 + 15}
            r={radius}
            fill="none"
            stroke="var(--chart-track)"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2 + 15}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease-out, stroke 0.3s ease" }}
          />
        </g>
        <text
          x={size / 2}
          y={size / 2 + 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--chart-text)"
          fontSize={22}
          fontWeight={800}
          fontFamily="system-ui, sans-serif"
        >
          {Math.round(pct)}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 30}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--chart-text)"
          fontSize={13}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
        >
          {label}
        </text>
        {subtitle && (
          <text
            x={size / 2}
            y={size / 2 + 44}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--chart-text)"
            fontSize={11}
            fontFamily="system-ui, sans-serif"
          >
            {subtitle}
          </text>
        )}
      </svg>
    </div>
  );
}
