import { useThemedCanvas } from "../lib/canvas";
import { drawPressureIcon, drawSparkline } from "../lib/drawings";
import type { Conditions } from "../lib/types";

const TREND_LABEL: Record<Conditions["pressure"]["trend"], string> = {
  steady: "Steady",
  rising: "Rising",
  falling: "Falling",
};

export function PressureCard({ conditions }: { conditions: Conditions }) {
  const { pressure } = conditions;

  const iconRef = useThemedCanvas(drawPressureIcon, []);
  const sparkRef = useThemedCanvas((ctx, w, h) => drawSparkline(ctx, w, h, pressure.last24h), [pressure.last24h]);

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <canvas ref={iconRef} width={22} height={22} />
          Pressure
        </div>
        <span className="card-sub">trailing 24h</span>
      </div>
      <div className="card-figure">
        {pressure.current.toFixed(2)}
        <span className="unit">inHg</span>
      </div>
      <canvas ref={sparkRef} width={230} height={46} style={{ width: "100%", height: 46, display: "block", margin: "8px 0" }} />
      <div className="card-note">
        <span className="tag good">{TREND_LABEL[pressure.trend]}</span> &nbsp;{pressure.trendNote}
      </div>
    </div>
  );
}
