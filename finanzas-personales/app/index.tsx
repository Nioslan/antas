import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useFinance } from '../src/context/FinanceContext';
import { useSettings } from '../src/context/SettingsContext';

const BOOT_FAIL_OPEN_MS = 8000;

/**
 * Si settings/finance nunca marcan ready (AsyncStorage colgado),
 * abrimos igual para no dejar la pantalla negra.
 */
export default function IndexGate() {
  const { ready } = useFinance();
  const { colors, ready: settingsReady } = useSettings();
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setForceOpen(true), BOOT_FAIL_OPEN_MS);
    return () => clearTimeout(t);
  }, []);

  if ((!settingsReady || !ready) && !forceOpen) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
          gap: 12,
        }}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ color: colors.textDim, fontSize: 13 }}>Abriendo…</Text>
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}
