"use client";
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ComposedChart } from 'recharts';
import { Mail, PhoneCall, Phone, TrendingUp, TrendingDown, XCircle, Clock, CheckCircle, Send, Users, Activity, CreditCard } from 'lucide-react';

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

const AnalyticsDashboard = ({ dateRange, selectedCompany }) => {
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

      console.log(conversionDataJson);
  
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
  
  // Handle date range updates
  useEffect(() => {
    if (dateRange.startDate || dateRange.endDate || dateRange.isAllTime) {
      fetchData(dateRange);
    }
  }, [dateRange, selectedCompany]);

    
// Modified SalesServiceTab to conditionally show toggle based on company
const SalesServiceTab = () => {
  const [showSales, setShowSales] = useState(true);
  if (!data.salesServiceData) return <Loading />;

  // List of clients that should only have Sales view (no Service toggle)
  const salesOnlyClients = ['Galeria', 'ADAC', 'Urlaub'];
  const isSalesOnlyClient = selectedCompany && salesOnlyClients.includes(selectedCompany);

  // If client is in our restricted list, force sales view
  useEffect(() => {
    if (isSalesOnlyClient) {
      setShowSales(true);
    }
  }, [selectedCompany, isSalesOnlyClient]);

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
      {/* Toggle Button - Only show if not a sales-only client */}
      {!isSalesOnlyClient && (
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
      )}

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

  
const ConversionTab = ({ dateRange, selectedCompany }) => {
  const [bookingData, setBookingData] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentStatusFilter, setCurrentStatusFilter] = useState("OP");
  const [lastFetchParams, setLastFetchParams] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const access_token = localStorage.getItem('access_token');
  const config = {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  };

  // Check if user is admin via API
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch("https://solasolution.ecomtask.de/profile", {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setIsAdmin(userData.role && userData.role.toLowerCase() === 'admin');
        } else {
          console.error("Failed to fetch user profile");
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        setIsAdmin(false);
      }
    };
    
    checkUserRole();
  }, [access_token]);

  if (!data.conversionData) return <Loading />;

  const conversionData = data.conversionData || {};
  const cbData = conversionData?.['Conversion Performance']?.CB || {};
  const salesData = conversionData?.['Conversion Performance']?.Sales || {};
  const cbMetrics = conversionData?.['sales_effective_calls'] || {};
  const salesMetrics = conversionData?.Sales || {};

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
      fontSize: '14px'
    }
  };

  // Optimized fetch function with debounce and caching - only for admins
  useEffect(() => {
    // Skip if not admin or date range not set
    if (!isAdmin || !dateRange || !dateRange.startDate || !dateRange.endDate) return;
    
    // Create a string representation of fetch parameters for comparison
    const fetchParamsString = JSON.stringify({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      currentStatusFilter,
      selectedCompany
    });
    
    // Skip if parameters haven't changed (prevents duplicate fetches)
    if (fetchParamsString === lastFetchParams) return;
    
    // Create debounced fetch
    const debouncedFetch = setTimeout(async () => {
      setBookingLoading(true);
      
      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      const queryString = new URLSearchParams({
        start_date: formatDate(dateRange.startDate),
        end_date: formatDate(dateRange.endDate),
        current_status: currentStatusFilter,
        ...(selectedCompany && { company: selectedCompany })
      }).toString();

      try {
        // Using AbortController to cancel pending requests if component unmounts
        const controller = new AbortController();
        const signal = controller.signal;
        
        const response = await fetch(`https://solasolution.ecomtask.de/track_op_bookings?${queryString}`, {
          ...config,
          signal,
          // Setting cache control headers
          headers: {
            ...config.headers,
            'Cache-Control': 'max-age=300' // Cache for 5 minutes
          }
        });
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setBookingData(data.tracked_op_bookings || []);
        
        // Store params to prevent duplicate fetches
        setLastFetchParams(fetchParamsString);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching booking data:', error);
        }
      } finally {
        setBookingLoading(false);
      }
    }, 300); // 300ms debounce
    
    // Clean up the timeout on unmount or before next effect run
    return () => clearTimeout(debouncedFetch);
  }, [dateRange, currentStatusFilter, selectedCompany, lastFetchParams, isAdmin]);

  // Status filter options
  const statusOptions = [
    { value: "OP", label: "Optional" },
    { value: "OK", label: "Bestätigt" },
    { value: "XX", label: "Storniert" },
    { value: "RF", label: "Zurückerstattet" }
  ];

  // Format date for display
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Progressive loading for table rows (improves rendering performance)
  const renderTableRows = () => {
    if (bookingData.length === 0) {
      return (
        <tr>
          <td colSpan="4" className="p-8 text-center text-[15px] font-nexa-book text-[#001E4A]/70">
            Keine Buchungsdaten für den ausgewählten Zeitraum und Status verfügbar.
          </td>
        </tr>
      );
    }
    
    return bookingData.map((booking, index) => (
      <tr 
        key={`${booking.booking_number}-${index}`}
        className={`hover:bg-[#F0B72F]/10 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#E6E2DF]/10'}`}
      >
        <td className="p-3 text-[15px] font-nexa-book text-[#001E4A] border-b border-[#E6E2DF]">
          {booking.booking_number}
        </td>
        <td className="p-3 text-[15px] font-nexa-book text-[#001E4A] border-b border-[#E6E2DF]">
          <span className={`px-2 py-1 rounded-md text-xs font-nexa-black ${
            booking.previous_status === 'OP' ? 'bg-[#F0B72F]/20 text-[#001E4A]' :
            booking.previous_status === 'OK' ? 'bg-green-100 text-green-800' :
            booking.previous_status === 'XX' ? 'bg-red-100 text-red-800' :
            booking.previous_status === 'RF' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {booking.previous_status}
          </span>
        </td>
        <td className="p-3 text-[15px] font-nexa-book text-[#001E4A] border-b border-[#E6E2DF]">
          <span className={`px-2 py-1 rounded-md text-xs font-nexa-black ${
            booking.current_status === 'OP' ? 'bg-[#F0B72F]/20 text-[#001E4A]' :
            booking.current_status === 'OK' ? 'bg-green-100 text-green-800' :
            booking.current_status === 'XX' ? 'bg-red-100 text-red-800' :
            booking.current_status === 'RF' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {booking.current_status}
          </span>
        </td>
        <td className="p-3 text-[15px] font-nexa-book text-[#001E4A] border-b border-[#E6E2DF]">
          {formatDisplayDate(booking.change_date)}
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          title="Vertrieb Konversion"
          value={`${salesMetrics?.['Sales Conversion']?.toFixed(1) || '0'}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Buchungen"
          value={conversionData?.['success bookings'] || '0'}
          icon={CreditCard}
        />
      </div>

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-4`}>
      <ChartCard title="Vertrieb Leistung">
          <div className="h-[400px]">
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
                    fontSize: '14px',
                    paddingTop: '10px'
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
                  dot={{ fill: colors.accent, r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        
        {/* Optimized Tracked Bookings Section - Only shown for admins */}
        {isAdmin && (
          <ChartCard title="Buchungsverfolgung">
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h4 className="text-[17px] leading-[27px] font-nexa-black text-[#001E4A]">
                  Status Filter:
                </h4>
                <select
                  value={currentStatusFilter}
                  onChange={(e) => setCurrentStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-[#E6E2DF] rounded-md text-[15px] leading-[24px] font-nexa-book text-[#001E4A] focus:outline-none focus:ring-2 focus:ring-[#F0B72F] focus:border-[#F0B72F]"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {bookingLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="p-4 rounded-full bg-[#F0B72F]/10">
                  <div className="w-8 h-8 border-4 border-[#F0B72F] border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            ) : (
              <div className="h-[330px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="bg-[#E6E2DF]/30">
                      <th className="p-3 text-left text-[15px] font-nexa-black text-[#001E4A] border-b border-[#E6E2DF]">
                        Buchungsnummer
                      </th>
                      <th className="p-3 text-left text-[15px] font-nexa-black text-[#001E4A] border-b border-[#E6E2DF]">
                        Vorheriger Status
                      </th>
                      <th className="p-3 text-left text-[15px] font-nexa-black text-[#001E4A] border-b border-[#E6E2DF]">
                        Aktueller Status
                      </th>
                      <th className="p-3 text-left text-[15px] font-nexa-black text-[#001E4A] border-b border-[#E6E2DF]">
                        Änderungsdatum
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTableRows()}
                  </tbody>
                </table>
              </div>
            )}
            
            {bookingData.length > 0 && (
              <div className="mt-4 text-right text-[15px] font-nexa-book text-[#001E4A]/70">
                {bookingData.length} Buchungen gefunden
              </div>
            )}
          </ChartCard>
        )}
      </div>
    </div>
  );
};

const salesOnlyClients = ['Galeria', 'Adac', 'Urlaub'];
const isSalesOnlyClient = selectedCompany && salesOnlyClients.includes(selectedCompany);

  const tabs = [
    { 
      id: "sales", 
      name: isSalesOnlyClient ? "Vertrieb" : "Vertrieb & Service" 
    },  
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
