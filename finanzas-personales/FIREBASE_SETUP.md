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

### Android (APK)

1. **Add app → Android**
2. Package name: `com.finanzas.personales`
3. Descargá `google-services.json` si EAS lo pide más adelante

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

Para web local suele funcionar con el cliente Web de Firebase.

Para APK/iOS hace falta configurar OAuth clients en Google Cloud Console
(vinculado al mismo proyecto Firebase) y, si usás Expo Auth Session, el
scheme `finanzaspersonales` ya está en `app.json`.

## Qué se sincroniza

Documento Firestore: `users/{uid}`

- `transactions`, `goals`, `fixedExpenses`, `cashNow`
- `chatMessages` (opcional)
- `updatedAt` (para merge por último write)

La API key de OpenAI **no** se sube: queda local en SecureStore.
