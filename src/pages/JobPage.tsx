import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Check, X, Briefcase } from "lucide-react";
import {
  fetchJobs,
  createJob as createJobApi,
  updateJob as updateJobApi,
  deleteJob as deleteJobApi,
} from "../lib/supabaseApi";
import type { Job as JobType } from "../lib/supabaseApi";
import { isSupabaseEnabled } from "../lib/supabaseClient";

interface Job extends JobType {
  description: string;
}

const JobPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem("makarim_jobs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((j: any) => ({
          ...j,
          description: j.description || "",
        }));
      } catch (e) {}
    }
    return [
      { id: "1", label: "Check Emails", completed: false, description: "" },
      {
        id: "2",
        label: "Review Daily Metrics",
        completed: false,
        description: "",
      },
    ];
  });

  const [newJobLabel, setNewJobLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [localDescriptions, setLocalDescriptions] = useState<
    Record<string, string>
  >({});

  // Load from Supabase (if enabled) on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (isSupabaseEnabled) {
        try {
          const remote = await fetchJobs();
          if (!mounted) return;
          if (remote && remote.length > 0) {
            setJobs(
              remote.map((r) => ({
                ...r,
                description: (r as any).description || "",
              })) as Job[],
            );
          }
        } catch (e) {
          console.error("Failed to fetch jobs from Supabase", e);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Save to local storage whenever jobs change (for offline fallback)
  useEffect(() => {
    localStorage.setItem("makarim_jobs", JSON.stringify(jobs));
  }, [jobs]);

  // Daily Reset Logic (local-first)
  useEffect(() => {
    const today = new Date().toDateString();
    const lastVisited = localStorage.getItem("makarim_jobs_last_visited");

    if (lastVisited !== today) {
      setJobs((prevJobs) =>
        prevJobs.map((job) => ({ ...job, completed: false })),
      );
      localStorage.setItem("makarim_jobs_last_visited", today);
    }
  }, []);

  const completedCount = jobs.filter((j) => j.completed).length;

  const addJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobLabel.trim()) return;
    const newJob: Job = {
      id: Date.now().toString(),
      label: newJobLabel.trim(),
      completed: false,
      description: "",
    };

    if (isSupabaseEnabled) {
      try {
        const created = await createJobApi({
          label: newJob.label,
          completed: false,
          description: newJob.description,
        });
        if (created) {
          setJobs((prev) => [
            ...prev,
            {
              ...(created as Job),
              description: (created as any).description || "",
            },
          ]);
        } else {
          setJobs((prev) => [...prev, newJob]);
        }
      } catch (err) {
        console.error(err);
        setJobs((prev) => [...prev, newJob]);
      }
    } else {
      setJobs((prev) => [...prev, newJob]);
    }

    setNewJobLabel("");
  };

  const deleteJob = async (id: string) => {
    if (isSupabaseEnabled) {
      try {
        await deleteJobApi(id);
        setJobs((prev) => prev.filter((j) => j.id !== id));
      } catch (e) {
        console.error(e);
      }
    } else {
      setJobs((prev) => prev.filter((j) => j.id !== id));
    }
  };

  const toggleComplete = async (id: string) => {
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    const updated = { ...target, completed: !target.completed };

    if (isSupabaseEnabled) {
      try {
        const res = await updateJobApi(id, { completed: updated.completed });
        if (res)
          setJobs((prev) =>
            prev.map((j) =>
              j.id === id
                ? {
                    ...(res as Job),
                    description: (res as any).description || "",
                  }
                : j,
            ),
          );
      } catch (e) {
        console.error(e);
        setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
      }
    } else {
      setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
    }
  };

  const updateDescription = async (id: string, newDescription: string) => {
    if (isSupabaseEnabled) {
      try {
        const res = await updateJobApi(id, { description: newDescription });
        if (res)
          setJobs((prev) =>
            prev.map((j) =>
              j.id === id
                ? {
                    ...(res as Job),
                    description: (res as any).description || "",
                  }
                : j,
            ),
          );
      } catch (e) {
        console.error(e);
      }
    } else {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === id ? { ...j, description: newDescription } : j,
        ),
      );
    }
  };

  const handleLocalDescriptionChange = (id: string, value: string) => {
    setLocalDescriptions((prev) => ({ ...prev, [id]: value }));
  };

  const handleDescriptionBlur = (id: string) => {
    const pending = localDescriptions[id];
    const job = jobs.find((j) => j.id === id);
    const text = pending !== undefined ? pending : job?.description || "";
    if (job && text !== job.description) {
      updateDescription(id, text);
    }
    setLocalDescriptions((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const startEditing = (job: Job) => {
    setEditingId(job.id);
    setEditLabel(job.label);
  };

  const saveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    if (isSupabaseEnabled) {
      try {
        const res = await updateJobApi(id, { label: editLabel.trim() });
        if (res)
          setJobs((prev) =>
            prev.map((j) =>
              j.id === id
                ? {
                    ...(res as Job),
                    description: (res as any).description || "",
                  }
                : j,
            ),
          );
      } catch (e) {
        console.error(e);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === id ? { ...j, label: editLabel.trim() } : j,
          ),
        );
      }
    } else {
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, label: editLabel.trim() } : j)),
      );
    }

    setEditingId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase size={28} className="text-gray-900" />
          <h2 className="text-3xl font-light text-gray-900 tracking-tight">
            Daily Jobs
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Recurring tasks that automatically uncheck at the start of a new day.
        </p>
      </header>

      {/* Overview */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8 flex justify-between items-center">
        <span className="text-sm font-medium text-blue-800">
          Jobs Completed Today
        </span>
        <span className="text-sm font-bold text-blue-900">
          {completedCount} / {jobs.length}
        </span>
      </div>

      {/* Add Job Form */}
      <form onSubmit={addJob} className="mb-8 flex gap-3">
        <input
          type="text"
          placeholder="Add a new recurring job..."
          value={newJobLabel}
          onChange={(e) => setNewJobLabel(e.target.value)}
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
        />
        <button
          type="submit"
          disabled={!newJobLabel.trim()}
          className="px-5 py-3 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Add Job
        </button>
      </form>

      {/* Job List */}
      <div className="space-y-4">
        <AnimatePresence>
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleComplete(job.id)}
                  className={`mt-1 w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center transition-colors ${
                    job.completed
                      ? "bg-black text-white"
                      : "border-2 border-gray-300 hover:border-black"
                  }`}
                >
                  {job.completed && <Check size={14} strokeWidth={3} />}
                </button>

                <div className="flex-1 min-w-0">
                  {editingId === job.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(job.id)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-black"
                      />
                      <button
                        onClick={() => saveEdit(job.id)}
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
                  ) : (
                    <div
                      className={`text-base font-medium ${job.completed ? "text-gray-400 line-through" : "text-gray-900"}`}
                    >
                      {job.label}
                    </div>
                  )}

                  {/* Description Input */}
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Add a description or note..."
                      value={localDescriptions[job.id] ?? job.description}
                      onChange={(e) =>
                        handleLocalDescriptionChange(job.id, e.target.value)
                      }
                      onBlur={() => handleDescriptionBlur(job.id)}
                      className={`w-full px-3 py-2 text-sm border border-transparent hover:border-gray-200 focus:border-gray-300 focus:outline-none focus:bg-gray-50 rounded transition-colors ${
                        job.completed ? "text-gray-400" : "text-gray-600"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 md:opacity-100">
                  <button
                    onClick={() => startEditing(job)}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                    title="Edit job"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete job"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {jobs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-100 rounded-xl"
            >
              No daily jobs yet. Add one above!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default JobPage;
