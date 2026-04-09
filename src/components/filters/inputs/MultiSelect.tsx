import React, { useState, useRef, useEffect } from "react";

type MultiSelectProps = {
  options: Array<[string, string]>;
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
  placeholder?: string;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  label,
  placeholder = "No filter selected",
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
    setIsOpen(false);
  };

  const removeItem = (itemKey: string) => {
    onChange(selected.filter((item) => item !== itemKey));
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
      <label htmlFor={`select-${label}`} className="filter-section-label">
        <span>{label}</span>
        <span className="label-chevron">›</span>
      </label>
      <div className="multi-select-wrapper" ref={wrapperRef}>
        <div className="multi-select-content">
          <input
            id={`select-${label}`}
            type="text"
            value={searchText}
            onChange={handleSearch}
            onFocus={() => setIsOpen(true)}
            placeholder={selectedItems.length === 0 ? placeholder : ""}
            className="multi-select-input"
          />
          {selectedItems.length > 0 && (
            <div className="selected-items">
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
        {isOpen && filteredOptions.length > 0 && (
          <div className="multi-select-dropdown">
            {filteredOptions.map(([key, value]) => (
              <div
                key={key}
                className="multi-select-option"
                onClick={() => handleSelectOption(key)}
              >
                {value}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
