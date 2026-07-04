import { relativeTime } from "../lib/time";
import type { Report } from "../lib/types";

export function LocalReports({ reports, nowIso }: { reports: Report[]; nowIso: string }) {
  return (
    <section className="outlook">
      <div className="outlook-head">
        <h2>Local reports &amp; news</h2>
        <p>Catch reports and notices from area piers, shops, and regulators</p>
      </div>
      <div className="report-list">
        {reports.map((report, i) => (
          <div className="report-item" key={i}>
            <span className={`tag ${report.tag}`}>{report.tagLabel}</span>
            <div className="report-body">
              <p>{report.text}</p>
              <span className="report-meta">
                {report.source} · {relativeTime(report.time, nowIso)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
