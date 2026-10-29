#!/usr/bin/env python3
"""Counts WSDOT pass restrictions hour by hour from MileCheck's hourly archive (R2 mirror-feeds
alert-archive-hourly/WA/conditions/<YYYY-MM-DDTHH>.json) and CO / MT chain notices from the incident log
(incident-lifecycle/<ST>/<YYYY-MM>*.jsonl). Writes data/chains-by-pass.json for gen-chains-by-pass.mjs.
  1. Pull the snapshots (needs CLOUDFLARE_API_TOKEN):
       mkdir -p /tmp/wacond /tmp/lc
       python3 -c "import datetime as d;t=d.datetime(2026,9,27)
       while t<=d.datetime.utcnow(): print(t.strftime('%Y-%m-%dT%H')); t+=d.timedelta(hours=1)" > /tmp/wacond/keys.txt
       cat /tmp/wacond/keys.txt | xargs -P 10 -I{} sh -c 'npx wrangler r2 object get "mirror-feeds/alert-archive-hourly/WA/conditions/{}.json" --file "/tmp/wacond/{}.json" --remote >/dev/null 2>&1 || rm -f "/tmp/wacond/{}.json"'
       for st in CO MT; do for m in 2026-10 2026-11; do npx wrangler r2 object get "mirror-feeds/incident-lifecycle/$st/$m.jsonl" --file "/tmp/lc/$st-$m.jsonl" --remote; done; done
  2. python3 scripts/chain-stats-wa.py   (from the site root)
An hour counts at the level WSDOT's restriction line showed in that hour's snapshot. Hours with no snapshot are not counted.
"""
import glob, json, re, collections, datetime, statistics
from zoneinfo import ZoneInfo
PT = ZoneInfo('America/Los_Angeles'); UTC = ZoneInfo('UTC')
files = sorted(glob.glob('/tmp/wacond/2026-*.json'))
def hrof(f): return f.split('/')[-1][:13]
def level(t):
    t = (t or '').lower().strip()
    if t.startswith('no restrictions'): return 'none'
    if 'no current information' in t: return 'nodata'
    if 'traction tires required' in t or 'chains required' in t or 'chain required' in t: return 'required'
    if 'advised' in t: return 'advised'
    if 'closed' in t: return 'closed'
    return 'other'
per = collections.defaultdict(dict)
for f in files:
    d = json.load(open(f))
    for r in d.get('road-weather-reports', []):
        per[r['location-name'].strip()][hrof(f)] = (level(r.get('restriction-one')), r.get('restriction-one') or '')
def episodes(h, levels):
    out = []; cur = None; prev = None
    for hr in sorted(h):
        t = datetime.datetime.strptime(hr, '%Y-%m-%dT%H').replace(tzinfo=UTC)
        if h[hr][0] in levels:
            if cur and prev and (t - prev).total_seconds() <= 2 * 3600: cur['end'] = t; cur['hours'] += 1
            else: cur = {'start': t, 'end': t, 'hours': 1}; out.append(cur)
        prev = t
    return [{'start': e['start'].astimezone(PT).isoformat(), 'end': (e['end'] + datetime.timedelta(hours=1)).astimezone(PT).isoformat(), 'hours': e['hours']} for e in out]
passes = []
for name, h in sorted(per.items()):
    c = collections.Counter(v[0] for v in h.values())
    passes.append({'name': name, 'snapshots': len(h), 'none': c['none'], 'nodata': c['nodata'], 'advised': c['advised'], 'required': c['required'], 'closed': c['closed'],
                   'advisedEpisodes': episodes(h, {'advised', 'required'}), 'requiredEpisodes': episodes(h, {'required'}), 'closedEpisodes': episodes(h, {'closed'})})
first = files[0].split('/')[-1][:13]; last = files[-1].split('/')[-1][:13]
start = datetime.datetime.strptime(first, '%Y-%m-%dT%H').replace(tzinfo=UTC); end = datetime.datetime.strptime(last, '%Y-%m-%dT%H').replace(tzinfo=UTC)
expected = int((end - start).total_seconds() // 3600) + 1
# Colorado and Montana from the incident log (title wording only; a record is one posting, not one hour)
rx = re.compile(r'\b(chain|chains|traction)\b', re.I)
rows = []
for f in glob.glob('/tmp/lc/*.jsonl'):
    for l in open(f):
        l = l.strip()
        if not l: continue
        try: r = json.loads(l)
        except Exception: continue
        if r.get('state') in ('CO', 'MT') and rx.search(r.get('title') or ''): rows.append(r)
def roads(st, keep=lambda r: True):
    v = [r for r in rows if r['state'] == st and keep(r)]
    by = collections.defaultdict(list)
    for r in v: by[r['route']].append(r)
    days = sorted({datetime.datetime.fromisoformat(r['first'].replace('Z', '+00:00')).astimezone(PT).strftime('%Y-%m-%d') for r in v})
    return {'postings': len(v), 'days': days, 'roads': sorted(by), 'byRoad': {k: len(x) for k, x in sorted(by.items())}}
co = roads('CO', lambda r: 'Lifted' not in (r.get('title') or '') and 'Traction Law' in (r.get('title') or ''))
mt = roads('MT', lambda r: 'Chains Required' in (r.get('title') or ''))
out = {'asOf': end.astimezone(PT).isoformat(), 'from': start.astimezone(PT).isoformat(), 'snapshots': len(files), 'expectedSnapshots': expected,
       'passes': passes, 'co': co, 'mt': mt}
json.dump(out, open('data/chains-by-pass.json', 'w'), indent=1)
print('wrote data/chains-by-pass.json:', len(passes), 'passes,', len(files), 'of', expected, 'hourly snapshots; CO', co['postings'], 'postings; MT', mt['postings'])
