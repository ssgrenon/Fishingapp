const DEFAULT_TIMEOUT_MS = 15_000;

async function withTimeout(url, options, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`${label}: HTTP ${res.status} for ${url}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(url, options = {}, label = "fetchJson") {
  const res = await withTimeout(url, options, label);
  return res.json();
}

export async function fetchText(url, options = {}, label = "fetchText") {
  const res = await withTimeout(url, options, label);
  return res.text();
}

/** Runs a fetch step; on failure, logs a warning and returns the fallback instead of throwing. */
export async function soft(label, fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[warn] ${label} failed: ${err.message}`);
    return fallback;
  }
}
