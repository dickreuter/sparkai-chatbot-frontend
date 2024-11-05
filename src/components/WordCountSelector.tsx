import React, { useState } from 'react';

const WordCountSelector = ({ subheadingId, initialCount = 250, onChange, disabled = false }) => {
  return (
    <div className="word-count-selector mt-2">
      <span className="text-muted me-2">Target Word Count:</span>
      <input
        type="number"
        className="form-control d-inline-block"
        style={{ width: '100px' }}
        value={initialCount}
        onChange={(e) => onChange(subheadingId, parseInt(e.target.value, 10))}
        min={1}
        disabled={disabled}
      />
    </div>
  );
};

export default WordCountSelector;