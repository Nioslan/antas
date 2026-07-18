import { LinearGradient } from 'expo-linear-gradient';
import { Text, View, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

/** Pantalla de prueba: si ves esto, la app carga bien */
export function BootBanner() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.text}>Finanzas · OK</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 999,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 11,
  },
});
