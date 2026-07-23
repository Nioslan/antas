# Finanzas Personales

App móvil (Expo) para controlar ingresos, gastos, presupuestos y metas, con un **coach de IA** desde el primer día.

## Qué incluye

- Dashboard del mes (ingresos, gastos, balance)
- Registro de movimientos por categoría
- Metas de ahorro con progreso
- Presupuestos mensuales por categoría
- Coach IA:
  - **Sin API key**: coach local que analiza tus números
  - **Con OpenAI**: respuestas más naturales (clave en Ajustes)

## Cómo correrla

```bash
cd C:\Users\niosl\Projects\finanzas-personales
npm start
```

Escaneá el QR con **Expo Go** en el celular.

## OpenAI (opcional)

1. Abrí la app → Ajustes (engranaje)
2. Pegá tu API key de OpenAI (`sk-...`)
3. Guardá — el coach pasa a usar GPT

La clave se guarda en el dispositivo con Secure Store. No se sube a ningún servidor propio.

## Nota

Este proyecto es **independiente** de AntasPC.
