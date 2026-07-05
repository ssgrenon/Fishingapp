import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { TideCard } from "./components/TideCard";
import { SunMoonCard } from "./components/SunMoonCard";
import { WavesCard } from "./components/WavesCard";
import { WeatherCard } from "./components/WeatherCard";
import { PressureCard } from "./components/PressureCard";
import { WaterCard } from "./components/WaterCard";
import { LiveCamerasCard } from "./components/LiveCamerasCard";
import { WeeklyOutlook } from "./components/WeeklyOutlook";
import { LocalReports } from "./components/LocalReports";
import { Footer } from "./components/Footer";
import { useConditions } from "./lib/useConditions";

export default function App() {
  const { conditions, reports, error, loading } = useConditions();

  if (loading) {
    return <div className="state-message">Loading conditions…</div>;
  }
  if (error || !conditions || !reports || !conditions.tide || !conditions.weather || !conditions.pressure) {
    return (
      <div className="state-message">
        Couldn't load conditions data ({error ?? "unknown error"}). Try refreshing, or check that
        data/conditions.json and data/reports.json were published with the site.
      </div>
    );
  }

  return (
    <div className="page">
      {conditions.isSample && (
        <div className="sample-banner">Sample data — the scheduled data workflow hasn't published live conditions yet</div>
      )}
      <Header conditions={conditions} />
      <Hero conditions={conditions} />
      <h2 className="grid-heading">Right now</h2>
      <div className="instruments">
        <TideCard conditions={conditions} />
        <SunMoonCard conditions={conditions} />
        <WavesCard conditions={conditions} />
        <WeatherCard conditions={conditions} />
        <PressureCard conditions={conditions} />
        <WaterCard conditions={conditions} />
      </div>
      <LiveCamerasCard />
      <WeeklyOutlook days={conditions.weekly} />
      <LocalReports reports={reports} nowIso={conditions.updated} />
      <Footer />
    </div>
  );
}
