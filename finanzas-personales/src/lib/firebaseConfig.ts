/**
 * Firebase web config del proyecto finanzas-personales-21465.
 * También se puede sobreescribir con EXPO_PUBLIC_FIREBASE_*.
 */
const fromEnv = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
};

/** Valores del proyecto Firebase (consola). */
const embedded = {
  apiKey: 'AIzaSyArotLvvsAGQ7ei8hoZUEl-QWH3wEUrGa8',
  authDomain: 'finanzas-personales-21465.firebaseapp.com',
  projectId: 'finanzas-personales-21465',
  storageBucket: 'finanzas-personales-21465.firebasestorage.app',
  messagingSenderId: '812081659477',
  appId: '1:812081659477:web:2043e363f47774a57ededc',
  measurementId: 'G-0YZ6D44M9H',
};

function pick(key: keyof typeof embedded): string {
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
  measurementId: pick('measurementId'),
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
