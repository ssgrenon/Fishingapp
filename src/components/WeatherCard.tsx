import { useThemedCanvas, cssVar } from "../lib/canvas";
import { drawHourBars, drawWindIcon, windDirDegrees } from "../lib/drawings";
import type { Conditions } from "../lib/types";

export function WeatherCard({ conditions }: { conditions: Conditions }) {
  const { weather } = conditions;
  const windDirDeg = windDirDegrees(weather.windDirLabel);

  const iconRef = useThemedCanvas((ctx, w, h) => drawWindIcon(ctx, w, h, windDirDeg), [windDirDeg]);
  const rainRef = useThemedCanvas(
    (ctx, w, h) =>
      drawHourBars(
        ctx,
        w,
        h,
        weather.rainNext6h.map((p) => ({
          label: p.label,
          value: p.pct ?? 0,
          storm: p.storm,
          topLabel: p.precipIn != null ? `${p.precipIn.toFixed(2)}"` : undefined,
        })),
        {
          max: 100,
          colorFor: () => cssVar("--ink-soft"),
          valueLabel: (v) => `${v}%`,
          boltColor: cssVar("--critical"),
          topLabelColor: cssVar("--accent-ink"),
        }
      ),
    [weather.rainNext6h]
  );

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <canvas ref={iconRef} width={22} height={22} role="img" aria-label={`Wind from the ${weather.windDirLabel}`} />
          Weather
        </div>
        <span className="card-sub">{weather.source}</span>
      </div>
      <div className="forecast-block">
        <div className="forecast-label">
          Rain chance &amp; precip · −2h to +4h <span className="card-sub">Open-Meteo</span>
        </div>
        <canvas ref={rainRef} width={230} height={96} style={{ width: "100%", height: 96, display: "block" }} />
        <div className="forecast-hours">
          {weather.rainNext6h.map((p) => (
            <span key={p.label}>{p.label}</span>
          ))}
        </div>
        <div className="forecast-legend">
          <span style={{ color: "var(--accent-ink)" }}>Top: projected rainfall (in)</span>
          <span>Bars: chance of rain (%)</span>
        </div>
        {weather.stormRisk.present && (
          <div className="storm-alert caution">
            <span className="dot" />
            <span>Thunderstorms possible, most likely {weather.stormRisk.windowLabel}</span>
          </div>
        )}
      </div>
      <div className="card-figure">
        {weather.tempF}
        <span className="unit">°F</span>
      </div>
      <div className="card-line">
        Conditions <b>{weather.conditions}</b>
      </div>
      <div className="card-line">
        Wind <b>{weather.windDirLabel} {weather.windMph} mph, G{weather.windGustMph}</b>
      </div>
      <div className="card-line">
        Humidity <b>{weather.humidityPct}%</b>
      </div>
    </div>
  );
}
