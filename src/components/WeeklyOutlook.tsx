import { useThemedCanvas } from "../lib/canvas";
import { drawWaveBarSmall, drawWindArrowSmall, drawWindHeatStrip, windDirDegrees } from "../lib/drawings";
import { tierResolvedColor } from "../lib/thresholds";
import { formatDateShort, formatDayShort } from "../lib/time";
import { windSpeedColor, windSpeedGradientCss, WIND_COLOR_MAX_MPH } from "../lib/windColor";
import type { WeeklyDay } from "../lib/types";

const HEAT_STRIP_HEIGHT = 144; // 24 hourly rows, 6px each
const RULER_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

function hourTickLabel(hour: number) {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  return hour < 12 ? `${hour}a` : `${hour - 12}p`;
}

function HourRuler() {
  return (
    <div className="hour-ruler">
      {/* Matches DayColumn's day-name/day-date so the strip below lines up with the wind-heat canvas. */}
      <div className="day-name" style={{ visibility: "hidden" }}>Sun</div>
      <div className="day-date" style={{ visibility: "hidden" }}>Jan 1</div>
      <div className="hour-ruler-strip" style={{ height: HEAT_STRIP_HEIGHT }}>
        {RULER_HOURS.map((hour) => (
          <span key={hour} style={{ top: `${(hour / 24) * 100}%` }}>
            {hourTickLabel(hour)}
          </span>
        ))}
      </div>
    </div>
  );
}

function DayColumn({ day, isToday }: { day: WeeklyDay; isToday: boolean }) {
  const windRef = useThemedCanvas((ctx, w, h) => drawWindArrowSmall(ctx, w, h, windDirDegrees(day.windDir)), [day.windDir]);
  const barRef = useThemedCanvas(
    (ctx, w, h) => drawWaveBarSmall(ctx, w, h, day.waveFt, 4, tierResolvedColor(day.tier)),
    [day.waveFt, day.tier]
  );
  const heatRef = useThemedCanvas(
    (ctx, w, h) => {
      const byHour: (number | undefined)[] = [];
      day.hourlyWind.forEach((hw) => { byHour[hw.hour] = hw.mph; });
      drawWindHeatStrip(ctx, w, h, byHour, windSpeedColor);
    },
    [day.hourlyWind]
  );

  return (
    <div className={`day-col${isToday ? " today" : ""}`}>
      <div className="day-name">{formatDayShort(day.date)}</div>
      <div className="day-date">{formatDateShort(day.date)}</div>
      {day.hourlyWind.length > 0 && (
        <canvas
          ref={heatRef}
          className="wind-heat-strip"
          width={90}
          height={HEAT_STRIP_HEIGHT}
          style={{ width: "100%", height: HEAT_STRIP_HEIGHT }}
        />
      )}
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
  const hasHourly = days.some((d) => d.hourlyWind.length > 0);

  return (
    <section className="outlook">
      <div className="outlook-head">
        <h2>7-day trip planner</h2>
        <p>Wind, wave height, and bite score for the week ahead</p>
      </div>
      <div className="outlook-scroll">
        <div className="outlook-table">
          {hasHourly && <HourRuler />}
          {days.map((day, i) => (
            <DayColumn day={day} isToday={i === 0} key={day.date} />
          ))}
        </div>
      </div>
      {hasHourly && (
        <div className="wind-legend">
          <span>Hourly wind</span>
          <span>0</span>
          <span className="wind-legend-bar" style={{ background: windSpeedGradientCss() }} />
          <span>{WIND_COLOR_MAX_MPH}+ mph</span>
        </div>
      )}
    </section>
  );
}
