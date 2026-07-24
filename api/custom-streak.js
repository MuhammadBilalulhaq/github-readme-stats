// File: api/custom-streak.js
// Place this file inside the "api" folder of your ALREADY WORKING github-readme-stats fork
// (the same Vercel project that hosts custom-stats.js and custom-top-langs.js).
// Once committed, it will be live at:
// https://<your-vercel-domain>/api/custom-streak?username=ahmed28510

export default async function handler(req, res) {
  const { username = "ahmed28510" } = req.query;
  const token = process.env.PAT_1;

  const bgColor = "#0d1117";
  const borderColor = "#30363d";
  const titleColor = "#4dabf7";
  const numberColor = "#00f5d4";
  const labelColor = "#ffffff";
  const fireColor = "#ff6ec7";
  const dividerColor = "#30363d";

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

    // Flatten all days in chronological order
    const days = [];
    for (const w of weeks) {
      for (const d of w.contributionDays) {
        days.push({ date: d.date, count: d.contributionCount });
      }
    }

    // Total contributions
    const totalContributions = days.reduce((a, d) => a + d.count, 0);

    // Longest streak (any point in the data)
    let longest = 0;
    let running = 0;
    for (const d of days) {
      if (d.count > 0) {
        running++;
        longest = Math.max(longest, running);
      } else {
        running = 0;
      }
    }

    // Current streak (counting backwards from today/most recent day)
    let current = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) {
        current++;
      } else {
        // allow "today" to have 0 contributions yet without breaking streak
        if (i === days.length - 1) continue;
        break;
      }
    }

    const firstDay = days.length ? days[0].date : "";
    const lastDay = days.length ? days[days.length - 1].date : "";

    const svg = `
<svg width="450" height="150" viewBox="0 0 450 150" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="449" height="149" rx="12" fill="${bgColor}" stroke="${borderColor}" />

  <!-- Total contributions -->
  <text x="75" y="50" font-size="26" font-weight="bold" fill="${numberColor}" font-family="Segoe UI, sans-serif" text-anchor="middle">${totalContributions}</text>
  <text x="75" y="72" font-size="12" fill="${labelColor}" font-family="Segoe UI, sans-serif" text-anchor="middle">Total Contributions</text>
  <text x="75" y="88" font-size="10" fill="#8b949e" font-family="Segoe UI, sans-serif" text-anchor="middle">${firstDay} - present</text>

  <line x1="150" y1="30" x2="150" y2="120" stroke="${dividerColor}" stroke-width="1" />

  <!-- Current streak with fire icon -->
  <text x="225" y="42" font-size="20" fill="${fireColor}" font-family="Segoe UI, sans-serif" text-anchor="middle">🔥</text>
  <text x="225" y="65" font-size="26" font-weight="bold" fill="${fireColor}" font-family="Segoe UI, sans-serif" text-anchor="middle">${current}</text>
  <text x="225" y="87" font-size="12" fill="${labelColor}" font-family="Segoe UI, sans-serif" text-anchor="middle">Current Streak</text>

  <line x1="300" y1="30" x2="300" y2="120" stroke="${dividerColor}" stroke-width="1" />

  <!-- Longest streak -->
  <text x="375" y="50" font-size="26" font-weight="bold" fill="${titleColor}" font-family="Segoe UI, sans-serif" text-anchor="middle">${longest}</text>
  <text x="375" y="72" font-size="12" fill="${labelColor}" font-family="Segoe UI, sans-serif" text-anchor="middle">Longest Streak</text>
  <text x="375" y="88" font-size="10" fill="#8b949e" font-family="Segoe UI, sans-serif" text-anchor="middle">best run</text>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
    res.status(200).send(svg);
  } catch (err) {
    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(
      `<svg width="450" height="100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="50" fill="red">Error: ${err.message}</text></svg>`
    );
  }
}
