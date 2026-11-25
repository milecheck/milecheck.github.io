#!/usr/bin/env python3
"""build-truck-map.py: per-state GeoJSON layers for /truck-restrictions/.

Two parts, run either or both:
  python3 -I scripts/build-truck-map.py nbi  <path to NBI delimited .txt> <file year, e.g. 2025>
  python3 -I scripts/build-truck-map.py osm  <dir with overpass-<layer>.json files>

NBI part (FHWA National Bridge Inventory, one record per bridge, "HwyBridgesDelimited"):
  get it from https://www.fhwa.dot.gov/bridge/nbi/ascii.cfm (year page, "delimited",
  one record per bridge). Keeps a bridge when
    - the road UNDER it is a highway (item 54A = H) and item 54B is under 15'6", or
    - the clearance over the deck (item 53, or item 10) is under 15'6", or
    - item 41 is P (posted for load), R (other restriction) or K (closed).
  Clearances are stored in whole inches, rounded DOWN (a 4.11 m reading is 13' 5", not 13' 6").
  NBI lat/lon: item 16 = DDMMSSss, item 17 = DDDMMSSss, west longitude is written positive.

OSM part (OpenStreetMap, ODbL): each overpass-<layer>.json is an Overpass "out center tags"
  answer. Layers: weigh, parking, stops, rest, ramps. Each point goes to the state whose
  NBI bridge box holds it; where boxes overlap, the state with the nearest bridge wins.

Output: data/restrictions/<layer>/<ST>.geojson, coords rounded to 5 decimals,
plus data/restrictions/index.json (counts per state per layer and the vintages).
"""
import csv, json, math, os, re, sys
from collections import defaultdict

OUT = "data/restrictions"
FIPS = {"01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY","72":"PR"}
LIMIT_M = 4.7244  # 15 ft 6 in
FLOOR_M = 2.13    # under 7 ft is almost always a coding error in the inventory (a 2' 5" deck clearance)
POST = {"P": "Posted for load", "R": "Restricted (other than load)", "K": "Closed"}
EVAL70 = {"0": "40% or more below legal loads", "1": "30-39.9% below legal loads", "2": "20-29.9% below legal loads",
          "3": "10-19.9% below legal loads", "4": "0.1-9.9% below legal loads"}


def dms(v, deg_digits):
    v = (v or "").strip()
    if not v.isdigit() or int(v) == 0:
        return None
    v = v.zfill(deg_digits + 6)
    d, m, s = int(v[:deg_digits]), int(v[deg_digits:deg_digits + 2]), int(v[deg_digits + 2:]) / 100
    if m >= 60 or s >= 60:
        return None
    return d + m / 60 + s / 3600


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def inches(m):
    return int(math.floor(m * 39.3701 + 1e-6))


UPPER = {"SR", "US", "IH", "I", "CR", "FM", "RR", "BNSF", "UP", "NE", "NW", "SE", "SW", "EB", "WB", "NB", "SB", "HWY", "SH", "TH", "CSAH", "RT", "LR", "MP"}


def clean(s):
    out = []
    for w in " ".join((s or "").replace("'", " ").split()).split(" "):
        t = w.title()
        t = re.sub(r"(\d)(St|Nd|Rd|Th)\b", lambda m: m.group(1) + m.group(2).lower(), t)
        out.append(w.upper() if w.upper().strip(".,") in UPPER else t)
    return " ".join(out)


def write_layer(layer, by_state):
    os.makedirs(f"{OUT}/{layer}", exist_ok=True)
    for st, feats in by_state.items():
        fc = {"type": "FeatureCollection", "features": feats}
        with open(f"{OUT}/{layer}/{st}.geojson", "w") as f:
            json.dump(fc, f, separators=(",", ":"))


def load_index():
    p = f"{OUT}/index.json"
    return json.load(open(p)) if os.path.exists(p) else {"layers": {}, "sources": {}}


def save_index(ix):
    with open(f"{OUT}/index.json", "w") as f:
        json.dump(ix, f, separators=(",", ":"), sort_keys=True)


def build_nbi(path, vintage):
    r = csv.reader(open(path, encoding="latin-1"), quotechar="'")
    h = next(r)
    col = {k: h.index(k) for k in h}
    g = lambda row, k: row[col[k]].strip()
    by_state = defaultdict(list)
    counts = defaultdict(int)
    bad = 0
    for row in r:
        st = FIPS.get(g(row, "STATE_CODE_001").zfill(2))
        if not st:
            continue
        kinds, props = [], {}
        und = num(g(row, "VERT_CLR_UND_054B"))
        if g(row, "VERT_CLR_UND_REF_054A") == "H" and und and FLOOR_M <= und < LIMIT_M:
            props["u"] = inches(und)
        overs = [x for x in (num(g(row, "VERT_CLR_OVER_MT_053")), num(g(row, "MIN_VERT_CLR_010"))) if x and FLOOR_M <= x < LIMIT_M]
        if overs:
            props["o"] = inches(min(overs))
        if "u" in props or "o" in props:
            kinds.append("L")
        p41 = g(row, "OPEN_CLOSED_POSTED_041").upper()
        if p41 in POST:
            kinds.append({"P": "W", "R": "R", "K": "C"}[p41])
            props["p"] = p41
            e = g(row, "POSTING_EVAL_070")
            if e in EVAL70:
                props["e"] = e
            op = num(g(row, "OPERATING_RATING_064"))
            if op and 0 < op < 99:
                props["t"] = round(op * 1.10231, 1)  # metric tonnes -> US tons
        if not kinds:
            continue
        lat, lon = dms(g(row, "LAT_016"), 2), dms(g(row, "LONG_017"), 3)
        if lat is None or lon is None:
            bad += 1
            continue
        lon = -lon
        props.update({"k": "".join(kinds), "s": g(row, "STRUCTURE_NUMBER_008").lstrip("0") or "0",
                      "on": clean(g(row, "FACILITY_CARRIED_007")), "x": clean(g(row, "FEATURES_DESC_006A"))})
        by_state[st].append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [round(lon, 5), round(lat, 5)]}, "properties": props})
        for k in kinds:
            counts[k] += 1
        if "u" in props:
            counts["L_under"] += 1
        if "o" in props:
            counts["L_over"] += 1
    # Some inventory rows carry miscoded coordinates (an extra digit, 0/0). Drop a point
    # more than 1 degree outside the box that holds 98% of that state's bridges.
    for st, feats in by_state.items():
        la = sorted(f["geometry"]["coordinates"][1] for f in feats)
        lo = sorted(f["geometry"]["coordinates"][0] for f in feats)
        q = lambda a, p: a[min(len(a) - 1, int(p * len(a)))]
        box = (q(la, .01) - 1, q(la, .99) + 1, q(lo, .01) - 1, q(lo, .99) + 1)
        keep = [f for f in feats if box[0] <= f["geometry"]["coordinates"][1] <= box[1] and box[2] <= f["geometry"]["coordinates"][0] <= box[3]]
        bad += len(feats) - len(keep)
        by_state[st] = keep
    write_layer("bridges", by_state)
    ix = load_index()
    ix["layers"]["bridges"] = {st: len(v) for st, v in sorted(by_state.items())}
    ix["sources"]["bridges"] = {"name": "FHWA National Bridge Inventory", "vintage": vintage, "file": f"{vintage}HwyBridgesDelimitedAllStates.txt"}
    ix["nbiCounts"] = dict(counts)
    save_index(ix)
    print("NBI kept", sum(len(v) for v in by_state.values()), dict(counts), "bad coords", bad)


# Rough state boxes for OSM points (minLat, maxLat, minLon, maxLon); ties go to the
# state whose NBI bridges sit nearest. Built once from the NBI bridge files.
def state_boxes():
    boxes, pts = {}, {}
    for f in os.listdir(f"{OUT}/bridges"):
        st = f[:2]
        cs = [ft["geometry"]["coordinates"] for ft in json.load(open(f"{OUT}/bridges/{f}"))["features"]]
        if not cs:
            continue
        la = sorted(c[1] for c in cs); lo = sorted(c[0] for c in cs)
        q = lambda a, p: a[min(len(a) - 1, max(0, int(p * len(a))))]
        boxes[st] = (q(la, .002) - .05, q(la, .998) + .05, q(lo, .002) - .05, q(lo, .998) + .05)
        pts[st] = cs[:: max(1, len(cs) // 400)]
    return boxes, pts


def pick_state(lat, lon, boxes, pts):
    cand = [st for st, (a, b, c, d) in boxes.items() if a <= lat <= b and c <= lon <= d]
    if len(cand) == 1:
        return cand[0]
    cand = cand or list(boxes)
    return min(cand, key=lambda st: min((p[1] - lat) ** 2 + ((p[0] - lon) * math.cos(math.radians(lat))) ** 2 for p in pts[st]))


OSM_LAYERS = {
    "weigh": "Weigh station", "parking": "Truck parking", "stops": "Truck stop",
    "rest": "Rest area", "ramps": "Runaway truck ramp",
}


def build_osm(d):
    boxes, pts = state_boxes()
    ix = load_index()
    for layer in OSM_LAYERS:
        p = os.path.join(d, f"overpass-{layer}.json")
        if not os.path.exists(p):
            print("skip", layer, "(no file)")
            continue
        els = json.load(open(p)).get("elements", [])
        by_state, seen = defaultdict(list), set()
        for e in els:
            lat = e.get("lat") or (e.get("center") or {}).get("lat")
            lon = e.get("lon") or (e.get("center") or {}).get("lon")
            if lat is None:
                continue
            key = (round(lat, 3), round(lon, 3))
            if key in seen:
                continue
            seen.add(key)
            t = e.get("tags", {})
            props = {"id": f"{e['type'][0]}{e['id']}"}
            nm = t.get("name") or t.get("brand") or t.get("operator")
            if nm:
                props["n"] = nm[:60]
            for src, dst in (("ref", "r"), ("opening_hours", "h"), ("capacity:hgv", "cap"), ("capacity", "cap"), ("direction", "d"), ("surface", "sf")):
                if t.get(src) and dst not in props:
                    props[dst] = t[src][:40]
            st = pick_state(lat, lon, boxes, pts)
            by_state[st].append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [round(lon, 5), round(lat, 5)]}, "properties": props})
        write_layer(layer, by_state)
        ix["layers"][layer] = {st: len(v) for st, v in sorted(by_state.items())}
        ix["sources"][layer] = {"name": "OpenStreetMap contributors (ODbL)"}
        print(layer, sum(len(v) for v in by_state.values()))
    save_index(ix)


if __name__ == "__main__":
    if sys.argv[1] == "nbi":
        build_nbi(sys.argv[2], sys.argv[3])  # vintage = the NBI file year, e.g. 2025
    elif sys.argv[1] == "osm":
        build_osm(sys.argv[2])
