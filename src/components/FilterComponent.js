import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const CustomDateRangeFilter = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({
    start: new Date(),
    end: new Date()
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date()
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isAllTime, setIsAllTime] = useState(false);

  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    setTempDateRange({ start: yesterday, end: yesterday });
    setDateRange({ start: yesterday, end: yesterday });
    setSelectedMonth(yesterday);
    
    onFilterChange({
      startDate: yesterday,
      endDate: yesterday,
      isAllTime: false
    });
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isDateInRange = (date) => {
    if (!date || !tempDateRange.start) return false;
    if (!tempDateRange.end) return date.toDateString() === tempDateRange.start.toDateString();
    return date >= tempDateRange.start && date <= tempDateRange.end;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    setIsAllTime(false);
    
    let newRange;
    if (!tempDateRange.start || (tempDateRange.start && tempDateRange.end)) {
      newRange = { start: date, end: null };
    } else {
      if (date < tempDateRange.start) {
        newRange = { start: date, end: tempDateRange.start };
      } else {
        newRange = { start: tempDateRange.start, end: date };
      }
    }
    
    setTempDateRange(newRange);
  };

  const handleAllTime = () => {
    setIsAllTime(true);
    setTempDateRange({ start: null, end: null });
    setDateRange({ start: null, end: null });
    onFilterChange({
      startDate: null,
      endDate: null,
      isAllTime: true
    });
    setIsOpen(false);
  };

  const handleApply = () => {
    if (tempDateRange.start) {
      const newRange = {
        start: tempDateRange.start,
        end: tempDateRange.end || tempDateRange.start // If no end date, use start date
      };
      setDateRange(newRange);
      setIsAllTime(false);
      onFilterChange({
        startDate: newRange.start,
        endDate: newRange.end,
        isAllTime: false
      });
      setIsOpen(false);
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    const today = new Date();
    if (newMonth <= today) {
      setSelectedMonth(newMonth);
    }
  };

  const getDisplayText = () => {
    if (isAllTime) {
      return 'Gesamt';
    }
    
    const displayRange = isOpen ? tempDateRange : dateRange;
    
    if (!displayRange.start) {
      return '';
    }
    
    if (displayRange.start && !displayRange.end) {
      return formatDate(displayRange.start);
    }
    
    if (displayRange.start && displayRange.end) {
      if (displayRange.start.toDateString() === displayRange.end.toDateString()) {
        return formatDate(displayRange.start);
      } else {
        return `${formatDate(displayRange.start)} - ${formatDate(displayRange.end)}`;
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
        style={{ backgroundColor: '#FFF9E6' }}
      >
        <Calendar className="h-4 w-4 text-[#FDB022]" />
        {getDisplayText()}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium">
              {selectedMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
            {getDaysInMonth(selectedMonth).map((date, index) => (
              <button
                key={index}
                onClick={() => date && handleDateClick(date)}
                className={`
                  p-2 text-sm rounded-lg transition-colors
                  ${!date || isDateDisabled(date) ? 'invisible' : 'hover:bg-yellow-200'}
                  ${isDateInRange(date) ? 'bg-yellow-100' : ''}
                  ${date && date.toDateString() === tempDateRange.start?.toDateString() ? 'bg-yellow-300' : ''}
                  ${date && date.toDateString() === tempDateRange.end?.toDateString() ? 'bg-yellow-300' : ''}
                  ${isDateDisabled(date) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={!date || isDateDisabled(date)}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <button
              onClick={handleAllTime}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Gesamt
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-1 text-sm bg-yellow-400 text-gray-900 rounded hover:bg-yellow-500"
            >
              Anwenden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDateRangeFilter;