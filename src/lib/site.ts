export const siteConfig = {
  name: "ANTAS",
  brand: "ANTASPC",
  tagline: "La PC que imaginas.",
  description:
    "Equipos premium para gaming, streaming y trabajo. Renew, Hybrid y Elite.",
  whatsapp: "5215512345678",
  email: "contacto@antaspc.com",
  address: "Miami, FL",
  hours: "Lun – Sáb: 10:00 – 19:00",
  social: {
    instagram: "https://instagram.com/antaspc",
    tiktok: "https://tiktok.com/@antas.g",
    facebook: "https://facebook.com/antaspc",
  },
} as const;

export const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/pcs?linea=renew", label: "PC Renew" },
  { href: "/pcs?linea=hybrid", label: "PC Hybrid" },
  { href: "/pcs?linea=elite", label: "PC Elite" },
  { href: "/servicios", label: "Servicios" },
  { href: "/upgrade", label: "Trade-In" },
  { href: "/contacto", label: "Contacto" },
] as const;

export const pcLines = [
  {
    id: "renew" as const,
    name: "PC Renew",
    tag: "Certificadas",
    description: "Computadoras usadas certificadas.",
    priceFrom: 699,
    href: "/pcs?linea=renew",
    accent: "cyan" as const,
  },
  {
    id: "hybrid" as const,
    name: "PC Hybrid",
    tag: "Mejor valor",
    description: "Componentes nuevos + usados certificados.",
    priceFrom: 1099,
    href: "/pcs?linea=hybrid",
    accent: "gold" as const,
  },
  {
    id: "elite" as const,
    name: "PC Elite",
    tag: "Premium",
    description: "Equipos completamente nuevos.",
    priceFrom: 1699,
    href: "/pcs?linea=elite",
    accent: "cyan" as const,
  },
];

export const featuredBuilds = [
  {
    id: "renew-nova",
    badge: "RENEW",
    title: "PC Renew Nova",
    cpu: "Ryzen 5 5600",
    gpu: "RTX 3060 12GB",
    ram: "32GB DDR4",
    storage: "1TB NVMe",
    price: 899,
    href: "/pcs?linea=renew",
  },
  {
    id: "hybrid-titan",
    badge: "HYBRID",
    title: "PC Hybrid Titan",
    cpu: "Ryzen 7 7700X",
    gpu: "RTX 5070",
    ram: "32GB DDR5",
    storage: "1TB Gen4",
    price: 1699,
    href: "/pcs?linea=hybrid",
  },
  {
    id: "elite-phantom",
    badge: "ELITE",
    title: "PC Elite Phantom",
    cpu: "Ryzen 9 9950X",
    gpu: "RTX 5090",
    ram: "64GB DDR5",
    storage: "2TB Gen5",
    price: 3299,
    href: "/pcs?linea=elite",
  },
] as const;

export const whyAntas = [
  {
    title: "Garantía incluida",
    description:
      "Todos nuestros equipos incluyen cobertura formal. Si algo falla, te respaldamos con un proceso claro y sin rodeos.",
  },
  {
    title: "Rendimiento verificado",
    description:
      "Antes de entregarte una PC, la probamos bajo carga real: temperaturas, estabilidad y rendimiento listos para usar.",
  },
  {
    title: "Ensamblado profesional",
    description:
      "Montaje limpio, cableado ordenado y componentes seleccionados para durar. Estándar de taller, no de ensamble improvisado.",
  },
  {
    title: "Soporte local",
    description:
      "Estamos cerca de ti. Asesoría antes de comprar y acompañamiento después, con atención directa y humana.",
  },
] as const;

export const homeWarranty = [
  {
    id: "renew",
    title: "PC Renew",
    detail: "2 meses",
    note: "Garantía incluida en equipos usados certificados.",
    accent: "cyan" as const,
  },
  {
    id: "hybrid",
    title: "PC Hybrid",
    detail: "2 meses",
    note: "Garantía incluida en equipos híbridos certificados.",
    accent: "gold" as const,
  },
  {
    id: "elite",
    title: "PC Elite",
    detail: "3 meses",
    note: "Garantía incluida en equipos completamente nuevos.",
    accent: "cyan" as const,
  },
  {
    id: "extendida",
    title: "Garantía extendida",
    detail: "6 meses",
    note: "Amplía tu cobertura pagando un 10% del valor del equipo al momento de la compra.",
    accent: "gold" as const,
  },
] as const;

export const reviews = [
  {
    name: "Carlos M.",
    text: "Mi Hybrid llegó impecable. Rendimiento sólido y atención clara en todo el proceso.",
  },
  {
    name: "Andrea R.",
    text: "Canjeé mi PC anterior sin complicaciones. Valoración transparente y trato profesional.",
  },
  {
    name: "Luis P.",
    text: "Se nota el ensamblado cuidadoso. Temperaturas estables y operación silenciosa.",
  },
] as const;
