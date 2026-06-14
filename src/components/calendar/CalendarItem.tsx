import React from "react";
import { CheckSquare } from "lucide-react";
import { truncateLabel } from "./types";
import type { CalendarItemData } from "./types";

interface CalendarItemProps {
  item: CalendarItemData;
  onClick: () => void;
}

const CalendarItem: React.FC<CalendarItemProps> = ({ item, onClick }) => {
  if (item.type === "task") {
    const task = item.data;
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-left transition-colors hover:bg-gray-200 ${
          task.completed ? "opacity-50" : ""
        }`}
        style={{ backgroundColor: "#f3f4f6" }}
        title={task.label}
      >
        <CheckSquare size={10} className="text-gray-500 flex-shrink-0" />
        <span className={task.completed ? "line-through text-gray-500" : "text-gray-700"}>
          {truncateLabel(task.label)}
        </span>
      </button>
    );
  }

  const event = item.data;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-1.5 py-0.5 rounded text-xs text-left transition-opacity hover:opacity-80"
      style={{ backgroundColor: event.color + "20", color: event.color }}
      title={event.title}
    >
      <span className="truncate font-medium">{truncateLabel(event.title)}</span>
    </button>
  );
};

export default CalendarItem;
