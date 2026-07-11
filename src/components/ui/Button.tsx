import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-cyan text-background hover:bg-cyan/90 shadow-[0_0_24px_rgba(34,211,238,0.28)]",
  secondary:
    "border border-cyan/50 bg-cyan/10 text-cyan hover:bg-cyan hover:text-background",
  outline:
    "border border-cyan/60 text-cyan hover:bg-cyan hover:text-background",
  ghost:
    "border border-white/10 text-foreground hover:border-cyan/40 hover:text-cyan",
  amber:
    "border border-gold/70 bg-gold/10 text-gold hover:bg-gold hover:text-background shadow-[0_0_18px_rgba(245,197,24,0.18)]",
} as const;

type CommonProps = {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  disabled?: boolean;
};

type LinkButtonProps = CommonProps & {
  href: string;
  onClick?: never;
  type?: never;
};

type NativeButtonProps = CommonProps & {
  href?: undefined;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
};

type ButtonProps = LinkButtonProps | NativeButtonProps;

export function Button(props: ButtonProps) {
  const { children, variant = "primary", className, disabled } = props;

  const classes = cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
