#!/usr/bin/env python3
"""Steep grades from the bundled milepost corpus (2026-10-03).

For every interstate and US route: look up ground elevation at each mile marker from the
AWS open terrain tiles (terrarium PNG, zoom 11, about 50-75 m per pixel in the US, no key),
then grade = elevation change / road distance between consecutive markers.
A stretch is flagged when 2+ consecutive miles average 4% or more in one direction.
Mile-level averages smooth out short steep pitches, so the page says "average grade".

Writes data/grades.json (stretches) and caches tiles in ~/.cache/terrarium.
Run: python3 scripts/build-grades.py
"""
import json, glob, math, os, re, io, sys, collections, concurrent.futures as cf, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.dirname(ROOT)
DATA = os.path.join(APP, 'assets', 'data')
CACHE = os.path.expanduser('~/.cache/terrarium')
Z = 11
MIN_GRADE = 4.0     # percent, averaged over the stretch
MIN_MILES = 2
# Single-mile cutoffs. Interstates are built to about 6-7% at most, so a mile over 12% on one is a
# tunnel or a bad marker. US routes have real 10%+ grades (US-14A Wyoming), so they get room.
CAP_I = 12
CAP_US = 15
os.makedirs(CACHE, exist_ok=True)

# route display names from the app's ROUTE_MAPS (OR names, WA "SR n" for interstates and US routes)
routes_ts = open(os.path.join(APP, 'src', 'utils', 'routes.ts')).read()
ROUTE_MAPS = collections.defaultdict(dict)
cur = None
for line in routes_ts.splitlines():
    m = re.match(r"^  ([A-Z]{2}): \{", line)
    if m: cur = m.group(1); continue
    if re.match(r"^  \},?", line): cur = None; continue
    m = re.match(r"\s+'([^']+)': \[(.*?)\]", line)
    if cur and m:
        names = re.findall(r"'([^']+)'", m.group(2))
        if names: ROUTE_MAPS[cur][m.group(1)] = names[0]

# Route numbers a state's milepost file labels "US-" that are state highways there. The SD conversion
# script's US list includes 20, 34, 44, 50 and 63, but none of those US routes enter South Dakota
# (ChatGPT review 10/3 caught SD-34 and SD-44). Fix upstream in scripts/convert-sd-mileposts.js later.
NOT_US = {'SD': {'US-20', 'US-34', 'US-44', 'US-50', 'US-63'}}

def canon(state, raw):
    r = ROUTE_MAPS[state].get(raw, raw).strip()
    r = re.sub(r'^I\s+', 'I-', r); r = re.sub(r'^US\s+', 'US-', r)
    if r in NOT_US.get(state, ()): return None
    if re.fullmatch(r'I-\d+[A-Z]?', r) or re.fullmatch(r'US-\d+[A-Z]?', r): return r
    return None

def load():
    out = collections.defaultdict(dict)   # (state, route) -> {mile: (lat, lon)}
    for f in sorted(glob.glob(os.path.join(DATA, 'mileposts_*.json'))):
        if 'manifest' in f: continue
        st = os.path.basename(f)[10:12]
        d = json.load(open(f))
        rows = d if isinstance(d, list) else [dict(x, route=k) for k, v in d.items() if isinstance(v, list) for x in v]
        for x in rows:
            raw = x.get('route') or x.get('highway') or ''
            r = canon(st, raw)
            mile = x.get('mile', x.get('milepost'))
            lat, lon = x.get('lat'), x.get('lon', x.get('lng'))
            if r is None or mile is None or lat is None or lon is None: continue
            mi = round(float(mile))
            if abs(float(mile) - mi) > 0.05: continue
            out[(st, r)].setdefault(mi, (float(lat), float(lon)))
    return out

def tile_xy(lat, lon):
    n = 2 ** Z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y

def fetch(t):
    p = os.path.join(CACHE, f'{Z}_{t[0]}_{t[1]}.png')
    if not os.path.exists(p):
        url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{t[0]}/{t[1]}.png'
        for _ in range(3):
            try:
                b = urllib.request.urlopen(url, timeout=30).read(); open(p, 'wb').write(b); break
            except Exception: pass
    return t

def hav(a, b):
    R = 3958.8
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2 * R * math.asin(math.sqrt(h))

def best_sections(g, lo=0, hi=None):
    """Non-overlapping sections of g[lo:hi] with MIN_MILES+ miles averaging MIN_GRADE+.
    g is a list of (elevation change m, estimated distance m). The average is total elevation change over
    total distance, the same formula the output uses (ChatGPT follow-up 10/3: an unweighted mean could
    admit a section under 4%). Longest first (ties go to the steeper), then the same search on each side."""
    if hi is None: hi = len(g)
    best = None
    for a in range(lo, hi):
        rise = dist = 0.0
        for b in range(a, hi):
            rise += g[b][0]; dist += g[b][1]; n = b - a + 1
            avg = abs(rise) / dist * 100
            if n >= MIN_MILES and avg >= MIN_GRADE:
                key = (n, avg)
                if best is None or key > best[0]: best = (key, a, b + 1)
    if best is None: return []
    _, a, b = best
    return best_sections(g, lo, a) + [(a, b)] + best_sections(g, b, hi)

def main():
    corpus = load()
    pts = [(k, m, ll) for k, v in corpus.items() for m, ll in v.items()]
    print(f'{len(corpus)} routes, {len(pts)} markers', file=sys.stderr)
    tiles = {(int(tile_xy(*ll)[0]), int(tile_xy(*ll)[1])) for _, _, ll in pts}
    print(f'{len(tiles)} tiles', file=sys.stderr)
    with cf.ThreadPoolExecutor(32) as ex:
        for i, _ in enumerate(ex.map(fetch, tiles)):
            if i % 500 == 0: print(f'  tiles {i}', file=sys.stderr)
    imgs = {}
    def elev(ll):
        x, y = tile_xy(*ll); t = (int(x), int(y))
        if t not in imgs:
            p = os.path.join(CACHE, f'{Z}_{t[0]}_{t[1]}.png')
            imgs[t] = Image.open(p).convert('RGB').load() if os.path.exists(p) else None
        im = imgs[t]
        if im is None: return None
        px, py = min(255, int((x - t[0]) * 256)), min(255, int((y - t[1]) * 256))
        r, g, b = im[px, py]
        return (r * 256 + g + b / 256) - 32768   # metres

    stretches = []
    for (st, route), miles in sorted(corpus.items()):
        ms = sorted(miles)
        el = {m: elev(miles[m]) for m in ms}
        # per-mile grade between consecutive whole-mile markers one mile apart
        seg = []
        for a, b in zip(ms, ms[1:]):
            if b - a != 1 or el[a] is None or el[b] is None: seg.append(None); continue
            d = hav(miles[a], miles[b])
            # Distance is an ESTIMATE: the larger of one nominal mile and the straight-line distance between
            # the two markers. We have no measured road distance. The road can't be shorter than the straight
            # line, so using it when it's over a mile can only lower the grade.
            # 0.5 and 1.10 are quality filters we chose, not proof a pair is accurate. 1.10 drops the pairs the
            # ChatGPT review flagged (WY US-212 MP 34-35 at 1.196, SD MP 38-39 at 1.248); 1.05 split Cabbage Hill
            # and Monarch Pass on 1.06 pairs. 0.5 leaves room for switchbacks (Monarch MP 199-200 is 0.58).
            if d < 0.5 or d > 1.10: seg.append(None); continue
            g = (el[b] - el[a]) / (max(1.0, d) * 1609.34) * 100
            # Over 15% in one mile is a tunnel (terrain above the road) or a bad marker. Skip it.
            # (10% cut the real 10% descent on US-14A in Wyoming, ChatGPT review 10/3.)
            # (a, b, grade %, elevation change m, distance used m)
            seg.append((a, b, g, el[b] - el[a], max(1.0, d) * 1609.34) if abs(g) <= (CAP_I if route.startswith('I-') else CAP_US) else None)
        # runs of same-sign grade, then keep runs averaging MIN_GRADE over MIN_MILES+
        i = 0
        while i < len(seg):
            if seg[i] is None or abs(seg[i][2]) < 2.5: i += 1; continue
            sgn = 1 if seg[i][2] > 0 else -1
            j = i
            while j + 1 < len(seg) and seg[j+1] is not None and seg[j+1][2] * sgn > 1.5: j += 1
            run = seg[i:j+1]
            # A long run can average under MIN_GRADE because of gentle miles at its ends while a section
            # inside it qualifies (CO I-70 MP 254-263, ChatGPT review 10/3). Take the longest qualifying
            # section, then look again in what's left on each side. Sections never overlap.
            for lo, hi in best_sections([(x[3], x[4]) for x in run]):
                part = run[lo:hi]
                n = len(part)
                rise = sum(x[3] for x in part)                  # metres
                avg = abs(rise) / sum(x[4] for x in part) * 100
                a, b = part[0][0], part[-1][1]
                stretches.append({
                    'state': st, 'route': route, 'from': a, 'to': b, 'miles': n,
                    'avg': round(avg, 1), 'max': round(max(abs(x[2]) for x in part), 1),
                    'climbFt': round(abs(rise) * 3.28084),
                    # direction of increasing mileposts: up or down
                    'upWithMiles': sgn > 0,
                    'lat': round((miles[a][0] + miles[b][0]) / 2, 5),
                    'lon': round((miles[a][1] + miles[b][1]) / 2, 5),
                    'line': [[round(miles[m][0], 5), round(miles[m][1], 5)] for m in range(a, b + 1) if m in miles],
                })
            i = j + 1
    stretches.sort(key=lambda s: (-s['avg'] * s['miles']))
    os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
    json.dump({'built': __import__('datetime').date.today().isoformat(), 'minGrade': MIN_GRADE,
               'minMiles': MIN_MILES, 'stretches': stretches},
              open(os.path.join(ROOT, 'data', 'grades.json'), 'w'), separators=(',', ':'))
    print(f'{len(stretches)} stretches', file=sys.stderr)

if __name__ == '__main__':
    main()
