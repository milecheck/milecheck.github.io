#!/usr/bin/env python3
"""Give each steep grade in data/grades.json a name when it has one (Leah, 2026-10-26:
"can we name the grades if they have a name, like Cabbage Hill").

Two sources, in order:
  1. NAMED below: well-known grades that OpenStreetMap does not tag as a pass.
     Keyed by state, route and a point on the grade; a grade gets the name when
     its line passes within 3 km of that point.
  2. data/osm-passes.json: OpenStreetMap mountain_pass / saddle nodes with a name
     (Overpass, fetched 2026-10-26). A grade gets the pass name when the pass is
     within 1 km of its line AND within 3 km of the top of the climb
     (a pass beside the middle of a long grade, or on another road, is not its name).
A grade with neither keeps no name. Run after build-grades.py:
  python3 scripts/name-grades.py
"""
import json, math

NAMED = [  # (state, route, lat, lon, name)
    ('OR', 'I-84', 45.606, -118.639, 'Cabbage Hill'),
    ('TN', 'I-24', 35.22, -85.84, 'Monteagle'),
    ('MD', 'I-68', 39.71, -78.27, 'Sideling Hill'),
    ('VA', 'I-77', 36.62, -80.72, 'Fancy Gap'),
    ('WY', 'I-80', 41.26, -105.47, 'Sherman Hill'),
    ('CO', 'I-25', 37.03, -104.49, 'Raton Pass'),
    ('CO', 'I-70', 39.59, -106.25, 'Vail Pass'),
    ('NC', 'I-40', 35.62, -82.23, 'Old Fort Mountain'),
]

def to_xy(lat, lon, lat0):
    return lon * math.cos(math.radians(lat0)) * 111.0, lat * 111.0

def dist_to_line(pt, line):
    lat0 = pt[0]
    px, py = to_xy(pt[0], pt[1], lat0)
    best = 1e9
    for a, b in zip(line, line[1:]):
        ax, ay = to_xy(a[0], a[1], lat0)
        bx, by = to_xy(b[0], b[1], lat0)
        dx, dy = bx - ax, by - ay
        t = 0.0 if dx == dy == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(px - (ax + t * dx), py - (ay + t * dy)))
    return best

data = json.load(open('data/grades.json'))
passes = json.load(open('data/osm-passes.json'))
named = 0
for g in data['stretches']:
    g.pop('name', None)
    line = g['line']
    lats = [p[0] for p in line]; lons = [p[1] for p in line]
    for st, rt, la, lo, nm in NAMED:
        if g['state'] == st and g['route'] == rt and dist_to_line((la, lo), line) < 3:
            g['name'] = nm
            break
    if 'name' not in g:
        best = None
        for p in passes:
            if not (min(lats) - .1 < p['lat'] < max(lats) + .1 and min(lons) - .1 < p['lon'] < max(lons) + .1):
                continue
            d = dist_to_line((p['lat'], p['lon']), line)
            top = line[-1] if g.get('upWithMiles') else line[0]
            dtop = dist_to_line((p['lat'], p['lon']), [top, top])
            if d < 1.0 and dtop < 3 and not p['n'].startswith('Old ') and (best is None or d < best[0]):
                best = (d, p['n'])
        if best:
            g['name'] = best[1]
    named += 'name' in g
json.dump(data, open('data/grades.json', 'w'), separators=(',', ':'))
print(f"{named} of {len(data['stretches'])} grades named")
