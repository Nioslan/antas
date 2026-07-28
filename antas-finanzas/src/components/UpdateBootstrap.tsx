import { type ReactNode } from 'react';

/**
 * Passthrough: en 1.9.0 no tocamos expo-updates al arrancar.
 * Evita crash nativo en Android. Las mejoras van por APK nuevo.
 */
export function UpdateBootstrap({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
