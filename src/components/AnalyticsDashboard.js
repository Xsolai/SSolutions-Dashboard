"use client";
import React, { useState , useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ComposedChart } from 'recharts';
import { Mail, PhoneCall, Phone, TrendingUp,TrendingDown, Archive, Clock, CheckCircle, Send, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import FilterComponent from './FilterComponent';

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

// Color theme
const colors = {
  primary: '#fdcc00',    // yellow
  dark: '#1a1a1a',      // black
  gray: '#4a4a4a',      // medium gray
  lightGray: '#e5e5e5', // light gray
  white: '#ffffff',     // white
  success: '#2225C5FF', // blue
  danger: '#fdcc00',    // yellow
  accent: '#4299e1'     // bright blue
};


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

const AnimatedText = () => {
  const letters = "Analyse".split(""); // Changed to German

  return (
    <div className="inline-block">
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1, // Total duration for the animation
          staggerChildren: 0.1, // Delay between revealing each letter
        }}
        className="text-4xl sm:px-2 md:text-4xl lg:text-5xl font-bold text-[#fdcc00] flex"
      >
        {letters.map((letter, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1,
            }}
            className="block"
          >
            {letter}
          </motion.span>
        ))}
      </motion.span>
    </div>
  );
};

// Updated ChartCard with responsive scrolling
// Add this component to your existing code
const ChartCard = ({ title, children, isWideChart = false }) => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-gray-100 hover:border-yellow-400 transition-all">
    <h3 className="text-lg font-medium text-gray-900 mb-6">{title}</h3>
    <div className={isWideChart ? "overflow-x-auto overflow-y-hidden scrollbar-hide" : ""}>
      <div className={isWideChart ? "min-w-[600px] lg:min-w-full" : "w-full"}>
        <div className="h-[300px]">
          {children}
        </div>
      </div>
    </div>
  </div>
);

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('email');
  const [filterType, setFilterType] = useState('yesterday');
  const [data, setData] = useState({
    emailData: null,
    emailSubKPIs: null,
    salesServiceData: null,
    bookingData: null,
    bookingSubKPIs: null,
    conversionData: null
  });
  const [loading, setLoading] = useState(true);

  const access_token = localStorage.getItem('access_token');

  const config = {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          emailData,
          emailSubKPIs,
          salesServiceData,
          bookingData,
          bookingSubKPIs,
          conversionData
        ] = await Promise.all([
          fetch(`https://app.saincube.com/app2/anaytics_email?filter_type=${filterType}`, config),
          fetch(`https://app.saincube.com/app2/anaytics_email_subkpis?filter_type=${filterType}`, config),
          fetch(`https://app.saincube.com/app2/analytics_sales_service?filter_type=${filterType}`, config),
          fetch(`https://app.saincube.com/app2/analytics_booking?filter_type=${filterType}`, config),
          fetch('https://app.saincube.com/app2/analytics_booking_subkpis', config),
          fetch(`https://app.saincube.com/app2/analytics_conversion?filter_type=${filterType}`, config)
        ]);
    
        const [
          emailDataJson,
          emailSubKPIsJson,
          salesServiceDataJson,
          bookingDataJson,
          bookingSubKPIsJson,
          conversionDataJson
        ] = await Promise.all([
          emailData.json(),
          emailSubKPIs.json(),
          salesServiceData.json(),
          bookingData.json(),
          bookingSubKPIs.json(),
          conversionData.json()
        ]);
  
        setData({
          emailData: emailDataJson,
          emailSubKPIs: emailSubKPIsJson,
          salesServiceData: salesServiceDataJson,
          bookingData: bookingDataJson,
          bookingSubKPIs: bookingSubKPIsJson,
          conversionData: conversionDataJson
        });
        setLoading(false);
      } catch (error) {
        console.error('Fehler beim Datenabruf:', error);
        setLoading(false);
      }
    };
  
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filterType]);

  const EmailTab = () => {
    if (!data.emailData || !data.emailSubKPIs) return <Loading />;
    
    const processedTimeData = data.emailData['Processing Time Trend in seconds'] || [];
    
    const emailMetrics = [
      {
        title: "Empfangene E-Mails",
        value: data.emailData['email recieved'] || 0,
        icon: Mail,
        change: data.emailSubKPIs['email recieved change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Gesendete E-Mails",
        value: data.emailData['email sent'] || 0,
        icon: Mail,
        change: data.emailSubKPIs['email sent change'],
        description: "im Vergleich zur letzten Periode"
      },
      {
        title: "Neue Fälle",
        value: data.emailData['email new cases'] || 0,
        icon: Send,
        change: data.emailSubKPIs['email new cases change'],
        description: "im Vergleich zur letzten Periode"
      }
    ];
    
    const slGross = data.emailData['SL Gross'] || 0;
    const processingTime = data.emailData['Total Processing Time (sec)'] || 0;
  
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {emailMetrics.map((metric, index) => (
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
    
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="SL Brutto"
            value={`${slGross.toFixed(2)}%`}
            icon={TrendingUp}
          />
          <StatCard
            title="Bearbeitungszeit"
            value={`${Math.round(processingTime / 60)}m`}
            icon={Clock}
          />
        </div>
    
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="E-Mail-Bearbeitungsübersicht">
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart data={[
                  { name: 'Empfangen', value: data.emailData['email recieved'] || 0 },
                  { name: 'Beantwortet', value: data.emailData['email answered'] || 0 },
                  { name: 'Archiviert', value: data.emailData['email archived'] || 0 }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={colors.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
    
          <ChartCard title="Bearbeitungszeit-Trend">
            <div className="h-60">
              <ResponsiveContainer>
                <LineChart data={processedTimeData}>
                  <XAxis dataKey="interval_start" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total_processing_time_sec" 
                    stroke={colors.primary}
                    name="Bearbeitungszeit (Sek.)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    );
  };
    
  const SalesServiceTab = () => {
    if (!data.salesServiceData) return <Loading />;
  
    const salesMetrics = data.salesServiceData?.sales_metrics || {};
    const serviceMetrics = data.salesServiceData?.service_metrics || {};
  
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Vertriebsanrufe Angeboten"
            value={salesMetrics.calls_offered || 0}
            icon={PhoneCall}
          />
          <StatCard
            title="Vertriebsanrufe Bearbeitet"
            value={salesMetrics.calls_handled || 0}
            icon={Phone}
          />
          <StatCard
            title="Vertrieb ACC"
            value={`${salesMetrics.ACC || 0}%`}
            icon={CheckCircle}
          />
          <StatCard
            title="Vertrieb Serviceniveau"
            value={`${salesMetrics.SL || 0}%`}
            icon={TrendingUp}
          />
        </div>
  
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ChartCard title="Bearbeitete Anrufe">
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={[
                  {
                    name: 'Vertrieb',
                    calls: salesMetrics.calls_handled || 0
                  },
                  {
                    name: 'Service',
                    calls: serviceMetrics.calls_handled || 0
                  }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls" name="Bearbeitete Anrufe" fill={colors.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
  
          <ChartCard title="Prozentuale Metriken">
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={[
                  {
                    name: 'Vertrieb',
                    acc: salesMetrics.ACC || 0,
                    sl: salesMetrics.SL || 0
                  },
                  {
                    name: 'Service',
                    acc: serviceMetrics.ACC || 0,
                    sl: serviceMetrics.SL || 0
                  }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="acc" name="ACC %" fill={colors.success} />
                  <Bar dataKey="sl" name="Serviceniveau %" fill={colors.accent} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
  
          <ChartCard title="Bearbeitungszeiten">
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={[
                  {
                    name: 'Vertrieb',
                    aht: salesMetrics.AHT_sec || 0,
                    wait: salesMetrics.longest_waiting_time_sec || 0
                  },
                  {
                    name: 'Service',
                    aht: serviceMetrics.AHT_sec || 0,
                    wait: serviceMetrics.longest_waiting_time_sec || 0
                  }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="aht" name="DGB (Sek.)" fill={colors.primary} />
                  <Bar dataKey="wait" name="Wartezeit (Sek.)" fill={colors.success} />
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
        title: "OP Anzahl",
        value: bookingData['OP'] || 0,
        icon: TrendingUp,
        change: bookingSubKPIs['OP change']
      },
      {
        title: "RQ Anzahl",
        value: bookingData['RQ'] || 0,
        icon: TrendingDown,
        change: bookingSubKPIs['RQ change']
      }
    ];
  
    const bookingStatusData = Object.entries(bookingStatus || {}).map(([key, value]) => ({
      category: key,
      value: value || 0
    }));
  
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
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
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Buchungsstatus">
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart data={bookingStatusData}>
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={colors.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
  
          <ChartCard title="OP/RQ Verteilung">
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart data={[
                  { name: 'OP', value: bookingData['OP'] || 0 },
                  { name: 'RQ', value: bookingData['RQ'] || 0 }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={colors.primary} />
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
    const cbMetrics = conversionData?.CB || {};
    const salesMetrics = conversionData?.Sales || {};
  
    const cbChartData = [{
      bookings: cbData?.['Bookings CB'] || 0,
      wrong: cbData?.['Wrong calls'] || 0,
      handled: cbData?.['CB calls handled'] || 0,
      conversion: cbMetrics?.['CB Conversion'] || 0
    }];
  
    const salesChartData = [{
      bookings: salesData?.['Bookings Sales'] || 0,
      wrong: salesData?.['Wrong calls'] || 0,
      handled: salesData?.['Sales handles'] || 0,
      conversion: salesMetrics?.['Sales Conversion'] || 0,
      volume: salesData?.['Sales volume'] || 0
    }];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            title="CB Konversion"
            value={`${cbMetrics?.['CB Conversion']?.toFixed(2) || '0'}%`}
            icon={TrendingUp}
          />
          <StatCard
            title="Vertrieb Konversion"
            value={`${salesMetrics?.['Sales Conversion']?.toFixed(2) || '0'}%`}
            icon={TrendingUp}
          />
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="CB Leistung">
            <div className="h-60">
              <ResponsiveContainer>
                <ComposedChart data={cbChartData}>
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bookings" name="Buchungen" fill={colors.success} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="wrong" name="Falsche Anrufe" fill={colors.danger} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="handled" name="Bearbeitete Anrufe" fill={colors.primary} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="conversion" name="Konversionsrate %" stroke={colors.accent} strokeWidth={2} dot={{ fill: colors.accent }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
  
          <ChartCard title="Vertrieb Leistung">
            <div className="h-60">
              <ResponsiveContainer>
                <ComposedChart data={salesChartData}>
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bookings" name="Buchungen" fill={colors.success} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="wrong" name="Falsche Anrufe" fill={colors.danger} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="handled" name="Bearbeitete Anrufe" fill={colors.primary} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="volume" name="Vertriebsvolumen" fill={colors.gray} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="conversion" name="Konversionsrate %" stroke={colors.accent} strokeWidth={2} dot={{ fill: colors.accent }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "email", name: "E-Mail-Analyse" },
    { id: "sales", name: "Vertrieb & Service" },
    { id: "booking", name: "Buchungsanalyse" },
    { id: "conversion", name: "Konversion" },
  ];

  const handleDropdownChange = (e) => setActiveTab(e.target.value);

  return (
    <div className="bg-gray-50 rounded-[50px]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-10 px-2 pt-4 sm:mb-6 flex justify-between items-center">
          <AnimatedText />
        </div>
        <FilterComponent filterType={filterType} setFilterType={setFilterType} />
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          {/* Dropdown für Mobile */}
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

          {/* Tabs für Desktop */}
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

        {/* Tab-Inhalt */}
        <div className="py-4">
          {activeTab === "email" && <EmailTab />}
          {activeTab === "sales" && <SalesServiceTab />}
          {activeTab === "booking" && <BookingTab />}
          {activeTab === "conversion" && <ConversionTab />}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
