import { useThemedCanvas } from "../lib/canvas";
import { drawTideCurve, drawTideIcon } from "../lib/drawings";
import { tideHeightTier, tierVarString } from "../lib/thresholds";
import { formatTime, hourOfDay, localMidnightIso } from "../lib/time";
import type { Conditions } from "../lib/types";

export function TideCard({ conditions }: { conditions: Conditions }) {
  const { tide, water, updated } = conditions;
  const midnight = localMidnightIso(updated);
  const nowFraction = Math.max(0, Math.min(1, hourOfDay(updated, midnight) / 24));

  const iconRef = useThemedCanvas(drawTideIcon, []);
  const curveRef = useThemedCanvas(
    (ctx, w, h) => drawTideCurve(ctx, w, h, tide.curvePoints, nowFraction),
    [tide.curvePoints, nowFraction]
  );

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <canvas ref={iconRef} width={22} height={22} />
          Tide &amp; Water
        </div>
        <span className="card-sub">NOAA {tide.station}</span>
      </div>
      <canvas ref={curveRef} width={230} height={64} style={{ width: "100%", height: 64, display: "block", marginBottom: 10 }} />
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
    </div>
  );
}
