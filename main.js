// main.js — Entry point: wires events, orchestrates api/ui/state


import * as api from "./api.js";
import * as ui from "./ui.js";
import * as state from "./state.js";

// DOM 
//=======================================================================
const leagueSelect = document.getElementById("league-select");
const tabBtns = document.querySelectorAll(".tab-btn");

const fixturesPane = document.getElementById("pane-fixtures");
const standingsPane = document.getElementById("pane-standings");
const statsPane = document.getElementById("pane-stats");

const fixturesGrid = document.getElementById("fixtures-grid");
const standingsGrid = document.getElementById("standings-grid");
const statsGrid = document.getElementById("stats-grid");

const teamSearchResults = document.getElementById("team-search-results");

const teamSearchInput = document.getElementById("team-search-input");
const teamSearchBtn = document.getElementById("team-search-btn");

const apiKeyBanner = document.getElementById("api-key-banner");
const apiKeyInput = document.getElementById("api-key-input");
const apiKeySaveBtn = document.getElementById("api-key-save");

// ── Populate league dropdown
//=======================================================================
state.LEAGUES.forEach((l, i) => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = `${l.flag} ${l.name}`;
  leagueSelect.appendChild(opt);
});

// ── Tab switching
//=======================================================================
function activateTab(tab) {
  state.setTab(tab);

  tabBtns.forEach(b =>
    b.classList.toggle("active", b.dataset.tab === tab)
  );

  fixturesPane.hidden = tab !== "fixtures";
  standingsPane.hidden = tab !== "standings";
  statsPane.hidden = tab !== "stats";
}

tabBtns.forEach(btn =>
  btn.addEventListener("click", () => {
    activateTab(btn.dataset.tab);
    loadCurrentTab();
  })
);

// ── League change 
//=======================================================================
leagueSelect.addEventListener("change", () => {
  const league = state.LEAGUES[leagueSelect.value];
  state.setLeague(league);
  loadCurrentTab();
});

// ── Load active tab 
//=======================================================================
async function loadCurrentTab() {
  if (!globalThis.__FOOTBALL_API_KEY__) return;

  const { activeTab, activeLeague } = state.getState();
  const { id, season } = activeLeague;

  if (activeTab === "fixtures") await loadFixtures(id, season);
  if (activeTab === "standings") await loadStandings(id, season);
  if (activeTab === "stats") await loadTopPlayers(id, season);
}

// ── FIXTURES (FIXED FOR FREE TIER) 
//=======================================================================
async function loadFixtures(leagueId, season) {
  ui.setLoading("spinner-fixtures", true);
  fixturesGrid.innerHTML = "";

  try {
    const fixtures = await api.fetchFixturesBySeason(leagueId, season);

    if (!fixtures.length) {
      fixturesGrid.innerHTML =
        `<div class="empty">No fixtures found for this league/season.</div>`;
      return;
    }

    const now = new Date();

    const recent = fixtures.filter(f =>
      new Date(f.fixture.date) < now && f.fixture.status.short === "FT"
    );

    const upcoming = fixtures.filter(f =>
      new Date(f.fixture.date) >= now
    );

    state.setFixtures(recent, upcoming);
    ui.renderFixtures(recent, upcoming, fixturesGrid);

  } catch (err) {
    console.error(err);
    fixturesGrid.innerHTML =
      `<div class="empty error">${friendlyError(err)}</div>`;
  } finally {
    ui.setLoading("spinner-fixtures", false);
  }
}


// ── STANDINGS
//=======================================================================
async function loadStandings(leagueId, season) {
  ui.setLoading("spinner-standings", true);
  standingsGrid.innerHTML = "";

  try {
    const standings = await api.fetchStandings(leagueId, season);
    state.setStandings(standings);
    ui.renderStandings(standings, standingsGrid);

  } catch (err) {
    console.error(err);
    standingsGrid.innerHTML = `<div class="empty error">${friendlyError(err)}</div>`;
  } finally {
    ui.setLoading("spinner-standings", false);
  }
}

// ── TOP PLAYERS
//=======================================================================
async function loadTopPlayers(leagueId, season) {
  ui.setLoading("spinner-stats", true);
  statsGrid.innerHTML = "";

  try {
    const [scorers, assists] = await Promise.all([
      api.fetchTopScorers(leagueId, season),
      api.fetchTopAssists(leagueId, season),
    ]);

    state.setTopScorers(scorers);
    state.setTopAssists(assists);

    ui.renderTopPlayers(scorers, assists, statsGrid);

  } catch (err) {
    console.error(err);
    statsGrid.innerHTML = `<div class="empty error">${friendlyError(err)}</div>`;
  } finally {
    ui.setLoading("spinner-stats", false);
  }
}

// ── API KEY HANDLING //=======================================================================
const savedKey = localStorage.getItem("football_api_key");

if (savedKey) {
  applyApiKey(savedKey);
  apiKeyBanner.hidden = true;
} else {
  apiKeyBanner.hidden = false;
}

apiKeySaveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) return;

  localStorage.setItem("football_api_key", key);
  applyApiKey(key);

  apiKeyBanner.hidden = true;
  ui.showToast("API key saved!", "success");

  loadCurrentTab();
});

function applyApiKey(key) {
  globalThis.__FOOTBALL_API_KEY__ = key;
}

// ── ERROR HANDLER 
//=======================================================================
function friendlyError(err) {
  if (err.message.includes("No API key"))
    return "⚠️ Enter your API key above";

  if (err.message.includes("rate limit"))
    return "⚠️ Rate limit reached (100 req/day free plan)";

  if (err.message.includes("401") || err.message.includes("403"))
    return "⚠️ Invalid API key";

  if (err.message.includes("season"))
    return "⚠️ This league/season is not available on free plan";

  return `⚠️ ${err.message}`;
}

// ── INIT 
//=======================================================================
activateTab("fixtures");

if (savedKey) {
  loadCurrentTab();
}