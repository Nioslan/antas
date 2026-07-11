export const paymentsConfig = {
  /** Cambiar a true cuando tengas LLC + cuenta Stripe verificada */
  onlinePaymentsEnabled: false,
  provider: "stripe" as const,
  location: "Miami, FL — Estados Unidos",
} as const;

export const paymentMethods = [
  {
    id: "card",
    name: "Tarjeta de crédito y débito",
    description: "Visa, Mastercard, American Express y más.",
    status: "coming_soon" as const,
    brands: ["Visa", "Mastercard", "Amex"],
  },
  {
    id: "klarna",
    name: "Klarna",
    description: "Divide tu compra en 4 pagos sin intereses o paga a plazos.",
    status: "coming_soon" as const,
    brands: ["Klarna"],
  },
  {
    id: "affirm",
    name: "Affirm",
    description: "Financiamiento mensual transparente. Sin tarjetas ocultas.",
    status: "coming_soon" as const,
    brands: ["Affirm"],
  },
  {
    id: "apple_google",
    name: "Apple Pay y Google Pay",
    description: "Pago rápido y seguro desde tu celular.",
    status: "coming_soon" as const,
    brands: ["Apple Pay", "Google Pay"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Coordina tu pedido y pago directamente con nuestro equipo.",
    status: "active" as const,
    brands: ["WhatsApp"],
  },
] as const;

export const financingFaqs = [
  {
    q: "¿Cuándo podré pagar con tarjeta en la web?",
    a: "Estamos preparando la tienda para aceptar pagos con Stripe. En cuanto ANTASPC complete el registro de LLC y la verificación bancaria, activaremos tarjeta, Klarna y Affirm en el checkout.",
  },
  {
    q: "¿Cómo compro mientras tanto?",
    a: "Agrega productos al carrito y completa tu pedido por WhatsApp. Te confirmamos disponibilidad, total y opciones de pago disponibles hoy.",
  },
  {
    q: "¿Klarna y Affirm estarán disponibles en Miami?",
    a: "Sí. Ambos servicios operan en Estados Unidos y se integrarán a través de Stripe para clientes elegibles según monto y perfil crediticio.",
  },
  {
    q: "¿Hay intereses con Klarna o Affirm?",
    a: "Klarna ofrece pagos en 4 sin intereses en compras elegibles. Affirm muestra el costo total y las mensualidades antes de confirmar — sin sorpresas.",
  },
  {
    q: "¿Es seguro pagar en ANTASPC?",
    a: "Sí. Cuando activemos pagos online, Stripe procesará las transacciones. ANTASPC nunca almacena los datos de tu tarjeta.",
  },
] as const;

export const llcChecklist = [
  "Registrar LLC de ANTASPC en Florida",
  "Obtener EIN (número fiscal del negocio)",
  "Abrir cuenta bancaria empresarial",
  "Crear y verificar cuenta en Stripe",
  "Activar Klarna y Affirm en el dashboard de Stripe",
] as const;
