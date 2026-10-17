// gen-dot-jobs.mjs — builds /dot-jobs/ from the postings two state DOTs publish openly.
//   Oregon: ODOT's Workday career site (public JSON, no key, robots.txt allows /SOR_External_Career_Site/).
//   Minnesota: MnDOT's own "Current job openings" page (static HTML, robots.txt allows it).
// Other states post on NEOGOV (governmentjobs.com robots.txt disallows non-search bots) or Taleo,
// so they get an official-portal link instead of scraped rows. See data/dot-jobs-sources.md.
//
//   node scripts/gen-dot-jobs.mjs            # fetch + write data/dot-jobs.json + dot-jobs/index.html
//   node scripts/gen-dot-jobs.mjs --offline  # re-render from data/dot-jobs.json
//
// If a source fails, its last good rows are kept (and marked stale on the page) rather than dropped.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OFFLINE = process.argv.includes('--offline');
const DATA = resolve(SITE, 'data/dot-jobs.json');
const UA = 'Mozilla/5.0 (compatible; MileCheckJobsBot/1.0; +https://milecheckapp.com; info@milecheckapp.com)';
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const decode = s => s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#64;/g, '@').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- Oregon ----------
const OR_BASE = 'https://oregon.wd5.myworkdayjobs.com';
async function fetchOregon() {
  const rows = [];
  const listed = [];
  for (let offset = 0; ; offset += 20) {
    if (offset > 2000) throw new Error('OR list passed 2000 results, refusing to truncate');
    const r = await fetch(`${OR_BASE}/wday/cxs/oregon/SOR_External_Career_Site/jobs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Language': 'en-US', 'User-Agent': UA },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: 'seasonal' }),
    });
    if (!r.ok) throw new Error(`OR list ${r.status}`);
    const j = await r.json();
    listed.push(...j.jobPostings);
    if (offset + 20 >= j.total) break;
    await sleep(400);
  }
  const mine = listed.filter(p => /\bODOT\b/.test(p.locationsText || '') && /seasonal/i.test(`${p.title} ${(p.bulletFields || []).join(' ')}`));
  for (const p of mine) {
    await sleep(400);
    let d;
    for (let t = 0; t < 3; t++) {
      d = await fetch(`${OR_BASE}/wday/cxs/oregon/SOR_External_Career_Site${p.externalPath}`, { headers: { Accept: 'application/json', 'Accept-Language': 'en-US', 'User-Agent': UA } });
      if (d.ok) break;
      await sleep(1500);
    }
    if (!d.ok) throw new Error(`OR detail ${p.externalPath} ${d.status}`); // incomplete fetch: keep last good rows
    const info = (await d.json()).jobPostingInfo;
    const text = decode(info.jobDescription.replace(/<[^>]+>/g, ' '));
    const dl = text.match(/Application Deadline:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const sal = text.match(/Salary Range:\s*(\$[\d,]+(?:\.\d+)?)\s*-\s*(\$[\d,]+(?:\.\d+)?)/);
    const contact = text.match(/[\w.]+@odot\.oregon\.gov/i);
    rows.push({
      id: info.jobReqId, state: 'OR', agency: 'Oregon Department of Transportation',
      title: info.title.replace(/\s*\(Multiple Positions\)/, ''), multiple: /Multiple Positions/.test(info.title),
      location: (info.location || '').split('|')[0].trim() + ', OR',
      pay: sal ? `${sal[1]} to ${sal[2]} a month` : null,
      closes: dl ? `${dl[3]}-${dl[1].padStart(2, '0')}-${dl[2].padStart(2, '0')}` : null,
      closesNote: /remain open until filled/i.test(text) ? 'Open until filled. May close any time after this date.' : null,
      kind: 'Seasonal', url: info.externalUrl, recruiter: contact ? contact[0] : null,
    });
  }
  return rows;
}

// ---------- Minnesota ----------
async function fetchMinnesota() {
  const r = await fetch('https://dot.mn.gov/careers/job-openings.html', { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`MN ${r.status}`);
  const h = await r.text();
  const start = h.indexOf('Current job openings');
  if (start < 0) throw new Error('MN page heading not found, layout changed');
  const body = h.slice(start);
  const rows = [];
  // each posting: <a href="…JobOpeningId=N…">…title…</a> then Job ID / Location / Salary range / Closing date
  const re = /<a[^>]+href=["']([^"']*JobOpeningId=(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>([\s\S]*?)(?=<a[^>]+JobOpeningId=|$)/g;
  let m;
  let seen = 0;
  while ((m = re.exec(body))) {
    seen++;
    const block = decode(m[4].replace(/<[^>]+>/g, ' '));
    const title = decode(m[3].replace(/<[^>]+>/g, ' '));
    const loc = block.match(/Location:\s*(.*?)\s*Salary range:/);
    const pay = block.match(/Salary range:\s*(.*?)\s*Closing date:/);
    const close = block.match(/Closing date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const isTemp = /\b(temporary|seasonal)\b|\bemergency (snow|transportation|plow)/i.test(title);
    const isSnow = /snow\s*(&|and)\s*ice|snow ?plow/i.test(title);
    if (!isTemp && !isSnow) continue;
    rows.push({
      id: m[2], state: 'MN', agency: 'Minnesota Department of Transportation',
      title, location: `${(loc ? loc[1] : '').replace(/ - \d+ positions?$/i, '')}, MN`,
      pay: pay ? pay[1].replace(/\s*\/\s*hourly/, ' an hour').replace(/\s*\/\s*annually/, ' a year').replace(/\s*\/\s*hr\b/g, ' an hour').replace(/\s*\/\s*$/, '').trim() : null,
      closes: close ? `${close[3]}-${close[1].padStart(2, '0')}-${close[2].padStart(2, '0')}` : null,
      closesNote: null,
      kind: isTemp ? 'Seasonal or temporary (from the title)' : 'Regular position with snow and ice duties (from the title)',
      url: m[1].replace(/&amp;/g, '&'), recruiter: null,
    });
  }
  const linked = (body.match(/JobOpeningId=/g) || []).length;
  if (linked === 0 || seen < linked) throw new Error(`MN parsed ${seen} of ${linked} postings, layout changed`);
  return rows;
}

// ---------- run ----------
let store = existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : { sources: {} };
if (!OFFLINE) {
  const now = new Date().toISOString();
  for (const [key, fn] of [['OR', fetchOregon], ['MN', fetchMinnesota]]) {
    try {
      const rows = await fn();
      store.sources[key] = { fetchedAt: now, ok: true, rows };
      console.log(`${key}: ${rows.length} rows`);
    } catch (e) {
      console.error(`${key} failed: ${e.message} (keeping last good rows)`);
      store.sources[key] = { ...(store.sources[key] || { rows: [] }), ok: false };
    }
  }
  store.updatedAt = now;
  mkdirSync(dirname(DATA), { recursive: true });
  writeFileSync(DATA, JSON.stringify(store, null, 1) + '\n');
}

// ---------- render ----------
const PT = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(d); // YYYY-MM-DD, Pacific
const today = PT(new Date());
const MAX_AGE_MS = 48 * 3600e3;
const fresh = s => !!s.fetchedAt && Date.now() - new Date(s.fetchedAt) < MAX_AGE_MS;
const fmt = iso => iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'Not listed';
const all = Object.values(store.sources).filter(fresh).flatMap(s => s.rows)
  .filter(r => !r.closes || r.closes >= today || r.closesNote) // Oregon postings stay open past the listed date until filled
  .sort((a, b) => ((a.closes && a.closes < today) - (b.closes && b.closes < today)) || (a.closes || '9999').localeCompare(b.closes || '9999') || a.state.localeCompare(b.state));
const stale = Object.entries(store.sources).filter(([, s]) => !s.ok);
const updated = fmt(PT(new Date(store.updatedAt || Date.now())));
const readOn = (k) => store.sources[k]?.fetchedAt ? fmt(PT(new Date(store.sources[k].fetchedAt))) : 'never';

const TD = 'padding:10px 6px;border-bottom:1px solid #eee;vertical-align:top';
const TH = 'text-align:left;padding:8px 6px;border-bottom:2px solid #E5E5E5';
const table = rows => `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5"><thead><tr><th style="${TH}">Position</th><th style="${TH}">Agency and place</th><th style="${TH}">Pay</th><th style="${TH}">Closes</th></tr></thead><tbody>
${rows.map(r => `<tr><td style="${TD}"><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a>${r.multiple ? ' (more than one opening)' : ''}<br><span style="font-size:13px;color:#5b6670">${esc(r.kind)}</span></td><td style="${TD}">${esc(r.agency)}<br>${esc(r.location)}</td><td style="${TD}">${esc(r.pay || 'Not listed')}</td><td style="${TD}">${r.closesNote ? 'First review ' : ''}${fmt(r.closes)}${r.closesNote ? `<br><span style="font-size:13px;color:#5b6670">${esc(r.closesNote)}</span>` : ''}</td></tr>`).join('\n')}
</tbody></table></div>`;

const seasonal = all.filter(r => !r.kind.startsWith('Regular'));
const regular = all.filter(r => r.kind.startsWith('Regular'));

const PORTALS = [
  ['Washington', 'WSDOT and other state agencies', 'https://www.governmentjobs.com/careers/washington', 'careers.wa.gov'],
  ['Idaho', 'the Idaho Transportation Department', 'https://statecareers.idaho.gov/', 'State of Idaho careers'],
  ['Montana', 'the Montana Department of Transportation', 'https://mtstatejobs.taleo.net/careersection/200/jobsearch.ftl?lang=en', 'Montana state jobs'],
  ['Colorado', 'CDOT', 'https://www.governmentjobs.com/careers/Colorado', 'careers.colorado.gov'],
  ['Utah', 'UDOT', 'https://www.governmentjobs.com/careers/utah', 'State of Utah jobs'],
];

const page = `<div class="eyebrow">Jobs</div>
    <h1>Which state DOTs are hiring seasonal highway workers right now?</h1>
    <p class="lede">These are open postings from state DOTs, pulled from the agencies' own job sites. Each one links to the official posting. The list covers Oregon and Minnesota so far. Updated ${esc(updated)}.</p>
    ${Object.entries(store.sources).filter(([, s]) => !s.ok || !fresh(s)).map(([k, s]) => `<p><strong>${k === 'OR' ? 'Oregon' : 'Minnesota'} could not be reached on the last check.</strong> ${fresh(s) ? `These rows were last read ${readOn(k)} and may be out of date.` : (s.fetchedAt ? `Its rows are hidden because they were last read ${readOn(k)}.` : 'There has been no successful read yet.')}</p>`).join('\n    ')}
    <h2>Seasonal and temporary positions</h2>
    ${seasonal.length ? table(seasonal) : '<p>No open seasonal postings found on the last check.</p>'}
    ${regular.length ? `<h2>Other snow and ice positions</h2><p>These titles mention snow and ice work but not seasonal or temporary. Check the posting for the appointment type.</p>${table(regular)}` : ''}
    <p style="font-size:14px;color:#5b6670">Pay is as posted. Oregon lists monthly pay. Check the posting for the shift, license and physical requirements. Oregon postings that say open until filled may stop considering applications after the first review date, so apply early. Seasonal or regular is our reading of the posting title.</p>

    <h2>Other states</h2>
    <p>For these states we link to the official hiring site instead of copying listings. Search for "seasonal" or "highway maintenance."</p>
    <ul>
${PORTALS.map(p => `      <li><a href="${esc(p[2])}" target="_blank" rel="noopener">${esc(p[0])}</a> for ${esc(p[1])} (${esc(p[3])})</li>`).join('\n')}
    </ul>

    <h2>How does state DOT hiring work?</h2>
    <p>Rules differ by state and by agency. Most of what is published below comes from Oregon. Check your own state's rules.</p>
    <ul>
      <li><strong>Applications are scored against the posting.</strong> ODOT says it scores applications against the "What we'd like to see" list in each posting, so answer every item with specific experience. <a href="https://www.oregon.gov/odot/about/pages/applicant-information.aspx" target="_blank" rel="noopener">ODOT applicant information</a>.</li>
      <li><strong>Seasonal and permanent jobs may have separate postings.</strong> Apply to each position you want.</li>
      <li><strong>Veterans get preference in Oregon.</strong> Oregon gives qualifying veterans and other eligible servicemembers hiring preference. For scored evaluations it is generally 5 percentage points, or 10 for disabled veterans. ORS 408.237 generally requires interviews for veteran applicants who show the required qualifications and skills, with a limited exception. See Oregon's <a href="https://www.oregon.gov/boli/workers/pages/veterans-preference.aspx" target="_blank" rel="noopener">veterans' preference page</a>, ORS 408.230 and ORS 408.237. Other states have their own laws.</li>
      <li><strong>State hiring follows written policy.</strong> Oregon's is <a href="https://www.oregon.gov/das/Policies/40-010-02.pdf" target="_blank" rel="noopener">DAS policy 40.010.02</a>.</li>
      <li><strong>You can ask for feedback.</strong> Postings name a recruiter. If you are not selected, you can email and ask how your application could be stronger. They may not be able to say much.</li>
    </ul>
    <p>We do not know how any agency scores interviews beyond what it publishes.</p>
    <p style="font-size:14px;color:#5b6670">Sources are ODOT's Workday careers site (read ${esc(readOn('OR'))}) and MnDOT's current job openings page (read ${esc(readOn('MN'))}). Closing dates and pay come from the postings. Check the posting before you apply.</p>

    <div class="cta">
      <h3>Already on a DOT crew?</h3>
      <p>MileCheck shows the mile marker you are at, to one decimal, and works offline.</p>
      <div class="btns"><a class="primary" href="/get/">Get the app</a></div>
    </div>`;

const tpl = readFileSync(resolve(SITE, 'rest-areas/index.html'), 'utf8');
const a0 = tpl.indexOf('<article class="art">');
const a1 = tpl.indexOf('</article>');
const TITLE = 'Which state DOTs are hiring seasonal highway workers right now?';
const DESC = 'Open seasonal and winter maintenance jobs at state DOTs, with pay and closing dates, each linking to the official posting. Plus how state DOT hiring works.';
let out = tpl.slice(0, a0) + `<article class="art">\n` + page + '\n  ' + tpl.slice(a1);
out = out.replace(/<title>[^<]*<\/title>/, `<title>${esc(TITLE)} | MileCheck</title>`)
  .replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(DESC)}"`)
  .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(TITLE)}"`)
  .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(DESC)}"`)
  .replace(/https:\/\/milecheckapp\.com\/rest-areas\//g, 'https://milecheckapp.com/dot-jobs/')
  .replace(/"name":"[^"]*"/, `"name":${JSON.stringify(TITLE)}`);
mkdirSync(resolve(SITE, 'dot-jobs'), { recursive: true });
writeFileSync(resolve(SITE, 'dot-jobs/index.html'), out);
console.log(`dot-jobs/index.html written: ${seasonal.length} seasonal, ${regular.length} regular`);
