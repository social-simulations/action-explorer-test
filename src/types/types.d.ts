export type City = {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
};

export type Action = {
  id: string | number;
  name: string;
  cityId: string | number;
  area: string;
  investmentCost: number;
  operationalCostPerYear: number;
  description: string;
};
