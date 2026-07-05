import { useThemedCanvas } from "../lib/canvas";
import { drawMoonIcon, drawTideIcon, drawTideSolunarChart } from "../lib/drawings";
import { hourlyTideSeries } from "../lib/tide";
import { tideHeightTier, tierVarString } from "../lib/thresholds";
import { formatTime, hourOfDay, localMidnightIso } from "../lib/time";
import type { Conditions } from "../lib/types";

export function TideSolunarCard({ conditions }: { conditions: Conditions }) {
  const { tide, water, sun, moon, solunar, updated } = conditions;
  const midnight = localMidnightIso(updated);

  const sunrise = hourOfDay(sun.sunrise, midnight);
  const sunset = hourOfDay(sun.sunset, midnight);
  const moonrise = hourOfDay(moon.rise, midnight);
  const moonset = hourOfDay(moon.set, midnight);
  const lastTideEventHour = Math.max(...tide.next.map((e) => hourOfDay(e.time, midnight)));
  const now = hourOfDay(updated, midnight);
  const domainHours = Math.min(30, Math.max(24, Math.ceil(Math.max(sunset, moonset, lastTideEventHour)) + 1));

  const toBand = (win: { start: string; end: string }) => ({
    start: hourOfDay(win.start, midnight),
    end: hourOfDay(win.end, midnight),
  });
  const minors = solunar.minors.map(toBand);
  const majors = solunar.majors.map(toBand);

  const tidePoints = hourlyTideSeries(tide.next, midnight, domainHours);

  const tideIconRef = useThemedCanvas(drawTideIcon, []);
  const moonIconRef = useThemedCanvas((ctx, w, h) => drawMoonIcon(ctx, w, h, moon.illumination), [moon.illumination]);
  const chartRef = useThemedCanvas(
    (ctx, w, h) =>
      drawTideSolunarChart(ctx, w, h, {
        domainHours,
        sunrise,
        sunset,
        moonrise,
        moonset,
        now,
        minors,
        majors,
        tidePoints,
        tideMaxFt: 4.6,
        tideMinFt: 0,
      }),
    [domainHours, sunrise, sunset, moonrise, moonset, now, solunar, tidePoints]
  );

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <canvas ref={tideIconRef} width={22} height={22} />
          Tide &amp; Solunar
        </div>
        <span className="card-sub">NOAA {tide.station} · Lockwood Folly</span>
      </div>
      <div className="forecast-block">
        <canvas ref={chartRef} width={230} height={92} style={{ width: "100%", height: 92, display: "block" }} />
        <div className="forecast-legend">
          <span>
            <span className="dot" style={{ background: "var(--tide)" }} />
            Tide
          </span>
          <span>
            <span className="dot" style={{ background: "var(--ink-soft)" }} />
            Moon
          </span>
          <span>
            <span className="dot" style={{ background: "var(--good)", opacity: 0.4 }} />
            Minor
          </span>
          <span>
            <span className="dot" style={{ background: "var(--good)" }} />
            Major feed
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
      <div className="card-line">Next</div>
      {tide.next.map((event, i) => {
        const tier = tideHeightTier(event.heightFt, tide.thresholds.superHighFt, tide.thresholds.superLowFt);
        return (
          <div className="card-line" key={i}>
            {event.type} · {formatTime(event.time)}{" "}
            <b style={tier ? { color: tierVarString(tier) } : undefined}>{event.heightFt.toFixed(1)} ft</b>
          </div>
        );
      })}
      <div className="card-line">
        Water temp <b>{water.tempF}°F</b>
      </div>
      <div className="card-line">
        Clarity <b>{water.clarity}</b>
      </div>
      <div className="card-line">
        Cape Fear discharge <b>{water.riverDischarge}</b>
      </div>
      <div className="card-note">
        Green ≥ {tide.thresholds.superHighFt.toFixed(1)} ft (super high) · Red ≤ {tide.thresholds.superLowFt.toFixed(1)} ft (super low)
      </div>
      <div className="card-note">
        <span className="tag caution">Runoff</span> &nbsp;{water.note}
      </div>
      <div className="card-note-row card-note-row-lg">
        <canvas ref={moonIconRef} width={48} height={48} />
        {moon.phaseName} · {Math.round(moon.illumination * 100)}% illuminated
      </div>
    </div>
  );
}
