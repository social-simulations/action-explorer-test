import React, { useState } from "react";
import "./text-filter.css";

type TextFilterProps = {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  label?: string;
  placeholder?: string;
};

export function TextFilter({
  keywords,
  onChange,
  label = "Keywords",
  placeholder = "Type...",
}: TextFilterProps) {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      onChange([...keywords, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeKeyword = (indexToRemove: number) => {
    onChange(keywords.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="filter-section">
      <label className="filter-section-label">
        <span>{label}</span>
      </label>
      <div className="text-filter-wrapper">
        <div className="text-filter-content">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="text-filter-input"
          />
          {keywords.length > 0 && (
            <div className="text-filter-tags">
              {keywords.map((keyword, index) => (
                <div key={index} className="text-filter-tag">
                  <span>{keyword}</span>
                  <button
                    className="text-filter-remove-btn"
                    onClick={() => removeKeyword(index)}
                    aria-label={`Remove ${keyword}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
