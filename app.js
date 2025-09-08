async function load() {
try {
const res = await fetch('data/news.json', { cache: 'no-store' });
const data = await res.json();


const items = (data.items || []).slice(0, 90); // safety cap
const updated = data.updated_at ? new Date(data.updated_at) : new Date();
document.getElementById('updated').textContent = `Updated ${timeAgo(updated)} — ${updated.toLocaleString()}`;


// split into 3 columns
const cols = [[], [], []];
items.forEach((item, i) => cols[i % 3].push(item));


renderColumn('left', cols[0]);
renderColumn('center', cols[1]);
renderColumn('right', cols[2]);
} catch (e) {
document.getElementById('updated').textContent = 'Failed to load.';
console.error(e);
}
}


function renderColumn(id, items) {
const el = document.getElementById(id);
el.innerHTML = items.map((it, idx) => {
const cls = idx < 5 ? 'big' : '';
const host = hostFromUrl(it.url);
const when = it.published_at ? timeAgo(new Date(it.published_at)) : '';
return `<a class="${cls}" href="${it.url}" target="_blank" rel="noopener">
${escapeHtml(it.title)}
<span class="meta">${host}${when ? ' • ' + when : ''}</span>
</a>`;
}).join('');
}


function hostFromUrl(u) {
try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; }
}


function timeAgo(date) {
const s = Math.floor((Date.now() - date.getTime()) / 1000);
const r = (n, w) => `${n} ${w}${n !== 1 ? 's' : ''} ago`;
if (s < 60) return r(s, 'sec');
const m = Math.floor(s / 60); if (m < 60) return r(m, 'min');
const h = Math.floor(m / 60); if (h < 24) return r(h, 'hour');
const d = Math.floor(h / 24); return r(d, 'day');
}


function escapeHtml(str) {
return str.replace(/[&<>"] /g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s] || s));
}


load();
