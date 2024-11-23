import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Phone, Activity, CheckCircle, Clock, Clipboard, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';


const AnimatedText = () => {
  const titleLines = ["Call", "Center", "Analytics"];

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
          className="text-3xl sm:text-4xl md:text-5xl px-1 sm:px-1.5 lg:text-5xl font-bold text-[#fdcc00] flex"
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

const CallAnalysisDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

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

  const COLORS = [
    '#1a1a1a',    // Black
    '#fdcc00',    // Yellow
    '#2225C5',    // Blue
    '#4a4a4a',    // Dark Gray
    '#6c757d',    // Medium Gray
    '#94a3b8',    // Light Blue Gray
    '#e5e5e5',    // Light Gray
    '#002B50',    // Dark Blue
    '#FFD100',    // Bright Yellow
    '#4299e1'     // Bright Blue
  ];
  

  const overviewStats = [
    { title: "Total Calls", value: "1,257", icon: Phone, change: "+12.5%", description: "from last week" },
    { title: "Answer Success Rate", value: "91.4%", icon: CheckCircle, change: "+0.8%", description: "from last week" },
    { title: "Service Level", value: "89.6%", icon: Clock, change: "-0.4%", description: "from last week" },
    { title: "Dropped Calls", value: "103", icon: CreditCard, change: "-5.2%", description: "from last week" },
    { title: "Avg. Wait Time", value: "13.5 sec", icon: Clock, change: "-1.2 sec", description: "from last week" },
    { title: "Max Wait Time", value: "52.0 sec", icon: Clock, change: "-4 sec", description: "from last week" },
    { title: "Avg. Talk Time", value: "12.0 min", icon: Clipboard, change: "-0.3 min", description: "from last week" },
    { title: "After-Call Work", value: "4.1 min", icon: Clipboard, change: "+0.1 min", description: "from last week" }
  ];

  const OverviewTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {overviewStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

{/* Daily Calls Chart */}
<ChartCard title="Daily Call Volume">
  <div className="relative flex-1 w-full h-80 min-h-[400px] overflow-hidden">
    <div className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-hide">
      <div className="min-w-[800px] h-full"> {/* Minimum width to prevent squishing */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyCallData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: COLORS[3] }}
              height={50}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis 
              tickCount={6} 
              domain={[0, 'dataMax']} 
              tick={{ fontSize: 12, fill: COLORS[3] }}
              width={60}
            />
            <Tooltip 
              wrapperStyle={{ zIndex: 10 }}
              cursor={{ fill: 'transparent' }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={12}
              wrapperStyle={{
                paddingBottom: '10px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            />
            <Bar dataKey="calls" name="Calls" fill={COLORS[2]} radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="asr" name="ASR" fill={COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="sla" name="SLA" fill={COLORS[1]} radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="avgWaitTime" name="Avg. Wait Time" fill={COLORS[7]} radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="maxWaitTime" name="Max Wait Time" fill={COLORS[4]} radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="talkTime" name="Talk Time" fill={COLORS[9]} radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="afterCallWork" name="After-Call Work" fill={COLORS[5]} radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="aht" name="AHT" fill={COLORS[8]} radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="droppedCalls" name="Dropped Calls" fill={COLORS[6]} radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
</ChartCard>


    </div>
  );

  const PerformanceTab = () => (
    <div className="space-y-6">
        {/* Call Reasons and Queue Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
          {/* Call Reasons Breakdown */}
          <ChartCard title="Call Reasons Breakdown">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={callReasonData}
                    dataKey="value"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {callReasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Calls by Queue */}
          <ChartCard title="Calls by Queue">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callQueueData}>
                  <XAxis dataKey="queue" tick={{ fontSize: 12, fill: COLORS[3] }} />
                  <YAxis tickCount={6} domain={[0, 'dataMax']} tick={{ fontSize: 12, fill: COLORS[3] }} />
                  <Tooltip />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={12}
                  />
                  <Bar dataKey="calls" name="Calls" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aht" name="AHT" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

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

export default CallAnalysisDashboard;