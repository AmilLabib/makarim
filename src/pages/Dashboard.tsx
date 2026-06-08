import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchJobs, fetchTasks } from "../lib/supabaseApi";
import type { Job, Task } from "../lib/supabaseApi";

const StatCard: React.FC<{ title: string; value: number; sub?: string }> = ({
  title,
  value,
  sub,
}) => (
  <div className="p-5 bg-white rounded-lg border border-gray-100 shadow-sm">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
    {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
  </div>
);

const SummaryList: React.FC<{
  items: Array<{ id: string; label: string; completed?: boolean }>;
  title: string;
}> = ({ items, title }) => (
  <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
    <div className="text-sm font-medium text-gray-700 mb-3">{title}</div>
    <ul className="space-y-2">
      {items.length === 0 && (
        <li className="text-sm text-gray-400">No items</li>
      )}
      {items.map((it) => (
        <li key={it.id} className="flex justify-between items-center">
          <span
            className={`text-sm ${it.completed ? "text-gray-400 line-through" : "text-gray-800"}`}
          >
            {it.label}
          </span>
          {typeof it.completed === "boolean" && (
            <span
              className={`text-xs px-2 py-1 rounded ${it.completed ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
            >
              {it.completed ? "Done" : "Pending"}
            </span>
          )}
        </li>
      ))}
    </ul>
  </div>
);

const Dashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const j = await fetchJobs();
        const t = await fetchTasks();
        if (!mounted) return;
        setJobs(j ?? []);
        setTasks(t ?? []);
      } catch (e) {
        console.error("Failed loading stats", e);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.completed).length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="max-w-5xl mx-auto"
    >
      <header className="mb-8">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Ringkasan Statistik
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Sekilas performa job dan task — data tersinkronisasi dengan Supabase
          bila tersedia.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Jobs"
          value={totalJobs}
          sub={`${completedJobs} selesai`}
        />
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          sub={`${completedTasks} selesai`}
        />
        <StatCard
          title="Jobs Progress"
          value={totalJobs ? Math.round((completedJobs / totalJobs) * 100) : 0}
          sub="persentase"
        />
        <StatCard
          title="Tasks Progress"
          value={
            totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
          }
          sub="persentase"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SummaryList
          title="Recent Jobs"
          items={jobs
            .slice(-6)
            .reverse()
            .map((j) => ({ id: j.id, label: j.label, completed: j.completed }))}
        />
        <SummaryList
          title="Recent Tasks"
          items={tasks
            .slice(-6)
            .reverse()
            .map((t) => ({ id: t.id, label: t.label, completed: t.completed }))}
        />
      </div>
    </motion.div>
  );
};

export default Dashboard;
