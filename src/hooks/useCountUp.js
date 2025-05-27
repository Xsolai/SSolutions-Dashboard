import { useState, useEffect, useRef } from 'react';

/**
 * Hook für animiertes Hochzählen von Zahlen
 * @param {number} endValue - Zielwert
 * @param {number} duration - Animationsdauer in ms (default: 2000)
 * @param {number} startValue - Startwert (default: 0)
 * @param {boolean} preserveDecimals - Soll Dezimalstellen beibehalten werden
 */
const useCountUp = (endValue, duration = 2000, startValue = 0, preserveDecimals = false) => {
  const [currentValue, setCurrentValue] = useState(startValue);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const previousEndValueRef = useRef(null);

  useEffect(() => {
    // Nur animieren wenn sich der endValue geändert hat oder es das erste Mal ist
    if (previousEndValueRef.current === endValue) {
      return;
    }
    
    previousEndValueRef.current = endValue;
    
    // Animation stoppen falls läuft
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Startwert setzen
    startTimeRef.current = null;
    setCurrentValue(startValue);

    // Wenn duration sehr klein ist, sofort zum Endwert springen
    if (duration <= 50) {
      setCurrentValue(endValue);
      return;
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutCubic für smooth deceleration)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const newValue = startValue + (endValue - startValue) * easeOutCubic;
      
      if (preserveDecimals) {
        setCurrentValue(newValue);
      } else {
        setCurrentValue(Math.floor(newValue));
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(endValue);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [endValue, duration, startValue, preserveDecimals]);

  return currentValue;
};

export default useCountUp; 