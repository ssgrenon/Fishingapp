import { scoreTier } from "./tiers.mjs";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Simplified daily 0-100 score for the 7-day trip planner, from wind + wave alone. */
export function computeDailyScore({ windMph, waveFt }) {
  const windPenalty = Math.max(0, windMph - 12) * 1.5;
  const wavePenalty = Math.max(0, waveFt - 2.1) * 15;
  const score = Math.round(clamp(70 - windPenalty - wavePenalty, 5, 95));
  return { score, tier: scoreTier(score) };
}

/**
 * Composite 0-100 "should I go" score combining pressure trend, solunar/tide
 * alignment, wind, and wave height. Weights are a starting point, not a
 * validated model — worth tuning against real outcomes over time.
 */
export function computeBiteScore({ pressureTrend, solunarFeaturedNote, nextTideEvent, wind, waveTier, waveHeightFt }) {
  let score = 60;
  const reasons = [];

  if (pressureTrend === "falling") {
    score -= 10;
    reasons.push({ tier: "critical", text: "Pressure falling — front likely approaching" });
  } else {
    score += 12;
    reasons.push({ tier: "good", text: `Pressure ${pressureTrend}` });
  }

  if (solunarFeaturedNote) {
    score += 10;
    reasons.push({ tier: "good", text: solunarFeaturedNote.replace(" ✦ best window", "") });
  }

  if (wind.gustMph >= 25) {
    score -= 15;
    reasons.push({ tier: "critical", text: `${wind.dirLabel} wind strong, gusts to ${wind.gustMph} mph` });
  } else if (wind.gustMph >= 18) {
    score -= 5;
    reasons.push({ tier: "caution", text: `${wind.dirLabel} wind freshening, gusts to ${wind.gustMph} mph` });
  } else {
    score += 6;
    reasons.push({ tier: "good", text: `Wind light, ${wind.mph} mph ${wind.dirLabel}` });
  }

  if (waveTier === "critical") {
    score -= 12;
    reasons.push({ tier: "critical", text: `Waves rough, ${waveHeightFt.toFixed(1)} ft` });
  } else if (waveTier === "caution") {
    reasons.push({ tier: "caution", text: `Waves moderate, ${waveHeightFt.toFixed(1)} ft` });
  } else {
    score += 4;
  }

  if (nextTideEvent) {
    const direction = nextTideEvent.type === "High" ? "Incoming" : "Outgoing";
    score += 4;
    reasons.push({ tier: "good", text: `${direction} tide` });
  }

  score = Math.round(clamp(score, 5, 98));
  const verdict = score >= 75 ? "Good" : score >= 50 ? "Fair" : "Tough";
  const headline = solunarFeaturedNote?.includes("dusk")
    ? `${verdict} bite window this evening`
    : solunarFeaturedNote?.includes("dawn")
      ? `${verdict} bite window this morning`
      : `${verdict} fishing conditions today`;

  return { value: score, verdict, headline, reasons };
}
