// /how-long-do-crashes-take-to-clear/: crash clearance times from MileCheck's incident-lifecycle archive
// (Worker cron reads every state's DOT feed about every 16 minutes; see docs/incident-lifecycle-archive.md in
// the app repo). Input: .cache/lifecycle/*.jsonl from scripts/pull-incident-lifecycle.sh. Output: the page plus
// data/clearance-times.json (aggregates only). States are listed alphabetically and never ranked: each DOT
// decides when to post and remove a crash, so the numbers compare a state with itself, not with other states.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
const NAMES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', BC: 'British Columbia' };
// Feeds whose posting times do not track clearance (checked 2026-10-16): left out with the reason on the page.
const EXCLUDE = { KY: 'Kentucky keeps each crash posted for about a day', CA: 'California crash posts are timed in fixed blocks of hours', TX: 'Texas lists few crashes in its feed, and most matches were detours' };
const isCrash = r => r.type === 'AC' || /\b(crash|collision|accident)\b/i.test(r.title || '');
const rows = readdirSync('.cache/lifecycle').filter(f => f.endsWith('.jsonl')).flatMap(f => readFileSync(`.cache/lifecycle/${f}`, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)));
// Seen on two or more reads only: a crash seen once has no measured duration.
const crashes = rows.filter(r => isCrash(r) && r.durMin >= 16 && r.durMin <= 72 * 60);
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const first = rows.reduce((m, r) => r.first < m ? r.first : m, '9999'), last = rows.reduce((m, r) => r.last > m ? r.last : m, '0000');
const by = {};
for (const r of crashes) (by[r.state] ||= []).push(r.durMin);
const states = Object.keys(NAMES).filter(st => !EXCLUDE[st] && (by[st] || []).length >= 10).map(st => ({ st, name: NAMES[st], n: by[st].length, median: q(by[st], 0.5), p25: q(by[st], 0.25), p75: q(by[st], 0.75) })).sort((a, b) => a.name.localeCompare(b.name));
const all = crashes.filter(r => !EXCLUDE[r.state]).map(r => r.durMin), usMedian = q(all, 0.5);
const day = s => new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
writeFileSync('data/clearance-times.json', JSON.stringify({ from: first, to: last, crashes: crashes.length, median: usMedian, states }, null, 1) + '\n');
const hm = m => m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 >= 8 ? ` ${Math.round(m % 60 / 5) * 5} min` : ''}`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const td = 'style="padding:9px 6px;border-bottom:1px solid #eee;vertical-align:top"', th = 'style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5"';
const table = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45"><thead><tr><th ${th}>State</th><th ${th}>Typical time on the feed</th><th ${th}>Half fell between</th><th ${th}>Crashes logged</th></tr></thead><tbody>
${states.map(r => `<tr><td ${td}>${esc(r.name)}</td><td ${td}>${hm(r.median)}</td><td ${td}>${hm(r.p25)} and ${hm(r.p75)}</td><td ${td}>${r.n.toLocaleString('en-US')}</td></tr>`).join('\n')}
</tbody></table></div>`;
const kept = crashes.filter(r => !EXCLUDE[r.state]).length;
const lede = `A crash on a state highway stays on the state DOT's feed for about ${hm(usMedian)} before it is cleared, in the middle case. That is from ${kept.toLocaleString('en-US')} crashes MileCheck logged across ${states.length} states and provinces from ${day(first)} to ${day(last)}.`;
const body = `    <p class="lede"><strong>${esc(lede)}</strong></p>
    <p><strong>These are state highways, not city streets.</strong> The crashes come from each state DOT's feed, which covers interstates, U.S. routes and state routes. City and county streets are not counted.</p>
    <p>Clearing a crash means moving the cars, cleaning up debris and reopening the lanes. These times run from when the DOT first posted the crash to when it took it down.</p>
    <h2>How long do crashes take to clear in each state?</h2>
    <p><strong>How to read this:</strong> each state's DOT decides when to post a crash and when to remove it, and some post unconfirmed reports. So compare a state with itself over time, not with other states. MileCheck reads every feed about every 16 minutes, so each time is accurate to about 16 minutes. Crashes seen only once are left out. States with fewer than 10 logged crashes are not shown. Left out because their feed timing does not show clearance: ${Object.values(EXCLUDE).join('. ')}.</p>
${table}
    <h2>Where does this come from?</h2>
    <p>MileCheck reads the live crash and closure feeds of every state DOT and records when each incident appears and disappears. DOT feeds remove cleared crashes within hours, so this record does not exist anywhere else. We add a month to it every month.</p>
    <p>Run a fleet, a tow company or an insurance team and want this by highway and mile marker? <a href="/api/#dataset">See MileCheck data licensing</a>.</p>
    <h2>More</h2>
    <ul><li><a href="/road-conditions/">Road conditions by state</a></li><li><a href="/closures/">Highway closures map</a></li><li><a href="/road-workers/emts/">How much do EMTs make in each state?</a></li></ul>`;
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const headA = tpl.slice(0, tpl.indexOf('  <title>')), headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">')), headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">')), tail = tpl.slice(tpl.indexOf('  </article>'));
const h1 = 'How long does it take to clear a highway crash?', url = 'https://milecheckapp.com/how-long-do-crashes-take-to-clear/';
const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: h1, acceptedAnswer: { '@type': 'Answer', text: lede } }] };
const html = headA + `  <title>${esc(h1)} Times by state | MileCheck</title>\n  <meta name="description" content="${esc(lede)}">\n  <link rel="canonical" href="${url}">\n  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type" content="article">\n` +
  headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` + headC.replace(/href="\.\.\//g, 'href="/') +
  `  <article class="art">\n<div class="eyebrow">MileCheck data</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
mkdirSync('how-long-do-crashes-take-to-clear', { recursive: true });
writeFileSync('how-long-do-crashes-take-to-clear/index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
console.log(`clearance: ${crashes.length} crashes, ${states.length} states, median ${hm(usMedian)}`);
