// Central config for the data-fetching pipeline. Station/gauge IDs here were
// chosen from public documentation and general geographic knowledge, not
// verified against a live call (this sandbox's egress policy blocks NOAA/NWS/
// NDBC/Open-Meteo directly). Re-check these against
// https://tidesandcurrents.noaa.gov/map/ and https://www.ndbc.noaa.gov/ if the
// published data ever looks off for Oak Island specifically.

export const LOCATION = {
  name: "Oak Island, NC",
  lat: 33.9107,
  lon: -78.1653,
};

export const TIME_ZONE = "America/New_York";

// NOAA CO-OPS tide prediction station nearest Oak Island.
export const NOAA_TIDE_STATION = "8659182";

// NDBC buoy used for pressure + water temp (Frying Pan Shoals - offshore, but
// the most reliable full met sensor suite near Oak Island).
export const NDBC_STATION = "41013";
export const NDBC_STATION_LABEL = "NDBC 41013 Frying Pan Shoals";

// NDBC wave stations, tried in order, nearest Oak Island first:
// - SSBN7: Sunset Beach Nearshore Waves (SUN2WAVE) buoy, ~19 mi from Oak
//   Island - the closest available wave sensor, but a compact nearshore-wave
//   buoy that may not report every field a full met buoy does.
// - 41037: CORMP full met+wave buoy off Wrightsville Beach, ~46 mi away -
//   farther, but a sturdier fallback if SSBN7 is offline.
export const NDBC_WAVE_STATIONS = [
  { id: "SSBN7", label: "NDBC SSBN7 Sunset Beach Nearshore Waves" },
  { id: "41037", label: "NDBC 41037 (CORMP, Wrightsville Beach)" },
];

// USGS gauge on the Cape Fear River used as a rough water-clarity proxy via
// discharge (higher discharge after rain -> more runoff -> lower clarity).
// Soft-fails if unavailable; not critical path.
export const USGS_DISCHARGE_SITE = "02105769";

// Identify ourselves to NWS per their API etiquette. No personal contact info.
export const NWS_USER_AGENT = "OakIslandFishingApp (github.com/ssgrenon/fishingapp)";

export const TIDE_THRESHOLDS = { superHighFt: 4.2, superLowFt: 0.3 };
export const WAVE_THRESHOLDS = { calmMaxFt: 2.1, moderateMaxFt: 3.1 };
