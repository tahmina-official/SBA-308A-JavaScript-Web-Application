// main.js — Entry point: wires events, orchestrates api/ui/state


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

// ── Populate league dropdown ───────────────────────────────
state.LEAGUES.forEach((l, i) => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = `${l.flag} ${l.name}`;
  leagueSelect.appendChild(opt);
});

// ── Tab switching ───────────────────────────────────────────
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