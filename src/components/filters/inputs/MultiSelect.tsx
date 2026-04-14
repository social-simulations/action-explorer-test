import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [actualMenuHeight, setActualMenuHeight] = useState(300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      const target = event.target as Node;
      const filterSection = wrapperRef.current?.closest(".filter-section");
      if (filterSection && !filterSection.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Measure actual dropdown height after render
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        setActualMenuHeight(dropdownRef.current?.offsetHeight || 300);
      });
      resizeObserver.observe(dropdownRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isOpen]);

  // Calculate dropdown position when opening or when actual height changes
  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const filterSection = wrapperRef.current.closest(".filter-section");
      if (filterSection) {
        const rect = filterSection.getBoundingClientRect();
        let top = Math.round(rect.top);
        const left = Math.round(rect.right + 8);

        // Check if menu would go off bottom of screen using actual height
        const padding = 8; // margin from screen bottom
        if (top + actualMenuHeight > window.innerHeight - padding) {
          // Adjust top so menu bottom has padding from screen bottom
          top = window.innerHeight - actualMenuHeight - padding;
        }

        setDropdownStyle({ top: Math.max(0, top), left });
      }
    }
  }, [isOpen, actualMenuHeight]);

  const selectedItems = options
    .filter(([key, _]) => selected.includes(key))
    .map(([key, value]) => ({ key, value }));

  return (
    <div className="filter-section">
      <label
        htmlFor={`select-${label}`}
        className="filter-section-label"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <span>{label}</span>
        <span className={`label-chevron ${isOpen ? "open" : ""}`}>›</span>
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
      </div>
      {selected.length > 0 && (
        <button onClick={handleClear} className="clear-button">
          Clear
        </button>
      )}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="selected-items"
            style={{
              top: `${dropdownStyle.top}px`,
              left: `${dropdownStyle.left}px`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
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
              <div className="selected-items-options">
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
                      <span>{value}</span>
                      {selected.includes(key) && (
                        <span className="selected-tick">✓</span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
