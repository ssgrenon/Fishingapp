import { fetchJson } from "./http.mjs";
import { LOCATION } from "../config.mjs";

const M_TO_FT = 3.28084;

function hourLabel(date) {
  return date
    .toLocaleTimeString("en-US", { hour: "numeric", timeZone: "America/New_York" })
    .replace(" ", "")
    .toLowerCase();
}

/** Next-6h wave forecast plus per-day max wave height (for the 7-day trip planner), from Open-Meteo Marine. */
export async function fetchMarine(now) {
  const url =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}` +
    `&hourly=wave_height&timezone=UTC&forecast_days=8`;
  const data = await fetchJson(url, {}, "Open-Meteo Marine");

  const times = data.hourly.time.map((t) => new Date(`${t}:00Z`));
  const heightsM = data.hourly.wave_height;

  const next6h = times
    .map((time, i) => ({ time, heightFt: heightsM[i] * M_TO_FT }))
    .filter((p) => p.time >= now)
    .slice(0, 6)
    .map((p) => ({ label: hourLabel(p.time), heightFt: Math.round(p.heightFt * 10) / 10 }));

  const dailyMaxWaveFt = new Map();
  times.forEach((time, i) => {
    const key = time.toISOString().slice(0, 10);
    const ft = heightsM[i] * M_TO_FT;
    if (!dailyMaxWaveFt.has(key) || dailyMaxWaveFt.get(key) < ft) dailyMaxWaveFt.set(key, ft);
  });

  return { next6h, dailyMaxWaveFt };
}
