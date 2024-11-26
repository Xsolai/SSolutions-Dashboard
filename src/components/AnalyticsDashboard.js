"use client";
import React, { useState , useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ComposedChart } from 'recharts';
import { Mail, PhoneCall, Phone, TrendingUp, Archive, Clock, CheckCircle, AlertCircle, Send, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from "axios";

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
  const letters = "Analytics".split(""); // Convert the string into an array of letters

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

// Chart Card component
const ChartCard = ({ title, children }) => (
  <div className="bg-white p-3.5 sm:p-6 rounded-lg border border-gray-100 hover:border-yellow-400 transition-all">
    <h3 className="text-lg font-medium text-gray-900 mb-6">{title}</h3>
    {children}
  </div>
);

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('email');
  const [data, setData] = useState({
    emailData: null,
    callData: null,
    bookingData: null,
    conversionData: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const access_token = localStorage.getItem('access_token');
        
        const config = {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        };

        // Make all API calls in parallel
        const [
          emailResponse,
          callDataResponse,
          bookingResponse,
          conversionResponse
        ] = await Promise.all([
          axios.get('https://app.saincube.com/app2/email-data', config),
          axios.get('https://app.saincube.com/app2/call_data', config),
          axios.get('https://app.saincube.com/app2/booking_data', config),
          axios.get('https://app.saincube.com/app2/conversion_CB', config)
        ]);

        // Update all data at once
        setData({
          emailData: emailResponse.data,
          callData: callDataResponse.data,
          bookingData: bookingResponse.data,
          conversionData: conversionResponse.data
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);
 
  // Updated Email Analytics Tab with real data
  const EmailTab = () => {
    if (!data.emailData) return <div><Loading/></div>;

    const processingTimeInMinutes = Math.round(data.emailData['Total Processing Time (sec)'] / 60);
    
    // Transform processing time trend data
    const processedTimeData = data.emailData['Processing Time Trend'].map(item => ({
      time: item.interval_start,
      seconds: item.total_processing_time_sec
    }));


    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            title="Emails Received"
            value={data.emailData['email recieved']}
            icon={Mail}
          />
          <StatCard
            title="Emails Answered"
            value={data.emailData['email answered']}
            icon={Mail}
          />
          <StatCard
            title="Emails Forwarded"
            value={data.emailData['email forwarded']}
            icon={Send}
          />
          <StatCard
            title="New Sent"
            value={data.emailData['New Sent']}
            icon={Send}
          />
          <StatCard
            title="Archived"
            value={data.emailData['email archived']}
            icon={Archive}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <StatCard
            title="SL Gross"
            value={`€${data.emailData['SL Gross'].toLocaleString()}`}
            icon={TrendingUp}
          />
          <StatCard
            title="Processing Time"
            value={`${processingTimeInMinutes}m`}
            icon={Clock}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Email Processing Overview">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Received', value: data.emailData['email recieved'] },
                  { name: 'Answered', value: data.emailData['email answered'] },
                  { name: 'Forwarded', value: data.emailData['email forwarded'] },
                  { name: 'Archived', value: data.emailData['email archived'] }
                ]}>
                  <XAxis dataKey="name" stroke={colors.gray} />
                  <YAxis stroke={colors.gray} />
                  <Tooltip />
                  <Bar dataKey="value" fill={colors.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Processing Time Trend">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedTimeData}>
                  <XAxis dataKey="time" stroke={colors.gray} />
                  <YAxis 
                    stroke={colors.gray}
                    label={{ 
                      value: 'Processing Time (seconds)', 
                      angle: -90, 
                      position: 'insideLeft' 
                    }}
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="seconds" 
                    stroke={colors.primary} 
                    strokeWidth={2}
                    dot={{ fill: colors.primary }}
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
    if (!data.callData) return <div><Loading/></div>;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <StatCard
            title="Sales Calls Offered"
            value={data.callData.sales_metrics.calls_offered}
            icon={PhoneCall}
          />
          <StatCard
            title="Sales Calls Handled"
            value={data.callData.sales_metrics.calls_handled}
            icon={Phone}
          />
          <StatCard
            title="Sales ACC"
            value={`${data.callData.sales_metrics.ACC}%`}
            icon={CheckCircle}
          />
          <StatCard
            title="Sales Service Level"
            value={`${data.callData.sales_metrics.SL}%`}
            icon={TrendingUp}
          />
        </div>
  
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <StatCard
            title="Service Calls Offered"
            value={data.callData.service_metrics.calls_offered}
            icon={PhoneCall}
          />
          <StatCard
            title="Service Calls Handled"
            value={data.callData.service_metrics.calls_handled}
            icon={Phone}
          />
          <StatCard
            title="Service ACC"
            value={`${data.callData.service_metrics.ACC}%`}
            icon={CheckCircle}
          />
          <StatCard
            title="Service Level"
            value={`${data.callData.service_metrics.SL}%`}
            icon={TrendingUp}
          />
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Call Handling Times">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  {
                    name: 'Sales',
                    AHT: data.callData.sales_metrics.AHT_sec,
                    waitTime: data.callData.sales_metrics.longest_waiting_time_sec,
                    talkTime: data.callData.sales_metrics.total_talk_time_sec
                  },
                  {
                    name: 'Service',
                    AHT: data.callData.service_metrics.AHT_sec,
                    waitTime: data.callData.service_metrics.longest_waiting_time_sec,
                    talkTime: data.callData.service_metrics.total_talk_time_sec
                  }
                ]}>
                  <XAxis dataKey="name" stroke={colors.gray} />
                  <YAxis stroke={colors.gray} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="AHT" name="AHT (sec)" fill={colors.primary} />
                  <Bar dataKey="waitTime" name="Wait Time (sec)" fill={colors.success} />
                  <Bar dataKey="talkTime" name="Talk Time (sec)" fill={colors.accent} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
  
          <ChartCard title="Performance Metrics">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  {
                    name: 'Sales',
                    ACC: data.callData.sales_metrics.ACC,
                    SL: data.callData.sales_metrics.SL,
                  },
                  {
                    name: 'Service',
                    ACC: data.callData.service_metrics.ACC,
                    SL: data.callData.service_metrics.SL,
                  }
                ]}>
                  <XAxis dataKey="name" stroke={colors.gray} />
                  <YAxis stroke={colors.gray} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ACC" name="ACC %" fill={colors.primary} />
                  <Bar dataKey="SL" name="Service Level %" fill={colors.success} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
  
        <ChartCard title="Overall Metrics">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <StatCard
              title="Average Handling Time"
              value={`${(data.callData['average handling time']).toFixed(1)}s`}
              icon={Clock}
            />
            <StatCard
              title="Total Talk Time"
              value={`${(data.callData['Total Talk Time']).toFixed(1)}s`}
              icon={Clock}
            />
            <StatCard
              title="Total Outbound Calls"
              value={data.callData['Total outbound calls']}
              icon={Phone}
            />
          </div>
        </ChartCard>
      </div>
    );
  };

// Booking Analytics Tab
const BookingTab = () => {
  if (!data.bookingData) return <div><Loading/></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Bookings"
          value={data.bookingData['Booked']}
          icon={Users}
        />
        <StatCard
          title="SB Booking Rate"
          value={`${data.bookingData['SB Booking Rate (%)']}%`}
          icon={Activity}
        />
        <StatCard
          title="Pending Bookings"
          value={data.bookingData['Pending']}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Booking Status">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { category: 'Booked', value: data.bookingData['Booked'] },
                { category: 'Not Booked', value: data.bookingData['Not Booked'] },
                { category: 'Pending', value: data.bookingData['Pending'] },
                { category: 'OP', value: data.bookingData['OP'] },
                { category: 'RQ', value: data.bookingData['RQ'] }
              ]}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill={colors.primary} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="OP/RQ Distribution">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'OP', value: data.bookingData['OP'] },
                { name: 'RQ', value: data.bookingData['RQ'] }
              ]}>
                <XAxis dataKey="name" stroke={colors.gray} />
                <YAxis stroke={colors.gray} />
                <Tooltip />
                <Bar dataKey="value" fill={colors.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

// Conversion Analytics Tab
const ConversionTab = () => {
  if (!data.conversionData) return <div><Loading/></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="CB Conversion Rate"
          value={`${data.conversionData.CB['CB Conversion']}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Sales Conversion Rate"
          value={`${data.conversionData.Sales['Sales Conversion']}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="CB Turnover"
          value={`€${data.conversionData.CB['Turnover'].toLocaleString()}`}
          icon={Activity}
        />
      </div>

      <ChartCard title="Conversion Performance">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={[
              { 
                name: 'CB',
                bookings: data.conversionData.CB['Bookings CB'],
                wrongCalls: data.conversionData.CB['Wrong calls'],
                conversion: data.conversionData.CB['CB Conversion']
              },
              { 
                name: 'Sales',
                bookings: data.conversionData.Sales['Bookings Sales'],
                wrongCalls: data.conversionData.Sales['Wrong calls'],
                conversion: data.conversionData.Sales['Sales Conversion']
              }
            ]}>
              <XAxis dataKey="name" stroke={colors.gray} />
              <YAxis yAxisId="left" stroke={colors.gray} />
              <YAxis yAxisId="right" orientation="right" stroke={colors.gray} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="bookings" fill={colors.success} name="Bookings" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="wrongCalls" fill={colors.danger} name="Wrong Calls" radius={[4, 4, 0, 0]} />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="conversion" 
                name="Conversion Rate"
                stroke={colors.accent}
                strokeWidth={2}
                dot={{ fill: colors.accent }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="CB Performance">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{
                name: 'CB Metrics',
                handled: data.conversionData.CB['CB calls handled'],
                wrong: data.conversionData.CB['Wrong calls'],
                bookings: data.conversionData.CB['Bookings CB']
              }]}>
                <XAxis dataKey="name" stroke={colors.gray} />
                <YAxis stroke={colors.gray} />
                <Tooltip />
                <Legend />
                <Bar dataKey="handled" name="Handled Calls" fill={colors.primary} />
                <Bar dataKey="wrong" name="Wrong Calls" fill={colors.danger} />
                <Bar dataKey="bookings" name="Bookings" fill={colors.success} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Sales Performance">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{
                name: 'Sales Metrics',
                handled: data.conversionData.Sales['Sales handles'],
                wrong: data.conversionData.Sales['Wrong calls'],
                bookings: data.conversionData.Sales['Bookings Sales'],
                volume: data.conversionData.Sales['Sales volume']
              }]}>
                <XAxis dataKey="name" stroke={colors.gray} />
                <YAxis stroke={colors.gray} />
                <Tooltip />
                <Legend />
                <Bar dataKey="handled" name="Handled" fill={colors.primary} />
                <Bar dataKey="wrong" name="Wrong Calls" fill={colors.danger} />
                <Bar dataKey="bookings" name="Bookings" fill={colors.success} />
                <Bar dataKey="volume" name="Volume" fill={colors.accent} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};


  const tabs = [
    { id: "email", name: "Email Analytics" },
    { id: "sales", name: "Sales & Service" },
    { id: "booking", name: "Booking Analytics" },
    { id: "conversion", name: "Conversion" },
  ];

  const handleDropdownChange = (e) => setActiveTab(e.target.value);

  return (
    <div className="bg-gray-50 rounded-[50px]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-10 px-2 pt-4 sm:mb-6 flex justify-between items-center">
          <AnimatedText />
        </div>

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
