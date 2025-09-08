import fs from 'fs';
if (BITCOIN_ONLY_HOSTS.has(host)) return true;
} catch {}
return includesKeyword(item.title);
}


async function fetchFeed(url) {
const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (+github-actions)' } });
const xml = await res.text();
const parsed = parser.parse(xml);
const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
const out = items.map(i => toItem(i, url)).filter(i => i.url && i.title);
return out;
}


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


// De‑dupe by URL and by title
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
console.log(`Wrote ${items.length} items to data/news.json`);
})();
