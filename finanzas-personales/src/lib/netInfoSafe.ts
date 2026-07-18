type NetInfoState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

type Unsubscribe = () => void;

/**
 * Wrapper seguro: si el módulo nativo no está en el APK (OTA viejo),
 * no crashea y asume online.
 */
export function subscribeNetwork(
  listener: (online: boolean) => void
): Unsubscribe {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NetInfo = require('@react-native-community/netinfo').default as {
      addEventListener: (
        cb: (state: NetInfoState) => void
      ) => Unsubscribe;
    };
    return NetInfo.addEventListener((info) => {
      listener(Boolean(info.isConnected && info.isInternetReachable !== false));
    });
  } catch {
    listener(true);
    return () => undefined;
  }
}
