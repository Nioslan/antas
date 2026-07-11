import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  badge?: string;
  title: string;
  highlight?: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
};

export function SectionHeader({
  badge,
  title,
  highlight,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "mb-10 space-y-3 sm:mb-14",
        isCenter ? "mx-auto max-w-2xl text-center" : "max-w-xl",
        className,
      )}
    >
      {badge && (
        <p className="inline-flex items-center rounded-full border border-cyan/40 bg-cyan/5 px-4 py-1 text-xs font-semibold tracking-[0.25em] text-cyan uppercase">
          {badge}
        </p>
      )}
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}{" "}
        {highlight && <span className="text-cyan">{highlight}</span>}
      </h2>
      {description && (
        <p className="text-sm leading-relaxed text-muted sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
