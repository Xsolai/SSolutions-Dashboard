import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, Cell } from 'recharts';
import { Inbox, Archive, Clock, Timer, Reply, Forward, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Color theme for consistency
const COLORS = {
  primary: '#002B50',    // Main Yellow
  secondary: '#FFE55C',  // Light Yellow
  accent: '#FFD700',     // Gold Yellow
  dark: '#1a1a1a',       // Black
  darkBlue: '#002B50',   // Dark Blue
  gray: '#4a4a4a',       // Dark Gray
  lightGray: '#94a3b8',  // Light Gray
  chartColors: [
    '#fdcc00',  // Primary Yellow
    '#002B50',    // Dark Blue
    '#fdcc00',    // Yellow
    '#002B50',    // Dark Blue
  ]
};

// Sample data
const emailData = [
  { date: '2024-03-01', sla: 96.5, volume: 245 },
  { date: '2024-03-02', sla: 94.2, volume: 212 },
  { date: '2024-03-03', sla: 97.8, volume: 198 },
  { date: '2024-03-04', sla: 93.1, volume: 256 },
  { date: '2024-03-05', sla: 91.4, volume: 278 },
  { date: '2024-03-06', sla: 95.9, volume: 234 },
  { date: '2024-03-07', sla: 98.2, volume: 198 }
];

const mailboxData = [
  { name: 'Support', sla: 96.5, processingTime: 12, replies: 156, forwards: 23 },
  { name: 'Sales', sla: 94.2, processingTime: 8, replies: 98, forwards: 45 },
  { name: 'Billing', sla: 97.8, processingTime: 15, replies: 78, forwards: 12 },
  { name: 'Partners', sla: 93.1, processingTime: 18, replies: 67, forwards: 34 }
];

// Calculate averages
const avgSLA = emailData.reduce((acc, curr) => acc + curr.sla, 0) / emailData.length;
const avgVolume = Math.round(emailData.reduce((acc, curr) => acc + curr.volume, 0) / emailData.length);
const avgProcessingTime = Math.round(mailboxData.reduce((acc, curr) => acc + curr.processingTime, 0) / mailboxData.length);

const getBarColor = (sla) => {
  if (sla >= 95) return COLORS.chartColors[0];  // Primary Yellow
  if (sla >= 85) return COLORS.chartColors[1];  // Dark Blue
  return COLORS.primary;                        // Dark Blue
};


const AnimatedText = () => {
  const titleLines = ["Email", "Response", "Analytics"];

  return (
    <div className="inline-flex">
      {titleLines.map((line, lineIndex) => (
        <motion.div
          key={lineIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1,
            staggerChildren: 0.1,
          }}
          className="text-2xl sm:text-4xl md:text-4xl px-1 sm:px-1.5 lg:text-5xl font-bold text-[#fdcc00] flex"
        >
          {line.split("").map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1 + lineIndex * 0.5,
              }}
              className="block"
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, change, description }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-100 hover:border-yellow-400 transition-all">
    <div className="flex items-center justify-between mb-1">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <div className="p-2 bg-yellow-50 rounded-lg">
        <Icon className="h-5 w-5 text-yellow-400" />
      </div>
    </div>
    <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
    {change && description && (
      <p className="text-xs text-gray-500">
        <span className={`inline-block mr-2 ${change.includes('-') ? 'text-blue-500' : 'text-blue-500'}`}>
          {change}
        </span>
        {description}
      </p>
    )}
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-gray-100 hover:border-yellow-400 transition-all">
    <h3 className="text-lg font-medium text-gray-900 mb-6">{title}</h3>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xl">
        <p className="text-gray-900 font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-gray-600">
            {entry.name}: {entry.value}
            {entry.dataKey === 'sla' ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EmailAnalysisDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const overviewStats = [
    { title: "24h Service Level", value: `${avgSLA.toFixed(1)}%`, icon: CheckCircle, change: `${(avgSLA - 94.5).toFixed(1)}%`, description: "vs. target (95%)" },
    { title: "Daily Volume", value: avgVolume, icon: Inbox, change: "+12.5%", description: "vs. last week" },
    { title: "Processing Time", value: `${avgProcessingTime} min`, icon: Timer, change: "-2.3 min", description: "vs. last week" },
    { title: "Response Rate", value: "92.8%", icon: Reply, change: "+3.2%", description: "vs. last week" }
  ];

  const OverviewTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {overviewStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

{/* Charts with matched colors */}
<ChartCard title="Daily Service Level Performance">
  <div className="h-[400px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={emailData}>
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12, fill: COLORS.gray }}
          axisLine={{ stroke: COLORS.lightGray }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: COLORS.gray }}
          domain={[80, 100]}
          axisLine={{ stroke: COLORS.lightGray }}
          label={{ 
            value: 'Service Level (%)', 
            angle: -90, 
            position: 'insideLeft', 
            fill: COLORS.gray
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ 
            paddingTop: '20px',
            color: COLORS.dark
          }}
        />
        <Bar dataKey="sla" name="24h Service Level">
          {emailData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getBarColor(entry.sla)}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
        <Line 
          type="monotone" 
          dataKey={() => 95} 
          stroke={COLORS.chartColors[0]}  // Primary Yellow
          strokeDasharray="3 3" 
          name="Target (95%)"
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</ChartCard>
    </div>
  );

  const PerformanceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Processing Time by Mailbox">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mailboxData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.gray }} />
                <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={12} />
                <Bar 
                  dataKey="processingTime" 
                  name="Processing Time" 
                  fill={COLORS.chartColors[0]} 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Service Level by Mailbox">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mailboxData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.gray }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: COLORS.gray }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={12} />
                <Bar 
                  dataKey="sla" 
                  name="Service Level" 
                  fill={COLORS.chartColors[1]} 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Mailbox Response Metrics">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mailboxData}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.gray }} />
              <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={12} />
              <Bar 
                dataKey="replies" 
                name="Replies" 
                fill={COLORS.chartColors[2]} 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="forwards" 
                name="Forwards" 
                fill={COLORS.chartColors[3]} 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );

  const tabs = [
    { id: "overview", name: "Overview" },
    { id: "performance", name: "Performance Metrics" }
  ];

  return (
    <div className="bg-gray-50 rounded-[50px]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-10 px-2 pt-4 sm:mb-6 flex justify-between items-center">
          <AnimatedText />
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          {/* Dropdown for Mobile */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tabs for Desktop */}
          <div className="hidden sm:flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? "text-black border-yellow-400"
                    : "text-gray-500 border-transparent hover:text-black hover:border-yellow-300"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="py-4">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "performance" && <PerformanceTab />}
        </div>
      </div>
    </div>
  );
};

export default EmailAnalysisDashboard;