import { fetchJson } from "./http.mjs";
import { USGS_DISCHARGE_SITE } from "../config.mjs";

// Rough seasonal-normal discharge band (cfs) for this Cape Fear River gauge, used only to
// classify "above/near/below normal" for the water-clarity proxy. Not an authoritative
// hydrological baseline — USGS's own stats service (/nwis/stat/) would be a better source
// if this proves too rough in practice.
const NORMAL_DISCHARGE_CFS = { low: 800, high: 4000 };

/** River discharge as a rough proxy for nearshore water clarity (more flow after rain -> more runoff -> murkier water). */
export async function fetchWaterClarityProxy() {
  const url = `https://waterservices.usgs.gov/nwis/iv/?sites=${USGS_DISCHARGE_SITE}&parameterCd=00060&format=json&period=P1D`;
  const data = await fetchJson(url, {}, "USGS discharge");
  const series = data.value?.timeSeries?.[0]?.values?.[0]?.value ?? [];
  if (!series.length) throw new Error("no USGS discharge readings");

  const cfs = Number(series[series.length - 1].value);
  const riverDischarge = cfs > NORMAL_DISCHARGE_CFS.high ? "Above normal" : cfs < NORMAL_DISCHARGE_CFS.low ? "Below normal" : "Normal";
  const clarity =
    riverDischarge === "Above normal" ? "Fair, light stain" : riverDischarge === "Below normal" ? "Good, relatively clear" : "Fair to good";
  const note =
    riverDischarge === "Above normal"
      ? "Cape Fear discharge above normal — recent rain may reduce clarity near inlets"
      : riverDischarge === "Below normal"
        ? "Cape Fear discharge below normal — typically clearer nearshore water"
        : "Cape Fear discharge near normal";

  return { clarity, riverDischarge, note };
}
