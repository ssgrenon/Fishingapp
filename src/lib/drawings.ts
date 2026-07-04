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

export function drawTideCurve(ctx: CanvasRenderingContext2D, w: number, h: number, points: number[], nowFraction: number) {
  const max = 4.6, min = 0, pad = 6;
  const xAt = (i: number) => pad + (w - pad * 2) * (i / (points.length - 1));
  const yAt = (v: number) => h - pad - (h - pad * 2) * ((v - min) / (max - min));

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, cssVar("--accent-soft"));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  points.forEach((v, i) => { const x = xAt(i), y = yAt(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.lineTo(xAt(points.length - 1), h); ctx.lineTo(xAt(0), h); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath();
  points.forEach((v, i) => { const x = xAt(i), y = yAt(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.strokeStyle = cssVar("--accent"); ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();

  const nowIdx = nowFraction * (points.length - 1);
  const lowerIdx = Math.max(0, Math.min(points.length - 2, Math.floor(nowIdx)));
  const frac = nowIdx - lowerIdx;
  const nowValue = points[lowerIdx] + (points[lowerIdx + 1] - points[lowerIdx]) * frac;
  const nx = xAt(nowIdx), ny = yAt(nowValue);
  ctx.strokeStyle = cssVar("--ink-faint"); ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(nx, pad); ctx.lineTo(nx, h - pad); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = cssVar("--ink");
  ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI * 2); ctx.fill();
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
}

/** Shared hourly bar-chart renderer used for both the wave and rain forecasts. */
export function drawHourBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  items: HourBarItem[],
  opts: { max: number; colorFor: (value: number) => string; valueLabel: (value: number) => string; boltColor?: string; refLines?: number[] }
) {
  const topPad = opts.boltColor ? 20 : 14;
  const bottomPad = 14, pad = 4;
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

  items.forEach((item, i) => {
    const x = pad + slot * i + (slot - barW) / 2;
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

    ctx.fillStyle = cssVar("--ink-soft");
    ctx.font = "600 9.5px " + cssVar("--font-mono");
    ctx.textAlign = "center";
    const labelY = Math.max(top - 4, 9);
    ctx.fillText(opts.valueLabel(item.value), x + barW / 2, labelY);

    if (item.storm && opts.boltColor) {
      const bx = x + barW / 2, by = labelY - 12;
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

export interface SkyArcOptions {
  domainHours: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  now: number;
}

export function drawSkyArc(ctx: CanvasRenderingContext2D, w: number, h: number, opts: SkyArcOptions) {
  const { domainHours, sunrise, sunset, moonrise, moonset, now } = opts;
  const pad = 4, topPad = 8, bottomPad = 16;
  const baseline = h - bottomPad;
  const xAt = (hr: number) => pad + (w - pad * 2) * (hr / domainHours);

  ctx.fillStyle = cssVar("--bg-recessed");
  ctx.fillRect(0, 0, xAt(sunrise), h);
  ctx.fillRect(xAt(sunset), 0, w - xAt(sunset), h);

  ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, baseline); ctx.lineTo(w, baseline); ctx.stroke();

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

  const moonArchH = h * 0.42, sunArchH = h * 0.6;
  drawArc(moonrise, moonset, moonArchH, cssVar("--ink-soft"), true);
  drawArc(sunrise, sunset, sunArchH, cssVar("--accent"), false);

  const nowX = xAt(now);
  ctx.strokeStyle = cssVar("--ink-faint"); ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(nowX, topPad); ctx.lineTo(nowX, baseline); ctx.stroke();
  ctx.setLineDash([]);

  if (now >= sunrise && now <= sunset) {
    const sy = archY(now, sunrise, sunset, sunArchH);
    ctx.fillStyle = cssVar("--accent");
    ctx.beginPath(); ctx.arc(nowX, sy, 4, 0, Math.PI * 2); ctx.fill();
  }
  if (now >= moonrise && now <= moonset) {
    const my = archY(now, moonrise, moonset, moonArchH);
    ctx.fillStyle = cssVar("--ink-soft");
    ctx.beginPath(); ctx.arc(nowX, my, 3.5, 0, Math.PI * 2); ctx.fill();
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

export function drawWaveBarSmall(ctx: CanvasRenderingContext2D, w: number, h: number, value: number, max: number, color: string) {
  const barW = 22;
  const barH = (h - 6) * (value / max);
  ctx.fillStyle = cssVar("--line");
  ctx.fillRect(w / 2 - barW / 2, 2, barW, h - 4);
  ctx.fillStyle = color;
  ctx.fillRect(w / 2 - barW / 2, h - 2 - barH, barW, barH);
}
