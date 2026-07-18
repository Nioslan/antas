import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { FixedExpense } from '../types/fixed';
import { formatMoney, todayKey } from './categories';
import { daysUntil, dueDateInMonth, reminderDate } from './fixedExpenses';

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
  });
  return (
    asked.granted ||
    asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

function parseLocalDate(iso: string, hour = 9, minute = 0): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

function isStillUnpaid(bill: FixedExpense, dueIso: string): boolean {
  if (!bill.lastPaidDate) return true;
  // Si ya pagó en esa fecha o después (misma fecha de vencimiento), no avisar
  return bill.lastPaidDate < dueIso;
}

/** Cuenta fijos pendientes en los próximos 5 días (incluye hoy) para el badge rojo. */
export function countUpcomingBills(fixed: FixedExpense[], fromIso = todayKey()): number {
  return fixed.filter((bill) => {
    if (!bill.enabled) return false;
    const due = nextDueFrom(bill.dueDay, fromIso);
    const days = daysUntil(due, fromIso);
    if (days < 0 || days > 5) return false;
    return isStillUnpaid(bill, due);
  }).length;
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

/** Actualiza el numerito rojo del icono de la app. */
export async function refreshAppBadge(fixed: FixedExpense[]): Promise<void> {
  try {
    const count = countUpcomingBills(fixed);
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Algunos launchers Android no soportan badge
  }
}

type ReminderKind = 'before' | 'due';

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

  const title =
    kind === 'due' ? `Hoy vence: ${bill.name}` : `Pago cerca: ${bill.name}`;
  const body =
    kind === 'due'
      ? `Hoy es el día de pagar ${bill.name} (${formatMoney(bill.amount)}).`
      : `En 5 días vence ${bill.name} (${formatMoney(bill.amount)}). Fecha: ${due}.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { fixedId: bill.id, due, kind },
      badge: 1,
      sound: true,
      ...(Platform.OS === 'android'
        ? { channelId: 'fixed-bills', color: '#E24B3C' }
        : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      ...(Platform.OS === 'android' ? { channelId: 'fixed-bills' } : {}),
    },
  });
  return true;
}

/**
 * Programa avisos 5 días antes y el mismo día de cada gasto fijo
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

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('fixed-bills', {
      name: 'Gastos fijos',
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      showBadge: true,
      lightColor: '#E24B3C',
    });
  }

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

      // 5 días antes · 9:00
      await scheduleOne(bill, due, fiveBefore, 'before', 9);
      // Mismo día · 8:00
      await scheduleOne(bill, due, due, 'due', 8);
    }
  }

  await refreshAppBadge(enabled);
}
