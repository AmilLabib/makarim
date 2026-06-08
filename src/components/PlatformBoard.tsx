import React from "react";
import { motion } from "framer-motion";

interface Platform {
  name: string;
  tasksCompleted: number;
  status: "Active" | "Under Review" | "Completed";
  earnings: number;
}

const platforms: Platform[] = [
  {
    name: "Data Annotation",
    tasksCompleted: 12,
    status: "Active",
    earnings: 240.5,
  },
  {
    name: "Outlier",
    tasksCompleted: 8,
    status: "Under Review",
    earnings: 160.0,
  },
];

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const PlatformBoard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {platforms.map((platform, idx) => (
        <motion.div
          key={platform.name}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          className="p-6 border border-gray-100 rounded-lg shadow-sm bg-white"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {platform.name}
            </h3>
            <span
              className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${
                platform.status === "Active"
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {platform.status}
            </span>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-400 uppercase">Tasks</p>
              <p className="text-2xl font-light text-gray-900">
                {platform.tasksCompleted}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase">Est. Earnings</p>
              <p className="text-2xl font-light text-gray-900">
                {formatCurrency(platform.earnings)}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PlatformBoard;
