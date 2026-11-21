#!/usr/bin/env python3
"""
Finds free-licensed Wikimedia Commons photos for the 16 places that still have none
(14 sites + Anbar and Salah al-Din governorates). Same rules as fetch-commons-photos.py,
slightly relaxed (square photos and 1000px+ allowed, more category names).
Usage: python fetch-missing-photos.py   -> writes missing-results.json
"""
import json, os, re, sys, time, urllib.parse, urllib.request
UA = "IraqTravelSiteBuilder/0.1 (https://github.com/alialburhan2-lab/TikTap)"
API = "https://commons.wikimedia.org/w/api.php"
OUT = sys.argv[1] if len(sys.argv) > 1 else "missing-results.json"
# key -> (list of Commons categories to try, fallback search text, keywords one of which must appear in file title/description/categories)
P = {
 "site:royal-cemetery-of-ur": (["Royal Cemetery at Ur", "Ur (archaeological site)", "Ur"], "Royal tombs Ur Iraq", ["royal", "tomb", "cemetery", "mausole"]),
 "site:eridu": (["Eridu", "Tell Abu Shahrain"], "Eridu Abu Shahrain", ["eridu", "shahrain"]),
 "site:lagash": (["Lagash", "Al-Hiba"], "Lagash Tell al-Hiba excavation", ["lagash", "hiba"]),
 "site:girsu": (["Girsu", "Tello (Iraq)", "Tello"], "Girsu Tello excavation Iraq", ["girsu", "tello", "telloh"]),
 "site:al-chibayish": (["Chibayish", "Al-Chibayish", "Central Marshes"], "Chibayish marshes mashoof", ["chibayish", "chibaish", "jbayish"]),
 "site:uruk": (["Uruk", "Warka"], "Uruk Warka Eanna ziggurat ruins", ["uruk", "warka", "eanna"]),
 "site:nippur": (["Nippur"], "Nippur ziggurat Enlil ruins", ["nippur", "nuffar", "niffer"]),
 "site:ishtar-gate-area": (["Ishtar Gate (Babylon)", "Ishtar Gate replica in Babylon", "Babylon"], "Ishtar Gate Babylon Iraq", ["ishtar", "babylon"]),
 "site:dar-al-imara": (["Dar al-Imara (Kufa)", "Great Mosque of Kufa"], "Dar al-Imara Kufa palace ruins", ["imara", "emara", "kufa"]),
 "site:lake-razzaza": (["Lake Razzaza", "Razzaza Lake", "Bahr al-Milh"], "Razzaza lake Karbala", ["razzaza", "razaza"]),
 "site:ahmad-awa": (["Ahmad Awa", "Ahmed Awa", "Ahmad Awa waterfall"], "Ahmad Awa waterfall Halabja", ["awa"]),
 "site:nimrud": (["Nimrud", "Kalhu"], "Nimrud ziggurat palace ruins", ["nimrud", "kalhu", "calah"]),
 "site:nineveh-ancient-city": (["Adad Gate", "Mashki Gate", "Nergal Gate", "Nineveh"], "Nineveh gate Mosul ruins", ["nineveh", "gate", "ninawa"]),
 "site:shatt-al-arab": (["Shatt al-Arab"], "Shatt al-Arab Basra river boats", ["shatt", "arvand"]),
 "gov:anbar": (["Ramadi", "Al Anbar Governorate", "Hit, Iraq", "Lake Habbaniyah"], "Anbar Euphrates Hit Haditha", ["ramadi", "anbar", "hit", "habbaniyah", "haditha", "anah"]),
 "gov:salah-al-din": (["Tikrit", "Salah ad-Din Governorate", "Samarra"], "Tikrit Tigris Samarra", ["tikrit", "salah", "samarra"]),
}
REJECT = re.compile(r"\bmap\b|plan\b|drawing|diagram|engraving|illustration|lithograph|painting|coin|stamp|banknote|louvre|berlin|pergamon|british museum|metropolitan|penn museum|replica in|reconstruction|model\b|\bsvg\b|logo|flag|seal of|coat of arms|chart|graph", re.I)
FREE = re.compile(r"^(cc[- ]?by|cc0|public domain|pd\b|pd-)", re.I)
LAST = [0.0]
def get(params):
    for attempt in range(10):
        wait = 1.5 - (time.time() - LAST[0])
        if wait > 0: time.sleep(wait)
        LAST[0] = time.time()
        try:
            req = urllib.request.Request(API + "?" + urllib.parse.urlencode({**params, "format": "json", "maxlag": 5}), headers={"User-Agent": UA, "Api-User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r: return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code in (429, 503): print("  ", e.code, "backoff", min(60 * (attempt + 1), 300), flush=True); time.sleep(min(60 * (attempt + 1), 300)); continue
            raise
    raise RuntimeError("rate limited")
def fetch_bytes(url):
    for attempt in range(10):
        wait = 1.5 - (time.time() - LAST[0])
        if wait > 0: time.sleep(wait)
        LAST[0] = time.time()
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=120) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503): print("   download", e.code, "backoff", min(60 * (attempt + 1), 300), flush=True); time.sleep(min(60 * (attempt + 1), 300)); continue
            raise
    raise RuntimeError("download rate limited")
strip = lambda h: re.sub(r"<[^>]+>", "", h or "").strip()

PROPS = {"prop": "imageinfo|categories", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1600, "cllimit": "max", "clshow": "!hidden"}
def pages_in_category(cat):
    d = get({"action": "query", "generator": "categorymembers", "gcmtitle": "Category:" + cat, "gcmtype": "file", "gcmlimit": 50, **PROPS})
    return list(d.get("query", {}).get("pages", {}).values())
def pages_from_search(q):
    d = get({"action": "query", "generator": "search", "gsrsearch": q + " filetype:bitmap", "gsrnamespace": 6, "gsrlimit": 40, **PROPS})
    return list(d.get("query", {}).get("pages", {}).values())

def evaluate(pages, keys):
    cands = []
    for p in pages:
        if "imageinfo" not in p: continue
        ii = p["imageinfo"][0]; md = ii.get("extmetadata", {}); v = lambda k: strip(md.get(k, {}).get("value", ""))
        if ii.get("mime") != "image/jpeg" or ii.get("width", 0) < 1000 or ii.get("size", 0) > 15_000_000: continue
        w, h = ii["width"], ii["height"]; ratio = w / h
        if ratio < 0.95: continue
        lic = v("LicenseShortName"); art = v("Artist"); desc = v("ImageDescription")
        cats = " ".join(c["title"] for c in p.get("categories", []))
        hay = f'{p["title"]} {desc} {cats}'.lower()
        if not FREE.search(lic) or not art: continue
        if REJECT.search(f'{p["title"]} {desc} {cats}'): continue
        if not any(k in hay for k in keys): continue
        score = 0
        if "featured pictures" in hay: score += 12
        if "quality images" in hay: score += 8
        if "valued images" in hay: score += 6
        if 1.3 <= ratio <= 1.9: score += 3
        if w >= 2400: score += 1
        dt = v("DateTimeOriginal"); m = re.search(r"(19|20)\d\d", dt)
        if m and int(m.group(0)) >= 2005: score += 2
        cands.append({"title": p["title"], "thumb": ii.get("thumburl"), "original": ii.get("url"), "cats": cats[:400], "page": ii.get("descriptionurl"), "license": lic, "artist": art[:160], "desc": desc[:300], "date": dt[:40], "w": w, "h": h, "score": score})
    return sorted(cands, key=lambda c: -c["score"])

res = json.load(open(OUT)) if os.path.exists(OUT) else {}
for key, (cats, q, keys) in P.items():
    if key in res and res[key].get("status") in ("ok", "none"): continue
    try:
        cands = []
        for c in cats:
            cands = evaluate(pages_in_category(c), keys)
            if cands: break
        if not cands:
            cands = evaluate(pages_from_search(q), keys)
        top = cands[:3]
        res[key] = {"status": "ok" if top else "none", "cands": top}
    except Exception as e:
        res[key] = {"status": "error", "error": str(e)[:200]}
    print(key, res[key]["status"], (res[key].get("cands") or [{}])[0].get("title", ""), flush=True)
    json.dump(res, open(OUT, "w"), ensure_ascii=False, indent=1)
print("DONE", flush=True)
