import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMonthYear } from "./types";

interface CalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentMonth,
  onPrevMonth,
  onNextMonth,
}) => {
  const label = formatMonthYear(currentMonth);

  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={onPrevMonth}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-black"
        aria-label="Previous month"
      >
        <ChevronLeft size={20} />
      </button>

      <AnimatePresence mode="wait">
        <motion.h2
          key={label}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className="text-lg font-medium text-gray-900"
        >
          {label}
        </motion.h2>
      </AnimatePresence>

      <button
        onClick={onNextMonth}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-black"
        aria-label="Next month"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default CalendarHeader;
