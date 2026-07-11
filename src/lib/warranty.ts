import type { ProductLine } from "@/types/inventory";

export const WARRANTY_POLICY = {
  title: "Política de Garantía ANTASPC",
  intro:
    "En ANTASPC respaldamos cada equipo que vendemos. Esta política describe la cobertura incluida y la garantía extendida opcional.",
  sections: [
    {
      title: "Garantía para equipos nuevos (PC Elite)",
      items: [
        "Todos los equipos 100% nuevos incluyen 3 meses de garantía sin costo adicional.",
        "La garantía cubre defectos de fabricación y fallas de hardware bajo condiciones normales de uso.",
      ],
    },
    {
      title: "Garantía para equipos PC Renew",
      items: [
        "Todos los equipos PC Renew incluyen 2 meses de garantía.",
        "Cada computadora es inspeccionada, probada y certificada por ANTASPC antes de su venta.",
      ],
    },
    {
      title: "Garantía para equipos PC Hybrid",
      items: [
        "Todos los equipos PC Hybrid incluyen 2 meses de garantía.",
        "Combinan componentes nuevos y usados certificados, con la misma revisión técnica ANTASPC.",
      ],
    },
    {
      title: "Garantía Extendida",
      items: [
        "Si deseas mayor tranquilidad, puedes adquirir una Garantía Extendida de 6 meses.",
        "Costo: 10% del valor total del equipo.",
        "Debe comprarse al momento de la compra de la computadora.",
        "La garantía extendida amplía la cobertura de hardware hasta completar 6 meses.",
      ],
      highlight: true,
    },
    {
      title: "¿Qué cubre la garantía?",
      intro: "La garantía cubre:",
      items: [
        "Defectos de fabricación.",
        "Fallas del procesador.",
        "Fallas de la tarjeta gráfica.",
        "Fallas de la memoria RAM.",
        "Fallas del SSD o HDD.",
        "Fallas de la fuente de poder.",
        "Fallas de la placa madre.",
        "Problemas de funcionamiento causados por un defecto del componente.",
      ],
    },
    {
      title: "La garantía NO cubre",
      intro: "La garantía queda anulada si el equipo presenta:",
      items: [
        "Golpes o caídas.",
        "Daños por líquidos o humedad.",
        "Sobrevoltaje o conexiones eléctricas incorrectas.",
        "Manipulación interna por personas ajenas a ANTASPC.",
        "Sellos de garantía rotos o removidos.",
        "Daños causados por virus, software o sistemas operativos.",
        "Daños ocasionados por un uso indebido.",
      ],
      warning: true,
    },
    {
      title: "Proceso de garantía",
      intro: "Si tu equipo presenta una falla:",
      items: [
        "Contáctanos por WhatsApp o correo electrónico.",
        "Entrega el equipo para su diagnóstico.",
        "Nuestro equipo técnico realizará una revisión.",
        "Si la falla está cubierta por la garantía, la reparación o sustitución del componente será sin costo.",
      ],
    },
    {
      title: "Tiempo de diagnóstico",
      items: [
        "El tiempo estimado de diagnóstico es de 3 a 7 días hábiles, dependiendo de la complejidad del problema y la disponibilidad de piezas.",
      ],
    },
    {
      title: "Reemplazo de componentes",
      items: [
        "Si un componente presenta un defecto cubierto por la garantía y no puede repararse, ANTASPC podrá reemplazarlo por otro de igual o mejor rendimiento.",
      ],
    },
    {
      title: "Respaldo de información",
      items: [
        "ANTASPC no se hace responsable por la pérdida de información almacenada en el equipo. Se recomienda realizar una copia de seguridad antes de entregar la computadora para servicio.",
      ],
    },
    {
      title: "Compromiso ANTASPC",
      items: [
        "Nuestro objetivo es que disfrutes tu computadora con total confianza. Trabajamos con componentes de calidad y probamos cada equipo antes de entregarlo para garantizar el mejor rendimiento y una excelente experiencia.",
      ],
      highlight: true,
    },
  ],
} as const;

export const EXTENDED_WARRANTY_RATE = 0.1;
export const EXTENDED_WARRANTY_MONTHS = 6;

export const INCLUDED_WARRANTY_MONTHS: Record<ProductLine, number> = {
  renew: 2,
  hybrid: 2,
  elite: 3,
};

export function calculateExtendedWarranty(subtotal: number) {
  return Math.round(subtotal * EXTENDED_WARRANTY_RATE * 100) / 100;
}

export function getIncludedWarrantyMonths(line?: ProductLine | null): number {
  if (!line) return 0;
  return INCLUDED_WARRANTY_MONTHS[line];
}

export function getWarrantyMonths(
  line?: ProductLine | null,
  extended = false,
): number {
  if (extended) return EXTENDED_WARRANTY_MONTHS;
  return getIncludedWarrantyMonths(line);
}

/** Adds calendar months without mutating the original date. */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() < day) {
    result.setDate(0);
  }
  return result;
}

export function calculateWarrantyEndDate(
  soldAt: Date | string,
  months: number,
): string | null {
  if (months <= 0) return null;
  const start = typeof soldAt === "string" ? new Date(soldAt) : soldAt;
  return addMonths(start, months).toISOString();
}

export function formatWarrantyDate(iso: string | null | undefined): string {
  if (!iso) return "Sin garantía";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
