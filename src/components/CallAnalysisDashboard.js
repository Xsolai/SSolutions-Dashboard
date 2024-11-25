"use client";
import React, { useState , useEffect} from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Phone, Activity, CheckCircle, Clock, Clipboard, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const SkeletonStatCard = () => (
  <div className="bg-white p-4 rounded-lg border border-gray-100">
    <div className="flex items-center justify-between mb-1">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
);

const SkeletonChartCard = () => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-gray-100">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
    <div className="h-60 bg-gray-200 rounded"></div>
  </div>
);

const Loading = () => {
  return (

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[...Array(2)].map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <SkeletonChartCard key={i} />
            ))}
          </div>
        </div>
  );
}

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
  '#FF3131FF'     // Bright Blue
];
// Main component with hooks properly placed
const CallAnalysisDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [callsKPIs, setCallsKPIs] = useState(null);
  const [callData, setCallData] = useState(null);
  const [weekdayData, setWeekdayData] = useState(null);
  const [callReasons, setCallReasons] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          kpisResponse, 
          callDataResponse, 
          weekdayResponse, 
          reasonsResponse,
          queueResponse
        ] = await Promise.all([
          axios.get('https://app.saincube.com/app2/calls_kpis'),
          axios.get('https://app.saincube.com/app2/call_data'),
          axios.get('https://app.saincube.com/app2/calls_kpis_weekdays'),
          axios.get('https://app.saincube.com/app2/call_reasons_breakdowns'),
          axios.get('https://app.saincube.com/app2/call_by_queue')
        ]);

        setCallsKPIs(kpisResponse.data);
        setCallData(callDataResponse.data);
        setWeekdayData(weekdayResponse.data);
        setCallReasons(reasonsResponse.data);
        setQueueData(queueResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
    // const interval = setInterval(fetchData, 30000);
    // return () => clearInterval(interval);
  }, []);
  

  const renderOverviewTab = () => {
    if (!callsKPIs || !weekdayData) return <div><Loading/></div>;

    const overviewStats = [
      { 
        title: "Total Calls", 
        value: callsKPIs.total_calls.toLocaleString(), 
        icon: Phone 
      },
      { 
        title: "Answer Success Rate", 
        value: `${callsKPIs.asr}%`, 
        icon: CheckCircle 
      },
      { 
        title: "Service Level", 
        value: `${callsKPIs.SLA}%`, 
        icon: Clock 
      },
      { 
        title: "Dropped Calls", 
        value: callsKPIs['Dropped calls'], 
        icon: CreditCard 
      },
      { 
        title: "Avg. Wait Time", 
        value: `${callsKPIs['avg wait time'].toFixed(1)} sec`, 
        icon: Clock 
      },
      { 
        title: "Max Wait Time", 
        value: `${callsKPIs['max. wait time'].toFixed(1)} sec`, 
        icon: Clock 
      },
      { 
        title: "Avg. Handling Time", 
        value: `${callsKPIs['avg handling time'].toFixed(1)} min`, 
        icon: Clipboard 
      },
      { 
        title: "After-Call Work", 
        value: `${callsKPIs['After call work time'].toFixed(1)} min`, 
        icon: Clipboard 
      }
    ];

    const formattedWeekdayData = weekdayData.map(day => ({
      date: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.weekday],
      calls: day.total_calls,
      asr: day.asr,
      sla: day.sla_percent,
      avgWaitTime: day.avg_wait_time_sec,
      maxWaitTime: day.max_wait_time_sec,
      avgHandleTime: day.avg_handling_time,
      droppedCalls: day.dropped_calls
    }));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {overviewStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <ChartCard title="Daily Call Volume">
          <div className="relative flex-1 w-full h-80 min-h-[400px] overflow-hidden">
            <div className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-hide">
              <div className="min-w-[800px] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={formattedWeekdayData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  >
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="calls" name="Total Calls" fill={COLORS[2]} maxBarSize={50} />
                    <Bar dataKey="asr" name="ASR %" fill={COLORS[0]} maxBarSize={50} />
                    <Bar dataKey="sla" name="SLA %" fill={COLORS[1]} maxBarSize={50} />
                    <Bar dataKey="avgWaitTime" name="Avg Wait Time" fill={COLORS[7]} maxBarSize={50} />
                    <Bar dataKey="maxWaitTime" name="Max Wait Time" fill={COLORS[4]} maxBarSize={50} />
                    <Bar dataKey="avgHandleTime" name="Avg Handle Time" fill={COLORS[8]} maxBarSize={50} />
                    <Bar dataKey="droppedCalls" name="Dropped Calls" fill={COLORS[6]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    );
  };

  const renderPerformanceTab = () => {
    if (!callReasons || !queueData) return <div><Loading/></div>;

    // Transform call reasons data for pie chart
    const callReasonChartData = [
      { reason: "CB SALES", value: callReasons.cb_sales },
      { reason: "GURU SALES", value: callReasons.guru_sales },
      { reason: "GURU SERVICE", value: callReasons.gurur_service },
      { reason: "WRONG CALLS", value: callReasons.wrong_calls },
      { reason: "OTHER", value: callReasons.others }
    ];

    // Transform queue data for bar chart
    const queueChartData = [
      {
        queue: "Urlaubsguru DE",
        calls: queueData["Urlaubsguru DE Calls"],
        aht: queueData["Urlaubsguru DE AHT"]
      },
      {
        queue: "Urlaubsguru AT",
        calls: queueData["Urlaubsguru AT Calls"],
        aht: queueData["Urlaubsguru AT AHT"]
      },
      {
        queue: "Guru ServiceDE",
        calls: queueData["Guru ServiceDE Calls"],
        aht: queueData["Guru ServiceDE AHT"]
      },
      {
        queue: "Guru Service",
        calls: queueData["Guru Service Calls"],
        aht: queueData["Guru Service AHT"]
      },
      {
        queue: "CB DE",
        calls: queueData["Urlaubsguru CB DE Calls"],
        aht: queueData["Urlaubsguru CB DE AHT"]
      },
      {
        queue: "CB AT",
        calls: queueData["Urlaubsguru CB AT Calls"],
        aht: queueData["Urlaubsguru CB AT AHT"]
      },
      {
        queue: "Service CH",
        calls: queueData["Guru ServiceCH Calls"],
        aht: queueData["Guru ServiceCH AHT"]
      }
    ];

    return (
      <div className="space-y-6">
                {/* Additional performance metrics if needed */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard 
            title="Total Service Calls" 
            value={(queueData["Guru Service Calls"] + queueData["Guru ServiceDE Calls"]).toLocaleString()} 
            icon={Phone} 
          />
          <StatCard 
            title="Total Sales Calls" 
            value={(queueData["Urlaubsguru DE Calls"] + queueData["Urlaubsguru AT Calls"]).toLocaleString()} 
            icon={Phone} 
          />
          <StatCard 
            title="Average Service AHT" 
            value={`${((queueData["Guru Service AHT"] + queueData["Guru ServiceDE AHT"]) / 2).toFixed(1)} min`} 
            icon={Clock} 
          />
          <StatCard 
            title="Average Sales AHT" 
            value={`${((queueData["Urlaubsguru DE AHT"] + queueData["Urlaubsguru AT AHT"]) / 2).toFixed(1)} min`} 
            icon={Clock} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Call Reasons Breakdown">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={callReasonChartData}
                    dataKey="value"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {callReasonChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Calls by Queue">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={queueChartData}>
                  <XAxis 
                    dataKey="queue" 
                    tick={{ fontSize: 12, fill: COLORS[3] }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    tick={{ fontSize: 12, fill: COLORS[3] }}
                    label={{ value: 'Total Calls', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: COLORS[3] }}
                    label={{ value: 'AHT (min)', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="calls" 
                    name="Total Calls" 
                    fill={COLORS[2]} 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="aht" 
                    name="AHT (min)" 
                    fill={COLORS[1]} 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

      </div>
    );
  };


  const tabs = [
    { id: "overview", name: "Overview" },
    { id: "performance", name: "Performance Metrics" }
  ];

  return (
    <div className="bg-gray-50 rounded-[50px]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        <div className="mb-10 px-2 pt-4 sm:mb-6 flex justify-between items-center">
          <AnimatedText />
        </div>

        <div className="border-b border-gray-200 mb-6">
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

        <div className="py-4">
          {activeTab === "overview" && renderOverviewTab()}
          {activeTab === "performance" && renderPerformanceTab()}
        </div>
      </div>
    </div>
  );
};

export default CallAnalysisDashboard;

