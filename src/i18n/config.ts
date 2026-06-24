import { createSharedPathnamesNavigation } from 'next-intl/navigation'
import { createSharedPathnamesNames } from 'next-intl/navigation'

export const locales = ['ar', 'en', 'fr', 'es'] as const
export type Locale = typeof locales[number]
export const defaultLocale: Locale = 'ar'

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
  es: 'Español',
}

export const localeFlags: Record<Locale, string> = {
  ar: '🇸🇦',
  en: '🇬🇧',
  fr: '🇫🇷',
  es: '🇪🇸',
}

export const localeDirs: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
  fr: 'ltr',
  es: 'ltr',
}

export const pathnames = {
  '/': '/',
  '/search': '/search',
  '/bookmarks': '/bookmarks',
  '/category/[slug]': '/category/[slug]',
  '/article/[slug]': '/article/[slug]',
} as const

export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation({
  locales,
  pathnames: pathnames as any,
})
