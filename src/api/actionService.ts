import { Action, City, Tag, ThematicArea } from "../types/types";
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

function asStringArray(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") {
          return item.includes(",") ? item.split(",") : [item];
        }
        if (typeof item === "number") {
          return [String(item)];
        }
        return [];
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "number") {
    return [String(value)];
  }

  return [];
}

function asIdArray(value: unknown): Array<string | number> {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    const ids: Array<string | number> = [];

    value.forEach((item) => {
      if (typeof item === "string") {
        const parts = item.includes(",") ? item.split(",") : [item];
        parts
          .map((part) => part.trim())
          .filter(Boolean)
          .forEach((part) => ids.push(part));
        return;
      }

      if (typeof item === "number" && Number.isFinite(item)) {
        ids.push(item);
        return;
      }

      if (item && typeof item === "object") {
        const record = item as UnknownRecord;
        const nestedId =
          record.id ??
          record.thematic_area_id ??
          record.thematicAreaId ??
          record.tag_id ??
          record.tagId;

        if (typeof nestedId === "number" && Number.isFinite(nestedId)) {
          ids.push(nestedId);
          return;
        }

        if (typeof nestedId === "string") {
          const trimmed = nestedId.trim();
          if (trimmed) {
            ids.push(trimmed);
          }
        }
      }
    });

    return ids;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return [value];
  }

  if (value && typeof value === "object") {
    const record = value as UnknownRecord;
    const id = record.id ?? record.thematic_area_id ?? record.tag_id;

    if (typeof id === "number" && Number.isFinite(id)) {
      return [id];
    }
    if (typeof id === "string") {
      return id.trim() ? [id.trim()] : [];
    }
  }

  return [];
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

function mapTags(rawTags: unknown[]): Tag[] {
  return rawTags.map((rawTag, index) => {
    const tag = rawTag as UnknownRecord;
    return {
      id: (tag.id ?? tag.tag_id ?? index + 1) as string | number,
      name: asString(tag.name ?? tag.tag_name, `Tag ${index + 1}`),
    };
  });
}

function mapThematicAreas(rawAreas: unknown[]): ThematicArea[] {
  return rawAreas.map((rawArea, index) => {
    const area = rawArea as UnknownRecord;
    return {
      id: (area.id ?? area.area_id ?? index + 1) as string | number,
      name: asString(area.name ?? area.title, `Area ${index + 1}`),
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
      spatialFrames: asStringArray(
        action.spatial_frames ??
          action.spatial_frame ??
          action.spatialFrames ??
          action.spatialFrame,
      ),
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
      tagIds: asIdArray(action.tag_ids ?? action.tagIds),
      thematicAreasLever: asIdArray(
        action.thematic_areas_lever ?? action.thematicAreasLever,
      ),
      thematicAreasNonLever: asIdArray(
        action.thematic_areas_non_lever ?? action.thematicAreasNonLever,
      ),
    };
  });
}

export async function fetchActionExplorerData(): Promise<{
  cities: City[];
  actions: Action[];
  tags: Tag[];
  thematicAreas: ThematicArea[];
}> {
  const [citiesPayload, actionsPayload, tagsPayload, thematicAreasPayload] =
    await Promise.all([
      fetchApiJson("/cities"),
      fetchApiJson("/actions"),
      fetchApiJson("/tags"),
      fetchApiJson("/thematic-areas"),
    ]);

  const mappedCities = mapCities(extractArray(citiesPayload));
  const mappedActions = mapActions(extractArray(actionsPayload), mappedCities);
  const mappedTags = mapTags(extractArray(tagsPayload));
  const mappedThematicAreas = mapThematicAreas(
    extractArray(thematicAreasPayload),
  );

  return {
    cities: mappedCities,
    actions: mappedActions,
    tags: mappedTags,
    thematicAreas: mappedThematicAreas,
  };
}
