import supabase, { isSupabaseEnabled } from "./supabaseClient";

export type HealthHabit = {
  id: string;
  name: string;
  icon: string;
  target_per_week: number;
  color: string;
  is_active: boolean;
  created_at: string;
};

export type HealthHabitLog = {
  id: string;
  habit_id: string;
  logged_date: string;
  created_at: string;
};

// Habits CRUD
export async function fetchHabits(): Promise<HealthHabit[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  const { data, error } = await supabase
    .from("health_habits")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HealthHabit[];
}

export async function createHabit(
  habit: Pick<HealthHabit, "name" | "icon" | "target_per_week" | "color">,
): Promise<HealthHabit | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const { data, error } = await supabase
    .from("health_habits")
    .insert([habit])
    .select()
    .single();
  if (error) throw error;
  return data as HealthHabit;
}

export async function updateHabit(
  id: string,
  updates: Partial<HealthHabit>,
): Promise<HealthHabit | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const { data, error } = await supabase
    .from("health_habits")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as HealthHabit;
}

export async function deleteHabit(id: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  // Soft delete: set is_active to false
  const { error } = await supabase
    .from("health_habits")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

// Logs
export async function fetchLogsByWeek(
  weekStart: string,
  weekEnd: string,
): Promise<HealthHabitLog[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  const { data, error } = await supabase
    .from("health_habit_logs")
    .select("*")
    .gte("logged_date", weekStart)
    .lte("logged_date", weekEnd)
    .order("logged_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HealthHabitLog[];
}

export async function fetchLogsByRange(
  startDate: string,
  endDate: string,
): Promise<HealthHabitLog[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  const { data, error } = await supabase
    .from("health_habit_logs")
    .select("*")
    .gte("logged_date", startDate)
    .lte("logged_date", endDate)
    .order("logged_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HealthHabitLog[];
}

export async function toggleLog(
  habitId: string,
  date: string,
): Promise<{ added: boolean }> {
  if (!isSupabaseEnabled || !supabase) return { added: false };

  // Check if log exists
  const { data: existing } = await supabase
    .from("health_habit_logs")
    .select("id")
    .eq("habit_id", habitId)
    .eq("logged_date", date)
    .maybeSingle();

  if (existing) {
    // Remove log
    const { error } = await supabase
      .from("health_habit_logs")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
    return { added: false };
  } else {
    // Add log
    const { error } = await supabase
      .from("health_habit_logs")
      .insert([{ habit_id: habitId, logged_date: date }]);
    if (error) throw error;
    return { added: true };
  }
}
