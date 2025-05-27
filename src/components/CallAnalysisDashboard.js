"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart,
  LineChart as RechartsLineChart,
} from "recharts";
import {
  Phone,
  Activity,
  CheckCircle,
  Clock,
  Clipboard,
  CreditCard,
  Download,
  Maximize2,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  X,
} from "lucide-react";
import ModernToggleGroup from "./ModernToggleGroup";
import AnimatedValue from "./AnimatedValue";

// Brand Colors
const colors = {
  primary: "#F0B72F", // SolaGelb
  dark: "#001E4A", // SolaBlau
  gray: "#E6E2DF", // SolaGrau
  white: "#ffffff",
};

// Chart Colors
const CHART_COLORS = [
  "#F0B72F", // Primary (SolaGelb)
  "#001E4A", // Secondary (SolaBlau)
  "#E6E2DF", // Tertiary (SolaGrau)
  "#001E4A80", // SolaBlau with opacity
  "#F0B72F80", // SolaGelb with opacity
  "#E6E2DF80", // SolaGrau with opacity
];

// Modern Chart Colors Array
const modernChartColors = [
  "#F0B72F", "#001E4A", "#10B981", "#EF4444", "#3B82F6",
  "#8B5CF6", "#F0B72F", "#EC4899", "#6B7280", "#84CC16"
];

// Helper function to translate English weekdays to German
const translateWeekdayToGerman = (weekday) => {
  const daysMap = {
    "Monday": "MO",
    "Tuesday": "DI",
    "Wednesday": "MI",
    "Thursday": "DO",
    "Friday": "FR",
    "Saturday": "SA",
    "Sunday": "SO"
  };
  return daysMap[weekday] || weekday;
};

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
      name?.toLowerCase().includes("asr") ||
      name?.toLowerCase().includes("sla")
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
    'Sola Solution Dashboard - Anruf Analyse Export',
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
  link.setAttribute("download", `Anruf_Analyse_${filename}_${currentDate.replace(/[:.]/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Chart Type Modal Component for Call Analysis - MOVED BEFORE ChartCard
const ChartTypeModal = ({ isOpen, onClose, title, data, dataKeys, dateRange, selectedCompany, salesData, serviceData, overviewData }) => {
  const [activeChartType, setActiveChartType] = useState('bar');
  const [dailySalesServiceData, setDailySalesServiceData] = useState(null);
  const [loadingDailyData, setLoadingDailyData] = useState(false);

  // Funktion zum Abrufen der täglichen Vertrieb/Service-Daten
  const fetchDailySalesServiceData = async () => {
    if (title !== "Gesamtanrufe - Vertrieb vs Service" || !overviewData?.["Daily Call Volume"]) {
      return;
    }

    setLoadingDailyData(true);
    try {
      const access_token = localStorage.getItem("access_token");
      const dailyCallData = overviewData["Daily Call Volume"];
      
      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      // Erstelle Promises für Sales und Service Daten für jeden Tag
      const dailyPromises = dailyCallData.map(async (dayData) => {
        const weekday = dayData["call metrics"]?.weekday;
        
        // Für echte tägliche Daten müssten wir das Datum haben, aber da wir nur Wochentage haben,
        // verwenden wir die Gesamtverhältnisse und die täglichen Gesamtzahlen
        const totalCalls = dayData["call metrics"]?.total_calls || 0;
        const totalSales = salesData?.total_calls || 0;
        const totalService = serviceData?.total_calls || 0;
        const totalOverall = totalSales + totalService;
        
        // Berechne Verhältnis basierend auf Gesamtdaten
        const salesRatio = totalOverall > 0 ? totalSales / totalOverall : 0;
        const serviceRatio = totalOverall > 0 ? totalService / totalOverall : 0;
        
        return {
          weekday: weekday,
          tag: translateWeekdayToGerman(weekday),
          Vertrieb: Math.round(totalCalls * salesRatio),
          Service: Math.round(totalCalls * serviceRatio),
          total: totalCalls
        };
      });

      const dailyResults = await Promise.all(dailyPromises);
      
      // Sortiere nach Wochentag
      const sortedResults = dailyResults.sort((a, b) => {
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return daysOfWeek.indexOf(a.weekday) - daysOfWeek.indexOf(b.weekday);
      });

      setDailySalesServiceData(sortedResults);
    } catch (error) {
      console.error("Fehler beim Abrufen der täglichen Daten:", error);
    } finally {
      setLoadingDailyData(false);
    }
  };

  // Lade tägliche Daten wenn Modal geöffnet wird
  useEffect(() => {
    if (isOpen && title === "Gesamtanrufe - Vertrieb vs Service") {
      fetchDailySalesServiceData();
    }
  }, [isOpen, title, overviewData, salesData, serviceData]);

  // Only render the modal if it's open
  if (!isOpen) {
    return null;
  }

  const chartTypes = [
    { id: 'bar', name: 'Balkendiagramm', icon: BarChart3 },
    { id: 'line', name: 'Liniendiagramm', icon: LineChartIcon },
    { id: 'area', name: 'Flächendiagramm', icon: BarChart3 },
    { id: 'pie', name: 'Kreisdiagramm', icon: PieChartIcon }
  ];

  const renderChart = () => {
    const chartData = data;
    const currentDataKeys = dataKeys;
    
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    };

    switch (activeChartType) {
      case 'bar':
        // Spezielle Behandlung für "Gesamtanrufe - Vertrieb vs Service" 
        if (title === "Gesamtanrufe - Vertrieb vs Service") {
          // Verwende tägliche Daten wenn verfügbar, sonst Gesamtzahlen als einzelne Balken
          if (dailySalesServiceData && dailySalesServiceData.length > 0) {
            if (loadingDailyData) {
              return (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B72F] mx-auto mb-4"></div>
                    <p className="text-[#001E4A]/70">Lade tägliche Daten...</p>
                  </div>
                </div>
              );
            }
            
            return (
              <BarChart data={dailySalesServiceData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                <XAxis 
                  dataKey="tag" 
                  tick={{ fill: "#001E4A", fontSize: 12 }}
                  angle={dailySalesServiceData.length > 5 ? -45 : 0}
                  textAnchor={dailySalesServiceData.length > 5 ? 'end' : 'middle'}
                  height={dailySalesServiceData.length > 5 ? 80 : 40}
                />
                <YAxis tick={{ fill: "#001E4A", fontSize: 12 }} />
                <Tooltip content={<ModernTooltip />} />
                <Legend content={<ModernLegend />} />
                <Bar
                  dataKey="Vertrieb"
                  name="Vertrieb"
                  fill="#F0B72F"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1000}
                />
                <Bar
                  dataKey="Service"
                  name="Service"
                  fill="#001E4A"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            );
          } else {
            // Fallback: Zeige Gesamtzahlen als einzelne Balken
            const salesCalls = salesData?.total_calls || 0;
            const serviceCalls = serviceData?.total_calls || 0;
            
            const barData = [
              { category: 'Vertrieb', value: salesCalls, fill: '#F0B72F' },
              { category: 'Service', value: serviceCalls, fill: '#001E4A' }
            ];
            
            return (
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: "#001E4A", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#001E4A", fontSize: 12 }} />
                <Tooltip content={<ModernTooltip />} />
                <Bar
                  dataKey="value"
                  name="Anrufe"
                  fill="#F0B72F"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1000}
                >
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            );
          }
        }
        
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
        // Spezielle Behandlung für "Gesamtanrufe - Vertrieb vs Service"
        if (title === "Gesamtanrufe - Vertrieb vs Service") {
          // Verwende tägliche Daten wenn verfügbar, sonst Gesamtzahlen
          const chartData = dailySalesServiceData && dailySalesServiceData.length > 0 
            ? dailySalesServiceData 
            : [{ tag: 'Gesamt', Vertrieb: salesData?.total_calls || 0, Service: serviceData?.total_calls || 0 }];
          
          if (loadingDailyData) {
            return (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B72F] mx-auto mb-4"></div>
                  <p className="text-[#001E4A]/70">Lade tägliche Daten...</p>
                </div>
              </div>
            );
          }
          
          return (
            <RechartsLineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <ChartGradients />
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
              <XAxis 
                dataKey="tag" 
                tick={{ fill: "#001E4A", fontSize: 12 }}
                angle={chartData.length > 5 ? -45 : 0}
                textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                height={chartData.length > 5 ? 80 : 40}
              />
              <YAxis tick={{ fill: "#001E4A", fontSize: 12 }} />
              <Tooltip content={<ModernTooltip />} />
              <Legend content={<ModernLegend />} />
              <Line
                type="monotone"
                dataKey="Vertrieb"
                name="Vertrieb"
                stroke="#F0B72F"
                strokeWidth={3}
                dot={{ r: 6, strokeWidth: 2, fill: "#F0B72F" }}
                activeDot={{ r: 8 }}
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="Service"
                name="Service"
                stroke="#001E4A"
                strokeWidth={3}
                dot={{ r: 6, strokeWidth: 2, fill: "#001E4A" }}
                activeDot={{ r: 8 }}
                animationDuration={1000}
              />
            </RechartsLineChart>
          );
        }
        
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
            <Tooltip content={<ModernTooltip />} />
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
        // Spezielle Behandlung für "Gesamtanrufe - Vertrieb vs Service"
        if (title === "Gesamtanrufe - Vertrieb vs Service") {
          // Verwende tägliche Daten wenn verfügbar, sonst Gesamtzahlen
          const chartData = dailySalesServiceData && dailySalesServiceData.length > 0 
            ? dailySalesServiceData 
            : [{ tag: 'Gesamt', Vertrieb: salesData?.total_calls || 0, Service: serviceData?.total_calls || 0 }];
          
          if (loadingDailyData) {
            return (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B72F] mx-auto mb-4"></div>
                  <p className="text-[#001E4A]/70">Lade tägliche Daten...</p>
                </div>
              </div>
            );
          }
          
          return (
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <ChartGradients />
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
              <XAxis 
                dataKey="tag" 
                tick={{ fill: "#001E4A", fontSize: 12 }}
                angle={chartData.length > 5 ? -45 : 0}
                textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                height={chartData.length > 5 ? 80 : 40}
              />
              <YAxis tick={{ fill: "#001E4A", fontSize: 12 }} />
              <Tooltip content={<ModernTooltip />} />
              <Legend content={<ModernLegend />} />
              <Area
                type="monotone"
                dataKey="Vertrieb"
                name="Vertrieb"
                stackId="1"
                stroke="#F0B72F"
                fill="#F0B72F"
                fillOpacity={0.6}
                animationDuration={1000}
              />
              <Area
                type="monotone"
                dataKey="Service"
                name="Service"
                stackId="1"
                stroke="#001E4A"
                fill="#001E4A"
                fillOpacity={0.6}
                animationDuration={1000}
              />
            </AreaChart>
          );
        }
        
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
            <Tooltip content={<ModernTooltip />} />
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
        // Spezielle Behandlung für "Gesamtanrufe - Vertrieb vs Service"
        if (title === "Gesamtanrufe - Vertrieb vs Service") {
          const pieData = [
            { name: 'Vertrieb', value: chartData[0]?.Vertrieb || 0, fill: '#F0B72F' },
            { name: 'Service', value: chartData[0]?.Service || 0, fill: '#001E4A' }
          ];

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
              <Tooltip content={<ModernTooltip />} />
              <Legend content={<ModernLegend />} />
            </PieChart>
          );
        }
        
        // Für Kreisdiagramme verwenden wir den ersten Datenpunkt als Wert
        if (currentDataKeys?.bars?.length >= 1) {
          const dataKey = currentDataKeys.bars[0].dataKey;
          const pieData = chartData.map((item, index) => ({
            name: item[currentDataKeys.x || 'name'],
            value: item[dataKey],
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
                dataKey="value"
                animationDuration={1000}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<ModernTooltip />} />
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E6E2DF]">
          <div className="flex flex-col">
            <h2 className="text-2xl font-nexa-black text-[#001E4A]">{title} - Diagrammansichten</h2>
            <p className="text-sm text-[#001E4A]/70 mt-1">
              Zeigt tägliche Daten vom {dateRange?.startDate ? new Date(dateRange.startDate).toLocaleDateString('de-DE') : ''} bis {dateRange?.endDate ? new Date(dateRange.endDate).toLocaleDateString('de-DE') : ''}
            </p>
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

const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  description,
  timeInSeconds,
  timeInMinutes,
  loading = false,
}) => (
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
              {typeof change === "number"
                ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
                : change}
            </span>
            <span className="ml-2">{description}</span>
          </p>
        )}
      </>
    )}
  </div>
);

// Component for chart cards
const ChartCard = ({ title, children, isWideChart = false, loading = false, data, filename, chartType = "bar", dataKeys, dateRange, selectedCompany, disableExpand = false, salesData, serviceData, overviewData }) => {
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
        className={`bg-white rounded-2xl border border-[#E6E2DF] hover:border-[#F0B72F] transition-all duration-500 hover:shadow-2xl hover:shadow-[#F0B72F]/20 p-4 sm:p-6 ${isHovered ? 'transform hover:scale-[1.02]' : ''} ${chartType === 'pie' ? 'h-[680px]' : ''}`}
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
                <h3 className="text-[20px] leading-[30px] font-nexa-black text-[#001E4A] tracking-tight">
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
            <div
              className={
                isWideChart ? "overflow-x-auto overflow-y-hidden modern-scrollbar" : ""
              }
            >
              <div className={isWideChart ? "min-w-[1000px] lg:min-w-full" : "w-full"}>
                <div className={`bg-gradient-to-br from-[#F0B72F]/8 via-[#F0B72F]/3 to-transparent rounded-2xl p-6 transition-all duration-500 border border-[#F0B72F]/10 shadow-inner ${chartType === 'pie' ? 'h-[580px]' : 'h-[380px]'} ${isHovered ? 'from-[#F0B72F]/12 shadow-lg' : ''}`}>
                  {children}
                </div>
              </div>
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
          salesData={salesData}
          serviceData={serviceData}
          overviewData={overviewData}
        />
      )}
    </>
  );
};

// First, add the CustomTooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const formatValue = (value, name) => {
    if (typeof value !== "number") return value;

    // Handle percentage values
    if (
      name?.toLowerCase().includes("%") ||
      name?.toLowerCase().includes("prozent") ||
      name?.toLowerCase().includes("serviceniveau") ||
      name?.toLowerCase().includes("acc") // Changed from 'asr' to 'acc'
    ) {
      return `${Number(value).toFixed(1)}%`;
    }

    // Handle time values
    if (
      name?.toLowerCase().includes("zeit") ||
      name?.toLowerCase().includes("time") ||
      name?.toLowerCase().includes("sec") ||
      name?.toLowerCase().includes("min")
    ) {
      return `${Number(value).toFixed(1)} Sek`;
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
      fill: "#001E4A",
      fontFamily: "Nexa-Book",
      fontSize: "12px",
    },
    axisLine: { stroke: "#E6E2DF" },
  },
  yAxis: {
    tick: {
      fill: "#001E4A",
      fontFamily: "Nexa-Book",
      fontSize: "12px",
    },
    axisLine: { stroke: "#E6E2DF" },
    grid: { stroke: "#E6E2DF", strokeDasharray: "3 3" },
  },
  legend: {
    wrapperStyle: {
      fontFamily: "Nexa-Book",
      fontSize: "14px",
      paddingTop: "10px",
    },
  },
};

const convertTimeToSeconds = (timeStr) => {
  if (typeof timeStr !== "string") return timeStr; // Ensure it's a string
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

const CallAnalysisDashboard = ({ dateRange, selectedCompany }) => {
  const [activeTab, setActiveTab] = useState("uebersicht");
  const [overviewData, setOverviewData] = useState(null);
  const [subKPIs, setSubKPIs] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [salesData, setSalesData] = useState(null);
  const [serviceData, setServiceData] = useState(null);
  const handleDropdownChange = (e) => setActiveTab(e.target.value);
  const tabs = [
    { id: "uebersicht", name: "Übersicht" },
    { id: "performance", name: "Leistungsmetriken" },
  ];

  // Add data caching
  const dataCache = useRef({});
  const abortController = useRef(null);
  const isMounted = useRef(true);
  const lastFetchTime = useRef({});

  // Cache expiration time - 5 minutes
  const CACHE_TTL = 5 * 60 * 1000;

  // Check if cache is still valid
  const isCacheValid = (cacheKey) => {
    const timestamp = lastFetchTime.current[cacheKey];
    return timestamp && Date.now() - timestamp < CACHE_TTL;
  };

  // Create unique cache key from all query parameters
  const getCacheKey = useCallback((company, dateParams, domainValue) => {
    const formatDate = (date) => {
      if (!date) return "none";
      const d = new Date(date);
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    };

    return `${company || "all"}_${formatDate(
      dateParams.startDate
    )}_${formatDate(dateParams.endDate)}_${
      dateParams.isAllTime ? "all" : "range"
    }_${domainValue || "all"}`;
  }, []);

  // Modified fetchData function with caching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const access_token = localStorage.getItem("access_token");

      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const queryString = new URLSearchParams({
        ...(dateRange.startDate && {
          start_date: formatDate(dateRange.startDate),
        }),
        ...(dateRange.endDate && { end_date: formatDate(dateRange.endDate) }),
        include_all: dateRange.isAllTime || false,
        ...(selectedCompany && { company: selectedCompany }),
        ...(domain && { domain: domain }),
      }).toString();

      const config = {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      };

      const responses = await Promise.all([
        fetch(
          `https://solasolution.ecomtask.de/call_overview?${queryString}`,
          config
        ),
        fetch(
          `https://solasolution.ecomtask.de/calls_sub_kpis?${queryString}`,
          config
        ),
        fetch(
          `https://solasolution.ecomtask.de/call_performance?${queryString}`,
          config
        ),
      ]);

      const [overviewRes, subKPIsRes, performanceRes] = await Promise.all(
        responses.map((res) => res.json())
      );

      setOverviewData(overviewRes);
      setSubKPIs(subKPIsRes);
      setPerformanceData(performanceRes);

      // Fetch Sales and Service data separately
      const salesQueryString = new URLSearchParams({
        ...(dateRange.startDate && {
          start_date: formatDate(dateRange.startDate),
        }),
        ...(dateRange.endDate && { end_date: formatDate(dateRange.endDate) }),
        include_all: dateRange.isAllTime || false,
        ...(selectedCompany && { company: selectedCompany }),
        domain: 'Sales',
      }).toString();

      const serviceQueryString = new URLSearchParams({
        ...(dateRange.startDate && {
          start_date: formatDate(dateRange.startDate),
        }),
        ...(dateRange.endDate && { end_date: formatDate(dateRange.endDate) }),
        include_all: dateRange.isAllTime || false,
        ...(selectedCompany && { company: selectedCompany }),
        domain: 'Service',
      }).toString();

      const [salesResponse, serviceResponse] = await Promise.all([
        fetch(
          `https://solasolution.ecomtask.de/call_overview?${salesQueryString}`,
          config
        ),
        fetch(
          `https://solasolution.ecomtask.de/call_overview?${serviceQueryString}`,
          config
        ),
      ]);

      const [salesDataRes, serviceDataRes] = await Promise.all([
        salesResponse.json(),
        serviceResponse.json(),
      ]);

      setSalesData(salesDataRes);
      setServiceData(serviceDataRes);
    } catch (error) {
      // Try using expired cache as fallback
      const cacheKey = getCacheKey(selectedCompany, dateRange, domain);
      if (dataCache.current[cacheKey]) {
        const cachedData = dataCache.current[cacheKey];
        setOverviewData(cachedData.overviewData);
        setSubKPIs(cachedData.subKPIs);
        setPerformanceData(cachedData.performanceData);
        setSalesData(cachedData.salesData);
        setServiceData(cachedData.serviceData);
      }
    } finally {
      // Use a small timeout to prevent flickering
      if (isMounted.current) {
        setTimeout(() => {
          setIsFilterLoading(false);
          setLoading(false);
        }, 300);
      }
    }
  }, [dateRange, selectedCompany, domain, getCacheKey]);

  // Setup and cleanup
  useEffect(() => {
    isMounted.current = true;

    // Cleanup function
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
      setIsFilterLoading(true);
      fetchData();
    }
  }, [dateRange, selectedCompany, domain, fetchData]);

  // Handle company selection for sales-only clients
  const salesOnlyClients = ['Galeria', 'ADAC', 'Urlaub','UrlaubsguruKF'];
  const isSalesOnlyClient =
    selectedCompany && salesOnlyClients.includes(selectedCompany);

  // Updated brand-aligned colors
  const chartColors = {
    primary: "#F0B72F", // SolaGelb
    secondary: "#001E4A", // SolaBlau
    tertiary: "#E6E2DF", // SolaGrau
    primaryLight: "#F0B72F80", // SolaGelb with opacity
    secondaryLight: "#001E4A80", // SolaBlau with opacity
    tertiaryLight: "#E6E2DF80", // SolaGrau with opacity
  };

  const UebersichtTab = () => {
    if (loading || !overviewData || !subKPIs) return <Loading />;

    const uebersichtStats = [
      {
        title: "Gesamtanrufe",
        value: overviewData?.total_calls?.toLocaleString() || "0",
        icon: Phone,
      },
      {
        title: "Serviceniveau",
        value: `${overviewData?.SLA || 0}%`,
        icon: CheckCircle,
      },
      {
        title: "ACC", // Changed from "ASR" to "ACC"
        value: `${overviewData?.asr || 0}%`, // Backend variable name remains as is
        icon: Activity,
      },
      {
        title: "Durchschnittliche Wartezeit",
        value: `${overviewData?.["avg wait time (min)"] || 0}`,
        // Calculate both seconds and minutes
        timeInSeconds: Math.round(
          convertTimeToSeconds(overviewData?.["avg wait time (min)"])
        ),
        timeInMinutes: (
          convertTimeToSeconds(overviewData?.["avg wait time (min)"]) / 60
        ).toFixed(2),
        icon: Clock,
      },
      {
        title: "Maximale Wartezeit",
        value: `${overviewData?.["max. wait time (min)"] || 0}`,
        // For max wait time, provide both formats
        timeInSeconds: Math.round(
          convertTimeToSeconds(overviewData?.["max. wait time (dec)"])
        ),
        timeInMinutes: (
          convertTimeToSeconds(overviewData?.["max. wait time (dec)"]) / 60
        ).toFixed(2),
        icon: Clock,
      },
      {
        title: "Durchschnittliche Bearbeitungszeit",
        value: `${overviewData?.["avg handling time (min)"] || 0}`,
        // Calculate both seconds and minutes
        timeInSeconds: Math.round(
          convertTimeToSeconds(overviewData?.["avg handling time (min)"])
        ),
        timeInMinutes: (
          convertTimeToSeconds(overviewData?.["avg handling time (min)"]) / 60
        ).toFixed(2),
        icon: Clock,
      },
      {
        title: "Verlorene Anrufe",
        value: overviewData?.["Dropped calls"] || 0,
        icon: Phone,
      },
    ];

    const dailyCallData = overviewData?.["Daily Call Volume"] || [];

    // Sort dailyCallData based on the weekday (assuming "call metrics.weekday" is a string like 'Monday', 'Tuesday', etc.)
    const sortedDailyCallData = dailyCallData.sort((a, b) => {
      const daysOfWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      return (
        daysOfWeek.indexOf(a["call metrics"].weekday) -
        daysOfWeek.indexOf(b["call metrics"].weekday)
      );
    });

    sortedDailyCallData.forEach((entry) => {
      entry["Time metrics"].avg_wait_time_sec = convertTimeToSeconds(
        entry["Time metrics"].avg_wait_time_sec
      );
      entry["Time metrics"].max_wait_time_sec = convertTimeToSeconds(
        entry["Time metrics"].max_wait_time_sec
      );
    });

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
            <StatCard key={index} {...stat} loading={loading} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard 
            title="Tägliche Gesamtanrufe" 
            loading={loading}
            data={sortedDailyCallData}
            dataKeys={{
              x: 'call metrics.weekday',
              bars: [
                { dataKey: 'call metrics.total_calls', name: 'Gesamtanrufe' },
                { dataKey: 'call metrics.answered_calls', name: 'Beantwortete Anrufe' },
                { dataKey: 'call metrics.dropped_calls', name: 'Verlorene Anrufe' }
              ]
            }}
            filename="Taegliche_Gesamtanrufe"
            chartType="bar"
            dateRange={dateRange}
            selectedCompany={selectedCompany}
            salesData={salesData}
            serviceData={serviceData}
            overviewData={overviewData}
          >
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart
                  data={sortedDailyCallData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis
                    dataKey="call metrics.weekday"
                    tick={{ fill: '#001E4A', fontSize: 13 }}
                    fontFamily="Nexa-Book"
                    stroke="#E6E2DF"
                    tickFormatter={translateWeekdayToGerman}
                  />
                  <YAxis 
                    tick={{ fill: '#001E4A', fontSize: 13 }}
                    fontFamily="Nexa-Book"
                    stroke="#E6E2DF"
                  />
                  <Tooltip content={<ModernTooltip />} />
                  <Legend content={<ModernLegend />} />
                  <Bar
                    dataKey="call metrics.total_calls"
                    name="Gesamtanrufe"
                    fill={chartColors.primary}
                    radius={[8, 8, 0, 0]}
                    animationDuration={1200}
                    animationBegin={200}
                  />
                  <Bar
                    dataKey="call metrics.answered_calls"
                    name="Beantwortete Anrufe"
                    fill={chartColors.secondary}
                    radius={[8, 8, 0, 0]}
                    animationDuration={1200}
                    animationBegin={400}
                  />
                  <Bar
                    dataKey="call metrics.dropped_calls"
                    name="Verlorene Anrufe"
                    fill={chartColors.tertiary}
                    radius={[8, 8, 0, 0]}
                    animationDuration={1200}
                    animationBegin={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard 
            title="Tägliche Wartezeiten (Minuten)" 
            loading={loading}
            data={sortedDailyCallData}
            dataKeys={{
              x: 'Time metrics.weekday',
              bars: [
                { dataKey: 'Time metrics.avg_wait_time_sec', name: 'Durchschn. Wartezeit (Min)' },
                { dataKey: 'Time metrics.max_wait_time_sec', name: 'Max. Wartezeit (Min)' }
              ]
            }}
            filename="Taegliche_Wartezeiten"
            chartType="line"
            dateRange={dateRange}
            selectedCompany={selectedCompany}
            salesData={salesData}
            serviceData={serviceData}
            overviewData={overviewData}
          >
            <div className="h-[300px]">
              <ResponsiveContainer>
                <LineChart
                  data={sortedDailyCallData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis
                    dataKey="Time metrics.weekday"
                    tick={{ fill: '#001E4A', fontSize: 13 }}
                    fontFamily="Nexa-Book"
                    stroke="#E6E2DF"
                    tickFormatter={translateWeekdayToGerman}
                  />
                  <YAxis 
                    tick={{ fill: '#001E4A', fontSize: 13 }}
                    fontFamily="Nexa-Book"
                    stroke="#E6E2DF"
                  />
                  <Tooltip content={<ModernTooltip />} />
                  <Legend content={<ModernLegend />} />
                  <Line
                    type="monotone"
                    dataKey="Time metrics.avg_wait_time_sec"
                    name="Durchschn. Wartezeit (Min)"
                    stroke={chartColors.primary}
                    strokeWidth={3}
                    dot={{ fill: chartColors.primary, r: 6, strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                    animationDuration={1200}
                    animationBegin={200}
                  />
                  <Line
                    type="monotone"
                    dataKey="Time metrics.max_wait_time_sec"
                    name="Max. Wartezeit (Min)"
                    stroke={chartColors.secondary}
                    strokeWidth={3}
                    dot={{ fill: chartColors.secondary, r: 6, strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                    animationDuration={1200}
                    animationBegin={400}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard 
          title="Tägliche ACC & Serviceniveau %" 
          loading={loading}
          data={sortedDailyCallData}
          dataKeys={{
            x: '% metrics.weekday',
            bars: [
              { dataKey: '% metrics.asr', name: 'ACC %' },
              { dataKey: '% metrics.sla_percent', name: 'Serviceniveau %' }
            ]
          }}
          filename="Taegliche_ACC_Serviceniveau"
          chartType="line"
          dateRange={dateRange}
          selectedCompany={selectedCompany}
          salesData={salesData}
          serviceData={serviceData}
          overviewData={overviewData}
        >
          <div className="h-[300px]">
            <ResponsiveContainer>
              <LineChart
                data={sortedDailyCallData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                <XAxis 
                  dataKey="% metrics.weekday" 
                  tick={{ fill: '#001E4A', fontSize: 13 }}
                  fontFamily="Nexa-Book"
                  stroke="#E6E2DF"
                  tickFormatter={translateWeekdayToGerman}
                />
                <YAxis 
                  tick={{ fill: '#001E4A', fontSize: 13 }}
                  fontFamily="Nexa-Book"
                  stroke="#E6E2DF"
                  domain={[0, 100]} 
                />
                <Tooltip content={<ModernTooltip />} />
                <Legend content={<ModernLegend />} />
                <Line
                  type="monotone"
                  dataKey="% metrics.asr"
                  name="ACC %"
                  stroke={chartColors.primary}
                  strokeWidth={3}
                  dot={{ fill: chartColors.primary, r: 6, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                  animationDuration={1200}
                  animationBegin={200}
                />
                <Line
                  type="monotone"
                  dataKey="% metrics.sla_percent"
                  name="Serviceniveau %"
                  stroke={chartColors.secondary}
                  strokeWidth={3}
                  dot={{ fill: chartColors.secondary, r: 6, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                  animationDuration={1200}
                  animationBegin={400}
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

    const anrufGruende = performanceData["Call Reasons Breakdown"] || {};
    const warteschlangenDaten = performanceData["Call By queue"] || {};
    const hasData = Object.keys(anrufGruende).length > 0;
    // Transform data for calls per queue
    const callsPerQueue = Object.entries(warteschlangenDaten)
      .filter(([key]) => key.includes("Calls"))
      .map(([key, value]) => ({
        queue: key.replace(" Calls", ""),
        calls: value || 0,
      }));

    // Transform data for minutes per queue
    const minutesPerQueue = Object.entries(warteschlangenDaten)
      .filter(([key]) => key.includes("Calls"))
      .map(([key, value]) => ({
        queue: key.replace(" Calls", ""),
        minutes: warteschlangenDaten[`${key.replace(" Calls", "")} AHT`] || 0,
      }));

    // Define better contrasting colors for pie chart sections
    const pieColors = [
      "#F0B72F", // SolaGelb
      "#001E4A", // SolaBlau  
      "#10B981", // Grün
      "#EF4444", // Rot
      "#3B82F6", // Blau
      "#8B5CF6", // Lila
      "#EC4899", // Pink
      "#F59E0B", // Orange
      "#84CC16", // Lime
      "#6B7280"  // Grau
    ];

    return (
      <div className="space-y-6">
        {/* Modernized Toggle Button with reduced margin */}
        {!isSalesOnlyClient && (
          <ModernToggleGroup
            value={domain}
            onChange={setDomain}
            className="mb-3"
          />
        )}

        {hasData && (
          <ChartCard 
            title="Verteilung der Anrufgründe" 
            loading={loading}
            data={Object.entries(anrufGruende).map(([key, value]) => ({
              name: key.replace(/_/g, " ").toUpperCase(),
              value: value || 0,
            }))}
            dataKeys={{
              x: 'name',
              bars: [
                { dataKey: 'value', name: 'Anzahl' }
              ]
            }}
            filename="Verteilung_Anrufgruende"
            chartType="pie"
            dateRange={dateRange}
            selectedCompany={selectedCompany}
            salesData={salesData}
            serviceData={serviceData}
            overviewData={overviewData}
          >
            <div className="h-[480px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                  <ChartGradients />
                  <Pie
                    data={Object.entries(anrufGruende).map(([key, value]) => ({
                      name: key.replace(/_/g, " ").toUpperCase(),
                      value: value || 0,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={130}
                    innerRadius={50}
                    label={false}
                    labelLine={false}
                    animationDuration={1000}
                  >
                    {Object.entries(anrufGruende).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                        stroke="#ffffff"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      
                      const data = payload[0];
                      const total = Object.values(anrufGruende).reduce((sum, val) => sum + (val || 0), 0);
                      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
                      
                      return (
                        <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-2xl p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-4 h-4 rounded-full shadow-lg"
                              style={{ backgroundColor: data.payload.fill }}
                            />
                            <span className="font-nexa-black text-[#001E4A] text-base">{data.name}</span>
                          </div>
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between gap-4">
                              <span>Anzahl:</span>
                              <span className="font-nexa-black">{data.value}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span>Anteil:</span>
                              <span className="font-nexa-black">{percentage}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend 
                    content={<ModernLegend />}
                    verticalAlign="bottom"
                    height={80}
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: "30px",
                      fontSize: "13px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Neues Chart: Gesamtanrufe - Vertrieb vs Service */}
          <ChartCard 
            title="Gesamtanrufe - Vertrieb vs Service" 
            loading={loading}
            data={(() => {
              // Erstelle Datenstruktur für Balken-, Linien- und Flächendiagramme
              const salesCalls = salesData?.total_calls || 0;
              const serviceCalls = serviceData?.total_calls || 0;
              
              return [
                { 
                  category: 'Anrufe', 
                  Vertrieb: salesCalls, 
                  Service: serviceCalls
                }
              ];
            })()}
            dataKeys={{
              x: 'category',
              bars: [
                { dataKey: 'Vertrieb', name: 'Vertrieb' },
                { dataKey: 'Service', name: 'Service' }
              ]
            }}
            filename="Gesamtanrufe_Vertrieb_vs_Service"
            chartType="pie"
            dateRange={dateRange}
            selectedCompany={selectedCompany}
            salesData={salesData}
            serviceData={serviceData}
            overviewData={overviewData}
            disableExpand={true}
          >
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                  <ChartGradients />
                  <Pie
                    data={(() => {
                      // Für Pie Chart: separate Einträge für Vertrieb und Service
                      const salesCalls = salesData?.total_calls || 0;
                      const serviceCalls = serviceData?.total_calls || 0;
                      
                      return [
                        { name: 'Vertrieb', value: salesCalls, fill: '#F0B72F' },
                        { name: 'Service', value: serviceCalls, fill: '#001E4A' }
                      ];
                    })()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={130}
                    innerRadius={50}
                    label={false}
                    labelLine={false}
                    animationDuration={1000}
                  >
                    {[
                      { name: 'Vertrieb', fill: '#F0B72F' },
                      { name: 'Service', fill: '#001E4A' }
                    ].map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        stroke="#ffffff"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      
                      const data = payload[0];
                      const totalCalls = (salesData?.total_calls || 0) + (serviceData?.total_calls || 0);
                      const percentage = totalCalls > 0 ? ((data.value / totalCalls) * 100).toFixed(1) : 0;
                      
                      return (
                        <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-2xl p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-4 h-4 rounded-full shadow-lg"
                              style={{ backgroundColor: data.payload.fill }}
                            />
                            <span className="font-nexa-black text-[#001E4A] text-base">{data.name}</span>
                          </div>
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between gap-4">
                              <span>Anrufe:</span>
                              <span className="font-nexa-black">{data.value.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span>Anteil:</span>
                              <span className="font-nexa-black">{percentage}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend 
                    content={<ModernLegend />}
                    verticalAlign="bottom"
                    height={80}
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: "30px",
                      fontSize: "13px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard 
            isWideChart={true} 
            title="Anrufe nach Warteschlange" 
            loading={loading}
            data={callsPerQueue}
            dataKeys={{
              x: 'queue',
              bars: [
                { dataKey: 'calls', name: 'Gesamtanrufe' }
              ]
            }}
            filename="Anrufe_nach_Warteschlange"
            chartType="bar"
            dateRange={dateRange}
            selectedCompany={selectedCompany}
            salesData={salesData}
            serviceData={serviceData}
            overviewData={overviewData}
          >
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={callsPerQueue}
                  margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                >
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis
                    dataKey="queue"
                    tick={{
                      fill: "#001E4A",
                      fontSize: "10px",
                      fontFamily: "Nexa-Book",
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="#E6E2DF"
                    interval={0}
                  />
                  <YAxis
                    tick={{
                      fill: "#001E4A",
                      fontSize: "12px",
                      fontFamily: "Nexa-Book",
                    }}
                    stroke="#E6E2DF"
                  />
                  <Tooltip content={<ModernTooltip />} />
                  <Legend content={<ModernLegend />} />
                  <Bar
                    dataKey="calls"
                    name="Gesamtanrufe"
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
            isWideChart={true} 
            title="Minuten nach Warteschlange" 
            loading={loading}
            data={minutesPerQueue}
            dataKeys={{
              x: 'queue',
              bars: [
                { dataKey: 'minutes', name: 'DGB (Min)' }
              ]
            }}
            filename="Minuten_nach_Warteschlange"
            chartType="bar"
            dateRange={dateRange}
            selectedCompany={selectedCompany}
            salesData={salesData}
            serviceData={serviceData}
            overviewData={overviewData}
          >
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={minutesPerQueue}
                  margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                >
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DF" opacity={0.4} />
                  <XAxis
                    dataKey="queue"
                    tick={{
                      fill: "#001E4A",
                      fontSize: "10px",
                      fontFamily: "Nexa-Book",
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="#E6E2DF"
                    interval={0}
                  />
                  <YAxis
                    tick={{
                      fill: "#001E4A",
                      fontSize: "12px",
                      fontFamily: "Nexa-Book",
                    }}
                    stroke="#E6E2DF"
                  />
                  <Tooltip content={<ModernTooltip />} />
                  <Legend content={<ModernLegend />} />
                  <Bar
                    dataKey="minutes"
                    name="DGB (Min)"
                    fill="#001E4A"
                    radius={[8, 8, 0, 0]}
                    animationDuration={1200}
                    animationBegin={200}
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
        <div className="border-b border-[#E6E2DF] mb-4">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={handleDropdownChange}
              className="w-full px-4 py-2 text-[17px] leading-[27px] font-nexa-book text-[#001E4A] border border-[#E6E2DF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F0B72F] focus:border-[#F0B72F]"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}
                </option>
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
          {activeTab === "uebersicht" &&
            (isFilterLoading ? <Loading /> : <UebersichtTab />)}
          {activeTab === "performance" &&
            (isFilterLoading ? <Loading /> : <PerformanceTab />)}
        </div>
      </div>
    </div>
  );
};

export default CallAnalysisDashboard;
