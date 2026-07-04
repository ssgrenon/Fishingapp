import { fetchJson, soft } from "./http.mjs";
import { LOCATION, NWS_USER_AGENT } from "../config.mjs";

const headers = { "User-Agent": NWS_USER_AGENT, Accept: "application/geo+json" };

function maxWindMph(windSpeed) {
  const numbers = (windSpeed.match(/\d+/g) ?? ["0"]).map(Number);
  return Math.max(...numbers);
}

async function resolveGridpoint() {
  const point = await fetchJson(`https://api.weather.gov/points/${LOCATION.lat},${LOCATION.lon}`, { headers }, "NWS points");
  const { gridId, gridX, gridY } = point.properties;
  return { gridId, gridX, gridY };
}

/** Current-ish conditions, next-6h rain chance + thunderstorm window, from the hourly forecast. */
async function fetchHourly(gridId, gridX, gridY, now) {
  const data = await fetchJson(
    `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`,
    { headers },
    "NWS hourly forecast"
  );
  const periods = data.properties.periods;
  const current = periods[0];
  const next6 = periods.slice(0, 6);

  const rainNext6h = next6.map((p) => ({
    label: new Date(p.startTime).toLocaleTimeString("en-US", { hour: "numeric", timeZone: "America/New_York" }).replace(" ", "").toLowerCase(),
    pct: p.probabilityOfPrecipitation?.value ?? 0,
    storm: /thunderstorm/i.test(p.shortForecast ?? ""),
  }));

  const stormPeriods = next6.filter((p) => /thunderstorm/i.test(p.shortForecast ?? ""));
  const stormRisk = stormPeriods.length
    ? {
        present: true,
        windowLabel: `${new Date(stormPeriods[0].startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })} – ${new Date(stormPeriods[stormPeriods.length - 1].endTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}`,
      }
    : { present: false, windowLabel: "" };

  return {
    tempF: current.temperature,
    conditions: current.shortForecast,
    windMph: maxWindMph(current.windSpeed),
    windDirLabel: current.windDirection,
    humidityPct: current.relativeHumidity?.value ?? null,
    rainNext6h,
    stormRisk,
  };
}

/** Daily wind speed/direction for the 7-day trip planner, from the 12-hourly forecast. */
async function fetchDailyWind(gridId, gridX, gridY) {
  const data = await fetchJson(
    `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`,
    { headers },
    "NWS 12-hourly forecast"
  );
  const daytimePeriods = data.properties.periods.filter((p) => p.isDaytime).slice(0, 7);
  return daytimePeriods.map((p) => ({
    date: p.startTime.slice(0, 10),
    windMph: maxWindMph(p.windSpeed),
    windDir: p.windDirection,
  }));
}

/** Wind gust, from the raw grid data time series (best-effort; falls back to an estimate). */
async function fetchWindGust(gridId, gridX, gridY, baseWindMph) {
  return soft(
    "NWS wind gust",
    async () => {
      const data = await fetchJson(`https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}`, { headers }, "NWS grid data");
      const values = data.properties?.windGust?.values ?? [];
      if (!values.length) throw new Error("no windGust values");
      const kmh = values[0].value;
      if (typeof kmh !== "number") throw new Error("windGust value missing");
      return Math.round(kmh * 0.621371);
    },
    Math.round(baseWindMph * 1.4)
  );
}

export async function fetchWeather(now) {
  const { gridId, gridX, gridY } = await resolveGridpoint();
  const hourly = await fetchHourly(gridId, gridX, gridY, now);
  const daily = await soft("NWS daily wind", () => fetchDailyWind(gridId, gridX, gridY), []);
  const windGustMph = await fetchWindGust(gridId, gridX, gridY, hourly.windMph);

  return {
    weather: {
      source: `NWS gridpoint ${gridId}`,
      tempF: hourly.tempF,
      conditions: hourly.conditions,
      windMph: hourly.windMph,
      windGustMph,
      windDirLabel: hourly.windDirLabel,
      humidityPct: hourly.humidityPct,
      rainNext6h: hourly.rainNext6h,
      stormRisk: hourly.stormRisk,
    },
    dailyWind: daily,
  };
}
