import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";
import { Action, City, Tag, ThematicArea } from "../types/types";
import { ActionList } from "./list/ActionList";
import { createColorScaleModel } from "../utils/colorScale";
import { Country } from "../enums/enums";
import { Filters } from "./filters";
import { ActionDetails } from "./details";

type Props = {
  cities?: City[];
  actions?: Action[];
  tags?: Tag[];
  thematicAreas?: ThematicArea[];
};

export function Map({
  cities = [],
  actions = [],
  tags = [],
  thematicAreas = [],
}: Props) {
  const getGhgReductionValue = (action: Action): number => {
    const raw = action.ghgReductionBy2030;

    if (typeof raw === "number" && Number.isFinite(raw)) {
      return raw;
    }

    if (typeof raw === "string") {
      const normalized = raw.replace(/,/g, ".").replace(/[^0-9.-]/g, "");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  };

  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showZoomHint, setShowZoomHint] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedLevers, setSelectedLevers] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [searchInNames, setSearchInNames] = useState(true);
  const [searchInSummaries, setSearchInSummaries] = useState(true);
  const [investmentCostRange, setInvestmentCostRange] = useState<
    [number, number]
  >([0, 992565]);
  const [operationalCostPerYearRange, setOperationalCostPerYearRange] =
    useState<[number, number]>([0, 49566]);
  const [ghgReductionBy2030Range, setGhgReductionBy2030Range] = useState<
    [number, number]
  >([0, 100]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate max values for investment cost and operational cost per year
  const maxValues = useMemo(() => {
    if (actions.length === 0)
      return {
        maxInvestmentCost: 992565,
        maxOperationalCost: 49566,
        maxGhgReductionBy2030: 100,
      };
    const maxInvestmentCost = Math.max(
      ...actions.map((a) => a.investmentCost || 0),
    );
    const maxOperationalCost = Math.max(
      ...actions.map((a) => a.operationalCostPerYear || 0),
    );
    const maxGhgReductionBy2030 = Math.max(
      ...actions.map((action) => getGhgReductionValue(action)),
    );
    return { maxInvestmentCost, maxOperationalCost, maxGhgReductionBy2030 };
  }, [actions]);

  // Initialize state from query params on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const countriesParam = params.get("countries");
    const citiesParam = params.get("cities");
    const tagsParam = params.get("tags");
    const areasParam = params.get("areas");
    const leversParam = params.get("levers");
    const keywordsParam = params.get("keywords");
    const searchInNamesParam = params.get("searchInNames");
    const searchInSummariesParam = params.get("searchInSummaries");
    const investmentCostParam = params.get("investmentCost");
    const operationalCostParam = params.get("operationalCostPerYear");
    const ghgReductionParam = params.get("ghgReductionBy2030");
    const viewParam = params.get("view");
    const actionIdParam = params.get("actionId");

    if (countriesParam) {
      setSelectedCountries(countriesParam.split(","));
    }
    if (citiesParam) {
      setSelectedCities(citiesParam.split(","));
    }
    if (tagsParam) {
      setSelectedTags(tagsParam.split(","));
    }
    if (areasParam) {
      setSelectedAreas(areasParam.split(","));
    }
    if (leversParam) {
      setSelectedLevers(leversParam.split(","));
    }
    if (keywordsParam) {
      setKeywords(keywordsParam.split(","));
    }
    if (searchInNamesParam !== null) {
      setSearchInNames(searchInNamesParam === "true");
    }
    if (searchInSummariesParam !== null) {
      setSearchInSummaries(searchInSummariesParam === "true");
    }
    // If view=list, show list; otherwise (view=map or no view param), show map
    setView(viewParam === "list" ? "list" : "map");

    if (actionIdParam) {
      setSelectedActionId(actionIdParam);
    }

    // Initialize cost ranges from query params if present
    if (investmentCostParam) {
      const [min, max] = investmentCostParam.split(",").map(Number);
      setInvestmentCostRange([min, max]);
    }

    if (operationalCostParam) {
      const [min, max] = operationalCostParam.split(",").map(Number);
      setOperationalCostPerYearRange([min, max]);
    }

    if (ghgReductionParam) {
      const [min, max] = ghgReductionParam.split(",").map(Number);
      setGhgReductionBy2030Range([min, max]);
    }

    setIsInitialized(true);
  }, []);

  // Update cost range defaults based on calculated maxValues (only if not set from query params)
  useEffect(() => {
    if (!isInitialized) return;

    // Only set default max values if they weren't explicitly set from query params
    const params = new URLSearchParams(window.location.search);

    if (!params.get("investmentCost")) {
      setInvestmentCostRange([0, maxValues.maxInvestmentCost]);
    }

    if (!params.get("operationalCostPerYear")) {
      setOperationalCostPerYearRange([0, maxValues.maxOperationalCost]);
    }

    if (!params.get("ghgReductionBy2030")) {
      setGhgReductionBy2030Range([0, maxValues.maxGhgReductionBy2030]);
    }
  }, [maxValues, isInitialized]);

  // Update query params when selections change
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();
    if (selectedCountries.length > 0) {
      params.set("countries", selectedCountries.join(","));
    }
    if (selectedCities.length > 0) {
      params.set("cities", selectedCities.join(","));
    }
    if (selectedTags.length > 0) {
      params.set("tags", selectedTags.join(","));
    }
    if (selectedAreas.length > 0) {
      params.set("areas", selectedAreas.join(","));
    }
    if (selectedLevers.length > 0) {
      params.set("levers", selectedLevers.join(","));
    }
    if (keywords.length > 0) {
      params.set("keywords", keywords.join(","));
    }
    if (!searchInNames || !searchInSummaries) {
      params.set("searchInNames", String(searchInNames));
      params.set("searchInSummaries", String(searchInSummaries));
    }
    if (
      investmentCostRange[0] !== 0 ||
      investmentCostRange[1] !== maxValues.maxInvestmentCost
    ) {
      params.set(
        "investmentCost",
        `${investmentCostRange[0]},${investmentCostRange[1]}`,
      );
    }
    if (
      operationalCostPerYearRange[0] !== 0 ||
      operationalCostPerYearRange[1] !== maxValues.maxOperationalCost
    ) {
      params.set(
        "operationalCostPerYear",
        `${operationalCostPerYearRange[0]},${operationalCostPerYearRange[1]}`,
      );
    }
    if (
      ghgReductionBy2030Range[0] !== 0 ||
      ghgReductionBy2030Range[1] !== maxValues.maxGhgReductionBy2030
    ) {
      params.set(
        "ghgReductionBy2030",
        `${ghgReductionBy2030Range[0]},${ghgReductionBy2030Range[1]}`,
      );
    }
    if (view !== "map") {
      params.set("view", view);
    }

    const queryString = params.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [
    selectedCountries,
    selectedCities,
    selectedTags,
    selectedAreas,
    selectedLevers,
    keywords,
    searchInNames,
    searchInSummaries,
    investmentCostRange,
    operationalCostPerYearRange,
    ghgReductionBy2030Range,
    isInitialized,
    maxValues,
    view,
  ]);

  // Calculate action counts per city based on selected countries and areas
  const getActionCountForCity = useCallback(
    (cityId: string | number) => {
      if (
        selectedCities.length > 0 &&
        !selectedCities.includes(cityId.toString())
      ) {
        return 0;
      }

      let filtered = actions.filter((action) => action.cityId === cityId);

      if (selectedCountries.length > 0) {
        const selectedCountryValues = selectedCountries.map(
          (key) => Country[key as keyof typeof Country],
        ) as string[];
        filtered = filtered.filter((action) => {
          const cityCountry = cities.find((c) => c.id === cityId)?.country;
          return cityCountry && selectedCountryValues.includes(cityCountry);
        });
      }

      if (selectedAreas.length > 0) {
        filtered = filtered.filter((action) =>
          (action.thematicAreasNonLever ?? []).some((areaId) =>
            selectedAreas.includes(areaId.toString()),
          ),
        );
      }

      if (selectedTags.length > 0) {
        filtered = filtered.filter((action) =>
          (action.tagIds ?? []).some((tagId) =>
            selectedTags.includes(tagId.toString()),
          ),
        );
      }

      if (selectedLevers.length > 0) {
        filtered = filtered.filter((action) =>
          (action.thematicAreasLever ?? []).some((leverId) =>
            selectedLevers.includes(leverId.toString()),
          ),
        );
      }

      // Filter by investment cost range
      filtered = filtered.filter(
        (action) =>
          action.investmentCost >= investmentCostRange[0] &&
          action.investmentCost <= investmentCostRange[1],
      );

      // Filter by operational cost per year range
      filtered = filtered.filter(
        (action) =>
          action.operationalCostPerYear >= operationalCostPerYearRange[0] &&
          action.operationalCostPerYear <= operationalCostPerYearRange[1],
      );

      // Filter by GHG reduction by 2030 range
      filtered = filtered.filter((action) => {
        const ghgReductionValue = getGhgReductionValue(action);
        return (
          ghgReductionValue >= ghgReductionBy2030Range[0] &&
          ghgReductionValue <= ghgReductionBy2030Range[1]
        );
      });

      // Filter by keywords
      if (keywords.length > 0 && (searchInNames || searchInSummaries)) {
        filtered = filtered.filter((action) => {
          let searchText = "";
          if (searchInNames) {
            searchText += action.name;
          }
          if (searchInSummaries) {
            searchText += ` ${action.summary ?? action.description ?? ""}`;
          }
          searchText = searchText.toLowerCase();
          return keywords.some((keyword) =>
            searchText.includes(keyword.toLowerCase()),
          );
        });
      }

      return filtered.length;
    },
    [
      selectedCountries,
      selectedCities,
      selectedTags,
      selectedAreas,
      selectedLevers,
      investmentCostRange,
      operationalCostPerYearRange,
      ghgReductionBy2030Range,
      keywords,
      searchInNames,
      searchInSummaries,
      cities,
      actions,
    ],
  );

  const cityCountById = useMemo(() => {
    const counts: Record<string, number> = {};

    cities.forEach((city) => {
      counts[city.id.toString()] = getActionCountForCity(city.id);
    });

    return counts;
  }, [cities, getActionCountForCity]);

  const colorScaleModel = useMemo(
    () => createColorScaleModel(Object.values(cityCountById)),
    [cityCountById],
  );

  // Initialize map and add event listeners
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const isInsideModal = target?.closest(".map-popup") !== null;

      /* enable 'normal' scroll inside resource modal */
      if (isInsideModal) {
        return;
      }

      const hasCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (!hasCtrlOrMeta) {
        e.preventDefault();
        e.stopPropagation();
        window.scrollBy(0, e.deltaY);
      }
    };

    const handleMouseEnter = () => {
      setShowZoomHint(true);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowZoomHint(false);
      }, 1000);
    };

    const handleMouseLeave = () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      setShowZoomHint(false);
    };

    container.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("wheel", handleWheel, {
        capture: true,
      } as any);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Initialize/cleanup map when view changes
  useEffect(() => {
    if (view !== "map") {
      // Clean up map when switching away from map view
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsMapLoaded(false);
      return;
    }

    // Initialize map when entering map view
    const initializeMap = async () => {
      const position: [number, number] = [10.5, 55.5];

      const map = new maplibregl.Map({
        container: "map",
        style: "https://tiles.openfreemap.org/styles/bright",
        center: position,
        zoom: 1,
        pitch: 0,
        bearing: 0,
        maxBounds: [
          [-28, 34],
          [48, 66],
        ],
        minZoom: 1,
        maxZoom: 15,
      });

      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.keyboard.disable();

      map.on("pitch", () => {
        if (map.getPitch() !== 0) {
          map.setPitch(0);
        }
      });

      setTimeout(() => {
        mapRef.current = map;
      }, 0);

      map.on("load", async () => {
        // Draw layers and customize map appearance
        const layers = map.getStyle().layers;

        const keepPrefixes = [
          "background",
          "water",
          "boundary",
          "marker",
          "cluster",
          "label_country",
        ];

        const omitPrefixes = ["waterway", "label_city"];

        layers.forEach((layer) => {
          if (
            !keepPrefixes.some((p) => layer.id.startsWith(p)) ||
            omitPrefixes.some((p) => layer.id.startsWith(p))
          ) {
            map.setLayoutProperty(layer.id, "visibility", "none");
          }
        });

        map.setPaintProperty("background", "background-color", "#edf3bf");
        map.setPaintProperty("water", "fill-color", "#80acc6");
        map.setPaintProperty("boundary_2", "line-color", "#175162");
        map.setPaintProperty("boundary_2", "line-width", 1);
        map.setPaintProperty("boundary_3", "line-width", 0);

        // Add city circles layer
        map.addLayer({
          id: "city-circles",
          type: "circle",
          source: {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [],
            },
          },
          paint: {
            "circle-radius": 6,
            "circle-color": ["get", "color"],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#175162",
          },
        });

        // Add city labels
        map.addLayer({
          id: "city-labels",
          type: "symbol",
          source: "city-circles",
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 12,
            "text-offset": [0, 0.7],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "#000",
          },
        });

        // Handle city click
        map.on("click", "city-circles", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["city-circles"],
          });
          if (features.length > 0) {
            const properties = features[0].properties;
            console.log("City clicked:", properties);
          }
        });

        // Handle cursor change
        map.on("mouseenter", "city-circles", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "city-circles", () => {
          map.getCanvas().style.cursor = "";
        });

        setIsMapLoaded(true);
      });

      mapRef.current = map;
    };

    initializeMap();
  }, [view]);

  // Update circle data when filters or cities change
  useEffect(() => {
    if (
      !isMapLoaded ||
      !mapRef.current ||
      !mapRef.current.getSource("city-circles")
    )
      return;

    const source = mapRef.current.getSource("city-circles") as any;
    source.setData({
      type: "FeatureCollection",
      features: cities.map((city) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [city.longitude, city.latitude],
        },
        properties: {
          id: city.id,
          name: city.name,
          color: colorScaleModel.getColorForCount(
            cityCountById[city.id.toString()] ?? 0,
          ),
        },
      })),
    });
  }, [
    isMapLoaded,
    cities,
    actions,
    selectedCountries,
    selectedCities,
    selectedTags,
    selectedAreas,
    selectedLevers,
    investmentCostRange,
    operationalCostPerYearRange,
    ghgReductionBy2030Range,
    keywords,
    searchInNames,
    searchInSummaries,
    cityCountById,
    colorScaleModel,
  ]);

  // Get filtered actions for list view
  const getFilteredActions = useCallback(() => {
    let filtered = actions;

    if (selectedCountries.length > 0) {
      const selectedCountryValues = selectedCountries.map(
        (key) => Country[key as keyof typeof Country],
      ) as string[];
      filtered = filtered.filter((action) => {
        const cityCountry = cities.find((c) => c.id === action.cityId)?.country;
        return cityCountry && selectedCountryValues.includes(cityCountry);
      });
    }

    if (selectedCities.length > 0) {
      filtered = filtered.filter((action) =>
        selectedCities.includes(action.cityId.toString()),
      );
    }

    if (selectedAreas.length > 0) {
      filtered = filtered.filter((action) =>
        (action.thematicAreasNonLever ?? []).some((areaId) =>
          selectedAreas.includes(areaId.toString()),
        ),
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((action) =>
        (action.tagIds ?? []).some((tagId) =>
          selectedTags.includes(tagId.toString()),
        ),
      );
    }

    if (selectedLevers.length > 0) {
      filtered = filtered.filter((action) =>
        (action.thematicAreasLever ?? []).some((leverId) =>
          selectedLevers.includes(leverId.toString()),
        ),
      );
    }

    // Filter by investment cost range
    filtered = filtered.filter(
      (action) =>
        action.investmentCost >= investmentCostRange[0] &&
        action.investmentCost <= investmentCostRange[1],
    );

    // Filter by operational cost per year range
    filtered = filtered.filter(
      (action) =>
        action.operationalCostPerYear >= operationalCostPerYearRange[0] &&
        action.operationalCostPerYear <= operationalCostPerYearRange[1],
    );

    // Filter by GHG reduction by 2030 range
    filtered = filtered.filter((action) => {
      const ghgReductionValue = getGhgReductionValue(action);
      return (
        ghgReductionValue >= ghgReductionBy2030Range[0] &&
        ghgReductionValue <= ghgReductionBy2030Range[1]
      );
    });

    // Filter by keywords
    if (keywords.length > 0 && (searchInNames || searchInSummaries)) {
      filtered = filtered.filter((action) => {
        let searchText = "";
        if (searchInNames) {
          searchText += action.name;
        }
        if (searchInSummaries) {
          searchText += ` ${action.summary ?? action.description ?? ""}`;
        }
        searchText = searchText.toLowerCase();
        return keywords.some((keyword) =>
          searchText.includes(keyword.toLowerCase()),
        );
      });
    }

    return filtered;
  }, [
    selectedCountries,
    selectedCities,
    selectedTags,
    selectedAreas,
    selectedLevers,
    investmentCostRange,
    operationalCostPerYearRange,
    ghgReductionBy2030Range,
    keywords,
    searchInNames,
    searchInSummaries,
    cities,
    actions,
  ]);

  const handleReturnFromDetails = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("actionId");
    const queryString = params.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
    setSelectedActionId(null);
  };

  // Find the selected action if actionId is present
  const selectedAction = selectedActionId
    ? actions.find((a) => a.id.toString() === selectedActionId)
    : null;

  if (selectedAction) {
    return (
      <ActionDetails
        action={selectedAction}
        tags={tags}
        thematicAreas={thematicAreas}
        onReturn={handleReturnFromDetails}
      />
    );
  }

  return (
    <div className="map-container">
      <div className="map-filters-wrapper">
        <Filters
          cities={cities}
          tags={tags}
          thematicAreas={thematicAreas}
          selectedCountries={selectedCountries}
          onCountriesChange={setSelectedCountries}
          selectedCities={selectedCities}
          onCitiesChange={setSelectedCities}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          selectedAreas={selectedAreas}
          onAreasChange={setSelectedAreas}
          selectedLevers={selectedLevers}
          onLeversChange={setSelectedLevers}
          keywords={keywords}
          onKeywordsChange={setKeywords}
          searchInNames={searchInNames}
          onSearchInNamesChange={setSearchInNames}
          searchInSummaries={searchInSummaries}
          onSearchInSummariesChange={setSearchInSummaries}
          investmentCost={investmentCostRange}
          onInvestmentCostChange={(min, max) =>
            setInvestmentCostRange([min, max])
          }
          operationalCostPerYear={operationalCostPerYearRange}
          onOperationalCostPerYearChange={(min, max) =>
            setOperationalCostPerYearRange([min, max])
          }
          ghgReductionBy2030={ghgReductionBy2030Range}
          onGhgReductionBy2030Change={(min, max) =>
            setGhgReductionBy2030Range([min, max])
          }
          maxInvestmentCost={maxValues.maxInvestmentCost}
          maxOperationalCostPerYear={maxValues.maxOperationalCost}
          maxGhgReductionBy2030={maxValues.maxGhgReductionBy2030}
        />
      </div>
      <button
        className="view-toggle-button"
        onClick={() => setView(view === "map" ? "list" : "map")}
      >
        {view === "map" ? "Show list" : "Show map"}
      </button>
      {view === "map" && (
        <button
          className="view-toggle-button legend-toggle-button"
          style={showLegend ? { borderRadius: "0 0 8px 8px" } : {}}
          onClick={() => setShowLegend((current) => !current)}
        >
          {showLegend ? "Hide legend" : "Show legend"}
        </button>
      )}
      {view === "map" ? (
        <div className="map" id="map" ref={mapContainerRef}>
          {showLegend && (
            <div className="map-legend" aria-label="Action count legend">
              {colorScaleModel.legendItems.map((item) => (
                <div
                  key={`${item.color}-${item.label}`}
                  className="map-legend-item"
                >
                  <span
                    className={`map-legend-swatch${item.color === "#ffffff" ? " map-legend-swatch--zero" : ""}`}
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="map-legend-label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
          {showZoomHint && (
            <div className="map-zoom-hint">
              Hold <kbd>Ctrl</kbd> / <kbd>⌘</kbd> to zoom
            </div>
          )}
        </div>
      ) : (
        <ActionList
          actions={getFilteredActions()}
          cities={cities}
          onActionDetails={(actionId) =>
            setSelectedActionId(actionId.toString())
          }
        />
      )}
    </div>
  );
}
