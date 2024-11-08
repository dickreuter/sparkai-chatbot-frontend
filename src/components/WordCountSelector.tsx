import React, { useState } from 'react';
import './WordCountSelector.css'
const WordCountSelector = ({ subheadingId, initialCount = 250, onChange, disabled = false }) => {
  return (
    <div className="word-count-selector d-flex align-items-center">
      <span className="text-muted">Target Word Count:</span>
      <input
        type="number"
        className="form-control d-inline-block word-count-input"
        value={initialCount}
        onChange={(e) => onChange(subheadingId, parseInt(e.target.value, 10))}
        min={1}
        disabled={disabled}
      />
    </div>
  );
};

export default WordCountSelector;