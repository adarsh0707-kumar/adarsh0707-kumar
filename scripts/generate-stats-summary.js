// scripts/generate-stats-summary.js
// Renders a single SVG containing both:
//   - GitHub stats (stars, commits, PRs, issues, contributed-to)
//   - Most used languages (horizontal bar + legend)
// One outer frame, merko theme, matching the profile's other cards.
//
// Requires env vars: GITHUB_TOKEN, GH_USERNAME
// Run: GH_USERNAME=adarsh0707-kumar GITHUB_TOKEN=... node scripts/generate-stats-summary.js

const fs   = require("fs");
const path = require("path");

const USERNAME = process.env.GH_USERNAME;
const TOKEN    = process.env.GITHUB_TOKEN;
const API      = "https://api.github.com/graphql";

if (!USERNAME) { console.error("Missing GH_USERNAME"); process.exit(1); }
if (!TOKEN)    { console.error("Missing GITHUB_TOKEN"); process.exit(1); }

// ─── merko theme (matches profile/stats.svg, top-langs.svg) ─────────
const T = {
  bg:         "#0d1117",
  bgGrad:     "#0a1f13",
  frame:      "#ffffff14",
  panel:      "#ffffff06",
  panelEdge:  "#ffffff12",
  text:       "#e6edf3",
  muted:      "#8b949e",
  label:      "#7ee787",
  accent:     "#39d353",
  barColors:  ["#39d353", "#f778ba", "#f0883e", "#58a6ff", "#a371f7", "#79c0ff"],
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

async function getStats() {
  const query = `{
    user(login: "${USERNAME}") {
      repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
        totalCount
        nodes {
          stargazerCount
          primaryLanguage { name }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        contributionCalendar {
          totalContributions
        }
      }
      pullRequests(first: 1) { totalCount }
      issues(first: 1) { totalCount }
    }
  }`;
  const data = await gql(query);
  const u = data.user;

  const totalStars = u.repositories.nodes.reduce((s, r) => s + r.stargazerCount, 0);

  // Language percentages by repo count
  const counts = {};
  for (const r of u.repositories.nodes) {
    const lang = r.primaryLanguage && r.primaryLanguage.name;
    if (!lang) continue;
    counts[lang] = (counts[lang] || 0) + 1;
  }
  const totalLangs = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const languages = Object.entries(counts)
    .map(([name, c]) => ({ name, pct: Math.round((c / totalLangs) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  return {
    stars: totalStars,
    commits: u.contributionsCollection.totalCommitContributions,
    prs: u.contributionsCollection.totalPullRequestContributions,
    issues: u.contributionsCollection.totalIssueContributions,
    contributions: u.contributionsCollection.contributionCalendar.totalContributions,
    languages,
  };
}

// ─── SVG helpers ─────────────────────────────────────────────────────
function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, c =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
}

function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

// Grade badge ring — draws based on commit volume
function gradeRing(cx, cy, r, grade) {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${T.frame}" stroke-width="6"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${T.accent}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${(2 * Math.PI * r * 0.75).toFixed(2)}"
      stroke-dashoffset="0"
      transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy + 6}" text-anchor="middle"
      font-size="22" font-weight="800" fill="${T.text}">${escapeXml(grade)}</text>`;
}

// Horizontal language bar — a stacked row of colored segments
function languageBar(x, y, w, h, langs) {
  const total = langs.reduce((s, l) => s + l.pct, 0) || 1;
  let offset = 0;
  const segs = langs.map((l, i) => {
    const segW = (l.pct / total) * w;
    const rect = `<rect x="${(x + offset).toFixed(2)}" y="${y}"
      width="${segW.toFixed(2)}" height="${h}"
      fill="${T.barColors[i % T.barColors.length]}"/>`;
    offset += segW;
    return rect;
  }).join("\n");
  return `<clipPath id="langBarClip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/></clipPath>
    <g clip-path="url(#langBarClip)">${segs}</g>`;
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const s = await getStats();

  // Simple grade heuristic based on total commits
  const grade =
    s.commits >= 1000 ? "A+" :
    s.commits >= 500  ? "A"  :
    s.commits >= 200  ? "A-" :
    s.commits >= 100  ? "B+" :
    s.commits >= 50   ? "B"  :
    s.commits >= 20   ? "B-" : "C";

  const W = 1000, H = 240, PAD = 20;
  const PANEL_W = (W - PAD * 3) / 2;   // 2 panels + 3 gaps
  const PANEL_H = H - PAD * 2;

  const leftX  = PAD;
  const rightX = PAD * 2 + PANEL_W;

  // Left panel content
  const statsRows = [
    ["Total Stars Earned:",      String(s.stars)],
    ["Total Commits:",           formatCount(s.commits)],
    ["Total PRs:",               String(s.prs)],
    ["Total Issues:",            String(s.issues)],
    ["Contributed to (last year):", String(s.contributions)],
  ];

  const leftRowsSvg = statsRows.map(([k, v], i) => `
    <text x="${leftX + 24}" y="${112 + i * 26}"
      font-size="14" font-weight="600" fill="${T.label}">${escapeXml(k)}</text>
    <text x="${leftX + PANEL_W - 130}" y="${112 + i * 26}"
      text-anchor="end" font-size="14" font-weight="600"
      fill="${T.text}">${escapeXml(v)}</text>`).join("\n");

  // Right panel content
  const barY = 110;
  const barSvg = languageBar(rightX + 24, barY, PANEL_W - 48, 10, s.languages);

  // Two-column legend under the bar
  const legendY = 142;
  const colW = (PANEL_W - 48) / 2;
  const legendSvg = s.languages.map((l, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx = rightX + 24 + col * colW;
    const ly = legendY + row * 20;
    return `
      <circle cx="${lx + 5}" cy="${ly}" r="4" fill="${T.barColors[i % T.barColors.length]}"/>
      <text x="${lx + 16}" y="${ly + 4}" font-size="12" fill="${T.text}">${escapeXml(l.name)}</text>
      <text x="${lx + colW - 16}" y="${ly + 4}" text-anchor="end"
        font-size="12" font-weight="600" fill="${T.muted}">${l.pct}%</text>`;
  }).join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
    viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub stats summary for ${escapeXml(USERNAME)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0"   stop-color="${T.bgGrad}"/>
      <stop offset="0.5" stop-color="${T.bg}"/>
      <stop offset="1"   stop-color="${T.bg}"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.15" cy="0.1" r="0.6">
      <stop offset="0" stop-color="#39d353" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#39d353" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0.9" cy="0.95" r="0.55">
      <stop offset="0" stop-color="#58a6ff" stop-opacity="0.1"/>
      <stop offset="1" stop-color="#58a6ff" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="frameClip"><rect width="${W}" height="${H}" rx="16"/></clipPath>
  </defs>

  <g clip-path="url(#frameClip)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glowA)"/>
    <rect width="${W}" height="${H}" fill="url(#glowB)"/>
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16"
    fill="none" stroke="${T.frame}" stroke-width="1"/>

  <!-- Inner panel backgrounds -->
  <rect x="${leftX}" y="${PAD}" width="${PANEL_W}" height="${PANEL_H}"
    rx="12" fill="${T.panel}" stroke="${T.panelEdge}"/>
  <rect x="${rightX}" y="${PAD}" width="${PANEL_W}" height="${PANEL_H}"
    rx="12" fill="${T.panel}" stroke="${T.panelEdge}"/>

  <!-- Left panel: stats -->
  <text x="${leftX + 24}" y="${76}" font-size="17" font-weight="800"
    fill="${T.accent}">Adarsh Kumar's GitHub Stats</text>
  ${leftRowsSvg}
  ${gradeRing(leftX + PANEL_W - 60, 155, 34, grade)}

  <!-- Right panel: languages -->
  <text x="${rightX + 24}" y="${76}" font-size="17" font-weight="800"
    fill="${T.accent}">Most Used Languages</text>
  ${barSvg}
  ${legendSvg}
</svg>`;

  // ── Validation
  const bad =
    !svg.includes("<svg") ||
    svg.includes("NaN") ||
    svg.includes("undefined") ||
    s.stars == null ||
    s.commits == null ||
    !Array.isArray(s.languages) ||
    s.languages.length === 0;

  if (bad) throw new Error("Refusing to write — data looks invalid");

  fs.mkdirSync("profile", { recursive: true });
  fs.writeFileSync(path.join("profile", "stats-summary.svg"), svg);
  console.log(`Wrote profile/stats-summary.svg (${svg.length} bytes)`);
}

main().catch(e => { console.error(e); process.exit(1); });
