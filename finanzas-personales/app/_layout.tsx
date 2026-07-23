import 'react-native-gesture-handler';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UpdateBootstrap } from '../src/components/UpdateBootstrap';
import { AuthProvider } from '../src/context/AuthContext';
import { FinanceProvider } from '../src/context/FinanceContext';
import { SettingsProvider, useSettings } from '../src/context/SettingsContext';

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('RootErrorBoundary', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#0B1F1A',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            gap: 12,
          }}>
          <Text style={{ color: '#F2F7F4', fontSize: 18, fontWeight: '700' }}>
            Algo falló al abrir la app
          </Text>
          <Text style={{ color: '#9BB5AB', textAlign: 'center' }}>
            {this.state.error.message}
          </Text>
          <Pressable
            onPress={() => this.setState({ error: null })}
            style={{
              marginTop: 8,
              backgroundColor: '#3DDC97',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
            }}>
            <Text style={{ color: '#0B1F1A', fontWeight: '700' }}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootNavigator() {
  const { colors, isDark } = useSettings();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="add-transaction"
          options={{
            presentation: 'card',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="add-goal"
          options={{
            presentation: 'card',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="add-fixed"
          options={{
            presentation: 'card',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="transaction/[id]"
          options={{ presentation: 'card', headerShown: false }}
        />
        <Stack.Screen
          name="manage-categories"
          options={{
            presentation: 'card',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'card',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootErrorBoundary>
        <UpdateBootstrap>
          <SettingsProvider>
            <AuthProvider>
              <FinanceProvider>
                <RootNavigator />
              </FinanceProvider>
            </AuthProvider>
          </SettingsProvider>
        </UpdateBootstrap>
      </RootErrorBoundary>
    </SafeAreaProvider>
  );
}
