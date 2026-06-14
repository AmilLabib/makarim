import React from "react";
import CalendarItem from "./CalendarItem";
import type { CalendarItemData } from "./types";
import { getVisibleItems } from "./utils";

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: CalendarItemData[];
  onDayClick: (date: Date) => void;
  onItemClick: (item: CalendarItemData) => void;
  onOverflowClick: (items: CalendarItemData[]) => void;
}

const DayCell: React.FC<DayCellProps> = ({
  date,
  isCurrentMonth,
  isToday,
  items,
  onDayClick,
  onItemClick,
  onOverflowClick,
}) => {
  const { visible, overflowCount } = getVisibleItems(items);

  return (
    <div
      className={`min-h-[80px] border border-gray-100 p-1 cursor-pointer transition-colors hover:bg-gray-50 ${
        !isCurrentMonth ? "opacity-40" : ""
      }`}
      onClick={() => onDayClick(date)}
    >
      <div className="flex justify-end mb-0.5">
        <span
          className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
            isToday
              ? "bg-black text-white"
              : "text-gray-700"
          }`}
        >
          {date.getDate()}
        </span>
      </div>

      <div className="space-y-0.5">
        {visible.map((item) => (
          <CalendarItem
            key={item.type === "task" ? `t-${item.data.id}` : `e-${item.data.id}`}
            item={item}
            onClick={() => {
              // Prevent event bubbling to day click
              onItemClick(item);
            }}
          />
        ))}

        {overflowCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOverflowClick(items);
            }}
            className="text-xs text-gray-500 hover:text-gray-700 pl-1.5 font-medium"
          >
            +{overflowCount} more
          </button>
        )}
      </div>
    </div>
  );
};

export default DayCell;
