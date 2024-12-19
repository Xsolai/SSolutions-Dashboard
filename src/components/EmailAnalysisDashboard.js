"use client";
import React, { useState , useEffect} from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, Cell } from 'recharts';
import { Inbox, Archive, Clock, Timer, Reply, Forward, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import FilterComponent from './FilterComponent';

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

// Add this component to your existing code
const ChartCard = ({ title, children, isWideChart = false }) => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-gray-100 hover:border-yellow-400 transition-all">
    <h3 className="text-lg font-medium text-gray-900 mb-6">{title}</h3>
    <div className={isWideChart ? "overflow-x-auto overflow-y-hidden scrollbar-hide" : ""}>
      <div className={isWideChart ? "min-w-[1200px] lg:min-w-full" : "w-full"}>
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
  const [filterType, setFilterType] = useState('yesterday');
  const [overviewData, setOverviewData] = useState(null);
  const [subKPIs, setSubKPIs] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const handleDropdownChange = (e) => setActiveTab(e.target.value);

  const tabs = [
    { id: "uebersicht", name: "Übersicht" },
    { id: "leistung", name: "Leistungskennzahlen" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const access_token = localStorage.getItem('access_token');
        const config = {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        };

        const [overviewRes, subKPIsRes, performanceRes] = await Promise.all([
          fetch(`https://app.saincube.com/app2/email_overview?filter_type=${filterType}`, config)
            .then(res => res.json()),
          fetch(`https://app.saincube.com/app2/email_overview_sub_kpis?filter_type=${filterType}`, config)
            .then(res => res.json()),
          fetch(`https://app.saincube.com/app2/email_performance?filter_type=${filterType}`, config)
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

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filterType]);

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

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {uebersichtStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <ChartCard title="Tägliche Serviceniveau-Leistung">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData.daily_service_level_gross || []}>
                <XAxis 
                  dataKey="interval" 
                  tick={{ fontSize: 12, fill: COLORS.gray }}
                  axisLine={{ stroke: COLORS.lightGray }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: COLORS.gray }}
                  domain={[0, 100]}
                  axisLine={{ stroke: COLORS.lightGray }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="service_level_gross" 
                  name="Serviceniveau"
                  fill={COLORS.chartColors[0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    );
  };

  const LeistungTab = () => {
    if (!performanceData) return <Loading/>;
  
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <ChartCard isWideChart={true} title="Bearbeitungszeit nach Postfach">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData.Processing_time_by_mailbox || []}>
                  <XAxis 
                    dataKey="mailbox" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone"
                    dataKey="processing_time_sec" 
                    name="Bearbeitungszeit (Min)" 
                    stroke={COLORS.chartColors[0]}
                    strokeWidth={2}
                    dot={{ fill: COLORS.chartColors[0], r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
  
          <ChartCard isWideChart={true} title="Serviceniveau nach Postfach">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData.service_level_by_mailbox || []}>
                  <XAxis 
                    dataKey="mailbox" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone"
                    dataKey="service_level_gross" 
                    name="Serviceniveau" 
                    stroke={COLORS.chartColors[1]}
                    strokeWidth={2}
                    dot={{ fill: COLORS.chartColors[1], r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
  
        <ChartCard isWideChart={true} title="Antworten nach Kunden">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData.respone_by_customers || []}>
                <XAxis dataKey="customer" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" name="Gesendet" fill={COLORS.chartColors[2]} />
                <Bar dataKey="recieved" name="Empfangen" fill={COLORS.chartColors[3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-[50px]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        <div className="mb-10 px-2 pt-4 sm:mb-6 flex justify-between items-center">
          <AnimatedText />
        </div>
        <FilterComponent filterType={filterType} setFilterType={setFilterType} />
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