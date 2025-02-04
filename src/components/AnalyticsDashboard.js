"use client";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ComposedChart } from 'recharts';
import { Mail, PhoneCall, Phone, TrendingUp, TrendingDown, XCircle, Clock, CheckCircle, Send, Users, Activity, CreditCard } from 'lucide-react';
import CustomDateRangeFilter from './FilterComponent';
import CompanyDropdown from './Company';

// Brand Colors
const colors = {
  primary: '#F0B72F',    // SolaGelb
  dark: '#001E4A',       // SolaBlau
  gray: '#E6E2DF',       // SolaGrau
  lightGray: '#E6E2DF/50', 
  white: '#ffffff',
  success: '#001E4A',    // Using SolaBlau for success
  danger: '#F0B72F',     // Using SolaGelb for danger
  accent: '#001E4A'      // Using SolaBlau for accent
};

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

// Loading Component
const Loading = () => (
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

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, change, description }) => (
  <div className="bg-white p-4 rounded-lg border border-[#E6E2DF] hover:border-[#F0B72F] transition-all">
    <div className="flex items-center justify-between mb-1">
      <h3 className="text-[17px] leading-[27px] font-nexa-black text-[#001E4A]">{title}</h3>
      <div className="p-2 bg-[#F0B72F]/10 rounded-lg">
        <Icon className="h-5 w-5 text-[#F0B72F]" />
      </div>
    </div>
    <div className="text-[26px] leading-[36px] font-nexa-black text-[#001E4A] mb-2">{value}</div>
    {change && description && (
      <p className="text-[15px] leading-[27px] font-nexa-book text-[#001E4A]/70">
        <span className={`inline-block mr-2 ${change.includes('-') ? 'text-[#001E4A]' : 'text-[#001E4A]'}`}>
          {change}
        </span>
        {description}
      </p>
    )}
  </div>
);

// Chart Card Component
const ChartCard = ({ title, children }) => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-[#E6E2DF] hover:border-[#F0B72F] transition-all">
    <h3 className="text-[20px] leading-[36px] font-nexa-black text-[#001E4A] mb-6">{title}</h3>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  // Helper function to format value based on type and name
  const formatValue = (value, name) => {
    if (typeof value !== 'number') return value;

    // Handle percentage values
    if (name?.toLowerCase().includes('%') || name?.toLowerCase().includes('rate') || 
        name?.toLowerCase().includes('niveau') || name?.toLowerCase().includes('acc')) {
      return `${Number(value).toFixed(1)}%`;
    }

    // Handle time values
    if (name?.toLowerCase().includes('zeit') || name?.toLowerCase().includes('time') || 
        name?.toLowerCase().includes('sec') || name?.toLowerCase().includes('min')) {
      return `${Number(value).toFixed(1)} Min`;
    }

    // Default number formatting
    return value.toLocaleString();
  };

  return (
    <div className="bg-white border border-[#E6E2DF] rounded-lg shadow-sm p-3">
      <p className="font-nexa-black text-[#001E4A] mb-2 text-sm">{label}</p>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center gap-2 py-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: item.fill || item.color || item.stroke }}
          />
          <span className="text-[#001E4A]/70 font-nexa-book text-sm">
            {item.name || item.dataKey}:
          </span>
          <span className="text-[#001E4A] font-nexa-black text-sm">
            {formatValue(item.value, item.name || item.dataKey)}
          </span>
        </div>
      ))}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    isAllTime: false
  });
  const [data, setData] = useState({
    salesServiceData: null,
    bookingData: null,
    bookingSubKPIs: null,
    conversionData: null
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  const access_token = localStorage.getItem('access_token');
  const config = {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  };

// Add to your state declarations
const [selectedCompany, setSelectedCompany] = useState('');

// Add handleCompanyChange function
const handleCompanyChange = (company) => {
  setSelectedCompany(company);
  fetchData(dateRange); // Refetch data with new company filter
};

  // Updated initialization to use current date instead of yesterday
  useEffect(() => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    setDateRange({
      startDate: currentDate,
      endDate: currentDate,
      isAllTime: false
    });
  }, []);

  const fetchData = async (dateParams) => {
    setLoading(true);
    const { startDate, endDate, isAllTime } = dateParams;
    
    // Modified date formatting to preserve exact date
    const formatDate = (date) => {
      if (!date) return null;
      
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    };

    const queryString = new URLSearchParams({
      ...(startDate && { start_date: formatDate(startDate) }),
      ...(endDate && { end_date: formatDate(endDate) }),
      include_all: isAllTime || false,
      ...(selectedCompany && { company: selectedCompany })
    }).toString();

    try {
      const [
        salesServiceData,
        bookingData,
        bookingSubKPIs,
        conversionData
      ] = await Promise.all([
        // Fixed API endpoint names to match backend
        fetch(`https://solasolution.ecomtask.de/analytics_sales_service?${queryString}`, config),
        fetch(`https://solasolution.ecomtask.de/analytics_booking?${queryString}`, config),
        fetch('https://solasolution.ecomtask.de/analytics_booking_subkpis', config),
        fetch(`https://solasolution.ecomtask.de/analytics_conversion?${queryString}`, config)
      ]);
  
      const [
        salesServiceDataJson,
        bookingDataJson,
        bookingSubKPIsJson,
        conversionDataJson
      ] = await Promise.all([
        salesServiceData.json(),
        bookingData.json(),
        bookingSubKPIs.json(),
        conversionData.json()
      ]);
  
      // Update state with fetched data
      setData({
        salesServiceData: salesServiceDataJson,
        bookingData: bookingDataJson,
        bookingSubKPIs: bookingSubKPIsJson,
        conversionData: conversionDataJson
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Analysedaten:', error);
      // Could add error state handling here
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
  
  // Handle date range updates
  useEffect(() => {
    if (dateRange.startDate || dateRange.endDate || dateRange.isAllTime) {
      fetchData(dateRange);
    }
  }, [dateRange, selectedCompany]);
    
  // Handle date filter changes from calendar component
  const handleDateRangeChange = (newRange) => {
    setDateRange({
      startDate: newRange.startDate,
      endDate: newRange.endDate,
      isAllTime: newRange.isAllTime
    });
  };

    
const SalesServiceTab = () => {
  const [showSales, setShowSales] = useState(true);
  if (!data.salesServiceData) return <Loading />;

  const defaultMetrics = {
    calls_offered: 0,
    calls_handled: 0,
    ACC: 0,
    SL: 0,
    AHT_sec: 0,
    longest_waiting_time_sec: 0,
    total_talk_time_sec: 0
  };

  const salesMetrics = {
    ...defaultMetrics,
    ...(data.salesServiceData?.sales_metrics || {})
  };
  
  const serviceMetrics = {
    ...defaultMetrics,
    ...(data.salesServiceData?.service_metrics || {})
  };
  
  const activeMetrics = showSales ? salesMetrics : serviceMetrics;
  const serviceType = showSales ? 'Vertrieb' : 'Service';

  const callOverviewData = [{
    name: serviceType,
    angeboten: activeMetrics.calls_offered || 0,
    bearbeitet: activeMetrics.calls_handled || 0
  }];

  const serviceMetricsData = [{
    name: serviceType,
    acc: Number(activeMetrics.ACC) || 0,
    sl: Number(activeMetrics.SL) || 0
  }];

  const handlingTimeData = [{
    name: serviceType,
    durchschnitt: Number(activeMetrics.AHT_sec) || 0,
    wartezeit: Number(activeMetrics.longest_waiting_time_sec) || 0,
    sprechzeit: Number(activeMetrics.total_talk_time_sec) || 0
  }];

  return (
    <div className="space-y-6">
      {/* Toggle Button */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex rounded-lg shadow-sm" role="group">
          <button
            onClick={() => setShowSales(true)}
            className={`
              px-4 py-2 text-[17px] leading-[27px] font-nexa-black rounded-l-lg
              border transition-all duration-200
              ${showSales 
                ? 'bg-[#F0B72F] text-[#001E4A] border-[#F0B72F]' 
                : 'bg-white text-[#001E4A]/70 border-[#E6E2DF] hover:bg-[#E6E2DF]/10'
              }
            `}
          >
            Vertrieb
          </button>
          <button
            onClick={() => setShowSales(false)}
            className={`
              px-4 py-2 text-[17px] leading-[27px] font-nexa-black rounded-r-lg
              border-t border-b border-r transition-all duration-200
              ${!showSales 
                ? 'bg-[#F0B72F] text-[#001E4A] border-[#F0B72F]' 
                : 'bg-white text-[#001E4A]/70 border-[#E6E2DF] hover:bg-[#E6E2DF]/10'
              }
            `}
          >
            Service
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`${serviceType} Anrufe Angeboten`}
          value={activeMetrics.calls_offered || 0}
          icon={PhoneCall}
        />
        <StatCard
          title={`${serviceType} Anrufe Bearbeitet`}
          value={activeMetrics.calls_handled || 0}
          icon={Phone}
        />
        <StatCard
          title={`${serviceType} ACC`}
          value={`${Number(activeMetrics.ACC).toFixed(1)}%`}
          icon={CheckCircle}
        />
        <StatCard
          title={`${serviceType} Serviceniveau`}
          value={`${Number(activeMetrics.SL).toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ChartCard title="Anruf Übersicht">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={callOverviewData}>
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

                <Legend 
                  wrapperStyle={{
                    fontFamily: 'Nexa-Book',
                    color: '#001E4A'
                  }}
                />
                <Bar dataKey="angeboten" name="Angebotene Anrufe" fill="#F0B72F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bearbeitet" name="Bearbeitete Anrufe" fill="#E6E2DF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Service Level & ACC">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={serviceMetricsData}>
                <XAxis 
                  dataKey="name"
                  tick={{ fill: '#001E4A' }}
                  fontFamily="Nexa-Book"
                />
                <YAxis 
                  tick={{ fill: '#001E4A' }}
                  fontFamily="Nexa-Book"
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />

                <Legend 
                  wrapperStyle={{
                    fontFamily: 'Nexa-Book',
                    color: '#001E4A'
                  }}
                />
                <Bar dataKey="acc" name="ACC %" fill="#F0B72F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sl" name="Serviceniveau %" fill="#001E4A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Bearbeitungszeiten">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={handlingTimeData}>
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

                <Legend 
                  wrapperStyle={{
                    fontFamily: 'Nexa-Book',
                    color: '#001E4A'
                  }}
                />
                <Bar dataKey="durchschnitt" name="DGB (Min)" fill="#F0B72F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wartezeit" name="Wartezeit (Min)" fill="#E6E2DF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

const BookingTab = () => {
  if (!data.bookingData || !data.bookingSubKPIs) return <Loading />;

  const bookingData = data.bookingData || {};
  const bookingSubKPIs = data.bookingSubKPIs || {};
  const bookingStatus = bookingData['Booking status'] || {};

  const bookingMetrics = [
    {
      title: "Gesamtbuchungen",
      value: bookingData['Total Bookings'] || 0,
      icon: Users,
      change: bookingSubKPIs['Total Bookings change']
    },
    {
      title: "Gebucht",
      value: bookingData['Booked'] || 0,
      icon: CheckCircle,
      change: bookingSubKPIs['Booked change']
    },
    {
      title: "Storniert",
      value: bookingData['Cancelled count'] || 0,
      icon: XCircle,
      change: bookingSubKPIs['Cancelled count change']
    },
    {
      title: "SB Buchungsrate",
      value: `${bookingData['SB Booking Rate (%)'] || 0}%`,
      icon: Activity,
      change: bookingSubKPIs['SB Booking Rate (%) change']
    },
    {
      title: "Ausstehend",
      value: bookingData['Pending'] || 0,
      icon: Clock,
      change: bookingSubKPIs['Pending change']
    },
    {
      title: "Optional",
      value: bookingData['OP'] || 0,
      icon: TrendingUp,
      change: bookingSubKPIs['OP change']
    },
    {
      title: "RQ Anfrage",
      value: bookingData['RQ'] || 0,
      icon: TrendingDown,
      change: bookingSubKPIs['RQ change']
    },
    {
      title: "Nicht Bearbeitet",
      value: bookingData['SB'] || 0,
      icon: TrendingDown,
      change: bookingSubKPIs['SB change']
    }
  ];

  const bookingStatusData = Object.entries(bookingStatus || {}).map(([key, value]) => ({
    category: key,
    value: value || 0
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bookingMetrics.map((metric, index) => (
          <StatCard
            key={index}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            change={metric.change}
            description="im Vergleich zur letzten Periode"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Buchungsstatus">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={bookingStatusData}>
                <XAxis 
                  dataKey="category"
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
                  name="Anzahl"
                  fill="#F0B72F" 
                  radius={[4, 4, 0, 0]}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'Nexa-Book',
                    color: '#001E4A'
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="OP/RQ Verteilung">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={[
                { name: 'OP', value: bookingData['OP'] || 0 },
                { name: 'RQ', value: bookingData['RQ'] || 0 }
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
                  name="Anzahl"
                  fill="#F0B72F" 
                  radius={[4, 4, 0, 0]}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'Nexa-Book',
                    color: '#001E4A'
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

  
const ConversionTab = () => {
  if (!data.conversionData) return <Loading />;

  const conversionData = data.conversionData || {};
  const cbData = conversionData?.['Conversion Performance']?.CB || {};
  const salesData = conversionData?.['Conversion Performance']?.Sales || {};
  const cbMetrics = conversionData?.['sales_effective_calls'] || {};
  const salesMetrics = conversionData?.Sales || {};

  const cbChartData = [{
    bookings: cbData?.['Bookings CB'] || 0,
    wrong: cbData?.['Wrong calls'] || 0,
    handled: cbData?.['CB calls handled'] || 0,
    conversion: cbMetrics || 0
  }];

  const salesChartData = [{
    bookings: salesData?.['Bookings Sales'] || 0,
    wrong: salesData?.['Wrong calls'] || 0,
    handled: salesData?.['Sales handles'] || 0,
    conversion: salesMetrics?.['Sales Conversion'] || 0,
    volume: salesData?.['Sales volume'] || 0
  }];

  const axisStyle = {
    tick: { 
      fill: '#001E4A', 
      fontFamily: 'Nexa-Book',
      fontSize: '14px'  // Increased font size
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          title="Verkaufswirksame Anrufe"
          value={`${cbMetrics?.['CB Conversion']?.toFixed(1) || '0'}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Vertrieb Konversion"
          value={`${salesMetrics?.['Sales Conversion']?.toFixed(1) || '0'}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Umsatz"
          value={cbData?.['Turnover'] || '0'}
          icon={CreditCard}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="CB Leistung">
          <div className="h-[300px]"> {/* Increased height for better visibility */}
            <ResponsiveContainer>
              <ComposedChart data={cbChartData}>
                <XAxis 
                  dataKey="name" 
                  {...axisStyle}
                />
                <YAxis 
                  yAxisId="left" 
                  {...axisStyle}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[0, 100]}
                  {...axisStyle}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{
                    fontFamily: 'Nexa-Book',
                    fontSize: '14px',  // Increased legend font size
                    paddingTop: '10px'  // Added padding for better spacing
                  }}
                />
                <Bar yAxisId="left" dataKey="bookings" name="Buchungen" fill={colors.success} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="wrong" name="Falsche Anrufe" fill={colors.danger} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="handled" name="Bearbeitete Anrufe" fill={colors.primary} radius={[4, 4, 0, 0]} />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="conversion" 
                  name="Konversionsrate %" 
                  stroke={colors.accent} 
                  strokeWidth={2} 
                  dot={{ fill: colors.accent, r: 5 }}  // Increased dot size
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Vertrieb Leistung">
          <div className="h-[300px]"> {/* Increased height for better visibility */}
            <ResponsiveContainer>
              <ComposedChart data={salesChartData}>
                <XAxis 
                  dataKey="name" 
                  {...axisStyle}
                />
                <YAxis 
                  yAxisId="left" 
                  {...axisStyle}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[0, 100]}
                  {...axisStyle}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{
                    fontFamily: 'Nexa-Book',
                    fontSize: '14px',  // Increased legend font size
                    paddingTop: '10px'  // Added padding for better spacing
                  }}
                />
                <Bar yAxisId="left" dataKey="bookings" name="Buchungen" fill={colors.success} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="wrong" name="Falsche Anrufe" fill={colors.danger} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="handled" name="Bearbeitete Anrufe" fill={colors.primary} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="volume" name="Vertriebsvolumen" fill={colors.gray} radius={[4, 4, 0, 0]} />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="conversion" 
                  name="Konversionsrate %" 
                  stroke={colors.accent} 
                  strokeWidth={2} 
                  dot={{ fill: colors.accent, r: 5 }}  // Increased dot size
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};


  const tabs = [
    { id: "sales", name: "Vertrieb & Service" },
    { id: "booking", name: "Softbuchungen" },
    { id: "conversion", name: "Konversion" },
  ];

  const handleDropdownChange = (e) => setActiveTab(e.target.value);

 // Styled Tab Button
 const TabButton = ({ selected, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 text-[17px] leading-[27px] font-nexa-black transition-all duration-200 border-b-2 ${
      selected
        ? "text-[#001E4A] border-[#F0B72F]"
        : "text-[#001E4A]/70 border-transparent hover:text-[#001E4A] hover:border-[#F0B72F]/50"
    }`}
  >
    {children}
  </button>
);

// Styled Select
const StyledSelect = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full px-4 py-2 border border-[#E6E2DF] rounded-md text-[17px] leading-[27px] font-nexa-book text-[#001E4A] focus:outline-none focus:ring-2 focus:ring-[#F0B72F] focus:border-[#F0B72F]"
  >
    {options.map((option) => (
      <option key={option.id} value={option.id}>
        {option.name}
      </option>
    ))}
  </select>
);

return (
  <div className="bg-[#E6E2DF]/10 rounded-[50px]">
    <div className="max-w-full mx-auto p-4 sm:p-6">
      <div className="bg-white/70 p-4 rounded-xl shadow-sm mb-4">
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
        {/* Mobile Dropdown */}
        <div className="sm:hidden">
          <StyledSelect
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            options={tabs}
          />
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex space-x-8">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </TabButton>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "sales" && <SalesServiceTab />}
        {activeTab === "booking" && <BookingTab />}
        {activeTab === "conversion" && <ConversionTab />}
      </div>
    </div>
  </div>
);
};

export default AnalyticsDashboard;
