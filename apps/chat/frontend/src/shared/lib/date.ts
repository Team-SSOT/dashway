import {
  format,
  formatDistanceToNowStrict,
  isSameDay as dfnsSameDay,
  isToday,
  isYesterday,
  isSameYear,
  type Locale,
} from 'date-fns'
import { enUS } from 'date-fns/locale'

let currentLocale: Locale = enUS

export function setDateLocale(locale: Locale): void {
  currentLocale = locale
}

export function getDateLocale(): Locale {
  return currentLocale
}

export function formatDateDivider(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  if (isSameYear(d, new Date())) return format(d, 'EEEE, MMMM d', { locale: currentLocale })
  return format(d, 'MMMM d, yyyy', { locale: currentLocale })
}

export function formatMessageTimestamp(iso: string): string {
  return format(new Date(iso), 'HH:mm', { locale: currentLocale })
}

export function formatRelativeTime(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true, locale: currentLocale })
}

export function isSameDay(a: string, b: string): boolean {
  return dfnsSameDay(new Date(a), new Date(b))
}
