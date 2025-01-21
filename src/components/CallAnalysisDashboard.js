"use client";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { Phone, Activity, CheckCircle, Clock, Clipboard, CreditCard } from 'lucide-react';
import CustomDateRangeFilter from './FilterComponent';
import CompanyDropdown from './Company';

// Brand Colors
const colors = {
  primary: '#F0B72F',    // SolaGelb
  dark: '#001E4A',       // SolaBlau
  gray: '#E6E2DF',       // SolaGrau
  white: '#ffffff'
};

// Chart Colors
const CHART_COLORS = [
  '#F0B72F',    // Primary (SolaGelb)
  '#001E4A',    // Secondary (SolaBlau)
  '#E6E2DF',    // Tertiary (SolaGrau)
  '#001E4A80',  // SolaBlau with opacity
  '#F0B72F80',  // SolaGelb with opacity
  '#E6E2DF80'   // SolaGrau with opacity
];

// Skeleton Components
const SkeletonStatCard = () => (
  <div className="bg-white p-4 rounded-lg border border-[#E6E2DF]">
    <div className="flex items-center justify-between mb-1">
      <div className="h-4 bg-[#E6E2DF] rounded w-1/3"></div>
      <div className="h-8 w-8 bg-[#E6E2DF] rounded-lg"></div>
    </div>
    <div className="h-8 bg-[#E6E2DF] rounded w-2/3 mb-2"></div>
    <div className="h-3 bg-[#E6E2DF] rounded w-1/2"></div>
  </div>
);

const SkeletonChartCard = () => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-[#E6E2DF]">
    <div className="h-6 bg-[#E6E2DF] rounded w-1/4 mb-6"></div>
    <div className="h-60 bg-[#E6E2DF] rounded"></div>
  </div>
);

const Loading = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
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

// Component for statistics cards
const StatCard = ({ title, value, icon: Icon, change, description }) => (
  <div className="bg-white p-4 rounded-lg border border-[#E6E2DF] hover:border-[#F0B72F] transition-all">
    <div className="flex items-center justify-between mb-1">
      <h3 className="text-[17px] leading-[27px] font-nexa-black text-[#001E4A]">{title}</h3>
      <div className="p-2 bg-[#F0B72F]/10 rounded-lg">
        <Icon className="h-5 w-5 text-[#F0B72F]" />
      </div>
    </div>
    <div className="text-[26px] leading-[36px] font-nexa-black text-[#001E4A] mb-2">{value}</div>
    {change !== undefined && description && (
      <p className="text-[15px] font-nexa-book text-[#001E4A]/70">
        <span className={`inline-block mr-2 ${parseFloat(change) < 0 ? 'text-[#001E4A]' : 'text-[#001E4A]'}`}>
          {typeof change === 'number'
            ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
            : change}
        </span>
        {description}
      </p>
    )}
  </div>
);

// Component for chart cards
const ChartCard = ({ title, children, isWideChart = false }) => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-[#E6E2DF] hover:border-[#F0B72F] transition-all">
    <h3 className="text-[20px] leading-[36px] font-nexa-black text-[#001E4A] mb-6">{title}</h3>
    <div className={isWideChart ? "overflow-x-auto overflow-y-hidden modern-scrollbar" : ""}>
      <div className={isWideChart ? "min-w-[1000px] lg:min-w-full" : "w-full"}>
        <div className="h-[300px]">
          {children}
        </div>
      </div>
    </div>
  </div>
);


// First, add the CustomTooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const formatValue = (value, name) => {
    if (typeof value !== 'number') return value;

    // Handle percentage values
    if (
      name?.toLowerCase().includes('%') ||
      name?.toLowerCase().includes('prozent') ||
      name?.toLowerCase().includes('serviceniveau') ||
      name?.toLowerCase().includes('asr')
    ) {
      return `${Number(value).toFixed(2)}%`;
    }

    // Handle time values
    if (
      name?.toLowerCase().includes('zeit') ||
      name?.toLowerCase().includes('time') ||
      name?.toLowerCase().includes('sec') ||
      name?.toLowerCase().includes('min')
    ) {
      return `${Number(value).toFixed(2)} Min`;
    }

    // Default number formatting
    return value.toLocaleString();
  };

  return (
    <div className="bg-white border border-[#E6E2DF] rounded-lg shadow-sm p-3 font-nexa-book">
      <p className="font-nexa-black text-[#001E4A] mb-2 text-sm">{label}</p>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center gap-2 py-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: item.fill || item.color || item.stroke }}
          />
          <span className="text-[#001E4A]/70 font-nexa-book text-sm">
            {item.name}:
          </span>
          <span className="text-[#001E4A] font-nexa-black text-sm">
            {formatValue(item.value, item.name)}
          </span>
        </div>
      ))}
    </div>
  );
};

// Then, update the chart configurations
const chartConfig = {
  xAxis: {
    tick: {
      fill: '#001E4A',
      fontFamily: 'Nexa-Book',
      fontSize: '12px'
    },
    axisLine: { stroke: '#E6E2DF' }
  },
  yAxis: {
    tick: {
      fill: '#001E4A',
      fontFamily: 'Nexa-Book',
      fontSize: '12px'
    },
    axisLine: { stroke: '#E6E2DF' },
    grid: { stroke: '#E6E2DF', strokeDasharray: '3 3' }
  },
  legend: {
    wrapperStyle: {
      fontFamily: 'Nexa-Book',
      fontSize: '14px',
      paddingTop: '10px'
    }
  }
};

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

  // Initialize with current date
  useEffect(() => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    setDateRange({
      startDate: currentDate,
      endDate: currentDate,
      isAllTime: false
    });
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const access_token = localStorage.getItem('access_token');

      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const queryString = new URLSearchParams({
        ...(dateRange.startDate && { start_date: formatDate(dateRange.startDate) }),
        ...(dateRange.endDate && { end_date: formatDate(dateRange.endDate) }),
        include_all: dateRange.isAllTime || false,
        ...(selectedCompany && { company: selectedCompany })
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


  useEffect(() => {
    if (dateRange.startDate || dateRange.endDate || dateRange.isAllTime) {
      fetchData();
    }
  }, [dateRange, selectedCompany]);


  const handleDateRangeChange = (newRange) => {
    setDateRange({
      startDate: newRange.startDate,
      endDate: newRange.endDate,
      isAllTime: newRange.isAllTime
    });
  };

  // Updated brand-aligned colors
  const chartColors = {
    primary: '#F0B72F',      // SolaGelb
    secondary: '#001E4A',    // SolaBlau
    tertiary: '#E6E2DF',     // SolaGrau
    primaryLight: '#F0B72F80',  // SolaGelb with opacity
    secondaryLight: '#001E4A80', // SolaBlau with opacity
    tertiaryLight: '#E6E2DF80'   // SolaGrau with opacity
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
        value: `${overviewData?.['avg wait time (min)'] || 0}`,
        icon: Clock,
        change: subKPIs['avg wait time_change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Maximale Wartezeit",
        value: `${overviewData?.['max. wait time (min)'] || 0}`,
        icon: Clock,
        change: subKPIs['max. wait time_change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Durchschnittliche Bearbeitungszeit",
        value: `${overviewData?.['avg handling time (min)'] || 0}`,
        icon: Clock,
        change: subKPIs['avg_handling_time_change'],
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
                  <XAxis {...chartConfig.xAxis} dataKey="call metrics.weekday"  />
                  <YAxis {...chartConfig.yAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend {...chartConfig.legend} />
                  <Bar
                    dataKey="call metrics.total_calls"
                    name="Gesamtanrufe"
                    fill={chartColors.primary}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="call metrics.answered_calls"
                    name="Beantwortete Anrufe"
                    fill={chartColors.secondary}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="call metrics.dropped_calls"
                    name="Verlorene Anrufe"
                    fill={chartColors.tertiary}
                    radius={[4, 4, 0, 0]}
                  />
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
                  <XAxis {...chartConfig.xAxis}                     dataKey="Time metrics.weekday"                  />
                  <YAxis {...chartConfig.yAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend {...chartConfig.legend} />
                  <Line
                    type="monotone"
                    dataKey="Time metrics.avg_wait_time_sec"
                    name="Durchschn. Wartezeit (Min)"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.primary, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Time metrics.max_wait_time_sec"
                    name="Max. Wartezeit (Min)"
                    stroke={chartColors.secondary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.secondary, r: 4 }}
                    activeDot={{ r: 6 }}
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
                <XAxis {...chartConfig.xAxis}                   dataKey="% metrics.weekday" />
                <YAxis {...chartConfig.yAxis} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend {...chartConfig.legend} />
                <Line
                  type="monotone"
                  dataKey="% metrics.asr"
                  name="ASR %"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="% metrics.sla_percent"
                  name="Serviceniveau %"
                  stroke={chartColors.secondary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.secondary, r: 4 }}
                  activeDot={{ r: 6 }}
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

    // Transform data for calls per queue
    const callsPerQueue = Object.entries(warteschlangenDaten)
      .filter(([key]) => key.includes('Calls'))
      .map(([key, value]) => ({
        queue: key.replace(' Calls', ''),
        calls: value || 0
      }));

    // Transform data for minutes per queue
    const minutesPerQueue = Object.entries(warteschlangenDaten)
      .filter(([key]) => key.includes('Calls'))
      .map(([key, value]) => ({
        queue: key.replace(' Calls', ''),
        minutes: warteschlangenDaten[`${key.replace(' Calls', '')} AHT`] || 0
      }));

    // Define an array of colors for pie chart sections
    const pieColors = [
      chartColors.primary,     // SolaGelb
      chartColors.secondary,   // SolaBlau
      chartColors.tertiary,    // SolaGrau
      chartColors.primaryLight,   // SolaGelb with opacity
      chartColors.secondaryLight, // SolaBlau with opacity
      chartColors.tertiaryLight  // SolaGrau with opacity
    ];


    return (
      <div className="space-y-6">
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
                    <Cell
                      key={`cell-${index}`}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'Nexa-Book',
                    fontSize: '14px',
                    bottom: 35,
                    color: chartColors.secondary  // Added text color
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <ChartCard isWideChart={true} title="Anrufe nach Warteschlange">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={callsPerQueue}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <XAxis
                    dataKey="queue"
                    tick={{
                      fill: '#001E4A',
                      fontSize: '12px',
                      fontFamily: 'Nexa-Book'
                    }}
                    angle={-65}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{
                      fill: '#001E4A',
                      fontSize: '12px',
                      fontFamily: 'Nexa-Book'
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      fontFamily: 'Nexa-Book',
                      fontSize: '14px',
                      bottom: 20
                    }}
                  />
                  <Bar
                    dataKey="calls"
                    name="Gesamtanrufe"
                    fill="#F0B72F"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard isWideChart={true} title="Minuten nach Warteschlange">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={minutesPerQueue}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <XAxis
                    dataKey="queue"
                    tick={{
                      fill: '#001E4A',
                      fontSize: '12px',
                      fontFamily: 'Nexa-Book'
                    }}
                    angle={-65}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{
                      fill: '#001E4A',
                      fontSize: '12px',
                      fontFamily: 'Nexa-Book'
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      fontFamily: 'Nexa-Book',
                      fontSize: '14px',
                      bottom: 20
                    }}
                  />
                  <Bar
                    dataKey="minutes"
                    name="DGB (Min)"
                    fill="#001E4A"
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


  return (
    <div className="bg-[#E6E2DF]/10 rounded-[50px]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        <div className="bg-white/70 p-4 rounded-xl shadow-sm mb-6">
          <div className="flex flex-row gap-4">
            <CustomDateRangeFilter onFilterChange={handleDateRangeChange} />
            <CompanyDropdown onCompanyChange={handleCompanyChange} />
          </div>
        </div>

        <div className="border-b border-[#E6E2DF] mb-6">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={handleDropdownChange}
              className="w-full px-4 py-2 text-[17px] leading-[27px] font-nexa-book text-[#001E4A] border border-[#E6E2DF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F0B72F] focus:border-[#F0B72F]"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.name}</option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                px-6 py-3 text-[17px] leading-[27px] font-nexa-black 
                transition-all duration-200 border-b-2
                ${activeTab === tab.id
                    ? "text-[#001E4A] border-[#F0B72F]"
                    : "text-[#001E4A]/70 border-transparent hover:text-[#001E4A] hover:border-[#F0B72F]/50"
                  }
              `}
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