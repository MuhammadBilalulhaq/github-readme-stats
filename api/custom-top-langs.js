// File: api/custom-top-langs.js
// Place this file inside the "api" folder of your forked github-readme-stats repo on GitHub,
// commit it, and Vercel will auto-deploy. Then it's live at:
// https://<your-vercel-domain>/api/custom-top-langs?username=ahmed28510

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

  const titleColor = "#4dabf7";
  const textColor = "#ffffff";
  const percentColor = "#00f5d4";
  const bgColor = "#0d1117";
  const borderColor = "#30363d";
  const trackColor = "#21262d";

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

    const barWidth = 300;
    const barX = 25;

    let cursorX = barX;
    const segments = topLangs
      .map((l) => {
        const w = (l.percent / 100) * barWidth;
        const seg = `<rect x="${cursorX}" y="45" width="${w}" height="12" fill="${l.color}" />`;
        cursorX += w;
        return seg;
      })
      .join("");

    const rows = topLangs
      .map((l, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = barX + col * 150;
        const y = 90 + row * 26;
        return `
      <circle cx="${x + 5}" cy="${y - 4}" r="5" fill="${l.color}" />
      <text x="${x + 16}" y="${y}" font-size="13" fill="${textColor}" font-family="Segoe UI, sans-serif">${l.name}</text>
      <text x="${x + 16}" y="${y + 15}" font-size="12" fill="${percentColor}" font-family="Segoe UI, sans-serif" font-weight="bold">${l.percent.toFixed(1)}%</text>`;
      })
      .join("");

    const cardHeight = 90 + Math.ceil(topLangs.length / 2) * 26 + 20;

    const svg = `
<svg width="350" height="${cardHeight}" viewBox="0 0 350 ${cardHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="349" height="${cardHeight - 1}" rx="12" fill="${bgColor}" stroke="${borderColor}" />
  <text x="25" y="30" font-size="18" font-weight="bold" fill="${titleColor}" font-family="Segoe UI, sans-serif">Most Used Languages</text>
  <rect x="${barX}" y="45" width="${barWidth}" height="12" rx="6" fill="${trackColor}" />
  <clipPath id="barClip"><rect x="${barX}" y="45" width="${barWidth}" height="12" rx="6" /></clipPath>
  <g clip-path="url(#barClip)">${segments}</g>
  ${rows}
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
    res.status(200).send(svg);
  } catch (err) {
    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(
      `<svg width="350" height="100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="50" fill="red">Error: ${err.message}</text></svg>`
    );
  }
}
