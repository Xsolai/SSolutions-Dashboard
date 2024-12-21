"use client";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Briefcase, TrendingUp, DollarSign, Archive, Clock, CheckCircle, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import FilterComponent from './FilterComponent';
import axios from 'axios';
// Reuse the existing Loading, SkeletonStatCard, and SkeletonChartCard components...
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

const COLORS = {
  primary: '#002B50',
  secondary: '#FFE55C',
  accent: '#FFD700',
  dark: '#1a1a1a',
  darkBlue: '#002B50',
  gray: '#4a4a4a',
  lightGray: '#94a3b8',
  chartColors: [
    '#fdcc00',
    '#002B50',
    '#2225C5',
    '#4a4a4a',
    '#6c757d',
    '#94a3b8',
    '#e5e5e5'
  ]
};

const AnimatedText = () => {
  const titleLines = ["Aufgabe", "Übersicht", "Analytik"];
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
          className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-[#fdcc00] flex flex-wrap "
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
              className="flex"
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
      ))}
    </div>
  );
};


const ChartCard = ({ title, children }) => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-gray-100 hover:border-yellow-400 transition-all">
    <h3 className="text-lg font-medium text-gray-900 mb-6">{title}</h3>
    {children}
  </div>
);


const TaskAnalysisDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterType, setFilterType] = useState('yesterday');
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const access_token = localStorage.getItem('access_token');
        const config = { headers: { 'Authorization': `Bearer ${access_token}` } };

        const [kpisRes, overviewRes, performanceRes] = await Promise.all([
          axios.get(`https://app.saincube.com/app2/tasks_kpis?filter_type=${filterType}`, config),
          axios.get(`https://app.saincube.com/app2/tasks_overview?filter_type=${filterType}`, config),
          axios.get(`https://app.saincube.com/app2/tasks_performance?filter_type=${filterType}`, config)
        ]);

        setData({
          kpis: kpisRes.data,
          overview: overviewRes.data,
          performance: performanceRes.data
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [filterType]);

  const OverviewTab = () => {
    if (!data.kpis || !data.overview) return <Loading />;
  
    // Parse and validate data
    const tasksByWeekday = data.overview['Tasks created by weekday'] || [];
    const tasksByMonth = data.overview['Tasks created by date'] || [];
  
    return (
      <div className="space-y-4">
          
          <ChartCard title="Aufgaben nach Kategorie">
  <div className="flex flex-col md:flex-row h-[400px] md:h-[450px] gap-4">
    {/* Chart Container */}
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
              <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [`${value} Aufgaben`, name]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '12px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    
    {/* Scrollable Legend Container with Values */}
    <div className="md:w-52 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-2">
      {(data.overview['Tasks by categories'] || []).map((entry, index) => (
        <div key={index} className="flex items-center justify-between mb-2 hover:bg-gray-50 p-1 rounded">
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-sm mr-2" 
              style={{ backgroundColor: COLORS.chartColors[index % COLORS.chartColors.length] }}
            />
            <span className="text-sm text-gray-700">{entry.tasks}</span>
          </div>
          <span className="text-sm font-medium text-gray-900">{entry.count}</span>
        </div>
      ))}
    </div>
  </div>
</ChartCard>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks by Weekday */}
          <ChartCard title="Aufgaben nach Wochentag">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByWeekday}>
                  <XAxis dataKey="weekday" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} Aufgaben`]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="Aufgaben"
                    fill={COLORS.chartColors[0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
  
          {/* Tasks by Month */}
          <ChartCard title="Aufgaben nach Monat">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tasksByMonth}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} Aufgaben`]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Aufgaben"
                    stroke={COLORS.chartColors[0]}
                    strokeWidth={2}
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

    return (
      <div className="space-y-6">
        <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-gray-100 hover:border-yellow-400 transition-all">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Aufgaben nach Benutzer</h3>
            <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
              <div className="min-w-[1200px] lg:min-w-full">
                <div className="h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.performance['Tasks assigned to users'] || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 160 }}
                    >
                      <XAxis
                        dataKey="assign_users_by_tasks"
                        angle={-60}
                        textAnchor="end"
                        height={150}
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip />
                    <Legend wrapperStyle={{ bottom: -0 }} />
                      <Bar
                        dataKey="task_count"
                        name="Aufgaben"
                        fill={COLORS.chartColors[0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <ChartCard title="Aufgaben nach Fälligkeitsdatum">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.performance['Tasks assign to users by date'] || []}
                  margin={{ bottom: 20 }}
                >
                  <XAxis
                    dataKey="month"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend wrapperStyle={{ bottom: -0 }} />
                  <Bar
                    dataKey="assign_tasks_by_date"
                    name="Zugewiesene Aufgaben"
                    fill={COLORS.chartColors[0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


          <ChartCard  title="Aufgabenerstell-Trend">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.performance['Task creation trend'] || []}
                  margin={{ bottom: 20 }}
                >
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend wrapperStyle={{ bottom: -0 }} />
                  <Line
                    type="monotone"
                    dataKey="tasks_count"
                    name="Aufgaben"
                    stroke={COLORS.chartColors[0]}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Anstehende Aufgaben (Nächste 7 Tage)">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.performance['Upcoming tasks'] || []}
                  margin={{ bottom: 20 }}
                >
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend wrapperStyle={{ bottom: -0 }} />
                  <Bar
                    dataKey="tasks_due"
                    name="Fällige Aufgaben"
                    fill={COLORS.chartColors[1]}
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
    <div className="bg-gray-50 rounded-[50px]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-10 px-2 pt-4 sm:mb-6 flex justify-between items-center">
          <AnimatedText />
        </div>

        {/* Filter Component */}
        <FilterComponent filterType={filterType} setFilterType={setFilterType} />

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
          {/* Dropdown for Mobile */}
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

export default TaskAnalysisDashboard;