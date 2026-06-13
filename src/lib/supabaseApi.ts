import supabase, { isSupabaseEnabled } from "./supabaseClient";

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
