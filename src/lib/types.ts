export interface Location {
  name: string;
  lat: number;
  lon: number;
}

export interface TideEvent {
  type: "High" | "Low";
  time: string;
  heightFt: number;
}

export interface Tide {
  station: string;
  curvePoints: number[];
  next: TideEvent[];
  thresholds: { superHighFt: number; superLowFt: number };
}

export interface Sun {
  dawn: string;
  sunrise: string;
  sunset: string;
  dusk: string;
}

export interface Moon {
  rise: string;
  set: string;
  illumination: number;
  phaseName: string;
}

export interface SolunarWindow {
  start: string;
  end: string;
}

export interface Solunar {
  majors: SolunarWindow[];
  minors: SolunarWindow[];
  featuredIndex: number;
  featuredNote: string;
}

export interface HourlyPoint {
  label: string;
  heightFt?: number;
  pct?: number;
  storm?: boolean;
  /** Wind direction the wind is blowing from (8-point compass), for the waves tile arrows. */
  windDirLabel?: string;
  windSpeedMph?: number;
  /** Projected precipitation for the hour, in inches, for the weather tile labels. */
  precipIn?: number;
}

export interface Waves {
  source: string;
  current: { heightFt: number; periodSec: number; direction: string; chop: string };
  thresholds: { calmMaxFt: number; moderateMaxFt: number };
  next6h: HourlyPoint[];
}

export interface Weather {
  source: string;
  tempF: number;
  conditions: string;
  windMph: number;
  windGustMph: number;
  windDirLabel: string;
  humidityPct: number;
  rainNext6h: HourlyPoint[];
  stormRisk: { present: boolean; windowLabel: string };
}

export interface Pressure {
  current: number;
  trend: "steady" | "rising" | "falling";
  trendNote: string;
  last24h: number[];
}

export interface Water {
  tempF: number;
  clarity: string;
  note: string;
  riverDischarge: string;
}

export interface BiteScoreReason {
  tier: "good" | "caution" | "critical";
  text: string;
}

export interface BiteScore {
  value: number;
  verdict: string;
  headline: string;
  reasons: BiteScoreReason[];
}

export interface WeeklyDay {
  date: string;
  day: string;
  windMph: number;
  windDir: string;
  waveFt: number;
  score: number;
  tier: "good" | "caution" | "critical";
}

export interface Conditions {
  location: Location;
  updated: string;
  isSample?: boolean;
  tide: Tide;
  sun: Sun;
  moon: Moon;
  solunar: Solunar;
  waves: Waves;
  weather: Weather;
  pressure: Pressure;
  water: Water;
  biteScore: BiteScore;
  weekly: WeeklyDay[];
}

export interface Report {
  tag: "accent" | "good" | "caution" | "critical";
  tagLabel: string;
  text: string;
  source: string;
  time: string;
}
