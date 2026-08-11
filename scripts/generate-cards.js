#!/usr/bin/env node
/**
 * Generate a modern, slick SVG playing-card deck into ../cards/
 * Fully offline assets — no network required at runtime.
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "cards");
const W = 250;
const H = 350;

const SUITS = {
  heart: { symbol: "♥", color: "#e11d48", name: "hearts" },
  diamond: { symbol: "♦", color: "#e11d48", name: "diamonds" },
  club: { symbol: "♣", color: "#0f172a", name: "clubs" },
  spade: { symbol: "♠", color: "#0f172a", name: "spades" },
};

const RANKS = [
  { key: "1", label: "A" },
  { key: "2", label: "2" },
  { key: "3", label: "3" },
  { key: "4", label: "4" },
  { key: "5", label: "5" },
  { key: "6", label: "6" },
  { key: "7", label: "7" },
  { key: "8", label: "8" },
  { key: "9", label: "9" },
  { key: "10", label: "10" },
  { key: "jack", label: "J" },
  { key: "queen", label: "Q" },
  { key: "king", label: "K" },
];

// Classic pip positions in percent of face area (x,y), upside marked ~
const PIP_LAYOUTS = {
  2: ["50,18", "~50,82"],
  3: ["50,18", "50,50", "~50,82"],
  4: ["28,18", "72,18", "~28,82", "~72,82"],
  5: ["28,18", "72,18", "50,50", "~28,82", "~72,82"],
  6: ["28,18", "72,18", "28,50", "72,50", "~28,82", "~72,82"],
  7: ["28,18", "72,18", "50,34", "28,50", "72,50", "~28,82", "~72,82"],
  8: ["28,18", "72,18", "50,34", "28,50", "72,50", "~50,66", "~28,82", "~72,82"],
  9: ["28,18", "72,18", "28,38", "72,38", "50,50", "~28,62", "~72,62", "~28,82", "~72,82"],
  10: ["28,18", "72,18", "50,28", "28,38", "72,38", "~28,62", "~72,62", "~50,72", "~28,82", "~72,82"],
};

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function suitPath(suit, cx, cy, size, color) {
  const s = size / 100;
  if (suit === "heart") {
    return `<path fill="${color}" transform="translate(${cx},${cy}) scale(${s})" d="M0,-22 C-18,-48 -58,-38 -58,-2 C-58,28 -22,52 0,72 C22,52 58,28 58,-2 C58,-38 18,-48 0,-22Z"/>`;
  }
  if (suit === "diamond") {
    return `<path fill="${color}" transform="translate(${cx},${cy}) scale(${s})" d="M0,-72 L48,0 L0,72 L-48,0Z"/>`;
  }
  if (suit === "spade") {
    return `<g fill="${color}" transform="translate(${cx},${cy}) scale(${s})">
      <path d="M0,-72 C-42,-18 -62,8 -62,32 C-62,52 -46,64 -28,64 C-14,64 -6,56 0,46 C6,56 14,64 28,64 C46,64 62,52 62,32 C62,8 42,-18 0,-72Z"/>
      <path d="M-10,48 Q0,28 10,48 L6,78 L-6,78Z"/>
    </g>`;
  }
  return `<g fill="${color}" transform="translate(${cx},${cy}) scale(${s})">
    <circle cx="0" cy="-34" r="26"/>
    <circle cx="-30" cy="12" r="26"/>
    <circle cx="30" cy="12" r="26"/>
    <path d="M-9,28 Q0,8 9,28 L6,76 L-6,76Z"/>
  </g>`;
}

function corner(label, suit, color, x, y, rotate = 0) {
  const rot = rotate ? ` transform="rotate(180 ${x} ${y})"` : "";
  const suitSize = label === "10" ? 16 : 18;
  return `<g${rot}>
    <text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="${label === "10" ? 22 : 26}" font-weight="700" fill="${color}">${escapeXml(label)}</text>
    ${suitPath(suit, x, y + 26, suitSize, color)}
  </g>`;
}

function cardShell(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" ry="16" fill="#ffffff" stroke="#d4d4d8" stroke-width="1.5" filter="url(#soft)"/>
  ${inner}
</svg>`;
}

function pipCard(suitKey, rankKey, label, color) {
  const layout = PIP_LAYOUTS[rankKey] || [];
  const pips = layout
    .map((pos) => {
      const upside = pos.startsWith("~");
      const [xPct, yPct] = pos.replace("~", "").split(",").map(Number);
      const x = 28 + ((W - 56) * xPct) / 100;
      const y = 48 + ((H - 96) * yPct) / 100;
      const g = suitPath(suitKey, 0, 0, 34, color);
      return `<g transform="translate(${x},${y})${upside ? " rotate(180)" : ""}">${g}</g>`;
    })
    .join("\n");

  return cardShell(`
    ${corner(label, suitKey, color, 24, 32)}
    ${corner(label, suitKey, color, W - 24, H - 32, 1)}
    ${pips}
  `);
}

function aceCard(suitKey, label, color) {
  return cardShell(`
    ${corner(label, suitKey, color, 24, 32)}
    ${corner(label, suitKey, color, W - 24, H - 32, 1)}
    ${suitPath(suitKey, W / 2, H / 2, 110, color)}
  `);
}

function courtArt(rank, color) {
  // Single-portrait modern court panels
  const accent = color;
  const ink = "#0f172a";

  const frame = `
    <rect x="52" y="64" width="146" height="222" rx="14" fill="#f8fafc" stroke="${accent}" stroke-width="2.5"/>
    <rect x="64" y="76" width="122" height="198" rx="10" fill="#ffffff"/>
  `;

  if (rank === "king") {
    return `${frame}
      <g transform="translate(125,175)">
        <path d="M-40,-70 L-24,-108 L0,-84 L24,-108 L40,-70 Z" fill="${accent}"/>
        <rect x="-40" y="-70" width="80" height="10" rx="2" fill="${ink}"/>
        <circle cx="-24" cy="-108" r="5" fill="${ink}"/>
        <circle cx="0" cy="-96" r="5" fill="${accent}" stroke="${ink}" stroke-width="2"/>
        <circle cx="24" cy="-108" r="5" fill="${ink}"/>
        <circle cx="0" cy="-28" r="34" fill="#fff" stroke="${ink}" stroke-width="3"/>
        <path d="M-14,-36 L-6,-36 M6,-36 L14,-36" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M-12,-14 H12" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
        <path d="M-48,20 L0,0 L48,20 L48,88 L-48,88 Z" fill="${accent}"/>
        <rect x="-6" y="8" width="12" height="56" rx="2" fill="${ink}"/>
        <text x="0" y="72" text-anchor="middle" font-family="system-ui,sans-serif" font-size="36" font-weight="800" fill="#fff">K</text>
      </g>
    `;
  }

  if (rank === "queen") {
    return `${frame}
      <g transform="translate(125,175)">
        <path d="M-36,-68 Q0,-118 36,-68" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
        <circle cx="0" cy="-92" r="8" fill="${accent}"/>
        <path d="M-42,-48 Q-42,-88 0,-92 Q42,-88 42,-48 Q46,10 28,40 Q0,24 -28,40 Q-46,10 -42,-48Z" fill="${ink}"/>
        <circle cx="0" cy="-28" r="32" fill="#fff" stroke="${ink}" stroke-width="3"/>
        <path d="M-12,-36 L-5,-36 M5,-36 L12,-36" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M-10,-14 Q0,-8 10,-14" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
        <path d="M-48,24 Q0,4 48,24 L48,88 L-48,88Z" fill="${accent}"/>
        <circle cx="0" cy="36" r="8" fill="#fff"/>
        <text x="0" y="72" text-anchor="middle" font-family="system-ui,sans-serif" font-size="36" font-weight="800" fill="#fff">Q</text>
      </g>
    `;
  }

  return `${frame}
    <g transform="translate(125,175)">
      <path d="M-34,-62 L-20,-102 L0,-78 L20,-102 L34,-62 L34,-48 L-34,-48Z" fill="${accent}"/>
      <rect x="-36" y="-50" width="72" height="12" rx="2" fill="${ink}"/>
      <circle cx="0" cy="-20" r="32" fill="#fff" stroke="${ink}" stroke-width="3"/>
      <path d="M-12,-28 L-5,-28 M5,-28 L12,-28" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M-10,-8 H10" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
      <path d="M-44,24 L0,8 L44,24 L48,88 L-48,88Z" fill="${ink}"/>
      <path d="M-22,28 L0,44 L22,28" fill="${accent}"/>
      <text x="0" y="72" text-anchor="middle" font-family="system-ui,sans-serif" font-size="36" font-weight="800" fill="#fff">J</text>
    </g>
  `;
}

function faceCard(suitKey, rankKey, label, color) {
  return cardShell(`
    ${corner(label, suitKey, color, 24, 32)}
    ${corner(label, suitKey, color, W - 24, H - 32, 1)}
    ${courtArt(rankKey, color)}
  `);
}

function backCard() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <pattern id="grid" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <rect width="18" height="18" fill="transparent"/>
      <path d="M0,18 L18,0" stroke="#60a5fa" stroke-width="1.2" opacity="0.35"/>
    </pattern>
  </defs>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" ry="16" fill="url(#bg)" stroke="#334155" stroke-width="1.5"/>
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="10" ry="10" fill="url(#grid)" stroke="#93c5fd" stroke-width="1.5" opacity="0.95"/>
  <circle cx="${W / 2}" cy="${H / 2}" r="36" fill="none" stroke="#93c5fd" stroke-width="2" opacity="0.8"/>
  <circle cx="${W / 2}" cy="${H / 2}" r="18" fill="#60a5fa" opacity="0.35"/>
</svg>`;
}

function writeCard(filename, svg) {
  fs.writeFileSync(path.join(OUT, filename), svg);
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // Remove old raster deck files
  for (const f of fs.readdirSync(OUT)) {
    if (/\.(png|jpe?g|LGPL|txt)$/i.test(f) || f === "LICENSE.LGPL") {
      fs.unlinkSync(path.join(OUT, f));
    }
  }

  writeCard("back.svg", backCard());

  for (const [suitKey, suit] of Object.entries(SUITS)) {
    for (const rank of RANKS) {
      let svg;
      if (rank.key === "1") svg = aceCard(suitKey, rank.label, suit.color);
      else if (rank.key === "jack" || rank.key === "queen" || rank.key === "king") {
        svg = faceCard(suitKey, rank.key, rank.label, suit.color);
      } else svg = pipCard(suitKey, rank.key, rank.label, suit.color);

      writeCard(`${suitKey}_${rank.key}.svg`, svg);
    }
  }

  fs.writeFileSync(
    path.join(OUT, "README.txt"),
    "Modern SVG playing-card faces generated for Card Caller. Local assets only.\n"
  );

  console.log("Wrote modern SVG deck to", OUT);
}

main();
