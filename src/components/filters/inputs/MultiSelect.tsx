import React, { useState, useRef, useEffect } from "react";
import "./multi-select.css";

type MultiSelectProps = {
  options: Array<[string, string]>;
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
  placeholder?: string;
  onClear?: () => void;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  label,
  placeholder = "No filter selected",
  onClear,
}: MultiSelectProps) {
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setIsOpen(true);
  };

  const handleSelectOption = (key: string) => {
    if (!selected.includes(key)) {
      onChange([...selected, key]);
    }
    setSearchText("");
  };

  const removeItem = (itemKey: string) => {
    onChange(selected.filter((item) => item !== itemKey));
  };

  const handleClear = () => {
    onChange([]);
    if (onClear) {
      onClear();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedItems = options
    .filter(([key, _]) => selected.includes(key))
    .map(([key, value]) => ({ key, value }));

  const filteredOptions = options.filter(
    ([key, value]) =>
      !selected.includes(key) &&
      value.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="filter-section">
      <label
        htmlFor={`select-${label}`}
        className="filter-section-label"
        onClick={() => setIsOpen(true)}
      >
        <span>{label}</span>
        <span className="label-chevron">›</span>
      </label>
      <div className="multi-select-wrapper" ref={wrapperRef}>
        <div className="multi-select-content">
          {selectedItems.length === 0 && (
            <input
              id={`select-${label}`}
              type="text"
              value={searchText}
              onChange={handleSearch}
              placeholder={placeholder}
              className="multi-select-input"
            />
          )}
          {selectedItems.length > 0 && (
            <div className="selected-items-display">
              {selectedItems.map(({ key, value }) => (
                <div key={key} className="item-tag">
                  <span>{value}</span>
                  <button
                    onClick={() => removeItem(key)}
                    className="remove-btn"
                    aria-label={`Remove ${value}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {isOpen && (
          <div
            className={
              selectedItems.length > 0
                ? "selected-items"
                : "multi-select-dropdown"
            }
          >
            <div className="selected-items-header">
              <div className="label">{label}</div>
              <input
                id={`select-${label}`}
                type="text"
                value={searchText}
                onChange={handleSearch}
                placeholder="Search..."
                className="selected-items-input"
              />
            </div>
            {options.filter(([_, value]) =>
              value.toLowerCase().includes(searchText.toLowerCase()),
            ).length > 0 && (
              <div
                className={
                  selectedItems.length > 0 ? "selected-items-options" : ""
                }
              >
                {options
                  .filter(([_, value]) =>
                    value.toLowerCase().includes(searchText.toLowerCase()),
                  )
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className={
                        selectedItems.length > 0
                          ? `selected-items-option ${
                              selected.includes(key) ? "selected" : ""
                            }`
                          : "multi-select-option"
                      }
                      onClick={() => {
                        if (selected.includes(key)) {
                          removeItem(key);
                        } else {
                          handleSelectOption(key);
                        }
                      }}
                    >
                      {value}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <button onClick={handleClear} className="clear-button">
          Clear
        </button>
      )}
    </div>
  );
}
