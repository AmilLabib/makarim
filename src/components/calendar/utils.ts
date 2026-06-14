import type { CalendarEvent, CalendarItemData } from "./types";

export interface DayCellData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Generates a 42-cell calendar grid (6 weeks × 7 days) for a given month.
 * Week starts on Monday (Senin) through Sunday (Minggu).
 */
export function generateCalendarGrid(year: number, month: number): DayCellData[] {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const firstDayOfMonth = new Date(year, month, 1);
  // getDay() returns 0 (Sun) - 6 (Sat). Convert to Mon=0 ... Sun=6.
  const dayOfWeek = firstDayOfMonth.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Start from the Monday before (or on) the first day of the month
  const gridStart = new Date(year, month, 1 - mondayOffset);

  const cells: DayCellData[] = [];

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const isCurrentMonth = cellDate.getMonth() === month && cellDate.getFullYear() === year;
    const isToday =
      cellDate.getFullYear() === todayYear &&
      cellDate.getMonth() === todayMonth &&
      cellDate.getDate() === todayDate;

    cells.push({ date: cellDate, isCurrentMonth, isToday });
  }

  return cells;
}

/**
 * Sorts calendar items by time ascending.
 * Tasks use due_date, events use start_time.
 * Tasks come before events when times are equal.
 */
export function sortCalendarItems(items: CalendarItemData[]): CalendarItemData[] {
  return [...items].sort((a, b) => {
    const timeA = getItemTime(a);
    const timeB = getItemTime(b);

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // Tasks before events on tie
    if (a.type === "task" && b.type === "event") return -1;
    if (a.type === "event" && b.type === "task") return 1;
    return 0;
  });
}

function getItemTime(item: CalendarItemData): number {
  if (item.type === "task") {
    return item.data.due_date ? new Date(item.data.due_date).getTime() : 0;
  }
  return new Date(item.data.start_time).getTime();
}

/**
 * Returns visible items and overflow count for a day cell.
 * Max 3 visible items; rest are counted as overflow.
 */
export function getVisibleItems(items: CalendarItemData[]): {
  visible: CalendarItemData[];
  overflowCount: number;
} {
  if (items.length <= 3) {
    return { visible: items, overflowCount: 0 };
  }
  return { visible: items.slice(0, 3), overflowCount: items.length - 3 };
}

/**
 * Filters events whose time range overlaps with the given month's boundaries.
 * Month boundaries: first day 00:00:00 to last day 23:59:59.
 */
export function filterEventsByMonth(
  events: CalendarEvent[],
  year: number,
  month: number,
): CalendarEvent[] {
  const monthStart = new Date(year, month, 1, 0, 0, 0).getTime();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = new Date(year, month, lastDay, 23, 59, 59).getTime();

  return events.filter((event) => {
    const eventStart = new Date(event.start_time).getTime();
    const eventEnd = new Date(event.end_time).getTime();

    // Event overlaps month if it starts before month ends AND ends after month starts
    return eventStart <= monthEnd && eventEnd >= monthStart;
  });
}

export interface EventFormData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}

export interface EventFormErrors {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
}

export interface EventFormValidationResult {
  valid: boolean;
  errors: EventFormErrors;
}

/**
 * Validates event form data.
 * Returns validation result with error messages in Indonesian.
 */
export function validateEventForm(data: EventFormData): EventFormValidationResult {
  const errors: EventFormErrors = {};

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.title = "Judul event wajib diisi";
  } else if (data.title.length > 100) {
    errors.title = "Judul maksimal 100 karakter";
  }

  // Description validation
  if (data.description && data.description.length > 500) {
    errors.description = "Deskripsi maksimal 500 karakter";
  }

  // Start time validation
  if (!data.start_time) {
    errors.start_time = "Waktu mulai wajib diisi";
  }

  // End time validation
  if (!data.end_time) {
    errors.end_time = "Waktu selesai wajib diisi";
  }

  // End time must be after start time (only if both are provided)
  if (data.start_time && data.end_time && data.end_time <= data.start_time) {
    errors.end_time = "Waktu selesai harus setelah waktu mulai";
  }

  const valid = Object.keys(errors).length === 0;
  return { valid, errors };
}

/**
 * Returns a new Date with month + 1, handling year rollover.
 */
export function nextMonth(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (month === 11) {
    return new Date(year + 1, 0, 1);
  }
  return new Date(year, month + 1, 1);
}

/**
 * Returns a new Date with month - 1, handling year rollover.
 */
export function prevMonth(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (month === 0) {
    return new Date(year - 1, 11, 1);
  }
  return new Date(year, month - 1, 1);
}
