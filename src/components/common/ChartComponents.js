import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { chartConfig } from '@/utils/dashboardUtils';

// Moderne Tooltip-Komponente
export const ModernTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-[#E6E2DF]">
      <p className="text-[#001E4A] font-nexa-heavy mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#001E4A] font-nexa-book">
            {entry.name}: {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// Moderne Legende-Komponente
export const ModernLegend = ({ payload }) => {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#001E4A] font-nexa-book text-sm">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Wiederverwendbare Balkendiagramm-Komponente
export const ModernBarChart = ({ data, xKey, yKey, title }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={chartConfig.margins.default}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.colors.background} opacity={0.4} />
        <XAxis
          dataKey={xKey}
          tick={{
            fill: chartConfig.colors.secondary,
            fontSize: chartConfig.fonts.sizes.medium,
            fontFamily: chartConfig.fonts.family
          }}
        />
        <YAxis
          tick={{
            fill: chartConfig.colors.secondary,
            fontSize: chartConfig.fonts.sizes.medium,
            fontFamily: chartConfig.fonts.family
          }}
        />
        <Tooltip content={<ModernTooltip />} />
        <Legend content={<ModernLegend />} />
        <Bar
          dataKey={yKey}
          fill={chartConfig.colors.primary}
          radius={[8, 8, 0, 0]}
          animationDuration={1200}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Wiederverwendbare Liniendiagramm-Komponente
export const ModernLineChart = ({ data, xKey, yKey, title }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={chartConfig.margins.default}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.colors.background} opacity={0.4} />
        <XAxis
          dataKey={xKey}
          tick={{
            fill: chartConfig.colors.secondary,
            fontSize: chartConfig.fonts.sizes.medium,
            fontFamily: chartConfig.fonts.family
          }}
        />
        <YAxis
          tick={{
            fill: chartConfig.colors.secondary,
            fontSize: chartConfig.fonts.sizes.medium,
            fontFamily: chartConfig.fonts.family
          }}
        />
        <Tooltip content={<ModernTooltip />} />
        <Legend content={<ModernLegend />} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={chartConfig.colors.primary}
          strokeWidth={3}
          dot={{ fill: chartConfig.colors.primary, r: 6, strokeWidth: 2 }}
          activeDot={{ r: 8 }}
          animationDuration={1200}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Wiederverwendbare Kreisdiagramm-Komponente
export const ModernPieChart = ({ data, nameKey, valueKey }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={chartConfig.margins.default}>
        <Pie
          data={data}
          nameKey={nameKey}
          dataKey={valueKey}
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={40}
          labelLine={false}
          label={({ name, percent, value }) => {
            if (percent < 0.05) return '';
            return `${name}: ${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`;
          }}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={Object.values(chartConfig.colors)[index % Object.values(chartConfig.colors).length]}
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<ModernTooltip />} />
        <Legend content={<ModernLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Chart-Gradienten-Komponente
export const ChartGradients = () => (
  <defs>
    <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={chartConfig.colors.primary} stopOpacity={0.8} />
      <stop offset="95%" stopColor={chartConfig.colors.primary} stopOpacity={0.2} />
    </linearGradient>
    <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={chartConfig.colors.secondary} stopOpacity={0.8} />
      <stop offset="95%" stopColor={chartConfig.colors.secondary} stopOpacity={0.2} />
    </linearGradient>
  </defs>
);

// Loading Components
export const SkeletonStatCard = () => (
  <div className="bg-white p-4 rounded-lg border border-[#E6E2DF] animate-pulse">
    <div className="flex items-center justify-between mb-1">
      <div className="h-4 bg-[#E6E2DF] rounded w-1/3"></div>
      <div className="h-8 w-8 bg-[#E6E2DF] rounded-lg"></div>
    </div>
    <div className="h-8 bg-[#E6E2DF] rounded w-2/3 mb-2"></div>
    <div className="h-3 bg-[#E6E2DF] rounded w-1/2"></div>
  </div>
);

export const SkeletonChartCard = () => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-[#E6E2DF] animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="h-6 bg-[#E6E2DF] rounded w-1/4"></div>
      <div className="flex gap-2">
        <div className="h-10 w-10 bg-[#E6E2DF] rounded-lg"></div>
        <div className="h-10 w-10 bg-[#E6E2DF] rounded-lg"></div>
      </div>
    </div>
    <div className="h-60 bg-gradient-to-br from-[#E6E2DF] to-[#E6E2DF]/50 rounded-lg"></div>
  </div>
);

export const Loading = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <SkeletonChartCard key={i} />
      ))}
    </div>
  </div>
); 