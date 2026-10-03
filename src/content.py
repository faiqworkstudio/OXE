"""Site content loader.

All editable content lives in /content (YAML files and Markdown blog posts) and is
edited through the admin panel at /admin (Decap CMS), or by hand. This module reads
those files and exposes them to build.py. Navigation structure stays here.

Text conventions in /content:
  *words*  in a heading  ->  the italic serif highlight (<span class="hl">)
  plain text everywhere: no HTML needed, & and quotes are escaped automatically.
Content rule: only facts supplied by OXE. Leave a case-study field empty when it
isn't known; the page then shows a neutral placeholder.
"""
import os, re, sys, html
from urllib.parse import quote, unquote

# PyYAML and Markdown are bundled in src/vendor, so the site builds even where
# pip is unavailable. An installed copy (pip install -r requirements.txt) is used first.
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "vendor"))
import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "content")


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def fmt(t):
    """Editor text -> safe HTML: escape &, <, >, " and turn *words* into the serif highlight."""
    if t is None:
        return None
    t = html.escape(html.unescape(str(t).strip()), quote=True).replace("&#x27;", "'")
    return re.sub(r"\*(.+?)\*", r'<span class="hl">\1</span>', t)


def fmt_or_none(t):
    t = fmt(t)
    return t or None


def asset(path):
    """'/assets/img/work/photo.jpg' (from the admin panel) or 'photo' -> 'photo'."""
    if not path:
        return None
    return os.path.splitext(os.path.basename(unquote(str(path)).strip()))[0]


_settings = load("settings.yml")
_digits = re.sub(r"\D", "", str(_settings["whatsapp_number"]))
SITE = {
    "name": "OXE Marketing",
    "url": "https://www.oxemarketingth.com",
    "email": _settings["email"].strip(),
    "phone_display": fmt(_settings["phone"]),
    "phone_tel": "+" + re.sub(r"\D", "", str(_settings["phone"])),
    "whatsapp": f"https://wa.me/{_digits}?text={quote(_settings.get('whatsapp_message') or '', safe='')}",
    "city": fmt(_settings["city"]),
    "founded": str(_settings["founded"]),
    # Web3Forms access key: contact-form submissions are emailed to the address it was created for
    "form_key": (_settings.get("form_key") or "").strip(),
    "social": {k: (v or "").strip() for k, v in (_settings.get("social") or {}).items()},
}
SERVICE_OPTIONS = [fmt(x) for x in _settings["form_services"]]
BUDGETS = [fmt(x) for x in _settings["form_budgets"]]

IMG_KEY = re.compile(r"(image|photo|logo|video|poster)s?$")


def deep(v, key=""):
    """Prepare a content file for the templates: text -> safe HTML (with *highlight*),
    image/video fields -> file names, links escaped. Lists and groups are handled recursively."""
    if isinstance(v, dict):
        return {k: deep(x, k) for k, x in v.items()}
    if isinstance(v, list):
        return [deep(x, key) for x in v]
    if isinstance(v, str):
        if IMG_KEY.search(key):
            return asset(v)
        if key in ("link", "page", "featured_project", "panel", "icon", "filter", "key", "num", "art"):
            return html.escape(v.strip(), quote=True)
        return fmt(v)
    return v


# One content file per page (content/<name>.yml), edited in the admin under "Pages"
def flatten(d):
    """Sections (sec_hero, sec_seo, ...) only group fields in the admin; templates see one flat set of fields."""
    out = {}
    for k, v in d.items():
        if k.startswith("sec_") and isinstance(v, dict):
            out.update(v)
        else:
            out[k] = v
    return out


P = {n: flatten(deep(load(n + ".yml"))) for n in ("site", "home", "services", "portfolio", "about", "blog-page", "contact")}
SITE_TEXT = P["site"]

# ------------------------------------------------------------------ MENU (content/site.yml)
NAV = [(m["page"], m["label"]) for m in SITE_TEXT["menu"]]
MENU = {m["page"]: [(l["link"], l["label"]) for l in m.get("links") or []] for m in SITE_TEXT["menu"]}
# Mega-menu panel for each page: (eyebrow, one-line intro, visual)
# visual: ("img", image) | ("art", 3D art key) | ("mosaic", [images]) | ("contact", None)


def _visual(m):
    kind, imgs = m.get("panel") or "img", [x for x in m.get("images") or [] if x]
    if kind == "contact":
        return ("contact", None)
    if kind == "art" or not imgs:
        return ("art", "web")
    if kind == "mosaic" and len(imgs) > 1:
        return ("mosaic", imgs[:3])
    return ("img", imgs[0])


MENU_META = {m["page"]: (m.get("eyebrow") or "", m.get("intro") or "", _visual(m)) for m in SITE_TEXT["menu"]}

# ------------------------------------------------------------------ HOME
HOME = P["home"]
HERO = {"text": HOME["hero_text"]}
WHY = {"title": HOME["why_title"], "text": HOME["why_text"],
       "principles": [(x["icon"], x["title"], x["text"]) for x in HOME["principles"]]}
# Home "Our Works": (portfolio filter key, title, image, optional video)
WORK_CATEGORIES = [(x["filter"], x["title"], x["image"], x.get("video")) for x in HOME["works"]]

# ------------------------------------------------------------------ ABOUT
_about = P["about"]
ABOUT = dict(_about,
             facts=[(x["value"], x["label"]) for x in _about["facts"]],
             choose=[(x["icon"], x["title"], x["text"]) for x in _about["choose"]])

# ------------------------------------------------------------------ SERVICES
SERVICES_PAGE = P["services"]
SERVICES = []
for s in SERVICES_PAGE["services"]:
    d = dict(key=s["key"], num=s["num"], art=s["art"], img=s["image"], title=s["title"],
             short_name=s.get("short_name") or re.sub(r"<[^>]+>", "", s["title"]),
             short=s["short"], intro=s["intro"], what=s.get("what") or [], deliverables=s.get("deliverables") or [])
    if s.get("videos"):
        d["videos"] = [(v["video"], v.get("client") or "") for v in s["videos"] if v.get("video")]
    else:
        d["slides"] = [("device:" if x.get("mockup") else "") + x["image"] for x in s.get("slides") or [] if x.get("image")]
    SERVICES.append(d)
INDUSTRIES = [(x["name"], x["image"]) for x in SERVICES_PAGE["industries"]]

# ------------------------------------------------------------------ PORTFOLIO
# cat: space-separated filter keys (web social video photo)
FILTERS = [("all", "All"), ("web", "Web Design"), ("social", "Social Media"), ("video", "Video"), ("photo", "Photography")]

POSTERS = {}   # video name -> poster image name


def _project(d):
    display = d.get("display") or "photo"
    cover = asset(d.get("cover"))
    p = dict(id=d["id"], client=fmt(d["client"]), title=fmt(d["title"]), cat=" ".join(d.get("filters") or []),
             category=fmt(d["category"]), summary=fmt(d.get("summary") or ""),
             challenge=fmt_or_none(d.get("challenge")), solution=fmt_or_none(d.get("solution")), outcome=fmt_or_none(d.get("outcome")),
             tags=[fmt(x) for x in d.get("tags") or []], services=[fmt(x) for x in d.get("services") or []],
             gallery=[asset(g) for g in d.get("gallery") or [] if g], video=asset(d.get("video")), cover=cover)
    if display == "logo" and cover and "/clients/" in str(d.get("cover")):
        p["cover"] = "logo:" + cover
    elif display == "logo":
        p["logo"] = True
    elif display == "website":
        p["device"] = True
        p["mobile"] = asset(d.get("mobile")) or cover
    if p["video"]:
        POSTERS[p["video"]] = asset(d.get("video_poster")) or p["video"] + "-poster"
    return p


_projects = []
for f in os.listdir(os.path.join(DATA, "projects")):
    if f.endswith((".yml", ".yaml")):
        d = load(os.path.join("projects", f))
        d.setdefault("id", os.path.splitext(f)[0])
        _projects.append(d)
_projects.sort(key=lambda d: (d.get("order") or 0, d["id"]))
PROJECTS = [_project(d) for d in _projects]
for s in SERVICES:
    for v, _ in s.get("videos", []):
        POSTERS.setdefault(v, v + "-poster")

# ------------------------------------------------------------------ CLIENTS
# (logo file name in assets/img/clients/, brand name or None)
CLIENTS = [(asset(x["logo"]), fmt(x.get("name")) or None) for x in load("clients.yml")["clients"]]
