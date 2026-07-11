import { cn } from "@/lib/utils";
import { paymentMethods } from "@/lib/payments";

type PaymentMethodsProps = {
  variant?: "compact" | "full";
  className?: string;
};

export function PaymentMethods({
  variant = "compact",
  className,
}: PaymentMethodsProps) {
  const methods =
    variant === "compact"
      ? ["Visa", "MC", "Amex", "Klarna", "Affirm", "Apple Pay"]
      : paymentMethods.flatMap((m) => m.brands);

  const unique = [...new Set(methods)];

  return (
    <div className={className}>
      {variant === "full" && (
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          Métodos de pago
        </p>
      )}
      <div className={cn("flex flex-wrap gap-2", className)}>
        {unique.map((brand) => (
          <span
            key={brand}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase sm:text-xs",
              brand === "WhatsApp"
                ? "border-cyan/30 bg-cyan/10 text-cyan"
                : "border-border bg-surface-elevated text-muted",
            )}
          >
            {brand}
          </span>
        ))}
        {variant === "compact" && (
          <span className="rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-gold uppercase sm:text-xs">
            Próximamente
          </span>
        )}
      </div>
    </div>
  );
}
