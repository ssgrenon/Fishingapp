import { useThemedCanvas, cssVar } from "../lib/canvas";
import { drawHourBars, drawWaveIcon, windDirDegrees } from "../lib/drawings";
import { tierResolvedColor, tierVarString, waveHeightTier } from "../lib/thresholds";
import type { Conditions } from "../lib/types";

export function WavesCard({ conditions }: { conditions: Conditions }) {
  const { waves } = conditions;
  const { calmMaxFt, moderateMaxFt } = waves.thresholds;

  const iconRef = useThemedCanvas(drawWaveIcon, []);
  const forecastRef = useThemedCanvas(
    (ctx, w, h) =>
      drawHourBars(
        ctx,
        w,
        h,
        waves.next6h.map((p) => ({
          label: p.label,
          value: p.heightFt ?? 0,
          windDirDeg: p.windDirLabel != null ? windDirDegrees(p.windDirLabel) : undefined,
          windSpeedMph: p.windSpeedMph,
        })),
        {
          max: 4,
          colorFor: (v) => tierResolvedColor(waveHeightTier(v, calmMaxFt, moderateMaxFt)),
          valueLabel: (v) => v.toFixed(1),
          refLines: [calmMaxFt, moderateMaxFt],
          windArrows: true,
          arrowColor: cssVar("--accent"),
        }
      ),
    [waves.next6h, calmMaxFt, moderateMaxFt]
  );

  const figureColor = tierVarString(waveHeightTier(waves.current.heightFt, calmMaxFt, moderateMaxFt));

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <canvas ref={iconRef} width={22} height={22} />
          Waves
        </div>
        <span className="card-sub">{waves.source}</span>
      </div>
      <div className="forecast-block">
        <div className="forecast-label">
          Waves &amp; wind · −2h to +4h <span className="card-sub">Open-Meteo</span>
        </div>
        <canvas ref={forecastRef} width={230} height={96} style={{ width: "100%", height: 96, display: "block" }} />
        <div className="forecast-hours">
          {waves.next6h.map((p) => (
            <span key={p.label}>{p.label}</span>
          ))}
        </div>
        <div className="forecast-legend">
          <span>
            <span className="dot" style={{ background: "var(--accent)" }} />
            ↑ wind dir · mph
          </span>
          <span>
            <span className="dot" style={{ background: "var(--good)" }} />
            Calm &lt; {calmMaxFt.toFixed(1)}
          </span>
          <span>
            <span className="dot" style={{ background: "var(--caution)" }} />
            Moderate {calmMaxFt.toFixed(1)}–{moderateMaxFt.toFixed(1)}
          </span>
          <span>
            <span className="dot" style={{ background: "var(--critical)" }} />
            Rough &gt; {moderateMaxFt.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="card-figure" style={{ color: figureColor }}>
        {waves.current.heightFt != null ? waves.current.heightFt.toFixed(1) : "—"}
        <span className="unit">ft</span>
      </div>
      <div className="card-line">
        Period <b>{waves.current.periodSec != null ? `${waves.current.periodSec} s` : "—"}</b>
      </div>
      <div className="card-line">
        Swell direction <b>{waves.current.direction ?? "—"}</b>
      </div>
      <div className="card-line">
        Chop <b>{waves.current.chop}</b>
      </div>
    </div>
  );
}
