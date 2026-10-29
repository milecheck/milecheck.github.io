// /how-often-are-chains-required-on-washington-passes/ — counts WSDOT pass restrictions hour by hour from MileCheck's
// archive. Data: data/chains-by-pass.json, written by scripts/chain-stats-wa.py (refresh at month end, then re-run this
// and finish-pages). Shell borrowed from /what-is-my-mile-marker/ like gen-rest-area-pages.mjs. 2026-10-29.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const D = JSON.parse(readFileSync('data/chains-by-pass.json', 'utf8'));
const tpl = readFileSync('what-is-my-mile-marker/index.html', 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const headA = tpl.slice(0, tpl.indexOf('  <title>'));
const headB = tpl.slice(tpl.indexOf('  <link rel="icon"'), tpl.indexOf('  <script type="application/ld+json">'));
const headC = tpl.slice(tpl.indexOf('  <style>'), tpl.indexOf('  <article class="art">'));
const tail = tpl.slice(tpl.indexOf('  </article>'));
const PATH = '/how-often-are-chains-required-on-washington-passes/';
const URL = `https://milecheckapp.com${PATH}`;
// Times in the file are Pacific with their own offset; read the clock as written.
const parts = (iso) => { const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/); return { mo: +m[2], d: +m[3], h: +m[4] }; };
const MON = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const clock = (h) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
const when = (iso) => { const p = parts(iso); return `${MON[p.mo]} ${p.d}, ${clock(p.h)}`; };
const dayOnly = (iso) => { const p = parts(iso); return `${MON[p.mo]} ${p.d}`; };
const asOf = D.asOf; const from = D.from;
const NAME = { 'Snoqualmie Pass I-90': 'Snoqualmie Pass (I-90)', 'Stevens Pass US 2': 'Stevens Pass (US 2)', 'White Pass  US 12': 'White Pass (US 12)', 'Blewett Pass US 97': 'Blewett Pass (US 97)',
  'Chinook Pass SR 410': 'Chinook Pass (SR 410)', 'Cayuse Pass SR 123': 'Cayuse Pass (SR 123)', 'Crystal to Greenwater SR 410': 'SR 410, Crystal Mountain to Greenwater', 'Mt. Baker Hwy SR 542': 'Mt. Baker Highway (SR 542)' };
const ORDER = Object.keys(NAME);
const rows = ORDER.map(k => D.passes.find(p => p.name === k)).filter(Boolean);
const first = (p) => { const all = [...p.closedEpisodes, ...p.advisedEpisodes].sort((a, b) => a.start.localeCompare(b.start)); return all[0] ? when(all[0].start) : 'none yet'; };
const cell = (n) => n ? `${n} h` : '0';
const tbl = rows.map(p => `<tr><td>${esc(NAME[p.name])}</td><td>${cell(p.closed)}</td><td>${cell(p.advised)}</td><td>${cell(p.required)}</td><td>${esc(first(p))}</td></tr>`).join('\n');
const noInfo = D.passes.filter(p => p.nodata > p.snapshots * 0.8).map(p => p.name.replace(/\s+/g, ' '));
const last = (arr) => arr[arr.length - 1];
const storm1 = rows.filter(p => p.closedEpisodes.length).map(p => p.closedEpisodes.find(e => parts(e.start).d >= 25 && parts(e.start).d <= 26)).filter(Boolean);
const lede = 'So far this season, traction tires were advised on five Washington passes on October 28 and required on three passes on October 28 and 29.';
const co = D.co, mt = D.mt;
const list = (a) => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + last(a);
const days = (a) => list(a.map(d => { const [, m, dd] = d.split('-').map(Number); return `${MON[m]} ${dd}`; }));
const body = `    <p style="font-size:14px;color:#5b6670;margin:0 0 12px"><strong>Counted through ${esc(when(asOf))} Pacific</strong> · from WSDOT's pass reports, saved every hour since ${esc(dayOnly(from))}</p>
    <p class="lede"><strong>${esc(lede)}</strong></p>
    <p>It is early. Most Washington passes post no rule for most of the year, and the rules start when the first real storms arrive. This page keeps the count as the winter goes on.</p>
    <h2>What did each pass show?</h2>
    <p>Each number is the count of hourly reports in which WSDOT's restriction line for that pass read closed, traction tires advised, or traction tires required. One hour is one report. All times are Pacific.</p>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5"><thead><tr><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">Pass</th><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">Closed</th><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">Traction tires advised</th><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">Traction tires required</th><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5">First posted</th></tr></thead><tbody>
${tbl.replace(/<td>/g, '<td style="padding:10px 6px;border-bottom:1px solid #eee;vertical-align:top">')}
</tbody></table></div>
    <p>Required hours are also counted under advised, because a pass that requires traction tires was advised first. WSDOT's "traction tires required" line on White Pass, Chinook Pass and SR 410 also said chains are required on vehicles over 10,000 pounds gross weight.</p>
    <h2>When did it happen?</h2>
    <ul>
      <li><strong>October 25 and 26.</strong> WSDOT listed Cayuse Pass, Chinook Pass, SR 410 from Crystal Mountain to Greenwater and the Mt. Baker Highway as closed, for between 17 and 24 hours each. The Mt. Baker Highway was listed as closed again from October 27 at noon, 42 hours so far.</li>
      <li><strong>October 28.</strong> Traction tires advised from about 3 AM on Stevens Pass (10 hours) and White Pass (17 hours, with one hour of traction tires required), from 4 AM on Snoqualmie Pass and Blewett Pass (6 hours each), and from 6 AM on Cayuse Pass (24 hours).</li>
      <li><strong>October 29.</strong> Traction tires required on SR 410 near Crystal Mountain from about midnight and on Chinook Pass from about 4 AM, 4 hours each in the reports so far.</li>
    </ul>
    <h2>What does this not tell you?</h2>
    <ul>
      <li>One early storm is not a pattern. Ask again in January.</li>
      <li>WSDOT posts one restriction line for each pass. It does not separate eastbound from westbound in this report.</li>
      <li>We saved ${D.snapshots} of ${D.expectedSnapshots} possible hourly reports. An hour we did not save is not counted, so a count can be low by an hour or two.</li>
      <li>${esc(list(noInfo))} showed "no current information available" for most or all of the period, so they are not in the table.</li>
      <li>The table says what WSDOT posted. The sign on the road and the WSDOT pass page decide what you need.</li>
    </ul>
    <h2>What about Colorado and Montana?</h2>
    <p>Their feeds post notices rather than a line for each pass, so we count postings, not hours. Colorado posted its Traction Law (Code 15) ${co.postings} times on ${esc(list(co.roads))}, on ${esc(days(co.days))}. Montana posted "chains required for towing units" ${mt.postings} times on ${esc(list(mt.roads))}, on ${esc(days(mt.days))}. California's chain control records in our log all carry one label and one start day, so we cannot tell separate events apart and leave them out.</p>
    <h2>Where do I check before I drive?</h2>
    <ul>
      <li><a href="https://wsdot.wa.gov/travel/real-time/mountainpasses" target="_blank" rel="noopener">WSDOT mountain pass reports</a>, the source for this page.</li>
      <li><a href="/chain-laws/washington/">Do I need chains in Washington?</a> What each level means and the fines, with sources.</li>
      <li><a href="/road-conditions/washington/">Washington road conditions right now</a>, with closures and cameras.</li>
      <li><a href="/passes/snoqualmie/">Snoqualmie Pass driving conditions</a> and <a href="/passes/stevens/">Stevens Pass</a>.</li>
      <li><a href="/seasonal/washington/">Which Washington roads close for winter?</a></li>
    </ul>
    <h2>How is this counted?</h2>
    <p>MileCheck saves WSDOT's mountain pass report every hour. For each pass we read the restriction line and count the hours at each level. The method and the script are in the MileCheck repository as <code>scripts/chain-stats-wa.py</code>. The page is refreshed at month end and after a big storm.</p>`;
const faq = [
  ['How often are chains required on Washington passes?', `${lede} One early storm is too few to call a pattern. This page is updated as the season goes.`],
  ['Does a closed pass mean chains were required?', 'No. Closed and chains required are separate lines in WSDOT\'s report. A pass that is closed has no restriction to count while it is closed.'],
];
const ld = [
  { '@context': 'https://schema.org', '@type': 'Article', headline: 'How often are chains or traction tires required on Washington\'s passes?', datePublished: asOf.slice(0, 10), dateModified: asOf.slice(0, 10), mainEntityOfPage: URL, author: { '@type': 'Organization', name: 'MileCheck' }, publisher: { '@type': 'Organization', name: 'MileCheck', url: 'https://milecheckapp.com/' } },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
];
const h1 = 'How often are chains or traction tires required on Washington\'s passes?';
const title = `${h1} | MileCheck`;
const desc = `${lede} Counted hour by hour from WSDOT's pass reports for Snoqualmie, Stevens, White and the other Washington passes.`.slice(0, 300);
const html = headA + `  <title>${esc(title)}</title>\n  <meta name="description" content="${esc(desc)}">\n  <link rel="canonical" href="${URL}">\n` +
  `  <meta property="og:title" content="${esc(h1)}">\n  <meta property="og:description" content="${esc(desc)}">\n  <meta property="og:url" content="${URL}">\n  <meta property="og:type" content="article">\n` +
  headB.replace(/href="\.\.\//g, 'href="/') + `  <script type="application/ld+json">${JSON.stringify(ld[0])}</script>\n  <script type="application/ld+json">${JSON.stringify(ld[1])}</script>\n` +
  headC.replace(/href="\.\.\//g, 'href="/') + `  <article class="art">\n<div class="eyebrow">Chain laws</div>\n    <h1>${esc(h1)}</h1>\n${body}\n` + tail;
const dir = PATH.replace(/^\//, '');
mkdirSync(dir, { recursive: true });
writeFileSync(dir + 'index.html', html.replace(/href="\.\.\//g, 'href="/').replace(/src="\.\.\//g, 'src="/'));
console.log(`wrote ${PATH} (${rows.length} passes in the table)`);
