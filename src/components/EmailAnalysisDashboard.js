import React, { useState, useEffect , useRef , useCallback} from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, Area, AreaChart, PieChart, Pie, Cell, LineChart as RechartsLineChart } from 'recharts';
import { Mail, Send, TrendingUp, Inbox, Archive, Clock, Timer, Reply, Forward, CheckCircle, Download, Maximize2, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, X } from 'lucide-react';
import ModernToggleGroup from './ModernToggleGroup';
import AnimatedValue from './AnimatedValue';

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
  "#8B5CF6", "#F0B72F", "#EC4899", "#6B7280", "#84CC16"
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

    // Prüfe ob es sich um Serviceniveau-Daten handelt
    if (
      name?.toLowerCase().includes('serviceniveau') ||
      name?.toLowerCase().includes('service_level') ||
      name?.toLowerCase().includes('service level') ||
      payload[0]?.payload?.displayDate // Dies deutet auf Serviceniveau-Daten hin
    ) {
      return `${Number(value).toFixed(1)}%`;
    }

    if (
      name?.toLowerCase().includes('%') ||
      name?.toLowerCase().includes('rate') ||
      name?.toLowerCase().includes('niveau') ||
      name?.toLowerCase().includes('acc') ||
      name?.toLowerCase().includes('conversion')
    ) {
      return `${Number(value).toFixed(1)}%`;
    }

    if (
      name?.toLowerCase().includes('zeit') ||
      name?.toLowerCase().includes('time') ||
      name?.toLowerCase().includes('sec') ||
      name?.toLowerCase().includes('min')
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

// Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const formatValue = (value, name) => {
    if (typeof value !== 'number') return value;

    if (name?.toLowerCase().includes('%')) {
      return `${Number(value).toFixed(1)}%`;
    }
    if (name?.toLowerCase().includes('zeit') || 
        name?.toLowerCase().includes('time') || 
        name?.toLowerCase().includes('sec') || 
        name?.toLowerCase().includes('min')) {
      // Return both seconds and minutes for time values
      if (name?.toLowerCase().includes('sek') || name?.toLowerCase().includes('sec')) {
        return `${Number(value).toFixed(1)} Sek`;
      }
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
const StatCard = ({ title, value, icon: Icon, change, description, loading = false, trend = "neutral", timeInSeconds, timeInMinutes }) => (
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
        <div className="flex items-center justify-between mb-3">
          <div className="text-[30px] leading-[38px] font-semibold text-[#001E4A] tracking-tight">
            <AnimatedValue value={value} />
          </div>
          {(timeInSeconds !== undefined || timeInMinutes !== undefined) && (
            <div className="text-base font-nexa-book text-[#001E4A] text-right">
              {timeInSeconds && <div className="text-sm opacity-70">{timeInSeconds} sek</div>}
              {timeInMinutes && <div className="text-xs opacity-50">{timeInMinutes} min</div>}
            </div>
          )}
        </div>
        {change && description && (
          <p className="text-[14px] leading-[24px] text-[#001E4A]/70">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shadow-sm ${
                change.includes("-") 
                  ? "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200" 
                  : change.includes("+")
                  ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200"
                  : "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200"
              }`}
            >
              {change}
            </span>
            <span className="ml-2">{description}</span>
          </p>
        )}
      </>
    )}
  </div>
);

const ChartCard = ({ title, children, isWideChart = false, loading = false, data, filename, chartType = "bar", dataKeys, dateRange, selectedCompany, disableExpand = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExport = () => {
    if (data && data.length > 0) {
      exportToExcel(data, filename || title.replace(/\s+/g, '_').toLowerCase(), title);
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
                <h3 className="text-[20px] leading-[30px] font-bold text-[#001E4A] tracking-tight">
                  {title}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="p-3 rounded-xl bg-gradient-to-br from-[#E6E2DF]/30 to-[#E6E2DF]/10 hover:from-[#F0B72F]/15 hover:to-[#F0B72F]/5 hover:text-[#F0B72F] transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-[#F0B72F]/10"
                  title="Export als CSV"
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
            <div className={`bg-gradient-to-br from-[#F0B72F]/8 via-[#F0B72F]/3 to-transparent rounded-2xl p-6 transition-all duration-500 border border-[#F0B72F]/10 shadow-inner h-[380px] ${isHovered ? 'from-[#F0B72F]/12 shadow-lg' : ''}`}>
              {isWideChart ? (
                <div className="overflow-x-auto overflow-y-hidden modern-scrollbar">
                  <div className="min-w-[1000px] lg:min-w-full">
                    <div className="h-[300px]">
                      {children}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[300px]">
                  {children}
                </div>
              )}
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
    'Sola Solution Dashboard - E-Mail Analyse Export',
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
  link.setAttribute("download", `Email_Analyse_${filename}_${currentDate.replace(/[:.]/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Chart Type Modal Component for Email Analysis
const ChartTypeModal = ({ isOpen, onClose, title, data, dataKeys, dateRange, selectedCompany }) => {
  const [activeChartType, setActiveChartType] = useState('bar');
  const [dailyData, setDailyData] = useState(null);
  const [loadingDailyData, setLoadingDailyData] = useState(false);

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
      // Verwende die bereits vorhandenen formattedData aus dem übergeordneten Scope
      const transformedData = formattedData.map(item => ({
        name: item.displayDate,
        service_level_gross: item.service_level_gross
      }));

      setDailyData(transformedData);
      
    } catch (error) {
      // console.error('Error processing daily data:', error);
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

  const getChartData = () => {
    // Unterscheide zwischen den verschiedenen Diagramm-Titeln
    if (title.includes('Serviceniveau')) {
      // Für Serviceniveau-Diagramm die Original-Daten verwenden
      return data;
    }
    // Für alle anderen Diagramme die übergebenen Daten verwenden
    return data;
  };

  const getDataKeys = () => {
    // Unterscheide zwischen den verschiedenen Diagramm-Titeln
    if (title.includes('Serviceniveau')) {
      return {
        x: 'displayDate',
        bars: [
          { dataKey: 'service_level_gross', name: 'Serviceniveau' }
        ]
      };
    }
    // Für alle anderen Diagramme die übergebenen DataKeys verwenden
    return dataKeys;
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
            <Tooltip content={<ModernTooltip />} />
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
            <YAxis 
              tick={{ fill: "#001E4A", fontSize: 12 }}
              domain={title.includes('Serviceniveau') ? [0, 100] : ['auto', 'auto']}
            />
            <Tooltip content={<ModernTooltip />} />
            <Legend content={<ModernLegend />} />
            {title.includes('Serviceniveau') ? (
              <Line
                type="monotone"
                dataKey="service_level_gross"
                name="Serviceniveau"
                stroke={modernChartColors[0]}
                strokeWidth={3}
                dot={{ r: 6, strokeWidth: 2, fill: modernChartColors[0] }}
                activeDot={{ r: 8 }}
                animationDuration={1000}
              />
            ) : (
              currentDataKeys?.bars?.map((key, index) => (
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
              ))
            )}
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
            <YAxis 
              tick={{ fill: "#001E4A", fontSize: 12 }}
              domain={title.includes('Serviceniveau') ? [0, 100] : ['auto', 'auto']}
            />
            <Tooltip content={<ModernTooltip />} />
            <Legend content={<ModernLegend />} />
            {title.includes('Serviceniveau') ? (
              <Area
                type="monotone"
                dataKey="service_level_gross"
                name="Serviceniveau"
                stroke={modernChartColors[0]}
                fill={modernChartColors[0]}
                fillOpacity={0.6}
                animationDuration={1000}
              />
            ) : (
              currentDataKeys?.bars?.map((key, index) => (
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
              ))
            )}
          </AreaChart>
        );

      case 'pie':
        // For pie charts, we can handle both single and multiple data series
        if (currentDataKeys?.bars?.length >= 1) {
          // If multiple bars, use the first data key for pie chart
          const dataKey = currentDataKeys.bars[0].dataKey;
          const pieData = chartData.map((item, index) => ({
            name: item[currentDataKeys.x || 'name'],
            value: title.includes('Serviceniveau') ? 
              parseFloat(item[dataKey]).toFixed(1) + '%' : 
              item[dataKey],
            rawValue: item[dataKey], // Speichere den Rohwert für die Tooltip-Anzeige
            fill: modernChartColors[index % modernChartColors.length]
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
                dataKey="rawValue"
                animationDuration={1000}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  return (
                    <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-lg p-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#001E4A]/70 font-nexa-book">
                          {payload[0].name}
                        </span>
                        <span className="text-[#001E4A] font-nexa-black">
                          {title.includes('Serviceniveau') ? 
                            `${parseFloat(payload[0].value).toFixed(1)}%` : 
                            payload[0].value}
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

const EmailAnalysisDashboard = ({ dateRange, selectedCompany }) => {
  const [activeTab, setActiveTab] = useState('uebersicht');
  const [emailData, setEmailData] = useState(null);
  const [emailSubKPIs, setEmailSubKPIs] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [subKPIs, setSubKPIs] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  
  // Add data caching refs
  const dataCache = useRef({});
  const abortController = useRef(null);
  const isMounted = useRef(true);
  
  // Cache expiration - 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;
  
  // Format date consistently for cache keys and API requests
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Generate cache key from all parameters
  const getCacheKey = useCallback((company, dateParams, domainValue) => {
    return `email_${company || 'all'}_${formatDate(dateParams.startDate) || 'none'}_${formatDate(dateParams.endDate) || 'none'}_${dateParams.isAllTime ? 'all' : 'range'}_${domainValue || 'all'}`;
  }, []);
  
  // Check if cache is valid (not expired)
  const isCacheValid = useCallback((cacheKey) => {
    const cacheItem = dataCache.current[cacheKey];
    return cacheItem && (Date.now() - cacheItem.timestamp < CACHE_DURATION);
  }, [CACHE_DURATION]);

  // List of clients that should only have Sales view (no Service toggle)
  const salesOnlyClients = ['Galeria', 'ADAC', 'Urlaub','UrlaubsguruKF'];
  const isSalesOnlyClient = selectedCompany && salesOnlyClients.includes(selectedCompany);

  // If client is in our restricted list, force sales view
  useEffect(() => {
    if (isSalesOnlyClient) {
      setDomain("Sales");
    }
  }, [selectedCompany, isSalesOnlyClient]);

  // Optimized fetch function with caching
  const fetchData = useCallback(async () => {
    try {
      // Show loading state
      setIsFilterLoading(true);
      
      // Generate cache key for current request parameters
      const cacheKey = getCacheKey(selectedCompany, dateRange, domain);
      
      // Check if we have valid cached data
      if (dataCache.current[cacheKey] && isCacheValid(cacheKey)) {
        // console.log('Using cached email data for:', selectedCompany);
        const cachedData = dataCache.current[cacheKey].data;
        
        // Set all data from cache
        setEmailData(cachedData.emailData);
        setEmailSubKPIs(cachedData.emailSubKPIs);
        setOverviewData(cachedData.overviewData);
        setSubKPIs(cachedData.subKPIs);
        setPerformanceData(cachedData.performanceData);
        
        // Short timeout to prevent flickering
        setTimeout(() => {
          setIsFilterLoading(false);
          setLoading(false);
        }, 100);
        return;
      }
      
      // Cancel any ongoing requests when parameters change
      if (abortController.current) {
        abortController.current.abort();
      }
      
      // Create new abort controller for this request
      abortController.current = new AbortController();
      
      const access_token = localStorage.getItem('access_token');
      
      // Build query string with all parameters
      const queryString = new URLSearchParams({
        ...(dateRange.startDate && { start_date: formatDate(dateRange.startDate) }),
        ...(dateRange.endDate && { end_date: formatDate(dateRange.endDate) }),
        include_all: dateRange.isAllTime || false,
        ...(selectedCompany && { company: selectedCompany }),
        ...(domain && { domain: domain })
      }).toString();
      
      // Request config with timeout
      const config = {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        signal: abortController.current.signal
      };
      
      // Set timeout to prevent hanging requests
      const timeoutId = setTimeout(() => {
        if (abortController.current) {
          abortController.current.abort();
        }
      }, 15000); // 15 second timeout
      
      // console.log('Fetching data with params:', {
      //   queryString,
      //   dateRange,
      //   selectedCompany,
      //   domain
      // });

      // Fetch all data in parallel with better error handling
      const apiCalls = [
        fetch(`https://solasolution.ecomtask.de/analytics_email?${queryString}`, config)
          .then(res => res.ok ? res.json() : Promise.resolve({})),
        fetch('https://solasolution.ecomtask.de/analytics_email_subkpis', config)
          .then(res => res.ok ? res.json() : Promise.resolve({})),
        fetch(`https://solasolution.ecomtask.de/email_overview?${queryString}`, config)
          .then(async res => {
            if (res.ok) {
              const data = await res.json();
              return data;
            }
            return Promise.resolve({});
          }),
        fetch(`https://solasolution.ecomtask.de/email_overview_sub_kpis?${queryString}`, config)
          .then(res => res.ok ? res.json() : Promise.resolve({})),
        fetch(`https://solasolution.ecomtask.de/email_performance?${queryString}`, config)
          .then(res => res.ok ? res.json() : Promise.resolve({}))
          .catch(() => ({}))
      ];

      const [emailRes, emailSubKPIsRes, overviewRes, subKPIsRes, performanceRes] = await Promise.all(apiCalls);
      
      // Clear timeout since request completed
      clearTimeout(timeoutId);
      
      // Prepare data object for caching
      const dataToCache = {
        emailData: emailRes,
        emailSubKPIs: emailSubKPIsRes,
        overviewData: overviewRes,
        subKPIs: subKPIsRes,
        performanceData: performanceRes
      };
      
      // Save to cache with timestamp
      dataCache.current[cacheKey] = {
        data: dataToCache,
        timestamp: Date.now()
      };
      
      // Update state if component is still mounted
      if (isMounted.current) {
        setEmailData(emailRes);
        setEmailSubKPIs(emailSubKPIsRes);
        setOverviewData(overviewRes);
        setSubKPIs(subKPIsRes);
        setPerformanceData(performanceRes);
      }
    } catch (error) {
      // Handle errors (ignore abort errors)
      if (error.name !== 'AbortError') {
        // console.error('Error fetching email data:', error);
        
        // Try to use cached data as fallback even if expired
        const cacheKey = getCacheKey(selectedCompany, dateRange, domain);
        if (dataCache.current[cacheKey]) {
          const cachedData = dataCache.current[cacheKey].data;
          setEmailData(cachedData.emailData);
          setEmailSubKPIs(cachedData.emailSubKPIs);
          setOverviewData(cachedData.overviewData);
          setSubKPIs(cachedData.subKPIs);
          setPerformanceData(cachedData.performanceData);
        }
      }
    } finally {
      // Use small timeout to prevent flickering
      if (isMounted.current) {
        setTimeout(() => {
          setIsFilterLoading(false);
          setLoading(false);
        }, 300);
      }
    }
  }, [dateRange, selectedCompany, domain, getCacheKey, isCacheValid]);
  
  // Fetch data when parameters change
  useEffect(() => {
    if (dateRange.startDate || dateRange.endDate || dateRange.isAllTime) {
      fetchData();
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [dateRange, selectedCompany, domain, fetchData]);
  
  // Track component mount state
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleDropdownChange = (e) => setActiveTab(e.target.value);

  const tabs = [
    { id: "uebersicht", name: "Übersicht" },
    { id: "leistung", name: "Leistungskennzahlen" }
  ];

  const UebersichtTab = () => {
    if (loading || !emailData || !subKPIs || !overviewData) return <Loading />;

    // Get values from both data sources, with fallbacks
    const slGross = emailData?.['SL Gross'] || 0;

    // For Verweilzeit (dwell time)
    const dwellTimeFormatted = emailData?.['Total Dwell Time (sec)'] || "0:00:00";
    const dwellTimeDecimal = emailData?.['Total Dwell Time (dec)'] || 0;

    // For Bearbeitungszeit (processing time)
    const processingTimeFormatted = overviewData?.['Total Processing Time (min)'] || "0:00:00";
    const processingTimeDecimal = overviewData?.['Total Processing Time (dec)'] || 0;

    // Format the daily processing time data
    // console.log('Complete overview data:', overviewData);

    // Extrahiere die täglichen Daten aus dem overviewData
    const dailyData = overviewData.daily_data || [];
    // console.log('Daily data:', dailyData);

    const formattedProcessingTimeData = dailyData
      .map(item => {
        let displayDate = '';
        try {
          const date = new Date(item.date);
          displayDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
        } catch (error) {
          // console.error('Date formatting error:', error);
          displayDate = 'N/A';
        }

        // Extrahiere die Bearbeitungszeit für diesen Tag
        const processingTime = item.processing_time_minutes || 0;

        return {
          displayDate,
          processing_time_min: parseFloat(processingTime.toFixed(2))
        };
      })
      .filter(item => item.displayDate !== 'N/A')
      .sort((a, b) => {
        // Sort by date parts
        const [dayA, monthA] = a.displayDate.split('.');
        const [dayB, monthB] = b.displayDate.split('.');
        const dateA = new Date(2024, parseInt(monthA) - 1, parseInt(dayA));
        const dateB = new Date(2024, parseInt(monthB) - 1, parseInt(dayB));
        return dateA - dateB;
      });

    // console.log('Formatted processing time data:', formattedProcessingTimeData);

    const uebersichtStats = [
      {
        title: "Empfangene E-Mails",
        value: (emailData['email recieved'] || 0).toLocaleString(),
        icon: Inbox,
      },
      {
        title: "Gesendete E-Mails",
        value: emailData['email sent'] || 0,
        icon: Mail,
      },
      {
        title: "Serviceniveau",
        value: `${overviewData.service_level_gross || 0}%`,
        icon: CheckCircle,
      },
      {
        title: "Archivierte E-Mails",
        value: (overviewData['archived emails'] || 0).toLocaleString(),
        icon: Reply,
      }
    ];

    // Format the daily service level data
    const formattedData = (overviewData.daily_service_level_gross || [])
      .map(item => {
        let displayDate = '';
        try {
          if (item.interval) {
            const dateParts = item.interval.split('-');
            if (dateParts.length === 3) {
              displayDate = `${dateParts[2]}.${dateParts[1]}`;
            } else {
              displayDate = item.interval;
            }
          }
        } catch (error) {
          // console.error('Date formatting error:', error);
          displayDate = 'N/A';
        }

        return {
          ...item,
          displayDate: displayDate,
          service_level_gross: parseFloat((item.service_level_gross || 0).toFixed(1))
        };
      })
      .reverse();

    return (
      <div className="space-y-4">
        {/* Modernized Toggle Button with reduced margin */}
        {!isSalesOnlyClient && (
          <ModernToggleGroup
            value={domain}
            onChange={setDomain}
            className="mb-3"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            value={dwellTimeFormatted}
            icon={Clock}
            timeInSeconds={Math.round(convertToSeconds(dwellTimeFormatted))}
            timeInMinutes={dwellTimeDecimal.toFixed(2)}
          />
          <StatCard
            title="AHT (Durchschnittliche Bearbeitungszeit)"
            value={processingTimeFormatted}
            icon={Clock}
            timeInSeconds={Math.round(convertToSeconds(processingTimeFormatted))}
            timeInMinutes={processingTimeDecimal.toFixed(2)}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard 
            title="E-Mail-Bearbeitungsübersicht"
            data={[
              { name: 'Empfangen', value: emailData['email recieved'] || 0 },
              { name: 'Gesendet', value: emailData['email sent'] || 0 },
              { name: 'Archiviert', value: emailData['email archived'] || 0 }
            ]}
            dataKeys={{
              x: 'name',
              bars: [
                { dataKey: 'value', name: 'Anzahl' }
              ]
            }}
            filename="Email_Bearbeitungsuebersicht"
            chartType="bar"
            dateRange={dateRange}
            selectedCompany={selectedCompany}
          >
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={[
                  { name: 'Empfangen', value: emailData['email recieved'] || 0 },
                  { name: 'Gesendet', value: emailData['email sent'] || 0 },
                  { name: 'Archiviert', value: emailData['email archived'] || 0 }
                ]}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#001E4A', fontSize: 13 }}
                    stroke="#E6E2DF"
                  />
                  <YAxis
                    tick={{ fill: '#001E4A', fontSize: 13 }}
                    stroke="#E6E2DF"
                  />
                  <Tooltip content={<ModernTooltip />} />
                  <Legend content={<ModernLegend />} />
                  <Bar
                    dataKey="value"
                    name="Anzahl"
                    fill="#F0B72F"
                    radius={[8, 8, 0, 0]}
                    animationDuration={1200}
                    animationBegin={200}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard 
            title="Tägliche Serviceniveau-Leistung"
            data={formattedData}
            dataKeys={{
              x: 'displayDate',
              bars: [
                { dataKey: 'service_level_gross', name: 'Serviceniveau' }
              ]
            }}
            filename="Taegliche_Serviceniveau_Leistung"
            chartType="line"
            dateRange={dateRange}
            selectedCompany={selectedCompany}
          >
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formattedData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis
                    dataKey="displayDate"
                    height={60}
                    angle={-45}
                    textAnchor="end"
                    {...chartConfig.xAxis}
                    dx={-8}
                    dy={10}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#001E4A', fontSize: 12 }}
                    fontFamily="Nexa-Book"
                    stroke="#E6E2DF"
                    domain={[0, 100]}
                  />
                  <Tooltip content={<ModernTooltip />} />
                  <Legend content={<ModernLegend />} />
                  <Line
                    type="monotone"
                    dataKey="service_level_gross"
                    name="Serviceniveau"
                    stroke={chartColors.primary}
                    strokeWidth={3}
                    dot={{ fill: chartColors.primary, r: 6, strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: chartColors.primary }}
                    animationDuration={1200}
                    animationBegin={200}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    );
  };

  const LeistungTab = () => {
    if (!performanceData) return <Loading />;

    return (
      <div className="space-y-4">
        {/* Modernized Toggle Button with reduced margin */}
        {!isSalesOnlyClient && (
          <ModernToggleGroup
            value={domain}
            onChange={setDomain}
            className="mb-3"
          />
        )}

        <div className="grid grid-cols-1 gap-6">
          <ChartCard 
            isWideChart={true} 
            title="Bearbeitungszeit nach Postfach"
            data={performanceData.Processing_time_by_mailbox || []}
            dataKeys={{
              x: 'mailbox',
              bars: [
                { dataKey: 'processing_time', name: 'Bearbeitungszeit (Minuten)' }
              ]
            }}
            filename="Bearbeitungszeit_nach_Postfach"
            chartType="line"
            dateRange={dateRange}
            selectedCompany={selectedCompany}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceData.Processing_time_by_mailbox || []}
                margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
              >
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                <XAxis
                  dataKey="mailbox"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#001E4A', fontSize: 12 }}
                  fontFamily="Nexa-Book"
                  stroke="#E6E2DF"
                />
                <YAxis 
                  tick={{ fill: '#001E4A', fontSize: 12 }}
                  fontFamily="Nexa-Book"
                  stroke="#E6E2DF"
                />
                <Tooltip content={<ModernTooltip />} />
                <Legend content={<ModernLegend />} />
                <Line
                  type="monotone"
                  dataKey="processing_time"
                  name="Bearbeitungszeit (Minuten)"
                  stroke={chartColors.primary}
                  strokeWidth={3}
                  dot={{ fill: chartColors.primary, r: 6, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                  animationDuration={1200}
                  animationBegin={200}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard 
            isWideChart={true} 
            title="Serviceniveau nach Postfach"
            data={performanceData.service_level_by_mailbox || []}
            dataKeys={{
              x: 'mailbox',
              bars: [
                { dataKey: 'service_level_gross', name: 'Serviceniveau' }
              ]
            }}
            filename="Serviceniveau_nach_Postfach"
            chartType="line"
            dateRange={dateRange}
            selectedCompany={selectedCompany}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceData.service_level_by_mailbox || []}
                margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
              >
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                <XAxis
                  dataKey="mailbox"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#001E4A', fontSize: 12 }}
                  fontFamily="Nexa-Book"
                  stroke="#E6E2DF"
                />
                <YAxis
                  tick={{ fill: '#001E4A', fontSize: 12 }}
                  fontFamily="Nexa-Book"
                  stroke="#E6E2DF"
                  domain={[0, 100]}
                />
                <Tooltip content={<ModernTooltip />} />
                <Legend content={<ModernLegend />} />
                <Line
                  type="monotone"
                  dataKey="service_level_gross"
                  name="Serviceniveau"
                  stroke={chartColors.primary}
                  strokeWidth={3}
                  dot={{ fill: chartColors.primary, r: 6, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                  animationDuration={1200}
                  animationBegin={200}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard 
            isWideChart={true} 
            title="Antworten nach Kunden"
            data={performanceData.respone_by_customers || []}
            dataKeys={{
              x: 'customer',
              bars: [
                { dataKey: 'sent', name: 'Gesendet' },
                { dataKey: 'recieved', name: 'Vorgänge' }
              ]
            }}
            filename="Antworten_nach_Kunden"
            chartType="bar"
            dateRange={dateRange}
            selectedCompany={selectedCompany}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceData.respone_by_customers || []}
                margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
              >
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                <XAxis
                  dataKey="customer"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#001E4A', fontSize: 12 }}
                  fontFamily="Nexa-Book"
                  stroke="#E6E2DF"
                />
                <YAxis 
                  tick={{ fill: '#001E4A', fontSize: 12 }}
                  fontFamily="Nexa-Book"
                  stroke="#E6E2DF"
                />
                <Tooltip content={<ModernTooltip />} />
                <Legend content={<ModernLegend />} />
                <Bar
                  dataKey="sent"
                  name="Gesendet"
                  fill={chartColors.primary}
                  radius={[8, 8, 0, 0]}
                  animationDuration={1200}
                  animationBegin={200}
                />
                <Bar
                  dataKey="recieved"
                  name="Vorgänge"
                  fill={chartColors.secondary}
                  radius={[8, 8, 0, 0]}
                  animationDuration={1200}
                  animationBegin={400}
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
        <div className="border-b border-[#E6E2DF] mb-4">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={handleDropdownChange}
              className="w-full px-4 py-2 text-[17px] leading-[27px] text-[#001E4A] border border-[#E6E2DF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F0B72F] focus:border-[#F0B72F]"
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
          {activeTab === "uebersicht" && (
            isFilterLoading ? <Loading /> : <UebersichtTab />
          )}
          {activeTab === "leistung" && (
            isFilterLoading ? <Loading /> : <LeistungTab />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailAnalysisDashboard;