import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  surface?: boolean;
  phoneScreen?: boolean;
};

export function Section({
  id,
  children,
  className,
  surface = false,
  phoneScreen = true,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative flex items-center border-t border-border/60",
        phoneScreen
          ? "min-h-[var(--phone-section)] py-10 sm:min-h-[560px] sm:py-14 lg:min-h-[620px] lg:py-16"
          : "py-10 sm:py-14 lg:py-16",
        surface ? "bg-surface" : "bg-background",
        className,
      )}
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  accent?: "cyan" | "gold";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  accent = "cyan",
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-6 max-w-2xl sm:mb-8 lg:mb-10", className)}>
      {eyebrow ? (
        <p
          className={cn(
            "mb-2 text-[11px] font-semibold tracking-[0.28em] uppercase sm:text-xs",
            accent === "gold" ? "text-gold" : "text-cyan",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      <div
        className={cn(
          "mt-3 h-0.5 w-10 rounded-full",
          accent === "gold" ? "bg-gold" : "bg-cyan",
        )}
      />
      {description ? (
        <p className="mt-2.5 text-sm leading-relaxed text-muted sm:mt-3 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
