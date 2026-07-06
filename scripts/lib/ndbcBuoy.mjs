import { fetchText, soft } from "./http.mjs";
import { NDBC_STATION, NDBC_STATION_LABEL } from "../config.mjs";

const COLUMNS = ["YY", "MM", "DD", "hh", "mm", "WDIR", "WSPD", "GST", "WVHT", "DPD", "APD", "MWD", "PRES", "ATMP", "WTMP", "DEWP", "VIS", "PTDY", "TIDE"];
const MM = "MM"; // NDBC's missing-value marker

function degToCompass(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function num(row, key) {
  const v = row[key];
  return v === undefined || v === MM ? null : Number(v);
}

function parseRows(text) {
  return text
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const cells = line.trim().split(/\s+/);
      const row = {};
      COLUMNS.forEach((name, i) => { row[name] = cells[i]; });
      return row;
    });
}

function rowTime(row) {
  return new Date(Date.UTC(Number(row.YY), Number(row.MM) - 1, Number(row.DD), Number(row.hh), Number(row.mm)));
}

async function fetchRows() {
  const text = await fetchText(`https://www.ndbc.noaa.gov/data/realtime2/${NDBC_STATION}.txt`, {}, "NDBC realtime2");
  return parseRows(text); // newest first, per NDBC convention
}

// Wind/pressure update every 10 min, but wave height/period/direction come from a
// slower onboard calculation that only posts once every 30-60 min - so the single
// newest row frequently has these marked "MM" (missing) even though a still-recent
// reading exists a few rows back. Scan back through the last couple of hours for
// the latest value actually present, per field.
function latestValid(rows, key, maxAgeRows = 12) {
  for (let i = 0; i < Math.min(rows.length, maxAgeRows); i++) {
    const v = num(rows[i], key);
    if (v !== null) return v;
  }
  return null;
}

export async function fetchWaves() {
  const rows = await fetchRows();
  const wvhtM = latestValid(rows, "WVHT");
  const dpd = latestValid(rows, "DPD");
  const mwd = latestValid(rows, "MWD");

  return {
    source: NDBC_STATION_LABEL,
    current: {
      heightFt: wvhtM !== null ? Math.round(wvhtM * 3.28084 * 10) / 10 : null,
      periodSec: dpd,
      direction: mwd !== null ? degToCompass(mwd) : null,
      chop: wvhtM !== null && wvhtM < 0.6 ? "Light" : wvhtM !== null && wvhtM < 1.2 ? "Moderate" : "Choppy",
    },
  };
}

/** Buoy-reported barometric pressure (current + trailing 24h), used as the Pressure card's primary source. */
export async function fetchPressure() {
  const rows = await fetchRows();
  const withPres = rows.filter((r) => num(r, "PRES") !== null);
  if (!withPres.length) throw new Error("no PRES readings in NDBC feed");

  const latestHpa = num(withPres[0], "PRES");
  const cutoff = rowTime(withPres[0]).getTime() - 24 * 3_600_000;
  const last24h = withPres.filter((r) => rowTime(r).getTime() >= cutoff).reverse(); // oldest first

  const samples = 9;
  const sparkline = [];
  for (let i = 0; i < samples; i++) {
    const idx = last24h.length > 1 ? Math.round((i / (samples - 1)) * (last24h.length - 1)) : 0;
    const hpa = num(last24h[idx] ?? withPres[0], "PRES") ?? latestHpa;
    sparkline.push(Math.round(hpa * 0.0295300 * 100) / 100); // hPa -> inHg
  }

  const currentInHg = Math.round(latestHpa * 0.0295300 * 100) / 100;
  const deltaInHg = Math.round((sparkline[samples - 1] - sparkline[0]) * 100) / 100;
  const trend = Math.abs(deltaInHg) < 0.02 ? "steady" : deltaInHg > 0 ? "rising" : "falling";
  const trendNote = `${trend} ${Math.abs(deltaInHg).toFixed(2)} in since ${last24h.length ? "yesterday" : "midnight"}`;

  return { current: currentInHg, trend, trendNote, last24h: sparkline };
}

export async function fetchWaterTemp() {
  return soft(
    "NDBC water temp",
    async () => {
      const rows = await fetchRows();
      const withTemp = rows.find((r) => num(r, "WTMP") !== null);
      if (!withTemp) throw new Error("no WTMP readings");
      const c = num(withTemp, "WTMP");
      return Math.round((c * 9) / 5 + 32);
    },
    null
  );
}
