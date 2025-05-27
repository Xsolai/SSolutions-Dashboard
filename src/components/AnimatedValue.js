import React, { useState, useEffect } from 'react';

/**
 * Komponente für animierte Werte in StatCards
 * @param {string|number} value - Der anzuzeigende Wert
 * @param {number} duration - Animationsdauer in ms
 * @param {string} className - CSS Klassen
 */
const AnimatedValue = ({ value, duration = 1800, className = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Verschiedene Werttypen erkennen und parsen
  const parseValue = (val) => {
    if (typeof val === 'number') {
      return { type: 'number', numericValue: val, suffix: '' };
    }
    
    if (typeof val === 'string') {
      // Prozentuale Werte (z.B. "58.48%")
      if (val.includes('%')) {
        const numericValue = parseFloat(val.replace('%', ''));
        return { type: 'percentage', numericValue: isNaN(numericValue) ? 0 : numericValue, suffix: '%' };
      }
      
      // Zeitwerte (z.B. "00:01:51")
      if (val.includes(':')) {
        // Für Zeitwerte nehmen wir die Sekunden als Basis für die Animation
        const parts = val.split(':');
        if (parts.length === 3) { // HH:MM:SS
          const totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
          return { type: 'time', numericValue: totalSeconds, suffix: '', originalFormat: val };
        } else if (parts.length === 2) { // MM:SS
          const totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          return { type: 'time', numericValue: totalSeconds, suffix: '', originalFormat: val };
        }
      }
      
      // Zahlen mit Tausendertrennzeichen (z.B. "1,234")
      const cleanedVal = val.replace(/,/g, '');
      const numericValue = parseFloat(cleanedVal);
      if (!isNaN(numericValue)) {
        return { type: 'number', numericValue, suffix: '' };
      }
    }
    
    // Fallback für nicht erkannte Werte
    return { type: 'text', numericValue: 0, suffix: '', originalValue: val };
  };

  const { type, numericValue, suffix, originalFormat, originalValue } = parseValue(value);
  
  // Simple animation effect
  useEffect(() => {
    if (type === 'text' || numericValue === 0) {
      setDisplayValue(numericValue);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;
    const endValue = numericValue;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOutCubic;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };
    
    animate();
  }, [numericValue, duration, type]);

  // Wert formatieren basierend auf Typ
  const formatValue = (val) => {
    switch (type) {
      case 'number':
        // Check if the original value had decimal places
        if (typeof value === 'string' && value.includes('.')) {
          return val.toFixed(1).toLocaleString('de-DE');
        }
        return Math.floor(val).toLocaleString('de-DE');
      
      case 'percentage':
        return `${val.toFixed(2)}${suffix}`;
      
      case 'time':
        if (originalFormat) {
          // Für Zeitwerte interpolieren wir zur ursprünglichen Formatierung
          if (Math.abs(val - numericValue) < 1) {
            return originalFormat; // Finale Wert ist das Original
          }
          // Während der Animation zeigen wir die Sekunden
          const hours = Math.floor(val / 3600);
          const minutes = Math.floor((val % 3600) / 60);
          const seconds = Math.floor(val % 60);
          
          if (originalFormat.split(':').length === 3) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
        }
        return val.toString();
      
      case 'text':
      default:
        return originalValue || val.toString();
    }
  };

  return (
    <span className={className}>
      {formatValue(displayValue)}
    </span>
  );
};

export default AnimatedValue; 