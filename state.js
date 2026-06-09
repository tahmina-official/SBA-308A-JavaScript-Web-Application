// state.js — Central application state (FREE TIER SAFE - 2022 season)

export const LEAGUES = [
  { id: 39,  name: "Premier League",   season: 2022, flag: "🏴" },
  { id: 140, name: "La Liga",          season: 2022, flag: "🇪🇸" },
  { id: 135, name: "Serie A",          season: 2022, flag: "🇮🇹" },
  { id: 78,  name: "Bundesliga",       season: 2022, flag: "🇩🇪" },
  { id: 61,  name: "Ligue 1",          season: 2022, flag: "🇫🇷" },
  { id: 2,   name: "Champions League", season: 2022, flag: "🏆" },
];

const _state = {
  activeTab: "fixtures",
  activeLeague: LEAGUES[0],

  fixtures: [],
  nextFixtures: [],

  standings: [],

  topScorers: [],
  topAssists: [],

  teamSearchResults: [],
  playerSearchResults: [],

  selectedTeamStats: null,

  loading: {
    fixtures: false,
    standings: false,
    stats: false,
  },
};

// ── getters ───────────────────────────────────────────────
export const getState = () => ({ ..._state });
export const getLeague = () => _state.activeLeague;

// ── setters ───────────────────────────────────────────────
export function setTab(tab) {
  _state.activeTab = tab;
}

export function setLeague(league) {
  _state.activeLeague = league;
}

export function setFixtures(recent, next) {
  _state.fixtures = recent;
  _state.nextFixtures = next;
}

export function setStandings(data) {
  _state.standings = data;
}

export function setTopScorers(data) {
  _state.topScorers = data;
}

export function setTopAssists(data) {
  _state.topAssists = data;
}

export function setTeamSearch(data) {
  _state.teamSearchResults = data;
}

export function setPlayerSearch(data) {
  _state.playerSearchResults = data;
}

export function setSelectedTeamStats(data) {
  _state.selectedTeamStats = data;
}

export function setLoading(key, value) {
  _state.loading[key] = value;
}