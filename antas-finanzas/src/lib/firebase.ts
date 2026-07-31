/**
 * Firebase desactivado en 2.0.0 para estabilizar el arranque Android.
 * No se importa el SDK nativo/JS de Firebase.
 */
export function isFirebaseConfigured(): boolean {
  return false;
}

export function getFirebaseAuth(): never {
  throw new Error('Firebase desactivado en esta versión.');
}

export function getFirebaseDb(): never {
  throw new Error('Firebase desactivado en esta versión.');
}
