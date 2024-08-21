import React, { useRef, useState, useEffect } from 'react';

const CustomDateInput = ({ value, onChange, disabled }) => {
  const dateInputRef = useRef(null);
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setDisplayValue(formatDate(date));
      }
    }
  }, [value]);

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleIconClick = (e) => {
    e.preventDefault();
    dateInputRef.current.showPicker();
  };

  const handleDateChange = (e) => {
    const newValue = e.target.value; // This will be in YYYY-MM-DD format
    const date = new Date(newValue);
    if (!isNaN(date.getTime())) {
      setDisplayValue(formatDate(date));
      onChange(newValue); // Keep the onChange value in YYYY-MM-DD format
    }
  };

  return (
    <div className="custom-date-input">
      <input
        type="text"
        value={displayValue}
        readOnly
        disabled={disabled}
        className="form-control date-input date-textarea"
        onClick={handleIconClick}
      />
      <input
        ref={dateInputRef}
        type="date"
        value={value || ''}
        onChange={handleDateChange}
        disabled={disabled}
        className="hidden-date-input"
      />
      <i className="fas fa-calendar-alt calendar-icon" onClick={handleIconClick}></i>
     
      <style jsx>{`
        .custom-date-input {
          position: relative;
          display: inline-block;
          width: 100%;
        }
        .calendar-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          color: #6c757d;
          z-index: 1;
        }
        .date-input {
          padding-right: 30px;
          width: 100%;
          cursor: pointer;
        }
        .hidden-date-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default CustomDateInput;