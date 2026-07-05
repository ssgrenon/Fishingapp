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
  photo: string;
  tag: string;
}

// Static config, not part of the fetched conditions data — hand-picked public
// ocean-facing cams. `embed` cameras play inline (confirmed embeddable via
// YouTube's iframe API); `link` cameras open on the source site because their
// embeddability isn't confirmed (no public widget program, and their pages
// actively block automated access) or because the embed won't autoplay.
const CAMERAS: (EmbeddedCamera | LinkedCamera)[] = [
  {
    kind: "link",
    title: "Oak Island Pier",
    source: "YouTube · opens in new tab",
    url: "https://www.youtube.com/watch?v=YtqPZEYtfB4",
    linkLabel: "Watch live",
    photo: `${import.meta.env.BASE_URL}cams/oak-island-pier.jpg`,
    tag: "YouTube",
  },
  {
    kind: "link",
    title: "Ocean Crest Pier",
    source: "Surfchex · opens in new tab",
    url: "https://www.surfchex.com/cams/oak-island-north-carolina/",
    linkLabel: "Watch live",
    photo: `${import.meta.env.BASE_URL}cams/ocean-crest-pier.jpg`,
    tag: "Surfchex",
  },
];

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
              aria-label={`${cam.title} live camera on ${cam.tag}, opens in a new tab`}
            >
              <div className="cam-frame linkout">
                <img className="cam-bg" src={cam.photo} alt="" />
                <div className="cam-scrim" aria-hidden="true" />
                <span className="cam-open-tag">{cam.tag} ↗</span>
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
