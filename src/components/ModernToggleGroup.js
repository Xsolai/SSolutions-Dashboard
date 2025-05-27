import React from 'react';
import ModernButton from './ModernButton';

/**
 * Moderne Toggle-Button-Group für Vertrieb/Service/Alle Filter
 */
const ModernToggleGroup = ({ 
  value, 
  onChange, 
  options = [
    { value: null, label: 'Alle' },
    { value: 'Sales', label: 'Vertrieb' }, 
    { value: 'Service', label: 'Service' }
  ],
  className = '',
  disabled = false
}) => {
  
  return (
    <div className={`flex justify-end ${className}`}>
      <div 
        className="inline-flex rounded-2xl bg-transparent p-1 gap-1" 
        role="group"
      >
        {options.map((option, index) => (
          <ModernButton
            key={option.value || 'all'}
            variant={value === option.value ? "toggle-active" : "toggle-inactive"}
            size="small"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className="border-0 rounded-xl"
          >
            {option.label}
          </ModernButton>
        ))}
      </div>
    </div>
  );
};

export default ModernToggleGroup; 