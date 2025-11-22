import React, { useState, useEffect } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
  disabled = false,
}: SliderProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(parseFloat(e.target.value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="slider-control">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">{formatValue(localValue)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onInput={handleInput}
        onChange={handleChange}
        disabled={disabled}
        className="slider"
      />
    </div>
  );
}
