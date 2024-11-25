"use client";
import React, { useState , useEffect} from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, Cell } from 'recharts';
import { Inbox, Archive, Clock, Timer, Reply, Forward, CheckCircle } from 'lucide-react';
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



const getBarColor = (sla) => {
  if (sla <= 1000) return COLORS.chartColors[1];  // Primary Yellow
  if (sla >= 1000) return COLORS.chartColors[0];  // Dark Blue
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
  const [emailData, setEmailData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [emailResponse, overviewResponse, performanceResponse] = await Promise.all([
          axios.get('http://https://app.saincube.com/app2/email-data'),
          axios.get('http://https://app.saincube.com/app2/email_overview'),
          axios.get('http://https://app.saincube.com/app2/email_performance_metrics')
        ]);

        setEmailData(emailResponse.data);
        setOverviewData(overviewResponse.data);
        setPerformanceData(performanceResponse.data);
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

  const OverviewTab = () => {
    if (!emailData || !overviewData) return <div><Loading/></div>;

    const overviewStats = [
      { 
        title: "24h Service Level", 
        value: `${emailData['SL Gross'].toFixed(1)}%`,
        icon: CheckCircle
      },
      { 
        title: "Total Emails", 
        value: overviewData['total emails recieved'].toLocaleString(), 
        icon: Inbox
      },
      { 
        title: "Processing Time", 
        value: `${(overviewData['Total Processing Time (sec)'] / 60).toFixed(1)}m`, 
        icon: Timer
      },
      { 
        title: "New Cases", 
        value: overviewData['total new cases'].toLocaleString(), 
        icon: Reply
      }
    ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {overviewStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <ChartCard title="Daily Service Level Performance">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData.daily_service_level_gross}>
                <XAxis 
                  dataKey="interval" 
                  tick={{ fontSize: 12, fill: COLORS.gray }}
                  axisLine={{ stroke: COLORS.lightGray }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: COLORS.gray }}
                  domain={[0, 'auto']}
                  axisLine={{ stroke: COLORS.lightGray }}
                  label={{ 
                    value: 'Service Level (%)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: COLORS.gray
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="service_level_gross" 
                  name="Service Level"
                  fill={COLORS.chartColors[0]}
                >
                  {overviewData.daily_service_level_gross.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry.service_level_gross)}
                    />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey={() => 95} 
                  stroke={COLORS.chartColors[0]}
                  strokeDasharray="3 3" 
                  name="Target (95%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    );
  };

  const PerformanceTab = () => {
    if (!performanceData) return <div><Loading/></div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Processing Time by Mailbox">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData.Processing_time_by_mailbox}>
                  <XAxis dataKey="mailbox" tick={{ fontSize: 12, fill: COLORS.gray }} angle={-45} textAnchor="end" height={100} />
                  <YAxis 
                    tick={{ fontSize: 12, fill: COLORS.gray }}
                    label={{ 
                      value: 'Processing Time (sec)', 
                      angle: -90, 
                      position: 'insideLeft' 
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="processing_time_sec" 
                    name="Processing Time" 
                    fill={COLORS.chartColors[0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Service Level by Mailbox">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData.service_level_by_mailbox}>
                  <XAxis dataKey="mailbox" tick={{ fontSize: 12, fill: COLORS.gray }} angle={-45} textAnchor="end" height={100} />
                  <YAxis 
                    domain={[0, 'auto']} 
                    tick={{ fontSize: 12, fill: COLORS.gray }}
                    label={{ 
                      value: 'Service Level (%)', 
                      angle: -90, 
                      position: 'insideLeft' 
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="service_level_gross" 
                    name="Service Level" 
                    fill={COLORS.chartColors[1]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Mailbox Response Metrics">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData.respone_by_mailbox}>
                <XAxis dataKey="mailbox" tick={{ fontSize: 12, fill: COLORS.gray }} angle={-45} textAnchor="end" height={100} />
                <YAxis tick={{ fontSize: 12, fill: COLORS.gray }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="sent" 
                  name="Replies" 
                  fill={COLORS.chartColors[2]} 
                />
                <Bar 
                  dataKey="forwarded" 
                  name="Forwards" 
                  fill={COLORS.chartColors[3]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
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