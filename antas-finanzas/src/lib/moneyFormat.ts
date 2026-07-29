import type { AppCurrency, AppLanguage } from '../i18n';

let activeCurrency: AppCurrency = 'USD';
let activeLocale = 'es-US';

export function configureMoneyFormat(
  currency: AppCurrency,
  language: AppLanguage
): void {
  activeCurrency = currency;
  activeLocale = language === 'en' ? 'en-US' : 'es-US';
}

export function getActiveCurrency(): AppCurrency {
  return activeCurrency;
}

export function formatMoneyAmount(amount: number, currency?: string): string {
  return new Intl.NumberFormat(activeLocale, {
    style: 'currency',
    currency: currency ?? activeCurrency,
    maximumFractionDigits: 2,
  }).format(amount);
}
