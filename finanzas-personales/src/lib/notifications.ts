import { Platform } from 'react-native';
import type { FixedExpense } from '../types/fixed';
import {
  countUpcomingBills,
  listDueSoonBills,
  vibrateForBillAlert,
} from './fixedBills';

export { countUpcomingBills, listDueSoonBills, vibrateForBillAlert };

/**
 * 1.9.0: stubs sin expo-notifications.
 * Evita crash nativo al abrir. Los avisos quedan en la app (Fijos + vibración).
 */

export async function ensureNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function notifyAppUpdateReady(): Promise<void> {
  // no-op
}

export async function refreshAppBadge(_fixed: FixedExpense[]): Promise<void> {
  // no-op
}

export async function cancelFixedReminders(): Promise<void> {
  // no-op
}

export async function scheduleFixedReminders(
  _fixed: FixedExpense[]
): Promise<void> {
  // no-op
}

export async function notifyDueBillsNow(
  fixed: FixedExpense[],
  _options?: { force?: boolean }
): Promise<{ sent: boolean; count: number }> {
  const dueSoon = listDueSoonBills(fixed);
  if (dueSoon.length > 0) {
    vibrateForBillAlert();
  }
  return { sent: false, count: dueSoon.length };
}

export async function scheduleWeeklyReportNotification(
  _body: string
): Promise<boolean> {
  return false;
}

export async function notifyWeeklyReportNow(
  _title: string,
  _body: string
): Promise<boolean> {
  return false;
}

export async function sendTestBillNotification(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  vibrateForBillAlert();
  return true;
}
