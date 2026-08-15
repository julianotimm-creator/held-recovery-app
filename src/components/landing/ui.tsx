import type { ReactNode } from "react";

// Routes to the consent gate rather than straight to /chat: the ToS + 18+
// checkbox must be the only way into the product.
export function CTAButton({
  children,
  variant = "main",
  className = "",
  href = "#consent",
}: {
  children: ReactNode;
  variant?: "main" | "secondary";
  className?: string;
  href?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-medium transition-all duration-300 hover:-translate-y-0.5";
  const styles =
    variant === "main"
      ? "bg-gradient-to-r from-primary to-accent-strong text-primary-foreground shadow-glow hover:opacity-95"
      : "border border-border bg-card text-foreground hover:bg-secondary";
  return (
    <a href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </a>
  );
}

export function Section({
  id,
  title,
  subtitle,
  children,
  tinted = false,
}: {
  id?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  tinted?: boolean;
}) {
  return (
    <section
      id={id}
      className={`relative w-full overflow-hidden px-5 py-20 sm:py-24 ${
        tinted ? "bg-surface-soft section-veil" : ""
      }`}
    >
      <div aria-hidden className="ambient-blob -top-24 -left-24 hidden size-[420px] sm:block" />
      <div
        aria-hidden
        className="ambient-blob -bottom-32 -right-20 hidden size-[380px] opacity-40 sm:block"
      />
      <div className="relative mx-auto w-full max-w-6xl">
        {title && (
          <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-muted-foreground">
            {subtitle}
          </p>
        )}
        <div className={title ? "mt-12" : ""}>{children}</div>
      </div>
    </section>
  );
}

export function Card({
  children,
  className = "",
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={`surface-panel lavender-edge h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow ${className}`}
      style={accent ? { borderTop: `3px solid ${accent}` } : undefined}
    >
      {children}
    </div>
  );
}

export function Grid({ cols = 4, children }: { cols?: 2 | 3 | 4 | 5; children: ReactNode }) {
  const map = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-5",
  } as const;
  return <div className={`grid grid-cols-1 gap-5 ${map[cols]}`}>{children}</div>;
}
