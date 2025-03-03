import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { X, Download, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MonthYearPicker = ({ isOpen, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [minDate, setMinDate] = useState({ year: 2025, month: 0 }); // Jan 2025 (0-indexed month)
  const popupRef = useRef(null);
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    // Set default selection to current month/year when opening
    if (isOpen) {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    }
    
    // Close on outside click
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, currentMonth, currentYear, onClose]);

  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni", 
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  // Navigate to previous year
  const goToPrevYear = () => {
    if (selectedYear > minDate.year) {
      setSelectedYear(selectedYear - 1);
    }
  };

  // Navigate to next year
  const goToNextYear = () => {
    if (selectedYear < currentYear) {
      setSelectedYear(selectedYear + 1);
    }
  };

  const isDateDisabled = (year, month) => {
    // Disable dates before Jan 2025
    if (year < minDate.year) return true;
    if (year === minDate.year && month < minDate.month) return true;
    
    // Disable dates after current month
    if (year > currentYear) return true;
    if (year === currentYear && month > currentMonth) return true;
    
    return false;
  };

  const handleExport = async () => {
    try {
      // Format as YYYY-MM
      const monthStr = (selectedMonth + 1).toString().padStart(2, '0');
      const dateParam = `${selectedYear}-${monthStr}`;
      
      const response = await axios.post(
        `https://solasolution.ecomtask.de/export/excel?month=${dateParam}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          responseType: "blob",
        }
      );
      
      // Create filename with current date AND time to avoid duplicates
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      
      // Format: FC_neu_DD_MM_YYYY_HHMMSS.xlsx
      const filename = `FC_neu_${day}_${month}_${year}_${hours}_${minutes}_${seconds}.xlsx`;
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onClose();
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const getMonthStyle = (index) => {
    const isDisabled = isDateDisabled(selectedYear, index);
    const isSelected = selectedMonth === index && !isDisabled;
    
    if (isSelected) {
      return "bg-[#F0B72F] text-[#001E4A] font-medium";
    } else if (isDisabled) {
      return "bg-[#F9F9F9] text-[#CBD5E1] cursor-not-allowed";
    } else {
      return "bg-[#F9F9F9] text-[#001E4A] hover:bg-[#F0B72F]/10";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/5 backdrop-blur-sm z-40" />
      
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl z-50 w-full max-w-md"
        ref={popupRef}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-medium text-[#001E4A] flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monat für Export wählen
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
            aria-label="Schließen"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Year selector */}
          <div className="mb-4">
            <label className="block text-[#001E4A] font-medium mb-2">Jahr</label>
            <div className="relative">
              <div className="flex items-center justify-between bg-[#F9F9F9] rounded-lg px-4 py-3">
                <button 
                  onClick={goToPrevYear}
                  disabled={selectedYear <= minDate.year}
                  className={`p-0.5 rounded-md transition-colors duration-200 ${
                    selectedYear <= minDate.year 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-[#001E4A] hover:bg-gray-200/50'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-[#001E4A] font-medium text-lg">
                  {selectedYear}
                </div>
                
                <button 
                  onClick={goToNextYear}
                  disabled={selectedYear >= currentYear}
                  className={`p-0.5 rounded-md transition-colors duration-200 ${
                    selectedYear >= currentYear 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-[#001E4A] hover:bg-gray-200/50'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Month grid */}
          <div className="mb-6">
            <label className="block text-[#001E4A] font-medium mb-2">Monat</label>
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, index) => (
                <button
                  key={month}
                  className={`py-3 px-2 rounded-lg text-center transition-all duration-200 ${getMonthStyle(index)}`}
                  onClick={() => !isDateDisabled(selectedYear, index) && setSelectedMonth(index)}
                  disabled={isDateDisabled(selectedYear, index)}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
          
          {/* Selected date display */}
          <div className="mb-6 py-3 px-4 bg-[#F9F9F9] rounded-lg">
            <div className="text-center">
              <p className="text-sm text-[#64748B] mb-1">Ausgewählter Zeitraum:</p>
              <p className="text-[#001E4A] font-medium">
                {months[selectedMonth]} {selectedYear}
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between gap-3">
            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-lg text-[#001E4A] border border-gray-200 hover:bg-gray-50 transition-colors duration-200 font-medium flex-1"
            >
              Abbrechen
            </button>
            <button
              onClick={handleExport}
              className="py-2.5 px-5 rounded-lg text-[#F0B72F] bg-[#001E4A] hover:bg-[#001E4A]/90 transition-colors duration-200 font-medium flex-1 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Exportieren
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Modified Download Button to open the picker
const ExportButton = () => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <>
      <button
        className="px-4 py-2 rounded-xl font-nexa-black text-[17px] leading-[27px] ml-auto transition-all duration-200 text-[#F0B72F] bg-[#001E4A] border-2 hover:bg-[#001E4A]/90 active:scale-90 flex items-center gap-2"
        onClick={() => setIsPickerOpen(true)}
      >
        <Download className="w-5 h-5" />
        Download
      </button>
      
      <MonthYearPicker 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
      />
    </>
  );
};

export { MonthYearPicker, ExportButton };