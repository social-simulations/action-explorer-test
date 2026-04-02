import { useState, useEffect } from "react";
import "./rangeFilter.css";

type RangeFilterProps = {
  label: string;
  minValue: number;
  maxValue: number;
  onRangeChange: (min: number, max: number) => void;
  maxLimit?: number;
  defaultMinValue?: number;
  defaultMaxValue?: number;
  onClear?: () => void;
};

export function RangeFilter({
  label,
  minValue,
  maxValue,
  onRangeChange,
  maxLimit = 100,
  defaultMinValue = 0,
  defaultMaxValue = maxLimit,
  onClear,
}: RangeFilterProps) {
  const [min, setMin] = useState(minValue);
  const [max, setMax] = useState(maxValue);

  // Sync props to state when they change
  useEffect(() => {
    setMin(minValue);
    setMax(maxValue);
  }, [minValue, maxValue]);

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, max);
    setMin(newMin);
    onRangeChange(newMin, max);
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, min);
    setMax(newMax);
    onRangeChange(min, newMax);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    handleMinChange(value);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(maxLimit, parseInt(e.target.value) || maxLimit);
    handleMaxChange(value);
  };

  const handleClear = () => {
    setMin(defaultMinValue);
    setMax(defaultMaxValue);
    onRangeChange(defaultMinValue, defaultMaxValue);
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="range-filter">
      <div className="range-filter-header">
        <label>{label}</label>
      </div>

      <div className="range-filter-slider">
        <div className="range-filter-track">
          <div className="range-filter-track-background" />
          <div
            className="range-filter-track-fill"
            style={{
              left: `${(min / maxLimit) * 100}%`,
              right: `${100 - (max / maxLimit) * 100}%`,
            }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={maxLimit}
          value={min}
          onChange={(e) => handleMinChange(parseInt(e.target.value))}
          className="range-input range-input-min"
        />
        <input
          type="range"
          min="0"
          max={maxLimit}
          value={max}
          onChange={(e) => handleMaxChange(parseInt(e.target.value))}
          className="range-input range-input-max"
        />
      </div>

      <div className="range-filter-inputs">
        <input
          type="number"
          min="0"
          max={maxLimit}
          value={min}
          onChange={handleMinInputChange}
          className="number-input"
        />
        <span className="range-dash">—</span>
        <input
          type="number"
          min="0"
          max={maxLimit}
          value={max}
          onChange={handleMaxInputChange}
          className="number-input"
        />
        {onClear && (
          <button onClick={handleClear} className="clear-button">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
