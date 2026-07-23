// File: api/custom-stats.js
// Place this file inside the "api" folder of your forked github-readme-stats repo on GitHub,
// then push/commit it. Vercel will auto-deploy it and it will be live at:
// https://<your-vercel-domain>/api/custom-stats?username=ahmed28510

export default async function handler(req, res) {
  const { username = "ahmed28510" } = req.query;
  const token = process.env.PAT_1;

  // ---- COLORS: change any of these to whatever you like ----
  const bgColor = "#0d1117";        // card background
  const titleColor = "#4dabf7";     // "Mohammad Ahmed's GitHub Stats" heading
  const labelColor = "#ffffff";     // "Total Stars Earned:" etc (labels)
  const numberColor = "#00f5d4";    // the actual numbers (0, 40, 0...) - DIFFERENT from labels
  const iconColor = "#f9c74f";      // small icons next to each row
  const ringColor1 = "#ff6ec7";     // ring gradient start
  const ringColor2 = "#4dabf7";     // ring gradient end
  const letterColor = "#ffb703";    // the "C" (or rank letter) inside the ring - fully independent color
  const borderColor = "#30363d";

  try {
    const query = `
      query ($login: String!) {
        user(login: $login) {
          name
          contributionsCollection { totalCommitContributions restrictedContributionsCount }
          repositoriesContributedTo(first: 1) { totalCount }
          pullRequests(first: 1) { totalCount }
          issues(first: 1) { totalCount }
          repositories(first: 100, ownerAffiliations: OWNER) { nodes { stargazerCount } }
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
    const user = json.data.user;

    const totalStars = user.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0);
    const totalCommits =
      user.contributionsCollection.totalCommitContributions +
      user.contributionsCollection.restrictedContributionsCount;
    const totalPRs = user.pullRequests.totalCount;
    const totalIssues = user.issues.totalCount;
    const contributedTo = user.repositoriesContributedTo.totalCount;

    // simple rank letter logic (you can tweak thresholds)
    const score = totalStars * 2 + totalCommits + totalPRs * 3 + totalIssues;
    const rankLetter = score > 500 ? "A+" : score > 200 ? "A" : score > 80 ? "B+" : score > 30 ? "B" : "C";

    const rows = [
      { label: "Total Stars Earned:", value: totalStars, icon: "★" },
      { label: "Total Commits (last year):", value: totalCommits, icon: "◔" },
      { label: "Total PRs:", value: totalPRs, icon: "⑂" },
      { label: "Total Issues:", value: totalIssues, icon: "!" },
      { label: "Contributed to (last year):", value: contributedTo, icon: "▤" },
    ];

    const rowsSvg = rows
      .map(
        (r, i) => `
      <text x="25" y="${70 + i * 28}" font-size="14" fill="${iconColor}" font-family="Segoe UI, sans-serif">${r.icon}</text>
      <text x="50" y="${70 + i * 28}" font-size="14" fill="${labelColor}" font-family="Segoe UI, sans-serif">${r.label}</text>
      <text x="290" y="${70 + i * 28}" font-size="14" fill="${numberColor}" font-family="Segoe UI, sans-serif" font-weight="bold">${r.value}</text>`
      )
      .join("");

    const svg = `
<svg width="500" height="230" viewBox="0 0 500 230" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ringColor1}" />
      <stop offset="100%" stop-color="${ringColor2}" />
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="499" height="229" rx="12" fill="${bgColor}" stroke="${borderColor}" />
  <text x="25" y="35" font-size="20" font-weight="bold" fill="${titleColor}" font-family="Segoe UI, sans-serif">${user.name}'s GitHub Stats</text>
  ${rowsSvg}
  <circle cx="420" cy="115" r="45" fill="none" stroke="${borderColor}" stroke-width="6" />
  <circle cx="420" cy="115" r="45" fill="none" stroke="url(#ringGrad)" stroke-width="6" stroke-dasharray="200" stroke-dashoffset="60" stroke-linecap="round" transform="rotate(-90 420 115)" />
  <text x="420" y="122" font-size="24" font-weight="bold" fill="${letterColor}" font-family="Segoe UI, sans-serif" text-anchor="middle">${rankLetter}</text>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
    res.status(200).send(svg);
  } catch (err) {
    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(
      `<svg width="500" height="100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="50" fill="red">Error: ${err.message}</text></svg>`
    );
  }
}
