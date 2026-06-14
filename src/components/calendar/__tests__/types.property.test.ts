import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatMonthYear, truncateLabel, getNextColor, COLOR_PRESETS } from "../types";

/**
 * Property 3: Indonesian locale month/year formatting
 *
 * For any valid Date object, the month/year formatting function SHALL produce
 * a string containing a valid Indonesian month name (Januari, Februari, ..., Desember)
 * followed by a space and a 4-digit year.
 *
 * **Validates: Requirements 1.2**
 */
describe("Feature: calendar, Property 3: Indonesian locale month/year formatting", () => {
  const INDONESIAN_MONTHS = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  it("should produce a valid Indonesian month name followed by a space and 4-digit year for any date", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1970, max: 2100 }),
        (month, year) => {
          const date = new Date(year, month, 15);
          const result = formatMonthYear(date);

          const parts = result.split(" ");
          expect(parts.length).toBe(2);

          const [monthName, yearStr] = parts;

          expect(INDONESIAN_MONTHS).toContain(monthName);
          expect(yearStr).toMatch(/^\d{4}$/);
          expect(parseInt(yearStr, 10)).toBe(date.getFullYear());
          expect(monthName).toBe(INDONESIAN_MONTHS[date.getMonth()]);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Label truncation
 *
 * For any string, the truncation function SHALL:
 * (a) return the original string unchanged if its length is ≤ 20 characters,
 * (b) return the first 20 characters followed by "…" if its length exceeds 20 characters.
 * The output length SHALL never exceed 21 characters.
 *
 * **Validates: Requirements 2.2**
 */
describe("Feature: calendar, Property 5: Label truncation", () => {
  it("should never produce output longer than 21 characters", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        (text) => {
          const result = truncateLabel(text);
          expect(result.length).toBeLessThanOrEqual(21);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return strings ≤ 20 chars unchanged", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 20 }),
        (text) => {
          const result = truncateLabel(text);
          expect(result).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should truncate strings > 20 chars to first 20 chars + '…' suffix", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 21, maxLength: 200 }),
        (text) => {
          const result = truncateLabel(text);
          expect(result).toBe(text.slice(0, 20) + "\u2026");
          expect(result.length).toBe(21);
        }
      ),
      { numRuns: 100 }
    );
  });
});
