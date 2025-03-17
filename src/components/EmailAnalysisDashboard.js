"use client";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { Mail, Send, TrendingUp, Inbox, Archive, Clock, Timer, Reply, Forward, CheckCircle } from 'lucide-react';

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
      return `${Number(value).toFixed(1)}%`;
    }
    if (name?.toLowerCase().includes('zeit') || name?.toLowerCase().includes('time')) {
      return `${Number(value).toFixed(1)} Min`;
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
const StatCard = ({ title, value, icon: Icon, change, description, timeInSeconds }) => (
  <div className="bg-white p-4 rounded-lg border border-[#E6E2DF] hover:border-[#F0B72F] transition-all">
    <div className="flex items-center justify-between mb-1">
      <h3 className="text-[17px] leading-[27px] font-nexa-black text-[#001E4A]">{title}</h3>
      <div className="p-2 bg-[#F0B72F]/10 rounded-lg">
        <Icon className="h-5 w-5 text-[#F0B72F]" />
      </div>
    </div>
    <div className="flex items-center justify-between mb-2">
      <div className="text-[26px] leading-[36px] font-nexa-black text-[#001E4A]">
        {value}
      </div>
      {timeInSeconds !== undefined && (
        <div className="text-base font-nexa-book text-[#001E4A]">
          {timeInSeconds} min
        </div>
      )}
    </div>
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

const convertToSeconds = (timeString) => {
  const [hours, minutes, seconds] = timeString.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

const convertToSeconds2 = (timeString) => {
  const [minutes, seconds] = timeString.split(":").map(Number);
  return minutes * 60 + seconds;
};

const EmailAnalysisDashboard = ({ dateRange, selectedCompany }) => {
  const [activeTab, setActiveTab] = useState('uebersicht');
  const [emailData, setEmailData] = useState(null);
  const [emailSubKPIs, setEmailSubKPIs] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [subKPIs, setSubKPIs] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState(null);
  
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
          ...(selectedCompany && { company: selectedCompany }),
          ...(domain && { domain: domain })
                }).toString();

        const config = {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        };

        const [emailRes, emailSubKPIsRes, overviewRes, subKPIsRes, performanceRes] = await Promise.all([
          fetch(`https://solasolution.ecomtask.de/analytics_email?${queryString}`, config)
            .then(res => res.json()),
          fetch('https://solasolution.ecomtask.de/analytics_email_subkpis', config)
            .then(res => res.json()),
          fetch(`https://solasolution.ecomtask.de/email_overview?${queryString}`, config)
            .then(res => res.json()),
          fetch(`https://solasolution.ecomtask.de/email_overview_sub_kpis?${queryString}`, config)
            .then(res => res.json()),
          fetch(`https://solasolution.ecomtask.de/email_performance?${queryString}`, config)
            .then(res => res.json())
        ]);

        setEmailData(emailRes);
        setEmailSubKPIs(emailSubKPIsRes);
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
  }, [dateRange, selectedCompany, domain]);

const UebersichtTab = () => {
  if (!overviewData || !subKPIs) return <Loading/>;

  const slGross = emailData['SL Gross'] || 0;
  const processingTime = emailData['Total Dwell Time (sec)'] || 0;
  const totalProcessingTime = emailData['Total Processing Time (sec)'] || 0;
  // updated below
  const processedTimeData = overviewData['Processing Time Trend in seconds'] || [];

  const processedTimeDataConverted = processedTimeData.map((item) => ({
    ...item,
    total_processing_time_sec: convertToSeconds(item.total_processing_time_sec)
  }));
  
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
      value: (emailData['email recieved'] || 0).toLocaleString(), 
      icon: Inbox,
      change: subKPIs['total emails recieved change'],
      description: "im Vergleich zur letzten Periode"
    },
    {
      title: "Gesendete E-Mails",
      value: emailData['email sent'] || 0,
      icon: Mail,
      change: emailSubKPIs['email sent change'],
      description: "im Vergleich zur letzten Periode"
    },
    // { 
    //   title: "Bearbeitungszeit", 
    //   value: `${overviewData['Total Processing Time (sec)'] || 0}`, 
    //   icon: Timer,
    //   change: subKPIs['Total Processing Time (sec) change'],
    //   description: "im Vergleich zur letzten Periode"
    // },
    { 
      title: "Archivierte E-Mails", 
      value: (overviewData['archived emails'] || 0).toLocaleString(), 
      icon: Reply,
      change: subKPIs['total new cases change'],
      description: "im Vergleich zur letzten Periode"
    }
  ];
  
  const formattedData = (overviewData.daily_service_level_gross || [])
    .map(item => ({
      ...item,
      service_level_gross: parseFloat(item.service_level_gross.toFixed(1))
    }))
    .reverse();

  return (
    <div className="space-y-6">
      {/* Toggle Button */}
      <div className="flex justify-end mb-6">
          <div className="inline-flex rounded-lg shadow-sm" role="group">
            <button
              onClick={() => setDomain(null)}
              className={`
                px-4 py-2 text-[17px] leading-[27px] font-nexa-black rounded-l-lg
                border transition-all duration-200
                ${!domain 
                  ? 'bg-[#F0B72F] text-[#001E4A] border-[#F0B72F]' 
                  : 'bg-white text-[#001E4A]/70 border-[#E6E2DF] hover:bg-[#E6E2DF]/10'
                }
              `}
            >
              Alle
            </button>
            <button
              onClick={() => setDomain("Sales")}
              className={`
                px-4 py-2 text-[17px] leading-[27px] font-nexa-black
                border transition-all duration-200
                ${domain === "Sales" 
                  ? 'bg-[#F0B72F] text-[#001E4A] border-[#F0B72F]' 
                  : 'bg-white text-[#001E4A]/70 border-[#E6E2DF] hover:bg-[#E6E2DF]/10'
                }
              `}
            >
              Vertrieb
            </button>
            <button
              onClick={() => setDomain("Service")}
              className={`
                px-4 py-2 text-[17px] leading-[27px] font-nexa-black rounded-r-lg
                border-t border-b border-r transition-all duration-200
                ${domain === "Service" 
                  ? 'bg-[#F0B72F] text-[#001E4A] border-[#F0B72F]' 
                  : 'bg-white text-[#001E4A]/70 border-[#E6E2DF] hover:bg-[#E6E2DF]/10'
                }
              `}
            >
              Service
            </button>
          </div>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {uebersichtStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="SL Brutto"
          value={`${slGross.toFixed(1)}%`}
          icon={TrendingUp}
          />
        <StatCard
          title="Durchschnittliche Verweilzeit"
          value={`${processingTime}`}
          icon={Clock}
          timeInSeconds={(convertToSeconds(processingTime) / 60).toFixed(2)}
          />
        <StatCard
          title="Durchschnittliche Bearbeitungszeit"
          value={`${totalProcessingTime}`}
          icon={Clock}
          timeInSeconds={(convertToSeconds2(totalProcessingTime) / 60).toFixed(2)}
          />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="E-Mail-Bearbeitungsübersicht">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={[
                { name: 'Empfangen', value: emailData['email recieved'] || 0 },
                { name: 'Gesendet', value: emailData['email sent'] || 0 },
                { name: 'Archiviert', value: emailData['email archived'] || 0 }
              ]}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#001E4A' }}
                  fontFamily="Nexa-Book"
                />
                <YAxis 
                  tick={{ fill: '#001E4A' }}
                  fontFamily="Nexa-Book"
                />
                <Tooltip content={<CustomTooltip />} />

                <Bar 
                  dataKey="value" 
                  fill="#F0B72F"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
  
        <ChartCard title="Bearbeitungszeit-Trend">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <LineChart data={processedTimeDataConverted}>
                <XAxis 
                  dataKey="interval_start"
                  tick={{ fill: '#001E4A' }}
                  fontFamily="Nexa-Book"
                />
                <YAxis 
                  tick={{ fill: '#001E4A' }}
                  fontFamily="Nexa-Book"
                />
              <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="total_processing_time_sec" 
                  stroke="#F0B72F"
                  strokeWidth={2}
                  dot={{ fill: '#F0B72F' }}
                  name="Bearbeitungszeit (Min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
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
      {/* Toggle Button */}
      <div className="flex justify-end mb-6">
          <div className="inline-flex rounded-lg shadow-sm" role="group">
            <button
              onClick={() => setDomain(null)}
              className={`
                px-4 py-2 text-[17px] leading-[27px] font-nexa-black rounded-l-lg
                border transition-all duration-200
                ${!domain 
                  ? 'bg-[#F0B72F] text-[#001E4A] border-[#F0B72F]' 
                  : 'bg-white text-[#001E4A]/70 border-[#E6E2DF] hover:bg-[#E6E2DF]/10'
                }
              `}
            >
              Alle
            </button>
            <button
              onClick={() => setDomain("Sales")}
              className={`
                px-4 py-2 text-[17px] leading-[27px] font-nexa-black
                border transition-all duration-200
                ${domain === "Sales" 
                  ? 'bg-[#F0B72F] text-[#001E4A] border-[#F0B72F]' 
                  : 'bg-white text-[#001E4A]/70 border-[#E6E2DF] hover:bg-[#E6E2DF]/10'
                }
              `}
            >
              Vertrieb
            </button>
            <button
              onClick={() => setDomain("Service")}
              className={`
                px-4 py-2 text-[17px] leading-[27px] font-nexa-black rounded-r-lg
                border-t border-b border-r transition-all duration-200
                ${domain === "Service" 
                  ? 'bg-[#F0B72F] text-[#001E4A] border-[#F0B72F]' 
                  : 'bg-white text-[#001E4A]/70 border-[#E6E2DF] hover:bg-[#E6E2DF]/10'
                }
              `}
            >
              Service
            </button>
          </div>
        </div>

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