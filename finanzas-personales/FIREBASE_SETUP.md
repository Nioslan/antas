# Configurar Firebase (una sola vez)

Sin este paso el login en la nube no puede funcionar. El plan gratuito Spark alcanza.

## 1. Crear proyecto

1. Entrá a [console.firebase.google.com](https://console.firebase.google.com)
2. Creá un proyecto (ej. `finanzas-personales`)

## 2. Authentication

1. **Build → Authentication → Get started**
2. Activá **Email/Password**
3. Activá **Google** (elegí un email de soporte del proyecto)

## 3. Firestore

1. **Build → Firestore Database → Create database**
2. Modo de producción (o prueba, luego aplicá las reglas)
3. Región cercana (ej. `southamerica-east1`)
4. En **Rules**, pegá el contenido de [`firestore.rules`](./firestore.rules) y publicá

## 4. Registrar apps

### Web (preview en PC / Expo web)

1. Project settings → **Add app → Web**
2. Copiá el `firebaseConfig`

### Android (APK) — obligatorio para Google Sign-In

1. **Add app → Android**
2. Package name: `com.finanzas.personales`
3. **SHA-1 del APK preview (EAS)** — sin esto Google falla en el teléfono:

   ```
   40:E1:39:E5:CA:A5:0D:93:E0:8A:BC:C4:9B:12:77:B6:7E:11:C7:CB
   ```

4. Guardá y esperá 2–5 minutos (a veces hasta 1 hora) a que Google propague el cliente OAuth.
5. Descargá `google-services.json` si EAS lo pide más adelante.

> Tip: en Firebase → Project settings → Your apps → Android → Add fingerprint.

## 5. Pegar config en el proyecto

Editá [`src/lib/firebaseConfig.ts`](./src/lib/firebaseConfig.ts) y reemplazá los placeholders:

```ts
export const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
};
```

También podés usar variables de entorno `EXPO_PUBLIC_FIREBASE_*` (ver `.env.example`).

## 6. Google Sign-In en Expo

- **Web:** funciona con el proveedor Google de Firebase (popup).
- **Android APK:** usa `@react-native-google-signin/google-signin`.
  Necesita el **SHA-1** del keystore EAS en la app Android de Firebase
  (paso 4) y el **Web client ID** en `src/lib/firebaseConfig.ts`
  (`googleWebClientId`).
- Después de cambiar SHA-1 / package, hay que **reinstalar el APK nuevo**
  (Google nativo no llega por actualización OTA).

## Qué se sincroniza

Documento Firestore: `users/{uid}`

- `transactions`, `goals`, `fixedExpenses`, `cashNow`
- `chatMessages` (opcional)
- `updatedAt` (para merge por último write)

La API key de OpenAI **no** se sube: queda local en SecureStore.
