// ui.js — All DOM rendering functions

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function fmtDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function statusBadge(fixture) {
  const s = fixture.fixture.status;
  if (s.short === "1H" || s.short === "2H" || s.short === "ET")
    return `<span class="badge badge-live">● LIVE ${s.elapsed}'</span>`;
  if (s.short === "HT")
    return `<span class="badge badge-live">● HT</span>`;
  if (s.short === "FT")
    return `<span class="badge badge-ft">FT</span>`;
  if (s.short === "NS")
    return `<span class="badge badge-ns">${fmt(fixture.fixture.date)}</span>`;
  return `<span class="badge badge-other">${s.short}</span>`;
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

export function renderFixtures(recent, upcoming, container) {
  container.innerHTML = "";

  const all = [
    ...recent.map(f => ({ ...f, _type: "recent" })),
    ...upcoming.map(f => ({ ...f, _type: "upcoming" })),
  ].sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

  if (!all.length) {
    container.innerHTML = `<div class="empty">No fixtures found for this league today.</div>`;
    return;
  }

  // Group by date
  const groups = {};
  all.forEach(f => {
    const key = fmtDate(f.fixture.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  });

  Object.entries(groups).forEach(([date, fixtures], gi) => {
    const group = document.createElement("div");
    group.className = "fixture-group";
    group.style.animationDelay = `${gi * 80}ms`;

    group.innerHTML = `<h3 class="fixture-date-label">${date}</h3>`;

    fixtures.forEach((f, i) => {
      const home = f.teams.home;
      const away = f.teams.away;
      const goals = f.goals;
      const isLive = ["1H","2H","ET","HT"].includes(f.fixture.status.short);
      const isFt   = f.fixture.status.short === "FT";

      const card = document.createElement("div");
      card.className = `fixture-card ${isLive ? "fixture-live" : ""}`;
      card.style.animationDelay = `${(gi * 5 + i) * 60}ms`;

      card.innerHTML = `
        <div class="fixture-team fixture-home">
          <img src="${home.logo}" alt="${home.name}" onerror="this.style.display='none'" />
          <span class="${home.winner ? 'team-winner' : ''}">${home.name}</span>
        </div>
        <div class="fixture-score">
          ${statusBadge(f)}
          <div class="score-line ${isFt || isLive ? 'score-known' : 'score-upcoming'}">
            ${isFt || isLive
              ? `<strong>${goals.home ?? 0}</strong> – <strong>${goals.away ?? 0}</strong>`
              : `<span class="vs">vs</span>`}
          </div>
        </div>
        <div class="fixture-team fixture-away">
          <span class="${away.winner ? 'team-winner' : ''}">${away.name}</span>
          <img src="${away.logo}" alt="${away.name}" onerror="this.style.display='none'" />
        </div>`;

      group.appendChild(card);
    });

    container.appendChild(group);
  });
}

// ── Standings ─────────────────────────────────────────────────────────────────

export function renderStandings(standings, container) {
  container.innerHTML = "";

  if (!standings.length) {
    container.innerHTML = `<div class="empty">Standings not available for this league/season.</div>`;
    return;
  }

  const table = document.createElement("div");
  table.className = "standings-table";

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

  standings.forEach((row, i) => {
    const el = document.createElement("div");
    el.className = "standings-row";
    el.style.animationDelay = `${i * 40}ms`;

    const form = (row.form || "").slice(-5).split("").map(c => `
      <span class="form-dot form-${c.toLowerCase()}">${c}</span>`).join("");

    const posClass = row.rank <= 4 ? "pos-cl" : row.rank <= 6 ? "pos-el" : row.rank >= standings.length - 2 ? "pos-rel" : "";

    el.innerHTML = `
      <span class="col-pos"><span class="pos-indicator ${posClass}">${row.rank}</span></span>
      <span class="col-team">
        <img src="${row.team.logo}" alt="${row.team.name}" onerror="this.style.display='none'" />
        ${row.team.name}
      </span>
      <span class="col-stat">${row.all.played}</span>
      <span class="col-stat">${row.all.win}</span>
      <span class="col-stat">${row.all.draw}</span>
      <span class="col-stat">${row.all.lose}</span>
      <span class="col-stat col-gd ${row.goalsDiff >= 0 ? 'gd-pos' : 'gd-neg'}">${row.goalsDiff > 0 ? '+' : ''}${row.goalsDiff}</span>
      <span class="col-pts"><strong>${row.points}</strong></span>
      <span class="col-form">${form}</span>`;

    table.appendChild(el);
  });

  container.appendChild(table);
}

// ── Top Scorers / Assists ─────────────────────────────────────────────────────

export function renderTopPlayers(scorers, assists, container) {
  container.innerHTML = "";

  const section = (title, players, statKey, statLabel) => {
    if (!players.length) return "";

    const rows = players.slice(0, 10).map((p, i) => `
      <div class="player-row" style="animation-delay:${i * 50}ms">
        <span class="player-rank">${i + 1}</span>
        <img class="player-photo" src="${p.player.photo}" alt="${p.player.name}" onerror="this.src=''" />
        <div class="player-info">
          <span class="player-name">${p.player.name}</span>
          <span class="player-team">${p.statistics[0]?.team?.name ?? ""}</span>
        </div>
        <span class="player-stat">
          <strong>${p.statistics[0]?.[statKey] ?? 0}</strong>
          <small>${statLabel}</small>
        </span>
      </div>`).join("");

    return `
      <div class="stats-section">
        <h3 class="stats-section-title">${title}</h3>
        <div class="player-list">${rows}</div>
      </div>`;
  };

  container.innerHTML =
    section("⚽ Top Scorers", scorers, "goals", "goals") +
    section("🎯 Top Assists", assists, "assists", "assists");
}

// ── Team Stats Card ───────────────────────────────────────────────────────────

export function renderTeamStats(stats, container) {
  if (!stats) {
    container.innerHTML = `<div class="empty">Search for a team above to see statistics.</div>`;
    return;
  }

  const { team, league, fixtures, goals, biggest, lineups } = stats;
  const played = fixtures.played.total;
  const wins   = fixtures.wins.total;
  const draws  = fixtures.draws.total;
  const losses = fixtures.loses.total;
  const gf     = goals.for.total.total;
  const ga     = goals.against.total.total;

  const winPct = played ? Math.round((wins / played) * 100) : 0;

  const topFormation = (lineups || []).sort((a,b) => b.played - a.played)[0]?.formation ?? "N/A";

  container.innerHTML = `
    <div class="team-stats-card">
      <div class="team-stats-header">
        <img src="${team.logo}" alt="${team.name}" />
        <div>
          <h2>${team.name}</h2>
          <p>${league.name} · ${league.season}</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-box"><span class="stat-val">${played}</span><span class="stat-lbl">Played</span></div>
        <div class="stat-box stat-win"><span class="stat-val">${wins}</span><span class="stat-lbl">Won</span></div>
        <div class="stat-box"><span class="stat-val">${draws}</span><span class="stat-lbl">Drawn</span></div>
        <div class="stat-box stat-lose"><span class="stat-val">${losses}</span><span class="stat-lbl">Lost</span></div>
        <div class="stat-box"><span class="stat-val">${gf}</span><span class="stat-lbl">Goals For</span></div>
        <div class="stat-box"><span class="stat-val">${ga}</span><span class="stat-lbl">Goals Against</span></div>
        <div class="stat-box"><span class="stat-val">${gf - ga > 0 ? '+' : ''}${gf - ga}</span><span class="stat-lbl">Goal Diff</span></div>
        <div class="stat-box"><span class="stat-val">${topFormation}</span><span class="stat-lbl">Top Formation</span></div>
      </div>

      <div class="win-bar-wrap">
        <div class="win-bar-label">Win rate</div>
        <div class="win-bar-track">
          <div class="win-bar-fill" style="--pct: ${winPct}%"></div>
        </div>
        <div class="win-bar-pct">${winPct}%</div>
      </div>

      ${biggest?.wins?.away ? `<p class="biggest">🏆 Biggest away win: <strong>${biggest.wins.away}</strong></p>` : ""}
    </div>`;
}

// ── Team Search Results ───────────────────────────────────────────────────────

export function renderTeamSearch(teams, container, onSelect) {
  container.innerHTML = "";
  if (!teams.length) {
    container.innerHTML = `<div class="empty">No teams found.</div>`;
    return;
  }
  teams.slice(0, 8).forEach(t => {
    const el = document.createElement("button");
    el.className = "team-search-result";
    el.innerHTML = `
      <img src="${t.team.logo}" alt="${t.team.name}" onerror="this.style.display='none'" />
      <span>${t.team.name}</span>
      <small>${t.team.country}</small>`;
    el.addEventListener("click", () => onSelect(t.team));
    container.appendChild(el);
  });
}

// ── Loading / Toast ───────────────────────────────────────────────────────────

export function setLoading(id, visible) {
  const el = document.getElementById(id);
  if (el) el.hidden = !visible;
}

export function showToast(msg, type = "info") {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("toast-show"));
  setTimeout(() => { t.classList.remove("toast-show"); setTimeout(() => t.remove(), 300); }, 3000);
}
