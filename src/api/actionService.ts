import { Action, City } from "../types/types";
import { ActionArea } from "../enums";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

type UnknownRecord = Record<string, unknown>;

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const obj = payload as UnknownRecord;
    if (Array.isArray(obj.data)) {
      return obj.data;
    }
    if (Array.isArray(obj.results)) {
      return obj.results;
    }
    if (Array.isArray(obj.items)) {
      return obj.items;
    }
  }

  return [];
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function asNullableNumberOrString(value: unknown): number | string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
}

function mapArea(raw: unknown): string {
  const normalized = asString(raw).trim().toLowerCase();
  if (!normalized) {
    return ActionArea.ADAPTATION;
  }

  const areaMatch = Object.values(ActionArea).find(
    (area) => area.toLowerCase() === normalized,
  );

  return areaMatch || ActionArea.ADAPTATION;
}

async function fetchApiJson(endpoint: string): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }
  return response.json();
}

function mapCities(rawCities: unknown[]): City[] {
  return rawCities.map((rawCity, index) => {
    const city = rawCity as UnknownRecord;
    const id = (city.id ?? city.city_id ?? index + 1) as string | number;
    const name = asString(city.name ?? city.city_name, `City ${index + 1}`);

    return {
      id,
      name,
      latitude: asNumber(city.latitude ?? city.lat),
      longitude: asNumber(city.longitude ?? city.lng ?? city.lon),
      country: asString(city.country),
    };
  });
}

function mapActions(rawActions: unknown[], cities: City[]): Action[] {
  return rawActions.map((rawAction, index) => {
    const action = rawAction as UnknownRecord;
    const actionId = (action.id ?? action.action_id ?? index + 1) as
      | string
      | number;

    const rawCityId = action.city_id ?? action.cityId;
    const rawCityName = asString(action.city ?? action.city_name);
    const cityFromId = cities.find(
      (city) => city.id.toString() === asString(rawCityId),
    );
    const cityFromName = cities.find(
      (city) => city.name.toLowerCase() === rawCityName.toLowerCase(),
    );
    const resolvedCityId =
      cityFromId?.id ?? cityFromName?.id ?? cities[0]?.id ?? "unknown";

    const summary = asString(action.summary ?? action.description);

    return {
      id: actionId,
      name: asString(action.name, `Action ${index + 1}`),
      summary,
      description: summary,
      ghgReductionBy2030: asNullableNumberOrString(
        action.ghg_reduction_by_2030 ?? action.ghgReductionBy2030,
      ),
      cityId: resolvedCityId,
      area: mapArea(action.thematic_area ?? action.area),
      investmentCost: asNumber(action.investment_cost ?? action.investmentCost),
      operationalCostPerYear: asNumber(
        action.operational_cost_year ??
          action.operational_cost_per_year ??
          action.operationalCostPerYear,
      ),
    };
  });
}

export async function fetchActionExplorerData(): Promise<{
  cities: City[];
  actions: Action[];
}> {
  const [citiesPayload, actionsPayload] = await Promise.all([
    fetchApiJson("/cities"),
    fetchApiJson("/actions"),
  ]);

  const mappedCities = mapCities(extractArray(citiesPayload));
  const mappedActions = mapActions(extractArray(actionsPayload), mappedCities);

  return {
    cities: mappedCities,
    actions: mappedActions,
  };
}
