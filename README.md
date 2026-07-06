# Oak Island Conditions

A free, no-login fishing-conditions dashboard for Oak Island, NC: tide, sunrise/moonrise with a
sky-position arc, wave height, weather with rain/thunderstorm timing, barometric pressure, a
water-clarity estimate, a composite "bite score," a 7-day trip planner with an hourly wind-speed
heatmap, and a local reports feed.

## Architecture

The site is a static React app (Vite) hosted on GitHub Pages — there is no backend server.

Data freshness comes from a **scheduled GitHub Actions workflow** instead of a server:

- `.github/workflows/update-conditions.yml` runs every 20 minutes on GitHub's own runners, calls
  `scripts/fetch-conditions.mjs`, and commits the result to `public/data/conditions.json` on
  `main` if it changed.
- `.github/workflows/deploy.yml` rebuilds and republishes the site to GitHub Pages on every push
  to `main` — including the automated data-update commits above.
- The frontend does a plain same-origin `fetch('data/conditions.json')` on load. No API keys are
  shipped to the browser, and NWS's known CORS restrictions never come into play because the
  browser never talks to NOAA/NWS/NDBC/Open-Meteo directly.

This means conditions are as fresh as the last scheduled run (up to ~20 minutes), not live on
every page load — a deliberate tradeoff for a site with zero backend cost.

`public/data/reports.json` (the "Local reports & news" section) is **not** touched by the
scheduled workflow. There's no clean free API for pier/tackle-shop catch reports, so it's a
hand-edited file — update it directly whenever you hear of a new report.

## Data sources

| Section | Source |
|---|---|
| Tide | NOAA CO-OPS predictions API, station `8659182` |
| Sun / moon / solunar | Computed locally with `suncalc` — no API |
| Waves (current) | NDBC buoy `41013` (Frying Pan Shoals) realtime2 feed, with height/period/direction backfilled from Open-Meteo Marine when the buoy reading is stale/missing |
| Waves (swell / wind-wave breakdown) | Open-Meteo Marine API — the same swell height/period/direction and wind-wave height Windy's wave meteogram is built from |
| Waves (6h / 7-day forecast) | Open-Meteo Marine API |
| Hourly wind (waves tile arrows, 7-day wind-speed heatmap) + rain chance / precip inches (weather tile) | Open-Meteo Forecast API |
| Current weather, thunderstorm timing | NWS `api.weather.gov` |
| Pressure (current + 24h trend) | NDBC buoy `41013` |
| Water temp | NDBC buoy `41013` |
| Water clarity (estimate) | USGS discharge gauge on the Cape Fear River, used as a rough proxy — no direct clarity API exists |

All of the above are free at this app's request volume; none require a paid tier.

**Caveat on the above:** this sandbox's network egress policy blocks direct calls to
NOAA/NWS/NDBC/Open-Meteo, so `scripts/fetch-conditions.mjs` could not be exercised against the
live endpoints while building this. Each fetch module was instead verified by feeding it
realistically-shaped mocked responses (matching each API's documented JSON structure) to confirm
the parsing and math are correct. The actual scheduled workflow runs on GitHub-hosted runners,
which have normal internet access, so it should work once merged — but the first few scheduled
runs are worth checking (Actions tab → "Update conditions data") in case any of the following
assumptions don't hold in practice:

- The NOAA tide station (`8659182`) and NDBC buoy (`41013`) are the closest match found for Oak
  Island, but weren't confirmed against a live station lookup.
- The USGS discharge gauge and its "normal" range (`scripts/config.mjs` /
  `scripts/lib/usgsWater.mjs`) are a rough placeholder, not a validated hydrological baseline.
- NWS doesn't expose a clean numeric "thunderstorm probability" — the storm window is inferred by
  scanning `shortForecast` text for the word "thunderstorm" across the next 6 hourly periods.
- The bite-score weighting (`scripts/lib/biteScore.mjs`) is a reasonable starting formula, not a
  validated model — worth tuning against real outcomes over time.

If a single source fails on a given run, that section falls back to its previous value rather
than breaking the whole update (see the `soft()` helper in `scripts/lib/http.mjs`).

## Local development

```
npm install
npm run dev       # dev server at /Fishingapp/
npm run build     # production build to dist/
npm run fetch-conditions   # re-runs the data pipeline against public/data/conditions.json
```

The bundled `public/data/conditions.json` ships with `isSample: true` and illustrative numbers so
the site renders correctly before the first scheduled run publishes live data.

## One-time setup to go live

1. Merge this branch into `main`.
2. In the repo's Settings → Pages, set **Source** to "GitHub Actions".
3. Settings → Actions → General → Workflow permissions must allow "Read and write permissions"
   so `update-conditions.yml` can commit `conditions.json` back to the repo.
4. The site will be live at `https://ssgrenon.github.io/Fishingapp/`.
