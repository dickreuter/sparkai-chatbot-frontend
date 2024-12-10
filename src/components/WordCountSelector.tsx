import React, { useState, useEffect } from "react";
import "./WordCountSelector.css";

const WordCountSelector = ({
  subheadingId,
  initialCount = 100,
  onChange,
  disabled = false
}) => {
  // Add local state to track the input value
  const [count, setCount] = useState(initialCount);

  // Update local state when prop changes
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  // Handle input changes
  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    setCount(newValue); // Update local state immediately
    onChange(subheadingId, newValue); // Notify parent
  };

  return (
    <div className="word-count-selector d-flex align-items-center">
      <span className="word-count-text">Target Word Count:</span>
      <input
        type="number"
        className="form-control d-inline-block word-count-input ms-3"
        value={count}
        onChange={handleChange}
        min={1}
        disabled={disabled}
      />
    </div>
  );
};

export default WordCountSelector;
