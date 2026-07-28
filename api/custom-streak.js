// File: api/custom-streak.js  (REPLACE your existing file with this)
// Same location: inside the "api" folder of your github-readme-stats fork.
// Live at: https://<your-vercel-domain>/api/custom-streak?username=ahmed28510
//
// This mimics the classic "streak stats" card look (total | current streak with fire ring | longest)
// but runs on YOUR OWN reliable Vercel deployment - no dependency on the public streak-stats service.

export default async function handler(req, res) {
  const { username = "ahmed28510" } = req.query;
  const token = process.env.PAT_1;

  const bgColorTop = "#0f1420";
  const bgColorBottom = "#161b28";
  const borderColor = "#2a3040";
  const dividerColor = "#2a3040";
  const numberColor = "#e6e6e6";
  const labelColor = "#9aa4b2";
  const dateColor = "#6b7280";
  const fireRingColor1 = "#ff9a3c";
  const fireRingColor2 = "#ff3c78";
  const fireTextColor = "#ffb347";
  const totalAccent = "#5aa9ff";
  const longestAccent = "#3ddad7";
  const fontFamily = "'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif";

  try {
    const query = `
      query ($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays { date contributionCount }
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
    const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks;

    const days = [];
    for (const w of weeks) {
      for (const d of w.contributionDays) {
        days.push({ date: d.date, count: d.contributionCount });
      }
    }

    const totalContributions = days.reduce((a, d) => a + d.count, 0);

    let longest = 0, running = 0, longestStart = "", longestEnd = "", tempStart = "";
    for (const d of days) {
      if (d.count > 0) {
        if (running === 0) tempStart = d.date;
        running++;
        if (running > longest) {
          longest = running;
          longestStart = tempStart;
          longestEnd = d.date;
        }
      } else {
        running = 0;
      }
    }

    let current = 0;
    let currentStart = "";
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) {
        current++;
        currentStart = days[i].date;
      } else {
        if (i === days.length - 1) continue; // allow today with 0 contributions so far
        break;
      }
    }
    const currentEnd = days.length ? days[days.length - 1].date : "";

    const fmt = (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const firstDay = days.length ? days[0].date : "";

    // ---- Layout ----
    const cardWidth = 460;
    const cardHeight = 195;
    const midX = cardWidth / 2;
    const colTotalX = 105;
    const colLongestX = cardWidth - 105;
    const ringCx = midX;
    const ringCy = 88;
    const ringR = 46;

    const svg = `
<svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${bgColorTop}" />
      <stop offset="100%" stop-color="${bgColorBottom}" />
    </linearGradient>
    <linearGradient id="fireRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${fireRingColor1}" />
      <stop offset="100%" stop-color="${fireRingColor2}" />
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect x="1" y="1" width="${cardWidth - 2}" height="${cardHeight - 2}" rx="14"
        fill="url(#cardBg)" stroke="${borderColor}" stroke-width="1" filter="url(#softShadow)" />

  <!-- Total contributions -->
  <text x="${colTotalX}" y="60" font-size="30" font-weight="700" fill="${totalAccent}" font-family="${fontFamily}" text-anchor="middle">${totalContributions}</text>
  <text x="${colTotalX}" y="82" font-size="12.5" font-weight="600" fill="${labelColor}" font-family="${fontFamily}" text-anchor="middle">Total Contributions</text>
  <text x="${colTotalX}" y="100" font-size="11" fill="${dateColor}" font-family="${fontFamily}" text-anchor="middle">${fmt(firstDay)} - Present</text>

  <line x1="160" y1="35" x2="160" y2="165" stroke="${dividerColor}" stroke-width="1" />

  <!-- Fire ring -->
  <circle cx="${ringCx}" cy="${ringCy}" r="${ringR}" fill="none" stroke="${dividerColor}" stroke-width="5" />
  <circle cx="${ringCx}" cy="${ringCy}" r="${ringR}" fill="none" stroke="url(#fireRing)" stroke-width="5"
          stroke-dasharray="${2 * Math.PI * ringR}" stroke-dashoffset="${2 * Math.PI * ringR * 0.08}"
          stroke-linecap="round" transform="rotate(-90 ${ringCx} ${ringCy})" />
  <text x="${ringCx}" y="${ringCy - 12}" font-size="20" text-anchor="middle">🔥</text>
  <text x="${ringCx}" y="${ringCy + 18}" font-size="26" font-weight="700" fill="${fireTextColor}" font-family="${fontFamily}" text-anchor="middle">${current}</text>
  <text x="${ringCx}" y="${ringCy + ringR + 22}" font-size="12.5" font-weight="600" fill="${fireTextColor}" font-family="${fontFamily}" text-anchor="middle">Current Streak</text>
  <text x="${ringCx}" y="${ringCy + ringR + 38}" font-size="11" fill="${dateColor}" font-family="${fontFamily}" text-anchor="middle">${current > 0 ? fmt(currentStart) + " - " + fmt(currentEnd) : "-"}</text>

  <line x1="300" y1="35" x2="300" y2="165" stroke="${dividerColor}" stroke-width="1" />

  <!-- Longest streak -->
  <text x="${colLongestX}" y="60" font-size="30" font-weight="700" fill="${longestAccent}" font-family="${fontFamily}" text-anchor="middle">${longest}</text>
  <text x="${colLongestX}" y="82" font-size="12.5" font-weight="600" fill="${labelColor}" font-family="${fontFamily}" text-anchor="middle">Longest Streak</text>
  <text x="${colLongestX}" y="100" font-size="11" fill="${dateColor}" font-family="${fontFamily}" text-anchor="middle">${longest > 0 ? fmt(longestStart) + " - " + fmt(longestEnd) : "-"}</text>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
    res.status(200).send(svg);
  } catch (err) {
    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(
      `<svg width="460" height="100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="50" fill="red">Error: ${err.message}</text></svg>`
    );
  }
}
