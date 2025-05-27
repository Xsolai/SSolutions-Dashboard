"use client";
import React, { useState, useEffect , useRef, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Area, AreaChart, LineChart as RechartsLineChart } from 'recharts';
import { Users, Inbox, CircleCheck, TriangleAlert, Circle, Download, Maximize2, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, X } from 'lucide-react';
import AnimatedValue from './AnimatedValue';
import * as XLSX from 'xlsx';

// Brand Colors
const chartColors = {
  primary: '#F0B72F',      // SolaGelb
  secondary: '#001E4A',    // SolaBlau
  tertiary: '#E6E2DF',     // SolaGrau
  primaryLight: '#F0B72F80',  // SolaGelb with opacity
  secondaryLight: '#001E4A80', // SolaBlau with opacity
  tertiaryLight: '#E6E2DF80'   // SolaGrau with opacity
};

// Modern Chart Colors Array
const modernChartColors = [
  "#F0B72F", "#001E4A", "#10B981", "#EF4444", "#3B82F6", 
  "#8B5CF6", "#F59E0B", "#EC4899", "#6B7280", "#84CC16"
];

// Gradient Definitions Component
const ChartGradients = () => (
  <defs>
    {/* Enhanced Primary Gradients with multiple stops */}
    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F0B72F" stopOpacity={1}/>
      <stop offset="25%" stopColor="#F0B72F" stopOpacity={0.9}/>
      <stop offset="50%" stopColor="#F0B72F" stopOpacity={0.7}/>
      <stop offset="75%" stopColor="#F0B72F" stopOpacity={0.4}/>
      <stop offset="100%" stopColor="#F0B72F" stopOpacity={0.1}/>
    </linearGradient>
    
    {/* Enhanced Dark Blue Gradient */}
    <linearGradient id="gradient-dark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#001E4A" stopOpacity={1}/>
      <stop offset="25%" stopColor="#001E4A" stopOpacity={0.9}/>
      <stop offset="50%" stopColor="#002D6B" stopOpacity={0.7}/>
      <stop offset="75%" stopColor="#001E4A" stopOpacity={0.4}/>
      <stop offset="100%" stopColor="#001E4A" stopOpacity={0.1}/>
    </linearGradient>
    
    {/* Enhanced Success Green Gradient */}
    <linearGradient id="gradient-success" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
      <stop offset="25%" stopColor="#10B981" stopOpacity={0.9}/>
      <stop offset="50%" stopColor="#059669" stopOpacity={0.7}/>
      <stop offset="75%" stopColor="#10B981" stopOpacity={0.4}/>
      <stop offset="100%" stopColor="#10B981" stopOpacity={0.1}/>
    </linearGradient>
    
    {/* Enhanced Shadow Filters */}
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#F0B72F" floodOpacity="0.15"/>
      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
    </filter>
    
    {/* Enhanced Glow Effects */}
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
);

// Modern Chart Tooltip
const ModernTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;

  const formatValue = (value, name) => {
    if (formatter) return formatter(value, name);
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
      name?.toLowerCase().includes("min") ||
      name?.toLowerCase().includes("duration")
    ) {
      return `${Number(value).toFixed(1)} Min`;
    }

    return value.toLocaleString();
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-lg p-4 min-w-[200px]">
      {label && (
        <p className="font-nexa-black text-[#001E4A] mb-3 text-base border-b border-[#E6E2DF] pb-2">
          {label}
        </p>
      )}
      <div className="space-y-2">
      {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ 
                  backgroundColor: item.fill || item.color || item.stroke,
                  boxShadow: `0 0 0 2px ${item.fill || item.color || item.stroke}20`
                }}
          />
          <span className="text-[#001E4A]/70 font-nexa-book text-sm">
                {item.name || item.dataKey}
          </span>
            </div>
          <span className="text-[#001E4A] font-nexa-black text-sm">
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
          <span className="text-[#001E4A] font-nexa-book text-sm">
            {entry.value}
          </span>
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

const StatCard = ({ title, value, icon: Icon, change, description, loading = false }) => (
  <div className="group bg-white p-6 rounded-2xl border border-[#E6E2DF] hover:border-[#F0B72F] transition-all duration-500 hover:shadow-2xl hover:shadow-[#F0B72F]/15 hover:-translate-y-2 transform-gpu">
    {loading ? (
      <>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gradient-to-r from-[#E6E2DF] to-[#E6E2DF]/50 rounded w-1/3 animate-pulse"></div>
          <div className="h-12 w-12 bg-gradient-to-br from-[#E6E2DF] to-[#E6E2DF]/70 rounded-xl animate-pulse"></div>
        </div>
        <div className="h-8 bg-gradient-to-r from-[#E6E2DF] to-[#E6E2DF]/60 rounded w-2/3 mb-3 animate-pulse"></div>
        <div className="h-3 bg-gradient-to-r from-[#E6E2DF] to-[#E6E2DF]/40 rounded w-1/2 animate-pulse"></div>
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
        <div className={`text-[30px] leading-[38px] font-semibold ${title === "Durchschnittliche Dauer" && value > 30 ? "text-red-500" : "text-[#001E4A]"} mb-3 tracking-tight`}>
          <AnimatedValue value={value} />
          {title === "Durchschnittliche Dauer" ? " min" : ""}
        </div>
        {change !== undefined && description && (
          <p className="text-[14px] leading-[24px] text-[#001E4A]/70">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-nexa-black transition-all duration-300 shadow-sm ${
                parseFloat(change) < 0 
                  ? "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200" 
                  : parseFloat(change) > 0
                  ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200"
                  : "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200"
              }`}
            >
              {parseFloat(change) > 0 ? '+' : ''}{parseFloat(change).toFixed(1)}%
            </span>
            <span className="ml-2">{description}</span>
          </p>
        )}
      </>
    )}
  </div>
);

// Enhanced export function with context and error handling
const exportToExcelWithContext = (data, filename, chartTitle, chartType = 'bar', dateRange, selectedCompany) => {
  try {
    // Check if XLSX is available
    if (!XLSX || !XLSX.write) {
      // console.error('XLSX library not loaded properly. Falling back to CSV export.');
      exportToCSVFallback(data, filename, chartTitle, dateRange, selectedCompany);
      return;
    }

    // Get current date
    const currentDate = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Helper to format date consistently
    const formatDateForExport = (date) => {
      if (!date) return null;
      return new Date(date).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    // Create enhanced worksheet data with better structure
    const wsData = [
      // Row 1: Main Title (will be merged across columns)
      ['📊 Sola Solution Dashboard - Aufgaben Analyse Export'],
      [''], // Empty row for spacing
      
      // Info section with better layout
      ['Report Information', '', '', '', '', '', ''],
      ['Diagramm:', chartTitle, '', '', 'Exportiert am:', currentDate, ''],
      ['Datenbereich:', `${dateRange?.startDate ? formatDateForExport(dateRange.startDate) : 'Alle Zeit'} - ${dateRange?.endDate ? formatDateForExport(dateRange.endDate) : 'Heute'}`, '', '', 'Kunde:', selectedCompany || 'Alle Kunden', ''],
      ['Diagrammtyp:', chartType, '', '', 'Status:', 'Vollständig', ''],
      [''], // Empty row for spacing
      
      // Summary section
      ['📈 Daten-Zusammenfassung'],
      ['Anzahl Datenpunkte:', data?.length || 0, '', '', '', '', ''],
      [''], // Empty row for spacing
      
      // Data section header
      ['📋 Detaillierte Daten'],
      [''], // Empty row for spacing,
    ];

    // Add data headers and rows with better formatting
    if (data && data.length > 0) {
      const headers = Object.keys(data[0]);
      
      // Add styled header row
      wsData.push(headers);
      
      // Add data rows
      data.forEach((row, index) => {
        const rowData = Object.values(row);
        wsData.push(rowData);
      });
    }

    // Create worksheet using XLSX utils
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Column A - Labels
      { wch: 20 }, // Column B - Values
      { wch: 15 }, // Column C
      { wch: 15 }, // Column D
      { wch: 20 }, // Column E
      { wch: 20 }, // Column F
      { wch: 15 }, // Column G
    ];

    // Add merged cells for better layout
    ws['!merges'] = [
      // Main title merge (entire width)
      { s: { c: 0, r: 0 }, e: { c: 6, r: 0 } },
      // Section headers merge
      { s: { c: 0, r: 2 }, e: { c: 6, r: 2 } },
      { s: { c: 0, r: 7 }, e: { c: 6, r: 7 } },
      { s: { c: 0, r: 11 }, e: { c: 6, r: 11 } },
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aufgaben Export');

    // Write and download
    XLSX.writeFile(wb, `Sola_Solution_Aufgaben_${filename}_${currentDate.replace(/[:.]/g, '-')}.xlsx`);

  } catch (error) {
    // console.error('Excel export failed:', error);
    // Fallback to CSV export
    exportToCSVFallback(data, filename, chartTitle, dateRange, selectedCompany);
  }
};

// Fallback CSV export function
const exportToCSVFallback = (data, filename, chartTitle, dateRange, selectedCompany) => {
  if (!data || data.length === 0) return;

  const currentDate = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formatDateForExport = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const csvContent = [
    'Sola Solution Dashboard - Aufgaben Analyse Export',
    '',
    `Diagramm: ${chartTitle}`,
    `Exportiert am: ${currentDate}`,
    `Datenbereich: ${dateRange?.startDate ? formatDateForExport(dateRange.startDate) : 'Alle Zeit'} - ${dateRange?.endDate ? formatDateForExport(dateRange.endDate) : 'Heute'}`,
    `Kunde: ${selectedCompany || 'Alle Kunden'}`,
    '',
    'Daten:',
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Sola_Solution_Aufgaben_${filename}_${currentDate.replace(/[:.]/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const TaskAnalysisDashboard = ({ dateRange, selectedCompany }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    kpis: null,
    overview: null,
    performance: null
  });
  const [loading, setLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [allTimeMonthData, setAllTimeMonthData] = useState([]); // Wieder hinzufügen für separate Gesamt-Daten
  
  const dataCache = useRef({});
  const abortController = useRef(null);
  const isMounted = useRef(true);
  
  const CACHE_TTL = 5 * 60 * 1000;
  
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper-Funktion, um sicherzustellen, dass das Datum ein String im Format YYYY-MM-DD ist
  const formatDateToString = (dateInput) => {
      if (typeof dateInput === 'string') {
          return dateInput;
      }
      if (dateInput instanceof Date) {
          const year = dateInput.getFullYear();
          const month = (dateInput.getMonth() + 1).toString().padStart(2, '0');
          const day = dateInput.getDate().toString().padStart(2, '0');
          return `${year}-${month}-${day}`;
      }
      // console.warn('Unbekanntes Datumsformat in formatDateToString:', dateInput);
      return new Date().toISOString().split('T')[0]; // Fallback
  };
  
  const getCacheKey = useCallback((company, dateParams) => {
    return `task_${company || 'all'}_${formatDate(dateParams.startDate) || 'none'}_${formatDate(dateParams.endDate) || 'none'}_${dateParams.isAllTime ? 'all' : 'range'}`;
  }, []);
  
  const isCacheValid = useCallback((cacheKey) => {
    const cache = dataCache.current[cacheKey];
    return cache && (Date.now() - cache.timestamp < CACHE_TTL);
  }, [CACHE_TTL]);
  
  const fetchData = useCallback(async () => {
    try {
      // Show loading UI
      setIsFilterLoading(true);
      
      // Generate cache key for current parameters
      const cacheKey = getCacheKey(selectedCompany, dateRange);
      
      // Check if we have valid cached data
      if (dataCache.current[cacheKey] && isCacheValid(cacheKey)) {
        // console.log('Using cached task data for:', selectedCompany);
        
        // Use cached data
        setData(dataCache.current[cacheKey].data);
        
        // Short timeout to prevent UI flicker
        setTimeout(() => {
          setIsFilterLoading(false);
          setLoading(false);
        }, 100);
        return;
      }
      
      // Cancel any in-progress requests
      if (abortController.current) {
        abortController.current.abort();
      }
      
      // Create new abort controller
      abortController.current = new AbortController();
      
      const access_token = localStorage.getItem('access_token');
      
      // Build query parameters
      const queryString = new URLSearchParams({
        ...(dateRange.startDate && { start_date: formatDate(dateRange.startDate) }),
        ...(dateRange.endDate && { end_date: formatDate(dateRange.endDate) }),
        include_all: dateRange.isAllTime || false,
        ...(selectedCompany && { company: selectedCompany })
      }).toString();
      
      const config = {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        signal: abortController.current.signal
      };
      
      // Set timeout to prevent hanging requests
      const timeoutId = setTimeout(() => {
        if (abortController.current) {
          abortController.current.abort();
        }
      }, 15000); // 15 second timeout
      
      // Fetch data in parallel
      const [kpisRes, overviewRes, performanceRes] = await Promise.all([
        fetch(`https://solasolution.ecomtask.de/tasks_kpis?${queryString}`, config)
          .then(res => res.json()),
        fetch(`https://solasolution.ecomtask.de/tasks_overview?${queryString}`, config)
          .then(res => res.json()),
        fetch(`https://solasolution.ecomtask.de/tasks_performance?${queryString}`, config)
          .then(res => res.json())
      ]);
      
      // Clear timeout since request completed
      clearTimeout(timeoutId);
      
      // console.log('=== DEBUGGING: fetchData (gefilterte Daten) ===');
      // console.log('Query String:', queryString);
      // console.log('KPIs Response:', kpisRes);
      // console.log('Overview Response:', overviewRes);
      // console.log('Performance Response:', performanceRes);
      
      // Create data object
      const newData = {
        kpis: kpisRes,
        overview: overviewRes,
        performance: performanceRes
      };
      
      // Store in cache with timestamp
      dataCache.current[cacheKey] = {
        data: newData,
        timestamp: Date.now()
      };
      
      // Update state if component still mounted
      if (isMounted.current) {
        setData(newData);
      }
    } catch (error) {
      // Skip abort errors (expected during navigation)
      if (error.name !== 'AbortError') {
        // console.error('Error fetching data:', error);
        
        // Try to use expired cache data as fallback
        const cacheKey = getCacheKey(selectedCompany, dateRange);
        if (dataCache.current[cacheKey]) {
          setData(dataCache.current[cacheKey].data);
        }
      }
    } finally {
      // Use timeout to prevent flickering
      if (isMounted.current) {
        setTimeout(() => {
          setIsFilterLoading(false);
          setLoading(false);
        }, 300);
      }
    }
  }, [dateRange, selectedCompany, getCacheKey, isCacheValid]);
  
  // Track component mount state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);
  
  // Fetch data when parameters change
  useEffect(() => {
    if (dateRange.startDate || dateRange.endDate || dateRange.isAllTime) {
      fetchData();
    }
  }, [dateRange, selectedCompany, fetchData]);

  // Separate Funktion zum Abrufen der GESAMT-Daten für "Aufgaben nach Monat"
  const fetchAllTimeMonthData = useCallback(async () => {
    try {
      const access_token = localStorage.getItem('access_token');
      
      // console.log('=== DEBUGGING: fetchAllTimeMonthData ===');
      // console.log('Fetching ALL-TIME month data (Gesamt):', {
      //   include_all: true,
      //   company: selectedCompany
      // });
      
      // Verwende include_all: true für GESAMT-Daten
      const queryString = new URLSearchParams({
        include_all: true, // Das ist der Schlüssel - immer GESAMT
        ...(selectedCompany && { company: selectedCompany })
      }).toString();
      
      // console.log('API URL für AllTime:', `https://solasolution.ecomtask.de/tasks_overview?${queryString}`);
      
      const response = await fetch(`https://solasolution.ecomtask.de/tasks_overview?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        // console.log('=== AllTime API Response ===');
        // console.log('Full response:', result);
        // console.log('Tasks created by date:', result['Tasks created by date']);
        
        if (isMounted.current && result['Tasks created by date']) {
          const allTimeData = result['Tasks created by date'] || [];
          // console.log('Setting allTimeMonthData to:', allTimeData);
          setAllTimeMonthData(allTimeData);
        }
      } else {
        // console.error('Failed to fetch all-time month data:', response.status, response.statusText);
      }
    } catch (error) {
      // console.error('Error fetching all-time month data:', error);
    }
  }, [selectedCompany]);

  // Fetch all-time month data when component mounts or company changes
  useEffect(() => {
    fetchAllTimeMonthData();
  }, [selectedCompany, fetchAllTimeMonthData]);
  
  const handleDropdownChange = (e) => setActiveTab(e.target.value);

  const tabs = [
    { id: "overview", name: "Übersicht" },
    { id: "performance", name: "Leistungsmetriken" }
  ];

  const OverviewTab = () => {
    if (!data.kpis || !data.overview) return <Loading />;

    const tasksByMonth = allTimeMonthData.filter(item => {
      if (item.month && item.month >= '2025-01') {
        return true;
      }
      return false;
    });

    const taskMetrics = [
      {
        title: "Gesamtanzahl der Aufgaben",
        value: data.kpis['Total orders'] || 0,
        icon: Inbox,
        change: data.kpis['email recieved change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Aufgabentypen",
        value: data.kpis['Task types'] || 0,
        icon: Inbox,
        change: data.kpis['email recieved change'],
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
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {taskMetrics.map((metric, index) => (
            <StatCard key={index} {...metric} loading={loading} />
          ))}
        </div>

        {/* Main Charts Container */}
        <div className="grid grid-cols-1 gap-6">
          {/* Aufgaben nach Kategorie Card */}
          <div className="bg-white rounded-2xl border border-[#E6E2DF] hover:border-[#F0B72F] transition-all duration-500 hover:shadow-2xl hover:shadow-[#F0B72F]/20">
            <div className="flex flex-col">
              {/* Chart Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#E6E2DF]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[#F0B72F]/15 to-[#F0B72F]/5 rounded-xl">
                    <PieChartIcon className="h-6 w-6 text-[#F0B72F]" />
                  </div>
                  <h3 className="text-[20px] leading-[30px] font-nexa-black text-[#001E4A]">
                    Aufgaben nach Kategorie
                  </h3>
                </div>
              </div>

              {/* Chart Content */}
              <div className="p-6">
                {/* Pie Chart */}
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartGradients />
                      <Pie
                        data={data.overview['Tasks by categories'] || []}
                        dataKey="count"
                        nameKey="tasks"
                        cx="50%"
                        cy="50%"
                        outerRadius="90%"
                        innerRadius="50%"
                        labelLine={false}
                        label={false}
                      >
                        {(data.overview['Tasks by categories'] || []).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={modernChartColors[index % modernChartColors.length]}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<ModernTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Categories List */}
                <div className="mt-6 border-t border-[#E6E2DF] pt-4">
                  <h4 className="text-sm font-bold text-[#001E4A] mb-3">Alle Kategorien im Detail:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(data.overview['Tasks by categories'] || []).map((entry, index) => (
                      <div key={index} className="flex items-center justify-between bg-[#E6E2DF]/10 p-2 rounded-lg">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                            style={{ backgroundColor: modernChartColors[index % modernChartColors.length] }}
                          />
                          <span className="text-[12px] font-medium text-[#001E4A] truncate">
                            {entry.tasks}
                          </span>
                        </div>
                        <span className="text-[12px] font-bold text-[#001E4A] ml-2">
                          {entry.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aufgaben nach Monat Card */}
          <div className="bg-white rounded-2xl border border-[#E6E2DF] hover:border-[#F0B72F] transition-all duration-500 hover:shadow-2xl hover:shadow-[#F0B72F]/20">
            <div className="flex flex-col">
              {/* Chart Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#E6E2DF]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[#F0B72F]/15 to-[#F0B72F]/5 rounded-xl">
                    <LineChartIcon className="h-6 w-6 text-[#F0B72F]" />
                  </div>
                  <h3 className="text-[20px] leading-[30px] font-nexa-black text-[#001E4A]">
                    Aufgaben nach Monat
                  </h3>
                </div>
              </div>

              {/* Chart Content */}
              <div className="p-6">
                <div className="text-xs text-[#001E4A]/60 font-nexa-book mb-4 italic">
                  * Zeigt alle Monate ab 01.01.2025 (Gesamt) unabhängig vom Zeitraumfilter
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tasksByMonth}>
                      <ChartGradients />
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                      <XAxis 
                        {...chartConfig.xAxis} 
                        dataKey="month" 
                        angle={-45} 
                        height={60} 
                        dy={15} 
                        tickFormatter={(value) => {
                          if (value && value.length === 7) {
                            const [year, month] = value.split('-');
                            const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
                            return `${monthNames[parseInt(month) - 1]} ${year}`;
                          }
                          return value;
                        }}
                      />
                      <YAxis {...chartConfig.yAxis} />
                      <Tooltip content={<ModernTooltip />} />
                      <Legend content={<ModernLegend />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Aufgaben"
                        stroke={chartColors.primary}
                        strokeWidth={3}
                        dot={{ fill: chartColors.primary, r: 6, strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                        animationDuration={1200}
                        animationBegin={200}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
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

    // Funktion zur Extraktion von Initialen aus Namen (gleich wie im Hauptdiagramm)
    const getInitials = (name) => {
      if (!name) return '';
      const nameOnly = name.split('(')[0].trim();
      return nameOnly
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase())
        .join('.');
    };

    // Verbesserte Funktion zur Generierung eindeutiger Kürzel
    const generateUniqueInitials = (users) => {
      const usedInitials = new Set();
      const userMappings = [];

      users.forEach(user => {
        let baseInitials = getInitials(user.assign_users_by_tasks);
        let uniqueInitials = baseInitials;
        let counter = 1;

        // Wenn das Kürzel bereits verwendet wird, füge eine Nummer hinzu
        while (usedInitials.has(uniqueInitials)) {
          uniqueInitials = `${baseInitials}${counter}`;
          counter++;
        }

        usedInitials.add(uniqueInitials);
        userMappings.push({
          fullName: user.assign_users_by_tasks,
          initials: uniqueInitials,
          originalInitials: baseInitials
        });
      });

      return userMappings;
    };

    // Transformiere die Benutzerdaten für bessere Anzeige
    const transformUserData = (userData) => {
      const uniqueUsers = generateUniqueInitials(userData);
      return uniqueUsers.map(user => ({
        ...userData.find(item => item.assign_users_by_tasks === user.fullName),
        fullName: user.fullName,
        initials: user.initials,
        assign_users_by_tasks: user.initials
      }));
    };

    return (
      <div className="space-y-4">
        {/* Tasks by User */}
        <ChartCard 
          title="Aufgaben nach Benutzer" 
          loading={loading} 
          data={data.performance['Tasks assigned to users'] || []} 
          dataKeys={{
            x: 'assign_users_by_tasks',
            bars: [
              { dataKey: 'task_count', name: 'Aufgaben' }
            ]
          }}
          filename="tasks_assigned_to_users" 
          chartType="bar"
          dateRange={dateRange}
          selectedCompany={selectedCompany}
        >
          <div className="overflow-x-auto overflow-y-hidden modern-scrollbar">
            <div className="min-w-[1200px] lg:min-w-full">
              <div className="h-[350px]">
                <ResponsiveContainer>
                  <BarChart
                    data={transformUserData(data.performance['Tasks assigned to users'] || [])}
                    margin={chartStyle.margin}
                  >
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                    <XAxis
                      dataKey="assign_users_by_tasks"
                      angle={0}
                      textAnchor="middle"
                      height={60}
                      interval={0}
                      tick={{ fill: '#001E4A', fontSize: '14px', fontFamily: 'Nexa-Book' }}
                    />
                    <YAxis tick={{ fill: '#001E4A', fontSize: '12px', fontFamily: 'Nexa-Book' }} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        
                        // Finde den ursprünglichen Namen
                        const dataItem = transformUserData(data.performance['Tasks assigned to users'] || [])
                          .find(item => item.initials === label);
                        
                        return (
                          <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-lg p-4">
                            <p className="font-nexa-black text-[#001E4A] mb-2">
                              {dataItem?.fullName || label}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#F0B72F]" />
                              <span className="text-[#001E4A] font-nexa-book text-sm">
                                Aufgaben: <span className="font-nexa-black">{payload[0]?.value || 0}</span>
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend content={<ModernLegend />} />
                    <Bar
                      dataKey="task_count"
                      name="Aufgaben"
                      fill="#F0B72F"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    );
  };

  const ChartCard = ({ title, children, loading = false, data = null, filename = null, chartType = "bar", dataKeys = null, chartCategory = 'tasks', dateRange, selectedCompany, disableExpand = false, height = "h-[380px]" }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleExport = () => {
      if (data && data.length > 0) {
        exportToExcelWithContext(data, filename || title.replace(/\s+/g, '_').toLowerCase(), title, chartType, dateRange, selectedCompany);
      }
    };

    const handleExpand = () => {
      setIsModalOpen(true);
    };

    const chartTypeIcons = {
      bar: BarChart3,
      line: LineChartIcon,
      pie: PieChartIcon,
      area: BarChart3,
    };

    const CurrentIcon = chartTypeIcons[chartType] || BarChart3;

    return (
      <>
        <div 
          className={`bg-white rounded-2xl border border-[#E6E2DF] hover:border-[#F0B72F] transition-all duration-500 hover:shadow-2xl hover:shadow-[#F0B72F]/20 p-4 sm:p-6 ${isHovered ? 'transform hover:scale-[1.02]' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {loading ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="h-6 bg-gradient-to-r from-[#E6E2DF] to-[#E6E2DF]/50 rounded w-1/4 animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-10 w-10 bg-gradient-to-br from-[#E6E2DF] to-[#E6E2DF]/70 rounded-lg animate-pulse"></div>
                  <div className="h-10 w-10 bg-gradient-to-br from-[#E6E2DF] to-[#E6E2DF]/70 rounded-lg animate-pulse"></div>
                </div>
              </div>
              <div className="h-80 bg-gradient-to-br from-[#F0B72F]/10 via-[#F0B72F]/5 to-transparent rounded-2xl animate-pulse border border-[#F0B72F]/10"></div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-gradient-to-br from-[#F0B72F]/15 to-[#F0B72F]/5 rounded-xl transition-all duration-500 shadow-lg shadow-[#F0B72F]/10 ${isHovered ? 'scale-110 from-[#F0B72F]/25 to-[#F0B72F]/10 shadow-[#F0B72F]/20' : ''}`}>
                    <CurrentIcon className="h-6 w-6 text-[#F0B72F] drop-shadow-sm" />
                  </div>
                  <h3 className="text-[16px] leading-[26px] font-medium text-[#001E4A] group-hover:text-[#F0B72F] transition-colors duration-300 tracking-tight">
                    {title}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExport}
                    className="p-3 rounded-xl bg-gradient-to-br from-[#E6E2DF]/30 to-[#E6E2DF]/10 hover:from-[#F0B72F]/15 hover:to-[#F0B72F]/5 hover:text-[#F0B72F] transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-[#F0B72F]/10"
                    title="Export als Excel"
                    disabled={!data || data.length === 0}
                  >
                    <Download className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  </button>
                  {!disableExpand && (
                    <button
                      onClick={handleExpand}
                      className="p-3 rounded-xl bg-gradient-to-br from-[#E6E2DF]/30 to-[#E6E2DF]/10 hover:from-[#F0B72F]/15 hover:to-[#F0B72F]/5 hover:text-[#F0B72F] transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-[#F0B72F]/10"
                      title="Diagrammansichten öffnen"
                      disabled={!data || data.length === 0}
                    >
                      <Maximize2 className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                  )}
                </div>
              </div>
              <div className={`bg-gradient-to-br from-[#F0B72F]/8 via-[#F0B72F]/3 to-transparent rounded-2xl p-6 transition-all duration-500 border border-[#F0B72F]/10 shadow-inner ${height} ${isHovered ? 'from-[#F0B72F]/12 shadow-lg' : ''}`}>
                {children}
              </div>
            </>
          )}
        </div>

        {/* Chart Type Modal */}
        {!disableExpand && (
          <ChartTypeModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={title}
            data={data}
            dataKeys={dataKeys}
            dateRange={dateRange}
            selectedCompany={selectedCompany}
          />
        )}
      </>
    );
  };

  return (
    <div className="bg-[#E6E2DF]/10 rounded-[50px]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        <div className="border-b border-[#E6E2DF] mb-4">
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
                className={`px-6 py-3 text-[17px] leading-[27px] font-bold transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? "text-[#001E4A] border-[#F0B72F]"
                    : "text-[#001E4A]/70 border-transparent hover:text-[#001E4A] hover:border-[#F0B72F]/50"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="py-2">
          {/* Use the isFilterLoading state to conditionally show skeleton loaders */}
          {activeTab === "overview" && (
            isFilterLoading ? <Loading /> : <OverviewTab />
          )}
          {activeTab === "performance" && (
            isFilterLoading ? <Loading /> : <PerformanceTab />
          )}
        </div>
      </div>
    </div>
  );
};

// Chart Type Modal Component for Task Analysis
const ChartTypeModal = ({ isOpen, onClose, title, data, dataKeys, dateRange, selectedCompany }) => {
  const [activeChartType, setActiveChartType] = useState('bar');
  const [dailyData, setDailyData] = useState(null);
  const [loadingDailyData, setLoadingDailyData] = useState(false);

  // Funktion zur Extraktion von Initialen aus Namen (gleich wie im Hauptdiagramm)
  const getInitials = (name) => {
    if (!name) return '';
    const nameOnly = name.split('(')[0].trim();
    return nameOnly
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase())
      .join('.');
  };

  // Verbesserte Funktion zur Generierung eindeutiger Kürzel
  const generateUniqueInitials = (users) => {
    const usedInitials = new Set();
    const userMappings = [];

    users.forEach(user => {
      let baseInitials = getInitials(user.assign_users_by_tasks);
      let uniqueInitials = baseInitials;
      let counter = 1;

      // Wenn das Kürzel bereits verwendet wird, füge eine Nummer hinzu
      while (usedInitials.has(uniqueInitials)) {
        uniqueInitials = `${baseInitials}${counter}`;
        counter++;
      }

      usedInitials.add(uniqueInitials);
      userMappings.push({
        fullName: user.assign_users_by_tasks,
        initials: uniqueInitials,
        originalInitials: baseInitials
      });
    });

    return userMappings;
  };

  // Transformiere die Benutzerdaten für bessere Anzeige
  const transformUserDataForModal = (userData) => {
    if (!userData || !Array.isArray(userData)) return userData;
    const uniqueUsers = generateUniqueInitials(userData);
    return uniqueUsers.map(user => ({
      ...userData.find(item => item.assign_users_by_tasks === user.fullName),
      fullName: user.fullName,
      initials: user.initials,
      assign_users_by_tasks: user.initials
    }));
  };

  // Fetch daily data when modal opens and dateRange spans multiple days
  useEffect(() => {
    if (isOpen && (activeChartType === 'line' || activeChartType === 'area')) {
      fetchDailyData();
    }
  }, [isOpen, activeChartType, dateRange, selectedCompany]);

  const fetchDailyData = async () => {
    // Check if we have a date range spanning multiple days
    if (!dateRange?.startDate || !dateRange?.endDate) {
      setDailyData(null);
      return;
    }

    const daysDiff = Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24));
    if (daysDiff < 1) {
      setDailyData(null);
      return;
    }

    setLoadingDailyData(true);
    
    try {
      const access_token = localStorage.getItem('access_token');
      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      // Generate array of dates between start and end
      const dates = [];
      const currentDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Fetch data for each day
      const dailyPromises = dates.map(async (date) => {
        const dateStr = formatDate(date);
        const queryString = new URLSearchParams({
          start_date: dateStr,
          end_date: dateStr,
          include_all: false,
          ...(selectedCompany && { company: selectedCompany })
        }).toString();

        try {
          // Verwende den richtigen API-Endpunkt basierend auf dem Diagrammtyp
          const apiEndpoint = title === "Aufgaben nach Benutzer" 
            ? `https://solasolution.ecomtask.de/tasks_performance?${queryString}`
            : `https://solasolution.ecomtask.de/tasks_overview?${queryString}`;
          
          const response = await fetch(apiEndpoint, {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Cache-Control': 'no-cache'
            }
          });
          
          if (response.ok) {
            const responseData = await response.json();
            
            return {
              date: dateStr,
              displayDate: date.toLocaleDateString('de-DE'),
              responseData
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(dailyPromises);
      const validResults = results.filter(result => result !== null);

      // Spezielle Behandlung für "Aufgaben nach Benutzer"
      if (title === "Aufgaben nach Benutzer") {
        // Sammle alle einzigartigen Benutzer aus den ursprünglichen Daten und generiere eindeutige Kürzel
        const allUsers = data ? generateUniqueInitials(data) : [];

        // Transformiere tägliche Daten für Benutzer
        const transformedData = validResults.map(dayResult => {
          const responseData = dayResult.responseData || {};
          const dailyUserTasks = responseData['Tasks assigned to users'] || [];
          
          // Erstelle ein Objekt mit allen Benutzern und ihren täglichen Aufgaben
          const dayData = {
            name: dayResult.displayDate,
            date: dayResult.date,
          };

          // Füge jeden Benutzer als separate Datenreihe hinzu
          allUsers.forEach(user => {
            const userDailyData = dailyUserTasks.find(task => 
              task.assign_users_by_tasks === user.fullName
            );
            dayData[user.initials] = userDailyData ? userDailyData.task_count : 0;
          });

          return dayData;
        });

        setDailyData(transformedData);
      } else {
        // Standard-Transformation für andere Diagramme
        const transformedData = validResults.map(dayResult => {
          const responseData = dayResult.responseData || {};
          return {
            name: dayResult.displayDate,
            date: dayResult.date,
            aufgaben: (responseData['Tasks created by weekday'] || []).reduce((sum, item) => sum + (item.count || 0), 0),
            kategorien: (responseData['Tasks by categories'] || []).length,
            benutzer: (responseData['Tasks assigned to users'] || []).length,
          };
        });

        setDailyData(transformedData);
      }
      
    } catch (error) {
      console.error('Error fetching daily data:', error);
      setDailyData(null);
    } finally {
      setLoadingDailyData(false);
    }
  };

  const chartTypes = [
    { id: 'bar', name: 'Balkendiagramm', icon: BarChart3 },
    { id: 'line', name: 'Liniendiagramm', icon: LineChartIcon },
    { id: 'area', name: 'Flächendiagramm', icon: BarChart3 },
    { id: 'pie', name: 'Kreisdiagramm', icon: PieChartIcon }
  ];

  const getDataKeys = () => {
    // Adjust dataKeys for daily data
    if ((activeChartType === 'line' || activeChartType === 'area') && dailyData && dailyData.length > 0) {
      // Spezielle Behandlung für "Aufgaben nach Benutzer"
      if (title === "Aufgaben nach Benutzer") {
        // Extrahiere alle Benutzer-Kürzel aus den täglichen Daten (außer 'name' und 'date')
        const userKeys = Object.keys(dailyData[0] || {}).filter(key => key !== 'name' && key !== 'date');
        
        return {
          x: 'name',
          bars: userKeys.map(userKey => ({
            dataKey: userKey,
            name: userKey // Verwende das Kürzel als Namen
          }))
        };
      }
      
      // Standard für andere Diagramme
      return {
        x: 'name',
        bars: [
          { dataKey: 'aufgaben', name: 'Aufgaben' },
          { dataKey: 'kategorien', name: 'Kategorien' },
          { dataKey: 'benutzer', name: 'Benutzer' }
        ]
      };
    }
    return dataKeys;
  };

  const getChartData = () => {
    // Use daily data for line and area charts when available
    if ((activeChartType === 'line' || activeChartType === 'area') && dailyData && dailyData.length > 0) {
      return dailyData;
    }
    
    // Transform user data if this is the "Aufgaben nach Benutzer" chart for bar and pie charts
    if (title === "Aufgaben nach Benutzer" && data && Array.isArray(data)) {
      return transformUserDataForModal(data);
    }
    
    return data;
  };

  const renderChart = () => {
    const chartData = getChartData();
    const currentDataKeys = getDataKeys();
    
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    };

    if (loadingDailyData && (activeChartType === 'line' || activeChartType === 'area')) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#F0B72F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#001E4A] font-nexa-book">Lade tägliche Daten...</p>
          </div>
        </div>
      );
    }

    switch (activeChartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <ChartGradients />
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
            <XAxis 
              dataKey={currentDataKeys?.x || 'name'} 
              tick={{ fill: "#001E4A", fontSize: 12 }} 
              angle={chartData.length > 5 ? -45 : 0}
              textAnchor={chartData.length > 5 ? 'end' : 'middle'}
              height={chartData.length > 5 ? 80 : 40}
            />
            <YAxis tick={{ fill: "#001E4A", fontSize: 12 }} />
            <Tooltip 
              content={title === "Aufgaben nach Benutzer" ? 
                ({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  // Finde den ursprünglichen Namen
                  const dataItem = chartData.find(item => item.initials === label || item.assign_users_by_tasks === label);
                  
                  return (
                    <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-lg p-4">
                      <p className="font-nexa-black text-[#001E4A] mb-2">
                        {dataItem?.fullName || label}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#F0B72F]" />
                        <span className="text-[#001E4A] font-nexa-book text-sm">
                          Aufgaben: <span className="font-nexa-black">{payload[0]?.value || 0}</span>
                        </span>
                      </div>
                    </div>
                  );
                } : 
                <ModernTooltip />
              } 
            />
            <Legend content={<ModernLegend />} />
            {currentDataKeys?.bars?.map((key, index) => (
              <Bar
                key={key.dataKey}
                dataKey={key.dataKey}
                name={key.name}
                fill={modernChartColors[index % modernChartColors.length]}
                radius={[6, 6, 0, 0]}
                animationDuration={1000}
              />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <RechartsLineChart {...commonProps}>
            <ChartGradients />
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
            <XAxis 
              dataKey={currentDataKeys?.x || 'name'} 
              tick={{ fill: "#001E4A", fontSize: 12 }}
              angle={chartData.length > 5 ? -45 : 0}
              textAnchor={chartData.length > 5 ? 'end' : 'middle'}
              height={chartData.length > 5 ? 80 : 40}
            />
            <YAxis tick={{ fill: "#001E4A", fontSize: 12 }} />
            <Tooltip 
              content={title === "Aufgaben nach Benutzer" ? 
                ({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  // Generiere die gleichen eindeutigen Kürzel wie in fetchDailyData
                  const allUsers = data ? generateUniqueInitials(data) : [];
                  
                  return (
                    <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-lg p-4">
                      <p className="font-nexa-black text-[#001E4A] mb-3 text-base border-b border-[#E6E2DF] pb-2">
                        {label}
                      </p>
                      <div className="space-y-2">
                        {payload.map((item, index) => {
                          // Finde den vollen Namen für das eindeutige Kürzel
                          const allUsers = data ? generateUniqueInitials(data) : [];
                          const userInfo = allUsers.find(user => user.initials === item.dataKey);
                          const displayName = userInfo ? userInfo.fullName : item.dataKey;
                          
                          return (
                            <div key={index} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full shadow-sm"
                                  style={{ backgroundColor: item.fill }}
                                />
                                <span className="text-[#001E4A]/70 font-nexa-book text-sm">
                                  {displayName}
                                </span>
                              </div>
                              <span className="text-[#001E4A] font-nexa-black text-sm">
                                {item.value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                } : 
                <ModernTooltip />
              } 
            />
            <Legend content={<ModernLegend />} />
            {currentDataKeys?.bars?.map((key, index) => (
              <Line
                key={key.dataKey}
                type="monotone"
                dataKey={key.dataKey}
                name={key.name}
                stroke={modernChartColors[index % modernChartColors.length]}
                strokeWidth={3}
                dot={{ r: 6, strokeWidth: 2, fill: modernChartColors[index % modernChartColors.length] }}
                activeDot={{ r: 8 }}
                animationDuration={1000}
              />
            ))}
          </RechartsLineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <ChartGradients />
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
            <XAxis 
              dataKey={currentDataKeys?.x || 'name'} 
              tick={{ fill: "#001E4A", fontSize: 12 }}
              angle={chartData.length > 5 ? -45 : 0}
              textAnchor={chartData.length > 5 ? 'end' : 'middle'}
              height={chartData.length > 5 ? 80 : 40}
            />
            <YAxis tick={{ fill: "#001E4A", fontSize: 12 }} />
            <Tooltip 
              content={title === "Aufgaben nach Benutzer" ? 
                ({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  return (
                    <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-lg p-4">
                      <p className="font-nexa-black text-[#001E4A] mb-3 text-base border-b border-[#E6E2DF] pb-2">
                        {label}
                      </p>
                      <div className="space-y-2">
                        {payload.map((item, index) => {
                          // Finde den vollen Namen für das Kürzel
                          const userInfo = data?.find(user => getInitials(user.assign_users_by_tasks) === item.dataKey);
                          const displayName = userInfo ? userInfo.assign_users_by_tasks : item.dataKey;
                          
                          return (
                            <div key={index} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full shadow-sm"
                                  style={{ backgroundColor: item.fill }}
                                />
                                <span className="text-[#001E4A]/70 font-nexa-book text-sm">
                                  {displayName}
                                </span>
                              </div>
                              <span className="text-[#001E4A] font-nexa-black text-sm">
                                {item.value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                } : 
                <ModernTooltip />
              } 
            />
            <Legend content={<ModernLegend />} />
            {currentDataKeys?.bars?.map((key, index) => (
              <Area
                key={key.dataKey}
                type="monotone"
                dataKey={key.dataKey}
                name={key.name}
                stackId="1"
                stroke={modernChartColors[index % modernChartColors.length]}
                fill={modernChartColors[index % modernChartColors.length]}
                fillOpacity={0.6}
                animationDuration={1000}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        // For pie charts, we can handle both single and multiple data series
        if (currentDataKeys?.bars?.length >= 1) {
          // If multiple bars, use the first data key for pie chart
          const dataKey = currentDataKeys.bars[0].dataKey;
          const pieData = chartData.map((item, index) => ({
            name: item[currentDataKeys.x || 'name'],
            value: item[dataKey],
            fill: modernChartColors[index % modernChartColors.length],
            fullName: item.fullName || item[currentDataKeys.x || 'name'] // Speichere den vollen Namen
          }));

          return (
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={120}
                innerRadius={40}
                dataKey="value"
                animationDuration={1000}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  const item = payload[0];
                  const displayName = item.payload.fullName || item.name;
                  
                  return (
                    <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-lg p-4">
                      <p className="font-nexa-black text-[#001E4A] mb-2">
                        {displayName}
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: item.fill || item.color }}
                        />
                        <span className="text-[#001E4A] font-nexa-book text-sm">
                          Aufgaben: <span className="font-nexa-black">{item.value}</span>
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend content={<ModernLegend />} />
            </PieChart>
          );
        }
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <PieChartIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Keine Daten für Kreisdiagramm verfügbar</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Only render the modal if it's open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E6E2DF]">
          <div className="flex flex-col">
            <h2 className="text-2xl font-nexa-black text-[#001E4A]">{title} - Diagrammansichten</h2>
            {dailyData && (activeChartType === 'line' || activeChartType === 'area') && (
              <p className="text-sm text-[#001E4A]/70 mt-1">
                Zeigt tägliche Daten vom {dateRange?.startDate ? new Date(dateRange.startDate).toLocaleDateString('de-DE') : ''} bis {dateRange?.endDate ? new Date(dateRange.endDate).toLocaleDateString('de-DE') : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#E6E2DF]/50 transition-colors"
          >
            <X className="w-6 h-6 text-[#001E4A]" />
          </button>
        </div>

        {/* Chart Type Selector */}
        <div className="flex gap-2 p-6 border-b border-[#E6E2DF] bg-[#E6E2DF]/10">
          {chartTypes.map((type) => {
            const Icon = type.icon;
            const isTimeSeriesChart = type.id === 'line' || type.id === 'area';
            const hasDailyData = dailyData && dailyData.length > 0;
            
            return (
              <button
                key={type.id}
                onClick={() => setActiveChartType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeChartType === type.id
                    ? 'bg-[#F0B72F] text-[#001E4A] shadow-lg'
                    : 'bg-white text-[#001E4A]/70 hover:bg-[#F0B72F]/10 hover:text-[#001E4A]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-nexa-book text-sm">{type.name}</span>
                {isTimeSeriesChart && hasDailyData && (
                  <span className="ml-1 text-xs bg-green-100 text-green-700 px-1 rounded">
                    {dailyData.length} Tage
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Chart Area */}
        <div className="flex-1 p-6 bg-gradient-to-br from-[#F0B72F]/5 to-transparent">
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAnalysisDashboard;