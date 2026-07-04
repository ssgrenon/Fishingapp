export function tideHeightTier(ft, superHighFt, superLowFt) {
  if (ft >= superHighFt) return "good";
  if (ft <= superLowFt) return "critical";
  return undefined;
}

export function waveHeightTier(ft, calmMaxFt, moderateMaxFt) {
  if (ft < calmMaxFt) return "good";
  if (ft <= moderateMaxFt) return "caution";
  return "critical";
}

export function scoreTier(score) {
  if (score >= 70) return "good";
  if (score >= 45) return "caution";
  return "critical";
}
