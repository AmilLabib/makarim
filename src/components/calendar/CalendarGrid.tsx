import React from "react";
import DayCell from "./DayCell";
import { generateCalendarGrid, sortCalendarItems } from "./utils";
import type { CalendarItemData } from "./types";
import type { CalendarEvent } from "./types";
import type { Task } from "../../lib/supabaseApi";

interface CalendarGridProps {
  currentMonth: Date;
  tasks: Task[];
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onTaskClick: (task: Task) => void;
  onEventClick: (event: CalendarEvent) => void;
  onOverflowClick: (date: Date, items: CalendarItemData[]) => void;
  isLoading: boolean;
}

const DAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  tasks,
  events,
  onDayClick,
  onTaskClick,
  onEventClick,
  onOverflowClick,
  isLoading,
}) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const grid = generateCalendarGrid(year, month);

  // Build a map of items by date string
  const itemsByDate = new Map<string, CalendarItemData[]>();

  for (const task of tasks) {
    if (!task.due_date) continue;
    const key = task.due_date; // yyyy-mm-dd
    const existing = itemsByDate.get(key) || [];
    existing.push({ type: "task", data: task });
    itemsByDate.set(key, existing);
  }

  for (const event of events) {
    // Place event on its start date
    const startDate = new Date(event.start_time);
    const key = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
    const existing = itemsByDate.get(key) || [];
    existing.push({ type: "event", data: event });
    itemsByDate.set(key, existing);
  }

  if (isLoading) {
    return (
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        {/* Skeleton grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[80px] border border-gray-100 p-1 animate-pulse bg-gray-50"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {grid.map((cell) => {
          const dateKey = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, "0")}-${String(cell.date.getDate()).padStart(2, "0")}`;
          const items = sortCalendarItems(itemsByDate.get(dateKey) || []);

          return (
            <DayCell
              key={dateKey}
              date={cell.date}
              isCurrentMonth={cell.isCurrentMonth}
              isToday={cell.isToday}
              items={items}
              onDayClick={onDayClick}
              onItemClick={(item) => {
                if (item.type === "task") {
                  onTaskClick(item.data);
                } else {
                  onEventClick(item.data);
                }
              }}
              onOverflowClick={(items) => onOverflowClick(cell.date, items)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
