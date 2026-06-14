import React, { useState } from "react";
import { motion } from "framer-motion";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarGrid from "../components/calendar/CalendarGrid";
import EventFormModal from "../components/calendar/EventFormModal";
import TaskDetailModal from "../components/calendar/TaskDetailModal";
import DayItemsPopover from "../components/calendar/DayItemsPopover";
import DeleteConfirmDialog from "../components/calendar/DeleteConfirmDialog";
import { useCalendarData } from "../hooks/useCalendarData";
import { nextMonth, prevMonth } from "../components/calendar/utils";
import type { CalendarEvent, CalendarItemData } from "../components/calendar/types";
import type { Task } from "../lib/supabaseApi";

const CalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const {
    tasks,
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    updateTask,
  } = useCalendarData(currentMonth);

  // Modal states
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [dayPopover, setDayPopover] = useState<{
    date: Date;
    items: CalendarItemData[];
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handlers
  const handlePrevMonth = () => setCurrentMonth(prevMonth(currentMonth));
  const handleNextMonth = () => setCurrentMonth(nextMonth(currentMonth));

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleTaskClick = (task: Task) => {
    setViewingTask(task);
    setShowTaskDetail(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedDate(new Date(event.start_time));
    setShowEventForm(true);
  };

  const handleOverflowClick = (date: Date, items: CalendarItemData[]) => {
    setDayPopover({ date, items });
  };

  const handleEventSubmit = async (eventData: Omit<CalendarEvent, "id" | "created_at">) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        showToast("Event berhasil diperbarui", "success");
      } else {
        await createEvent(eventData);
        showToast("Event berhasil dibuat", "success");
      }
    } catch {
      showToast("Gagal menyimpan event", "error");
      throw new Error("Failed to save event");
    }
  };

  const handleDeleteClick = () => {
    if (editingEvent) {
      setDeletingEventId(editingEvent.id);
      setShowEventForm(false);
      setShowDeleteConfirm(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEventId) return;
    try {
      await deleteEvent(deletingEventId);
      showToast("Event berhasil dihapus", "success");
    } catch {
      showToast("Gagal menghapus event", "error");
    }
    setDeletingEventId(null);
    setEditingEvent(null);
  };

  const handleTaskUpdate = async (id: string, updates: Partial<Task>) => {
    try {
      await updateTask(id, updates);
      showToast("Task berhasil diperbarui", "success");
    } catch {
      showToast("Gagal memperbarui task", "error");
      throw new Error("Failed to update task");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      <header className="mb-6">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Calendar
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Lihat tasks dan events dalam tampilan kalender bulanan.
        </p>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
        <CalendarGrid
          currentMonth={currentMonth}
          tasks={tasks}
          events={events}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
          onEventClick={handleEventClick}
          onOverflowClick={handleOverflowClick}
          isLoading={isLoading}
        />
      </div>

      {/* Modals */}
      <EventFormModal
        isOpen={showEventForm}
        onClose={() => {
          setShowEventForm(false);
          setEditingEvent(null);
        }}
        onSubmit={handleEventSubmit}
        onDelete={editingEvent ? handleDeleteClick : undefined}
        initialData={editingEvent}
        selectedDate={selectedDate}
        eventCount={events.length}
      />

      <TaskDetailModal
        isOpen={showTaskDetail}
        onClose={() => {
          setShowTaskDetail(false);
          setViewingTask(null);
        }}
        task={viewingTask}
        onUpdate={handleTaskUpdate}
      />

      <DayItemsPopover
        isOpen={!!dayPopover}
        onClose={() => setDayPopover(null)}
        date={dayPopover?.date || new Date()}
        items={dayPopover?.items || []}
        onTaskClick={(task) => {
          setDayPopover(null);
          handleTaskClick(task);
        }}
        onEventClick={(event) => {
          setDayPopover(null);
          handleEventClick(event);
        }}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingEventId(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-[70] ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  );
};

export default CalendarPage;
