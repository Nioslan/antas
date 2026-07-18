# Finanzas Personales

App Expo (React Native) para movimientos, metas, fijos y efectivo, con **cuenta Firebase** y sync a Firestore.

## Arranque

```bash
cd finanzas-personales
npm install
npx expo start --web
```

Preview local: http://localhost:8081

## Cuenta en la nube

1. Seguí [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. Pegá el `firebaseConfig` en `src/lib/firebaseConfig.ts` (o `.env` desde `.env.example`)
3. En la app: **Ajustes → Cuenta → Iniciar sesión**

Sin Firebase configurado la app sigue funcionando offline con AsyncStorage.

## Sync

- Documento: `users/{uid}`
- Campos: `transactions`, `goals`, `fixedExpenses`, `cashNow`, `chatMessages`, `updatedAt`
- Offline-first + debounce al guardar; merge por `updatedAt` al login / “Sincronizar ahora”
