import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { getGuestAccess } from '../src/lib/guestAccess';
import { useSettings } from '../src/context/SettingsContext';

/**
 * Primera pantalla al abrir la app:
 * - sin sesión y sin modo invitado → login
 * - con sesión o "seguir sin cuenta" → tabs
 */
export default function IndexGate() {
  const { user, loading } = useAuth();
  const { colors } = useSettings();
  const [guest, setGuest] = useState<boolean | null>(null);

  useEffect(() => {
    getGuestAccess().then(setGuest);
  }, []);

  if (loading || guest === null) {
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

  if (user || guest) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
