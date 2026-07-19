# Cómo probar con amigos (sin reenviar el APK cada vez)

## Idea

1. **Una sola vez** les mandás el APK.
2. Cada vez que cambiamos la app (pantallas, lógica, textos, avisos…), publicamos una **actualización OTA**.
3. Ellos solo **abren la app** (o tocan Ajustes → Buscar actualizaciones) y se actualiza sola.
4. **Sus datos en el teléfono no se borran.**

## APK único para todos (instalación inicial)

> **Importante:** el package debe ser `com.finanzas.personales` para que
> actualizar NO borre los datos. No uses APKs con `com.llc.finanzaspersonales`.

El link se actualiza en `src/lib/apk.ts` cada vez que sale un APK nuevo.
Mandales ese link por WhatsApp. Que instalen **esa** app (ícono billetera mint).

## Qué deciles a tus amigos

> Instalá este APK una vez. Después, cada vez que abras la app se va a actualizar sola. No hace falta que te vuelva a mandar el archivo.

## Qué NO necesita APK nuevo

- Cambios de pantallas, textos, gastos, fijos, coach, ajustes, etc. → **OTA**

## Qué SÍ necesita APK nuevo (raro)

- Ícono / splash nativo
- Permisos nuevos del sistema
- Librerías nativas nuevas  
En ese caso: un APK nuevo **una vez**, y después otra vez solo OTA.

## Para nosotros (al publicar un cambio)

Desde `finanzas-personales/`:

```bash
npx eas update --channel preview --message "descripción del cambio"
```

Canal: **preview** · runtime: **1.0.0** (no subir el `version` de `app.json` salvo que hagamos APK nuevo a propósito).
