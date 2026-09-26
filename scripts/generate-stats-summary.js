// scripts/generate-stats-summary.js
// Renders a single animated SVG containing both:
//   - GitHub stats (stars, ALL-TIME commits, rolling 12-month commits, PRs, issues)
//   - Most used languages (horizontal bar + legend)
// One outer frame, merko theme, 14s animation loop.
//
// Requires env vars: GITHUB_TOKEN, GH_USERNAME

const fs   = require("fs");
const path = require("path");

const USERNAME = process.env.GH_USERNAME;
const TOKEN    = process.env.GITHUB_TOKEN;
const API      = "https://api.github.com/graphql";

if (!USERNAME) { console.error("Missing GH_USERNAME"); process.exit(1); }
if (!TOKEN)    { console.error("Missing GITHUB_TOKEN"); process.exit(1); }

// ─── Animation timing (seconds) ──────────────────────────────────────
const LOOP       = 14.0;
const ROLL_START = 0.4;
const ROLL_END   = 2.4;
const BAR_END    = 3.6;
const LEG_END    = 4.4;

// ─── merko theme ─────────────────────────────────────────────────────
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
    body: JSON.stringify(query),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// All-time commits: loop year-by-year since the user joined.
async function getAllTimeCommits() {
  const userRes = await gql({ query: `{ user(login: "${USERNAME}") { createdAt } }` });
  const startYear   = new Date(userRes.user.createdAt).getUTCFullYear();
  const currentYear = new Date().getUTCFullYear();

  let total = 0;

  for (let year = startYear; year <= currentYear; year++) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = year === currentYear
      ? new Date().toISOString()
      : `${year}-12-31T23:59:59Z`;

    try {
      const data = await gql({
        query: `{
          user(login: "${USERNAME}") {
            contributionsCollection(from: "${from}", to: "${to}") {
              totalCommitContributions
            }
          }
        }`,
      });
      total += data.user.contributionsCollection.totalCommitContributions;
    } catch (e) {
      console.error(`  Year ${year} failed: ${e.message}`);
    }
  }

  return total;
}

// Rolling 12-month commits: from exactly 1 year ago today, to today.
// Every day this window shifts forward — the oldest day drops off, a new
// day's commits are added. Result: a genuine rolling-window count.
async function getLast12MonthCommits() {
  const now  = new Date();
  const from = new Date(now);
  from.setUTCFullYear(from.getUTCFullYear() - 1);

  // GraphQL requires ISO-8601 with explicit T00:00:00Z suffix
  const fromIso = from.toISOString();
  const toIso   = now.toISOString();

  const data = await gql({
    query: `{
      user(login: "${USERNAME}") {
        contributionsCollection(from: "${fromIso}", to: "${toIso}") {
          totalCommitContributions
        }
      }
    }`,
  });

  return data.user.contributionsCollection.totalCommitContributions;
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
      pullRequests(first: 1) { totalCount }
      issues(first: 1) { totalCount }
    }
  }`;
  const data = await gql({ query });
  const u = data.user;

  const totalStars = u.repositories.nodes.reduce((s, r) => s + r.stargazerCount, 0);

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
    prs:   u.pullRequests.totalCount,
    issues: u.issues.totalCount,
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

function rollingNumber({ x, y, value, fontSize, height, keyPrefix, delay = 0 }) {
  const valueStr = String(value);
  const digitW   = fontSize * 0.58;
  const totalW   = digitW * valueStr.length;
  const startX   = x - totalW / 2 + digitW / 2;

  return valueStr.split("").map((digit, i) => {
    const cid = `${keyPrefix}_${i}`;
    const dx  = startX + i * digitW;
    const d   = parseInt(digit, 10);
    const finalOffset = -d * height;

    const digits = Array.from({ length: 10 }, (_, n) =>
      `<text x="0" y="${n * height + fontSize * 0.92}" text-anchor="middle"
        font-size="${fontSize}" font-weight="800" fill="${T.text}">${n}</text>`
    ).join("\n");

    const animName  = `roll_${keyPrefix}_${i}`;
    const animDelay = (delay + i * 0.08).toFixed(2);

    return `
      <style>
        @keyframes ${animName} {
          0%   { transform: translateY(0); }
          ${((ROLL_START / LOOP) * 100).toFixed(3)}% { transform: translateY(0); }
          ${((ROLL_END   / LOOP) * 100).toFixed(3)}% { transform: translateY(${finalOffset}px); }
          100% { transform: translateY(${finalOffset}px); }
        }
      </style>
      <clipPath id="${cid}">
        <rect x="${dx - digitW / 2}" y="${y - fontSize}" width="${digitW}" height="${height}"/>
      </clipPath>
      <g clip-path="url(#${cid})">
        <g style="animation: ${animName} ${LOOP}s infinite; animation-delay: ${animDelay}s; transform-box: fill-box;">
          <g transform="translate(${dx}, ${y - fontSize * 0.92})">
            ${digits}
          </g>
        </g>
      </g>`;
  }).join("\n");
}

function animatedLanguageBar(x, y, w, h, langs) {
  const total = langs.reduce((s, l) => s + l.pct, 0) || 1;
  let offset = 0;

  const segs = langs.map((l, i) => {
    const segW  = (l.pct / total) * w;
    const start = x + offset;
    const animName = `langSeg_${i}`;
    const delayS   = (i * 0.08).toFixed(2);

    const svg = `
      <style>
        @keyframes ${animName} {
          0%   { clip-path: inset(0 100% 0 0); }
          ${((ROLL_START / LOOP) * 100).toFixed(3)}% { clip-path: inset(0 100% 0 0); }
          ${((BAR_END   / LOOP) * 100).toFixed(3)}% { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
      </style>
      <rect x="${start.toFixed(2)}" y="${y}" width="${segW.toFixed(2)}" height="${h}"
        fill="${T.barColors[i % T.barColors.length]}"
        style="animation: ${animName} ${LOOP}s infinite; animation-delay: ${delayS}s"/>`;

    offset += segW;
    return svg;
  }).join("\n");

  return `
    <clipPath id="langBarClip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/></clipPath>
    <g clip-path="url(#langBarClip)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T.frame}"/>
      ${segs}
    </g>`;
}

function animatedGradeRing(cx, cy, r, grade, keyPrefix) {
  const C = 2 * Math.PI * r * 0.75;
  const animName = `ring_${keyPrefix}`;
  return `
    <style>
      @keyframes ${animName} {
        0%   { stroke-dashoffset: ${(C * 0.75).toFixed(2)}; }
        ${((ROLL_START / LOOP) * 100).toFixed(3)}% { stroke-dashoffset: ${(C * 0.75).toFixed(2)}; }
        ${((ROLL_END   / LOOP) * 100).toFixed(3)}% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: 0; }
      }
    </style>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${T.frame}" stroke-width="6"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${T.accent}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${C.toFixed(2)}"
      stroke-dashoffset="0"
      transform="rotate(-90 ${cx} ${cy})"
      style="animation: ${animName} ${LOOP}s infinite"/>
    <text x="${cx}" y="${cy + 6}" text-anchor="middle"
      font-size="22" font-weight="800" fill="${T.text}">${escapeXml(grade)}</text>`;
}

function animatedLegend(items, x0, y0, colW) {
  return items.map((l, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx  = x0 + col * colW;
    const ly  = y0 + row * 20;
    const animName = `leg_${i}`;
    const delayS   = (i * 0.1).toFixed(2);

    return `
      <style>
        @keyframes ${animName} {
          0%   { opacity: 0; }
          ${((BAR_END / LOOP) * 100).toFixed(3)}% { opacity: 0; }
          ${((LEG_END / LOOP) * 100).toFixed(3)}% { opacity: 1; }
          100% { opacity: 1; }
        }
      </style>
      <g style="animation: ${animName} ${LOOP}s infinite; animation-delay: ${delayS}s">
        <circle cx="${lx + 5}" cy="${ly}" r="4" fill="${T.barColors[i % T.barColors.length]}"/>
        <text x="${lx + 16}" y="${ly + 4}" font-size="12" fill="${T.text}">${escapeXml(l.name)}</text>
        <text x="${lx + colW - 16}" y="${ly + 4}" text-anchor="end"
          font-size="12" font-weight="600" fill="${T.muted}">${l.pct}%</text>
      </g>`;
  }).join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching stats…");
  const [s, allTimeCommits, last12MonthCommits] = await Promise.all([
    getStats(),
    getAllTimeCommits(),
    getLast12MonthCommits(),
  ]);

  console.log(`  stars:              ${s.stars}`);
  console.log(`  commits (all-time): ${allTimeCommits}`);
  console.log(`  commits (12mo):     ${last12MonthCommits}`);
  console.log(`  prs:                ${s.prs}`);
  console.log(`  issues:             ${s.issues}`);

  const grade =
    allTimeCommits >= 5000 ? "A+" :
    allTimeCommits >= 2000 ? "A"  :
    allTimeCommits >= 1000 ? "A-" :
    allTimeCommits >= 500  ? "B+" :
    allTimeCommits >= 200  ? "B"  :
    allTimeCommits >= 50   ? "B-" : "C";

  const W = 1000, H = 260, PAD = 20;
  const PANEL_W = (W - PAD * 3) / 2;
  const PANEL_H = H - PAD * 2;

  const leftX  = PAD;
  const rightX = PAD * 2 + PANEL_W;

  // Six rows now: stars, all-time commits, 12mo commits, PRs, issues
  const rowsFinal = [
    ["Total Stars Earned:",           String(s.stars)],
    ["Total Commits (all-time):",     formatCount(allTimeCommits)],
    ["Commits (last 12 months):",     formatCount(last12MonthCommits)],
    ["Total PRs:",                    String(s.prs)],
    ["Total Issues:",                 String(s.issues)],
  ];

  const leftRowsSvg = rowsFinal.map(([k, v], i) => `
    <text x="${leftX + 24}" y="${112 + i * 24}"
      font-size="13" font-weight="600" fill="${T.label}">${escapeXml(k)}</text>
    <text x="${leftX + PANEL_W - 150}" y="${112 + i * 24}"
      text-anchor="end" font-size="13" font-weight="600"
      fill="${T.text}">${escapeXml(v)}</text>`).join("\n");

  const barY = 130;
  const barSvg = animatedLanguageBar(rightX + 24, barY, PANEL_W - 48, 10, s.languages);
  const legendY = 162;
  const colW = (PANEL_W - 48) / 2;
  const legendSvg = animatedLegend(s.languages, rightX + 24, legendY, colW);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
    viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub stats summary for ${escapeXml(USERNAME)}">
  <style>
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; }
    }
  </style>
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

  <rect x="${leftX}" y="${PAD}" width="${PANEL_W}" height="${PANEL_H}"
    rx="12" fill="${T.panel}" stroke="${T.panelEdge}"/>
  <rect x="${rightX}" y="${PAD}" width="${PANEL_W}" height="${PANEL_H}"
    rx="12" fill="${T.panel}" stroke="${T.panelEdge}"/>

  <text x="${leftX + 24}" y="${82}" font-size="17" font-weight="800"
    fill="${T.accent}">Adarsh Kumar's GitHub Stats</text>
  ${leftRowsSvg}
  ${animatedGradeRing(leftX + PANEL_W - 60, 165, 34, grade, "grade")}

  <text x="${rightX + 24}" y="${82}" font-size="17" font-weight="800"
    fill="${T.accent}">Most Used Languages</text>
  ${barSvg}
  ${legendSvg}
</svg>`;

  const bad =
    !svg.includes("<svg") ||
    svg.includes("NaN") ||
    svg.includes("undefined") ||
    s.stars == null ||
    allTimeCommits == null ||
    last12MonthCommits == null ||
    !Array.isArray(s.languages) ||
    s.languages.length === 0;

  if (bad) throw new Error("Refusing to write — data looks invalid");

  fs.mkdirSync("profile", { recursive: true });
  fs.writeFileSync(path.join("profile", "stats-summary.svg"), svg);
  console.log(`Wrote profile/stats-summary.svg (${svg.length} bytes)`);
}

main().catch(e => { console.error(e); process.exit(1); });
