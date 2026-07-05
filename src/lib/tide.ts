import { hourOfDay } from "./time";
import type { TideEvent } from "./types";

interface Extremum {
  hr: number;
  ft: number;
  type: "High" | "Low";
}

const DEFAULT_SEMIDIURNAL_PERIOD_HOURS = 6.21;

/** Extends a sorted extrema list so it brackets [domainStart, domainEnd], synthesizing
 *  additional highs/lows outside the known range by mirroring the nearest known
 *  extremum of the same type (consecutive tides of the same type are similar in height). */
function extendExtrema(known: Extremum[], domainStart: number, domainEnd: number): Extremum[] {
  const result = [...known];

  while (result[0].hr > domainStart) {
    const first = result[0];
    const second = result[1];
    const period = second ? Math.abs(second.hr - first.hr) : DEFAULT_SEMIDIURNAL_PERIOD_HOURS;
    const prevType: Extremum["type"] = first.type === "High" ? "Low" : "High";
    const sameTypeRef = result.find((e) => e.type === prevType);
    result.unshift({ hr: first.hr - period, ft: sameTypeRef ? sameTypeRef.ft : first.ft, type: prevType });
  }

  while (result[result.length - 1].hr < domainEnd) {
    const last = result[result.length - 1];
    const prev = result[result.length - 2];
    const period = prev ? Math.abs(last.hr - prev.hr) : DEFAULT_SEMIDIURNAL_PERIOD_HOURS;
    const nextType: Extremum["type"] = last.type === "High" ? "Low" : "High";
    const sameTypeRef = [...result].reverse().find((e) => e.type === nextType);
    result.push({ hr: last.hr + period, ft: sameTypeRef ? sameTypeRef.ft : last.ft, type: nextType });
  }

  return result;
}

/** Cosine ("rule of twelfths"-style) interpolation between two bracketing extrema: fastest
 *  through mid-tide, flattening near the high/low dwell, which is what an actual tide curve
 *  looks like (unlike a straight or spline interpolation through sparse raw points). */
function heightAt(extrema: Extremum[], hr: number): number {
  let i = 0;
  while (i < extrema.length - 2 && hr > extrema[i + 1].hr) i++;
  const a = extrema[i];
  const b = extrema[i + 1];
  const f = Math.max(0, Math.min(1, (hr - a.hr) / (b.hr - a.hr)));
  return a.ft + (b.ft - a.ft) * 0.5 * (1 - Math.cos(Math.PI * f));
}

/** Produces one tide-height sample per hour across [0, domainHours] (hours since local
 *  midnight), derived from the station's real high/low events rather than an arbitrary
 *  fixed-spacing series. This hourly series is the input to the display-side smoothing
 *  curve, not a replacement for it. */
export function hourlyTideSeries(events: TideEvent[], midnightIso: string, domainHours: number): number[] {
  const known = events
    .map((e) => ({ hr: hourOfDay(e.time, midnightIso), ft: e.heightFt, type: e.type }))
    .sort((a, b) => a.hr - b.hr);
  const extrema = extendExtrema(known, 0, domainHours);

  const points: number[] = [];
  for (let hr = 0; hr <= domainHours; hr++) {
    points.push(heightAt(extrema, hr));
  }
  return points;
}
