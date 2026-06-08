import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTasks, updateTask, createTasks } from "../lib/supabaseApi";
import { isSupabaseEnabled } from "../lib/supabaseClient";

interface Task {
  id: string;
  label: string;
  completed: boolean;
}

const initialTasks: Task[] = [
  { id: "1", label: "Login Bing", completed: false },
  { id: "2", label: "Check User Testing", completed: false },
  { id: "3", label: "Data Annotation Entry", completed: false },
  { id: "4", label: "Review Outlier Tasks", completed: false },
];

const DailyChecklist: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isSupabaseEnabled) return;
      try {
        const remote = await fetchTasks();
        if (!mounted) return;
        if (remote && remote.length) {
          setTasks(
            remote.map((r) => ({
              id: r.id,
              label: r.label,
              completed: r.completed,
            })),
          );
        } else {
          // If remote empty, seed initial tasks into Supabase and use them
          try {
            const created = await createTasks(
              initialTasks.map((t) => ({
                label: t.label,
                completed: t.completed,
              })),
            );
            if (!mounted) return;
            if (created && created.length) {
              setTasks(
                created.map((r) => ({
                  id: r.id,
                  label: r.label,
                  completed: r.completed,
                })),
              );
            }
          } catch (err) {
            console.error("Failed to seed tasks to Supabase", err);
          }
        }
      } catch (e) {
        console.error("Failed to load tasks from Supabase", e);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const completedCount = tasks.filter((t) => t.completed).length;
  const percent = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );

    if (isSupabaseEnabled) {
      const t = tasks.find((x) => x.id === id);
      if (t)
        updateTask(id, { completed: !t.completed }).catch((e) =>
          console.error("update task failed", e),
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="p-6 border border-gray-100 rounded-lg shadow-sm bg-white"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-gray-900">Daily Routine</h2>
        <div className="text-sm text-gray-500">
          {completedCount}/{tasks.length}
        </div>
      </div>

      <div className="mb-4 w-full h-2 bg-gray-100 rounded overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6 }}
          className="h-2 bg-black rounded"
        />
      </div>

      <ul className="space-y-3">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.li
              key={task.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => toggleTask(task.id)}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center transition-all ${task.completed ? "bg-black" : "border border-gray-300"}`}
              >
                {task.completed && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span
                className={`text-sm select-none ${task.completed ? "text-gray-400 line-through" : "text-gray-800"}`}
              >
                {task.label}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </motion.div>
  );
};

export default DailyChecklist;
