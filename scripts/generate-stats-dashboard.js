// scripts/generate-stats-dashboard.js
// Fetches real contribution data via GitHub GraphQL + REST and renders
// a custom dark "GitHub Stats" dashboard SVG (contributions, streak,
// commits-by-hour, top languages by repo).
//
// Requires env vars: GITHUB_TOKEN, USERNAME
// Run with: node scripts/generate-stats-dashboard.js

const USERNAME = process.env.USERNAME;
const TOKEN = process.env.GITHUB_TOKEN;
const API = "https://api.github.com/graphql";

async function gql(query) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function getContributions() {
  const query = `{
    user(login: "${USERNAME}") {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }`;
  const data = await gql(query);
  const days = data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays);
  const total = data.user.contributionsCollection.contributionCalendar.totalContributions;

  let longest = 0, run = 0, current = 0;
  for (const d of days) {
    if (d.contributionCount > 0) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) current++;
    else break;
  }
  return { total, current, longest };
}

async function getLanguages() {
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100`,
    { headers: { Authorization: `bearer ${TOKEN}` } }
  );
  const repos = await res.json();
  const counts = {};
  for (const r of repos) {
    if (r.fork || !r.language) continue;
    counts[r.language] = (counts[r.language] || 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
}

async function getCommitHours() {
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/events/public?per_page=100`,
    { headers: { Authorization: `bearer ${TOKEN}` } }
  );
  const events = await res.json();
  const hours = new Array(24).fill(0);
  for (const e of events) {
    if (e.type !== "PushEvent") continue;
    const h = new Date(e.created_at).getHours();
    hours[h] += (e.payload && e.payload.commits ? e.payload.commits.length : 1);
  }
  return hours;
}

const COLORS = ["#60a5fa", "#f472b6", "#facc15", "#34d399", "#a78bfa"];

function donut(cx, cy, r, segments) {
  let angle = -90;
  return segments
    .map((s, i) => {
      const sweep = (s.pct / 100) * 360;
      const large = sweep > 180 ? 1 : 0;
      const x1 = cx + r * Math.cos((angle * Math.PI) / 180);
      const y1 = cy + r * Math.sin((angle * Math.PI) / 180);
      angle += sweep;
      const x2 = cx + r * Math.cos((angle * Math.PI) / 180);
      const y2 = cy + r * Math.sin((angle * Math.PI) / 180);
      return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z" fill="${COLORS[i % COLORS.length]}"/>`;
    })
    .join("\n");
}

function bars(hours) {
  const max = Math.max(...hours, 1);
  return hours
    .map((v, h) => {
      const height = (v / max) * 60;
      const x = 40 + h * 22;
      return `<rect x="${x}" y="${140 - height}" width="14" height="${height}" rx="3" fill="#818cf8"/>`;
    })
    .join("\n");
}

async function main() {
  const [contrib, langs, hours] = await Promise.all([
    getContributions(),
    getLanguages(),
    getCommitHours(),
  ]);

  const svg = `<svg width="820" height="260" viewBox="0 0 820 260" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="20%" cy="20%" r="90%">
      <stop offset="0%" stop-color="#1b1440"/>
      <stop offset="100%" stop-color="#0a0818"/>
    </radialGradient>
  </defs>
  <rect width="820" height="260" rx="16" fill="url(#bg)"/>
  <text x="30" y="38" font-family="Arial" font-size="20" font-weight="800" fill="#fff">GitHub Stats</text>
  <text x="30" y="58" font-family="Arial" font-size="12" fill="#94a3b8">${USERNAME}</text>

  <text x="30" y="100" font-family="Arial" font-size="12" fill="#93c5fd">TOTAL CONTRIBUTIONS</text>
  <text x="30" y="132" font-family="Arial" font-size="34" font-weight="800" fill="#fff">${contrib.total}</text>

  <text x="220" y="100" font-family="Arial" font-size="12" fill="#93c5fd">CURRENT STREAK</text>
  <text x="220" y="132" font-family="Arial" font-size="34" font-weight="800" fill="#fff">${contrib.current}<tspan font-size="14"> days</tspan></text>

  <text x="420" y="100" font-family="Arial" font-size="12" fill="#93c5fd">LONGEST STREAK</text>
  <text x="420" y="132" font-family="Arial" font-size="34" font-weight="800" fill="#fff">${contrib.longest}<tspan font-size="14"> days</tspan></text>

  <text x="30" y="170" font-family="Arial" font-size="12" fill="#93c5fd">COMMITS BY HOUR (last ~90 public events)</text>
  ${bars(hours)}

  <text x="600" y="100" font-family="Arial" font-size="12" fill="#93c5fd">TOP LANGUAGES</text>
  ${donut(660, 170, 55, langs)}
  ${langs
    .map(
      (l, i) =>
        `<circle cx="740" cy="${150 + i * 16}" r="4" fill="${COLORS[i % COLORS.length]}"/><text x="750" y="${154 + i * 16}" font-family="Arial" font-size="10" fill="#e2e8f0">${l.name} ${l.pct}%</text>`
    )
    .join("\n")}
</svg>`;

  require("fs").mkdirSync("profile", { recursive: true });
  require("fs").writeFileSync("profile/stats-dashboard.svg", svg);
  console.log("Wrote profile/stats-dashboard.svg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
