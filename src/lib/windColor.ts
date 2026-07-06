/**
 * Continuous wind-speed color scale (mph), in the spirit of Windy.com's
 * wind-speed legend: calm blues through green/yellow to orange/red/purple
 * at gale force, so a glance across a row of colors reads as an intensity
 * gradient rather than a handful of discrete bands.
 */
const STOPS: { mph: number; rgb: [number, number, number] }[] = [
  { mph: 0, rgb: [58, 134, 200] },
  { mph: 5, rgb: [51, 166, 166] },
  { mph: 10, rgb: [76, 175, 80] },
  { mph: 15, rgb: [176, 201, 78] },
  { mph: 20, rgb: [244, 208, 63] },
  { mph: 25, rgb: [243, 156, 18] },
  { mph: 30, rgb: [231, 76, 60] },
  { mph: 35, rgb: [155, 89, 182] },
];

export const WIND_COLOR_MAX_MPH = STOPS[STOPS.length - 1].mph;

export function windSpeedColor(mph: number): string {
  const v = Math.max(STOPS[0].mph, Math.min(WIND_COLOR_MAX_MPH, mph));
  let i = 0;
  while (i < STOPS.length - 2 && v > STOPS[i + 1].mph) i++;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  const t = (v - a.mph) / (b.mph - a.mph || 1);
  const r = Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t);
  const g = Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t);
  const bl = Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** CSS linear-gradient stops matching windSpeedColor, for a legend swatch. */
export function windSpeedGradientCss(): string {
  const stops = STOPS.map((s) => `rgb(${s.rgb[0]}, ${s.rgb[1]}, ${s.rgb[2]}) ${(s.mph / WIND_COLOR_MAX_MPH) * 100}%`);
  return `linear-gradient(to right, ${stops.join(", ")})`;
}
