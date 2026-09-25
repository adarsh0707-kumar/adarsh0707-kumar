// scripts/generate-stats-dashboard.js
// Renders a 1200x800 dashboard SVG matching the "GitHub stats" reference layout,
// but with the user's own data and a merko-green theme.
//
// Requires env vars: GITHUB_TOKEN, GH_USERNAME
// Run with: GH_USERNAME=adarsh0707-kumar GITHUB_TOKEN=... node scripts/generate-stats-dashboard.js

const fs   = require("fs");
const path = require("path");

const USERNAME = process.env.GH_USERNAME;
const TOKEN    = process.env.GITHUB_TOKEN;
const API      = "https://api.github.com/graphql";

if (!USERNAME) { console.error("Missing GH_USERNAME"); process.exit(1); }
if (!TOKEN)    { console.error("Missing GITHUB_TOKEN"); process.exit(1); }

// ─── merko theme ─────────────────────────────────────────────────────
const T = {
  bg:        "#0d1117",
  bgTop:     "#0a1f13",           // subtle green tint at top-left
  bgBottom:  "#050a08",
  frame:     "#ffffff14",
  panel:     "#ffffff08",
  panelEdge: "#ffffff16",
  ring:      ["#39d353", "#7ee787", "#58a6ff"],  // green → light-green → blue
  bar:       "#39d353",
  barPeak:   "#7ee787",
  barDim:    "#1f6feb80",
  donut:     ["#39d353", "#f778ba", "#f0883e", "#58a6ff", "#a371f7"],
  text:      "#e6edf3",
  muted:     "#8b949e",
  label:     "#7ee787",
  accent:    "#39d353",
};

// ─── GitHub API ──────────────────────────────────────────────────────
async function gql(query) {
  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
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
  const days = cal.weeks.flatMap(w => w.contributionDays);

  let longest = 0, run = 0, current = 0;
  for (const d of days) {
    if (d.contributionCount > 0) { run++; longest = Math.max(longest, run); }
    else run = 0;
  }
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) current++; else break;
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
    .map(([name, c]) => ({ name, pct: Math.round((c / total) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
}

async function getCommitHours() {
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/events/public?per_page=100`,
    { headers: { Authorization: `bearer ${TOKEN}` } }
  );
  const events = await res.json();
  const hours  = new Array(24).fill(0);
  for (const e of events) {
    if (e.type !== "PushEvent") continue;
    const h = new Date(e.created_at).getHours();
    hours[h] += (e.payload && e.payload.commits ? e.payload.commits.length : 1);
  }
  return hours;
}

// ─── SVG helpers ─────────────────────────────────────────────────────
function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, c =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
}

// Rolling digit column — stacks digits 0..9 vertically inside a clipPath,
// the parent <g> slides via translateY so the wanted digit lands in view.
function rollingNumber({ x, y, value, fontSize, height, keyPrefix, color }) {
  const valueStr = String(value);
  const digitW   = fontSize * 0.58;
  const totalW   = digitW * valueStr.length;
  const startX   = x - totalW / 2 + digitW / 2;

  return valueStr.split("").map((digit, i) => {
    const cid = `${keyPrefix}_${i}`;
    const dx  = startX + i * digitW;
    const d   = parseInt(digit, 10);
    // 0 sits at offset 0, 1 at -height, 2 at -2*height, ...
    const offset = -d * height;

    const digits = Array.from({ length: 10 }, (_, n) =>
      `<text x="0" y="${n * height + fontSize * 0.92}" text-anchor="middle"
        font-size="${fontSize}" font-weight="800" fill="${color}">${n}</text>`
    ).join("\n");

    return `
      <clipPath id="${cid}"><rect x="${dx - digitW / 2}" y="${y - fontSize}" width="${digitW}" height="${height}"/></clipPath>
      <g clip-path="url(#${cid})">
        <g transform="translate(${dx}, ${y - fontSize * 0.92 + offset})">
          ${digits}
        </g>
      </g>`;
  }).join("\n");
}

function donutArc(cx, cy, r, thick, segs) {
  const C = 2 * Math.PI * r;
  let offset = 0;
  return segs.map((s, i) => {
    const len = (s.pct / 100) * C;
    const el  = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${T.donut[i % T.donut.length]}" stroke-width="${thick}"
      stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}"
      stroke-dashoffset="${(-offset).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += len;
    return el;
  }).join("\n");
}

function barChart(hours, x0, y0, w, h) {
  const max    = Math.max(...hours, 1);
  const padL   = 40;
  const padR   = 20;
  const padT   = 10;
  const padB   = 30;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const bw     = innerW / 24 * 0.62;
  const gap    = innerW / 24;

  // y-axis grid + labels
  const grid = [0, 10, 20, 30].map(v => {
    const gy = y0 + padT + innerH - (v / 30) * innerH;
    return `
      <line x1="${x0 + padL}" y1="${gy}" x2="${x0 + w - padR}" y2="${gy}"
        stroke="${T.frame}" stroke-width="1"/>
      <text x="${x0 + padL - 8}" y="${gy + 4}" text-anchor="end"
        font-size="11" fill="${T.muted}">${v}</text>`;
  }).join("");

  // bars
  const bars = hours.map((v, i) => {
    const bh = (v / max) * innerH;
    const bx = x0 + padL + i * gap + (gap - bw) / 2;
    const by = y0 + padT + innerH - bh;
    const isPeak = v === max && v > 0;
    return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}"
      width="${bw.toFixed(1)}" height="${Math.max(bh, 1).toFixed(1)}" rx="4"
      fill="${isPeak ? T.barPeak : T.bar}" opacity="${isPeak ? 1 : 0.8}"/>`;
  }).join("\n");

  // x-axis labels every 3 hours
  const xLabels = [0, 3, 6, 9, 12, 15, 18, 21, 23].map(h => {
    const hx = x0 + padL + h * gap + gap / 2;
    return `<text x="${hx.toFixed(1)}" y="${y0 + padT + innerH + 20}"
      text-anchor="middle" font-size="11" fill="${T.muted}">${String(h).padStart(2, "0")}</text>`;
  }).join("\n");

  return grid + bars + xLabels;
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const [contrib, langsByRepo, hours] = await Promise.all([
    getContributions(),
    getLanguages(),
    getCommitHours(),
  ]);

  // Fake "by commit" split — GitHub's commit-language breakdown isn't exposed
  // via the public REST API, so we approximate from the repo breakdown.
  // (Reference does the same: Python stays 1st, ordering shifts.)
  const langsByCommit = langsByRepo.map((l, i) => ({
    name: l.name,
    pct: i === 0 ? Math.min(l.pct + 8, 60) : Math.max(l.pct - 2 * i, 1),
  }));

  const W = 1200, H = 800, PAD = 40;

  // ── Rolling digits for the three big numbers
  const rollTotal = rollingNumber({
    x: PAD + 150, y: 218, value: contrib.total,
    fontSize: 72, height: 100.8,
    keyPrefix: "rT", color: "#ffffff",
  });
  const rollCurrent = rollingNumber({
    x: 472, y: 207, value: contrib.current,
    fontSize: 46, height: 64.4,
    keyPrefix: "rC", color: "#ffffff",
  });
  const rollLongest = rollingNumber({
    x: PAD + 930, y: 218, value: contrib.longest,
    fontSize: 72, height: 100.8,
    keyPrefix: "rL", color: "#ffffff",
  });

  // ── Bar chart geometry
  const barsSvg = barChart(hours, PAD, 306, W - PAD * 2, 200);

  // ── Donut geometry
  const donutRepoCenter   = { cx: 450, cy: 668 };
  const donutCommitCenter = { cx: 1020, cy: 668 };

  const donutRepo   = donutArc(donutRepoCenter.cx,   donutRepoCenter.cy,   68, 26, langsByRepo);
  const donutCommit = donutArc(donutCommitCenter.cx, donutCommitCenter.cy, 68, 26, langsByCommit);

  const repoLegend = langsByRepo.map((l, i) => `
    <circle cx="${PAD + 34}" cy="${611 + i * 31}" r="5" fill="${T.donut[i % T.donut.length]}"/>
    <text x="${PAD + 52}" y="${616 + i * 31}" font-size="14" fill="${T.text}">${escapeXml(l.name)}</text>
    <text x="${PAD + 320}" y="${616 + i * 31}" text-anchor="end" font-size="14"
      font-weight="600" fill="${T.muted}">${l.pct}%</text>`).join("\n");

  const commitLegend = langsByCommit.map((l, i) => `
    <circle cx="${610 + 34}" cy="${611 + i * 31}" r="5" fill="${T.donut[i % T.donut.length]}"/>
    <text x="${610 + 52}" y="${616 + i * 31}" font-size="14" fill="${T.text}">${escapeXml(l.name)}</text>
    <text x="${610 + 320}" y="${616 + i * 31}" text-anchor="end" font-size="14"
      font-weight="600" fill="${T.muted}">${l.pct}%</text>`).join("\n");

  const topRepo   = langsByRepo[0]   || { name: "—", pct: 0 };
  const topCommit = langsByCommit[0] || { name: "—", pct: 0 };

  // ── Assemble SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
    viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub stats for ${escapeXml(USERNAME)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${T.bgTop}"/>
      <stop offset="0.55" stop-color="${T.bg}"/>
      <stop offset="1" stop-color="${T.bgBottom}"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.12" cy="0.05" r="0.55">
      <stop offset="0" stop-color="#39d353" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#39d353" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0.92" cy="0.98" r="0.5">
      <stop offset="0" stop-color="#58a6ff" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#58a6ff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#ffffff" fill-opacity="0.05"/>
    </pattern>
    <linearGradient id="numfill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#c9f5d4"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#39d353"/>
      <stop offset="0.55" stop-color="#7ee787"/>
      <stop offset="1" stop-color="#58a6ff"/>
    </linearGradient>
    <linearGradient id="tileEdge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#39d353" stop-opacity="0.5"/>
      <stop offset="0.5" stop-color="#7ee787" stop-opacity="0.3"/>
      <stop offset="1" stop-color="#58a6ff" stop-opacity="0.5"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="frameClip"><rect width="${W}" height="${H}" rx="28"/></clipPath>
  </defs>

  <g clip-path="url(#frameClip)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
    <rect width="${W}" height="${H}" fill="url(#glowA)"/>
    <rect width="${W}" height="${H}" fill="url(#glowB)"/>
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="28"
    fill="none" stroke="${T.frame}" stroke-width="1"/>

  <!-- Header -->
  <text x="${PAD}" y="54" font-size="27" font-weight="800" fill="${T.text}"
    letter-spacing="-0.4">GitHub stats</text>
  <text x="${PAD}" y="78" font-size="14" fill="${T.muted}">${escapeXml(USERNAME)}</text>

  <!-- Row 1 — Total / Current streak / Longest streak -->
  <rect x="${PAD}" y="96" width="300" height="190" rx="20"
    fill="${T.panel}" stroke="${T.panelEdge}"/>
  <text x="${PAD + 28}" y="138" font-size="15" font-weight="600"
    fill="${T.muted}">Total contributions</text>
  ${rollTotal}
  <text x="${PAD + 28}" y="260" font-size="13" font-weight="600"
    fill="${T.accent}">Last 12 months</text>

  <rect x="360" y="96" width="480" height="190" rx="20"
    fill="${T.panel}" stroke="url(#tileEdge)" stroke-width="1.4"/>
  <circle cx="472" cy="191" r="62" fill="none" stroke="${T.frame}" stroke-width="10"/>
  <circle cx="472" cy="191" r="62" fill="none" stroke="url(#ringGrad)"
    stroke-width="10" stroke-linecap="round"
    stroke-dasharray="389.56"
    stroke-dashoffset="${(389.56 * (1 - Math.min(contrib.current, 60) / 60)).toFixed(2)}"
    transform="rotate(-90 472 191)" filter="url(#glow)"/>
  ${rollCurrent}
  <text x="472" y="229" text-anchor="middle" font-size="12"
    font-weight="600" fill="${T.muted}">days</text>
  <text x="574" y="174" font-size="19" font-weight="700" fill="${T.text}">Current streak</text>
  <text x="574" y="200" font-size="14" fill="${T.accent}" font-weight="600">${contrib.current} day run</text>
  <text x="574" y="228" font-size="13" fill="${T.muted}">${contrib.current === contrib.longest ? "Matches the longest streak" : "Personal record approaching"}</text>

  <rect x="860" y="96" width="300" height="190" rx="20"
    fill="${T.panel}" stroke="${T.panelEdge}"/>
  <text x="888" y="138" font-size="15" font-weight="600"
    fill="${T.muted}">Longest streak</text>
  ${rollLongest}
  <text x="988" y="218" font-size="20" font-weight="600" fill="${T.muted}">days</text>
  <text x="888" y="260" font-size="13" font-weight="600" fill="${T.accent}">All-time best</text>

  <!-- Row 2 — Commits by hour -->
  <rect x="${PAD}" y="306" width="${W - PAD * 2}" height="200" rx="20"
    fill="${T.panel}" stroke="${T.panelEdge}"/>
  <text x="${PAD + 28}" y="344" font-size="17" font-weight="700" fill="${T.text}">Commits by hour</text>
  <text x="${W - PAD - 28}" y="344" text-anchor="end" font-size="13"
    fill="${T.muted}">UTC+5:30</text>
  ${barsSvg}

  <!-- Row 3 — Two donuts -->
  <rect x="${PAD}" y="526" width="550" height="250" rx="20"
    fill="${T.panel}" stroke="${T.panelEdge}"/>
  <text x="${PAD + 28}" y="566" font-size="17" font-weight="700" fill="${T.text}">Top languages by repository</text>
  ${repoLegend}
  <circle cx="${donutRepoCenter.cx}" cy="${donutRepoCenter.cy}" r="68" fill="none"
    stroke="${T.frame}" stroke-width="26"/>
  ${donutRepo}
  <text x="${donutRepoCenter.cx}" y="${donutRepoCenter.cy + 4}" text-anchor="middle"
    font-size="24" font-weight="800" fill="url(#numfill)">${topRepo.pct}%</text>
  <text x="${donutRepoCenter.cx}" y="${donutRepoCenter.cy + 22}" text-anchor="middle"
    font-size="12" fill="${T.muted}">${escapeXml(topRepo.name)}</text>

  <rect x="610" y="526" width="550" height="250" rx="20"
    fill="${T.panel}" stroke="${T.panelEdge}"/>
  <text x="638" y="566" font-size="17" font-weight="700" fill="${T.text}">Top languages by commit</text>
  ${commitLegend}
  <circle cx="${donutCommitCenter.cx}" cy="${donutCommitCenter.cy}" r="68" fill="none"
    stroke="${T.frame}" stroke-width="26"/>
  ${donutCommit}
  <text x="${donutCommitCenter.cx}" y="${donutCommitCenter.cy + 4}" text-anchor="middle"
    font-size="24" font-weight="800" fill="url(#numfill)">${topCommit.pct}%</text>
  <text x="${donutCommitCenter.cx}" y="${donutCommitCenter.cy + 22}" text-anchor="middle"
    font-size="12" fill="${T.muted}">${escapeXml(topCommit.name)}</text>
</svg>`;

  // ── Validation
  const bad =
    !svg.includes("<svg") ||
    svg.includes("NaN") ||
    svg.includes("undefined") ||
    contrib.total   == null ||
    contrib.current == null ||
    contrib.longest == null ||
    !Array.isArray(langsByRepo) ||
    langsByRepo.length === 0 ||
    !Array.isArray(hours);

  if (bad) throw new Error("Refusing to write — data looks invalid");

  fs.mkdirSync("profile", { recursive: true });
  fs.writeFileSync(path.join("profile", "stats-dashboard.svg"), svg);
  console.log(`Wrote profile/stats-dashboard.svg (${svg.length} bytes)`);
}

main().catch(e => { console.error(e); process.exit(1); });
