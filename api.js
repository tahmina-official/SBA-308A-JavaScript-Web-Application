// ─────────────────────────────────────────────────────────────
// api.js — All API-Football v3 network calls
//
// Key design decisions:
//   • Every request goes through apiFetch() — one place to add
//     auth headers, caching, throttling, and error handling.
//   • Results are cached so you don't burn through your 100
//     free requests/day re-fetching the same data.
//   • A 800 ms throttle prevents you from hammering the server
//     when the user clicks quickly.
// ─────────────────────────────────────────────────────────────

const BASE_URL = "https://v3.football.api-sports.io";

// ── API key helpers ──────────────────────────────────────────

// Gets the key set by the user at runtime (from main.js).
// Falls back to nothing — the error handler in apiFetch will
// catch the missing-key case and show a friendly message.
function getApiKey() {
  return globalThis.__FOOTBALL_API_KEY__ || "";
}

// API-Sports direct (not RapidAPI) uses this one header.
function buildHeaders() {
  return { "x-apisports-key": getApiKey() };
}


// ── Simple in-memory cache ───────────────────────────────────
// Key = full URL path, value = the resolved Promise.
// Caching the Promise (not the data) means two requests fired
// at the same instant both wait for the same single fetch.
const cache = new Map();


// ── Request throttle ─────────────────────────────────────────
// Ensures at least 800 ms between requests.
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 800;

async function waitForThrottle() {
  const msSinceLast = Date.now() - lastRequestTime;
  if (msSinceLast < MIN_REQUEST_INTERVAL_MS) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - msSinceLast)
    );
  }
  lastRequestTime = Date.now();
}


// ── Core fetch wrapper ───────────────────────────────────────
// All exported functions call this. It handles:
//   1. Missing API key guard
//   2. Cache check (avoids duplicate requests)
//   3. Throttle (polite rate limiting)
//   4. 10-second timeout (AbortController)
//   5. HTTP error handling
//   6. API-level error handling (errors in the JSON body)
async function apiFetch(path) {
  // 1. Guard: make sure there's actually a key
  const key = getApiKey();
  if (!key) {
    throw new Error("No API key set. Please enter your API key.");
  }

  // 2. Cache check: return the existing promise if we already fetched this
  if (cache.has(path)) {
    return cache.get(path);
  }

  // 3. Build the fetch promise (we store it in the cache immediately
  //    so a second call while this one is still in-flight reuses it).
  const fetchPromise = (async () => {
    // 4. Throttle before making the actual request
    await waitForThrottle();

    // Set up a 10-second timeout using AbortController
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 10_000);

    let res;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        headers: buildHeaders(),
        signal:  controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // 5. HTTP-level error (4xx, 5xx)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} — ${path}`);
    }

    const json = await res.json();

    // 6. API-level errors (the API returns 200 but puts errors in the body)
    if (json.errors && Object.keys(json.errors).length > 0) {
      const firstError = Object.values(json.errors)[0];
      throw new Error(firstError);
    }

    return json.response;
  })();

  // Store promise in cache so we never send the same request twice
  cache.set(path, fetchPromise);

  // If the request fails, remove it from cache so a retry is possible
  fetchPromise.catch(() => cache.delete(path));

  return fetchPromise;
}


// ── Fixtures ─────────────────────────────────────────────────

// All fixtures for a given league + season (used for the Fixtures tab).
export function fetchFixturesBySeason(leagueId, season) {
  return apiFetch(`/fixtures?league=${leagueId}&season=${season}`);
}

// Today's fixtures only
export function fetchTodayFixtures(leagueId, season) {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  return apiFetch(
    `/fixtures?league=${leagueId}&season=${season}&date=${today}&timezone=America/New_York`
  );
}

// Next N upcoming fixtures
export function fetchNextFixtures(leagueId, season, count = 10) {
  return apiFetch(
    `/fixtures?league=${leagueId}&season=${season}&next=${count}&timezone=America/New_York`
  );
}

// Last N finished fixtures
export function fetchLastFixtures(leagueId, season, count = 10) {
  return apiFetch(
    `/fixtures?league=${leagueId}&season=${season}&last=${count}`
  );
}


// ── Standings ────────────────────────────────────────────────

// Returns the array of team rows for the league table.
// The API nests the rows deeply, so we drill down and return
// an empty array as a safe default if the data is missing.
export async function fetchStandings(leagueId, season) {
  const data = await apiFetch(
    `/standings?league=${leagueId}&season=${season}`
  );
  // Path: data[0].league.standings[0] = array of team rows
  return data?.[0]?.league?.standings?.[0] ?? [];
}


// ── Teams ────────────────────────────────────────────────────

// Search teams by name (e.g. "Arsenal", "Barca")
export function searchTeams(query) {
  return apiFetch(`/teams?search=${encodeURIComponent(query)}`);
}

// Full season statistics for one team in one league
export function fetchTeamStats(teamId, leagueId, season) {
  return apiFetch(
    `/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`
  );
}


// ── Players ──────────────────────────────────────────────────

// Top goal scorers for the season
export function fetchTopScorers(leagueId, season) {
  return apiFetch(
    `/players/topscorers?league=${leagueId}&season=${season}`
  );
}

// Top assisters for the season
export function fetchTopAssists(leagueId, season) {
  return apiFetch(
    `/players/topassists?league=${leagueId}&season=${season}`
  );
}
