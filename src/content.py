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
import os, re, html
from urllib.parse import quote, unquote
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
    "social": {k: (v or "").strip() for k, v in (_settings.get("social") or {}).items()},
}
SERVICE_OPTIONS = [fmt(x) for x in _settings["form_services"]]
BUDGETS = [fmt(x) for x in _settings["form_budgets"]]

# Mega-menu: short anchor links to the sections of each page (href, label)
MENU = {
    "index.html": [("index.html#services", "Services"), ("index.html#why", "Why OXE"), ("index.html#work", "Our Works"),
                   ("index.html#clients", "Clients"), ("index.html#get-in-touch", "Get in Touch")],
    "services.html": [("services.html#web", "Web Design"), ("services.html#social", "Social Media"), ("services.html#video", "Video"),
                      ("services.html#photo", "Photography"), ("services.html#strategy", "Strategy"), ("services.html#industries", "Industries")],
    "portfolio.html": [("portfolio.html", "All Work"), ("portfolio.html?filter=web", "Web Design"), ("portfolio.html?filter=social", "Social Media"),
                       ("portfolio.html?filter=video", "Video"), ("portfolio.html?filter=photo", "Photography")],
    "about.html": [("about.html#mission", "Mission &amp; Vision"), ("about.html#story", "Our Story"), ("about.html#why-oxe", "Why OXE"),
                   ("about.html#clients", "Clients")],
    "blog.html": [("blog.html?cat=web", "Websites &amp; SEO"), ("blog.html?cat=social", "Social Media"), ("blog.html?cat=video", "Video"),
                  ("blog.html?cat=photo", "Photography"), ("blog.html?cat=strategy", "Strategy")],
    "contact.html": [("contact.html#enquiry", "Enquiry Form"), ("contact.html#next", "What Happens Next"), ("contact.html#map", "Find Us")],
}

# Mega-menu panel for each page: (eyebrow, one-line intro, visual)
# visual: ("img", image) | ("art", 3D art key) | ("mosaic", [images]) | ("contact", None)
MENU_META = {
    "index.html": ("Start here", "Websites, content &amp; strategy from Bangkok.", ("img", "about-team")),
    "services.html": ("What we do", "Five services. One team.", ("art", "web")),
    "portfolio.html": ("Selected work", "Real projects for real brands.", ("mosaic", ["xiaomi-campaign", "haji-strawberry", "shoot-1"])),
    "about.html": ("Who we are", "A multicultural team since 2020.", ("img", "bts-video-2")),
    "blog.html": ("Insights", "Practical marketing guides from Bangkok.", ("mosaic", ["haji-visit", "bts-video-2", "cake-strawberry-wide"])),
    "contact.html": ("Say hello", "Let's talk about your project.", ("contact", None)),
}

NAV = [("index.html", "Home"), ("services.html", "Services"), ("portfolio.html", "Portfolio"),
       ("about.html", "About Us"), ("blog.html", "Blog"), ("contact.html", "Contact")]

_home = load("home.yml")
HOME = {k: fmt(v) for k, v in _home.items() if isinstance(v, str)}
HERO = {"text": HOME["hero_text"]}
WHY = {"title": HOME["why_title"], "text": HOME["why_text"],
       "principles": [(x["icon"], fmt(x["title"]), fmt(x["text"])) for x in _home["principles"]]}
# Home "Our Works": (portfolio filter key, title, image)
WORK_CATEGORIES = [(x["filter"], fmt(x["title"]), asset(x["image"])) for x in _home["works"]]

PAGES = {k: {f: fmt(v) for f, v in d.items()} for k, d in load("pages.yml").items()}

_about = load("about.yml")
ABOUT = {
    "title": fmt(_about["title"]),
    "positioning": fmt(_about["positioning"]), "intro": fmt(_about["intro"]),
    "story": [fmt(x) for x in _about["story"]],
    "mission": fmt(_about["mission"]), "vision": fmt(_about["vision"]),
    "facts": [(fmt(x["value"]), fmt(x["label"])) for x in _about["facts"]],
    "choose": [(x["icon"], fmt(x["title"]), fmt(x["text"])) for x in _about["choose"]],
}

# ------------------------------------------------------------------ SERVICES
_svc = load("services.yml")
SERVICES = []
for s in _svc["services"]:
    d = dict(key=s["key"], num=s["num"], art=s["art"], img=asset(s["image"]), title=fmt(s["title"]),
             short=fmt(s["short"]), intro=fmt(s["intro"]),
             what=[fmt(x) for x in s.get("what") or []], deliverables=[fmt(x) for x in s.get("deliverables") or []])
    if s.get("videos"):
        d["videos"] = [(asset(v["video"]), fmt(v.get("client") or "")) for v in s["videos"]]
    else:
        d["slides"] = [("device:" if x.get("mockup") else "") + asset(x["image"]) for x in s.get("slides") or []]
    SERVICES.append(d)
INDUSTRIES = [(fmt(x["name"]), asset(x["image"])) for x in _svc["industries"]]

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
