import { cssVar } from "./canvas";

export type Tier = "good" | "caution" | "critical";

export function tideHeightTier(ft: number, superHighFt: number, superLowFt: number): Tier | undefined {
  if (ft >= superHighFt) return "good";
  if (ft <= superLowFt) return "critical";
  return undefined;
}

export function waveHeightTier(ft: number, calmMaxFt: number, moderateMaxFt: number): Tier {
  if (ft < calmMaxFt) return "good";
  if (ft <= moderateMaxFt) return "caution";
  return "critical";
}

/** For inline DOM styles: a literal var() reference that tracks theme changes automatically. */
export function tierVarString(tier: Tier): string {
  return `var(--${tier})`;
}

/** For canvas fillStyle, which cannot read CSS custom properties: a resolved color value. */
export function tierResolvedColor(tier: Tier): string {
  return cssVar(`--${tier}`);
}
