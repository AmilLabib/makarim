import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react";
import {
  fetchHabits,
  fetchLogsByWeek,
  toggleLog,
  createHabit,
  deleteHabit,
} from "../lib/healthApi";
import type { HealthHabit, HealthHabitLog } from "../lib/healthApi";

// --- Utility functions ---

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const PRESET_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const PRESET_ICONS = ["🍎", "🥛", "🥤", "🥗", "💧", "🏃", "🧘", "💊", "🥚", "🍌"];

// --- Components ---

const ProgressRing: React.FC<{
  current: number;
  target: number;
  color: string;
  size?: number;
}> = ({ current, target, color, size = 48 }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / target, 1);
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth={4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
};

const HabitCard: React.FC<{
  habit: HealthHabit;
  logs: HealthHabitLog[];
  weekDays: Date[];
  onToggle: (habitId: string, date: string) => void;
  onDelete: (habitId: string) => void;
}> = ({ habit, logs, weekDays, onToggle, onDelete }) => {
  const habitLogs = logs.filter((l) => l.habit_id === habit.id);
  const loggedDates = new Set(habitLogs.map((l) => l.logged_date));
  const count = habitLogs.length;
  const isCompleted = count >= habit.target_per_week;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`p-5 bg-white rounded-xl border shadow-sm transition-all ${
        isCompleted ? "border-green-200 bg-green-50/30" : "border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{habit.icon}</span>
          <div>
            <h3 className="text-sm font-medium text-gray-900">{habit.name}</h3>
            <p className="text-xs text-gray-500">
              Target: {habit.target_per_week}x / minggu
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <ProgressRing
              current={count}
              target={habit.target_per_week}
              color={habit.color}
            />
            <span className="absolute text-xs font-semibold text-gray-700">
              {count}/{habit.target_per_week}
            </span>
          </div>
          <button
            onClick={() => onDelete(habit.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
            title="Hapus habit"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day, idx) => {
          const dateStr = formatDate(day);
          const isLogged = loggedDates.has(dateStr);
          const isToday = formatDate(new Date()) === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => onToggle(habit.id, dateStr)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isLogged
                  ? "bg-opacity-15 scale-105"
                  : "hover:bg-gray-50"
              } ${isToday ? "ring-1 ring-gray-300" : ""}`}
              style={
                isLogged
                  ? { backgroundColor: habit.color + "20" }
                  : undefined
              }
            >
              <span className="text-[10px] font-medium text-gray-500">
                {DAY_LABELS[idx]}
              </span>
              <span className="text-xs text-gray-600">
                {day.getDate()}
              </span>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isLogged ? "border-transparent" : "border-gray-200"
                }`}
                style={
                  isLogged
                    ? { backgroundColor: habit.color }
                    : undefined
                }
              >
                {isLogged && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {isCompleted && (
        <div className="mt-3 text-center">
          <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
            ✓ Target tercapai minggu ini!
          </span>
        </div>
      )}
    </motion.div>
  );
};

const AddHabitModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onAdd: (habit: Pick<HealthHabit, "name" | "icon" | "target_per_week" | "color">) => void;
}> = ({ open, onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🍎");
  const [target, setTarget] = useState(3);
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), icon, target_per_week: target, color });
    setName("");
    setIcon("🍎");
    setTarget(3);
    setColor(PRESET_COLORS[0]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-medium text-gray-900">
            Tambah Kebiasaan Baru
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              Nama Kebiasaan
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="misal: Makan Sayur"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border text-lg transition-all ${
                    icon === ic
                      ? "border-gray-900 bg-gray-50 scale-110"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              Target per Minggu
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={7}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="flex-1 accent-gray-900"
              />
              <span className="text-sm font-medium text-gray-900 w-12 text-center">
                {target}x
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Warna</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Tambah Kebiasaan
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- History Section ---
const WeekHistory: React.FC<{
  habits: HealthHabit[];
  logs: HealthHabitLog[];
  weekStart: Date;
}> = ({ habits, logs, weekStart }) => {
  const weekDays = getWeekDays(weekStart);
  const weekEnd = addDays(weekStart, 6);

  const formatRange = () => {
    const startStr = weekStart.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
    const endStr = weekEnd.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="p-4 bg-gray-50/50 rounded-lg border border-gray-100">
      <p className="text-xs font-medium text-gray-500 mb-3">{formatRange()}</p>
      <div className="space-y-2">
        {habits.map((habit) => {
          const habitLogs = logs.filter(
            (l) =>
              l.habit_id === habit.id &&
              l.logged_date >= formatDate(weekStart) &&
              l.logged_date <= formatDate(weekEnd),
          );
          const count = habitLogs.length;
          const loggedDates = new Set(habitLogs.map((l) => l.logged_date));

          return (
            <div key={habit.id} className="flex items-center gap-3">
              <span className="text-sm">{habit.icon}</span>
              <div className="flex gap-0.5">
                {weekDays.map((day) => {
                  const isLogged = loggedDates.has(formatDate(day));
                  return (
                    <div
                      key={formatDate(day)}
                      className="w-4 h-4 rounded-sm"
                      style={{
                        backgroundColor: isLogged
                          ? habit.color
                          : "#f3f4f6",
                      }}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-gray-500 ml-auto">
                {count}/{habit.target_per_week}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main Page ---
const HealthPage: React.FC = () => {
  const [habits, setHabits] = useState<HealthHabit[]>([]);
  const [logs, setLogs] = useState<HealthHabitLog[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<HealthHabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonday = getMonday(addDays(new Date(), weekOffset * 7));
  const currentSunday = addDays(currentMonday, 6);
  const weekDays = getWeekDays(currentMonday);

  const isCurrentWeek = weekOffset === 0;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const h = await fetchHabits();
      const l = await fetchLogsByWeek(
        formatDate(currentMonday),
        formatDate(currentSunday),
      );
      setHabits(h);
      setLogs(l);

      // Load last 4 weeks history (excluding current)
      const histStart = addDays(currentMonday, -28);
      const histEnd = addDays(currentMonday, -1);
      const hl = await fetchLogsByWeek(
        formatDate(histStart),
        formatDate(histEnd),
      );
      setHistoryLogs(hl);
    } catch (e) {
      console.error("Failed loading health data", e);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (habitId: string, date: string) => {
    try {
      const { added } = await toggleLog(habitId, date);
      setLogs((prev) => {
        if (added) {
          return [
            ...prev,
            { id: crypto.randomUUID(), habit_id: habitId, logged_date: date, created_at: "" },
          ];
        } else {
          return prev.filter(
            (l) => !(l.habit_id === habitId && l.logged_date === date),
          );
        }
      });
    } catch (e) {
      console.error("Failed toggling log", e);
    }
  };

  const handleAdd = async (
    habit: Pick<HealthHabit, "name" | "icon" | "target_per_week" | "color">,
  ) => {
    try {
      const created = await createHabit(habit);
      if (created) {
        setHabits((prev) => [...prev, created]);
      }
    } catch (e) {
      console.error("Failed creating habit", e);
    }
  };

  const handleDelete = async (habitId: string) => {
    if (!confirm("Hapus kebiasaan ini?")) return;
    try {
      await deleteHabit(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      setLogs((prev) => prev.filter((l) => l.habit_id !== habitId));
    } catch (e) {
      console.error("Failed deleting habit", e);
    }
  };

  const weekLabel = () => {
    if (isCurrentWeek) return "Minggu Ini";
    const start = currentMonday.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
    const end = currentSunday.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${start} - ${end}`;
  };

  // History weeks (last 4 weeks)
  const historyWeeks = Array.from({ length: 4 }, (_, i) =>
    addDays(currentMonday, -(i + 1) * 7),
  );

  // Overall stats
  const totalLogsThisWeek = logs.length;
  const totalTarget = habits.reduce((sum, h) => sum + h.target_per_week, 0);
  const completedHabits = habits.filter(
    (h) => logs.filter((l) => l.habit_id === h.id).length >= h.target_per_week,
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Health Tracker
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Track kebiasaan sehat mingguan lo. Klik hari untuk tandai selesai.
        </p>
      </header>

      {/* Stats Overview */}
      {!loading && habits.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {totalLogsThisWeek}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Total check-in minggu ini
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {totalTarget > 0
                ? Math.round((totalLogsThisWeek / totalTarget) * 100)
                : 0}
              %
            </div>
            <div className="text-xs text-gray-500 mt-1">Progress keseluruhan</div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {completedHabits}/{habits.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Target tercapai</div>
          </div>
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[160px] text-center">
            {weekLabel()}
          </span>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            disabled={isCurrentWeek}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-gray-500 hover:text-gray-900 ml-2 underline"
            >
              Hari ini
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={14} />
          <span>Tambah</span>
        </button>
      </div>

      {/* Habit Cards */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Memuat data...
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-4">
            Belum ada kebiasaan yang ditrack.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={14} />
            Tambah Kebiasaan Pertama
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4 mb-10">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                logs={logs}
                weekDays={weekDays}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* History Section */}
      {habits.length > 0 && historyLogs.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Riwayat 4 Minggu Terakhir
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {historyWeeks.map((weekStart) => (
              <WeekHistory
                key={formatDate(weekStart)}
                habits={habits}
                logs={historyLogs}
                weekStart={weekStart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddHabitModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HealthPage;
