import type { Task } from "../../lib/supabaseApi";

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  start_time: string; // ISO 8601 timestamptz
  end_time: string; // ISO 8601 timestamptz
  color: string; // hex color from COLOR_PRESETS
  created_at?: string;
};

export type CalendarItemData =
  | { type: "task"; data: Task }
  | { type: "event"; data: CalendarEvent };

export const COLOR_PRESETS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
] as const;

export type ColorPreset = (typeof COLOR_PRESETS)[number];

/**
 * Returns the next color from the preset palette based on a count,
 * cycling sequentially through the available colors.
 */
export function getNextColor(count: number): ColorPreset {
  return COLOR_PRESETS[count % COLOR_PRESETS.length];
}

/**
 * Truncates a label string to the specified max length (default 20).
 * If the string exceeds max, returns the first `max` characters followed by "…".
 */
export function truncateLabel(text: string, max: number = 20): string {
  if (text.length <= max) {
    return text;
  }
  return text.slice(0, max) + "\u2026";
}

/**
 * Formats a Date object into Indonesian locale month and year string.
 * Example: "Juni 2025"
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}
