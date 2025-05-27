import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

const CustomDateRangeFilter = ({ onFilterChange, sidebarMode = false }) => {
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
  const [dropdownPosition, setDropdownPosition] = useState({});
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null); // Neue Ref für den Dropdown-Container

  // Sidebar-Breite konstant (entspricht w-72 in Tailwind = 288px)
  const SIDEBAR_WIDTH = 288;

  // Click-Outside-to-Close Funktionalität
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Nur wenn der Kalender geöffnet ist
      if (!isOpen) return;

      const isButtonClick = buttonRef.current?.contains(event.target);
      
      // Für Sidebar-Modus: Prüfe Portal-Container
      if (sidebarMode) {
        const portalElements = document.querySelectorAll('[data-calendar-portal]');
        const isPortalClick = Array.from(portalElements).some(portal => 
          portal.contains(event.target)
        );
        
        if (!isButtonClick && !isPortalClick) {
          setIsOpen(false);
        }
      } else {
        // Für normalen Modus: Prüfe Dropdown-Container
        const isDropdownClick = dropdownRef.current?.contains(event.target);
        
        if (!isButtonClick && !isDropdownClick) {
          setIsOpen(false);
        }
      }
    };

    // Event Listener nur hinzufügen, wenn Kalender geöffnet ist
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    // Cleanup function
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, sidebarMode]);

  useEffect(() => {
    // Verwende die angepasste "heute" Funktion für das initiale Datum
    const now = new Date();
    const adjustedToday = new Date();
    adjustedToday.setHours(0, 0, 0, 0);
    
    // Wenn es vor 6 Uhr morgens ist, behandle gestern als "heute"
    if (now.getHours() < 6) {
      adjustedToday.setDate(adjustedToday.getDate() - 1);
    }
    
    // Setze das Datum auf einen Tag vor dem "angepassten heute"
    const initialDate = new Date(adjustedToday);
    initialDate.setDate(initialDate.getDate() - 1);
    initialDate.setHours(0, 0, 0, 0);
    
    setTempDateRange({ start: initialDate, end: initialDate });
    setDateRange({ start: initialDate, end: initialDate });
    setSelectedMonth(initialDate);
    
    onFilterChange({
      startDate: initialDate,
      endDate: initialDate,
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

  // Neue Funktion: Gibt das angepasste "heute" zurück (berücksichtigt 6 Uhr Regel)
  const getAdjustedToday = () => {
    const now = new Date();
    const adjustedToday = new Date();
    adjustedToday.setHours(0, 0, 0, 0);
    
    // Wenn es vor 6 Uhr morgens ist, behandle gestern als "heute"
    if (now.getHours() < 6) {
      adjustedToday.setDate(adjustedToday.getDate() - 1);
    }
    
    return adjustedToday;
  };

  const isDateInRange = (date) => {
    if (!date || !tempDateRange.start) return false;
    if (!tempDateRange.end) return date.toDateString() === tempDateRange.start.toDateString();
    return date >= tempDateRange.start && date <= tempDateRange.end;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    const adjustedToday = getAdjustedToday();
    return date >= adjustedToday;
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

  const handleButtonClick = () => {
    if (sidebarMode && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownMaxHeight = 400; // Ungefähre Höhe des Datums-Dropdowns
      const viewportHeight = window.innerHeight;
      
      // Berechne die optimale vertikale Position
      let top = rect.top; // Starte auf Button-Höhe
      
      // Prüfe ob Dropdown unten aus dem Bildschirm herausragen würde
      if (top + dropdownMaxHeight > viewportHeight - 20) {
        // Berechne neue Position, damit es am unteren Rand sichtbar bleibt
        top = viewportHeight - dropdownMaxHeight - 20;
        
        // Aber nicht höher als 20px vom oberen Rand
        top = Math.max(20, top);
      }
      
      setDropdownPosition({
        position: 'fixed',
        left: `${SIDEBAR_WIDTH + 10}px`,
        top: `${top}px`,
        zIndex: 2147483647,
        backgroundColor: '#1a2332',
        opacity: 1,
        pointerEvents: 'auto',
      });
    }
    setIsOpen(!isOpen);
  };

  // Dropdown Component
  const DropdownContent = () => (
    <div style={{ color: '#001E4A', backgroundColor: 'transparent' }}>
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => navigateMonth(-1)}
          className="p-1 hover:bg-[#E6E2DF]/10 rounded-full transition-all"
          style={{ color: '#001E4A', backgroundColor: 'transparent' }}
        >
          <ChevronLeft className="h-4 w-4 text-[#001E4A]" />
        </button>
        <span className="font-nexa-black text-[#001E4A]" style={{ color: '#001E4A' }}>
          {selectedMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </span>
        <button 
          onClick={() => navigateMonth(1)}
          className="p-1 hover:bg-[#E6E2DF]/10 rounded-full transition-all"
          style={{ color: '#001E4A', backgroundColor: 'transparent' }}
        >
          <ChevronRight className="h-4 w-4 text-[#001E4A]" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-[14px] font-nexa-book text-[#001E4A]/70 py-1" style={{ color: '#001E4A' }}>
            {day}
          </div>
        ))}
        {getDaysInMonth(selectedMonth).map((date, index) => {
          const adjustedToday = getAdjustedToday();
          const isToday = date && date.toDateString() === adjustedToday.toDateString();
          
          return (
            <button
              key={index}
              onClick={() => date && handleDateClick(date)}
              className={`
                p-2 text-[14px] font-nexa-book rounded-lg transition-all
                ${!date || isDateDisabled(date) ? 'invisible' : 'hover:bg-[#F0B72F]/20'}
                ${isDateInRange(date) ? 'bg-[#F0B72F]/10' : ''}
                ${date && date.toDateString() === tempDateRange.start?.toDateString() ? 'bg-[#F0B72F] text-[#001E4A]' : ''}
                ${date && date.toDateString() === tempDateRange.end?.toDateString() ? 'bg-[#F0B72F] text-[#001E4A]' : ''}
                ${isDateDisabled(date) ? 'opacity-50 cursor-not-allowed' : 'text-[#001E4A]'}
                ${isToday && !isDateDisabled(date) ? 'ring-2 ring-[#F0B72F] font-nexa-black' : ''}
              `}
              disabled={!date || isDateDisabled(date)}
              style={{ color: '#001E4A', backgroundColor: date && isDateInRange(date) ? '#F0B72F20' : 'transparent' }}
            >
              {date?.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E6E2DF]">
        <button
          onClick={handleAllTime}
          className="px-3 py-1 text-[14px] font-nexa-book bg-[#E6E2DF]/10 text-[#001E4A] rounded-lg hover:bg-[#E6E2DF]/20 transition-all"
          style={{ color: '#001E4A', backgroundColor: '#E6E2DF20' }}
        >
          Gesamt
        </button>
        <button
          onClick={handleApply}
          className="px-6 py-1 text-[14px] font-nexa-black bg-[#F0B72F] text-[#001E4A] rounded-lg hover:bg-[#F0B72F]/90 transition-all"
        >
          Anwenden
        </button>
      </div>
    </div>
  );

  // Dark Dropdown Content für sidebarMode
  const DarkDropdownContent = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => navigateMonth(-1)}
          className="p-1 hover:bg-white/10 rounded-full transition-all"
        >
          <ChevronLeft className="h-4 w-4 text-white" />
        </button>
        <span className="font-nexa-black text-white">
          {selectedMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </span>
        <button 
          onClick={() => navigateMonth(1)}
          className="p-1 hover:bg-white/10 rounded-full transition-all"
        >
          <ChevronRight className="h-4 w-4 text-white" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-[14px] font-nexa-book text-white/70 py-1">
            {day}
          </div>
        ))}
        {getDaysInMonth(selectedMonth).map((date, index) => {
          const adjustedToday = getAdjustedToday();
          const isToday = date && date.toDateString() === adjustedToday.toDateString();
          
          return (
            <button
              key={index}
              onClick={() => date && handleDateClick(date)}
              className={`
                p-2 text-[14px] font-nexa-book rounded-lg transition-all
                ${!date || isDateDisabled(date) ? 'invisible' : 'hover:bg-[#F0B72F]/20'}
                ${isDateInRange(date) ? 'bg-[#F0B72F]/20' : ''}
                ${date && date.toDateString() === tempDateRange.start?.toDateString() ? 'bg-[#F0B72F] text-[#001E4A]' : ''}
                ${date && date.toDateString() === tempDateRange.end?.toDateString() ? 'bg-[#F0B72F] text-[#001E4A]' : ''}
                ${isDateDisabled(date) ? 'opacity-50 cursor-not-allowed text-white/30' : 'text-white'}
                ${isToday && !isDateDisabled(date) ? 'ring-2 ring-[#F0B72F] font-nexa-black' : ''}
              `}
              disabled={!date || isDateDisabled(date)}
            >
              {date?.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
        <button
          onClick={handleAllTime}
          className="px-3 py-1 text-[14px] font-nexa-book bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
        >
          Gesamt
        </button>
        <button
          onClick={handleApply}
          className="px-6 py-1 text-[14px] font-nexa-black bg-[#F0B72F] text-[#001E4A] rounded-lg hover:bg-[#F0B72F]/90 transition-all"
        >
          Anwenden
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[17px] leading-[27px] font-nexa-book transition-all
          ${sidebarMode 
            ? 'bg-transparent text-white hover:bg-white/5 border border-white/10' 
            : 'bg-[#F0B72F]/10 text-[#001E4A]'
          }
        `}
      >
        <Calendar className={`h-4 w-4 ${sidebarMode ? 'text-white/70' : 'text-[#F0B72F]'}`} />
        {getDisplayText()}
      </button>

      {isOpen && sidebarMode && createPortal(
        <div 
          data-calendar-portal="true"
          className="fixed bg-[#001E4A] rounded-lg shadow-lg p-4 min-w-[300px] border border-[#F0B72F]/20"
          style={{
            ...dropdownPosition,
            backgroundColor: '#001E4A',
            opacity: 1,
            border: '2px solid #F0B72F40',
            isolation: 'isolate',
            contain: 'layout style paint',
            willChange: 'transform',
            pointerEvents: 'auto',
            userSelect: 'none',
          }}
        >
          <DarkDropdownContent />
        </div>,
        document.body
      )}
      
      {isOpen && !sidebarMode && (
        <div 
          ref={dropdownRef}
          className="absolute top-full mt-2 bg-white rounded-lg shadow-lg p-4 min-w-[300px] border border-[#E6E2DF]"
          style={{
            zIndex: 2147483647,
            backgroundColor: 'white',
            opacity: 1,
            border: '2px solid #E6E2DF',
            isolation: 'isolate',
            contain: 'layout style paint',
          }}
        >
          <DropdownContent />
        </div>
      )}
    </div>
  );
};
export default CustomDateRangeFilter;