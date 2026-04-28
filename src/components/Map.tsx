import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";
import { Action, City } from "../types/types";
import { ActionList } from "./list/ActionList";
import { getColorForCount } from "../utils/colorScale";
import { Country, ActionArea } from "../enums/enums";
import { Filters } from "./filters";
import { ActionDetails } from "./details";

type Props = {
  cities?: City[];
  actions?: Action[];
};

export function Map({ cities = [], actions = [] }: Props) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showZoomHint, setShowZoomHint] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [searchInNames, setSearchInNames] = useState(true);
  const [searchInSummaries, setSearchInSummaries] = useState(true);
  const [investmentCostRange, setInvestmentCostRange] = useState<
    [number, number]
  >([0, 992565]);
  const [operationalCostPerYearRange, setOperationalCostPerYearRange] =
    useState<[number, number]>([0, 49566]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate max values for investment cost and operational cost per year
  const maxValues = useMemo(() => {
    if (actions.length === 0)
      return { maxInvestmentCost: 992565, maxOperationalCost: 49566 };
    const maxInvestmentCost = Math.max(
      ...actions.map((a) => a.investmentCost || 0),
    );
    const maxOperationalCost = Math.max(
      ...actions.map((a) => a.operationalCostPerYear || 0),
    );
    return { maxInvestmentCost, maxOperationalCost };
  }, [actions]);

  // Initialize state from query params on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const countriesParam = params.get("countries");
    const citiesParam = params.get("cities");
    const areasParam = params.get("areas");
    const keywordsParam = params.get("keywords");
    const searchInNamesParam = params.get("searchInNames");
    const searchInSummariesParam = params.get("searchInSummaries");
    const investmentCostParam = params.get("investmentCost");
    const operationalCostParam = params.get("operationalCostPerYear");
    const viewParam = params.get("view");
    const actionIdParam = params.get("actionId");

    if (countriesParam) {
      setSelectedCountries(countriesParam.split(","));
    }
    if (citiesParam) {
      setSelectedCities(citiesParam.split(","));
    }
    if (areasParam) {
      setSelectedAreas(areasParam.split(","));
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
    if (selectedAreas.length > 0) {
      params.set("areas", selectedAreas.join(","));
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
    selectedAreas,
    keywords,
    searchInNames,
    searchInSummaries,
    investmentCostRange,
    operationalCostPerYearRange,
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
        const selectedAreaValues = selectedAreas.map(
          (key) => ActionArea[key as keyof typeof ActionArea],
        ) as string[];
        filtered = filtered.filter((action) =>
          selectedAreaValues.includes(action.area),
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
      selectedAreas,
      investmentCostRange,
      operationalCostPerYearRange,
      keywords,
      searchInNames,
      searchInSummaries,
      cities,
      actions,
    ],
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
            "circle-radius": 8,
            "circle-color": ["get", "color"],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#175162",
            "circle-opacity": 0.8,
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
          color: getColorForCount(getActionCountForCity(city.id)),
        },
      })),
    });
  }, [
    isMapLoaded,
    cities,
    actions,
    selectedCountries,
    selectedCities,
    selectedAreas,
    investmentCostRange,
    operationalCostPerYearRange,
    keywords,
    searchInNames,
    searchInSummaries,
    getActionCountForCity,
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
      const selectedAreaValues = selectedAreas.map(
        (key) => ActionArea[key as keyof typeof ActionArea],
      ) as string[];
      filtered = filtered.filter((action) =>
        selectedAreaValues.includes(action.area),
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
    selectedAreas,
    investmentCostRange,
    operationalCostPerYearRange,
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
        onReturn={handleReturnFromDetails}
      />
    );
  }

  return (
    <div className="map-container">
      <div className="map-filters-wrapper">
        <Filters
          cities={cities}
          selectedCountries={selectedCountries}
          onCountriesChange={setSelectedCountries}
          selectedCities={selectedCities}
          onCitiesChange={setSelectedCities}
          selectedAreas={selectedAreas}
          onAreasChange={setSelectedAreas}
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
          maxInvestmentCost={maxValues.maxInvestmentCost}
          maxOperationalCostPerYear={maxValues.maxOperationalCost}
        />
      </div>
      <button
        className="view-toggle-button"
        onClick={() => setView(view === "map" ? "list" : "map")}
      >
        {view === "map" ? "Show list" : "Show map"}
      </button>
      {view === "map" ? (
        <div className="map" id="map" ref={mapContainerRef}>
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
