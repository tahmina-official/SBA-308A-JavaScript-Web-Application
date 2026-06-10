// ─────────────────────────────────────────────────────────────
// state.js — Central application state
//
// All data the app needs to remember lives here.
// Other files import getters/setters instead of touching _state directly.
// ─────────────────────────────────────────────────────────────

// The 6 leagues users can choose from.
// Season 2022 is used because it's fully available on the free API plan.
export const LEAGUES = [
  { id: 39,  name: "Premier League",   season: 2022, flag: "🏴" },
  { id: 140, name: "La Liga",          season: 2022, flag: "🇪🇸" },
  { id: 135, name: "Serie A",          season: 2022, flag: "🇮🇹" },
  { id: 78,  name: "Bundesliga",       season: 2022, flag: "🇩🇪" },
  { id: 61,  name: "Ligue 1",          season: 2022, flag: "🇫🇷" },
  { id: 2,   name: "Champions League", season: 2022, flag: "🏆" },
];

// The one private object that holds all app state.
// Never export this directly — use the getters/setters below.
const _state = {
  activeTab: "fixtures",        // which tab is visible right now
  activeLeague: LEAGUES[0],     // which league is selected

  recentFixtures: [],           // finished matches
  upcomingFixtures: [],         // scheduled / live matches

  standings: [],                // league table rows

  topScorers: [],               // top 10 scorers for the season
  topAssists: [],               // top 10 assisters for the season

  teamSearchResults: [],        // results from a team name search
  selectedTeamStats: null,      // full stats card for the chosen team
};


// ── Getters ──────────────────────────────────────────────────
// Return a shallow copy so callers can't accidentally mutate _state.

export function getState() {
  return { ..._state };
}

export function getActiveLeague() {
  return _state.activeLeague;
}


// ── Setters ──────────────────────────────────────────────────

export function setTab(tab) {
  _state.activeTab = tab;
}

export function setLeague(league) {
  _state.activeLeague = league;
}

export function setFixtures(recent, upcoming) {
  _state.recentFixtures   = recent;
  _state.upcomingFixtures = upcoming;
}

export function setStandings(rows) {
  _state.standings = rows;
}

export function setTopScorers(players) {
  _state.topScorers = players;
}

export function setTopAssists(players) {
  _state.topAssists = players;
}

export function setTeamSearch(teams) {
  _state.teamSearchResults = teams;
}

export function setSelectedTeamStats(stats) {
  _state.selectedTeamStats = stats;
}
