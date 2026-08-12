#!/usr/bin/env node

/**
 * Refreshes the "Top supporters" block in index.html from the GitHub Sponsors
 * GraphQL API (public sponsorships of the anurbis-dev account only — private
 * ones are excluded by the query itself, never fetched).
 *
 * Requires a token with the `read:user` scope in SPONSORS_TOKEN (the default
 * Actions GITHUB_TOKEN cannot read sponsorship data). Run via
 * .github/workflows/update-sponsors.yml on a schedule + workflow_dispatch.
 */

import fs from "fs";

const LOGIN = "anurbis-dev";
const TOP_N = 12;
const START = "<!-- SPONSORS:START -->";
const END = "<!-- SPONSORS:END -->";
const FALLBACK = `        <p style="font-size:14px">Nobody yet — be the first name on this list.</p>`;

const token = process.env.SPONSORS_TOKEN;
if (!token) {
  console.error("SPONSORS_TOKEN env var is required (PAT with read:user scope).");
  process.exit(1);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const query = `
  query($login: String!) {
    user(login: $login) {
      sponsorshipsAsMaintainer(first: 100, includePrivate: false, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          createdAt
          tier { monthlyPriceInDollars }
          sponsorEntity {
            __typename
            ... on User { login name avatarUrl(size: 80) url }
            ... on Organization { login name avatarUrl(size: 80) url }
          }
        }
      }
    }
  }
`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query, variables: { login: LOGIN } }),
});

if (!res.ok) {
  console.error(`GitHub API request failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}

const json = await res.json();
if (json.errors) {
  console.error("GraphQL errors:", JSON.stringify(json.errors, null, 2));
  process.exit(1);
}

const nodes = json.data?.user?.sponsorshipsAsMaintainer?.nodes ?? [];

const sponsors = nodes
  .filter((n) => n.sponsorEntity)
  .sort((a, b) => {
    const priceDiff = (b.tier?.monthlyPriceInDollars ?? 0) - (a.tier?.monthlyPriceInDollars ?? 0);
    if (priceDiff !== 0) return priceDiff;
    return new Date(a.createdAt) - new Date(b.createdAt);
  })
  .slice(0, TOP_N);

let inner;
if (sponsors.length === 0) {
  inner = FALLBACK;
} else {
  const items = sponsors
    .map((s) => {
      const e = s.sponsorEntity;
      const label = e.name || e.login;
      return [
        `          <a class="supporter-item" href="${escapeHtml(e.url)}" target="_blank" rel="noopener" title="${escapeHtml(label)}">`,
        `            <img src="${escapeHtml(e.avatarUrl)}" alt="" loading="lazy">`,
        `            <span>${escapeHtml(label)}</span>`,
        `          </a>`,
      ].join("\n");
    })
    .join("\n");
  inner = [`        <div class="supporter-list">`, items, `        </div>`].join("\n");
}

const indexPath = new URL("../index.html", import.meta.url);
let html = fs.readFileSync(indexPath, "utf8");

if (!html.includes(START) || !html.includes(END)) {
  console.error(`Markers ${START} / ${END} not found in index.html`);
  process.exit(1);
}

const startIdx = html.indexOf(START) + START.length;
const endIdx = html.indexOf(END);
html = html.slice(0, startIdx) + "\n" + inner + "\n        " + html.slice(endIdx);

fs.writeFileSync(indexPath, html);
console.log(`Updated Top supporters: ${sponsors.length} public sponsor(s).`);
