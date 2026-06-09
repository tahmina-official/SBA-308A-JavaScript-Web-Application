// api.js — API-Football v3 (optimized for free tier)

import { API_KEY } from "./keys.js";
const BASE = "https://v3.football.api-sports.io";

// ── Runtime key (set from UI) ─────────────────────────────
function getKey() {
  return globalThis.__FOOTBALL_API_KEY__ || API_KEY;
}

// ── Headers (API-SPORTS DIRECT, not RapidAPI) ─────────────
function getHeaders() {
  return {
    "x-apisports-key": getKey()
  };
}

// ── Simple cache (huge savings for free plan) ─────────────
const cache = new Map();

// ── Throttle (prevents request spam) ──────────────────────
let lastRequestTime = 0;
const MIN_INTERVAL = 800;

async function throttle() {
  const now = Date.now();
  const diff = now - lastRequestTime;

  if (diff < MIN_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_INTERVAL - diff));
  }

  lastRequestTime = Date.now();
}

// ── Core fetch wrapper ─────────────────────────────────────
async function apiFetch(path) {
  const key = getKey();

  if (!key || key === "API_KEY") {
    throw new Error("No API key set. Please enter your API key.");
  }

  // cache hit
  if (cache.has(path)) return cache.get(path);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const promise = (async () => {
    await throttle();

    const res = await fetch(`${BASE}${path}`, {
      headers: getHeaders(),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${path}`);
    }

    const json = await res.json();

    if (json.errors && Object.keys(json.errors).length) {
      throw new Error(Object.values(json.errors)[0]);
    }

    return json.response;
  })();

  cache.set(path, promise);

  try {
    return await promise;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Fixtures ───────────────────────────────────────────────

export async function fetchTodayFixtures(leagueId, season) {
  const today = new Date().toISOString().slice(0, 10);
  return apiFetch(
    `/fixtures?league=${leagueId}&season=${season}&date=${today}&timezone=America/New_York`
  );
}

export async function fetchNextFixtures(leagueId, season, n = 10) {
  return apiFetch(
    `/fixtures?league=${leagueId}&season=${season}&next=${n}&timezone=America/New_York`
  );
}

export async function fetchLastFixtures(leagueId, season, n = 10) {
  return apiFetch(
    `/fixtures?league=${leagueId}&season=${season}&last=${n}`
  );
}

export async function fetchLiveFixtures() {
  return apiFetch(`/fixtures?live=all`);
}

export async function fetchFixturesBySeason(leagueId, season) {
  return apiFetch(`/fixtures?league=${leagueId}&season=${season}`);
}

// ── Standings ──────────────────────────────────────────────

export async function fetchStandings(leagueId, season) {
  const data = await apiFetch(
    `/standings?league=${leagueId}&season=${season}`
  );

  return data?.[0]?.league?.standings?.[0] ?? [];
}

// ── Teams ──────────────────────────────────────────────────

export async function searchTeams(query) {
  return apiFetch(`/teams?search=${encodeURIComponent(query)}`);
}

export async function fetchTeamStats(teamId, leagueId, season) {
  return apiFetch(
    `/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`
  );
}

// ── Players ────────────────────────────────────────────────

export async function fetchTopScorers(leagueId, season) {
  return apiFetch(
    `/players/topscorers?league=${leagueId}&season=${season}`
  );
}

export async function fetchTopAssists(leagueId, season) {
  return apiFetch(
    `/players/topassists?league=${leagueId}&season=${season}`
  );
}

export async function searchPlayers(query, page = 1) {
  return apiFetch(
    `/players?search=${encodeURIComponent(query)}&page=${page}`
  );
}

// ── League info ────────────────────────────────────────────

export async function fetchLeague(leagueId) {
  const data = await apiFetch(`/leagues?id=${leagueId}`);
  return data?.[0] ?? null;
}