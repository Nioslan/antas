import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function ensureApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase no está configurado. Completá src/lib/firebaseConfig.ts (ver FIREBASE_SETUP.md).',
    );
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

/**
 * Metro resuelve el build react-native de firebase/auth, que exporta
 * getReactNativePersistence. En tipados web/node no aparece.
 */
function getNativePersistence(): Persistence | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const authMod = require('firebase/auth') as {
      getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
    };
    if (typeof authMod.getReactNativePersistence === 'function') {
      return authMod.getReactNativePersistence(AsyncStorage);
    }
  } catch {
    // fallback a getAuth sin persistence explícita
  }
  return null;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const firebaseApp = ensureApp();

  if (Platform.OS === 'web') {
    auth = getAuth(firebaseApp);
    return auth;
  }

  const persistence = getNativePersistence();
  try {
    auth = persistence
      ? initializeAuth(firebaseApp, { persistence })
      : getAuth(firebaseApp);
  } catch {
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (db) return db;
  db = getFirestore(ensureApp());
  return db;
}

export { isFirebaseConfigured };
