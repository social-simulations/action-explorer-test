export type City = {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
};

export type Tag = {
  id: string | number;
  name: string;
};

export type ThematicArea = {
  id: string | number;
  name: string;
};

export type Action = {
  id: string | number;
  name: string;
  summary?: string;
  ghgReductionBy2030?: number | string | null;
  cityId: string | number;
  area: string;
  investmentCost: number;
  operationalCostPerYear: number;
  description?: string;
  spatialFrames?: string[];
  tagIds?: Array<string | number>;
  thematicAreasLever?: Array<string | number>;
  thematicAreasNonLever?: Array<string | number>;
};
