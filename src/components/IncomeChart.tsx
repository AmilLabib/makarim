import React from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

const data = [
  { date: "May 01", income: 45 },
  { date: "May 05", income: 80 },
  { date: "May 10", income: 65 },
  { date: "May 15", income: 120 },
  { date: "May 20", income: 95 },
  { date: "May 25", income: 150 },
  { date: "May 30", income: 130 },
];

const IncomeChart: React.FC = () => {
  return (
    <div className="w-full h-64">
      <h2 className="text-xl font-medium mb-6 text-gray-800">
        Income Overview
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            dy={8}
          />
          <YAxis hide />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#000"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeChart;
