import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { City } from "../../../types/types";
import "./multi-select.css";

type CityMultiSelectProps = {
  cities: City[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
  placeholder?: string;
  onClear?: () => void;
};

type GroupedCities = {
  country: string;
  cities: Array<{
    key: string;
    label: string;
  }>;
};

export function CityMultiSelect({
  cities,
  selected,
  onChange,
  label,
  placeholder = "No filter selected",
  onClear,
}: CityMultiSelectProps) {
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [panelLeft, setPanelLeft] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const cityOptions = useMemo(
    () =>
      cities.map((city) => ({
        key: city.id.toString(),
        label: city.name,
        country: city.country,
      })),
    [cities],
  );

  const selectedItems = cityOptions.filter((city) =>
    selected.includes(city.key),
  );

  const groupedCities = useMemo<GroupedCities[]>(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const groups = new Map<string, Array<{ key: string; label: string }>>();

    cityOptions.forEach((city) => {
      const countryMatches = city.country
        .toLowerCase()
        .includes(normalizedSearch);
      const cityMatches = city.label.toLowerCase().includes(normalizedSearch);

      if (normalizedSearch && !countryMatches && !cityMatches) {
        return;
      }

      const existingGroup = groups.get(city.country) || [];
      existingGroup.push({ key: city.key, label: city.label });
      groups.set(city.country, existingGroup);
    });

    return Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([country, grouped]) => ({
        country,
        cities: grouped.sort((left, right) =>
          left.label.localeCompare(right.label),
        ),
      }));
  }, [cityOptions, searchText]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setIsOpen(true);
  };

  const handleSelectOption = (key: string) => {
    if (!selected.includes(key)) {
      onChange([...selected, key]);
    }
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const filterSection = wrapperRef.current?.closest(".filter-section");

      if (
        filterSection?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePanelPosition = () => {
      if (window.innerWidth <= 768) {
        setPanelLeft(0);
        return;
      }

      const filtersWrapper = wrapperRef.current?.closest(
        ".map-filters-wrapper",
      );
      const nextPanelLeft = filtersWrapper
        ? Math.round(filtersWrapper.getBoundingClientRect().right)
        : 0;

      setPanelLeft(nextPanelLeft);
    };

    const previousOverflow = document.body.style.overflow;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    updatePanelPosition();
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePanelPosition);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePanelPosition);
    };
  }, [isOpen]);

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
      <div
        className="multi-select-wrapper"
        ref={wrapperRef}
        onClick={() => setIsOpen(true)}
      >
        <div className="multi-select-content">
          {selectedItems.length === 0 && (
            <input
              id={`select-${label}`}
              type="text"
              value={searchText}
              onChange={handleSearch}
              placeholder={placeholder}
              className="multi-select-input"
              readOnly
            />
          )}
          {selectedItems.length > 0 && (
            <div className="selected-items-display">
              {selectedItems.map(({ key, label: value }) => (
                <div key={key} className="item-tag">
                  <span>{value}</span>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      removeItem(key);
                    }}
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
            className="city-multi-select-overlay"
            style={{ left: `${panelLeft}px` }}
            onMouseDown={() => setIsOpen(false)}
          >
            <div
              ref={panelRef}
              className="city-multi-select-panel"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="selected-items-header city-multi-select-header">
                <button
                  type="button"
                  className="city-multi-select-close"
                  aria-label="Close city selector"
                  onClick={() => setIsOpen(false)}
                >
                  ×
                </button>
                <div className="label">{label}</div>
                <input
                  id={`select-${label}`}
                  type="text"
                  value={searchText}
                  onChange={handleSearch}
                  placeholder="Search..."
                  className="selected-items-input"
                  autoFocus
                />
              </div>
              <div className="city-multi-select-groups">
                {groupedCities.map((group) => (
                  <div key={group.country} className="city-group-flow">
                    <div className="city-group-country">{group.country}</div>
                    <div className="city-group-items">
                      {group.cities.map((city) => {
                        const isSelected = selected.includes(city.key);

                        return (
                          <button
                            key={city.key}
                            type="button"
                            className={`city-chip ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              if (isSelected) {
                                removeItem(city.key);
                                return;
                              }

                              handleSelectOption(city.key);
                            }}
                          >
                            <span>{city.label}</span>
                            {isSelected && (
                              <span className="selected-tick">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {groupedCities.length === 0 && (
                  <div className="city-multi-select-empty">
                    No matches found.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
