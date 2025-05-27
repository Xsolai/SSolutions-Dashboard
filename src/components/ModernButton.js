import React from 'react';
import { motion } from 'framer-motion';

/**
 * Moderne Button-Komponente mit verschiedenen Varianten
 * Behält alle Funktionalitäten bei, modernisiert nur das Design
 */
const ModernButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  className = '',
  onClick,
  ...props 
}) => {

  // Basis-Styles die für alle Buttons gelten
  const baseStyles = `
    inline-flex items-center justify-center gap-2 
    font-nexa-black transition-all duration-300 ease-out
    rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2
    relative overflow-hidden cursor-pointer
    disabled:cursor-not-allowed disabled:opacity-60
    active:scale-[0.98] transform
  `;

  // Größen-Varianten
  const sizeStyles = {
    small: 'px-3 py-1.5 text-[14px] leading-[22px]',
    medium: 'px-4 py-2 text-[17px] leading-[27px]', 
    large: 'px-6 py-3 text-[19px] leading-[29px]'
  };

  // Design-Varianten
  const variantStyles = {
    // Primärer Button (Gelb/Gold)
    primary: `
      bg-gradient-to-r from-[#F0B72F] to-[#e6a82a] 
      text-[#001E4A] border-[#F0B72F] border-2
      hover:from-[#e6a82a] hover:to-[#d99c28] 
      hover:shadow-lg hover:shadow-[#F0B72F]/25
      focus:ring-[#F0B72F]/50
    `,
    
    // Sekundärer Button (Outline)
    secondary: `
      bg-white text-[#001E4A] border-[#F0B72F] border-2
      hover:bg-[#F0B72F]/10 hover:border-[#e6a82a]
      hover:shadow-md focus:ring-[#F0B72F]/30
    `,
    
    // Dunkel/Admin Button
    dark: `
      bg-gradient-to-r from-[#001E4A] to-[#002654]
      text-[#F0B72F] border-[#001E4A] border-2
      hover:from-[#002654] hover:to-[#003064]
      hover:shadow-lg hover:shadow-[#001E4A]/30
      focus:ring-[#001E4A]/50
    `,
    
    // Success Button (Grün)
    success: `
      bg-gradient-to-r from-[#22c55e] to-[#16a34a]
      text-white border-[#22c55e] border-2
      hover:from-[#16a34a] hover:to-[#15803d]
      hover:shadow-lg hover:shadow-[#22c55e]/25
      focus:ring-[#22c55e]/50
    `,
    
    // Danger Button (Rot)
    danger: `
      bg-gradient-to-r from-[#dc2626] to-[#b91c1c]
      text-white border-[#dc2626] border-2
      hover:from-[#b91c1c] hover:to-[#991b1b]
      hover:shadow-lg hover:shadow-[#dc2626]/25
      focus:ring-[#dc2626]/50
    `,
    
    // Ghost Button (Transparent)
    ghost: `
      bg-transparent text-[#001E4A] border-transparent border-2
      hover:bg-[#E6E2DF]/10 hover:border-[#E6E2DF]
      focus:ring-[#001E4A]/20
    `,
    
    // Link Button (Minimal)
    link: `
      bg-transparent text-[#001E4A] border-transparent border-2
      hover:text-[#F0B72F] underline-offset-4 hover:underline
      focus:ring-[#F0B72F]/30 px-0
    `
  };

  // Toggle Button Spezial-Varianten für Sales/Service Toggle
  const toggleStyles = {
    active: `
      bg-[#F0B72F] text-[#001E4A] border-[#F0B72F] border-2
      shadow-md shadow-[#F0B72F]/20
    `,
    inactive: `
      bg-white text-[#001E4A]/70 border-[#E6E2DF] border-2
      hover:bg-[#E6E2DF]/10 hover:text-[#001E4A]
    `
  };

  // Wenn es ein Toggle Button ist
  if (variant === 'toggle-active' || variant === 'toggle-inactive') {
    const toggleStyle = variant === 'toggle-active' ? toggleStyles.active : toggleStyles.inactive;
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${sizeStyles[size]} ${toggleStyle} ${className}`}
        onClick={onClick}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        )}
        {icon && !loading && <span className="shrink-0">{icon}</span>}
        {children}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shimmer-Effekt für Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      {icon && !loading && <span className="shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
};

export default ModernButton; 