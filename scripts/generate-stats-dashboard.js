// scripts/generate-stats-dashboard.js
// Fetches real contribution data via GitHub GraphQL + REST and renders
// a custom dark "GitHub Stats" dashboard SVG (contributions, streak,
// commits-by-hour, top languages by repo).
//
// Theme: merko (matches profile/stats.svg + profile/top-langs.svg)
//
// Requires env vars: GITHUB_TOKEN, GH_USERNAME
// Run with: GH_USERNAME=adarsh0707-kumar GITHUB_TOKEN=... node scripts/generate-stats-dashboard.js

const USERNAME = process.env.GH_USERNAME;
const TOKEN = process.env.GITHUB_TOKEN;
const API = "https://api.github.com/graphql";

if (!USERNAME) {
  console.error("Missing GH_USERNAME env var");
  process.exit(1);
}
if (!TOKEN) {
  console.error("Missing GITHUB_TOKEN env var");
  process.exit(1);
}

// ─── merko theme palette ─────────────────────────────────────────────
const T = {
  bg:        "#0d1117",
  border:    "#1f6feb33",
  title:     "#39d353",   // merko green
  label:     "#7ee787",   // light green
  value:     "#ffffff",
  muted:     "#8b949e",
  bar:       "#39d353",
  barDim:    "#1f6feb",
  donut:     ["#39d353", "#f778ba", "#f0883e", "#58a6ff", "#a371f7"],
  panel:     "#161b22",
};

// ─── GitHub API helpers ──────────────────────────────────────────────
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
  const cal  = data.user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays);

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
  return { total: cal.totalContributions, current, longest };
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

// ─── SVG drawing helpers ─────────────────────────────────────────────
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
      return `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${T.donut[i % T.donut.length]}"/>`;
    })
    .join("\n");
}

// Bars now live in a dedicated band from x=40 to x=560, y=210..300.
// This is well clear of the three stat blocks (y=100..150) and the donut
// column (x=620+), so nothing overlaps.
function bars(hours) {
  const max     = Math.max(...hours, 1);
  const baseY   = 300;   // bottom of bar area
  const maxBarH = 70;    // tallest bar height
  const barW    = 16;
  const gap     = 6;
  const startX  = 40;

  return hours
    .map((v, h) => {
      const height = Math.max((v / max) * maxBarH, 1.5);
      const x = startX + h * (barW + gap);
      return `<rect x="${x}" y="${baseY - height}" width="${barW}" height="${height}" rx="2" fill="${T.bar}"/>`;
    })
    .join("\n");
}

function hourTicks() {
  // Show 00, 06, 12, 18, 23 under the bar chart
  const baseY = 316;
  const barW = 16, gap = 6, startX = 40;
  return [0, 6, 12, 18, 23]
    .map((h) => {
      const x = startX + h * (barW + gap) + barW / 2;
      return `<text x="${x}" y="${baseY}" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="9" fill="${T.muted}" text-anchor="middle">${String(h).padStart(2, "0")}</text>`;
    })
    .join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const [contrib, langs, hours] = await Promise.all([
    getContributions(),
    getLanguages(),
    getCommitHours(),
  ]);

  const svg = `<svg width="820" height="340" viewBox="0 0 820 340" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="20%" cy="15%" r="100%">
      <stop offset="0%"   stop-color="#0d2818"/>
      <stop offset="60%"  stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#050810"/>
    </radialGradient>
  </defs>

  <!-- Background card -->
  <rect width="820" height="340" rx="14" fill="url(#bg)"/>
  <rect x="0.5" y="0.5" width="819" height="339" rx="14" fill="none" stroke="${T.border}"/>

  <!-- Header -->
  <text x="30" y="40" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="20" font-weight="800" fill="${T.title}">GitHub Stats</text>
  <text x="30" y="60" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="12" fill="${T.muted}">${USERNAME}</text>

  <!-- Row 1: three stat blocks (y = 90..160) -->
  <text x="30" y="100" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="11" font-weight="600" letter-spacing="1.5" fill="${T.label}">TOTAL CONTRIBUTIONS</text>
  <text x="30" y="142" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="36" font-weight="800" fill="${T.value}">${contrib.total}</text>

  <text x="290" y="100" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="11" font-weight="600" letter-spacing="1.5" fill="${T.label}">CURRENT STREAK</text>
  <text x="290" y="142" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="36" font-weight="800" fill="${T.value}">${contrib.current}<tspan font-size="14" fill="${T.muted}"> days</tspan></text>

  <text x="500" y="100" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="11" font-weight="600" letter-spacing="1.5" fill="${T.label}">LONGEST STREAK</text>
  <text x="500" y="142" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="36" font-weight="800" fill="${T.value}">${contrib.longest}<tspan font-size="14" fill="${T.muted}"> days</tspan></text>

  <!-- Divider -->
  <line x1="30" y1="172" x2="790" y2="172" stroke="${T.border}"/>

  <!-- Row 2: commits-by-hour (left) + top-langs donut (right) -->
  <text x="30" y="200" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="11" font-weight="600" letter-spacing="1.5" fill="${T.label}">COMMITS BY HOUR</text>
  <text x="30" y="214" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="10" fill="${T.muted}">last ~90 public events</text>

  ${bars(hours)}
  ${hourTicks()}

  <!-- Top languages donut -->
  <text x="620" y="200" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="11" font-weight="600" letter-spacing="1.5" fill="${T.label}">TOP LANGUAGES</text>

  <g transform="translate(620, 300)">
    ${donut(0, 0, 48, langs)}
    <circle cx="0" cy="0" r="26" fill="${T.bg}"/>
    <text x="0" y="4" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="11" fill="${T.muted}" text-anchor="middle">top 5</text>
  </g>

  <g>
    ${langs
      .map(
        (l, i) => `
      <circle cx="700" cy="${244 + i * 18}" r="4" fill="${T.donut[i % T.donut.length]}"/>
      <text x="712" y="${248 + i * 18}" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="10" fill="${T.value}">${l.name}</text>
      <text x="790" y="${248 + i * 18}" font-family="-apple-system,Segoe UI,Roboto,Arial" font-size="10" fill="${T.muted}" text-anchor="end">${l.pct}%</text>`
      )
      .join("\n")}
  </g>
</svg>`;

  // ─── Validate before writing ──────────────────────────────────────
  const bad =
    !svg.includes("<svg") ||
    svg.includes("NaN") ||
    svg.includes("undefined") ||
    contrib.total   == null ||
    contrib.current == null ||
    contrib.longest == null ||
    !Array.isArray(langs) ||
    langs.length === 0 ||
    !Array.isArray(hours);

  if (bad) {
    throw new Error("Refusing to write stats-dashboard.svg — data looks invalid");
  }

  require("fs").mkdirSync("profile", { recursive: true });
  require("fs").writeFileSync("profile/stats-dashboard.svg", svg);
  console.log("Wrote profile/stats-dashboard.svg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
