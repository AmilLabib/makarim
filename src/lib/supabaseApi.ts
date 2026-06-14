import supabase, { isSupabaseEnabled } from "./supabaseClient";
import type { CalendarEvent } from "../components/calendar/types";

export type { CalendarEvent };

export type Job = {
  id: string;
  label: string;
  completed: boolean;
  description?: string;
  created_at?: string;
};

export type Task = {
  id: string;
  label: string;
  completed: boolean;
  description?: string;
  due_date?: string | null;
  created_at?: string;
};

// Jobs
export async function fetchJobs(): Promise<Job[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Job[];
}

export async function createJob(job: Partial<Job>): Promise<Job | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const { data, error } = await supabase
    .from("jobs")
    .insert([job])
    .select()
    .single();
  if (error) throw error;
  return data as Job;
}

export async function updateJob(
  id: string,
  updates: Partial<Job>,
): Promise<Job | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const { data, error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Job;
}

export async function deleteJob(id: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

// Tasks
export async function fetchTasks(): Promise<Task[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(task: Partial<Task>): Promise<Task | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const { data, error } = await supabase
    .from("tasks")
    .insert([task])
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function createTasks(
  tasks: Partial<Task>[],
): Promise<Task[] | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const { data, error } = await supabase.from("tasks").insert(tasks).select();
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function updateTask(
  id: string,
  updates: Partial<Task>,
): Promise<Task | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// Calendar Events
export async function fetchEventsByMonth(
  year: number,
  month: number,
): Promise<CalendarEvent[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  const startOfMonth = new Date(year, month, 1).toISOString();
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .or(`start_time.gte.${startOfMonth},end_time.gte.${startOfMonth}`)
    .or(`start_time.lte.${endOfMonth},end_time.lte.${endOfMonth}`)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function createEvent(
  event: Omit<CalendarEvent, "id" | "created_at">,
): Promise<CalendarEvent | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const { data, error } = await supabase
    .from("events")
    .insert([event])
    .select()
    .single();
  if (error) throw error;
  return data as CalendarEvent;
}

export async function updateEvent(
  id: string,
  updates: Partial<CalendarEvent>,
): Promise<CalendarEvent | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as CalendarEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

// Tasks by Month (for calendar view)
export async function fetchTasksByMonth(
  year: number,
  month: number,
): Promise<Task[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  const startOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDay = new Date(year, month + 1, 0).getDate();
  const endOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .gte("due_date", startOfMonth)
    .lte("due_date", endOfMonth)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}
