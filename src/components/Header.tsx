import { useThemedCanvas } from "../lib/canvas";
import { drawLighthouse } from "../lib/drawings";
import { formatLongDate, formatTime } from "../lib/time";
import type { Conditions } from "../lib/types";

export function Header({ conditions }: { conditions: Conditions }) {
  const ref = useThemedCanvas(drawLighthouse, []);

  return (
    <header className="station">
      <div className="station-id">
        <canvas ref={ref} width={40} height={48} aria-hidden="true" />
        <div>
          <p className="station-name">Oak Island Conditions</p>
          <p className="station-meta">
            {conditions.location.lat.toFixed(4)}°N&nbsp;{Math.abs(conditions.location.lon).toFixed(4)}°W · Lockwood
            Folly Inlet to Frying&nbsp;Pan&nbsp;Shoals
          </p>
        </div>
      </div>
      <div className="station-right">
        <div className="date">{formatLongDate(conditions.updated)}</div>
        <div>Updated {formatTime(conditions.updated)} ET</div>
      </div>
    </header>
  );
}
