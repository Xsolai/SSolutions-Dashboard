import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

/**
 * Moderne Dropdown-Komponente 
 * Passt zum Design-System und ersetzt native Browser-Selects
 */
const ModernDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Bitte auswählen...",
  disabled = false,
  className = '',
  size = 'medium',
  sidebarMode = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownStyles, setDropdownStyles] = useState({});
  const dropdownRef = useRef(null);

  // Größen-Varianten
  const sizeStyles = {
    small: 'px-3 py-1.5 text-[14px] leading-[22px]',
    medium: 'px-4 py-2 text-[17px] leading-[27px]', 
    large: 'px-6 py-3 text-[19px] leading-[29px]'
  };

  // Basis-Styles
  const baseStyles = `
    ${sizeStyles[size]}
    w-full font-nexa-book rounded-xl transition-all duration-300 ease-out cursor-pointer
    flex items-center justify-between
    ${sidebarMode 
      ? 'bg-transparent text-white border border-white/10 hover:bg-white/5' 
      : 'text-[#001E4A] bg-white border-2 border-[#E6E2DF] hover:border-[#F0B72F]/50 focus:outline-none focus:border-[#F0B72F] focus:ring-4 focus:ring-[#F0B72F]/10'
    }
    disabled:opacity-60 disabled:cursor-not-allowed
  `;

  // Find selected option
  const selectedOption = options.find(option => option.value === value);

  // Calculate dropdown position and size to prevent overflow
  const calculateDropdownStyles = () => {
    if (!dropdownRef.current) return;

    const triggerRect = dropdownRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Wenn sidebarMode aktiv ist, positioniere rechts neben der Sidebar
    if (sidebarMode) {
      const sidebarWidth = 288; // 72 * 4px (w-72 in Tailwind)
      const dropdownWidth = 250;
      const dropdownMaxHeight = 240; // max-h-60 entspricht 240px
      
      // Berechne die optimale vertikale Position
      let top = triggerRect.top; // Starte auf Button-Höhe
      
      // Prüfe ob Dropdown unten aus dem Bildschirm herausragen würde
      if (top + dropdownMaxHeight > viewportHeight - 20) {
        // Berechne neue Position, damit es am unteren Rand sichtbar bleibt
        top = viewportHeight - dropdownMaxHeight - 20;
        
        // Aber nicht höher als 20px vom oberen Rand
        top = Math.max(20, top);
      }
      
      const styles = {
        position: 'fixed',
        left: `${sidebarWidth + 10}px`, // 10px rechts neben der Sidebar
        top: `${top}px`,
        width: `${dropdownWidth}px`,
        zIndex: 2147483647, // Maximaler z-index Wert
        backgroundColor: '#001E4A', // Seitenleisten-Farbe
        opacity: 1, // Explizit nicht transparent
        pointerEvents: 'auto', // Explizit Maus-Events aktivieren
      };
      
      // console.log('🔍 ModernDropdown sidebarMode styles:', { 
      //   triggerRect, 
      //   viewportHeight, 
      //   calculatedTop: top, 
      //   styles 
      // }); // Debug
      setDropdownStyles(styles);
      return;
    }
    
    // Minimum and maximum dropdown width
    const minWidth = Math.max(200, triggerRect.width);
    const maxWidth = 300;
    
    // Calculate available space
    const spaceRight = viewportWidth - triggerRect.left - 20; // 20px margin
    const spaceLeft = triggerRect.right - 20; // 20px margin
    
    // Determine optimal width (never exceed viewport)
    let optimalWidth = Math.min(maxWidth, Math.max(minWidth, spaceRight));
    
    // Determine horizontal position
    let left = 0;
    let right = 'auto';
    
    // If dropdown would overflow on the right, try positioning from the right
    if (triggerRect.left + optimalWidth > viewportWidth - 20) {
      if (spaceLeft >= minWidth) {
        // Position from right edge of trigger
        right = 0;
        left = 'auto';
        optimalWidth = Math.min(maxWidth, spaceLeft);
      } else {
        // Position to fit within viewport, may need to be narrower
        left = Math.max(20 - triggerRect.left, -(optimalWidth - triggerRect.width));
        optimalWidth = Math.min(viewportWidth - 40, maxWidth);
      }
    }

    setDropdownStyles({
      width: `${optimalWidth}px`,
      left: left === 'auto' ? left : `${left}px`,
      right: right === 'auto' ? right : `${right}px`,
    });
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0) {
            handleOptionSelect(options[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, options]);

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen) {
        calculateDropdownStyles();
      }
      // console.log('🖱️ Kunden-Dropdown TOGGLE:', { 
      //   wasOpen: isOpen, 
      //   willBeOpen: !isOpen, 
      //   sidebarMode, 
      //   optionsLength: options.length,
      //   dropdownStyles,
      //   disabled
      // }); // Debug
      setIsOpen(!isOpen);
      setHighlightedIndex(-1);
    } else {
      // console.log('❌ ModernDropdown DISABLED - cannot toggle');
    }
  };

  const handleOptionSelect = (option) => {
    // console.log('🎯 handleOptionSelect called with:', option);
    onChange(option.value);
    setIsOpen(false);
    setHighlightedIndex(-1);
    // console.log('✅ handleOptionSelect completed');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} {...props}>
      {/* Dropdown Trigger */}
      <motion.div
        className={`${baseStyles} ${isOpen 
          ? (sidebarMode 
              ? 'bg-white/10' 
              : 'border-[#F0B72F] ring-4 ring-[#F0B72F]/10'
            ) 
          : ''
        }`}
        onClick={handleToggle}
        whileHover={{ scale: disabled ? 1 : 1.01 }}
        whileTap={{ scale: disabled ? 1 : 0.99 }}
      >
        <span className={`${selectedOption ? '' : 'opacity-50'} ${sidebarMode ? 'text-white' : 'text-[#001E4A]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-2 shrink-0"
        >
          <ChevronDown className={`w-5 h-5 ${sidebarMode ? 'text-white/70' : 'text-[#001E4A]/70'}`} />
        </motion.div>
      </motion.div>

      {/* Dropdown Options */}
      <AnimatePresence>
        {isOpen && !sidebarMode && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-2 bg-white border-2 border-[#E6E2DF] rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
            style={{
              zIndex: 2147483647, // Maximaler z-index Wert
              backgroundColor: 'white', // Explizit weiß
              opacity: 1, // Explizit nicht transparent
              border: '2px solid #E6E2DF', // Expliziter Border
              isolation: 'isolate', // Neuer Stacking Context
              contain: 'layout style paint', // CSS Containment
            }}
          >
            {options.map((option, index) => (
              <motion.div
                key={option.value || index}
                className={`
                  px-4 py-3 cursor-pointer transition-all duration-200
                  text-[17px] leading-[27px] font-nexa-book
                  first:rounded-t-xl last:rounded-b-xl
                  whitespace-nowrap overflow-hidden text-ellipsis
                  ${highlightedIndex === index 
                    ? 'bg-[#F0B72F]/10 text-[#001E4A]' 
                    : 'text-[#001E4A] hover:bg-[#E6E2DF]/10'
                  }
                  ${option.value === value 
                    ? 'bg-[#F0B72F]/20 text-[#001E4A] font-nexa-black' 
                    : ''
                  }
                `}
                onClick={() => handleOptionSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                title={option.label}
                style={{
                  color: '#001E4A',
                  backgroundColor: option.value === value ? '#F0B72F40' : 
                                   highlightedIndex === index ? '#F0B72F20' : 'transparent'
                }}
              >
                <span className="flex items-center justify-between">
                  <span className="truncate flex-1 mr-2">{option.label}</span>
                  {option.value === value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-[#F0B72F] rounded-full shrink-0"
                    />
                  )}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Sidebar Portal (außerhalb AnimatePresence) */}
      {isOpen && sidebarMode && createPortal(
        <div
          className={`
            fixed bg-[#001E4A] border-2 border-[#F0B72F]/20 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden
            scrollbar-thin scrollbar-track-[#001E4A] scrollbar-thumb-[#F0B72F40] hover:scrollbar-thumb-[#F0B72F60]
          `}
          style={{
            ...dropdownStyles,
            zIndex: 2147483647,
            backgroundColor: '#001E4A',
            opacity: 1,
            border: '2px solid #F0B72F40',
            isolation: 'isolate',
            contain: 'layout style paint',
            willChange: 'transform',
            pointerEvents: 'auto',
            userSelect: 'none',
            touchAction: 'manipulation',
          }}
        >
          {options.map((option, index) => (
            <div
              key={option.value || index}
              className={`
                px-4 py-3 cursor-pointer transition-all duration-200
                text-[17px] leading-[27px] font-nexa-book
                first:rounded-t-xl last:rounded-b-xl
                whitespace-nowrap overflow-hidden text-ellipsis
                ${highlightedIndex === index 
                  ? 'bg-[#F0B72F]/20 text-white' 
                  : 'text-white hover:bg-white/10'
                }
                ${option.value === value 
                  ? 'bg-[#F0B72F]/30 text-white font-nexa-black' 
                  : ''
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // console.log('🖱️ Kunden-Option geklickt:', option.label);
                handleOptionSelect(option);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              title={option.label}
              style={{
                color: 'white',
                backgroundColor: option.value === value ? '#F0B72F50' : 
                                 highlightedIndex === index ? '#F0B72F30' : 'transparent',
                cursor: 'pointer',
                pointerEvents: 'all',
              }}
            >
              <span className="flex items-center justify-between">
                <span className="truncate flex-1 mr-2">{option.label}</span>
                {option.value === value && (
                  <div className="w-2 h-2 bg-[#F0B72F] rounded-full shrink-0" />
                )}
              </span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ModernDropdown; 