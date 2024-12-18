import React, { useEffect, useRef, useState } from 'react';

interface DebouncedTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;  // Add className prop
  disabled?: boolean;  // Optional disabled prop for more flexibility
  style?: React.CSSProperties;  // Optional inline styles
}

const DebouncedTextArea: React.FC<DebouncedTextAreaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',  // Default to empty string if not provided
  disabled = false,
  style
}) => {
  const [localValue, setLocalValue] = useState(value || "");
  const debouncedCallback = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (debouncedCallback.current) {
      clearTimeout(debouncedCallback.current);
    }

    debouncedCallback.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  return (
    <textarea
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      style={style}
    />
  );
};

export default DebouncedTextArea;