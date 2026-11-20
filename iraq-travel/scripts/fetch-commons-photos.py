#!/usr/bin/env python3
"""
Finds free-licensed Wikimedia Commons photos for every IRAQ TRAVEL site and governorate.
Runs anywhere with Python 3 (no extra packages). Usage:
    python3 fetch-commons-photos.py            -> writes commons-results.json
Send commons-results.json back for review; nothing is published automatically.
Candidates must have a free licence, a named author, be landscape JPEGs, sit in the
place's Commons category (or match its name), and not be maps/drawings/models/museum objects abroad.
"""
import json, os, re, sys, time, urllib.parse, urllib.request
UA = "IraqTravelSiteBuilder/0.1 (https://github.com/alialburhan2-lab/TikTap)"
API = "https://commons.wikimedia.org/w/api.php"
OUT = sys.argv[1] if len(sys.argv) > 1 else "commons-results.json"
# key -> (list of Commons categories to try, fallback search text, keywords one of which must appear in file title/description/categories)
P = {
 "site:iraq-museum": (["National Museum of Iraq"], "National Museum of Iraq Baghdad building", ["museum"]),
 "site:al-mutanabbi-street": (["Al-Mutanabbi Street"], "Mutanabbi Street Baghdad", ["mutanabbi", "mutanabi"]),
 "site:abbasid-palace": (["Abbasid Palace (Baghdad)", "Abbasid Palace"], "Abbasid Palace Baghdad", ["abbasid"]),
 "site:mustansiriya-madrasa": (["Al-Mustansiriya Madrasa", "Mustansiriya Madrasa"], "Mustansiriya Madrasa Baghdad", ["mustansir"]),
 "site:taq-kasra": (["Taq Kasra"], "Taq Kasra Ctesiphon arch", ["kasra", "ctesiphon", "kisra"]),
 "site:aqar-quf": (["Dur-Kurigalzu", "Aqar Quf"], "Aqar Quf ziggurat", ["kurigalzu", "aqar", "aqarquf", "agar quf"]),
 "site:ziggurat-of-ur": (["Ziggurat of Ur"], "Ziggurat of Ur", ["ziggurat"]),
 "site:ur": (["Ur (archaeological site)", "Ur"], "Ur archaeological site Iraq ruins", ["ur"]),
 "site:royal-cemetery-of-ur": (["Royal Cemetery at Ur"], "Royal Cemetery Ur tombs", ["royal", "cemetery", "tomb"]),
 "site:eridu": (["Eridu"], "Eridu tell Iraq", ["eridu"]),
 "site:lagash": (["Lagash"], "Lagash al-Hiba", ["lagash", "hiba"]),
 "site:girsu": (["Girsu", "Tello"], "Girsu Tello Iraq", ["girsu", "tello", "telloh"]),
 "site:central-marshes": (["Mesopotamian Marshes", "Central Marshes"], "Mesopotamian marshes Iraq", ["marsh", "ahwar", "hawr"]),
 "site:al-chibayish": (["Chibayish", "Al-Chibayish"], "Chibayish marsh", ["chibayish", "chibaish"]),
 "site:uruk": (["Uruk"], "Uruk Warka ruins", ["uruk", "warka"]),
 "site:nippur": (["Nippur"], "Nippur ruins Iraq", ["nippur", "nuffar"]),
 "site:wasit-ancient-city": (["Wasit (ancient city)", "Wasit"], "Wasit ancient city minaret", ["wasit"]),
 "site:babylon-ancient-city": (["Babylon"], "Babylon ruins Iraq", ["babylon"]),
 "site:ishtar-gate-area": (["Ishtar Gate (Babylon)"], "Ishtar Gate Babylon Iraq replica foundations", ["babylon"]),
 "site:lion-of-babylon": (["Lion of Babylon (statue)", "Lion of Babylon"], "Lion of Babylon statue", ["lion"]),
 "site:processional-way": (["Processional Way (Babylon)", "Processional Way"], "Processional Way Babylon Iraq", ["processional", "babylon"]),
 "site:borsippa": (["Borsippa", "Birs Nimrud"], "Borsippa ziggurat Birs Nimrud", ["borsippa", "birs"]),
 "site:imam-ali-shrine": (["Imam Ali Shrine"], "Imam Ali Shrine Najaf", ["ali", "najaf"]),
 "site:wadi-al-salam": (["Wadi-us-Salaam", "Wadi al-Salam"], "Wadi al-Salam cemetery Najaf", ["wadi", "salam", "cemetery"]),
 "site:great-mosque-of-kufa": (["Great Mosque of Kufa"], "Great Mosque of Kufa", ["kufa"]),
 "site:dar-al-imara": (["Dar al-Imara (Kufa)"], "Dar al-Imara Kufa", ["imara", "emara"]),
 "site:imam-hussein-shrine": (["Imam Husayn Shrine"], "Imam Husayn Shrine Karbala", ["husayn", "hussein", "husain", "hussain", "karbala"]),
 "site:al-abbas-shrine": (["Al-Abbas Shrine"], "Al-Abbas shrine Karbala", ["abbas"]),
 "site:al-ukhaidir": (["Al-Ukhaidir Fortress", "Ukhaidir"], "Ukhaidir fortress", ["ukhaidir", "ukhaydir", "okhaidir"]),
 "site:lake-razzaza": (["Lake Razzaza"], "Razzaza lake", ["razzaza"]),
 "site:erbil-citadel": (["Erbil Citadel"], "Erbil Citadel", ["citadel", "erbil", "arbil", "hawler"]),
 "site:sami-abdulrahman-park": (["Sami Abdul Rahman Park"], "Sami Abdulrahman Park Erbil", ["sami", "park"]),
 "site:amedi": (["Amadiya", "Amedi"], "Amadiya Amedi town", ["amadiya", "amedi", "amadiyah", "amêdî", "amedî"]),
 "site:lalish": (["Lalish"], "Lalish temple", ["lalish"]),
 "site:sarsang": (["Sarsing", "Sarsang"], "Sarsing Duhok", ["sarsing", "sarsang"]),
 "site:sulaymaniyah-museum": (["Sulaymaniyah Museum"], "Sulaymaniyah Museum", ["museum"]),
 "site:lake-dukan": (["Lake Dukan", "Dukan Lake"], "Dukan lake", ["dukan", "dokan"]),
 "site:ahmad-awa": (["Ahmad Awa", "Ahmed Awa"], "Ahmad Awa waterfall", ["awa"]),
 "site:hatra": (["Hatra"], "Hatra temple", ["hatra"]),
 "site:nimrud": (["Nimrud"], "Nimrud archaeological site", ["nimrud", "kalhu"]),
 "site:nineveh-ancient-city": (["Adad Gate", "Nineveh"], "Nineveh gate Mosul", ["nineveh", "gate"]),
 "site:old-mosul": (["Old City of Mosul", "Al-Nuri Mosque"], "Old city Mosul", ["mosul", "nuri"]),
 "site:great-mosque-of-samarra": (["Great Mosque of Samarra"], "Great Mosque of Samarra", ["samarra"]),
 "site:malwiya-minaret": (["Malwiya Minaret", "Great Mosque of Samarra"], "Malwiya minaret Samarra", ["malwiya", "minaret", "spiral"]),
 "site:ashur": (["Assur", "Ashur (city)"], "Assur Qalat Sherqat", ["assur", "ashur", "sherqat", "shirqat", "sharqat"]),
 "site:kirkuk-citadel": (["Kirkuk Citadel"], "Kirkuk citadel", ["kirkuk"]),
 "site:shatt-al-arab": (["Shatt al-Arab"], "Shatt al-Arab Basra river", ["shatt", "arvand"]),
 "site:basra-corniche": (["Basra Corniche"], "Basra corniche", ["corniche"]),
 "site:al-faw": (["Al-Faw Peninsula", "Al-Faw"], "Faw Basra", ["faw", "fao"]),
 "gov:baghdad": (["Baghdad"], "Baghdad skyline Tigris", ["baghdad"]), "gov:basra": (["Basra"], "Basra city", ["basra", "basrah"]),
 "gov:dhi-qar": (["Nasiriyah"], "Nasiriyah city", ["nasiriyah", "nasiriya", "dhi qar"]), "gov:maysan": (["Amarah"], "Amarah city Maysan", ["amarah", "amara", "maysan"]),
 "gov:najaf": (["Najaf"], "Najaf city", ["najaf"]), "gov:karbala": (["Karbala"], "Karbala city", ["karbala"]),
 "gov:babylon": (["Hillah"], "Hillah city", ["hillah", "hilla"]), "gov:wasit": (["Kut"], "Kut city Tigris", ["kut"]),
 "gov:qadisiyah": (["Diwaniyah"], "Diwaniyah city", ["diwaniyah", "diwaniya"]), "gov:muthanna": (["Samawah"], "Samawah city", ["samawah", "samawa"]),
 "gov:anbar": (["Ramadi"], "Ramadi city", ["ramadi"]), "gov:diyala": (["Baqubah"], "Baqubah city", ["baqubah", "baquba"]),
 "gov:salah-al-din": (["Tikrit"], "Tikrit city", ["tikrit"]), "gov:nineveh": (["Mosul"], "Mosul city", ["mosul"]),
 "gov:kirkuk": (["Kirkuk"], "Kirkuk city", ["kirkuk"]), "gov:erbil": (["Erbil"], "Erbil city", ["erbil", "arbil", "hawler"]),
 "gov:sulaymaniyah": (["Sulaymaniyah"], "Sulaymaniyah city", ["sulaymaniyah", "sulaimani", "slemani", "sulaymani", "sulaimaniya"]),
 "gov:duhok": (["Duhok"], "Duhok city", ["duhok", "dohuk", "dahuk"]),
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
        if ii.get("mime") != "image/jpeg" or ii.get("width", 0) < 1200 or ii.get("size", 0) > 15_000_000: continue
        w, h = ii["width"], ii["height"]; ratio = w / h
        if ratio < 1.15: continue  # landscape only for hero/gallery
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
