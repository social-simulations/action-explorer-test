export type ColorLegendItem = {
  color: string;
  label: string;
};

type ColorScaleModel = {
  getColorForCount: (count: number) => string;
  legendItems: ColorLegendItem[];
};

// Fixed power-of-2 thresholds. Each entry: [maxCount, color, label].
// Order: lowest → highest. Anything above the last threshold uses the last color.
const BINS: { max: number; color: string; label: string }[] = [
  { max: 0, color: "#ffffff", label: "0" },
  { max: 1, color: "#b8dcf0", label: "1" },
  { max: 3, color: "#a4d4a4", label: "2-3" },
  { max: 7, color: "#7dba7d", label: "4-7" },
  { max: 15, color: "#afc93a", label: "8-15" },
  { max: 31, color: "#c8d62c", label: "16-31" },
  { max: 63, color: "#e8d820", label: "32-63" },
  { max: 127, color: "#f0c010", label: "64-127" },
  { max: 255, color: "#f09030", label: "128-255" },
  { max: 511, color: "#e05030", label: "256-511" },
  { max: 1023, color: "#c83050", label: "512-1023" },
  { max: Infinity, color: "#1a3d50", label: "> 1023" },
];

function getColorForCount(count: number): string {
  const bin = BINS.find((b) => count <= b.max);
  return bin ? bin.color : BINS[BINS.length - 1].color;
}

export function createColorScale(_counts: number[]): (count: number) => string {
  return getColorForCount;
}

export function createColorScaleModel(_counts: number[]): ColorScaleModel {
  const legendItems: ColorLegendItem[] = BINS.map((bin) => ({
    color: bin.color,
    label: bin.label,
  })).reverse(); // show highest first, matching the image

  return {
    getColorForCount,
    legendItems,
  };
}
