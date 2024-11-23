"use client";
import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ComposedChart } from 'recharts';
import { Mail, PhoneCall, BookOpen, TrendingUp, Archive, Clock, CheckCircle, AlertCircle, Send, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

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
  // Tab state
  const [activeTab, setActiveTab] = useState('email');

  // Data structures
  const emailMetrics = {
    received: 468,
    answered: 357,
    forwarded: 2,
    archived: 634,
    newSent: 258,
    slGross: 8982.84,
    processingTime: 28713,
    bookingData: {
      booked: 137,
      notBooked: 204,
      pending: 0,
      op: 24,
      rq: 6,
      bookingRate: 66.03
    }
  };

  const slGrossData = [
    { time: '00:00', value: 8200 },
    { time: '04:00', value: 8400 },
    { time: '08:00', value: 8600 },
    { time: '12:00', value: 8800 },
    { time: '16:00', value: 8900 },
    { time: '20:00', value: 8982.84 }
  ];

  const processingTimeData = [
    { time: '00:00', seconds: 25000 },
    { time: '04:00', seconds: 26000 },
    { time: '08:00', seconds: 27000 },
    { time: '12:00', seconds: 27500 },
    { time: '16:00', seconds: 28000 },
    { time: '20:00', seconds: 28713 }
  ];

  const salesServiceData = {
    sales: {
      handled: 43,
      acc: 100,
      sl: 88,
      aht: 0,
      waitingTime: 4560
    },
    service: {
      handled: 43,
      acc: 100,
      sl: 63.14,
      aht: 0,
      waitingTime: 17820
    }
  };

  const conversionData = {
    cb: {
      handled: 15,
      wrongCalls: 101,
      bookings: 12,
      turnover: 1539460.97,
      conversion: 13.33
    },
    sales: {
      handled: 68,
      wrongCalls: 101,
      bookings: 12,
      volume: 68,
      conversion: 59.58
    }
  };

  // Email Analytics Tab
  const EmailTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          title="Emails Received"
          value={emailMetrics.received}
          icon={Mail}
          change="+12%"
          description="vs. yesterday"
        />
        <StatCard
          title="Emails Answered"
          value={emailMetrics.answered}
          icon={Mail}
          change="+8%"
          description="vs. yesterday"
        />
        <StatCard
          title="Emails Forwarded"
          value={emailMetrics.forwarded}
          icon={Send}
          change="-5%"
          description="vs. yesterday"
        />
        <StatCard
          title="New Sent"
          value={emailMetrics.newSent}
          icon={Send}
          change="+15%"
          description="vs. yesterday"
        />
        <StatCard
          title="Archived"
          value={emailMetrics.archived}
          icon={Archive}
          change="+10%"
          description="vs. yesterday"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <StatCard
          title="SL Gross"
          value={`€${emailMetrics.slGross.toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Processing Time"
          value={`${Math.round(emailMetrics.processingTime / 60)}m`}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Email Processing Overview" >
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Received', value: emailMetrics.received },
                { name: 'Answered', value: emailMetrics.answered },
                { name: 'Forwarded', value: emailMetrics.forwarded },
                { name: 'Archived', value: emailMetrics.archived }
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
              <LineChart data={processingTimeData}>
                <XAxis dataKey="time" stroke={colors.gray} />
                <YAxis stroke={colors.gray} />
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

  // Sales & Service Analytics Tab
  const SalesServiceTab = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          title="Sales Service Level"
          value={`${salesServiceData.sales.sl}%`}
          icon={TrendingUp}
          change="+5%"
          description="vs. target"
        />
        <StatCard
          title="Service Level"
          value={`${salesServiceData.service.sl}%`}
          icon={TrendingUp}
          change="-2%"
          description="vs. target"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Service Level Comparison">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { name: 'Sales', sl: salesServiceData.sales.sl },
                { name: 'Service', sl: salesServiceData.service.sl }
              ]}>
                <XAxis dataKey="name" stroke={colors.gray} />
                <YAxis stroke={colors.gray} />
                <Tooltip />
                <Line type="monotone" dataKey="sl" stroke={colors.primary} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="ACC Distribution">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Sales ACC', value: salesServiceData.sales.acc },
                    { name: 'Service ACC', value: salesServiceData.service.acc }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                >
                  {[colors.primary, colors.dark].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Service Level Trend">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={slGrossData}>
              <XAxis dataKey="time" stroke={colors.gray} />
              <YAxis stroke={colors.gray} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors.primary} 
                strokeWidth={2}
                dot={{ fill: colors.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );

  // Booking Analytics Tab
  const BookingTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Bookings"
          value={emailMetrics.bookingData.booked}
          icon={Users}
          change="+15%"
          description="vs. last period"
        />
        <StatCard
          title="Booking Rate"
          value={`${emailMetrics.bookingData.bookingRate}%`}
          icon={Activity}
          change="+5%"
          description="vs. target"
        />
        <StatCard
          title="Pending Bookings"
          value={emailMetrics.bookingData.pending}
          icon={Clock}
          change="0%"
          description="no change"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Booking Status">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { category: 'Booked', value: emailMetrics.bookingData.booked },
                  { category: 'Not Booked', value: emailMetrics.bookingData.notBooked },
                  { category: 'Pending', value: emailMetrics.bookingData.pending },
                  { category: 'OP', value: emailMetrics.bookingData.op },
                  { category: 'RQ', value: emailMetrics.bookingData.rq }
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
                { name: 'OP', value: emailMetrics.bookingData.op },
                { name: 'RQ', value: emailMetrics.bookingData.rq }
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

  // Conversion Analytics Tab
  const ConversionTab = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="CB Conversion Rate"
          value={`${conversionData.cb.conversion}%`}
          icon={TrendingUp}
          change="+2.5%"
          description="vs. last period"
        />
        <StatCard
          title="Sales Conversion Rate"
          value={`${conversionData.sales.conversion}%`}
          icon={TrendingUp}
          change="+8.3%"
          description="vs. last period"
        />
      </div>

      <ChartCard title="Conversion Performance">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={[
              { 
                name: 'CB',
                bookings: conversionData.cb.bookings,
                wrongCalls: conversionData.cb.wrongCalls,
                conversion: conversionData.cb.conversion
              },
              { 
                name: 'Sales',
                bookings: conversionData.sales.bookings,
                wrongCalls: conversionData.sales.wrongCalls,
                conversion: conversionData.sales.conversion
              }
            ]}>
              <XAxis dataKey="name" stroke={colors.gray} />
              <YAxis yAxisId="left" stroke={colors.gray} />
              <YAxis yAxisId="right" orientation="right" stroke={colors.gray} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="bookings" fill={colors.success} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="wrongCalls" fill={colors.danger} radius={[4, 4, 0, 0]} />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="conversion" 
                stroke={colors.accent}
                strokeWidth={2}
                dot={{ fill: colors.accent }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );

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
