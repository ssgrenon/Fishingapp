interface Camera {
  title: string;
  source: string;
}

interface EmbeddedCamera extends Camera {
  kind: "embed";
  youtubeId: string;
}

interface LinkedCamera extends Camera {
  kind: "link";
  url: string;
  linkLabel: string;
}

// Static config, not part of the fetched conditions data — hand-picked public
// ocean-facing cams. `embed` cameras play inline (confirmed embeddable via
// YouTube's iframe API); `link` cameras open on the source site because their
// embeddability isn't confirmed (no public widget program, and their pages
// actively block automated access).
const CAMERAS: (EmbeddedCamera | LinkedCamera)[] = [
  { kind: "embed", title: "Oak Island Pier", source: "YouTube · live", youtubeId: "YtqPZEYtfB4" },
  {
    kind: "link",
    title: "Ocean Crest Pier",
    source: "Surfchex · opens in new tab",
    url: "https://www.surfchex.com/cams/oak-island-north-carolina/",
    linkLabel: "Watch live",
  },
];

function PierSilhouette() {
  return (
    <svg viewBox="0 0 440 247" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="172" x2="440" y2="172" stroke="rgba(230,238,240,0.16)" strokeWidth="1" />
      <g stroke="rgba(20,30,34,0.5)" strokeWidth="5" strokeLinecap="round">
        <line x1="70" y1="172" x2="60" y2="235" />
        <line x1="150" y1="172" x2="146" y2="235" />
        <line x1="230" y1="172" x2="230" y2="235" />
        <line x1="310" y1="172" x2="314" y2="235" />
        <line x1="390" y1="172" x2="398" y2="235" />
      </g>
      <rect x="30" y="163" width="380" height="11" rx="2" fill="rgba(20,30,34,0.55)" />
    </svg>
  );
}

export function LiveCamerasCard() {
  return (
    <section className="live-cams">
      <div className="live-cams-head">
        <h2>Live Cameras</h2>
        <p>Public ocean-facing webcams near Oak Island</p>
      </div>
      <div className="cam-grid">
        {CAMERAS.map((cam) =>
          cam.kind === "embed" ? (
            <div className="cam-card" key={cam.title}>
              <div className="cam-frame">
                <iframe
                  src={`https://www.youtube.com/embed/${cam.youtubeId}?autoplay=0`}
                  title={`${cam.title} live camera`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="cam-caption">
                <span className="cam-title">{cam.title}</span>
                <span className="card-sub">{cam.source}</span>
              </div>
            </div>
          ) : (
            <a
              className="cam-card"
              key={cam.title}
              href={cam.url}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${cam.title} live camera on Surfchex, opens in a new tab`}
            >
              <div className="cam-frame linkout">
                <PierSilhouette />
                <span className="cam-open-tag">Surfchex ↗</span>
                <span className="cam-open-btn">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14zm5 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2z" />
                  </svg>
                  {cam.linkLabel}
                </span>
              </div>
              <div className="cam-caption">
                <span className="cam-title">{cam.title}</span>
                <span className="card-sub">{cam.source}</span>
              </div>
            </a>
          )
        )}
      </div>
    </section>
  );
}
