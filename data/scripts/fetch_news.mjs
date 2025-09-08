import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch'; // if Node v20 fetch not available, otherwise can skip
import { XMLParser } from 'fast-xml-parser';

// Example definitions (replace with your actual feeds/hosts)
const FEEDS = ['https://example.com/rss'];
const BITCOIN_ONLY_HOSTS = new Set(['coindesk.com', 'bitcoinmagazine.com']);
const outPath = './data/news.json';
const parser = new XMLParser();

// Function to determine if story is Bitcoin-related
function isBitcoinStory(item) {
    try {
        const host = new URL(item.url).host;
        if (BITCOIN_ONLY_HOSTS.has(host)) return true;
    } catch {
        // ignore malformed URLs
    }
    return includesKeyword(item.title); // define this function elsewhere
}

// Convert raw feed item to your internal format
function toItem(item, url) {
    // Implement your mapping logic
    return {
        url: item.link || url,
        title: item.title,
        published_at: item.pubDate || new Date().toISOString()
    };
}

// Fetch and parse feed
async function fetchFeed(url) {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (+github-actions)' } });
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    const out = items.map(i => toItem(i, url)).filter(i => i.url && i.title);
    return out;
}

// Main execution
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

    // Filter to Bitcoin‑related
    const filtered = all.filter(isBitcoinStory);

    // De‑dupe by URL
    const byUrl = new Map();
    for (const it of filtered) {
        if (!byUrl.has(it.url)) byUrl.set(it.url, it);
    }
    const deduped = Array.from(byUrl.values());

    // Sort newest → oldest
    deduped.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    // Cap length
    const items = deduped.slice(0, 120);

    // Ensure output dir exists
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const payload = { updated_at: new Date().toISOString(), items };
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
    console.log(`Wrote ${items.length} items to ${outPath}`);
})();
