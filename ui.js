// ─────────────────────────────────────────────────────────────
// ui.js — All DOM rendering functions
//
// Nothing here touches the network or state directly.
// main.js fetches data, then hands it to these functions
// which turn it into HTML on the page.
// ─────────────────────────────────────────────────────────────


// ── Date / time helpers ──────────────────────────────────────

// Formats a date string into a short time like "3:00 PM"
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Formats a date string into a short date like "Sat, Jun 8"
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
  });
}


// ── Status badge helper ──────────────────────────────────────
// Produces a small colored badge showing the match status.
// Live matches pulse green; finished matches show "FT";
// scheduled matches show the kick-off time.
function buildStatusBadge(fixture) {
  const { short, elapsed } = fixture.fixture.status;

  if (["1H", "2H", "ET"].includes(short)) {
    return `<span class="badge badge-live">● LIVE ${elapsed}'</span>`;
  }
  if (short === "HT") {
    return `<span class="badge badge-live">● HT</span>`;
  }
  if (short === "FT") {
    return `<span class="badge badge-ft">FT</span>`;
  }
  if (short === "NS") {
    return `<span class="badge badge-ns">${formatTime(fixture.fixture.date)}</span>`;
  }
  // Anything else (postponed, abandoned, etc.)
  return `<span class="badge badge-other">${short}</span>`;
}


// ── FIXTURES ─────────────────────────────────────────────────
// Renders both recent results and upcoming matches.
// Groups them by date so the layout stays readable.
export function renderFixtures(recent, upcoming, container) {
  container.innerHTML = "";

  // Merge both lists, tag each fixture with its type, then sort by date
  const allFixtures = [
    ...recent.map(f => ({ ...f, _type: "recent" })),
    ...upcoming.map(f => ({ ...f, _type: "upcoming" })),
  ].sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

  if (allFixtures.length === 0) {
    container.innerHTML = `<div class="empty">No fixtures found for this league/season.</div>`;
    return;
  }

  // Group fixtures under their date heading (e.g. "Sat, Jun 8")
  const groupedByDate = {};
  allFixtures.forEach(fixture => {
    const dateLabel = formatDate(fixture.fixture.date);
    if (!groupedByDate[dateLabel]) groupedByDate[dateLabel] = [];
    groupedByDate[dateLabel].push(fixture);
  });

  // Render each date group
  Object.entries(groupedByDate).forEach(([dateLabel, fixtures], groupIndex) => {
    const groupEl = document.createElement("div");
    groupEl.className = "fixture-group";
    groupEl.style.animationDelay = `${groupIndex * 80}ms`;
    groupEl.innerHTML = `<h3 class="fixture-date-label">${dateLabel}</h3>`;

    fixtures.forEach((fixture, fixtureIndex) => {
      const { teams, goals, fixture: { status } } = fixture;
      const isLive     = ["1H", "2H", "ET", "HT"].includes(status.short);
      const isFinished = status.short === "FT";

      const card = document.createElement("div");
      card.className = `fixture-card${isLive ? " fixture-live" : ""}`;
      card.style.animationDelay = `${(groupIndex * 5 + fixtureIndex) * 60}ms`;

      // Show the score if the match is live or finished; otherwise show "vs"
      const scoreHTML = (isFinished || isLive)
        ? `<strong>${goals.home ?? 0}</strong> – <strong>${goals.away ?? 0}</strong>`
        : `<span class="vs">vs</span>`;

      card.innerHTML = `
        <div class="fixture-team fixture-home">
          <img src="${teams.home.logo}" alt="${teams.home.name}"
               onerror="this.style.display='none'" />
          <span class="${teams.home.winner ? "team-winner" : ""}">${teams.home.name}</span>
        </div>

        <div class="fixture-score">
          ${buildStatusBadge(fixture)}
          <div class="score-line ${isFinished || isLive ? "score-known" : "score-upcoming"}">
            ${scoreHTML}
          </div>
        </div>

        <div class="fixture-team fixture-away">
          <span class="${teams.away.winner ? "team-winner" : ""}">${teams.away.name}</span>
          <img src="${teams.away.logo}" alt="${teams.away.name}"
               onerror="this.style.display='none'" />
        </div>`;

      groupEl.appendChild(card);
    });

    container.appendChild(groupEl);
  });
}


// ── STANDINGS ────────────────────────────────────────────────
// Renders the full league table.
export function renderStandings(standings, container) {
  container.innerHTML = "";

  if (!standings.length) {
    container.innerHTML = `<div class="empty">Standings not available for this league/season.</div>`;
    return;
  }

  const table = document.createElement("div");
  table.className = "standings-table";

  // Column headers
  table.innerHTML = `
    <div class="standings-header">
      <span class="col-pos">#</span>
      <span class="col-team">Team</span>
      <span class="col-stat">P</span>
      <span class="col-stat">W</span>
      <span class="col-stat">D</span>
      <span class="col-stat">L</span>
      <span class="col-stat col-gd">GD</span>
      <span class="col-pts">Pts</span>
      <span class="col-form">Form</span>
    </div>`;

  standings.forEach((row, index) => {
    const el = document.createElement("div");
    el.className = "standings-row";
    el.style.animationDelay = `${index * 40}ms`;

    // Last 5 form results as colored dots (W = green, D = grey, L = red)
    const formDots = (row.form || "")
      .slice(-5)
      .split("")
      .map(char => `<span class="form-dot form-${char.toLowerCase()}">${char}</span>`)
      .join("");

    // Color-code position: Champions League (top 4), Europa League (5-6), Relegation (bottom 3)
    const total = standings.length;
    const posClass = row.rank <= 4
      ? "pos-cl"
      : row.rank <= 6
        ? "pos-el"
        : row.rank >= total - 2
          ? "pos-rel"
          : "";

    // Show +/- sign on goal difference
    const gdSign    = row.goalsDiff > 0 ? "+" : "";
    const gdClass   = row.goalsDiff >= 0 ? "gd-pos" : "gd-neg";

    el.innerHTML = `
      <span class="col-pos">
        <span class="pos-indicator ${posClass}">${row.rank}</span>
      </span>
      <span class="col-team">
        <img src="${row.team.logo}" alt="${row.team.name}"
             onerror="this.style.display='none'" />
        ${row.team.name}
      </span>
      <span class="col-stat">${row.all.played}</span>
      <span class="col-stat">${row.all.win}</span>
      <span class="col-stat">${row.all.draw}</span>
      <span class="col-stat">${row.all.lose}</span>
      <span class="col-stat col-gd ${gdClass}">${gdSign}${row.goalsDiff}</span>
      <span class="col-pts"><strong>${row.points}</strong></span>
      <span class="col-form">${formDots}</span>`;

    table.appendChild(el);
  });

  container.appendChild(table);
}


// ── TOP SCORERS & ASSISTS ────────────────────────────────────
// Renders two side-by-side player leaderboards.
export function renderTopPlayers(scorers, assists, container) {
  container.innerHTML = "";

  // Helper that builds one leaderboard section.
  // statPath tells us which nested property holds the number
  // (goals.total for scorers, assists for assists — both live inside
  //  player.statistics[0].goals / player.statistics[0].assists)
  function buildPlayerSection(title, players, statPath, statLabel) {
    if (!players.length) return "";

    const rows = players.slice(0, 10).map((entry, index) => {
      const stats = entry.statistics[0] ?? {};

      // FIX: The original code used a flat key like "goals" or "assists"
      // but the API actually nests them:
      //   scorers  → statistics[0].goals.total
      //   assists  → statistics[0].goals.assists
      // We accept a dot-path string and drill into it safely.
      const statValue = statPath.split(".").reduce(
        (obj, key) => (obj != null ? obj[key] : null),
        stats
      ) ?? 0;

      return `
        <div class="player-row" style="animation-delay:${index * 50}ms">
          <span class="player-rank">${index + 1}</span>
          <img class="player-photo"
               src="${entry.player.photo}"
               alt="${entry.player.name}"
               onerror="this.src=''" />
          <div class="player-info">
            <span class="player-name">${entry.player.name}</span>
            <span class="player-team">${stats.team?.name ?? ""}</span>
          </div>
          <span class="player-stat">
            <strong>${statValue}</strong>
            <small>${statLabel}</small>
          </span>
        </div>`;
    }).join("");

    return `
      <div class="stats-section">
        <h3 class="stats-section-title">${title}</h3>
        <div class="player-list">${rows}</div>
      </div>`;
  }

  // goals.total = number of goals scored
  // goals.assists = number of assists (API stores it under goals, not a top-level key)
  container.innerHTML =
    buildPlayerSection("⚽ Top Scorers", scorers, "goals.total",   "goals")  +
    buildPlayerSection("🎯 Top Assists", assists, "goals.assists", "assists");
}


// ── TEAM STATS CARD ──────────────────────────────────────────
// Renders the detailed stats block for a chosen team.
export function renderTeamStats(stats, container) {
  if (!stats) {
    container.innerHTML = `<div class="empty">Search for a team above to see statistics.</div>`;
    return;
  }

  const { team, league, fixtures, goals, biggest, lineups } = stats;

  // Pull numbers out of the nested API structure
  const played  = fixtures?.played?.total ?? 0;
  const wins    = fixtures?.wins?.total   ?? 0;
  const draws   = fixtures?.draws?.total  ?? 0;
  const losses  = fixtures?.loses?.total  ?? 0;
  const goalsFor     = goals?.for?.total?.total     ?? 0;
  const goalsAgainst = goals?.against?.total?.total ?? 0;
  const goalDiff     = goalsFor - goalsAgainst;

  // Win percentage (0 if no games played)
  const winPct = played > 0 ? Math.round((wins / played) * 100) : 0;

  // Most-used formation (sort lineups by how often they were played)
  const topFormation = (lineups || [])
    .sort((a, b) => b.played - a.played)[0]?.formation ?? "N/A";

  // Goal diff display (+5, -2, 0)
  const gdDisplay = goalDiff > 0 ? `+${goalDiff}` : `${goalDiff}`;

  container.innerHTML = `
    <div class="team-stats-card">

      <!-- Team name + league context -->
      <div class="team-stats-header">
        <img src="${team.logo}" alt="${team.name}" />
        <div>
          <h2>${team.name}</h2>
          <p>${league.name} · ${league.season}</p>
        </div>
      </div>

      <!-- 8-box stat grid -->
      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-val">${played}</span>
          <span class="stat-lbl">Played</span>
        </div>
        <div class="stat-box stat-win">
          <span class="stat-val">${wins}</span>
          <span class="stat-lbl">Won</span>
        </div>
        <div class="stat-box">
          <span class="stat-val">${draws}</span>
          <span class="stat-lbl">Drawn</span>
        </div>
        <div class="stat-box stat-lose">
          <span class="stat-val">${losses}</span>
          <span class="stat-lbl">Lost</span>
        </div>
        <div class="stat-box">
          <span class="stat-val">${goalsFor}</span>
          <span class="stat-lbl">Goals For</span>
        </div>
        <div class="stat-box">
          <span class="stat-val">${goalsAgainst}</span>
          <span class="stat-lbl">Goals Against</span>
        </div>
        <div class="stat-box">
          <span class="stat-val">${gdDisplay}</span>
          <span class="stat-lbl">Goal Diff</span>
        </div>
        <div class="stat-box">
          <span class="stat-val">${topFormation}</span>
          <span class="stat-lbl">Top Formation</span>
        </div>
      </div>

      <!-- Animated win-rate bar -->
      <div class="win-bar-wrap">
        <div class="win-bar-label">Win rate</div>
        <div class="win-bar-track">
          <div class="win-bar-fill" style="--pct: ${winPct}%"></div>
        </div>
        <div class="win-bar-pct">${winPct}%</div>
      </div>

      ${biggest?.wins?.away
        ? `<p class="biggest">🏆 Biggest away win: <strong>${biggest.wins.away}</strong></p>`
        : ""}
    </div>`;
}


// ── TEAM SEARCH RESULTS ──────────────────────────────────────
// Renders clickable team buttons after a search.
export function renderTeamSearch(teams, container, onSelectCallback) {
  container.innerHTML = "";

  if (!teams.length) {
    container.innerHTML = `<div class="empty">No teams found.</div>`;
    return;
  }

  // Show at most 8 results to keep it tidy
  teams.slice(0, 8).forEach(entry => {
    const btn = document.createElement("button");
    btn.className = "team-search-result";
    btn.innerHTML = `
      <img src="${entry.team.logo}" alt="${entry.team.name}"
           onerror="this.style.display='none'" />
      <span>${entry.team.name}</span>
      <small>${entry.team.country}</small>`;

    // Pass the team object (not the wrapper) to the callback
    btn.addEventListener("click", () => onSelectCallback(entry.team));
    container.appendChild(btn);
  });
}


// ── LOADING SPINNER ──────────────────────────────────────────
// Shows or hides a spinner by element ID.
export function setLoading(spinnerId, isVisible) {
  const el = document.getElementById(spinnerId);
  if (el) el.hidden = !isVisible;
}


// ── TOAST NOTIFICATION ───────────────────────────────────────
// Shows a small pop-up message at the bottom of the screen.
// type can be "success", "error", or "info".
export function showToast(message, type = "info") {
  // Remove any existing toast first so they don't stack
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger CSS transition on next frame
  requestAnimationFrame(() => toast.classList.add("toast-show"));

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 300); // wait for fade-out animation
  }, 3000);
}
