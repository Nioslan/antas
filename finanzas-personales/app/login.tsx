import { Redirect } from 'expo-router';

/** La cuenta / nube quedó desactivada; redirige a la app. */
export default function LoginScreen() {
  return <Redirect href="/(tabs)" />;
}
