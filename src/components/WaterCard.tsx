import { useThemedCanvas } from "../lib/canvas";
import { drawDropletIcon } from "../lib/drawings";
import type { Conditions } from "../lib/types";

export function WaterCard({ conditions }: { conditions: Conditions }) {
  const { water } = conditions;
  const iconRef = useThemedCanvas(drawDropletIcon, []);

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <canvas ref={iconRef} width={22} height={22} />
          Water
        </div>
        <span className="card-sub">nearshore estimate</span>
      </div>
      <div className="card-figure">
        {water.tempF}
        <span className="unit">°F</span>
      </div>
      <div className="card-line">
        Clarity <b>{water.clarity}</b>
      </div>
      <div className="card-line">
        Cape Fear discharge <b>{water.riverDischarge}</b>
      </div>
      <div className="card-note">
        <span className="tag caution">Runoff</span> &nbsp;{water.note}
      </div>
    </div>
  );
}
