"use client";

export function Section({
  children,
  className,
  delay = 0,
  id,
}: { children: React.ReactNode; className?: string; delay?: number; id?: string }) {
  return (
    <section id={id} className={className} style={{ animationDelay: `${delay}s` }}>
      {children}
      <style>{`
        section { animation: sectionFadeIn 0.6s ease-out both; }
        @keyframes sectionFadeIn { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </section>
  );
}

export function FadeInView({
  children,
  className,
  delay = 0,
}: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div className={className} style={{ animationDelay: `${delay}s` }}>
      {children}
      <style>{`
        div { animation: fadeViewIn 0.5s ease-out both; }
        @keyframes fadeViewIn { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}

export function StaggerGrid({
  children,
  className,
}: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function GridItem({
  children,
  className,
}: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
