# Finanzas Personales

App Android (Expo) — paquete `com.antas.finanzas`.

## Pantallas

- **Inicio** — resumen del mes, saldo, accesos rápidos
- **Ahorro** — metas y progreso de ahorro
- **Movimientos** — ingresos y gastos diarios
- **Fijos** — gastos fijos / facturas
- **Coach** — chat con IA que usa tus movimientos como contexto (asesor financiero)

## Datos

- Guardados en el teléfono (AsyncStorage)
- Coach local sin API; si agregás una clave OpenAI en Ajustes, usa GPT

## Local (revisar en el navegador)

```bash
cd antas-finanzas
npm install
npx expo start --web
```

## APK (cuando lo pidas)

```bash
cd antas-finanzas
npm run build:preview
```
