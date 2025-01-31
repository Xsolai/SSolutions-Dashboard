"use client";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell , CartesianGrid} from 'recharts';
import { Users, Inbox, CircleCheck, TriangleAlert, Circle } from 'lucide-react';
import CustomDateRangeFilter from './FilterComponent';
import CompanyDropdown from './Company';

// Brand Colors
const chartColors = {
  primary: '#F0B72F',      // SolaGelb
  secondary: '#001E4A',    // SolaBlau
  tertiary: '#E6E2DF',     // SolaGrau
  primaryLight: '#F0B72F80',  // SolaGelb with opacity
  secondaryLight: '#001E4A80', // SolaBlau with opacity
  tertiaryLight: '#E6E2DF80'   // SolaGrau with opacity
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const formatValue = (value, name) => {
    if (typeof value !== 'number') return value;

    // Handle percentages
    if (name?.toLowerCase().includes('%') || 
        name?.toLowerCase().includes('rate') || 
        name?.toLowerCase().includes('niveau')) {
      return `${Number(value).toFixed(2)}%`;
    }

    // Handle time values
    if (name?.toLowerCase().includes('zeit') || 
        name?.toLowerCase().includes('time') || 
        name?.toLowerCase().includes('duration')) {
      if (value > 60) {
        return `${(value / 60).toFixed(2)} Min`;
      }
      return `${Number(value).toFixed(2)} Min`;
    }

    // Handle integers
    if (value % 1 === 0) {
      return value.toLocaleString('de-DE');
    }

    // Handle decimals
    return Number(value).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="bg-white border border-[#E6E2DF] rounded-lg shadow-sm p-4">
      <div className="font-nexa-black text-[#001E4A] mb-3 text-sm border-b border-[#E6E2DF] pb-2">
        {label}
      </div>
      <div className="space-y-2">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: item.fill || item.color || item.stroke }}
            />
            <span className="text-[#001E4A]/70 font-nexa-book text-sm min-w-[120px]">
              {item.name}:
            </span>
            <span className="text-[#001E4A] font-nexa-black text-sm">
              {formatValue(item.value, item.name)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading Components
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


// Chart Configuration
const chartConfig = {
  xAxis: {
    tick: { 
      fill: '#001E4A', 
      fontSize: '12px',
      fontFamily: 'Nexa-Book'
    },
    axisLine: { stroke: '#E6E2DF' }
  },
  yAxis: {
    tick: { 
      fill: '#001E4A', 
      fontSize: '12px',
      fontFamily: 'Nexa-Book'
    },
    axisLine: { stroke: '#E6E2DF' },
    grid: { stroke: '#E6E2DF', strokeDasharray: '3 3' }
  },
  legend: {
    wrapperStyle: {
      fontFamily: 'Nexa-Book',
      fontSize: '14px',
      color: '#001E4A'
    }
  }
};

const StatCard = ({ title, value, icon: Icon, change, description }) => (
  <div className="bg-white p-4 rounded-lg border border-[#E6E2DF] hover:border-[#F0B72F] transition-all">
    <div className="flex items-center justify-between mb-1">
      <h3 className="text-[17px] leading-[27px] font-nexa-black text-[#001E4A]">{title}</h3>
      <div className="p-2 bg-[#F0B72F]/10 rounded-lg">
        <Icon className="h-5 w-5 text-[#F0B72F]" />
      </div>
    </div>
    <div className={`text-[26px] leading-[36px] font-nexa-black ${value > 30 ? "text-red-500" : "text-[#001E4A]"} mb-2`}>{value}{title === "Durchschnittliche Dauer" ? " min" : ""}</div>
    {change !== undefined && description && (
      <p className="text-[14px] font-nexa-book text-[#001E4A]/70">
        <span className={`inline-block mr-2 ${parseFloat(change) < 0 ? 'text-[#001E4A]' : 'text-[#001E4A]'}`}>
          {parseFloat(change) > 0 ? '+' : ''}{parseFloat(change).toFixed(1)}%
        </span>
        {description}
      </p>
    )}
  </div>
);

const TaskAnalysisDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    isAllTime: false
  });
  const [selectedCompany, setSelectedCompany] = useState('');
  const [data, setData] = useState({
    kpis: null,
    overview: null,
    performance: null
  });
  const [loading, setLoading] = useState(true);

  const handleDropdownChange = (e) => setActiveTab(e.target.value);

  const tabs = [
    { id: "overview", name: "Übersicht" },
    { id: "performance", name: "Leistungsmetriken" }
  ];

  // Add handleCompanyChange function
  const handleCompanyChange = (company) => {
    setSelectedCompany(company);
    // The data will be refetched automatically due to the useEffect dependency
  };

  useEffect(() => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    setDateRange({
      startDate: currentDate,
      endDate: currentDate,
      isAllTime: false
    });
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const access_token = localStorage.getItem('access_token');

    // Modified date formatting to preserve exact date
    const formatDate = (date) => {
      if (!date) return null;
      
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
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

        const [kpisRes, overviewRes, performanceRes] = await Promise.all([
          fetch(`https://solasolution.ecomtask.de/tasks_kpis?${queryString}`, config)
            .then(res => res.json()),
          fetch(`https://solasolution.ecomtask.de/tasks_overview?${queryString}`, config)
            .then(res => res.json()),
          fetch(`https://solasolution.ecomtask.de/tasks_performance?${queryString}`, config)
            .then(res => res.json())
        ]);

        setData({
          kpis: kpisRes,
          overview: overviewRes,
          performance: performanceRes
        });
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
  
  const OverviewTab = () => {
    if (!data.kpis || !data.overview) return <Loading />;
  
    const tasksByWeekday = data.overview['Tasks created by weekday'] || [];
    const tasksByMonth = data.overview['Tasks created by date'] || [];

    const taskMetrics = [
      {
        title: "Aufgabentypen",
        value: data.kpis['Task types'] || 0,
        icon: Inbox,
        change: data.kpis['email recieved change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Durchschnittliche Dauer",
        value: data.kpis['avg_duration in minutes'] || 0,
        icon: data.kpis['avg_duration in minutes'] > 30 ? TriangleAlert : CircleCheck,
        change: data.kpis['email sent change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Zugewiesene Benutzer",
        value: data.kpis['# of assigned users'] || 0,
        icon: Users,
        change: data.kpis['email new cases change'],
        description: "im Vergleich zur letzten Periode"
      }
    ];
  
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {taskMetrics.map((metric, index) => (
            <StatCard
              key={index}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              change={metric.change}
              description={metric.description}
            />
          ))}
        </div>
        <ChartCard title="Aufgaben nach Kategorie">
          <div className="flex flex-col md:flex-row h-[400px] md:h-[450px] gap-4">
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={data.overview['Tasks by categories'] || []}
                    dataKey="count"
                    nameKey="tasks"
                    cx="50%"
                    cy="50%"
                    outerRadius={({ width, height }) => Math.min(width, height) * 0.4}
                    labelLine={false}
                    label={false}
                  >
                    {(data.overview['Tasks by categories'] || []).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={Object.values(chartColors)[index % Object.values(chartColors).length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
  
            <div className="md:w-52 overflow-y-auto modern-scrollbar p-2">
              {(data.overview['Tasks by categories'] || []).map((entry, index) => (
                <div key={index} className="flex items-center justify-between mb-2 hover:bg-[#E6E2DF]/10 p-2 rounded">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-sm mr-2"
                      style={{ backgroundColor: Object.values(chartColors)[index % Object.values(chartColors).length] }}
                    />
                    <span className="text-[14px] font-nexa-book text-[#001E4A]">
                      {entry.tasks}
                    </span>
                  </div>
                  <span className="text-[14px] font-nexa-black text-[#001E4A]">
                    {entry.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Aufgaben nach Wochentag">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByWeekday}>
                  <XAxis {...chartConfig.xAxis} dataKey="weekday" angle={-45} height={60} dy={15} />
                  <YAxis {...chartConfig.yAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend {...chartConfig.legend} wrapperStyle={{bottom: 12}}  />
                  <Bar
                    dataKey="count"
                    name="Aufgaben"
                    fill={chartColors.primary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
  
          <ChartCard title="Aufgaben nach Monat">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tasksByMonth}>
                  <XAxis {...chartConfig.xAxis} dataKey="month" angle={-45} height={60} dy={15} />
                  <YAxis {...chartConfig.yAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend {...chartConfig.legend} wrapperStyle={{bottom: 12}}  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Aufgaben"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.primary, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    );
  };
  
const PerformanceTab = () => {
  if (!data.performance) return <Loading />;

  // Chart styling configuration
  const chartStyle = {
    margin: { top: 20, right: 30, left: 20, bottom: 60 },
    fontSize: '12px',
    fontFamily: 'Nexa-Book',
  };

  return (
    <div className="space-y-6">
      {/* Tasks by User */}
      <ChartCard title="Aufgaben nach Benutzer">
        <div className="overflow-x-auto overflow-y-hidden modern-scrollbar">
          <div className="min-w-[1200px] lg:min-w-full">
            <div className="h-[450px]">
              <ResponsiveContainer>
                <BarChart
                  data={data.performance['Tasks assigned to users'] || []}
                  margin={{ ...chartStyle.margin, bottom: 160 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" />
                  <XAxis
                    dataKey="assign_users_by_tasks"
                    angle={-45}
                    textAnchor="end"
                    height={150}
                    interval={0}
                    tick={{ fill: '#001E4A', fontSize: '12px', fontFamily: 'Nexa-Book' }}
                  />
                  <YAxis tick={{ fill: '#001E4A', fontSize: '12px', fontFamily: 'Nexa-Book' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{bottom: 35, fontFamily: 'Nexa-Book', fontSize: '14px' }} />
                  <Bar
                    dataKey="task_count"
                    name="Aufgaben"
                    fill="#F0B72F"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </ChartCard>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks by Due Date */}
      <ChartCard title="Aufgaben nach Fälligkeitsdatum">
        <div className="h-[350px]">
          <ResponsiveContainer>
            <BarChart
              data={data.performance['Tasks assign to users by date'] || []}
              margin={chartStyle.margin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" />
              <XAxis 
                dataKey="month" 
                angle={-45} 
                height={60}
                dy={20}
                tick={{ fill: '#001E4A', fontSize: '12px', fontFamily: 'Nexa-Book' }}
              />
              <YAxis tick={{  fill: '#001E4A', fontSize: '12px', fontFamily: 'Nexa-Book' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ bottom: 35, fontFamily: 'Nexa-Book', fontSize: '14px' }} />
              <Bar
                dataKey="assign_tasks_by_date"
                name="Zugewiesene Aufgaben"
                fill="#F0B72F"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      
        {/* Task Creation Trend */}
        <ChartCard title="Aufgabenerstell-Trend">
          <div className="h-[350px]">
            <ResponsiveContainer>
              <LineChart
                data={data.performance['Task creation trend'] || []}
                margin={chartStyle.margin}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" />
                <XAxis 
                  dataKey="date" 
                  angle={-45} 
                  height={60}
                  dy={20}

                  tick={{ fill: '#001E4A', fontSize: '12px', fontFamily: 'Nexa-Book' }}
                />
                <YAxis tick={{ fill: '#001E4A', fontSize: '12px', fontFamily: 'Nexa-Book' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ bottom: 35, fontFamily: 'Nexa-Book', fontSize: '14px' }} />
                <Line
                  type="monotone"
                  dataKey="tasks_count"
                  name="Aufgaben"
                  stroke="#F0B72F"
                  strokeWidth={2}
                  dot={{ fill: '#F0B72F', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Upcoming Tasks
        <ChartCard title="Anstehende Aufgaben (Nächste 7 Tage)">
          <div className="h-[350px]">
            <ResponsiveContainer>
              <BarChart
                data={data.performance['Upcoming tasks'] || []}
                margin={chartStyle.margin}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" />
                <XAxis 
                  dataKey="date" 
                  angle={-45} 
                  dy={20}

                  height={60}
                  tick={{ fill: '#001E4A', fontSize: '12px', fontFamily: 'Nexa-Book' }}
                />
                <YAxis tick={{ fill: '#001E4A', fontSize: '12px', fontFamily: 'Nexa-Book' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{bottom: 35, fontFamily: 'Nexa-Book', fontSize: '14px' }} />
                <Bar
                  dataKey="tasks_due"
                  name="Fällige Aufgaben"
                  fill="#001E4A"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard> */}
      </div>
    </div>
  );
};

  
const ChartCard = ({ title, children }) => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-[#E6E2DF] hover:border-[#F0B72F] transition-all">
    <h3 className="text-[20px] leading-[36px] font-nexa-black text-[#001E4A] mb-6">{title}</h3>
    {children}
  </div>
);

  return (
    <div className="bg-[#E6E2DF]/10 rounded-[50px]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        <div className="bg-white/70 p-4 rounded-xl shadow-sm mb-6">
          <div className="flex flex-row gap-4">
            <CustomDateRangeFilter onFilterChange={handleDateRangeChange} />
            <CompanyDropdown onCompanyChange={handleCompanyChange} />
            <button
              className={`px-4 py-2 rounded-xl font-nexa-black text-[17px] leading-[27px] ml-auto transition-all duration-200 
                text-[#F0B72F] bg-[#001E4A] border-2 hover:bg-[#001E4A]/90 active:scale-90`}
              onClick={() => {}}
            >
              Download
            </button>
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
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "performance" && <PerformanceTab />}
        </div>
      </div>
    </div>
  );
};

export default TaskAnalysisDashboard;