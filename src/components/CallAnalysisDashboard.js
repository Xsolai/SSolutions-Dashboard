"use client";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { Phone, Activity, CheckCircle, Clock, Clipboard, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import CustomDateRangeFilter from './FilterComponent';
import CompanyDropdown from './Company';

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
  const titleLines = ["Callcenter", "Zentrale", "Analytik"];

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
          {typeof change === 'number'
            ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
            : change}
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

const CallAnalysisDashboard = () => {
  const [activeTab, setActiveTab] = useState('uebersicht');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    isAllTime: false
  });
  const [selectedCompany, setSelectedCompany] = useState('');
  const [overviewData, setOverviewData] = useState(null);
  const [subKPIs, setSubKPIs] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleDropdownChange = (e) => setActiveTab(e.target.value);

  const tabs = [
    { id: "uebersicht", name: "Übersicht" },
    { id: "performance", name: "Leistungsmetriken" }
  ];

  // Add handleCompanyChange function
  const handleCompanyChange = (company) => {
    setSelectedCompany(company);
    // The data will be refetched automatically due to the useEffect dependency
  };

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

        // Build query parameters including company filter
        const queryString = new URLSearchParams({
          ...(dateRange.startDate && { start_date: formatDate(dateRange.startDate) }),
          ...(dateRange.endDate && { end_date: formatDate(dateRange.endDate) }),
          include_all: dateRange.isAllTime || false,
          ...(selectedCompany && { company: selectedCompany }) // Add company parameter
        }).toString();

        const config = {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        };

        const responses = await Promise.all([
          fetch(`https://app.saincube.com/app2/call_overview?${queryString}`, config),
          fetch(`https://app.saincube.com/app2/calls_sub_kpis?${queryString}`, config),
          fetch(`https://app.saincube.com/app2/call_performance?${queryString}`, config)
        ]);

        const [overviewRes, subKPIsRes, performanceRes] = await Promise.all(
          responses.map(res => res.json())
        );

        setOverviewData(overviewRes);
        setSubKPIs(subKPIsRes);
        setPerformanceData(performanceRes);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (dateRange.startDate || dateRange.endDate || dateRange.isAllTime) {
      fetchData();
    }
  }, [dateRange, selectedCompany]); // Add selectedCompany to dependencies

  // Initialize with default date range
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

  const handleDateRangeChange = (newRange) => {
    setDateRange({
      startDate: newRange.startDate,
      endDate: newRange.endDate,
      isAllTime: newRange.isAllTime
    });
  };
  
  const UebersichtTab = () => {
    if (loading || !overviewData || !subKPIs) return <Loading />;

    const uebersichtStats = [
      {
        title: "Gesamtanrufe",
        value: overviewData?.total_calls?.toLocaleString() || '0',
        icon: Phone,
        change: subKPIs['total_calls_change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Serviceniveau",
        value: `${overviewData?.SLA || 0}%`,
        icon: CheckCircle,
        change: subKPIs['SLA_change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "ASR",
        value: `${overviewData?.asr || 0}%`,
        icon: Activity,
        change: subKPIs['asr_change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Durchschnittliche Wartezeit",
        value: `${overviewData?.['avg wait time'] || 0} min`,
        icon: Clock,
        change: subKPIs['avg wait time_change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Maximale Wartezeit",
        value: `${overviewData?.['max. wait time'] || 0} min`,
        icon: Clock,
        change: subKPIs['max. wait time_change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Durchschnittliche Bearbeitungszeit",
        value: `${overviewData?.['avg handling time'] || 0} min`,
        icon: Clock,
        change: subKPIs['avg_handling_time_change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Nachbearbeitungszeit",
        value: `${overviewData?.['After call work time'] || 0} min`,
        icon: Clipboard,
        change: subKPIs['After call work time_change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Verlorene Anrufe",
        value: overviewData?.['Dropped calls'] || 0,
        icon: Phone,
        change: subKPIs['Dropped calls_change'],
        description: "im Vergleich zur letzten Periode"
      }
    ];

    const dailyCallData = overviewData?.['Daily Call Volume'] || [];

    // Sort dailyCallData based on the weekday (assuming "call metrics.weekday" is a string like 'Monday', 'Tuesday', etc.)
    const sortedDailyCallData = dailyCallData.sort((a, b) => {
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return daysOfWeek.indexOf(a['call metrics'].weekday) - daysOfWeek.indexOf(b['call metrics'].weekday);
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {uebersichtStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Tägliche Gesamtanrufe">
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart
                  data={sortedDailyCallData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <XAxis
                    dataKey="call metrics.weekday"  // This should match the field for weekdays
                    tick={{ fontSize: 12, fill: COLORS[3] }}
                    angle={-65}
                    textAnchor="end"
                    height={60}
                  />

                  <YAxis tick={{ fontSize: 12, fill: COLORS[3] }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="call metrics.total_calls" name="Gesamtanrufe" fill={COLORS[1]} />
                  <Bar dataKey="call metrics.answered_calls" name="Beantwortete Anrufe" fill={COLORS[2]} />
                  <Bar dataKey="call metrics.dropped_calls" name="Verlorene Anrufe" fill={COLORS[0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Tägliche Wartezeiten (Minuten)">
            <div className="h-[300px]">
              <ResponsiveContainer>
                <LineChart
                  data={sortedDailyCallData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <XAxis
                    dataKey="Time metrics.weekday"
                    tick={{ fontSize: 12, fill: COLORS[3] }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12, fill: COLORS[3] }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Time metrics.avg_wait_time_sec"
                    name="Durchschn. Wartezeit (Min)"
                    stroke={COLORS[2]}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="Time metrics.max_wait_time_sec"
                    name="Max. Wartezeit (Min)"
                    stroke={COLORS[1]}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Tägliche ASR & Serviceniveau %">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <LineChart
                data={sortedDailyCallData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <XAxis
                  dataKey="% metrics.weekday"
                  tick={{ fontSize: 12, fill: COLORS[3] }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: COLORS[3] }}
                  domain={[0, 100]}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="% metrics.asr"
                  name="ASR %"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="% metrics.sla_percent"
                  name="Serviceniveau %"
                  stroke={COLORS[1]}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    );
  };


  const PerformanceTab = () => {
    if (!performanceData) return <Loading />;

    const anrufGruende = performanceData['Call Reasons Breakdown'] || {};
    const warteschlangenDaten = performanceData['Call By queue'] || {};

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Verteilung der Anrufgründe">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(anrufGruende).map(([key, value]) => ({
                      name: key.replace(/_/g, ' ').toUpperCase(),
                      value: value || 0
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {Object.entries(anrufGruende).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Anrufe nach Warteschlange">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(warteschlangenDaten)
                    .filter(([key]) => key.includes('Calls'))
                    .map(([key, value]) => ({
                      queue: key.replace(' Calls', ''),
                      calls: value || 0,
                      aht: warteschlangenDaten[`${key.replace(' Calls', '')} AHT`] || 0
                    }))}
                >
                  <XAxis
                    dataKey="queue"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls" name="Gesamtanrufe" fill={COLORS[1]} />
                  <Bar dataKey="aht" name="DGB (Min)" fill={COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-[50px]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        {/* Updated filter section to include CompanyDropdown */}
        <div className="bg-white/70 p-4 rounded-xl shadow-xs mb-4">
          <div className="flex flex-row gap-4">
            <CustomDateRangeFilter onFilterChange={handleDateRangeChange} />
            <CompanyDropdown onCompanyChange={handleCompanyChange} />
          </div>
        </div>
        <div className="border-b border-gray-200 mb-6">
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

          <div className="hidden sm:flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${activeTab === tab.id
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
          {activeTab === "performance" && <PerformanceTab />}
        </div>
      </div>
    </div>
  );
};

export default CallAnalysisDashboard;

