import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useSettings } from '../src/context/SettingsContext';

/**
 * Primera pantalla al abrir la app: sin sesión → login obligatorio.
 */
export default function IndexGate() {
  const { user, loading } = useAuth();
  const { colors } = useSettings();

  if (loading) {
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

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
