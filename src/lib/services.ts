export type ServiceMode = "domicilio" | "cita";

export type Service = {
  id: string;
  name: string;
  shortName: string;
  summary: string;
  description: string;
  icon:
    | "cpu"
    | "wrench"
    | "sparkles"
    | "thermometer"
    | "monitor"
    | "settings"
    | "activity";
  modes: ServiceMode[];
  details: string[];
  includes: string[];
  idealFor: string;
};

export const serviceModes: Record<
  ServiceMode,
  { label: string; description: string }
> = {
  domicilio: {
    label: "A domicilio",
    description: "Vamos a tu ubicación en el área de Miami.",
  },
  cita: {
    label: "Por cita",
    description: "Agenda en nuestro taller o punto de servicio.",
  },
};

export const services: Service[] = [
  {
    id: "limpieza",
    name: "Limpieza de PC",
    shortName: "Limpieza",
    summary: "Polvo fuera. Temperaturas más bajas. Equipo más silencioso.",
    description:
      "Realizamos una limpieza interna y externa profesional para recuperar flujo de aire, reducir ruido y alargar la vida útil de tu PC. Ideal si notas sobrecalentamiento o ventiladores ruidosos.",
    icon: "sparkles",
    modes: ["domicilio", "cita"],
    details: [
      "Remoción de polvo en ventiladores, filtros y disipadores",
      "Limpieza de rejillas y zonas críticas de flujo de aire",
      "Revisión visual de conexiones y acumulación de suciedad",
      "Equipo listo para trabajar más fresco y estable",
    ],
    includes: [
      "Limpieza interna completa",
      "Limpieza externa de gabinete",
      "Revisión rápida de ventilación",
      "Recomendaciones de mantenimiento",
    ],
    idealFor:
      "PCs con polvo acumulado, ruido excesivo o temperaturas elevadas.",
  },
  {
    id: "pasta",
    name: "Cambio de pasta térmica",
    shortName: "Pasta térmica",
    summary: "Mejor contacto térmico. Menos calor. Más estabilidad.",
    description:
      "Reemplazamos la pasta térmica del procesador (y GPU si aplica) con material de calidad y aplicación profesional. Ayuda a bajar temperaturas y evitar throttling.",
    icon: "thermometer",
    modes: ["domicilio", "cita"],
    details: [
      "Desmontaje seguro del cooler",
      "Limpieza del IHS y base del disipador",
      "Aplicación profesional de pasta térmica",
      "Prueba de temperaturas después del servicio",
    ],
    includes: [
      "Pasta térmica de calidad",
      "Limpieza de residuos anteriores",
      "Remontaje correcto del cooler",
      "Verificación térmica básica",
    ],
    idealFor:
      "Equipos con años de uso, temperaturas altas o pérdida de rendimiento por calor.",
  },
  {
    id: "upgrade",
    name: "Upgrade de componentes",
    shortName: "Upgrade",
    summary: "Más potencia sin cambiar toda la PC.",
    description:
      "Te ayudamos a mejorar RAM, SSD, GPU u otros componentes con asesoría de compatibilidad, instalación y pruebas. Sube el rendimiento de forma inteligente.",
    icon: "wrench",
    modes: ["domicilio", "cita"],
    details: [
      "Diagnóstico de cuellos de botella",
      "Recomendación de componentes compatibles",
      "Instalación profesional",
      "Prueba de funcionamiento y estabilidad",
    ],
    includes: [
      "Asesoría de upgrade",
      "Instalación del componente",
      "Pruebas post-instalación",
      "Orientación de uso y cuidado",
    ],
    idealFor:
      "Quienes quieren más FPS, más velocidad o más capacidad sin comprar una PC nueva.",
  },
  {
    id: "windows",
    name: "Instalación de Windows",
    shortName: "Windows",
    summary: "Sistema limpio, estable y listo para usar.",
    description:
      "Instalamos Windows 10 u 11 de forma limpia, con configuración inicial, activación y optimización básica para que tu PC arranque rápido y sin basura innecesaria.",
    icon: "monitor",
    modes: ["domicilio", "cita"],
    details: [
      "Instalación de Windows 10 u 11",
      "Particionado y formateo si es necesario",
      "Activación y configuración inicial",
      "Optimización básica del sistema",
    ],
    includes: [
      "Instalación limpia",
      "Configuración inicial",
      "Cuentas y ajustes esenciales",
      "Preparación para drivers",
    ],
    idealFor:
      "PCs lentas, reinicios, errores de sistema o equipos recién armados.",
  },
  {
    id: "optimizacion",
    name: "Optimización del sistema",
    shortName: "Optimización",
    summary: "Más fluidez en juegos, streaming y trabajo.",
    description:
      "Ajustamos tu sistema para mejorar respuesta, arranque y rendimiento general: servicios, inicio, configuración gráfica y limpieza de procesos innecesarios.",
    icon: "settings",
    modes: ["domicilio", "cita"],
    details: [
      "Revisión de programas al inicio",
      "Ajustes de rendimiento del sistema",
      "Optimización para gaming o productividad",
      "Limpieza de procesos y basura digital",
    ],
    includes: [
      "Diagnóstico de rendimiento",
      "Ajustes de Windows",
      "Configuración recomendada",
      "Checklist de mejoras aplicadas",
    ],
    idealFor:
      "Equipos lentos, con lag, arranque pesado o mal aprovechamiento del hardware.",
  },
  {
    id: "ensamblaje",
    name: "Ensamblaje de PC",
    shortName: "Ensamblaje",
    summary: "Montaje profesional, limpio y probado.",
    description:
      "Armamos tu PC completa con cableado ordenado, instalación de componentes, pruebas de encendido y verificación de temperaturas. Estándar de taller ANTAS.",
    icon: "cpu",
    modes: ["domicilio", "cita"],
    details: [
      "Instalación de todos los componentes",
      "Gestión de cables profesional",
      "Prueba de encendido y BIOS",
      "Verificación de temperaturas",
    ],
    includes: [
      "Ensamblaje completo",
      "Pruebas de estabilidad básicas",
      "Organización de cableado",
      "Entrega lista para usar",
    ],
    idealFor:
      "Clientes con componentes nuevos o kits que necesitan montaje confiable.",
  },
  {
    id: "diagnostico",
    name: "Diagnóstico técnico",
    shortName: "Diagnóstico",
    summary: "Encontramos el problema. Te explicamos la solución.",
    description:
      "Revisamos tu PC para identificar fallas de hardware o software: no enciende, se apaga, pantallazos, ruido anormal o bajo rendimiento. Te entregamos un diagnóstico claro.",
    icon: "activity",
    modes: ["domicilio", "cita"],
    details: [
      "Revisión de encendido y señales de falla",
      "Pruebas de componentes clave",
      "Análisis de errores y estabilidad",
      "Informe claro con siguientes pasos",
    ],
    includes: [
      "Evaluación técnica",
      "Identificación de causa probable",
      "Recomendación de reparación o upgrade",
      "Orientación de costos estimados",
    ],
    idealFor:
      "PCs con fallas intermitentes, apagados, errores o comportamiento inestable.",
  },
];

export function getServiceById(id: string) {
  return services.find((s) => s.id === id);
}
