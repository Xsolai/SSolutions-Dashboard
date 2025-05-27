import React, { useState } from 'react';
import { Download, Maximize2, Minimize2 } from 'lucide-react';
import { chartConfig } from '@/utils/dashboardUtils';

// Statistik-Karte
export const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  loading = false,
  description
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E6E2DF]">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-[#F0B72F]" />}
            <h3 className="text-[#001E4A] font-nexa-heavy text-base">{title}</h3>
          </div>
          
          {loading ? (
            <div className="h-8 w-24 bg-[#E6E2DF] animate-pulse rounded" />
          ) : (
            <p className="text-[#001E4A] text-2xl font-nexa-heavy">
              {value}
              {change && (
                <span className={`text-sm ml-2 ${
                  change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              )}
            </p>
          )}
          
          {description && (
            <p className="text-sm text-[#001E4A]/60 font-nexa-book">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Chart-Karte mit Export- und Vollbild-Funktionalität
export const ChartCard = ({
  title,
  children,
  loading = false,
  data = null,
  onExport,
  className = '',
  expandable = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExport = () => {
    if (onExport && data) {
      onExport(data, title);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`relative bg-white rounded-2xl p-6 shadow-sm border border-[#E6E2DF] ${
      isExpanded ? 'fixed inset-4 z-50 overflow-auto' : className
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#001E4A] font-nexa-heavy text-lg">{title}</h3>
        
        <div className="flex items-center gap-2">
          {data && onExport && (
            <button
              onClick={handleExport}
              className="p-2 hover:bg-[#E6E2DF]/20 rounded-lg transition-colors"
              title="Exportieren"
            >
              <Download className="h-5 w-5 text-[#001E4A]" />
            </button>
          )}
          
          {expandable && (
            <button
              onClick={toggleExpand}
              className="p-2 hover:bg-[#E6E2DF]/20 rounded-lg transition-colors"
              title={isExpanded ? 'Minimieren' : 'Maximieren'}
            >
              {isExpanded ? (
                <Minimize2 className="h-5 w-5 text-[#001E4A]" />
              ) : (
                <Maximize2 className="h-5 w-5 text-[#001E4A]" />
              )}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#F0B72F] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

// Info-Karte
export const InfoCard = ({
  title,
  content,
  icon: Icon,
  variant = 'default'
}) => {
  const variants = {
    default: 'bg-white border-[#E6E2DF]',
    primary: 'bg-[#F0B72F]/10 border-[#F0B72F]',
    secondary: 'bg-[#001E4A]/10 border-[#001E4A]',
    success: 'bg-green-50 border-green-500',
    warning: 'bg-yellow-50 border-yellow-500',
    error: 'bg-red-50 border-red-500'
  };

  return (
    <div className={`rounded-2xl p-6 border ${variants[variant]}`}>
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-[#F0B72F]" />
          </div>
        )}
        <div>
          <h4 className="text-[#001E4A] font-nexa-heavy text-lg mb-2">{title}</h4>
          <div className="text-[#001E4A]/70 font-nexa-book">{content}</div>
        </div>
      </div>
    </div>
  );
};

// Filter-Karte
export const FilterCard = ({
  title,
  children,
  onReset,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-[#E6E2DF] ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#001E4A] font-nexa-heavy text-lg">{title}</h3>
        {onReset && (
          <button
            onClick={onReset}
            className="text-sm text-[#F0B72F] hover:text-[#F0B72F]/80 font-nexa-book transition-colors"
          >
            Zurücksetzen
          </button>
        )}
      </div>
      {children}
    </div>
  );
}; 