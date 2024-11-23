import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, Cell } from 'recharts';
import { Inbox, Archive, Clock, Timer, Reply, Forward, CheckCircle } from 'lucide-react';

// Modern color palette
const colors = {
  primary: '#001e4a',    // Dark Blue
  secondary: '#fdcc00',  // Yellow
  success: '#10B981',    // Keep success green for clarity
  warning: '#fdcc00',    // Yellow for warnings
  danger: '#EF4444',     // Keep red for danger
  info: '#001e4a',       // Dark Blue
  background: '#FFFFFF', // White
  card: '#F8F9FA',      // Light gray
  text: '#000000',      // Black for paragraphs
  textMuted: '#001e4a', // Dark Blue for subheadings
  border: '#DEE2E6',    // Light border
  heading: '#fdcc00'   // Slate-700
};

// Sample data
const emailData = [
  { date: '2024-03-01', sla: 96.5, volume: 245 },
  { date: '2024-03-02', sla: 94.2, volume: 212 },
  { date: '2024-03-03', sla: 97.8, volume: 198 },
  { date: '2024-03-04', sla: 93.1, volume: 256 },
  { date: '2024-03-05', sla: 91.4, volume: 278 },
  { date: '2024-03-06', sla: 95.9, volume: 234 },
  { date: '2024-03-07', sla: 98.2, volume: 198 }
];

const mailboxData = [
  { name: 'Support', sla: 96.5, processingTime: 12, replies: 156, forwards: 23 },
  { name: 'Sales', sla: 94.2, processingTime: 8, replies: 98, forwards: 45 },
  { name: 'Billing', sla: 97.8, processingTime: 15, replies: 78, forwards: 12 },
  { name: 'Partners', sla: 93.1, processingTime: 18, replies: 67, forwards: 34 }
];

// Calculate averages for KPIs
const avgSLA = emailData.reduce((acc, curr) => acc + curr.sla, 0) / emailData.length;
const avgVolume = Math.round(emailData.reduce((acc, curr) => acc + curr.volume, 0) / emailData.length);
const avgProcessingTime = Math.round(mailboxData.reduce((acc, curr) => acc + curr.processingTime, 0) / mailboxData.length);

const StatCard = ({ title, value, icon: Icon, change, description, variant = 'default' }) => (
  <div className={`relative overflow-hidden bg-white
    rounded-2xl p-6 border border-slate-200 shadow-lg
    hover:border-slate-300 transition-all duration-300 group`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium" style={{ color: colors.textMuted }}>{title}</h3>
      <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${
        variant === 'warning' ? 'text-yellow-500' :
        variant === 'danger' ? 'text-red-500' :
        variant === 'success' ? 'text-emerald-500' :
        'text-slate-400'
      }`} />
    </div>
    <div className="text-3xl font-bold mb-3" style={{ color: colors.text }}>{value}</div>
    <p className="text-xs" style={{ color: colors.textMuted }}>
      <span className={`inline-block mr-2 ${
        change.includes('-') ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {change}
      </span>
      {description}
    </p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 
    shadow-lg hover:border-slate-300 transition-all duration-300">
    <h3 className="text-lg font-medium mb-6" style={{ color: colors.heading }}>{title}</h3>
    {children}
  </div>
);

// const formatDwellTime = (hours) => {
//   const wholeHours = Math.floor(hours);
//   const minutes = Math.round((hours - wholeHours) * 60);
//   return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
// };

const getSLAVariant = (value) => {
  if (value >= 95) return 'success';
  if (value >= 85) return 'warning';
  return 'danger';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xl">
        <p className="font-medium mb-1" style={{ color: colors.heading }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: colors.textMuted }}>
            {entry.name}: <span style={{ color: colors.text }}>{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const EmailAnalysisDashboard = () => {
  const getBarColor = (sla) => {
    if (sla >= 95) return colors.success;
    if (sla >= 85) return colors.warning;
    return colors.danger;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 px-2 sm:px-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.heading }}>
            Email Response Analytics
          </h1>
          <p style={{ color: colors.text }}>
            Real-time insights from Workflow Report GuruKF
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            title="24h Service Level"
            value={`${avgSLA.toFixed(1)}%`}
            icon={CheckCircle}
            change={`${(avgSLA - 94.5).toFixed(1)}%`}
            description="vs. target (95%)"
            variant={getSLAVariant(avgSLA)}
          />
          <StatCard
            title="Daily Volume"
            value={avgVolume}
            icon={Inbox}
            change="+12.5%"
            description="vs. last week"
          />
          <StatCard
            title="Processing Time"
            value={`${avgProcessingTime} min`}
            icon={Timer}
            change="-2.3 min"
            description="vs. last week"
            variant="success"
          />
          <StatCard
            title="Response Rate"
            value="92.8%"
            icon={Reply}
            change="+3.2%"
            description="vs. last week"
            variant="success"
          />
        </div>

        {/* Charts */}
        <ChartCard title="Daily Service Level Performance">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emailData}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: colors.textMuted }}
                  axisLine={{ stroke: colors.border }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: colors.textMuted }}
                  domain={[80, 100]}
                  axisLine={{ stroke: colors.border }}
                  label={{ 
                    value: 'Service Level (%)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: colors.textMuted 
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    color: colors.text
                  }}
                />
                <Bar dataKey="sla" name="24h Service Level">
                  {emailData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry.sla)}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey={() => 95} 
                  stroke={colors.danger}
                  strokeDasharray="3 3" 
                  name="Target (95%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Processing and Response Times Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Processing Time by Mailbox">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mailboxData}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: colors.textMuted }}
                    axisLine={{ stroke: colors.border }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: colors.textMuted }}
                    axisLine={{ stroke: colors.border }}
                    domain={[0, 'dataMax + 2']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="processingTime" 
                    name="Avg. Processing Time (min)" 
                    fill={colors.primary}
                    radius={[4, 4, 0, 0]}
                    fillOpacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>


          <ChartCard title="Service Level by Mailbox">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mailboxData}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: colors.textMuted }}
                    axisLine={{ stroke: colors.border }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: colors.textMuted }}
                    axisLine={{ stroke: colors.border }}
                    domain={[80, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="sla" name="24h Service Level">
                    {mailboxData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getBarColor(entry.sla)}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Response Metrics */}
        <ChartCard title="Mailbox Response Metrics">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mailboxData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: colors.textMuted }}
                  axisLine={{ stroke: colors.border }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: colors.textMuted }}
                  axisLine={{ stroke: colors.border }}
                  domain={[0, 'dataMax + 50']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="replies" 
                  name="Replies" 
                  fill={colors.primary}
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.8}
                />
                <Bar 
                  dataKey="forwards" 
                  name="Forwards" 
                  fill={colors.secondary}
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default EmailAnalysisDashboard;