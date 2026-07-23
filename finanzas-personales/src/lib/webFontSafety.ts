/**
 * En web (sobre todo vía tunnel lento) FontObserver de expo-font puede tirar
 * "6000ms timeout exceeded" como unhandledrejection y el overlay rojo tapa la app.
 * Solo interceptamos ese rechazo; no tocamos exports de expo-font (son getters).
 */
export function installWebFontSafety(): void {
  if (typeof window === 'undefined') return;

  const w = window as Window & { __antasFontSafety?: boolean };
  if (w.__antasFontSafety) return;
  w.__antasFontSafety = true;

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
      console.warn('[fonts] timeout ignorado:', msg);
    }
  });
}
