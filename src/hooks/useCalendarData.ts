import { useState, useEffect, useCallback } from "react";
import {
  fetchEventsByMonth,
  fetchTasksByMonth,
  createEvent as createEventApi,
  updateEvent as updateEventApi,
  deleteEvent as deleteEventApi,
  updateTask as updateTaskApi,
} from "../lib/supabaseApi";
import { isSupabaseEnabled } from "../lib/supabaseClient";
import type { CalendarEvent } from "../components/calendar/types";
import type { Task } from "../lib/supabaseApi";

const EVENTS_STORAGE_KEY = "makarim_calendar_events";

function loadEventsFromStorage(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEventsToStorage(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Silent fail — Supabase is the source of truth (Req 6.6)
  }
}

export interface UseCalendarDataReturn {
  tasks: Task[];
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  createEvent: (event: Omit<CalendarEvent, "id" | "created_at">) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCalendarData(currentMonth: Date): UseCalendarDataReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isSupabaseEnabled) {
        const [fetchedEvents, fetchedTasks] = await Promise.all([
          fetchEventsByMonth(year, month),
          fetchTasksByMonth(year, month),
        ]);
        setEvents(fetchedEvents);
        setTasks(fetchedTasks);
        // Sync to localStorage cache
        saveEventsToStorage(fetchedEvents);
      } else {
        // Load from localStorage fallback
        const cachedEvents = loadEventsFromStorage();
        setEvents(cachedEvents);
        // Tasks from localStorage
        try {
          const raw = localStorage.getItem("makarim_tasks");
          const allTasks: Task[] = raw ? JSON.parse(raw) : [];
          // Filter tasks for this month
          const monthTasks = allTasks.filter((t) => {
            if (!t.due_date) return false;
            const [y, m] = t.due_date.split("-").map(Number);
            return y === year && m === month + 1;
          });
          setTasks(monthTasks);
        } catch {
          setTasks([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch calendar data:", err);
      setError("Gagal memuat data. Menampilkan data lokal.");
      // Fallback to localStorage
      const cachedEvents = loadEventsFromStorage();
      setEvents(cachedEvents);
      try {
        const raw = localStorage.getItem("makarim_tasks");
        const allTasks: Task[] = raw ? JSON.parse(raw) : [];
        const monthTasks = allTasks.filter((t) => {
          if (!t.due_date) return false;
          const [y, m] = t.due_date.split("-").map(Number);
          return y === year && m === month + 1;
        });
        setTasks(monthTasks);
      } catch {
        setTasks([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createEvent = useCallback(
    async (eventData: Omit<CalendarEvent, "id" | "created_at">) => {
      if (isSupabaseEnabled) {
        try {
          const created = await createEventApi(eventData);
          if (created) {
            setEvents((prev) => {
              const updated = [...prev, created];
              saveEventsToStorage(updated);
              return updated;
            });
            return;
          }
        } catch (err) {
          console.error("Failed to create event in Supabase:", err);
          setError("Event disimpan secara lokal.");
        }
      }
      // localStorage fallback
      const localEvent: CalendarEvent = {
        ...eventData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      setEvents((prev) => {
        const updated = [...prev, localEvent];
        saveEventsToStorage(updated);
        return updated;
      });
    },
    []
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      if (isSupabaseEnabled) {
        try {
          const updated = await updateEventApi(id, updates);
          if (updated) {
            setEvents((prev) => {
              const newEvents = prev.map((e) => (e.id === id ? { ...e, ...updated } : e));
              saveEventsToStorage(newEvents);
              return newEvents;
            });
            return;
          }
        } catch (err) {
          console.error("Failed to update event:", err);
          setError("Perubahan disimpan secara lokal.");
        }
      }
      // localStorage fallback
      setEvents((prev) => {
        const newEvents = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
        saveEventsToStorage(newEvents);
        return newEvents;
      });
    },
    []
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      if (isSupabaseEnabled) {
        try {
          await deleteEventApi(id);
          setEvents((prev) => {
            const newEvents = prev.filter((e) => e.id !== id);
            saveEventsToStorage(newEvents);
            return newEvents;
          });
          return;
        } catch (err) {
          console.error("Failed to delete event:", err);
          setError("Penghapusan disimpan secara lokal.");
        }
      }
      // localStorage fallback
      setEvents((prev) => {
        const newEvents = prev.filter((e) => e.id !== id);
        saveEventsToStorage(newEvents);
        return newEvents;
      });
    },
    []
  );

  const updateTaskFn = useCallback(
    async (id: string, updates: Partial<Task>) => {
      if (isSupabaseEnabled) {
        try {
          const updated = await updateTaskApi(id, updates);
          if (updated) {
            setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
            return;
          }
        } catch (err) {
          console.error("Failed to update task:", err);
          setError("Perubahan task disimpan secara lokal.");
        }
      }
      // localStorage fallback
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      // Also update localStorage tasks
      try {
        const raw = localStorage.getItem("makarim_tasks");
        const allTasks: Task[] = raw ? JSON.parse(raw) : [];
        const updatedAll = allTasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
        localStorage.setItem("makarim_tasks", JSON.stringify(updatedAll));
      } catch {
        // Silent fail
      }
    },
    []
  );

  return {
    tasks,
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    updateTask: updateTaskFn,
    refetch: fetchData,
  };
}
