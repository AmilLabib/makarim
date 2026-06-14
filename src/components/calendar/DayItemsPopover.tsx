import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import CalendarItem from "./CalendarItem";
import { sortCalendarItems } from "./utils";
import type { CalendarItemData, CalendarEvent } from "./types";
import type { Task } from "../../lib/supabaseApi";

interface DayItemsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  items: CalendarItemData[];
  onTaskClick: (task: Task) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const DayItemsPopover: React.FC<DayItemsPopoverProps> = ({
  isOpen,
  onClose,
  date,
  items,
  onTaskClick,
  onEventClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const sortedItems = sortCalendarItems(items);
  const formattedDate = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
        >
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">{formattedDate}</h4>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-100 text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto">
              {sortedItems.map((item) => (
                <CalendarItem
                  key={item.type === "task" ? `t-${item.data.id}` : `e-${item.data.id}`}
                  item={item}
                  onClick={() => {
                    if (item.type === "task") {
                      onTaskClick(item.data);
                    } else {
                      onEventClick(item.data);
                    }
                    onClose();
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DayItemsPopover;
