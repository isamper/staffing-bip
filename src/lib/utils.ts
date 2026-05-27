import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Derive the canonical @bip-group.com email from a display name.
 * Takes first word + last word, strips accents, lowercases.
 * e.g. "Maria Camila Coronado" → "maria.coronado@bip-group.com"
 */
export function nameToEmail(name: string): string {
  const parts = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(' ')
    .filter(Boolean)
  return `${parts[0]}.${parts[parts.length - 1]}@bip-group.com`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  // Append T00:00:00 so the date-only string is parsed as local midnight,
  // not UTC midnight (which shifts the displayed day back by 1 in negative-offset timezones).
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr + 'T00:00:00' : dateStr
  return new Date(normalized).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isAvailableNow(availableFrom: string | null): boolean {
  if (!availableFrom) return true
  return new Date(availableFrom) <= new Date()
}

export function daysUntilAvailable(availableFrom: string | null): number {
  if (!availableFrom) return 0
  const diff = new Date(availableFrom).getTime() - new Date().getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
