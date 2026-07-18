import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_KEY = 'finanzas:guest_access:v1';

/** El usuario eligió "Seguir sin cuenta" en este dispositivo. */
export async function getGuestAccess(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(GUEST_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setGuestAccess(enabled: boolean): Promise<void> {
  if (enabled) {
    await AsyncStorage.setItem(GUEST_KEY, '1');
  } else {
    await AsyncStorage.removeItem(GUEST_KEY);
  }
}
