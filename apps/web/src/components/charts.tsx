'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// Colors for charts
const COLORS = {
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  purple: '#a855f7',
  orange: '#f97316',
  cyan: '#06b6d4',
  gray: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: COLORS.blue,
  IN_PROGRESS: COLORS.yellow,
  WAITING_CLIENT: COLORS.orange,
  WAITING_OPERATOR: COLORS.purple,
  RESOLVED: COLORS.green,
  CLOSED: COLORS.gray,
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: COLORS.gray,
  MEDIUM: COLORS.blue,
  HIGH: COLORS.orange,
  URGENT: COLORS.red,
};

const CATEGORY_COLORS = [COLORS.blue, COLORS.green, COLORS.yellow, COLORS.purple, COLORS.orange, COLORS.cyan];

interface StatusData {
  name: string;
  value: number;
  label: string;
  [key: string]: unknown;
}

interface CategoryData {
  name: string;
  value: number;
  [key: string]: unknown;
}

interface ChartTimelineData {
  date: string;
  created: number;
  resolved: number;
  [key: string]: unknown;
}

interface ChannelData {
  name: string;
  value: number;
  [key: string]: unknown;
}

// Status Pie Chart
export function StatusPieChart({ 
  data, 
  title 
}: { 
  data: StatusData[];
  title: string;
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS.gray} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string) => [value, name]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center text-sm text-gray-500 mt-2">
        Всего: {total}
      </div>
    </div>
  );
}

// Category Bar Chart  
export function CategoryBarChart({ 
  data,
  title,
}: { 
  data: CategoryData[];
  title: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={100}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [value, 'Тикетов']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Timeline Area Chart
export function TimelineChart({ 
  data,
  title,
  createdLabel = 'Создано',
  resolvedLabel = 'Решено',
}: { 
  data: { date: string; created: number; resolved: number; [key: string]: unknown }[];
  title: string;
  createdLabel?: string;
  resolvedLabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.green} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="created" 
            name={createdLabel}
            stroke={COLORS.blue} 
            fillOpacity={1} 
            fill="url(#colorCreated)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="resolved" 
            name={resolvedLabel}
            stroke={COLORS.green} 
            fillOpacity={1} 
            fill="url(#colorResolved)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Channel Distribution
export function ChannelPieChart({ 
  data,
  title,
}: { 
  data: ChannelData[];
  title: string;
}) {
  const CHANNEL_COLORS: Record<string, string> = {
    WEB: COLORS.blue,
    EMAIL: COLORS.green,
    TELEGRAM: COLORS.cyan,
    PHONE: COLORS.purple,
    WHATSAPP: COLORS.green,
  };

  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHANNEL_COLORS[entry.name] || COLORS.gray} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [value, 'Тикетов']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center text-sm text-gray-500 mt-2">
        Всего: {total}
      </div>
    </div>
  );
}

// Priority Distribution
export function PriorityBarChart({ 
  data,
  title,
}: { 
  data: { name: string; value: number; label: string }[];
  title: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: number) => [value, 'Тикетов']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || COLORS.gray} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
