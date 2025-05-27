import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Moderne Input-Komponente 
 * Behält alle Funktionalitäten bei, modernisiert nur das Design
 */
const ModernInput = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  icon = null,
  className = '',
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const baseInputStyles = `
    w-full px-4 py-3 font-nexa-book text-[17px] leading-[27px] 
    text-[#001E4A] placeholder-[#001E4A]/50
    bg-white border-2 rounded-xl
    transition-all duration-300 ease-out
    focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed
    disabled:bg-[#E6E2DF]/20
  `;

  const borderStyles = error 
    ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-4 focus:ring-[#dc2626]/10'
    : isFocused
    ? 'border-[#F0B72F] focus:ring-4 focus:ring-[#F0B72F]/10'
    : 'border-[#E6E2DF] hover:border-[#F0B72F]/50';

  const iconPadding = icon ? 'pl-12' : '';
  const passwordPadding = isPassword ? 'pr-12' : '';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-[17px] leading-[27px] font-nexa-black text-[#001E4A]">
          {label}
          {required && <span className="text-[#dc2626] ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <div className="text-[#001E4A]/50 w-5 h-5">
              {icon}
            </div>
          </div>
        )}

        {/* Input Field */}
        <motion.input
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            ${baseInputStyles} 
            ${borderStyles} 
            ${iconPadding} 
            ${passwordPadding}
          `}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 
                     text-[#001E4A]/50 hover:text-[#001E4A] 
                     transition-colors duration-200 z-10"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Focus Ring Effect */}
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-[#F0B72F] pointer-events-none"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1.02, opacity: 1 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[14px] font-nexa-book text-[#dc2626] flex items-center gap-1"
        >
          <span className="w-4 h-4 text-[#dc2626]">⚠</span>
          {error}
        </motion.p>
      )}
    </div>
  );
};

/**
 * Moderne Textarea-Komponente
 */
const ModernTextarea = ({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  rows = 4,
  className = '',
  required = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const baseTextareaStyles = `
    w-full px-4 py-3 font-nexa-book text-[17px] leading-[27px] 
    text-[#001E4A] placeholder-[#001E4A]/50
    bg-white border-2 rounded-xl resize-none
    transition-all duration-300 ease-out
    focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed
    disabled:bg-[#E6E2DF]/20
  `;

  const borderStyles = error 
    ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-4 focus:ring-[#dc2626]/10'
    : isFocused
    ? 'border-[#F0B72F] focus:ring-4 focus:ring-[#F0B72F]/10'
    : 'border-[#E6E2DF] hover:border-[#F0B72F]/50';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-[17px] leading-[27px] font-nexa-black text-[#001E4A]">
          {label}
          {required && <span className="text-[#dc2626] ml-1">*</span>}
        </label>
      )}

      {/* Textarea Container */}
      <div className="relative">
        <motion.textarea
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`${baseTextareaStyles} ${borderStyles}`}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />

        {/* Focus Ring Effect */}
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-[#F0B72F] pointer-events-none"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1.02, opacity: 1 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[14px] font-nexa-book text-[#dc2626] flex items-center gap-1"
        >
          <span className="w-4 h-4 text-[#dc2626]">⚠</span>
          {error}
        </motion.p>
      )}
    </div>
  );
};

/**
 * Moderne Select-Komponente
 */
const ModernSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Bitte auswählen...",
  error,
  disabled = false,
  className = '',
  required = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const baseSelectStyles = `
    w-full px-4 py-3 font-nexa-book text-[17px] leading-[27px] 
    text-[#001E4A] bg-white border-2 rounded-xl
    transition-all duration-300 ease-out appearance-none
    focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed
    disabled:bg-[#E6E2DF]/20 cursor-pointer
  `;

  const borderStyles = error 
    ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-4 focus:ring-[#dc2626]/10'
    : isFocused
    ? 'border-[#F0B72F] focus:ring-4 focus:ring-[#F0B72F]/10'
    : 'border-[#E6E2DF] hover:border-[#F0B72F]/50';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-[17px] leading-[27px] font-nexa-black text-[#001E4A]">
          {label}
          {required && <span className="text-[#dc2626] ml-1">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        <motion.select
          value={value}
          onChange={onChange}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          className={`${baseSelectStyles} ${borderStyles} pr-12`}
          whileFocus={{ scale: 1.01 }}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </motion.select>

        {/* Dropdown Arrow */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-[#001E4A]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Focus Ring Effect */}
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-[#F0B72F] pointer-events-none"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1.02, opacity: 1 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[14px] font-nexa-book text-[#dc2626] flex items-center gap-1"
        >
          <span className="w-4 h-4 text-[#dc2626]">⚠</span>
          {error}
        </motion.p>
      )}
    </div>
  );
};

export { ModernInput, ModernTextarea, ModernSelect };
export default ModernInput; 