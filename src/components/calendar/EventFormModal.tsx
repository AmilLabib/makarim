import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { validateEventForm } from "./utils";
import { getNextColor } from "./types";
import type { CalendarEvent } from "./types";
import type { EventFormErrors } from "./utils";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<CalendarEvent, "id" | "created_at">) => Promise<void>;
  onDelete?: () => void;
  initialData?: CalendarEvent | null;
  selectedDate: Date;
  eventCount: number;
}

const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  selectedDate,
  eventCount,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || "");
        // Convert ISO to local datetime-local format
        setStartTime(toDatetimeLocal(initialData.start_time));
        setEndTime(toDatetimeLocal(initialData.end_time));
      } else {
        setTitle("");
        setDescription("");
        // Default start time is the selected date at 09:00
        const dateStr = formatDateForInput(selectedDate);
        setStartTime(`${dateStr}T09:00`);
        setEndTime(`${dateStr}T10:00`);
      }
      setErrors({});
    }
  }, [isOpen, initialData, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateEventForm({
      title,
      description: description || undefined,
      start_time: startTime ? new Date(startTime).toISOString() : "",
      end_time: endTime ? new Date(endTime).toISOString() : "",
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        color: initialData?.color || getNextColor(eventCount),
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditMode ? "Edit Event" : "New Event"}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black ${
                    errors.title ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Event title"
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none ${
                    errors.description ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Deskripsi event (opsional)"
                  rows={3}
                  maxLength={500}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waktu Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black ${
                    errors.start_time ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.start_time && (
                  <p className="text-xs text-red-500 mt-1">{errors.start_time}</p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waktu Selesai <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black ${
                    errors.end_time ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.end_time && (
                  <p className="text-xs text-red-500 mt-1">{errors.end_time}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  {isEditMode && onDelete && (
                    <button
                      type="button"
                      onClick={onDelete}
                      className="text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                      Hapus Event
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium"
                  >
                    {isSubmitting ? "Menyimpan..." : isEditMode ? "Simpan" : "Buat Event"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default EventFormModal;
