"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const palette = ["#1f7369", "#a33d66", "#d89d35", "#5a6f93", "#6c7d47"];

export function AttendanceChart({ data }: { data: { name: string; present: number; absent: number; excused: number }[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="present" stackId="a" fill="#1f7369" />
          <Bar dataKey="absent" stackId="a" fill="#a33d66" />
          <Bar dataKey="excused" stackId="a" fill="#d89d35" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RsvpPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={95} label>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
