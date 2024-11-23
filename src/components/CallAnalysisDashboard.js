"use client";
import React from 'react';
import { useVisibility } from "@/context/VisibilityContext";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Phone, Activity, CheckCircle, Clock, Clipboard, CreditCard } from 'lucide-react';

// Modern color palette
const colors = {
  pprimary: '#002B50',    // Dark Blue
  secondary: '#FFD100',  // Yellow
  success: '#10B981',    // Keep success green for clarity
  warning: '#FFD100',    // Yellow for warnings
  danger: '#EF4444',     // Keep red for danger
  info: '#002B50',       // Dark Blue
  background: '#FFFFFF', // White
  card: '#F8F9FA',      // Light gray
  text: '#001E4A',       // Dark Blue
  textMuted: '#6C757D',  // Muted text
  border: '#DEE2E6'    // Border color
};


const StatCard = ({ title, value, icon: Icon, change, description, variant = 'default' }) => (
  <div className={`relative overflow-hidden bg-white
    rounded-lg p-6 border border-gray-200 shadow-sm
    hover:border-yellow-400 transition-all duration-300 group
    ${variant === 'warning' ? 'bg-yellow-50' :
      variant === 'danger' ? 'bg-red-50' :
        variant === 'success' ? 'bg-emerald-50' : ''}`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${
        variant === 'warning' ? 'text-yellow-400' :
        variant === 'danger' ? 'text-red-500' :
        variant === 'success' ? 'text-emerald-500' :
        'text-blue-900'
      }`} />
    </div>
    <div className="text-3xl font-bold text-blue-900 mb-3">{value}</div>
    <p className="text-xs text-gray-600">
      <span className={`inline-block mr-2 ${change.includes('-') ? 'text-emerald-600' : 'text-red-600'}`}>
        {change}
      </span>
      {description}
    </p>
  </div>
);


const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-lg p-6 border border-gray-200 
    shadow-sm hover:border-yellow-400 transition-all duration-300">
    <h3 className="text-lg font-medium text-blue-900 mb-6">{title}</h3>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-xl">
        <p className="text-slate-200 font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-slate-400">
            {entry.name}: <span className="text-slate-200">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CallAnalysisDashboard = () => {
  const { visibility } = useVisibility(); // Consume the visibility context

  // Conditional rendering based on visibility
  if (!visibility.callAnalysis) return null;


  const dailyCallData = [
    { date: "Mon", calls: 145, asr: 92.3, sla: 87.4, avgWaitTime: 14.2, maxWaitTime: 45, talkTime: 12.3, afterCallWork: 4.5, droppedCalls: 12, aht: 16.8 },
    { date: "Tue", calls: 232, asr: 88.7, sla: 85.2, avgWaitTime: 16.5, maxWaitTime: 52, talkTime: 14.1, afterCallWork: 5.2, droppedCalls: 23, aht: 19.3 },
    { date: "Wed", calls: 186, asr: 90.5, sla: 89.1, avgWaitTime: 13.8, maxWaitTime: 41, talkTime: 11.9, afterCallWork: 3.8, droppedCalls: 18, aht: 15.7 },
    { date: "Thu", calls: 264, asr: 91.2, sla: 92.3, avgWaitTime: 12.9, maxWaitTime: 38, talkTime: 13.4, afterCallWork: 4.3, droppedCalls: 21, aht: 17.7 },
    { date: "Fri", calls: 198, asr: 89.8, sla: 88.7, avgWaitTime: 15.1, maxWaitTime: 47, talkTime: 12.8, afterCallWork: 4.9, droppedCalls: 16, aht: 17.7 },
    { date: "Sat", calls: 134, asr: 93.4, sla: 91.5, avgWaitTime: 11.7, maxWaitTime: 32, talkTime: 10.6, afterCallWork: 3.2, droppedCalls: 8, aht: 13.8 },
    { date: "Sun", calls: 98, asr: 94.1, sla: 93.2, avgWaitTime: 10.4, maxWaitTime: 27, talkTime: 9.2, afterCallWork: 2.7, droppedCalls: 5, aht: 11.9 }
  ];

  const callQueueData = [
    { queue: "Urlaubsguru DE", calls: 1250, aht: 18.2 },
    { queue: "GURU FTI", calls: 932, aht: 17.6 },
    { queue: "Partner Verkauf", calls: 743, aht: 16.9 },
    { queue: "Vertrieb", calls: 634, aht: 15.8 },
    { queue: "Service", calls: 521, aht: 14.3 },
    { queue: "Backoffice", calls: 412, aht: 13.2 }
  ];

  const callReasonData = [
    { reason: "CB SALES", value: 340 },
    { reason: "WRONG CALL", value: 210 },
    { reason: "GURU SALES", value: 178 },
    { reason: "GURU SERVICE", value: 132 },
    { reason: "OTHER", value: 94 }
  ];

  const totalCalls = dailyCallData.reduce((sum, day) => sum + day.calls, 0);
  const totalAsr = dailyCallData.reduce((sum, day) => sum + day.asr, 0) / dailyCallData.length;
  const totalSla = dailyCallData.reduce((sum, day) => sum + day.sla, 0) / dailyCallData.length;
  const totalAvgWaitTime = dailyCallData.reduce((sum, day) => sum + day.avgWaitTime, 0) / dailyCallData.length;
  const totalMaxWaitTime = dailyCallData.reduce((max, day) => Math.max(max, day.maxWaitTime), 0);
  const totalCallsByQueue = callQueueData.reduce((sum, queue) => sum + queue.calls, 0);
  const totalTalkTime = dailyCallData.reduce((sum, day) => sum + day.talkTime, 0) / dailyCallData.length;
  const totalAfterCallWork = dailyCallData.reduce((sum, day) => sum + day.afterCallWork, 0) / dailyCallData.length;
  const totalAht = dailyCallData.reduce((sum, day) => sum + day.aht, 0) / dailyCallData.length;

  const getSLAVariant = (value) => {
    if (value >= 90) return 'success';
    if (value >= 80) return 'warning';
    return 'danger';
  };


  const stats = [
    {
      title: "Total Calls",
      value: totalCalls.toLocaleString(),
      icon: Phone,
      change: "+12.5%",
      description: "from last week"
    },
    {
      title: "Call Reasons",
      value: callReasonData.length,
      icon: Activity,
      change: "-2.1%",
      description: "from last week"
    },
    {
      title: "Answer Success Rate",
      value: totalAsr.toFixed(1) + "%",
      icon: CheckCircle,
      change: "+0.8%",
      description: "from last week"
    },
    {
      title: "Service Level",
      value: totalSla.toFixed(1) + "%",
      icon: Clock,
      change: "-0.4%",
      description: "from last week"
    },
    {
      title: "Avg. Wait Time",
      value: totalAvgWaitTime.toFixed(1) + " sec",
      icon: Clock,
      change: "-1.2 sec",
      description: "from last week"
    },
    {
      title: "Max Wait Time",
      value: totalMaxWaitTime.toFixed(1) + " sec",
      icon: Clock,
      change: "-4 sec",
      description: "from last week"
    },
    {
      title: "Calls by Queue",
      value: totalCallsByQueue.toLocaleString(),
      icon: Phone,
      change: "+7.3%",
      description: "from last week"
    },
    {
      title: "Avg. Talk Time",
      value: totalTalkTime.toFixed(1) + " min",
      icon: Clipboard,
      change: "-0.3 min",
      description: "from last week"
    },
    {
      title: "Avg. After-Call Work",
      value: totalAfterCallWork.toFixed(1) + " min",
      icon: Clipboard,
      change: "+0.1 min",
      description: "from last week"
    },
    {
      title: "Avg. Handling Time",
      value: totalAht.toFixed(1) + " min",
      icon: Clipboard,
      change: "-0.2 min",
      description: "from last week"
    },
    {
      title: "Dropped Calls",
      value: dailyCallData.reduce((sum, day) => sum + day.droppedCalls, 0).toLocaleString(),
      icon: CreditCard,
      change: "-5.2%",
      description: "from last week"
    }
  ];

  const COLORS = ['#002B50', '#FFD100', '#10B981', '#6C757D', '#4B5563', '#94A3B8', '#E5E7EB', '#4B5563', '#FFD100', '#EF4444'];

  return (
    <div className="min-h-screen bg-gray-50 p-6 px-2 sm:px-6 md:p-8 lg:p-12">
      <div className="space-y-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-[#fdcc00]">Call Center Analytics</h1>
          <p className="text-[#001E4A]">Monitor your call center performance metrics and team efficiency in real-time</p>
        </div>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Daily Calls Chart */}
        <ChartCard title="Daily Call Volume">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyCallData}>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis tickCount={6} domain={[0, 'dataMax']} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <Tooltip />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={12}
                  formatter={(value) => (
                    <span className="text-sm text-gray-300">{value}</span>
                  )}
                />
                <Bar dataKey="calls" name="Calls" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="asr" name="ASR" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sla" name="SLA" fill="#FDE047" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgWaitTime" name="Avg. Wait Time" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maxWaitTime" name="Max Wait Time" fill="#6B7280" radius={[4, 4, 0, 0]} />
                <Bar dataKey="talkTime" name="Talk Time" fill="#4B5563" radius={[4, 4, 0, 0]} />
                <Bar dataKey="afterCallWork" name="After-Call Work" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="aht" name="AHT" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="droppedCalls" name="Dropped Calls" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Call Reasons Breakdown and Calls by Queue */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          {/* Call Reasons Breakdown */}
          <ChartCard title="Call Reasons Breakdown">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={callReasonData}
                    dataKey="value"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    label
                  >
                    {callReasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Calls by Queue */}
          <ChartCard title="Calls by Queue">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callQueueData}>
                  <XAxis dataKey="queue" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis tickCount={6} domain={[0, 'dataMax']} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <Tooltip />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={12}
                    formatter={(value) => (
                      <span className="text-sm text-gray-300">{value}</span>
                    )}
                  />
                  <Bar dataKey="calls" name="Calls" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aht" name="AHT" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default CallAnalysisDashboard;