import { Platform } from 'react-native';
import * as Font from 'expo-font';

let installed = false;

/**
 * En web (sobre todo vía tunnel) la carga de Ionicons.ttf a veces falla o
 * tarda >6s y FontObserver tira "6000ms timeout exceeded" como uncaught.
 * Eso no debe tumbar el preview: los íconos pueden demorar, la app sigue.
 */
export function installWebFontSafety(): void {
  if (installed) return;
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined') return;
  installed = true;

  const original = Font.loadAsync.bind(Font);
  // Soft-fail: nunca rechazar por timeout de fuentes en web.
  (Font as { loadAsync: typeof Font.loadAsync }).loadAsync = ((
    ...args: Parameters<typeof Font.loadAsync>
  ) => {
    try {
      const result = original(...args);
      return Promise.resolve(result).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[fonts] loadAsync omitido:', msg);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[fonts] loadAsync omitido:', msg);
      return Promise.resolve();
    }
  }) as typeof Font.loadAsync;

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : String(reason ?? '');
    if (msg.includes('ms timeout exceeded')) {
      event.preventDefault();
    }
  });
}
