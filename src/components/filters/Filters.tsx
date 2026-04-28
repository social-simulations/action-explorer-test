import { useState, useEffect } from "react";
import { City, Tag, ThematicArea } from "../../types/types";
import { CityMultiSelect } from "./inputs/CityMultiSelect";
import { MultiSelect } from "./inputs/MultiSelect";
import { RangeFilter } from "./inputs/RangeFilter";
import { TextFilter } from "./inputs/TextFilter";
import { Country } from "../../enums";
import "./filters.css";

type FiltersProps = {
  cities: City[];
  tags: Tag[];
  thematicAreas: ThematicArea[];
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedAreas: string[];
  onAreasChange: (areas: string[]) => void;
  selectedLevers: string[];
  onLeversChange: (levers: string[]) => void;
  keywords?: string[];
  onKeywordsChange?: (keywords: string[]) => void;
  searchInNames?: boolean;
  onSearchInNamesChange?: (value: boolean) => void;
  searchInSummaries?: boolean;
  onSearchInSummariesChange?: (value: boolean) => void;
  investmentCost?: [number, number];
  onInvestmentCostChange?: (min: number, max: number) => void;
  operationalCostPerYear?: [number, number];
  onOperationalCostPerYearChange?: (min: number, max: number) => void;
  maxInvestmentCost?: number;
  maxOperationalCostPerYear?: number;
};

export function Filters({
  cities,
  tags,
  thematicAreas,
  selectedCountries,
  onCountriesChange,
  selectedCities,
  onCitiesChange,
  selectedTags,
  onTagsChange,
  selectedAreas,
  onAreasChange,
  selectedLevers,
  onLeversChange,
  keywords = [],
  onKeywordsChange,
  searchInNames = true,
  onSearchInNamesChange,
  searchInSummaries = true,
  onSearchInSummariesChange,
  investmentCost = [0, 100],
  onInvestmentCostChange,
  operationalCostPerYear = [0, 100],
  onOperationalCostPerYearChange,
  maxInvestmentCost = 1000000,
  maxOperationalCostPerYear = 50000,
}: FiltersProps) {
  const countryEntries = Object.entries(Country);
  const tagEntries = tags.map(
    (tag) => [tag.id.toString(), tag.name] as [string, string],
  );
  const areaEntries = thematicAreas.map(
    (area) => [area.id.toString(), area.name] as [string, string],
  );
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

  const handleClearKeywords = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("keywords");
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params}`,
    );
  };

  const handleClearAllFilters = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("countries");
    params.delete("cities");
    params.delete("tags");
    params.delete("areas");
    params.delete("levers");
    params.delete("keywords");
    params.delete("investmentCost");
    params.delete("operationalCostPerYear");
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params}`,
    );
    // Also update the component state and parent callbacks
    onCountriesChange([]);
    onCitiesChange([]);
    onTagsChange([]);
    onAreasChange([]);
    onLeversChange([]);
    onKeywordsChange?.([]);
    onInvestmentCostChange?.(0, maxInvestmentCost);
    onOperationalCostPerYearChange?.(0, maxOperationalCostPerYear);
  };

  return (
    <div className="filters-wrapper">
      <div className="filters-header">
        <h2 className="filters-title">Filters</h2>
        <button className="clear-all-button" onClick={handleClearAllFilters}>
          Clear all
        </button>
      </div>
      <div className="filters-container">
        <TextFilter
          keywords={keywords}
          onChange={onKeywordsChange || (() => {})}
          onClear={handleClearKeywords}
          searchInNames={searchInNames}
          onSearchInNamesChange={onSearchInNamesChange}
          searchInSummaries={searchInSummaries}
          onSearchInSummariesChange={onSearchInSummariesChange}
          label="Keywords"
          placeholder="Type..."
        />
        <MultiSelect
          options={countryEntries}
          selected={selectedCountries}
          onChange={onCountriesChange}
          label="Country"
        />
        <CityMultiSelect
          cities={cities}
          selected={selectedCities}
          onChange={onCitiesChange}
          label="City"
        />
        <div className="filters-divider"></div>
        <MultiSelect
          options={tagEntries}
          selected={selectedTags}
          onChange={onTagsChange}
          label="Thematic Tag"
        />
        <MultiSelect
          options={areaEntries}
          selected={selectedAreas}
          onChange={onAreasChange}
          label="Field of Action"
        />
        <MultiSelect
          options={areaEntries}
          selected={selectedLevers}
          onChange={onLeversChange}
          label="Systemic Lever"
        />
        <div className="filters-divider"></div>
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
      </div>
    </div>
  );
}
