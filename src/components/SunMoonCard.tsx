import { useThemedCanvas } from "../lib/canvas";
import { drawMoonIcon, drawSkyArc, drawSunIcon } from "../lib/drawings";
import { formatTime, hourOfDay, localMidnightIso } from "../lib/time";
import type { Conditions } from "../lib/types";

export function SunMoonCard({ conditions }: { conditions: Conditions }) {
  const { sun, moon, updated } = conditions;
  const midnight = localMidnightIso(updated);

  const sunrise = hourOfDay(sun.sunrise, midnight);
  const sunset = hourOfDay(sun.sunset, midnight);
  const moonrise = hourOfDay(moon.rise, midnight);
  const moonset = hourOfDay(moon.set, midnight);
  const now = hourOfDay(updated, midnight);
  const domainHours = Math.min(30, Math.max(24, Math.ceil(Math.max(sunset, moonset)) + 1));

  const sunIconRef = useThemedCanvas(drawSunIcon, []);
  const moonIconRef = useThemedCanvas((ctx, w, h) => drawMoonIcon(ctx, w, h, moon.illumination), [moon.illumination]);
  const arcRef = useThemedCanvas(
    (ctx, w, h) => drawSkyArc(ctx, w, h, { domainHours, sunrise, sunset, moonrise, moonset, now }),
    [domainHours, sunrise, sunset, moonrise, moonset, now]
  );

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <canvas ref={sunIconRef} width={22} height={22} />
          Sun &amp; Moon
        </div>
        <span className="card-sub">civil twilight ±26m</span>
      </div>
      <div className="forecast-block">
        <canvas ref={arcRef} width={230} height={92} style={{ width: "100%", height: 92, display: "block" }} />
        <div className="forecast-legend">
          <span>
            <span className="dot" style={{ background: "var(--accent)" }} />
            Sun
          </span>
          <span>
            <span className="dot" style={{ background: "var(--ink-soft)" }} />
            Moon
          </span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
            Now <b>{formatTime(updated)}</b>
          </span>
        </div>
      </div>
      <div className="card-line">
        Dawn <b>{formatTime(sun.dawn)}</b>
      </div>
      <div className="card-line">
        Dusk <b>{formatTime(sun.dusk)}</b>
      </div>
      <div className="card-line">
        Moonrise <b>{formatTime(moon.rise)}</b>
      </div>
      <div className="card-line">
        Moonset <b>{formatTime(moon.set)}</b>
      </div>
      <div className="card-note card-note-row">
        <canvas ref={moonIconRef} width={26} height={26} />
        {moon.phaseName} · {Math.round(moon.illumination * 100)}% illuminated
      </div>
    </div>
  );
}
