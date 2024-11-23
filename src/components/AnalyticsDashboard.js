import React from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ComposedChart } from 'recharts';
import { Mail, PhoneCall, BookOpen, TrendingUp, Archive, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';

// Colors remain the same
const colors = {
  primary: '#001e4a',
  secondary: '#fdcc00',
  success: '#10B981',
  warning: '#fdcc00',
  danger: '#EF4444'
};

const CHART_COLORS = ['#001e4a', '#fdcc00', '#10B981', '#60A5FA', '#EF4444'];

// Component definitions remain the same
const StatCard = ({ title, value, icon: Icon, change, description }) => (
  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:border-yellow-400 transition-all">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <Icon className="h-5 w-5 text-blue-900" />
    </div>
    <div className="text-3xl font-bold text-blue-900 mb-3">{value}</div>
    {change && description && (
      <p className="text-xs text-gray-600">
        <span className={`inline-block mr-2 ${change.includes('-') ? 'text-emerald-600' : 'text-red-600'}`}>
          {change}
        </span>
        {description}
      </p>
    )}
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:border-yellow-400 transition-all">
    <h3 className="text-lg font-medium text-blue-900 mb-6">{title}</h3>
    {children}
  </div>
);

const AnalyticsDashboard = () => {
  // NEW: Added email metrics data structure
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

  // NEW: Added time series data for SL Gross
  const slGrossData = [
    { time: '00:00', value: 8200 },
    { time: '04:00', value: 8400 },
    { time: '08:00', value: 8600 },
    { time: '12:00', value: 8800 },
    { time: '16:00', value: 8900 },
    { time: '20:00', value: 8982.84 }
  ];

  // NEW: Added processing time data
  const processingTimeData = [
    { time: '00:00', seconds: 25000 },
    { time: '04:00', seconds: 26000 },
    { time: '08:00', seconds: 27000 },
    { time: '12:00', seconds: 27500 },
    { time: '16:00', seconds: 28000 },
    { time: '20:00', seconds: 28713 }
  ];

  // Keep existing data structures for other sections
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

  return (
    <div className="space-y-12">
      {/* NEW: Email Analytics Section with expanded metrics */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-blue-900">Email Analytics</h2>
        {/* NEW: Expanded Email KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
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
            title="New Emails Sent"
            value={emailMetrics.newSent}
            icon={Send}
            change="+15%"
            description="vs. yesterday"
          />
          <StatCard
            title="Emails Archived"
            value={emailMetrics.archived}
            icon={Archive}
            change="+10%"
            description="vs. yesterday"
          />
        </div>

        <section>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          
          <StatCard
            title="SL Gross"
            value="€8,982.84"
            icon={TrendingUp}
          />
          <StatCard
            title="Processing Time"
            value="478m"
            icon={Clock}
          />
          
        </div>
        
        <ChartCard title="Email Processing Overview">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Received', value: 468 },
                { name: 'Answered', value: 357 },
                { name: 'Forwarded', value: 2 },
                { name: 'Archived', value: 634 }
              ]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={colors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>


        {/* NEW: Service Level and Processing Time Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Service Level Gross Trend">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={slGrossData}>
                  <XAxis dataKey="time" />
                  <YAxis domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="SL Gross" 
                    stroke={colors.primary} 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Processing Time (seconds)">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processingTimeData}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="seconds" 
                    name="Processing Time" 
                    stroke={colors.secondary} 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* NEW: Booking Status and Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Booking Status">
            <div className="h-80">
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

          <ChartCard title="SB Booking Rate">
            <div className="h-80">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-6xl font-bold text-blue-900">
                  {emailMetrics.bookingData.bookingRate}%
                </div>
                <div className="text-gray-500 mt-4">Current Booking Rate</div>
              </div>
            </div>
          </ChartCard>
        </div>
      </section>

      {/* Sales and Service Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-blue-900">Sales and Service Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Service Level Comparison">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { name: 'Sales', sl: 88 },
                  { name: 'Service', sl: 63.14 }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sl" stroke={colors.primary} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="ACC Distribution">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Sales ACC', value: 100 },
                      { name: 'Service ACC', value: 100 }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                  >
                    {[colors.primary, colors.secondary].map((color, index) => (
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
      </section>

      {/* Booking Analytics Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-blue-900">Booking Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Booking Status">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Booked', value: 137 },
                      { name: 'Not Booked', value: 204 },
                      { name: 'Pending', value: 0 }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                  >
                    {CHART_COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="OP/RQ Distribution">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'OP', value: 24 },
                  { name: 'RQ', value: 6 }
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
      </section>

      {/* Conversion Analytics Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-blue-900">Conversion Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <StatCard
            title="CB Conversion Rate"
            value="13.33%"
            icon={TrendingUp}
          />
          <StatCard
            title="Sales Conversion Rate"
            value="59.58%"
            icon={TrendingUp}
          />
        </div>
        <ChartCard title="CB vs Sales Performance">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[
                {
                  name: 'CB',
                  bookings: 12,
                  wrongCalls: 101,
                  conversion: 13.33
                },
                {
                  name: 'Sales',
                  bookings: 12,
                  wrongCalls: 101,
                  conversion: 59.58
                }
              ]}>
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="bookings" fill={colors.success} />
                <Bar yAxisId="left" dataKey="wrongCalls" fill={colors.danger} />
                <Line yAxisId="right" type="monotone" dataKey="conversion" stroke={colors.primary} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>
    </div>
  );  
};

export default AnalyticsDashboard;