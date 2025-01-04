"use client";
import React, { useState , useEffect} from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, Cell } from 'recharts';
import { Inbox, Archive, Clock, Timer, Reply, Forward, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import CustomDateRangeFilter from './FilterComponent';

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



const AnimatedText = () => {
  const titleLines = ["E-Mail", "Antworten", "Analytik"];
  return (
    <div className="flex flex-col sm:flex-row space-x-0 sm:space-x-3 space-y-2 sm:space-y-0">
      {titleLines.map((line, lineIndex) => (
        <motion.div
          key={lineIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1,
            staggerChildren: 0.1,
          }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-[#fdcc00] flex flex-wrap"
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

// Stat Card component
const StatCard = ({ title, value, icon: Icon, change, description }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-100 hover:border-yellow-400 transition-all">
    <div className="flex items-center justify-between mb-1">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <div className="p-2 bg-yellow-50 rounded-lg">
        <Icon className="h-5 w-5 text-yellow-400" />
      </div>
    </div>
    <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
    {change !== undefined && description && (
      <p className="text-xs text-gray-500">
        <span className={`inline-block mr-2 ${parseFloat(change) < 0 ? 'text-blue-500' : 'text-blue-500'}`}>
          {parseFloat(change) > 0 ? '+' : ''}{parseFloat(change).toFixed(1)}%
        </span>
        {description}
      </p>
    )}
  </div>
);

// Updated ChartCard component with reduced height
const ChartCard = ({ title, children, isWideChart = false }) => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-gray-100 hover:border-yellow-400 transition-all">
    <h3 className="text-base font-medium text-gray-700 mb-6">{title}</h3>
    <div className={isWideChart ? "overflow-x-auto overflow-y-hidden scrollbar-hide" : ""}>
      <div className={isWideChart ? "min-w-[1000px] lg:min-w-full" : "w-full"}>
        <div className="h-[300px]">
          {children}
        </div>
      </div>
    </div>
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
  const [activeTab, setActiveTab] = useState('uebersicht');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    isAllTime: false
  });
  const [overviewData, setOverviewData] = useState(null);
  const [subKPIs, setSubKPIs] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const handleDropdownChange = (e) => setActiveTab(e.target.value);


  const tabs = [
    { id: "uebersicht", name: "Übersicht" },
    { id: "leistung", name: "Leistungskennzahlen" }
  ];

  // Initialize with default date range (yesterday)
  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    setDateRange({
      startDate: yesterday,
      endDate: yesterday,
      isAllTime: false
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const access_token = localStorage.getItem('access_token');
        
        // Format dates for API query
        const formatDate = (date) => {
          if (!date) return null;
          return date.toISOString().split('T')[0];
        };

        // Build query parameters
        const queryString = new URLSearchParams({
          ...(dateRange.startDate && { start_date: formatDate(dateRange.startDate) }),
          ...(dateRange.endDate && { end_date: formatDate(dateRange.endDate) }),
          include_all: dateRange.isAllTime || false
        }).toString();

        const config = {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        };

        const [overviewRes, subKPIsRes, performanceRes] = await Promise.all([
          fetch(`https://app.saincube.com/app2/email_overview?${queryString}`, config)
            .then(res => res.json()),
          fetch(`https://app.saincube.com/app2/email_overview_sub_kpis?${queryString}`, config)
            .then(res => res.json()),
          fetch(`https://app.saincube.com/app2/email_performance?${queryString}`, config)
            .then(res => res.json())
        ]);

        setOverviewData(overviewRes);
        setSubKPIs(subKPIsRes);
        setPerformanceData(performanceRes);
      } catch (error) {
        console.error('Fehler beim Datenabruf:', error);
      } finally {
        setLoading(false);
      }
    };

    if (dateRange.startDate || dateRange.endDate || dateRange.isAllTime) {
      fetchData();
    }
  }, [dateRange]);

  const handleDateRangeChange = (newRange) => {
    setDateRange({
      startDate: newRange.startDate,
      endDate: newRange.endDate,
      isAllTime: newRange.isAllTime
    });
  };



  const UebersichtTab = () => {
    if (!overviewData || !subKPIs) return <Loading/>;
    
    const bearbeitungszeitMinuten = Math.round((overviewData['Total Processing Time (sec)'] || 0) / 60);
    
    const uebersichtStats = [
      { 
        title: "Serviceniveau", 
        value: `${overviewData.service_level_gross || 0}%`,
        icon: CheckCircle,
        change: subKPIs['service_level_gross change'],
        description: "im Vergleich zur letzten Periode"
      },
      { 
        title: "Gesamte E-Mails", 
        value: (overviewData['total emails recieved'] || 0).toLocaleString(), 
        icon: Inbox,
        change: subKPIs['total emails recieved change'],
        description: "im Vergleich zur letzten Periode"
      },
      { 
        title: "Bearbeitungszeit", 
        value: `${bearbeitungszeitMinuten}m`, 
        icon: Timer,
        change: subKPIs['Total Processing Time (sec) change'],
        description: "im Vergleich zur letzten Periode"
      },
      { 
        title: "Neue Fälle", 
        value: (overviewData['total new cases'] || 0).toLocaleString(), 
        icon: Reply,
        change: subKPIs['total new cases change'],
        description: "im Vergleich zur letzten Periode"
      }
    ];
    
    // Format the data
    const formattedData = (overviewData.daily_service_level_gross || [])
      .map(item => ({
        ...item
      }))
      .reverse();
  
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {uebersichtStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
  
        <ChartCard title="Tägliche Serviceniveau-Leistung">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <XAxis
                  dataKey="date"
                  height={50}
                  angle={-45}
                  textAnchor="end"
                  tick={{ 
                    fontSize: 14,
                    fill: '#4a4a4a'
                  }}
                  axisLine={{ stroke: '#e5e5e5' }}
                  tickLine={{ stroke: '#e5e5e5' }}
                  dx={-5}
                  dy={20}
                />
                <YAxis
                  tick={{ 
                    fontSize: 14,
                    fill: '#4a4a4a'
                  }}
                  domain={[0, 100]}
                  axisLine={{ stroke: '#e5e5e5' }}
                  tickLine={{ stroke: '#e5e5e5' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-gray-900 font-medium text-base mb-1">{data.date}</p>
                          <p className="text-base text-gray-600">
                            <span>Serviceniveau: </span>
                            <span className="font-medium">{data.service_level_gross.toFixed(2)}%</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{
                    bottom: -20,
                    fontSize: '14px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="service_level_gross"
                  name="Serviceniveau"
                  stroke="#fdcc00"
                  strokeWidth={2}
                  dot={{ fill: '#fdcc00', r: 4 }}
                  activeDot={{ r: 6, fill: '#fdcc00' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    );
  };

  const LeistungTab = () => {
    if (!performanceData) return <Loading/>;
  
    const axisStyle = {
      fontSize: 12,
      fontFamily: 'Inter, sans-serif',
      fill: '#4a4a4a'
    };
  
    // Common chart configurations
    const chartConfig = {
      xAxis: {
        angle: -60,
        textAnchor: 'end',
        interval: 0,
        height:65,
        tick: { ...axisStyle },
        axisLine: { stroke: '#e5e5e5' },
        tickLine: { stroke: '#e5e5e5' },
        dx: -10
      },
      yAxis: {
        tick: { ...axisStyle },
        axisLine: { stroke: '#e5e5e5' },
        tickLine: { stroke: '#e5e5e5' }
      },
      tooltip: {
        contentStyle: {
          backgroundColor: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: '4px',
          padding: '8px 12px'
        }
      }
    };
  
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <ChartCard isWideChart={true} title="Bearbeitungszeit nach Postfach">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={performanceData.Processing_time_by_mailbox || []}
                margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
              >
                <XAxis
                  dataKey="mailbox"
                  {...chartConfig.xAxis}
                />
                <YAxis
                  {...chartConfig.yAxis}
                />
                <Tooltip {...chartConfig.tooltip} />
                <Line
                  type="monotone"
                  dataKey="processing_time_sec"
                  name="Bearbeitungszeit (Sek)"
                  stroke="#fdcc00"
                  strokeWidth={2}
                  dot={{ fill: '#fdcc00', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
  
          <ChartCard isWideChart={true} title="Serviceniveau nach Postfach">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={performanceData.service_level_by_mailbox || []}
                margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
              >
                <XAxis
                  dataKey="mailbox"
                  {...chartConfig.xAxis}
                />
                <YAxis
                  {...chartConfig.yAxis}
                  domain={[0, 100]}
                />
                <Tooltip {...chartConfig.tooltip} />
                <Line
                  type="monotone"
                  dataKey="service_level_gross"
                  name="Serviceniveau"
                  stroke="#fdcc00"
                  strokeWidth={2}
                  dot={{ fill: '#fdcc00', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
  
          <ChartCard isWideChart={true} title="Antworten nach Kunden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={performanceData.respone_by_customers || []}
                margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
              >
                <XAxis
                  dataKey="customer"
                  {...chartConfig.xAxis}
                />
                <YAxis {...chartConfig.yAxis} />
                <Tooltip {...chartConfig.tooltip} />
                <Legend wrapperStyle={{ bottom: -0 }} />
                <Bar
                  dataKey="sent"
                  name="Gesendet"
                  fill="#fdcc00"
                />
                <Bar
                  dataKey="recieved"
                  name="Empfangen"
                  fill="#ffdb4d"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-[50px]">
    <div className="max-w-full mx-auto p-4 sm:p-6">
      {/* FilterComponent accepts date range */}
      <div className="bg-white/70 p-4 rounded-xl shadow-xs mb-4">
      <CustomDateRangeFilter onFilterChange={handleDateRangeChange} />
      </div>
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          {/* Dropdown für Mobile */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={handleDropdownChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tabs für Desktop */}
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
          {activeTab === "uebersicht" && <UebersichtTab />}
          {activeTab === "leistung" && <LeistungTab />}
        </div>
      </div>
    </div>
  );
};


export default EmailAnalysisDashboard;