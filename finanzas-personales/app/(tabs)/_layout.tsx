import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../src/context/FinanceContext';
import { useSettings } from '../../src/context/SettingsContext';
import { countUpcomingBills } from '../../src/lib/notifications';

export default function TabsLayout() {
  const { colors } = useSettings();
  const { state, ready } = useFinance();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const dueBadge = useMemo(() => {
    if (!ready) return undefined;
    const n = countUpcomingBills(state.fixedExpenses);
    return n > 0 ? n : undefined;
  }, [ready, state.fixedExpenses]);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardOpen(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOpen(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: keyboardOpen
          ? { display: 'none' }
          : {
              backgroundColor: colors.bgElevated,
              borderTopColor: colors.border,
              height: 64,
              paddingBottom: 8,
              paddingTop: 8,
            },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ahora"
        options={{
          title: 'Ahora',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Movimientos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fixed"
        options={{
          title: 'Fijos',
          tabBarBadge: dueBadge,
          tabBarBadgeStyle: {
            backgroundColor: colors.expense,
            color: '#fff',
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Metas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flag-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
