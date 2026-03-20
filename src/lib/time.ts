import { format, parseISO } from "date-fns";

/**
 * Format a date string to local time display
 */
export function formatLocalDateTime(isoString: string): string {
  return format(parseISO(isoString), "MMM d, yyyy h:mm a");
}

export function formatLocalTime(isoString: string): string {
  return format(parseISO(isoString), "h:mm a");
}

export function formatLocalDate(isoString: string): string {
  return format(parseISO(isoString), "MMM d, yyyy");
}

/**
 * Get local date string (YYYY-MM-DD) without UTC shift
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get local day bounds as UTC ISO strings for DB queries
 */
export function getLocalDayBoundsUTC(date: Date): { start: string; end: string } {
  const localStart = new Date(date);
  localStart.setHours(0, 0, 0, 0);
  const localEnd = new Date(date);
  localEnd.setHours(23, 59, 59, 999);
  return {
    start: localStart.toISOString(),
    end: localEnd.toISOString(),
  };
}
