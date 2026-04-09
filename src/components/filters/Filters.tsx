import { useState, useEffect } from "react";
import { MultiSelect } from "./inputs/MultiSelect";
import { RangeFilter } from "./inputs/RangeFilter";
import "./filters.css";
import { ActionArea, Country } from "../../enums";

type FiltersProps = {
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  selectedAreas: string[];
  onAreasChange: (areas: string[]) => void;
  investmentCost?: [number, number];
  onInvestmentCostChange?: (min: number, max: number) => void;
  operationalCostPerYear?: [number, number];
  onOperationalCostPerYearChange?: (min: number, max: number) => void;
  maxInvestmentCost?: number;
  maxOperationalCostPerYear?: number;
};

export function Filters({
  selectedCountries,
  onCountriesChange,
  selectedAreas,
  onAreasChange,
  investmentCost = [0, 100],
  onInvestmentCostChange,
  operationalCostPerYear = [0, 100],
  onOperationalCostPerYearChange,
  maxInvestmentCost = 1000000,
  maxOperationalCostPerYear = 50000,
}: FiltersProps) {
  const countryEntries = Object.entries(Country);
  const areaEntries = Object.entries(ActionArea);
  const [investCost, setInvestCost] = useState(investmentCost);
  const [operatingCostPerYear, setOperatingCostPerYear] = useState(
    operationalCostPerYear,
  );

  // Sync state with prop changes from parent
  useEffect(() => {
    setInvestCost(investmentCost);
  }, [investmentCost]);

  useEffect(() => {
    setOperatingCostPerYear(operationalCostPerYear);
  }, [operationalCostPerYear]);

  const handleInvestmentCostChange = (min: number, max: number) => {
    setInvestCost([min, max]);
    onInvestmentCostChange?.(min, max);
  };

  const handleOperationalCostPerYearChange = (min: number, max: number) => {
    setOperatingCostPerYear([min, max]);
    onOperationalCostPerYearChange?.(min, max);
  };

  const handleClearInvestmentCost = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("investmentCost");
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params}`,
    );
  };

  const handleClearOperationalCost = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("operationalCostPerYear");
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params}`,
    );
  };

  const handleClearAllFilters = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("countries");
    params.delete("areas");
    params.delete("investmentCost");
    params.delete("operationalCostPerYear");
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params}`,
    );
    // Also update the component state and parent callbacks
    onCountriesChange([]);
    onAreasChange([]);
    onInvestmentCostChange?.(0, maxInvestmentCost);
    onOperationalCostPerYearChange?.(0, maxOperationalCostPerYear);
  };

  return (
    <div className="filters-container">
      <MultiSelect
        options={countryEntries}
        selected={selectedCountries}
        onChange={onCountriesChange}
        label="Filter by Country"
        placeholder="Select a country..."
      />
      <MultiSelect
        options={areaEntries}
        selected={selectedAreas}
        onChange={onAreasChange}
        label="Filter by Action Area"
        placeholder="Select an action area..."
      />
      <RangeFilter
        label="Investment cost"
        minValue={investCost[0]}
        maxValue={investCost[1]}
        maxLimit={maxInvestmentCost}
        defaultMinValue={0}
        defaultMaxValue={maxInvestmentCost}
        onRangeChange={handleInvestmentCostChange}
        onClear={handleClearInvestmentCost}
      />
      <RangeFilter
        label="Operational cost/year"
        minValue={operatingCostPerYear[0]}
        maxValue={operatingCostPerYear[1]}
        maxLimit={maxOperationalCostPerYear}
        defaultMinValue={0}
        defaultMaxValue={maxOperationalCostPerYear}
        onRangeChange={handleOperationalCostPerYearChange}
        onClear={handleClearOperationalCost}
      />
      <button
        className="clear-all-filters-button"
        onClick={handleClearAllFilters}
      >
        Clear filters
      </button>
    </div>
  );
}
