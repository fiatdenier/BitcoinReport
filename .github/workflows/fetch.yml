import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

// --- Config ---
const FEEDS = [
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://bitcoinmagazine.com/.rss/full/'
];

const BITCOIN_ONLY_HOSTS = new Set([
  'coindesk.com',
  'bitcoinmagazine.com'
]);

const outPath = path.resolve('../../index.html'); // repo root
const parser = new XMLParser();

// --- Helpers ---
function isBitcoinStory(item) {
  try {
    const host = new URL(item.url).host;
    if (BITCOIN_ONLY_HOSTS.has(host)) return true;
  } catch {}
  return item.title && item.title.toLowerCase().includes('bitcoin');
}

function toItem(item, url) {
  return {
    url: item.link || url,
    title: item.title || 'No title',
    published_at: item.pubDate || new Date().toISOString()
  };
}

async function fetchFeed(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (+github-actions)' }
  });
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
  return items.map(i => toItem(i, url)).filter(i => i.url && i.title);
}

// --- Render helpers ---
function timeAgo(date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  const r = (n, w) => `${n} ${w}${n !== 1 ? 's' : ''} ago`;
  if (s < 60) return r(s, 'sec');
  const m = Math.floor(s / 60); if (m < 60) return r(m, 'min');
  const h = Math.floor(m / 60); if (h < 24) return r(h, 'hour');
  const d = Math.floor(h / 24); return r(d, 'day');
}

function escapeHtml(str) {
  return str.replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

function renderColumn(items) {
  return items.map((it, idx) => {
    const cls = idx < 5 ? 'big' : '';
    const host = new URL(it.url).hostname.replace(/^www\./,'');
    const when = it.published_at ? timeAgo(new Date(it.published_at)) : '';
    return `<a class="${cls}" href="${it.url}" target="_blank" rel="noopener">
      ${escapeHtml(it.title)}
      <span class="meta">${host}${when ? ' • ' + when : ''}</span>
    </a>`;
  }).join('');
}

// --- Main ---
(async () => {
  const all = [];

  for (const feed of FEEDS) {
    try {
      const items = await fetchFeed(feed);
      all.push(...items);
    } catch (e) {
      console.error('Feed failed:', feed, e.message);
    }
  }

  // Filter Bitcoin stories
  const filtered = all.filter(isBitcoinStory);

  // Deduplicate by URL
  const byUrl = new Map();
  filtered.forEach(it => {
    if (!byUrl.has(it.url)) byUrl.set(it.url, it);
  });
  const deduped = Array.from(byUrl.values());

  // Sort newest → oldest
  deduped.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  // Cap at 90 items
  const items = deduped.slice(0, 90);

  // Split into 3 columns
  const cols = [[], [], []];
  items.forEach((it, i) => cols[i % 3].push(it));

  // Generate HTML keeping your original format
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Bitcoin Wire</title>
<meta name="description" content="Bitcoin headlines, updated automatically." />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css" />
</head>
<body>
<header>
<h1><a href="/">BITCOIN WIRE</a></h1>
<p id="updated">Updated ${new Date().toLocaleString()}</p>
</header>

<main id="app" class="grid">
<section class="col" id="left">
${renderColumn(cols[0])}
</section>
<section class="col" id="center">
${renderColumn(cols[1])}
</section>
<section class="col" id="right">
${renderColumn(cols[2])}
</section>
</main>

<footer>
<small>
Pure links. No tracking. Source on <a href="https://github.com/fiatdenier/BitcoinReport/" target="_blank" rel="noopener">GitHub</a>.
</small>
</footer>

</body>
</html>
`;

  fs.writeFileSync(outPath, html);
  console.log(`Wrote ${items.length} news items to ${outPath}`);
})();
