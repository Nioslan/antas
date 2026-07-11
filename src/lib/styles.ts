import { cn } from "@/lib/utils";

export const buttonStyles = {
  cyan: "inline-flex items-center justify-center gap-2 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-background transition duration-300 hover:bg-cyan/90 shadow-[0_0_28px_rgba(34,211,238,0.22)]",
  amber:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-gold/60 px-5 py-3 text-sm font-semibold text-gold transition duration-300 hover:bg-gold hover:text-background shadow-[0_0_18px_rgba(245,197,24,0.16)]",
  chipActive: "bg-cyan text-background shadow-[0_0_16px_rgba(34,211,238,0.22)]",
  chipInactive:
    "border border-border text-muted hover:border-gold/35 hover:text-foreground",
} as const;

export function chipClass(active: boolean) {
  return cn(
    "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
    active ? buttonStyles.chipActive : buttonStyles.chipInactive,
  );
}

export function cardHoverClass(accent: "cyan" | "amber" = "cyan") {
  return accent === "amber"
    ? "transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_28px_rgba(245,197,24,0.14)]"
    : "transition-all duration-300 hover:border-cyan/40 hover:shadow-[0_0_32px_rgba(34,211,238,0.16)]";
}
