import { useThemedCanvas } from "../lib/canvas";
import { drawBathymetry, drawGauge } from "../lib/drawings";
import { formatTime } from "../lib/time";
import type { Conditions } from "../lib/types";

export function Hero({ conditions }: { conditions: Conditions }) {
  const bathyRef = useThemedCanvas(drawBathymetry, []);
  const { biteScore, solunar } = conditions;
  const gaugeRef = useThemedCanvas((ctx, w, h) => drawGauge(ctx, w, h, biteScore.value), [biteScore.value]);

  const majors = solunar.majors.map((win, i) => ({
    ...win,
    kind: "Major",
    featured: i === solunar.featuredIndex,
  }));

  return (
    <section className="hero">
      <canvas ref={bathyRef} className="hero-bathymetry" width={1180} height={260} aria-hidden="true" />
      <div className="hero-gauge">
        <canvas
          ref={gaugeRef}
          width={180}
          height={180}
          role="img"
          aria-label={`Bite score ${biteScore.value} out of 100, ${biteScore.verdict}`}
        />
      </div>
      <div className="hero-detail">
        <h2>{biteScore.headline}</h2>
        <div className="factor-row">
          {biteScore.reasons.map((reason, i) => (
            <span className={`chip ${reason.tier}`} key={i}>
              <span className="dot" />
              {reason.text}
            </span>
          ))}
        </div>
        <div className="solunar">
          {majors.map((win, i) => (
            <div className={`solunar-card${win.featured ? " featured" : ""}`} key={i}>
              <div className="solunar-kind">{win.kind}{i === 0 ? " · AM" : " · PM"}</div>
              <div className="solunar-time">
                {formatTime(win.start)} – {formatTime(win.end)}
              </div>
              {win.featured && <div className="solunar-note">{solunar.featuredNote}</div>}
            </div>
          ))}
          <div className="solunar-card">
            <div className="solunar-kind">Minor</div>
            <div className="solunar-time">
              {solunar.minors.map((win) => formatTime(win.start)).join(" · ")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
