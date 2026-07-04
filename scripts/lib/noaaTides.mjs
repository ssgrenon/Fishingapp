import { fetchJson } from "./http.mjs";
import { NOAA_TIDE_STATION, TIDE_THRESHOLDS } from "../config.mjs";
import { localMidnight, localYyyymmdd } from "./time.mjs";

const BASE = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
const DAY_MS = 86_400_000;

function parseGmtTimestamp(t) {
  // NOAA returns "t" like "2026-07-04 10:00" when time_zone=gmt.
  return new Date(`${t.replace(" ", "T")}Z`);
}

async function fetchPredictions(stationId, beginDate, endDate, interval) {
  const url =
    `${BASE}?product=predictions&datum=MLLW&station=${stationId}&time_zone=gmt&units=english` +
    `&format=json&begin_date=${beginDate}&end_date=${endDate}&interval=${interval}`;
  const data = await fetchJson(url, {}, "NOAA CO-OPS predictions");
  if (data.error) throw new Error(`NOAA CO-OPS error: ${data.error.message}`);
  return data.predictions ?? [];
}

/** Tide predictions for Oak Island: today's hourly curve plus the next few high/low events. */
export async function fetchTide(now) {
  const midnight = localMidnight(now);
  const nextMidnight = new Date(midnight.getTime() + DAY_MS);
  // Pad the query range so local-day filtering below is unaffected by NOAA's own date-boundary semantics.
  const beginDate = localYyyymmdd(new Date(midnight.getTime() - DAY_MS));
  const endDate = localYyyymmdd(new Date(midnight.getTime() + 2 * DAY_MS));

  const [hourly, hiLo] = await Promise.all([
    fetchPredictions(NOAA_TIDE_STATION, beginDate, endDate, "h"),
    fetchPredictions(NOAA_TIDE_STATION, beginDate, endDate, "hilo"),
  ]);

  const todayHourly = hourly
    .map((p) => ({ time: parseGmtTimestamp(p.t), heightFt: Number(p.v) }))
    .filter((p) => p.time >= midnight && p.time < nextMidnight)
    .sort((a, b) => a.time - b.time);

  const curvePoints = [];
  const samples = 9;
  for (let i = 0; i < samples; i++) {
    const idx = todayHourly.length > 1 ? Math.round((i / (samples - 1)) * (todayHourly.length - 1)) : 0;
    curvePoints.push(Math.round((todayHourly[idx]?.heightFt ?? 0) * 10) / 10);
  }

  const next = hiLo
    .map((p) => ({ type: p.type === "H" ? "High" : "Low", time: parseGmtTimestamp(p.t), heightFt: Number(p.v) }))
    .filter((p) => p.time > now)
    .sort((a, b) => a.time - b.time)
    .slice(0, 3)
    .map((p) => ({ type: p.type, time: p.time.toISOString(), heightFt: Math.round(p.heightFt * 10) / 10 }));

  return { station: NOAA_TIDE_STATION, curvePoints, next, thresholds: TIDE_THRESHOLDS };
}
