"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Pie,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ComposedChart,
  PieChart,
  Cell,
  CartesianGrid,
  Area,
  AreaChart,
  LineChart as RechartsLineChart,
} from "recharts";
import {
  Mail,
  PhoneCall,
  Phone,
  TrendingUp,
  TrendingDown,
  XCircle,
  Clock,
  CheckCircle,
  Send,
  Users,
  Activity,
  CreditCard,
  ClipboardList,
  Download,
  Maximize2,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart,
  X,
  Inbox,
  Archive,
  Timer,
} from "lucide-react";
import ModernToggleGroup from './ModernToggleGroup';
import AnimatedValue from './AnimatedValue';
import * as XLSX from 'xlsx';

// Brand Colors
const colors = {
  primary: "#F0B72F", // SolaGelb
  dark: "#001E4A", // SolaBlau
  gray: "#E6E2DF", // SolaGrau
  white: "#ffffff",
  success: "#10B981", 
  danger: "#EF4444", 
  warning: "#F0B72F", 
  info: "#3B82F6", 
};

// Chart Colors Array
const chartColors = [
  "#F0B72F", "#001E4A", "#10B981", "#EF4444", "#3B82F6", 
  "#8B5CF6", "#F0B72F", "#EC4899", "#6B7280", "#84CC16"
];

// Skeleton Components
const SkeletonStatCard = () => (
  <div className="bg-white p-4 rounded-lg border border-[#E6E2DF] animate-pulse">
    <div className="flex items-center justify-between mb-1">
      <div className="h-4 bg-[#E6E2DF] rounded w-1/3"></div>
      <div className="h-8 w-8 bg-[#E6E2DF] rounded-lg"></div>
    </div>
    <div className="h-8 bg-[#E6E2DF] rounded w-2/3 mb-2"></div>
    <div className="h-3 bg-[#E6E2DF] rounded w-1/2"></div>
  </div>
);

const SkeletonChartCard = () => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-[#E6E2DF] animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="h-6 bg-[#E6E2DF] rounded w-1/4"></div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-[#E6E2DF] rounded"></div>
        <div className="h-8 w-8 bg-[#E6E2DF] rounded"></div>
      </div>
    </div>
    <div className="h-60 bg-gradient-to-br from-[#E6E2DF] to-[#E6E2DF]/50 rounded-lg"></div>
  </div>
);

// Export functionality
const exportToExcel = (data, filename, chartTitle) => {
  if (!data || data.length === 0) return;

  const currentDate = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const csvContent = [
    'Sola Solution Dashboard - Analytics Export',
    '',
    `Diagramm: ${chartTitle}`,
    `Exportiert am: ${currentDate}`,
    '',
    'Daten:',
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Sola_Solution_${filename}_${currentDate.replace(/[:.]/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Modern Chart Tooltip
const ModernTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const formatValue = (value, name) => {
    if (typeof value !== "number") return value;

    if (
      name?.toLowerCase().includes("%") ||
      name?.toLowerCase().includes("rate") ||
      name?.toLowerCase().includes("niveau") ||
      name?.toLowerCase().includes("acc") ||
      name?.toLowerCase().includes("conversion")
    ) {
      return `${Number(value).toFixed(1)}%`;
    }

    if (
      name?.toLowerCase().includes("zeit") ||
      name?.toLowerCase().includes("time") ||
      name?.toLowerCase().includes("sec") ||
      name?.toLowerCase().includes("min")
    ) {
      return `${Number(value).toFixed(1)} Min`;
    }

    return value.toLocaleString();
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-lg p-4 min-w-[200px]">
      {label && (
        <p className="font-semibold text-[#001E4A] mb-3 text-base border-b border-[#E6E2DF] pb-2">
          {label}
        </p>
      )}
      <div className="space-y-2">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: item.fill || item.color || item.stroke }}
              />
              <span className="text-[#001E4A]/70 text-sm">
                {item.name || item.dataKey}
              </span>
            </div>
            <span className="text-[#001E4A] font-semibold text-sm">
              {formatValue(item.value, item.name || item.dataKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Modern Legend Component
const ModernLegend = ({ payload }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/50">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#001E4A] font-semibold text-sm">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, loading = false }) => (
  <div className="group bg-white p-6 rounded-2xl border border-[#E6E2DF] hover:border-[#F0B72F] transition-all duration-500 hover:shadow-2xl hover:shadow-[#F0B72F]/15 hover:-translate-y-2 transform-gpu">
    {loading ? (
      <>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gradient-to-r from-[#E6E2DF] to-[#E6E2DF]/50 rounded w-1/3 animate-pulse"></div>
          <div className="h-12 w-12 bg-gradient-to-br from-[#E6E2DF] to-[#E6E2DF]/70 rounded-xl animate-pulse"></div>
        </div>
        <div className="h-8 bg-gradient-to-r from-[#E6E2DF] to-[#E6E2DF]/60 rounded w-2/3 mb-3 animate-pulse"></div>
      </>
    ) : (
      <>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] leading-[26px] font-medium text-[#001E4A] group-hover:text-[#F0B72F] transition-colors duration-300 tracking-tight">
            {title}
          </h3>
          <div className="p-3 bg-gradient-to-br from-[#F0B72F]/15 via-[#F0B72F]/8 to-[#F0B72F]/5 rounded-xl group-hover:from-[#F0B72F]/25 group-hover:to-[#F0B72F]/10 transition-all duration-500 shadow-lg shadow-[#F0B72F]/10 group-hover:shadow-xl group-hover:shadow-[#F0B72F]/20">
            <Icon className="h-6 w-6 text-[#F0B72F] group-hover:scale-110 transition-transform duration-300 drop-shadow-sm" />
          </div>
        </div>
        <div className="text-[30px] leading-[38px] font-semibold text-[#001E4A] mb-3 tracking-tight">
          <AnimatedValue value={value} />
        </div>
      </>
    )}
  </div>
);

// Chart Card Component
const ChartCard = ({ title, children, loading = false, data, filename, onExport }) => {
  const handleExport = () => {
    if (data && data.length > 0 && onExport) {
      onExport(data, filename || title.replace(/\s+/g, '_').toLowerCase(), title);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E6E2DF] hover:border-[#F0B72F] transition-all duration-500 hover:shadow-2xl hover:shadow-[#F0B72F]/20 p-4 sm:p-6">
      {loading ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 bg-gradient-to-r from-[#E6E2DF] to-[#E6E2DF]/50 rounded w-1/4 animate-pulse"></div>
            <div className="h-10 w-10 bg-gradient-to-br from-[#E6E2DF] to-[#E6E2DF]/70 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-80 bg-gradient-to-br from-[#F0B72F]/10 via-[#F0B72F]/5 to-transparent rounded-2xl animate-pulse border border-[#F0B72F]/10"></div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#F0B72F]/15 to-[#F0B72F]/5 rounded-xl transition-all duration-500 shadow-lg shadow-[#F0B72F]/10">
                <BarChart3 className="h-6 w-6 text-[#F0B72F] drop-shadow-sm" />
              </div>
              <h3 className="text-[20px] leading-[30px] font-bold text-[#001E4A] tracking-tight">
                {title}
              </h3>
            </div>
            <button
              onClick={handleExport}
              className="p-3 rounded-xl bg-gradient-to-br from-[#E6E2DF]/30 to-[#E6E2DF]/10 hover:from-[#F0B72F]/15 hover:to-[#F0B72F]/5 hover:text-[#F0B72F] transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-[#F0B72F]/10"
              title="Export als CSV"
              disabled={!data || data.length === 0}
            >
              <Download className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            </button>
          </div>
          <div className="bg-gradient-to-br from-[#F0B72F]/8 via-[#F0B72F]/3 to-transparent rounded-2xl p-6 transition-all duration-500 border border-[#F0B72F]/10 shadow-inner h-[380px]">
            {children}
          </div>
        </>
      )}
    </div>
  );
};

// Gradient Definitions Component
const ChartGradients = () => (
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F0B72F" stopOpacity={1}/>
      <stop offset="100%" stopColor="#F0B72F" stopOpacity={0.1}/>
    </linearGradient>
  </defs>
);

// Main Dashboard Component
const AnalyticsDashboard = ({ dateRange, selectedCompany }) => {
  // Simplified state management
  const [data, setData] = useState({
    salesServiceData: null,
    bookingData: null,
    bookingSubKPIs: null,
    conversionData: null,
    emailData: null,
    emailOverview: null,
    trackedBookings: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sales");
  const [domain, setDomain] = useState("Sales"); // Stabilized default
  
  const isAdmin = localStorage.getItem("role");
  const abortControllerRef = useRef(null);
  
  // Handle sales-only clients
  const salesOnlyClients = ["Galeria", "ADAC", "Urlaub", "UrlaubsguruKF"];
  const isSalesOnlyClient = selectedCompany && salesOnlyClients.includes(selectedCompany);

  // API configuration
  const access_token = localStorage.getItem("access_token");
  const config = {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  };

  // Helper function to format date
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Simplified fetchData function
  const fetchData = useCallback(async () => {
    console.log('🔄 Fetching data for:', { selectedCompany, domain, dateRange });
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);

    try {
      const { startDate, endDate, isAllTime } = dateRange;

      // Build query parameters
      const queryString = new URLSearchParams({
        ...(startDate && { start_date: formatDate(startDate) }),
        ...(endDate && { end_date: formatDate(endDate) }),
        include_all: isAllTime || false,
        ...(selectedCompany && { company: selectedCompany }),
      }).toString();

      // Build email query with domain
      const emailQueryString = new URLSearchParams({
        ...(startDate && { start_date: formatDate(startDate) }),
        ...(endDate && { end_date: formatDate(endDate) }),
        include_all: isAllTime || false,
        ...(selectedCompany && { company: selectedCompany }),
        ...(domain && { domain: domain })
      }).toString();

      console.log('📝 Query parameters:', {
        queryString,
        emailQueryString,
        accessToken: access_token ? '✅ Present' : '❌ Missing'
      });

      const fetchOptions = {
        ...config,
        signal: abortControllerRef.current.signal,
      };

      // API endpoints
      const endpoints = [
        { name: 'Sales/Service', url: `https://solasolution.ecomtask.de/analytics_sales_service?${queryString}` },
        { name: 'Booking', url: `https://solasolution.ecomtask.de/analytics_booking?${queryString}` },
        { name: 'Booking SubKPIs', url: `https://solasolution.ecomtask.de/analytics_booking_subkpis?${queryString}` },
        { name: 'Conversion', url: `https://solasolution.ecomtask.de/analytics_conversion?${queryString}` },
        { name: 'Email', url: `https://solasolution.ecomtask.de/analytics_email?${emailQueryString}` },
        { name: 'Email Overview', url: `https://solasolution.ecomtask.de/email_overview?${emailQueryString}` }
      ];

      console.log('🌐 API Endpoints to call:', endpoints.map(e => ({ name: e.name, url: e.url })));

      // Make API calls with timeout
      const timeout = setTimeout(() => {
        console.log('⏰ Request timeout after 10 seconds');
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 10000);

      console.log('📡 Starting API calls...');

      const [
        salesServiceResponse,
        bookingResponse,
        bookingSubKPIsResponse,
        conversionResponse,
        emailResponse,
        emailOverviewResponse,
      ] = await Promise.all([
        fetch(endpoints[0].url, fetchOptions),
        fetch(endpoints[1].url, fetchOptions),
        fetch(endpoints[2].url, fetchOptions),
        fetch(endpoints[3].url, fetchOptions),
        fetch(endpoints[4].url, fetchOptions),
        fetch(endpoints[5].url, fetchOptions),
      ]);

      clearTimeout(timeout);

      // Log response status
      const responses = [
        { name: 'Sales/Service', response: salesServiceResponse },
        { name: 'Booking', response: bookingResponse },
        { name: 'Booking SubKPIs', response: bookingSubKPIsResponse },
        { name: 'Conversion', response: conversionResponse },
        { name: 'Email', response: emailResponse },
        { name: 'Email Overview', response: emailOverviewResponse }
      ];

      console.log('📊 API Response Status:');
      responses.forEach(({ name, response }) => {
        const status = response.ok ? '✅' : '❌';
        console.log(`  ${status} ${name}: ${response.status} ${response.statusText}`);
      });

      // Parse responses and log data
      console.log('🔄 Parsing responses...');
      
      const salesServiceData = salesServiceResponse.ok ? await salesServiceResponse.json() : null;
      const bookingData = bookingResponse.ok ? await bookingResponse.json() : null;
      const bookingSubKPIs = bookingSubKPIsResponse.ok ? await bookingSubKPIsResponse.json() : null;
      const conversionData = conversionResponse.ok ? await conversionResponse.json() : null;
      const emailData = emailResponse.ok ? await emailResponse.json() : null;
      const emailOverview = emailOverviewResponse.ok ? await emailOverviewResponse.json() : null;

      const newData = {
        salesServiceData,
        bookingData,
        bookingSubKPIs,
        conversionData,
        emailData,
        emailOverview,
        trackedBookings: [],
      };

      // Log parsed data
      console.log('📈 Parsed Data Results:');
      Object.entries(newData).forEach(([key, value]) => {
        if (value !== null) {
          console.log(`  ✅ ${key}:`, value);
        } else {
          console.log(`  ❌ ${key}: null`);
        }
      });

      console.log('✅ Data loaded successfully:', Object.keys(newData).filter(key => newData[key] !== null));
      setData(newData);

    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("❌ Error fetching data:", error);
        console.error("📍 Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } else {
        console.log("🛑 Request was aborted");
      }
    } finally {
      setLoading(false);
      console.log('🏁 Data fetching completed');
    }
  }, [selectedCompany, domain, dateRange]);

  // Single useEffect for data fetching
  useEffect(() => {
    if (dateRange.startDate || dateRange.endDate || dateRange.isAllTime) {
      const timer = setTimeout(() => {
        fetchData();
      }, 300); // Small debounce

      return () => clearTimeout(timer);
    }
  }, [fetchData]);

  // Set domain for sales-only clients
  useEffect(() => {
    if (isSalesOnlyClient && domain !== "Sales") {
      setDomain("Sales");
    }
  }, [isSalesOnlyClient, domain]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const isUrlaubsguru = selectedCompany === 'Urlaubsguru';

  const SalesServiceTab = () => {
    // console.log('🎯 Rendering SalesServiceTab with domain:', domain);

    // Safe data access with fallbacks
    const defaultMetrics = {
      calls_offered: 0,
      calls_handled: 0,
      ACC: 0,
      SL: 0,
      AHT_sec: 0,
    };

    const salesMetrics = { ...defaultMetrics, ...(data.salesServiceData?.sales_metrics || {}) };
    const serviceMetrics = { ...defaultMetrics, ...(data.salesServiceData?.service_metrics || {}) };
    const allMetrics = {
      ...defaultMetrics,
      ...(data.salesServiceData?.all_metrics || {}),
      ACC: data.salesServiceData?.all_metrics?.["avg ACC"] || 0,
      SL: data.salesServiceData?.all_metrics?.["avg SL"] || 0,
      AHT_sec: data.salesServiceData?.all_metrics?.["avg AHT_sec"] || 0,
    };

    // Determine active metrics based on domain
    let activeMetrics, serviceType;
    if (domain === "Sales") {
      activeMetrics = salesMetrics;
      serviceType = "Vertrieb";
    } else if (domain === "Service") {
      activeMetrics = serviceMetrics;
      serviceType = "Service";
    } else {
      activeMetrics = allMetrics;
      serviceType = "Alle";
    }

    // Safe email data access
    const emailData = data.emailData || {};
    const emailOverview = data.emailOverview || {};
    const safeEmailData = {
      received: Number(emailData['email recieved']) || Number(emailOverview['email recieved']) || 0,
      sent: Number(emailData['email sent']) || Number(emailOverview['email sent']) || 0,
      archived: Number(emailData['email archived']) || Number(emailOverview['email archived']) || 0,
    };

    // Chart data
    const callOverviewData = [{
      name: serviceType,
      angeboten: activeMetrics.calls_offered,
      bearbeitet: activeMetrics.calls_handled,
    }];

    const serviceMetricsData = [{
      name: serviceType,
      acc: activeMetrics.ACC,
      sl: activeMetrics.SL,
    }];

    const emailChartData = [{
      name: serviceType,
      empfangen: safeEmailData.received,
      gesendet: safeEmailData.sent,
      archiviert: safeEmailData.archived,
    }];

    const emailDistributionData = [
      { name: "Empfangen", value: safeEmailData.received, fill: "#F0B72F" },
      { name: "Gesendet", value: safeEmailData.sent, fill: "#001E4A" },
      { name: "Archiviert", value: safeEmailData.archived, fill: "#10B981" },
    ];

    return (
      <div className="space-y-4">
        {/* Toggle Button */}
        {!isSalesOnlyClient && (
          <ModernToggleGroup
            value={domain}
            onChange={setDomain}
            className="mb-3"
          />
        )}

        {/* Call Metrics */}
        <div className="flex items-center gap-3 mb-3">
          <Phone className="h-5 w-5 text-[#F0B72F]" />
          <h3 className="text-[18px] font-bold text-[#001E4A]">
            {serviceType} - Anruf Analyse
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title={`${serviceType} Anrufe Angeboten`}
            value={loading ? null : activeMetrics.calls_offered}
            icon={PhoneCall}
            loading={loading}
          />
          <StatCard
            title={`${serviceType} Anrufe Bearbeitet`}
            value={loading ? null : activeMetrics.calls_handled}
            icon={Phone}
            loading={loading}
          />
          <StatCard
            title={`${serviceType} ACC`}
            value={loading ? null : `${activeMetrics.ACC.toFixed(1)}%`}
            icon={CheckCircle}
            loading={loading}
          />
          <StatCard
            title={`${serviceType} Serviceniveau`}
            value={loading ? null : `${activeMetrics.SL.toFixed(1)}%`}
            icon={TrendingUp}
            loading={loading}
          />
        </div>

        {/* Call Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard 
            title="Anruf Übersicht" 
            loading={loading} 
            data={callOverviewData} 
            filename="Anruf_Uebersicht"
            onExport={exportToExcel}
          >
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={callOverviewData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: "#001E4A", fontSize: 13 }} stroke="#E6E2DF" />
                  <YAxis tick={{ fill: "#001E4A", fontSize: 13 }} stroke="#E6E2DF" />
                  <Tooltip content={<ModernTooltip />} />
                  <Legend content={<ModernLegend />} />
                  <Bar dataKey="angeboten" name="Angebotene Anrufe" fill="#F0B72F" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="bearbeitet" name="Bearbeitete Anrufe" fill="#001E4A" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard 
            title="Service Level & ACC" 
            loading={loading} 
            data={serviceMetricsData} 
            filename="Service_Level_ACC"
            onExport={exportToExcel}
          >
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={serviceMetricsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: "#001E4A", fontSize: 13 }} stroke="#E6E2DF" />
                  <YAxis tick={{ fill: "#001E4A", fontSize: 13 }} domain={[0, 100]} stroke="#E6E2DF" />
                  <Tooltip content={<ModernTooltip />} />
                  <Legend content={<ModernLegend />} />
                  <Bar dataKey="acc" name="ACC %" fill="#F0B72F" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="sl" name="Serviceniveau %" fill="#001E4A" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Email Metrics */}
        <div className="flex items-center gap-3 mb-3 mt-6">
          <Mail className="h-5 w-5 text-[#F0B72F]" />
          <h3 className="text-[18px] font-bold text-[#001E4A]">
            {serviceType} - E-Mail Analyse
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            title={`${serviceType} E-Mails Empfangen`}
            value={loading ? null : safeEmailData.received.toLocaleString()}
            icon={Inbox}
            loading={loading}
          />
          <StatCard
            title={`${serviceType} E-Mails Gesendet`}
            value={loading ? null : safeEmailData.sent.toLocaleString()}
            icon={Send}
            loading={loading}
          />
          <StatCard
            title={`${serviceType} E-Mails Archiviert`}
            value={loading ? null : safeEmailData.archived.toLocaleString()}
            icon={Archive}
            loading={loading}
          />
        </div>

        {/* Email Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard 
            title="E-Mail Aktivitäten" 
            loading={loading} 
            data={emailChartData} 
            filename="Email_Aktivitaeten"
            onExport={exportToExcel}
          >
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={emailChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: "#001E4A", fontSize: 13 }} stroke="#E6E2DF" />
                  <YAxis tick={{ fill: "#001E4A", fontSize: 13 }} stroke="#E6E2DF" />
                  <Tooltip content={<ModernTooltip />} />
                  <Legend content={<ModernLegend />} />
                  <Bar dataKey="empfangen" name="Empfangen" fill="#F0B72F" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="gesendet" name="Gesendet" fill="#001E4A" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="archiviert" name="Archiviert" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard 
            title="E-Mail Verteilung" 
            loading={loading} 
            data={emailDistributionData} 
            filename="Email_Verteilung"
            onExport={exportToExcel}
          >
            <div className="h-[300px]">
              <ResponsiveContainer>
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={emailDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={100}
                    innerRadius={40}
                    dataKey="value"
                  >
                    {emailDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    
                    const data = payload[0];
                    const total = emailDistributionData.reduce((sum, item) => sum + item.value, 0);
                    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
                    
                    return (
                      <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-lg p-4">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[#001E4A]/70 font-nexa-book">
                            {data.name}
                          </span>
                          <div className="text-right">
                            <div className="text-[#001E4A] font-nexa-black">
                              {data.value.toLocaleString()}
                            </div>
                            <div className="text-[#001E4A]/70 font-nexa-book text-sm">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }} />
                  <Legend content={<ModernLegend />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    );
  };

  // BookingTab Komponente mit StatCards und Diagrammen
  const BookingTab = () => {
    if (!data?.bookingData || !data?.bookingSubKPIs) {
      return (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F0B72F]"></div>
        </div>
      );
    }

    const bookingData = data.bookingData || {};
    const bookingSubKPIs = data.bookingSubKPIs || {};
    const bookingStatus = bookingData["Booking status"] || {};

    const bookingMetrics = [
      {
        title: "Gesamtbuchungen",
        value: bookingData["Total Bookings"] || 0,
        icon: Users,
        change: bookingSubKPIs["Total Bookings change"],
      },
      {
        title: "Gebucht",
        value: bookingData["Booked"] || 0,
        icon: CheckCircle,
        change: bookingSubKPIs["Booked change"],
      },
      {
        title: "Storniert",
        value: bookingData["Cancelled count"] || 0,
        icon: XCircle,
        change: bookingSubKPIs["Cancelled count change"],
      },
      {
        title: "SB Buchungsrate",
        value: `${bookingData["SB Booking Rate (%)"] || 0}%`,
        icon: Activity,
        change: bookingSubKPIs["SB Booking Rate (%) change"],
      },
      {
        title: "Ausstehend",
        value: bookingData["Pending"] || 0,
        icon: Clock,
        change: bookingSubKPIs["Pending change"],
      },
      {
        title: "Option",
        value: bookingData["OP"] || 0,
        icon: TrendingUp,
        change: bookingSubKPIs["OP change"],
      },
      {
        title: "RQ Anfrage",
        value: bookingData["RQ"] || 0,
        icon: TrendingDown,
        change: bookingSubKPIs["RQ change"],
      },
      {
        title: "Nicht Bearbeitet",
        value: bookingData["SB"] || 0,
        icon: TrendingDown,
        change: bookingSubKPIs["SB change"],
      },
    ];

    const bookingStatusData = Object.entries(bookingStatus || {}).map(
      ([key, value]) => ({
        category: key,
        value: value || 0,
      })
    );

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
              loading={loading}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard 
            title="Buchungsstatus" 
            loading={loading}
            data={bookingStatusData}
            filename="Buchungsstatus"
            onExport={exportToExcel}
          >
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={bookingStatusData}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fill: "#001E4A", fontSize: 13 }} 
                    stroke="#E6E2DF"
                  />
                  <YAxis 
                    tick={{ fill: "#001E4A", fontSize: 13 }} 
                    stroke="#E6E2DF"
                  />
                  <Tooltip content={<ModernTooltip />} />
                  <Legend content={<ModernLegend />} />
                  <Bar
                    dataKey="value"
                    name="Anzahl"
                    fill="#F0B72F"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard 
            title="OP/RQ Verteilung" 
            loading={loading}
            data={[
              { name: "OP", value: bookingData["OP"] || 0 },
              { name: "RQ", value: bookingData["RQ"] || 0 },
            ]}
            filename="OP_RQ_Verteilung"
            onExport={exportToExcel}
          >
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { name: "OP", value: bookingData["OP"] || 0 },
                    { name: "RQ", value: bookingData["RQ"] || 0 },
                  ]}
                >
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "#001E4A", fontSize: 13 }} 
                    stroke="#E6E2DF"
                  />
                  <YAxis 
                    tick={{ fill: "#001E4A", fontSize: 13 }} 
                    stroke="#E6E2DF"
                  />
                  <Tooltip content={<ModernTooltip />} />
                  <Legend content={<ModernLegend />} />
                  <Bar
                    dataKey="value"
                    name="Anzahl"
                    fill="#F0B72F"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    );
  };

  // ConversionTab mit StatCards und Diagrammen
  const ConversionTab = () => {
    const [currentStatusFilter, setCurrentStatusFilter] = useState("ALL");
    
    console.log('🔄 ConversionTab: Raw conversion data:', data.conversionData);
    
    if (!data.conversionData) {
      console.log('❌ ConversionTab: No conversion data available');
      return (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F0B72F]"></div>
        </div>
      );
    }

    const conversionData = data.conversionData || {
      organisch_conversion: "0%",
      cb_conversion: "0%",
      sucess_bookings: 0,
      "Conversion Performance": {
        total_calls: 0,
        organisch_wrong_call: 0,
        organisch_accepted_call: 0,
        organisch_bookings: 0,
        cb_wrong_call: 0,
        cb_accepted_call: 0,
        cb_bookings: 0,
      },
    };

    console.log('📊 ConversionTab: Processed conversion data:', conversionData);
    console.log('🔍 ConversionTab: Conversion Performance details:', conversionData["Conversion Performance"]);
    
    // Log the specific fields we're interested in
    const conversionPerformance = conversionData["Conversion Performance"];
    console.log('📈 ConversionTab: Key fields check:', {
      organisch_accepted_call: conversionPerformance?.organisch_accepted_call,
      cb_accepted_call: conversionPerformance?.cb_accepted_call,
      organisch_wrong_call: conversionPerformance?.organisch_wrong_call,
      cb_wrong_call: conversionPerformance?.cb_wrong_call,
      organisch_bookings: conversionPerformance?.organisch_bookings,
      cb_bookings: conversionPerformance?.cb_bookings,
      total_calls: conversionPerformance?.total_calls
    });

    // Check if backend is still using old field names for organisch
    console.log('🔍 ConversionTab: Checking for OLD field names:', {
      organisch_true_sales_call: conversionPerformance?.organisch_true_sales_call,
      cb_true_sales_call: conversionPerformance?.cb_true_sales_call
    });

    // Show ALL available fields in Conversion Performance
    console.log('🗂️ ConversionTab: ALL fields in Conversion Performance:', 
      conversionPerformance ? Object.keys(conversionPerformance) : 'No data'
    );

    // Detailed comparison between organisch and CB values
    console.log('⚖️ ConversionTab: Organisch vs CB comparison:', {
      organisch: {
        new_accepted: conversionPerformance?.organisch_accepted_call,
        old_accepted: conversionPerformance?.organisch_true_sales_call,
        wrong: conversionPerformance?.organisch_wrong_call,
        bookings: conversionPerformance?.organisch_bookings,
        conversion_rate: conversionData.organisch_conversion
      },
      cb: {
        new_accepted: conversionPerformance?.cb_accepted_call,
        old_accepted: conversionPerformance?.cb_true_sales_call,
        wrong: conversionPerformance?.cb_wrong_call,
        bookings: conversionPerformance?.cb_bookings,
        conversion_rate: conversionData.cb_conversion
      }
    });

    const combinedChartData = [
      {
        name: "Organisch",
        bookings: conversionData["Conversion Performance"]?.organisch_bookings || 0,
        wrong: conversionData["Conversion Performance"]?.organisch_wrong_call || 0,
        handled: conversionData["Conversion Performance"]?.organisch_accepted_call || 
                 conversionData["Conversion Performance"]?.organisch_true_sales_call || 0,
        conversion: parseFloat(conversionData.organisch_conversion) || 0,
      },
      {
        name: "CB",
        bookings: conversionData["Conversion Performance"]?.cb_bookings || 0,
        wrong: conversionData["Conversion Performance"]?.cb_wrong_call || 0,
        handled: conversionData["Conversion Performance"]?.cb_accepted_call || 
                 conversionData["Conversion Performance"]?.cb_true_sales_call || 0,
        conversion: parseFloat(conversionData.cb_conversion) || 0,
      },
    ];

    console.log('📊 ConversionTab: Combined chart data:', combinedChartData);

    const callOverviewData = [
      {
        name: "Gesamt",
        total: conversionData["Conversion Performance"]?.total_calls || 0,
        organisch_true: conversionData["Conversion Performance"]?.organisch_accepted_call || 
                        conversionData["Conversion Performance"]?.organisch_true_sales_call || 0,
        organisch_wrong: conversionData["Conversion Performance"]?.organisch_wrong_call || 0,
        cb_true: conversionData["Conversion Performance"]?.cb_accepted_call || 
                 conversionData["Conversion Performance"]?.cb_true_sales_call || 0,
        cb_wrong: conversionData["Conversion Performance"]?.cb_wrong_call || 0,
      },
    ];

    console.log('📊 ConversionTab: Call overview data:', callOverviewData);

    const pieChartData = [
      {
        name: "Organisch korrekt",
        value: callOverviewData[0].organisch_true,
        fill: colors.success,
      },
      {
        name: "Organisch falsch",
        value: callOverviewData[0].organisch_wrong,
        fill: "#ffd180",
      },
      {
        name: "CB korrekt",
        value: callOverviewData[0].cb_true,
        fill: colors.primary,
      },
      {
        name: "CB falsch",
        value: callOverviewData[0].cb_wrong,
        fill: colors.gray,
      },
    ];

    console.log('🥧 ConversionTab: Pie chart data:', pieChartData);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            title="Organisch Konversion"
            value={conversionData.organisch_conversion || "0%"}
            icon={TrendingUp}
            loading={loading}
          />
          <StatCard
            title="CB Konversion"
            value={conversionData.cb_conversion || "0%"}
            icon={Activity}
            loading={loading}
          />
          <StatCard
            title="Organisch Buchungen"
            value={conversionData["Conversion Performance"]?.organisch_bookings || 0}
            icon={CreditCard}
            loading={loading}
          />
          <StatCard
            title="CB Buchungen"
            value={conversionData["Conversion Performance"]?.cb_bookings || 0}
            icon={CreditCard}
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <ChartCard 
            title="Conversion Performance - Organisch vs CB" 
            loading={loading}
            data={combinedChartData}
            filename="Conversion_Performance_Complete"
            onExport={exportToExcel}
          >
            <div className="h-[450px]">
              <ResponsiveContainer>
                <ComposedChart data={combinedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "#001E4A", fontSize: 14, fontWeight: 'bold' }} 
                    stroke="#E6E2DF"
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fill: "#001E4A", fontSize: 12 }} 
                    stroke="#E6E2DF"
                    label={{ value: 'Anzahl Anrufe', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#001E4A', fontSize: '12px' } }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fill: "#001E4A", fontSize: 12 }}
                    stroke="#E6E2DF"
                    label={{ value: 'Conversion Rate (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#001E4A', fontSize: '12px' } }}
                  />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    
                    return (
                      <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-lg p-4 min-w-[250px]">
                        <p className="font-semibold text-[#001E4A] mb-3 text-base border-b border-[#E6E2DF] pb-2">
                          {label} Performance
                        </p>
                        <div className="space-y-2">
                          {payload.map((item, index) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full shadow-sm"
                                  style={{ backgroundColor: item.fill || item.color || item.stroke }}
                                />
                                <span className="text-[#001E4A]/70 text-sm">
                                  {item.name === 'conversion' ? 'Conversion Rate' : item.name}
                                </span>
                              </div>
                              <span className="text-[#001E4A] font-semibold text-sm">
                                {item.name === 'conversion' ? `${item.value.toFixed(1)}%` : item.value.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }} />
                  <Legend 
                    content={({ payload }) => (
                      <div className="flex flex-wrap justify-center gap-6 mt-4 px-4">
                        {payload.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 border border-[#E6E2DF]/50">
                            <div
                              className="w-4 h-4 rounded-sm"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-[#001E4A] font-semibold text-sm">
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  
                  {/* Bars für Anruf-Daten */}
                  <Bar
                    yAxisId="left"
                    dataKey="handled"
                    name="Bearbeitete Anrufe"
                    fill="#F0B72F"
                    radius={[4, 4, 0, 0]}
                    stroke="#001E4A"
                    strokeWidth={1}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="bookings"
                    name="Erfolgreiche Buchungen"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    stroke="#001E4A"
                    strokeWidth={1}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="wrong"
                    name="Falsche Anrufe"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                    stroke="#001E4A"
                    strokeWidth={1}
                  />
                  
                  {/* Linie für Conversion Rate */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversion"
                    name="Conversion Rate %"
                    stroke="#001E4A"
                    strokeWidth={4}
                    dot={{ fill: "#001E4A", r: 8, strokeWidth: 3, stroke: "#fff" }}
                    activeDot={{ r: 10, strokeWidth: 3, stroke: "#fff", fill: "#001E4A" }}
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
    {
      id: "sales",
      name: isSalesOnlyClient ? "Vertrieb" : "Vertrieb & Service",
    },
    { id: "booking", name: "Softbuchungen" },
    ...(isUrlaubsguru ? [{ id: "conversion", name: "Konversion" }] : []),
  ];

  // Tab Button Component
  const TabButton = ({ selected, children, onClick }) => (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-[17px] leading-[27px] font-bold transition-all duration-200 border-b-2 ${
        selected
          ? "text-[#001E4A] border-[#F0B72F]"
          : "text-[#001E4A]/70 border-transparent hover:text-[#001E4A] hover:border-[#F0B72F]/50"
      }`}
    >
      {children}
    </button>
  );

  // Wenn der aktuelle Tab nicht mehr sichtbar ist (z.B. nach Firmenwechsel), auf 'sales' zurückschalten
  useEffect(() => {
    if (!isUrlaubsguru && activeTab === "conversion") {
      setActiveTab("sales");
    }
  }, [isUrlaubsguru, activeTab]);

  return (
    <div className="bg-[#E6E2DF]/10 rounded-[50px]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        <div className="border-b border-[#E6E2DF] mb-4">
          {/* Desktop Tabs */}
          <div className="flex space-x-8">
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

        <div className="py-2">
          {activeTab === "sales" && <SalesServiceTab />}
          {activeTab === "booking" && <BookingTab />}
          {activeTab === "conversion" && <ConversionTab />}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
