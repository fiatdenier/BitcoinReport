import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch'; // Node v20 has fetch built-in, you can skip this if using native fetch
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
const outPath = './index.html';
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
    const out = items.map(i => toItem(i, url)).filter(i => i.url && i.title);
    return out;
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

    // Filter to Bitcoin-related stories
    const filtered = all.filter(isBitcoinStory);

    // Deduplicate by URL
    const byUrl = new Map();
    for (const it of filtered) {
        if (!byUrl.has(it.url)) byUrl.set(it.url, it);
    }
    const deduped = Array.from(byUrl.values());

    // Sort newest → oldest
    deduped.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    // Cap length
    const items = deduped.slice(0, 120);

    // Generate HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Bitcoin News</title>
<style>
body { font-family: Arial, sans-serif; max-width: 800px; margin: 2rem auto; }
h1 { text-align: center; }
ul { list-style: none; padding: 0; }
li { margin: 0.5rem 0; }
a { text-decoration: none; color: #1a0dab; }
a:hover { text-decoration: underline; }
</style>
</head>
<body>
<h1>Latest Bitcoin News</h1>
<ul>
${items.map(i => `<li><a href="${i.url}" target="_blank">${i.title}</a> <small>(${new Date(i.published_at).toLocaleString()})</small></li>`).join('')}
</ul>
<p>Updated at ${new Date().toLocaleString()}</p>
</body>
</html>
`;

    // Write HTML file
    fs.writeFileSync(outPath, html);
    console.log(`Wrote ${items.length} news items to ${outPath}`);
})();
