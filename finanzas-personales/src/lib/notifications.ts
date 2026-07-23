import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';
import type { FixedExpense } from '../types/fixed';
import { formatMoney, todayKey } from './categories';
import { daysUntil, dueDateInMonth, reminderDate } from './fixedExpenses';

const CHANNEL_ID = 'fixed-bills';
const UPDATE_CHANNEL_ID = 'app-updates';
const DIGEST_KEY = 'finanzas_last_due_digest';
/** Patrón fuerte: vibra – pausa – vibra – pausa – vibra larga */
const VIBRATE_PATTERN = [0, 400, 200, 400, 200, 700];
const UPDATE_VIBRATE = [0, 250, 150, 250];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  const asked = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
    android: {},
  });
  return (
    asked.granted ||
    asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Gastos fijos',
    description: 'Avisos de pagos fijos por vencer o vencidos',
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: VIBRATE_PATTERN,
    showBadge: true,
    lightColor: '#E24B3C',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: 'default',
  });
}

async function ensureUpdateChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(UPDATE_CHANNEL_ID, {
    name: 'Actualizaciones de la app',
    description: 'Avisos cuando hay una versión nueva lista para instalar',
    importance: Notifications.AndroidImportance.DEFAULT,
    enableVibrate: true,
    vibrationPattern: UPDATE_VIBRATE,
    showBadge: false,
    lightColor: '#3DDC97',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: 'default',
  });
}

/** Aviso local: hay una actualización lista; el usuario decide cuándo instalar. */
export async function notifyAppUpdateReady(): Promise<void> {
  try {
    const ok = await ensureNotificationPermissions();
    if (!ok) return;
    await ensureUpdateChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Actualización lista',
        body: 'Hay una versión nueva de Finanzas. Abrí la app y tocá “Actualizar ahora” cuando quieras. Tus datos no se borran.',
        data: { kind: 'app-update' },
        sound: true,
        ...(Platform.OS === 'android'
          ? { channelId: UPDATE_CHANNEL_ID, color: '#3DDC97' }
          : {}),
      },
      trigger: null,
    });
  } catch {
    // ignore
  }
}

function parseLocalDate(iso: string, hour = 9, minute = 0): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

function isStillUnpaid(bill: FixedExpense, dueIso: string): boolean {
  if (!bill.lastPaidDate) return true;
  return bill.lastPaidDate < dueIso;
}

function nextDueFrom(dueDay: number, fromIso: string): string {
  const [y, m, d] = fromIso.split('-').map(Number);
  const thisMonth = dueDateInMonth(dueDay, y, m - 1);
  const dueDayNum = Number(thisMonth.slice(8, 10));
  if (d <= dueDayNum) return thisMonth;
  const nextMonth = new Date(y, m, 1);
  return dueDateInMonth(
    dueDay,
    nextMonth.getFullYear(),
    nextMonth.getMonth()
  );
}

/** Lista de fijos pendientes en la ventana de avisos (incluye hoy y vencidos recientes). */
export function listDueSoonBills(
  fixed: FixedExpense[],
  fromIso = todayKey(),
  windowDays = 5
): Array<{ bill: FixedExpense; due: string; days: number }> {
  return fixed
    .filter((bill) => bill.enabled)
    .map((bill) => {
      const due = nextDueFrom(bill.dueDay, fromIso);
      const days = daysUntil(due, fromIso);
      return { bill, due, days };
    })
    .filter(({ bill, due, days }) => {
      if (days < 0 || days > windowDays) return false;
      return isStillUnpaid(bill, due);
    })
    .sort((a, b) => a.days - b.days);
}

/** Cuenta fijos pendientes en los próximos 5 días (incluye hoy) para el badge rojo. */
export function countUpcomingBills(
  fixed: FixedExpense[],
  fromIso = todayKey()
): number {
  return listDueSoonBills(fixed, fromIso, 5).length;
}

/** Actualiza el numerito rojo del icono de la app. */
export async function refreshAppBadge(fixed: FixedExpense[]): Promise<void> {
  try {
    const count = countUpcomingBills(fixed);
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Algunos launchers Android no soportan badge
  }
}

/** Vibra el teléfono (útil al mostrar avisos en la app). */
export function vibrateForBillAlert(): void {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(VIBRATE_PATTERN);
    } else {
      Vibration.vibrate([400, 200, 400]);
    }
  } catch {
    // sin vibrador / permiso
  }
}

type ReminderKind = 'before5' | 'before3' | 'before1' | 'due' | 'dueEvening';

function titleBody(
  bill: FixedExpense,
  due: string,
  kind: ReminderKind
): { title: string; body: string } {
  const money = formatMoney(bill.amount);
  switch (kind) {
    case 'before5':
      return {
        title: `Pago cerca: ${bill.name}`,
        body: `En 5 días vence ${bill.name} (${money}). Fecha: ${due}.`,
      };
    case 'before3':
      return {
        title: `Quedan 3 días: ${bill.name}`,
        body: `En 3 días tenés que pagar ${bill.name} (${money}). Fecha: ${due}.`,
      };
    case 'before1':
      return {
        title: `Mañana vence: ${bill.name}`,
        body: `Mañana pagás ${bill.name} (${money}). Prepará el dinero.`,
      };
    case 'due':
      return {
        title: `Hoy vence: ${bill.name}`,
        body: `Hoy es el día de pagar ${bill.name} (${money}). Abrí la app y tocá Pagar.`,
      };
    case 'dueEvening':
      return {
        title: `¿Ya pagaste ${bill.name}?`,
        body: `Hoy vence ${bill.name} (${money}) y todavía no lo marcaste como pagado.`,
      };
  }
}

async function scheduleOne(
  bill: FixedExpense,
  due: string,
  whenIso: string,
  kind: ReminderKind,
  hour: number
): Promise<boolean> {
  const when = parseLocalDate(whenIso, hour, 0);
  if (when.getTime() <= Date.now()) return false;
  if (!isStillUnpaid(bill, due)) return false;

  const { title, body } = titleBody(bill, due, kind);

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { fixedId: bill.id, due, kind },
      badge: 1,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: VIBRATE_PATTERN,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID, color: '#E24B3C' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
  });
  return true;
}

/** Apaga todos los avisos programados y limpia el badge. */
export async function cancelFixedReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // ignore
  }
}

/**
 * Programa avisos 5 / 3 / 1 día antes, el día a la mañana y a la tarde
 * (próximos 3 meses) + actualiza el badge del icono.
 */
export async function scheduleFixedReminders(
  fixed: FixedExpense[]
): Promise<void> {
  const ok = await ensureNotificationPermissions();
  if (!ok) {
    await refreshAppBadge([]);
    return;
  }

  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const enabled = fixed.filter((f) => f.enabled);
  const base = new Date();

  for (const bill of enabled) {
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const cursor = new Date(
        base.getFullYear(),
        base.getMonth() + monthOffset,
        1
      );
      const due = dueDateInMonth(
        bill.dueDay,
        cursor.getFullYear(),
        cursor.getMonth()
      );
      const fiveBefore = reminderDate(due, 5);
      const threeBefore = reminderDate(due, 3);
      const oneBefore = reminderDate(due, 1);

      await scheduleOne(bill, due, fiveBefore, 'before5', 9);
      await scheduleOne(bill, due, threeBefore, 'before3', 9);
      await scheduleOne(bill, due, oneBefore, 'before1', 9);
      await scheduleOne(bill, due, due, 'due', 8);
      await scheduleOne(bill, due, due, 'dueEvening', 18);
    }
  }

  await refreshAppBadge(enabled);
}

/**
 * Manda ya una notificación del sistema (afuera de la app) con los fijos
 * que vencen pronto. Vibra el teléfono. Máximo una vez por día automática.
 */
export async function notifyDueBillsNow(
  fixed: FixedExpense[],
  options?: { force?: boolean }
): Promise<{ sent: boolean; count: number }> {
  const dueSoon = listDueSoonBills(fixed, todayKey(), 5);
  if (dueSoon.length === 0) {
    await refreshAppBadge(fixed);
    return { sent: false, count: 0 };
  }

  const today = todayKey();
  if (!options?.force) {
    try {
      const last = await AsyncStorage.getItem(DIGEST_KEY);
      if (last === today) {
        await refreshAppBadge(fixed);
        return { sent: false, count: dueSoon.length };
      }
    } catch {
      // seguir
    }
  }

  const ok = await ensureNotificationPermissions();
  if (!ok) return { sent: false, count: dueSoon.length };

  await ensureAndroidChannel();

  const names = dueSoon
    .slice(0, 4)
    .map(({ bill, days }) => {
      const when =
        days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`;
      return `${bill.name} (${when})`;
    })
    .join(', ');
  const more =
    dueSoon.length > 4 ? ` y ${dueSoon.length - 4} más` : '';
  const title =
    dueSoon.some((d) => d.days === 0)
      ? `Tenés ${dueSoon.length} pago${dueSoon.length === 1 ? '' : 's'} por hacer`
      : `Pagos fijos cerca (${dueSoon.length})`;
  const body = `${names}${more}. Abrí Fijos y tocá Pagar.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { kind: 'digest', count: dueSoon.length },
      badge: dueSoon.length,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: VIBRATE_PATTERN,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID, color: '#E24B3C' } : {}),
    },
    trigger: null,
  });

  vibrateForBillAlert();
  await refreshAppBadge(fixed);

  try {
    await AsyncStorage.setItem(DIGEST_KEY, today);
  } catch {
    // ignore
  }

  return { sent: true, count: dueSoon.length };
}

/** Notificación de prueba inmediata + vibración (para que el usuario verifique). */
export async function sendTestBillNotification(): Promise<boolean> {
  const ok = await ensureNotificationPermissions();
  if (!ok) return false;
  await ensureAndroidChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Aviso de gastos fijos activo',
      body: 'Así te va a avisar cuando tengas que pagar un fijo. El teléfono también vibra.',
      data: { kind: 'test' },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: VIBRATE_PATTERN,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID, color: '#E24B3C' } : {}),
    },
    trigger: null,
  });
  vibrateForBillAlert();
  return true;
}
