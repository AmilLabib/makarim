import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Check, X, Calendar } from "lucide-react";
import {
  fetchTasks,
  createTask as createTaskApi,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
} from "../lib/supabaseApi";
import type { Task as TaskType } from "../lib/supabaseApi";
import { isSupabaseEnabled } from "../lib/supabaseClient";

interface Task extends TaskType {
  description: string;
  due_date: string | null;
}

function sortByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Tasks without due date go to the bottom
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

const TodoListPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("makarim_tasks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((t: any) => ({
          ...t,
          description: t.description || "",
          due_date: t.due_date || null,
        }));
      } catch (e) {}
    }
    return [
      { id: "1", label: "Login Bing", completed: false, description: "", due_date: null },
      { id: "2", label: "Check User Testing", completed: false, description: "", due_date: null },
    ];
  });

  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [localDescriptions, setLocalDescriptions] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem("makarim_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const sortedTasks = sortByDueDate(tasks);
  const completedCount = tasks.filter((t) => t.completed).length;

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskLabel.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      label: newTaskLabel.trim(),
      completed: false,
      description: "",
      due_date: newTaskDueDate || null,
    };

    if (isSupabaseEnabled) {
      (async () => {
        try {
          const created = await createTaskApi({
            label: newTask.label,
            completed: false,
            description: newTask.description,
            due_date: newTask.due_date,
          });
          if (created) {
            setTasks((prev) => [
              ...prev,
              { ...(created as Task), description: "", due_date: (created as any).due_date || null },
            ]);
          } else {
            setTasks((prev) => [...prev, newTask]);
          }
        } catch (err) {
          console.error(err);
          setTasks((prev) => [...prev, newTask]);
        }
      })();
    } else {
      setTasks([...tasks, newTask]);
    }

    setNewTaskLabel("");
    setNewTaskDueDate("");
  };

  const deleteTask = async (id: string) => {
    if (isSupabaseEnabled) {
      try {
        await deleteTaskApi(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } catch (e) {
        console.error(e);
      }
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const toggleComplete = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const updated = { ...target, completed: !target.completed } as Task;

    if (isSupabaseEnabled) {
      try {
        const res = await updateTaskApi(id, { completed: updated.completed });
        if (res)
          setTasks((prev) =>
            prev.map((t) =>
              t.id === id
                ? { ...(res as Task), description: t.description || "", due_date: t.due_date }
                : t,
            ),
          );
      } catch (e) {
        console.error(e);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
    } else {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  };

  const updateDescription = (id: string, newDescription: string) => {
    setLocalDescriptions((prev) => ({ ...prev, [id]: newDescription }));
  };

  const handleDescriptionBlur = async (id: string) => {
    const pending = localDescriptions[id];
    const task = tasks.find((t) => t.id === id);
    const text = pending !== undefined ? pending : task?.description || "";
    if (task && text !== task.description) {
      if (isSupabaseEnabled) {
        try {
          const res = await updateTaskApi(id, { description: text });
          if (res)
            setTasks((prev) =>
              prev.map((t) =>
                t.id === id
                  ? { ...(res as Task), description: (res as any).description || "", due_date: t.due_date }
                  : t,
              ),
            );
        } catch (e) {
          console.error(e);
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, description: text } : t)),
          );
        }
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, description: text } : t)),
        );
      }
    }

    setLocalDescriptions((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditLabel(task.label);
    setEditDueDate(task.due_date || "");
  };

  const saveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    const updates: Partial<Task> = {
      label: editLabel.trim(),
      due_date: editDueDate || null,
    };

    if (isSupabaseEnabled) {
      try {
        const res = await updateTaskApi(id, updates);
        if (res)
          setTasks((prev) =>
            prev.map((t) =>
              t.id === id
                ? { ...(res as Task), description: t.description || "", due_date: (res as any).due_date || null }
                : t,
            ),
          );
      } catch (e) {
        console.error(e);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
        );
      }
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      );
    }

    setEditingId(null);
  };

  // Load tasks from Supabase on mount (if enabled)
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (isSupabaseEnabled) {
        try {
          const remote = await fetchTasks();
          if (!mounted) return;
          if (remote && remote.length > 0) {
            setTasks(
              remote.map((r) => ({
                ...(r as Task),
                description: (r as any).description || "",
                due_date: (r as any).due_date || null,
              })) as Task[],
            );
          }
        } catch (e) {
          console.error("Failed to fetch tasks from Supabase", e);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <header className="mb-8">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Task Management
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Manage your tasks with deadlines. Sorted by nearest due date.
        </p>
      </header>

      {/* Overview */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          Tasks Completed
        </span>
        <span className="text-sm font-bold text-gray-900">
          {completedCount} / {tasks.length}
        </span>
      </div>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="mb-8 space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={!newTaskLabel.trim()}
            className="px-5 py-3 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <input
            type="date"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-600"
            placeholder="Due date (optional)"
          />
          <span className="text-xs text-gray-400">Deadline (optional)</span>
        </div>
      </form>

      {/* Task List */}
      <div className="space-y-4">
        <AnimatePresence>
          {sortedTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleComplete(task.id)}
                  className={`mt-1 w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center transition-colors ${
                    task.completed
                      ? "bg-black text-white"
                      : "border-2 border-gray-300 hover:border-black"
                  }`}
                >
                  {task.completed && <Check size={14} strokeWidth={3} />}
                </button>

                <div className="flex-1 min-w-0">
                  {editingId === task.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && saveEdit(task.id)
                          }
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-black"
                        />
                        <button
                          onClick={() => saveEdit(task.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`text-base font-medium ${task.completed ? "text-gray-400 line-through" : "text-gray-900"}`}
                      >
                        {task.label}
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Calendar size={12} className={
                            task.completed
                              ? "text-gray-300"
                              : isOverdue(task.due_date)
                                ? "text-red-500"
                                : "text-gray-400"
                          } />
                          <span
                            className={`text-xs ${
                              task.completed
                                ? "text-gray-300"
                                : isOverdue(task.due_date)
                                  ? "text-red-500 font-medium"
                                  : "text-gray-500"
                            }`}
                          >
                            {isOverdue(task.due_date) && !task.completed
                              ? `Overdue — ${formatDate(task.due_date)}`
                              : formatDate(task.due_date)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Description Input */}
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Add a description or note..."
                      value={localDescriptions[task.id] ?? task.description}
                      onChange={(e) =>
                        updateDescription(task.id, e.target.value)
                      }
                      onBlur={() => handleDescriptionBlur(task.id)}
                      className={`w-full px-3 py-2 text-sm border border-transparent hover:border-gray-200 focus:border-gray-300 focus:outline-none focus:bg-gray-50 rounded transition-colors ${
                        task.completed ? "text-gray-400" : "text-gray-600"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 md:opacity-100">
                  <button
                    onClick={() => startEditing(task)}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                    title="Edit task"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {tasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-100 rounded-xl"
            >
              No tasks yet. Add one above!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TodoListPage;
