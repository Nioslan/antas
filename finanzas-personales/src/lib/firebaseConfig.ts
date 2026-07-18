/**
 * Firebase web config.
 *
 * 1) Seguí FIREBASE_SETUP.md
 * 2) Pegá acá los valores de la consola, o usá EXPO_PUBLIC_FIREBASE_*
 *
 * Mientras haya placeholders, Auth/Firestore no van a conectar.
 */
const fromEnv = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** Valores embebidos (reemplazá después de crear el proyecto Firebase). */
const embedded = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

function pick(key: keyof typeof fromEnv): string {
  const envVal = fromEnv[key]?.trim();
  if (envVal) return envVal;
  return embedded[key];
}

export const firebaseConfig = {
  apiKey: pick('apiKey'),
  authDomain: pick('authDomain'),
  projectId: pick('projectId'),
  storageBucket: pick('storageBucket'),
  messagingSenderId: pick('messagingSenderId'),
  appId: pick('appId'),
};

export const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined;

export function isFirebaseConfigured(): boolean {
  return (
    Boolean(firebaseConfig.apiKey) &&
    !firebaseConfig.apiKey.startsWith('YOUR_') &&
    Boolean(firebaseConfig.projectId) &&
    !firebaseConfig.projectId.startsWith('YOUR_')
  );
}
