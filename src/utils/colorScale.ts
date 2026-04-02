// Color scale for action counts
// 0: white, 1-9: gradient through blue-green-yellow-orange, 10+: dark red
const colorScale = [
  "#ffffff", // 0: white
  "#87CEEB", // 1: light blue
  "#00BFFF", // 2: sky blue
  "#90EE90", // 3: light green
  "#00FA9A", // 4: medium spring green
  "#3CB371", // 5: medium sea green
  "#FFFF00", // 6: yellow
  "#FFD700", // 7: gold
  "#FFA500", // 8: orange
  "#FF8C00", // 9: dark orange
  "#8B0000", // 10+: dark red
];

export function getColorForCount(count: number): string {
  if (count === 0) return colorScale[0];
  if (count >= 10) return colorScale[10];
  return colorScale[count];
}
