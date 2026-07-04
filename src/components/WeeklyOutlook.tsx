import { useThemedCanvas } from "../lib/canvas";
import { drawWaveBarSmall, drawWindArrowSmall, windDirDegrees } from "../lib/drawings";
import { tierResolvedColor } from "../lib/thresholds";
import { formatDateShort, formatDayShort } from "../lib/time";
import type { WeeklyDay } from "../lib/types";

function DayColumn({ day, isToday }: { day: WeeklyDay; isToday: boolean }) {
  const windRef = useThemedCanvas((ctx, w, h) => drawWindArrowSmall(ctx, w, h, windDirDegrees(day.windDir)), [day.windDir]);
  const barRef = useThemedCanvas(
    (ctx, w, h) => drawWaveBarSmall(ctx, w, h, day.waveFt, 4, tierResolvedColor(day.tier)),
    [day.waveFt, day.tier]
  );

  return (
    <div className={`day-col${isToday ? " today" : ""}`}>
      <div className="day-name">{formatDayShort(day.date)}</div>
      <div className="day-date">{formatDateShort(day.date)}</div>
      <canvas ref={windRef} width={26} height={26} />
      <div className="wind-row">
        <span className="wind-speed">{day.windMph} mph</span>
        <span className="wind-dir">{day.windDir}</span>
      </div>
      <canvas ref={barRef} width={60} height={34} />
      <div className="wave-fig">{day.waveFt.toFixed(1)} ft</div>
      <div className={`score-pill ${day.tier}`}>{day.score}</div>
    </div>
  );
}

export function WeeklyOutlook({ days }: { days: WeeklyDay[] }) {
  return (
    <section className="outlook">
      <div className="outlook-head">
        <h2>7-day trip planner</h2>
        <p>Wind, wave height, and bite score for the week ahead</p>
      </div>
      <div className="outlook-scroll">
        <div className="outlook-table">
          {days.map((day, i) => (
            <DayColumn day={day} isToday={i === 0} key={day.date} />
          ))}
        </div>
      </div>
    </section>
  );
}
