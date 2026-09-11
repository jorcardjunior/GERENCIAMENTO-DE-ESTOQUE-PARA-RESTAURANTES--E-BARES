"use client";

export function NeuCard({
  children,
  className = "",
  style,
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: "var(--neu-card-bg)",
        boxShadow: "var(--neu-card-shadow)",
        border: "1px solid var(--neu-card-border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
