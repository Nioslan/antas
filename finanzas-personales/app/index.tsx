import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useFinance } from '../src/context/FinanceContext';
import { useSettings } from '../src/context/SettingsContext';

/** Abre directo la app: los datos se guardan en el teléfono. */
export default function IndexGate() {
  const { ready } = useFinance();
  const { colors, ready: settingsReady } = useSettings();

  if (!settingsReady || !ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}
