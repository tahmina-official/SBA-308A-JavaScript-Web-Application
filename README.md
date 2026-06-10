# ⚽ Kickoff — Football Dashboard

A modern, responsive football dashboard built with **vanilla JavaScript**, powered by the **API-Football v3 API**.

🌐 Live Demo: https://tahmina-official.github.io/SBA-308A-JavaScript-Web-Application/

## Features

| Tab | What it does |
|-----|-------------|
| **Fixtures** | Last 10 results + next 10 upcoming matches for the selected league. Live scores pulse green in real time. |
| **Standings** | Full league table with W/D/L, goal difference, points, and last-5 form dots. Position color-coded for CL/EL/relegation. |
| **Stats** | Top 10 scorers & assisters for the season. Team search → per-team stats card (win rate bar, formations, biggest win). |

All 6 major leagues available: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League.

## Tech Highlights

- **4 JS modules**: `api.js`, `ui.js`, `state.js`, `main.js`
- **Fetch API** with `async/await` throughout
- **`Promise.all`** for parallel requests (e.g. recent + upcoming fixtures loaded simultaneously; scorers + assists loaded together)
- **GET requests**: fixtures, standings, top scorers, top assists, team search, team stats
- **POST** support ready via `addFavourite` pattern (extendable)
- Event loop safe: loading guard prevents overlapping requests; delegated DOM events used for dynamic content
- API key saved to `localStorage` so you only enter it once

## Project Structure

```
football-dashboard/
├── index.html
├── styles.css
├── main.js     ← Entry point, event wiring, orchestration
├── api.js      ← All API-Football fetch calls
├── ui.js       ← DOM rendering functions
├──state.js    ← App state + league constants
└── README.md
```

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/fixtures?league&season&last=10` | Recent results |
| GET | `/fixtures?league&season&next=10` | Upcoming fixtures |
| GET | `/standings?league&season` | League table |
| GET | `/players/topscorers?league&season` | Top scorers |
| GET | `/players/topassists?league&season` | Top assisters |
| GET | `/teams?search=` | Team search |
| GET | `/teams/statistics?team&league&season` | Team stat card |

## Setup

### 1. Get a free API key

1. Go to [RapidAPI → API-Football](https://rapidapi.com/api-sports/api/api-football)
2. Sign up / log in
3. Subscribe to the **free plan** (100 requests/day)
4. Copy your `X-RapidAPI-Key` from the dashboard

### 2. Run a local server

```
# VS Code → Live Server extension → click "Go Live"
```

### 3. Open and enter your key

Open and paste your key in the banner at the top, and click **Save & Load**.

Your key is stored in `localStorage` so you won't need to re-enter it.

## Free Plan Limits

- 100 requests/day
- No live score updates (live endpoint costs calls quickly)
- Some leagues may have limited coverage

---

## 👩‍💻 Author
**Tahmina Akter**

---

## 📄 License
This project is licensed for educational purposes only and is intended for learning and demonstration use.
