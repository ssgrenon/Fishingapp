#!/usr/bin/env node
// Aggregates NOAA/NWS/NDBC/Open-Meteo/USGS data plus locally-computed
// astronomy into public/data/conditions.json. Run on a schedule by
// .github/workflows/update-conditions.yml (GitHub-hosted runners have normal
// internet access; this has not been exercised against live endpoints from
// within the dev sandbox used to write it — see README for details).

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { LOCATION, WAVE_THRESHOLDS } from "./config.mjs";
import { soft } from "./lib/http.mjs";
import { localMidnight, localDateOffset, localDateAndHour } from "./lib/time.mjs";
import { computeAstronomy } from "./lib/astronomy.mjs";
import { fetchTide } from "./lib/noaaTides.mjs";
import { fetchWeather } from "./lib/nwsWeather.mjs";
import { fetchWaves, fetchPressure, fetchWaterTemp } from "./lib/ndbcBuoy.mjs";
import { fetchMarine } from "./lib/openMeteoMarine.mjs";
import { fetchHourlyForecast, hourLabel, windowAround } from "./lib/openMeteoForecast.mjs";
import { fetchWaterClarityProxy } from "./lib/usgsWater.mjs";
import { computeBiteScore, computeDailyScore } from "./lib/biteScore.mjs";
import { waveHeightTier } from "./lib/tiers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "..", "public", "data", "conditions.json");

async function readPrevious() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const now = new Date();
  const midnight = localMidnight(now);
  const previous = await readPrevious();
  const fallback = (section, value) => previous?.[section] ?? value;

  const astronomy = computeAstronomy(midnight, LOCATION.lat, LOCATION.lon);

  const tide = await soft("NOAA tides", () => fetchTide(now), fallback("tide", null));
  const { weather, dailyWind } = await soft(
    "NWS weather",
    () => fetchWeather(now),
    { weather: fallback("weather", null), dailyWind: [] }
  );
  const wavesCurrent = await soft("NDBC waves", () => fetchWaves(), { source: "", current: fallback("waves", {}).current });
  const marine = await soft("Open-Meteo marine", () => fetchMarine(now), {
    hourly: [],
    dailyMaxWaveFt: new Map(),
    current: fallback("waves", {}).current ?? null,
  });
  const forecastHourly = await soft("Open-Meteo forecast", () => fetchHourlyForecast(), []);
  const pressure = await soft("NDBC pressure", () => fetchPressure(), fallback("pressure", null));
  const waterTempF = await fetchWaterTemp();
  const clarity = await soft("USGS water clarity", () => fetchWaterClarityProxy(), {
    clarity: fallback("water", {}).clarity ?? "Unavailable",
    riverDischarge: fallback("water", {}).riverDischarge ?? "Unavailable",
    note: "Water clarity proxy temporarily unavailable.",
  });

  // Shared hourly window: 2 hours before to 4 hours after the update time.
  const forecastWindow = windowAround(forecastHourly, now);
  const windAt = (time) => forecastWindow.find((f) => f.time.getTime() === time.getTime());

  const wavesWindow = windowAround(marine.hourly, now).map((wp) => {
    const wind = windAt(wp.time);
    return {
      label: hourLabel(wp.time),
      heightFt: wp.heightFt,
      periodSec: wp.periodSec,
      windDirLabel: wind?.windDirLabel,
      windSpeedMph: wind?.windSpeedMph,
    };
  });

  const rainWindow = forecastWindow.map((f) => ({
    label: f.label,
    pct: f.pct,
    precipIn: f.precipIn,
    storm: f.storm,
  }));

  const buoyCurrent = wavesCurrent.current ?? {};
  const marineCurrent = marine.current ?? {};
  const waves = {
    source: wavesCurrent.source || fallback("waves", {}).source || "NDBC",
    current: {
      heightFt: buoyCurrent.heightFt ?? null,
      periodSec: buoyCurrent.periodSec ?? marineCurrent.periodSec ?? null,
      direction: buoyCurrent.direction ?? marineCurrent.direction ?? null,
      chop: buoyCurrent.chop ?? "Unavailable",
      swellHeightFt: marineCurrent.swellHeightFt ?? null,
      swellPeriodSec: marineCurrent.swellPeriodSec ?? null,
      swellDirection: marineCurrent.swellDirection ?? null,
      windWaveHeightFt: marineCurrent.windWaveHeightFt ?? null,
    },
    thresholds: WAVE_THRESHOLDS,
    next6h: wavesWindow.length ? wavesWindow : fallback("waves", {}).next6h ?? [],
  };

  if (weather && rainWindow.length) weather.rainNext6h = rainWindow;

  // Hourly wind by local calendar date, for the trip planner's wind-speed
  // heatmap (24 slots/day; hours missing from the forecast are left out).
  const hourlyWindByDate = new Map();
  forecastHourly.forEach((f) => {
    const { date, hour } = localDateAndHour(f.time);
    if (!hourlyWindByDate.has(date)) hourlyWindByDate.set(date, []);
    hourlyWindByDate.get(date).push({ hour, mph: f.windSpeedMph, dir: f.windDirLabel });
  });
  const previousWeekly = fallback("weekly", []);

  const weekly = [];
  for (let i = 0; i < 7; i++) {
    const date = localDateOffset(now, i);
    const wind = dailyWind.find((d) => d.date === date) ?? dailyWind[i] ?? { windMph: 10, windDir: "SW" };
    const waveFt = marine.dailyMaxWaveFt.get(date) ?? waves.current.heightFt ?? 2;
    const { score, tier } = computeDailyScore({ windMph: wind.windMph, waveFt });
    const dateObj = new Date(`${date}T12:00:00Z`);
    const hourlyWind =
      hourlyWindByDate.get(date) ?? previousWeekly.find((d) => d.date === date)?.hourlyWind ?? [];
    weekly.push({
      date,
      day: dateObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      windMph: wind.windMph,
      windDir: wind.windDir,
      waveFt: Math.round(waveFt * 10) / 10,
      score,
      tier,
      hourlyWind,
    });
  }

  const biteScore = computeBiteScore({
    pressureTrend: pressure?.trend ?? "steady",
    solunarFeaturedNote: astronomy.solunar.featuredNote,
    nextTideEvent: tide?.next?.[0] ?? null,
    wind: { mph: weather?.windMph ?? 0, gustMph: weather?.windGustMph ?? 0, dirLabel: weather?.windDirLabel ?? "" },
    waveTier: waveHeightTier(waves.current.heightFt ?? 0, WAVE_THRESHOLDS.calmMaxFt, WAVE_THRESHOLDS.moderateMaxFt),
    waveHeightFt: waves.current.heightFt ?? 0,
  });

  const conditions = {
    location: LOCATION,
    updated: now.toISOString(),
    isSample: false,
    tide,
    sun: astronomy.sun,
    moon: astronomy.moon,
    solunar: astronomy.solunar,
    waves,
    weather,
    pressure,
    water: {
      tempF: waterTempF ?? fallback("water", {}).tempF ?? 78,
      clarity: clarity.clarity,
      note: clarity.note,
      riverDischarge: clarity.riverDischarge,
    },
    biteScore,
    weekly,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(conditions, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("fetch-conditions failed:", err);
  process.exit(1);
});
