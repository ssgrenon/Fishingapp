import SunCalc from "suncalc";

function toIso(date) {
  return date.toISOString();
}

function phaseName(fraction) {
  // fraction: 0 = new moon, 0.5 = full moon, 1 = next new moon
  if (fraction < 0.03 || fraction > 0.97) return "New moon";
  if (fraction < 0.22) return "Waxing crescent";
  if (fraction < 0.28) return "First quarter";
  if (fraction < 0.47) return "Waxing gibbous";
  if (fraction < 0.53) return "Full moon";
  if (fraction < 0.72) return "Waning gibbous";
  if (fraction < 0.78) return "Last quarter";
  return "Waning crescent";
}

/** Finds the moon's meridian transit (max altitude) and antipodal transit (min altitude, "underfoot") by sampling. */
function findMoonExtremes(startDate, lat, lon, hours = 27, stepMinutes = 6) {
  let maxAlt = -Infinity, maxTime = startDate;
  let minAlt = Infinity, minTime = startDate;
  const steps = Math.floor((hours * 60) / stepMinutes);
  for (let i = 0; i <= steps; i++) {
    const t = new Date(startDate.getTime() + i * stepMinutes * 60_000);
    const { altitude } = SunCalc.getMoonPosition(t, lat, lon);
    if (altitude > maxAlt) { maxAlt = altitude; maxTime = t; }
    if (altitude < minAlt) { minAlt = altitude; minTime = t; }
  }
  return { transit: maxTime, underfoot: minTime };
}

function windowAround(centerDate, hoursHalfWidth) {
  const ms = hoursHalfWidth * 3_600_000;
  return { start: toIso(new Date(centerDate.getTime() - ms)), end: toIso(new Date(centerDate.getTime() + ms)) };
}

function overlaps(a, b) {
  return new Date(a.start) <= new Date(b.end) && new Date(b.start) <= new Date(a.end);
}

export function computeAstronomy(midnightLocal, lat, lon) {
  // SunCalc buckets events by the UTC calendar day of the timestamp it's given, with no
  // longitude adjustment. For a longitude far west of Greenwich, passing local midnight
  // (only a few hours into the UTC day) can land on the wrong side of that boundary and
  // yield yesterday's sunrise/sunset. Local noon is safely inside the intended UTC day.
  const noonLocal = new Date(midnightLocal.getTime() + 12 * 3_600_000);
  const sun = SunCalc.getTimes(noonLocal, lat, lon);
  const moonTimes = SunCalc.getMoonTimes(noonLocal, lat, lon);
  const illum = SunCalc.getMoonIllumination(noonLocal);

  const { transit, underfoot } = findMoonExtremes(midnightLocal, lat, lon);
  const majors = [transit, underfoot]
    .sort((a, b) => a.getTime() - b.getTime())
    .map((center) => windowAround(center, 1));

  const minors = [];
  if (moonTimes.rise) minors.push(windowAround(moonTimes.rise, 0.5));
  if (moonTimes.set) minors.push(windowAround(moonTimes.set, 0.5));
  minors.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const duskWindow = windowAround(sun.dusk, 0.5);
  const dawnWindow = windowAround(sun.dawn, 0.5);
  let featuredIndex = 0;
  let featuredNote = "";
  majors.forEach((win, i) => {
    if (overlaps(win, duskWindow)) { featuredIndex = i; featuredNote = "Overlaps dusk ✦ best window"; }
    else if (overlaps(win, dawnWindow) && !featuredNote) { featuredIndex = i; featuredNote = "Overlaps dawn ✦ best window"; }
  });

  return {
    sun: {
      dawn: toIso(sun.dawn),
      sunrise: toIso(sun.sunrise),
      sunset: toIso(sun.sunset),
      dusk: toIso(sun.dusk),
    },
    moon: {
      rise: moonTimes.rise ? toIso(moonTimes.rise) : null,
      set: moonTimes.set ? toIso(moonTimes.set) : null,
      illumination: Math.round(illum.fraction * 100) / 100,
      phaseName: phaseName(illum.phase),
    },
    solunar: { majors, minors, featuredIndex, featuredNote },
  };
}
