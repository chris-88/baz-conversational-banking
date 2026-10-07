import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * First letter up, the rest as written.
 *
 * Tailwind's `capitalize` title-cases every word, so "costs nothing" becomes a proper noun and
 * "very high" becomes a brand. These are phrases, not labels. (`first-letter:uppercase` does
 * nothing on a badge, which is the other thing that looked like it would work.)
 */
export function sentence(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
