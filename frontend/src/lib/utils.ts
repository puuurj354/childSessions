import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert Go time.Time to JavaScript Date
 * Go time.Time can be a string in RFC3339 format or a number (Unix timestamp)
 */
export function toDate(goTime: any): Date {
  if (!goTime) return new Date();
  
  // If it's already a Date object, return it
  if (goTime instanceof Date) {
    return goTime;
  }
  
  // If it's a string (RFC3339 format from Go), parse it
  if (typeof goTime === 'string') {
    return new Date(goTime);
  }
  
  // If it's a number (Unix timestamp), convert it
  if (typeof goTime === 'number') {
    return new Date(goTime * 1000);
  }
  
  // Otherwise return current date
  return new Date();
}

/**
 * Format date as YYYY-MM-DD for input type="date"
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date as Indonesian locale string
 */
export function formatDateIndonesian(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
