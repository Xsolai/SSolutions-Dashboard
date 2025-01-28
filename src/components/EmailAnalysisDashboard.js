"use client";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { Inbox, Archive, Clock, Timer, Reply, Forward, CheckCircle } from 'lucide-react';
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

// Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const formatValue = (value, name) => {
    if (typeof value !== 'number') return value;

    if (name?.toLowerCase().includes('%')) {
      return `${Number(value).toFixed(2)}%`;
    }
    if (name?.toLowerCase().includes('zeit') || name?.toLowerCase().includes('time')) {
      return `${Number(value).toFixed(2)} Min`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="bg-white border border-[#E6E2DF] rounded-lg shadow-sm p-3 font-nexa-book">
      <p className="font-nexa-black text-[#001E4A] mb-2 text-sm">{label}</p>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center gap-2 py-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill || item.color || item.stroke }} />
          <span className="text-[#001E4A]/70 font-nexa-book text-sm">{item.name}:</span>
          <span className="text-[#001E4A] font-nexa-black text-sm">{formatValue(item.value, item.name)}</span>
        </div>
      ))}
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

// Base Components
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
      <p className="text-[14px] font-nexa-book text-[#001E4A]/70">
        <span className={`inline-block mr-2 ${parseFloat(change) < 0 ? 'text-[#001E4A]' : 'text-[#001E4A]'}`}>
          {parseFloat(change) > 0 ? '+' : ''}{parseFloat(change).toFixed(1)}%
        </span>
        {description}
      </p>
    )}
  </div>
);

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

// Chart Configuration
const chartConfig = {
  xAxis: {
    tick: { fill: '#001E4A', fontSize: '12px', fontFamily: 'Nexa-Book' },
    axisLine: { stroke: '#E6E2DF' }
  },
  yAxis: {
    tick: { fill: '#001E4A', fontSize: '12px', fontFamily: 'Nexa-Book' },
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


const EmailAnalysisDashboard = () => {
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
    { id: "leistung", name: "Leistungskennzahlen" }
  ];

  const handleCompanyChange = (company) => {
    setSelectedCompany(company);
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
          ...(selectedCompany && { company: selectedCompany })
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
  }, [dateRange, selectedCompany]);
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
  if (!overviewData || !subKPIs) return <Loading/>;
  
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
      value: (overviewData['total emails received'] || 0).toLocaleString(), 
      icon: Inbox,
      change: subKPIs['total emails recieved change'],
      description: "im Vergleich zur letzten Periode"
    },
    { 
      title: "Bearbeitungszeit", 
      value: `${overviewData['Total Processing Time (sec)'] || 0}`, 
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
  
  const formattedData = (overviewData.daily_service_level_gross || [])
    .map(item => ({
      ...item
    }))
    .reverse();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                {...chartConfig.xAxis}
                dx={-5}
                dy={20}
              />
              <YAxis
                {...chartConfig.yAxis}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend {...chartConfig.legend} />
              <Line
                type="monotone"
                dataKey="service_level_gross"
                name="Serviceniveau"
                stroke={chartColors.primary}
                strokeWidth={2}
                dot={{ fill: chartColors.primary, r: 4 }}
                activeDot={{ r: 6, fill: chartColors.primary }}
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
              angle={-45}
              textAnchor="end"
              height={80}
              {...chartConfig.xAxis}
            />
            <YAxis {...chartConfig.yAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend {...chartConfig.legend} />
            <Line
              type="monotone"
              dataKey="processing_time" // Use "processing_time" from the data
              name="Bearbeitungszeit (Minuten)"
              stroke={chartColors.primary}
              strokeWidth={2}
              dot={{ fill: chartColors.primary, r: 4 }}
              activeDot={{ r: 6 }}
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
                angle={-45}
                textAnchor="end"
                height={80}
                {...chartConfig.xAxis}
              />
              <YAxis
                {...chartConfig.yAxis}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend {...chartConfig.legend} />
              <Line
                type="monotone"
                dataKey="service_level_gross"
                name="Serviceniveau"
                stroke={chartColors.primary}
                strokeWidth={2}
                dot={{ fill: chartColors.primary, r: 4 }}
                activeDot={{ r: 6 }}
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
                angle={-45}
                textAnchor="end"
                height={80}
                {...chartConfig.xAxis}
              />
              <YAxis {...chartConfig.yAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend {...chartConfig.legend} />
              <Bar
                dataKey="sent"
                name="Gesendet"
                fill={chartColors.primary}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="recieved"
                name="Vorgänge"
                fill={chartColors.secondary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
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
          {activeTab === "leistung" && <LeistungTab />}
        </div>
      </div>
    </div>
  );
};

export default EmailAnalysisDashboard;