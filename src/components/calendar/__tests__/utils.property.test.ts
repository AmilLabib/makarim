import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  generateCalendarGrid,
  sortCalendarItems,
  getVisibleItems,
  filterEventsByMonth,
  validateEventForm,
  nextMonth,
  prevMonth,
} from "../utils";
import type { CalendarItemData, CalendarEvent } from "../types";
import { getNextColor, COLOR_PRESETS, truncateLabel } from "../types";
import type { Task } from "../../../lib/supabaseApi";

/**
 * Property 1: Calendar grid generation produces correct structure
 * Validates: Requirements 1.1, 1.6
 */
describe("Feature: calendar, Property 1: Calendar grid generation produces correct structure", () => {
  const yearArb = fc.integer({ min: 1970, max: 2100 });
  const monthArb = fc.integer({ min: 0, max: 11 });

  it("always produces exactly 42 cells", () => {
    fc.assert(
      fc.property(yearArb, monthArb, (year, month) => {
        const grid = generateCalendarGrid(year, month);
        expect(grid).toHaveLength(42);
      }),
      { numRuns: 100 }
    );
  });

  it("first cell is always a Monday (getDay() === 1)", () => {
    fc.assert(
      fc.property(yearArb, monthArb, (year, month) => {
        const grid = generateCalendarGrid(year, month);
        expect(grid[0].date.getDay()).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it("all days of the target month appear exactly once", () => {
    fc.assert(
      fc.property(yearArb, monthArb, (year, month) => {
        const grid = generateCalendarGrid(year, month);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const currentMonthCells = grid.filter((cell) => cell.isCurrentMonth);
        expect(currentMonthCells).toHaveLength(daysInMonth);

        const dayNumbers = currentMonthCells.map((cell) => cell.date.getDate());
        const expectedDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        expect(dayNumbers.sort((a, b) => a - b)).toEqual(expectedDays);
      }),
      { numRuns: 100 }
    );
  });

  it("isCurrentMonth is true only for cells in the target month/year", () => {
    fc.assert(
      fc.property(yearArb, monthArb, (year, month) => {
        const grid = generateCalendarGrid(year, month);

        for (const cell of grid) {
          if (cell.isCurrentMonth) {
            expect(cell.date.getMonth()).toBe(month);
            expect(cell.date.getFullYear()).toBe(year);
          } else {
            const isAdjacentMonth =
              cell.date.getMonth() !== month || cell.date.getFullYear() !== year;
            expect(isAdjacentMonth).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("cells are in chronological order", () => {
    fc.assert(
      fc.property(yearArb, monthArb, (year, month) => {
        const grid = generateCalendarGrid(year, month);

        for (let i = 1; i < grid.length; i++) {
          const prev = grid[i - 1].date.getTime();
          const curr = grid[i].date.getTime();
          expect(curr).toBeGreaterThan(prev);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Month navigation round-trip
 * Validates: Requirements 1.3, 1.4
 */
describe("Feature: calendar, Property 2: Month navigation round-trip", () => {
  const yearArb = fc.integer({ min: 1970, max: 2100 });
  const monthArb = fc.integer({ min: 0, max: 11 });

  it("nextMonth then prevMonth returns original month and year", () => {
    fc.assert(
      fc.property(yearArb, monthArb, (year, month) => {
        const start = new Date(year, month, 1);
        const result = prevMonth(nextMonth(start));
        expect(result.getFullYear()).toBe(start.getFullYear());
        expect(result.getMonth()).toBe(start.getMonth());
      }),
      { numRuns: 100 }
    );
  });

  it("prevMonth then nextMonth returns original month and year", () => {
    fc.assert(
      fc.property(yearArb, monthArb, (year, month) => {
        const start = new Date(year, month, 1);
        const result = nextMonth(prevMonth(start));
        expect(result.getFullYear()).toBe(start.getFullYear());
        expect(result.getMonth()).toBe(start.getMonth());
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Task placement by due_date
 * Validates: Requirements 2.1
 */
describe("Feature: calendar, Property 4: Task placement by due_date", () => {
  const yearArb = fc.integer({ min: 1970, max: 2100 });
  const monthArb = fc.integer({ min: 0, max: 11 });

  function taskWithDueDateArb(year: number, month: number) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return fc.record({
      id: fc.uuid(),
      label: fc.string({ minLength: 1, maxLength: 50 }),
      completed: fc.boolean(),
      description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
      due_date: fc.integer({ min: 1, max: daysInMonth }).map(
        (day) =>
          `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      ),
      created_at: fc.constant(new Date().toISOString()),
    });
  }

  const taskWithNullDueDateArb = fc.record({
    id: fc.uuid(),
    label: fc.string({ minLength: 1, maxLength: 50 }),
    completed: fc.boolean(),
    description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    due_date: fc.constant(null as string | null),
    created_at: fc.constant(new Date().toISOString()),
  });

  it("only tasks with non-null due_date are placed on the calendar grid", () => {
    fc.assert(
      fc.property(yearArb, monthArb, (year, month) => {
        const tasksWithDate = fc.sample(taskWithDueDateArb(year, month), { numRuns: 5 });
        const tasksWithNull = fc.sample(taskWithNullDueDateArb, { numRuns: 3 });
        const allTasks: Task[] = [...tasksWithDate, ...tasksWithNull];

        const grid = generateCalendarGrid(year, month);
        const placedTasks = allTasks.filter(
          (task): task is Task & { due_date: string } => task.due_date != null
        );

        expect(placedTasks.length).toBe(tasksWithDate.length);

        for (const task of placedTasks) {
          const taskDate = new Date(task.due_date);
          const matchingCell = grid.find(
            (cell) =>
              cell.date.getFullYear() === taskDate.getFullYear() &&
              cell.date.getMonth() === taskDate.getMonth() &&
              cell.date.getDate() === taskDate.getDate()
          );
          expect(matchingCell).toBeDefined();
          expect(matchingCell!.isCurrentMonth).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: Event form validation
 * Validates: Requirements 3.2, 3.3, 3.5, 3.6, 4.3
 */
describe("Feature: calendar, Property 6: Event form validation", () => {
  it("accepts title only when 1-100 chars", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (title) => {
          const result = validateEventForm({
            title,
            start_time: "2025-06-01T10:00:00Z",
            end_time: "2025-06-01T11:00:00Z",
          });
          expect(result.errors.title).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects empty title", () => {
    const result = validateEventForm({
      title: "",
      start_time: "2025-06-01T10:00:00Z",
      end_time: "2025-06-01T11:00:00Z",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it("rejects title > 100 chars", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101, maxLength: 200 }),
        (title) => {
          const result = validateEventForm({
            title,
            start_time: "2025-06-01T10:00:00Z",
            end_time: "2025-06-01T11:00:00Z",
          });
          expect(result.errors.title).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts description ≤ 500 chars", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (description) => {
          const result = validateEventForm({
            title: "Test",
            description,
            start_time: "2025-06-01T10:00:00Z",
            end_time: "2025-06-01T11:00:00Z",
          });
          expect(result.errors.description).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects description > 500 chars", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 501, maxLength: 600 }),
        (description) => {
          const result = validateEventForm({
            title: "Test",
            description,
            start_time: "2025-06-01T10:00:00Z",
            end_time: "2025-06-01T11:00:00Z",
          });
          expect(result.errors.description).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts end_time strictly after start_time", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: new Date(2000, 0, 1).getTime(), max: new Date(2100, 0, 1).getTime() }),
        fc.integer({ min: 1, max: 86400000 }), // 1ms to 24h offset
        (startTs, offset) => {
          const start = new Date(startTs).toISOString();
          const end = new Date(startTs + offset).toISOString();
          const result = validateEventForm({
            title: "Test",
            start_time: start,
            end_time: end,
          });
          expect(result.errors.end_time).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects end_time equal to or before start_time", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: new Date(2000, 0, 1).getTime(), max: new Date(2100, 0, 1).getTime() }),
        fc.integer({ min: 0, max: 86400000 }),
        (startTs, offset) => {
          const start = new Date(startTs).toISOString();
          const end = new Date(startTs - offset).toISOString();
          const result = validateEventForm({
            title: "Test",
            start_time: start,
            end_time: end,
          });
          expect(result.errors.end_time).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 7: Color preset cycling
 * Validates: Requirements 3.7
 */
describe("Feature: calendar, Property 7: Color preset cycling", () => {
  it("always returns a valid COLOR_PRESETS entry at index n % length", () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }),
        (n) => {
          const color = getNextColor(n);
          const expectedIndex = n % COLOR_PRESETS.length;
          expect(color).toBe(COLOR_PRESETS[expectedIndex]);
          expect(COLOR_PRESETS).toContain(color);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 8: Calendar items sort order
 * Validates: Requirements 5.3
 */
describe("Feature: calendar, Property 8: Calendar items sort order", () => {
  // Use integer timestamps to avoid invalid date issues
  const timestampArb = fc.integer({
    min: new Date(2020, 0, 1).getTime(),
    max: new Date(2030, 0, 1).getTime(),
  });

  const taskItemArb = fc.record({
    type: fc.constant("task" as const),
    data: fc.record({
      id: fc.uuid(),
      label: fc.string({ minLength: 1, maxLength: 30 }),
      completed: fc.boolean(),
      due_date: timestampArb.map((t) => new Date(t).toISOString()),
    }),
  });

  const eventItemArb = fc.record({
    type: fc.constant("event" as const),
    data: fc.record({
      id: fc.uuid(),
      title: fc.string({ minLength: 1, maxLength: 30 }),
      start_time: timestampArb.map((t) => new Date(t).toISOString()),
      end_time: timestampArb.map((t) => new Date(t).toISOString()),
      color: fc.constant("#3B82F6"),
    }),
  });

  it("sorted items are in ascending time order", () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(taskItemArb, eventItemArb), { minLength: 1, maxLength: 10 }),
        (items) => {
          const sorted = sortCalendarItems(items as CalendarItemData[]);

          for (let i = 1; i < sorted.length; i++) {
            const prevTime = getTime(sorted[i - 1]);
            const currTime = getTime(sorted[i]);
            expect(currTime).toBeGreaterThanOrEqual(prevTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("tasks appear before events when times are equal", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: new Date(2020, 0, 1).getTime(), max: new Date(2030, 0, 1).getTime() }),
        (ts) => {
          const isoStr = new Date(ts).toISOString();
          const items: CalendarItemData[] = [
            { type: "event", data: { id: "e1", title: "Event", start_time: isoStr, end_time: isoStr, color: "#3B82F6" } },
            { type: "task", data: { id: "t1", label: "Task", completed: false, due_date: isoStr } },
          ];
          const sorted = sortCalendarItems(items);
          expect(sorted[0].type).toBe("task");
          expect(sorted[1].type).toBe("event");
        }
      ),
      { numRuns: 100 }
    );
  });
});

function getTime(item: CalendarItemData): number {
  if (item.type === "task") {
    return item.data.due_date ? new Date(item.data.due_date).getTime() : 0;
  }
  return new Date((item.data as CalendarEvent).start_time).getTime();
}

/**
 * Property 9: Day cell overflow logic
 * Validates: Requirements 5.4
 */
describe("Feature: calendar, Property 9: Day cell overflow logic", () => {
  const itemArb: fc.Arbitrary<CalendarItemData> = fc.record({
    type: fc.constant("task" as const),
    data: fc.record({
      id: fc.uuid(),
      label: fc.string({ minLength: 1, maxLength: 20 }),
      completed: fc.boolean(),
      due_date: fc.constant("2025-06-15"),
    }),
  });

  it("≤ 3 items: all visible, overflowCount = 0", () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 0, maxLength: 3 }),
        (items) => {
          const { visible, overflowCount } = getVisibleItems(items);
          expect(visible).toHaveLength(items.length);
          expect(overflowCount).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("> 3 items: 3 visible, overflowCount = total - 3", () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 4, maxLength: 20 }),
        (items) => {
          const { visible, overflowCount } = getVisibleItems(items);
          expect(visible).toHaveLength(3);
          expect(overflowCount).toBe(items.length - 3);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 10: Monthly event filtering
 * Validates: Requirements 6.2
 */
describe("Feature: calendar, Property 10: Monthly event filtering", () => {
  const yearArb = fc.integer({ min: 1970, max: 2100 });
  const monthArb = fc.integer({ min: 0, max: 11 });

  // Use integer timestamps to avoid invalid date issues
  const timestampArb = fc.integer({
    min: new Date(1970, 0, 1).getTime(),
    max: new Date(2100, 11, 31).getTime(),
  });

  const eventArb = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    start_time: timestampArb.map((t) => new Date(t).toISOString()),
    end_time: timestampArb.map((t) => new Date(t).toISOString()),
    color: fc.constant("#3B82F6"),
  });

  it("only events overlapping the month boundaries are included", () => {
    fc.assert(
      fc.property(yearArb, monthArb, fc.array(eventArb, { maxLength: 10 }), (year, month, events) => {
        const filtered = filterEventsByMonth(events, year, month);

        const monthStart = new Date(year, month, 1, 0, 0, 0).getTime();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const monthEnd = new Date(year, month, lastDay, 23, 59, 59).getTime();

        for (const event of filtered) {
          const eventStart = new Date(event.start_time).getTime();
          const eventEnd = new Date(event.end_time).getTime();
          // Must overlap: starts before month ends AND ends after month starts
          expect(eventStart <= monthEnd && eventEnd >= monthStart).toBe(true);
        }

        // Verify excluded events don't overlap
        const excluded = events.filter((e) => !filtered.includes(e));
        for (const event of excluded) {
          const eventStart = new Date(event.start_time).getTime();
          const eventEnd = new Date(event.end_time).getTime();
          const overlaps = eventStart <= monthEnd && eventEnd >= monthStart;
          expect(overlaps).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});
