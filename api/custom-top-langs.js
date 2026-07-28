// File: api/custom-top-langs.js  (replace the existing one with this improved version)
// Same location: inside the "api" folder of your github-readme-stats fork.
// Live at: https://<your-vercel-domain>/api/custom-top-langs?username=ahmed28510

const LANG_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  PowerShell: "#012456",
  Vue: "#41b883",
  "Jupyter Notebook": "#DA5B0B",
  Dockerfile: "#384d54",
  Lua: "#000080",
  R: "#198CE7",
  Scala: "#c22d40",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Perl: "#0298c3",
  "Objective-C": "#438eff",
  MATLAB: "#e16737",
  Solidity: "#AA6746",
};
const DEFAULT_COLOR = "#8b949e";

export default async function handler(req, res) {
  const { username = "ahmed28510" } = req.query;
  const token = process.env.PAT_1;

  const bgColorTop = "#0f1420";
  const bgColorBottom = "#161b28";
  const borderColor = "#2a3040";
  const titleColor = "#5aa9ff";
  const textColor = "#e6e6e6";
  const percentColor = "#3ddad7";
  const trackColor = "#1c2230";
  const fontFamily = "'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif";

  try {
    const query = `
      query ($login: String!) {
        user(login: $login) {
          repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
            nodes {
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges { size node { name } }
              }
            }
          }
        }
      }`;

    const ghRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { login: username } }),
    });

    const json = await ghRes.json();
    const repos = json.data.user.repositories.nodes;

    const langTotals = {};
    for (const repo of repos) {
      for (const edge of repo.languages.edges) {
        const name = edge.node.name;
        langTotals[name] = (langTotals[name] || 0) + edge.size;
      }
    }

    const totalBytes = Object.values(langTotals).reduce((a, b) => a + b, 0) || 1;

    const topLangs = Object.entries(langTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, bytes]) => ({
        name,
        percent: (bytes / totalBytes) * 100,
        color: LANG_COLORS[name] || DEFAULT_COLOR,
      }));

    // ---- Layout constants ----
    const cardWidth = 420;
    const padding = 28;
    const barX = padding;
    const barWidth = cardWidth - padding * 2;
    const barY = 68;
    const barHeight = 14;

    // ---- Proportional bar segments (with tiny gaps between colors for separation) ----
    const gap = topLangs.length > 1 ? 2 : 0;
    const usableWidth = barWidth - gap * (topLangs.length - 1);
    let cursorX = barX;
    const segments = topLangs
      .map((l, i) => {
        const w = Math.max((l.percent / 100) * usableWidth, 3);
        const seg = `<rect x="${cursorX.toFixed(2)}" y="${barY}" width="${w.toFixed(2)}" height="${barHeight}" fill="${l.color}" />`;
        cursorX += w + gap;
        return seg;
      })
      .join("");

    // ---- Legend: 2 columns, generous spacing, aligned name/percent ----
    const legendStartY = barY + 46;
    const rowHeight = 34;
    const colWidth = (cardWidth - padding * 2) / 2;

    const rows = topLangs
      .map((l, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = padding + col * colWidth;
        const y = legendStartY + row * rowHeight;
        return `
      <circle cx="${x + 6}" cy="${y - 4}" r="6" fill="${l.color}" />
      <text x="${x + 20}" y="${y}" font-size="14" font-weight="600" fill="${textColor}" font-family="${fontFamily}">${l.name}</text>
      <text x="${x + 20}" y="${y + 17}" font-size="12.5" font-weight="700" fill="${percentColor}" font-family="${fontFamily}">${l.percent.toFixed(1)}%</text>`;
      })
      .join("");

    const rowCount = Math.ceil(topLangs.length / 2);
    const cardHeight = legendStartY + rowCount * rowHeight + 14;

    const svg = `
<svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${bgColorTop}" />
      <stop offset="100%" stop-color="${bgColorBottom}" />
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect x="1" y="1" width="${cardWidth - 2}" height="${cardHeight - 2}" rx="14"
        fill="url(#cardBg)" stroke="${borderColor}" stroke-width="1" filter="url(#softShadow)" />

  <!-- accent bar next to title -->
  <rect x="${padding}" y="24" width="4" height="18" rx="2" fill="${titleColor}" />
  <text x="${padding + 14}" y="39" font-size="19" font-weight="700" fill="${titleColor}" font-family="${fontFamily}">Most Used Languages</text>

  <!-- track + colored proportional bar -->
  <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="7" fill="${trackColor}" />
  <clipPath id="barClip"><rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="7" /></clipPath>
  <g clip-path="url(#barClip)">${segments}</g>

  ${rows}
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
    res.status(200).send(svg);
  } catch (err) {
    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(
      `<svg width="420" height="100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="50" fill="red">Error: ${err.message}</text></svg>`
    );
  }
}
