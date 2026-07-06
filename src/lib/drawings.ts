import { cssVar } from "./canvas";

export function drawLighthouse(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const ink = cssVar("--ink");
  const accent = cssVar("--accent");
  const sx = w / 44;
  const sy = h / 48;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(16 * sx, 44 * sy); ctx.lineTo(20 * sx, 6 * sy); ctx.lineTo(24 * sx, 6 * sy); ctx.lineTo(28 * sx, 44 * sy); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13 * sx, 44 * sy); ctx.lineTo(31 * sx, 44 * sy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(17.5 * sx, 30 * sy); ctx.lineTo(26.5 * sx, 30 * sy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(18.5 * sx, 17 * sy); ctx.lineTo(25.5 * sx, 17 * sy); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(22 * sx, 9.5 * sy, 2.1 * Math.min(sx, sy), 0, Math.PI * 2); ctx.fill();
}

export function drawBathymetry(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = cssVar("--line");
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const amp = 14 + i * 4;
    const yBase = h - 10 - i * 34;
    const freq = 0.012 + i * 0.002;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const y = yBase + Math.sin(x * freq + i) * amp;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

export function drawGauge(ctx: CanvasRenderingContext2D, w: number, h: number, value: number) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 12;
  const start = -Math.PI / 2, end = start + Math.PI * 2 * (value / 100);
  ctx.lineCap = "round";
  ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = cssVar("--good"); ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(cx, cy, r, start, end); ctx.stroke();
  ctx.fillStyle = cssVar("--ink");
  ctx.font = "700 2.6rem " + cssVar("--font-mono");
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(String(value), cx, cy - 6);
  ctx.fillStyle = cssVar("--ink-faint");
  ctx.font = "11px " + cssVar("--font-body");
  ctx.fillText("BITE SCORE / 100", cx, cy + 26);
}

/** Traces a Catmull-Rom spline through `pts` so the curve reads as smooth rather than segmented. */
function traceSmoothPath(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  if (pts.length < 3) {
    pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    return;
  }
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : pts.length - 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
  }
}

export function drawSparkline(ctx: CanvasRenderingContext2D, w: number, h: number, points: number[], color?: string) {
  const max = Math.max(...points), min = Math.min(...points), pad = 4;
  const xAt = (i: number) => pad + (w - pad * 2) * (i / (points.length - 1));
  const yAt = (v: number) => h - pad - (h - pad * 2) * ((v - min) / (max - min || 1));
  ctx.beginPath();
  points.forEach((v, i) => { const x = xAt(i), y = yAt(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.strokeStyle = color ?? cssVar("--good"); ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
  const lastX = xAt(points.length - 1), lastY = yAt(points[points.length - 1]);
  ctx.fillStyle = color ?? cssVar("--good");
  ctx.beginPath(); ctx.arc(lastX, lastY, 3, 0, Math.PI * 2); ctx.fill();
}

export interface HourBarItem {
  label: string;
  value: number;
  storm?: boolean;
  /** Wind direction (degrees the wind blows from) drawn as an arrow above the bar. */
  windDirDeg?: number;
  windSpeedMph?: number;
  /** Optional short text drawn in the fixed band above the bar (e.g. precip inches). */
  topLabel?: string;
}

/** Shared hourly bar-chart renderer used for both the wave and rain forecasts. */
export function drawHourBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  items: HourBarItem[],
  opts: {
    max: number;
    colorFor: (value: number) => string;
    valueLabel: (value: number) => string;
    boltColor?: string;
    refLines?: number[];
    windArrows?: boolean;
    arrowColor?: string;
    topLabelColor?: string;
  }
) {
  const pad = 4, bottomPad = 14;
  // Fixed bands stacked at the top of each column, above the (floating) value label.
  const boltBand = opts.boltColor ? 11 : 0;
  const infoBand = opts.windArrows || items.some((it) => it.topLabel) ? 22 : 0;
  const valueBand = 12;
  const topPad = boltBand + infoBand + valueBand;
  const slot = (w - pad * 2) / items.length;
  const barW = slot * 0.46;

  if (opts.refLines) {
    ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    opts.refLines.forEach((t) => {
      const y = h - bottomPad - (h - topPad - bottomPad) * (t / opts.max);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  const arrowColor = opts.arrowColor ?? cssVar("--ink-soft");
  const topLabelColor = opts.topLabelColor ?? cssVar("--ink-soft");

  items.forEach((item, i) => {
    const cx = pad + slot * i + slot / 2;
    const x = cx - barW / 2;
    const barH = (h - topPad - bottomPad) * (item.value / opts.max);
    const top = h - bottomPad - barH;
    const color = opts.colorFor(item.value);

    ctx.fillStyle = cssVar("--line");
    ctx.fillRect(x, topPad - 6, barW, h - (topPad - 6) - bottomPad);
    if (opts.refLines) {
      ctx.fillStyle = color;
      ctx.fillRect(x, top, barW, barH);
    } else {
      ctx.globalAlpha = 0.35 + 0.65 * (item.value / opts.max);
      ctx.fillStyle = color;
      ctx.fillRect(x, top, barW, barH);
      ctx.globalAlpha = 1;
    }

    // Wind arrow + speed (waves tile).
    if (opts.windArrows && typeof item.windDirDeg === "number") {
      const ay = boltBand + 8;
      ctx.save();
      ctx.translate(cx, ay);
      ctx.rotate(((item.windDirDeg + 180) * Math.PI) / 180);
      ctx.strokeStyle = arrowColor; ctx.fillStyle = arrowColor; ctx.lineWidth = 1.4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(-3.5, -2); ctx.lineTo(3.5, -2); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (typeof item.windSpeedMph === "number") {
        ctx.fillStyle = arrowColor;
        ctx.font = "600 8.5px " + cssVar("--font-mono");
        ctx.textAlign = "center";
        ctx.fillText(String(item.windSpeedMph), cx, boltBand + infoBand - 1);
      }
    }

    // Fixed top-band text (e.g. precip inches on the weather tile).
    if (item.topLabel) {
      ctx.fillStyle = topLabelColor;
      ctx.font = "600 8.5px " + cssVar("--font-mono");
      ctx.textAlign = "center";
      ctx.fillText(item.topLabel, cx, boltBand + 12);
    }

    ctx.fillStyle = cssVar("--ink-soft");
    ctx.font = "600 9.5px " + cssVar("--font-mono");
    ctx.textAlign = "center";
    const labelY = Math.max(top - 4, boltBand + infoBand + 9);
    ctx.fillText(opts.valueLabel(item.value), cx, labelY);

    if (item.storm && opts.boltColor) {
      const bx = cx, by = pad + 5;
      ctx.strokeStyle = opts.boltColor; ctx.fillStyle = opts.boltColor; ctx.lineWidth = 1.4; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(bx + 2, by - 6);
      ctx.lineTo(bx - 3, by + 1);
      ctx.lineTo(bx, by + 1);
      ctx.lineTo(bx - 2, by + 7);
      ctx.lineTo(bx + 3, by - 1);
      ctx.lineTo(bx, by - 1);
      ctx.closePath();
      ctx.fill();
    }
  });
}

export interface SolunarBand {
  start: number;
  end: number;
}

export interface TideSolunarChartOptions {
  domainHours: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  now: number;
  minors?: SolunarBand[];
  majors?: SolunarBand[];
  /** Hourly tide heights (ft) for hours 0..domainHours since local midnight, one per hour. */
  tidePoints: number[];
  tideMaxFt: number;
  tideMinFt: number;
}

export function drawTideSolunarChart(ctx: CanvasRenderingContext2D, w: number, h: number, opts: TideSolunarChartOptions) {
  const { domainHours, sunrise, sunset, moonrise, moonset, now, tidePoints, tideMaxFt, tideMinFt } = opts;
  const pad = 4, topPad = 8, bottomPad = 16;
  const baseline = h - bottomPad;
  const tideTop = topPad + 6, tideBottom = baseline - 6;
  const xAt = (hr: number) => pad + (w - pad * 2) * (hr / domainHours);
  const tideYAt = (ft: number) => tideBottom - (tideBottom - tideTop) * ((ft - tideMinFt) / (tideMaxFt - tideMinFt));

  ctx.fillStyle = cssVar("--bg-recessed");
  ctx.fillRect(0, 0, xAt(sunrise), h);
  ctx.fillRect(xAt(sunset), 0, w - xAt(sunset), h);

  // Tide curve: hourly-sampled heights (see hourlyTideSeries) traced as a smooth
  // curve and filled, in a distinct color from the sun/moon arcs.
  const tidePath = tidePoints.map((ft, i) => ({ x: xAt(i), y: tideYAt(ft) }));
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, cssVar("--tide-soft"));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  traceSmoothPath(ctx, tidePath);
  ctx.lineTo(xAt(tidePoints.length - 1), baseline); ctx.lineTo(xAt(0), baseline); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath();
  traceSmoothPath(ctx, tidePath);
  ctx.strokeStyle = cssVar("--tide"); ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();

  ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, baseline); ctx.lineTo(w, baseline); ctx.stroke();

  // Solunar feeding windows, as a timeline strip just below the baseline:
  // light green for minor windows, solid (darker) green for major windows.
  const stripTop = baseline + 3, stripH = 5;
  const green = cssVar("--good");
  const drawBand = (band: SolunarBand, alpha: number) => {
    const x0 = Math.max(pad, xAt(Math.max(0, band.start)));
    const x1 = Math.min(w - pad, xAt(Math.min(domainHours, band.end)));
    if (x1 <= x0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = green;
    ctx.fillRect(x0, stripTop, x1 - x0, stripH);
    ctx.globalAlpha = 1;
  };
  (opts.minors ?? []).forEach((b) => drawBand(b, 0.4));
  (opts.majors ?? []).forEach((b) => drawBand(b, 1));

  ctx.fillStyle = cssVar("--ink-faint");
  ctx.font = "9.5px " + cssVar("--font-mono");
  ctx.textAlign = "center";
  [0, 6, 12, 18, 24].forEach((hr) => {
    if (hr > domainHours) return;
    const label = hr === 0 || hr === 24 ? "12a" : hr === 12 ? "12p" : hr < 12 ? `${hr}a` : `${hr - 12}p`;
    ctx.fillText(label, xAt(hr), h - 3);
  });

  const archY = (hr: number, rise: number, set: number, archH: number) => {
    const f = Math.max(0, Math.min(1, (hr - rise) / (set - rise)));
    return baseline - Math.sin(f * Math.PI) * archH;
  };
  const drawArc = (rise: number, set: number, archH: number, color: string, dashed: boolean) => {
    ctx.beginPath();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = "round";
    ctx.setLineDash(dashed ? [4, 3] : []);
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const hr = rise + (set - rise) * (i / steps);
      const x = xAt(hr), y = archY(hr, rise, set, archH);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const moonArchH = h * 0.42;
  drawArc(moonrise, moonset, moonArchH, cssVar("--ink-soft"), true);

  const nowX = xAt(now);
  ctx.strokeStyle = cssVar("--ink-faint"); ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(nowX, topPad); ctx.lineTo(nowX, baseline); ctx.stroke();
  ctx.setLineDash([]);

  if (now >= moonrise && now <= moonset) {
    const my = archY(now, moonrise, moonset, moonArchH);
    ctx.fillStyle = cssVar("--ink-soft");
    ctx.beginPath(); ctx.arc(nowX, my, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  if (now >= 0 && now <= domainHours) {
    const nowIdx = Math.max(0, Math.min(tidePoints.length - 1, now));
    const lowerIdx = Math.max(0, Math.min(tidePoints.length - 2, Math.floor(nowIdx)));
    const frac = nowIdx - lowerIdx;
    const nowValue = tidePoints[lowerIdx] + (tidePoints[lowerIdx + 1] - tidePoints[lowerIdx]) * frac;
    ctx.fillStyle = cssVar("--tide");
    ctx.beginPath(); ctx.arc(nowX, tideYAt(nowValue), 3, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawSunIcon(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2, r = w * 0.2;
  ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 1.4; ctx.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r + 2), cy + Math.sin(a) * (r + 2));
    ctx.lineTo(cx + Math.cos(a) * (r + 6), cy + Math.sin(a) * (r + 6));
    ctx.stroke();
  }
  ctx.fillStyle = cssVar("--accent");
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
}

export function drawMoonIcon(ctx: CanvasRenderingContext2D, w: number, h: number, illum: number) {
  const cx = w / 2, cy = h / 2, r = w * 0.36;
  ctx.fillStyle = cssVar("--ink-faint");
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = cssVar("--accent-ink");
  const off = (1 - 2 * illum) * r;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.beginPath(); ctx.ellipse(cx + off, cy, Math.abs(r), r, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawWaveIcon(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 1.6; ctx.lineCap = "round";
  [0.4, 0.65, 0.9].forEach((yf, i) => {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const y = h * yf + Math.sin(x * 0.35 + i * 2) * 2.2;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.globalAlpha = 1 - i * 0.28;
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

export function drawWindIcon(ctx: CanvasRenderingContext2D, w: number, h: number, fromDeg?: number) {
  const cx = w / 2, cy = h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  if (typeof fromDeg === "number") ctx.rotate(((fromDeg + 180) * Math.PI) / 180);
  ctx.strokeStyle = cssVar("--accent"); ctx.fillStyle = cssVar("--accent"); ctx.lineWidth = 1.6; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(-4, -3); ctx.lineTo(4, -3); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawPressureIcon(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2, r = w * 0.36;
  ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI * 0.15);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r + 2); ctx.stroke(); ctx.restore();
  ctx.fillStyle = cssVar("--accent"); ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
}

export function drawDropletIcon(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, top = h * 0.15, r = w * 0.26;
  ctx.fillStyle = cssVar("--accent");
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.quadraticCurveTo(cx + r * 1.3, h * 0.55, cx, h - 3);
  ctx.quadraticCurveTo(cx - r * 1.3, h * 0.55, cx, top);
  ctx.fill();
}

export function drawTideIcon(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 1.6; ctx.lineCap = "round";
  ctx.beginPath();
  for (let x = 0; x <= w; x += 2) {
    const y = h * 0.55 + Math.sin(x * 0.5) * 5;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.72, h * 0.2); ctx.lineTo(w * 0.72, h * 0.8); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.72, h * 0.2); ctx.lineTo(w * 0.6, h * 0.34);
  ctx.moveTo(w * 0.72, h * 0.2); ctx.lineTo(w * 0.84, h * 0.34);
  ctx.stroke();
}

const DIR_DEG: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

export function windDirDegrees(label: string): number {
  return DIR_DEG[label] ?? 0;
}

export function drawWindArrowSmall(ctx: CanvasRenderingContext2D, w: number, h: number, fromDeg: number) {
  const cx = w / 2, cy = h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((fromDeg + 180) * Math.PI) / 180);
  ctx.strokeStyle = cssVar("--ink-soft"); ctx.fillStyle = cssVar("--ink-soft"); ctx.lineWidth = 1.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(-4, -3); ctx.lineTo(4, -3); ctx.closePath(); ctx.fill();
  ctx.restore();
}

/**
 * Vertical strip of stacked hourly cells (midnight at top, 11pm at bottom),
 * colored by wind speed — the trip planner's Windy-style wind heatmap.
 * `hours` is indexed by hour-of-day (0-23); a missing slot is left blank.
 */
export function drawWindHeatStrip(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hours: (number | undefined)[],
  colorFor: (mph: number) => string
) {
  const rows = 24;
  const rowH = h / rows;
  for (let hour = 0; hour < rows; hour++) {
    const mph = hours[hour];
    ctx.fillStyle = mph == null ? cssVar("--line") : colorFor(mph);
    ctx.fillRect(0, hour * rowH, w, rowH + 0.5);
  }
}

export function drawWaveBarSmall(ctx: CanvasRenderingContext2D, w: number, h: number, value: number, max: number, color: string) {
  const barW = 22;
  const barH = (h - 6) * (value / max);
  ctx.fillStyle = cssVar("--line");
  ctx.fillRect(w / 2 - barW / 2, 2, barW, h - 4);
  ctx.fillStyle = color;
  ctx.fillRect(w / 2 - barW / 2, h - 2 - barH, barW, barH);
}
