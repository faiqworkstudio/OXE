"""Static site generator for oxemarketingth.com.

    python3 src/build.py

Reads copy/data from content.py, icons from icons.py and the 3D illustration
set from art.py, and writes the HTML pages to the repository root (plus one
case-study page per project in /work). Each section function below maps to
one Elementor section when the site is rebuilt in WordPress.
"""
import os, re, json, struct
from urllib.parse import quote
try:
    from PIL import Image       # optional: converts uploads to WebP and resizes them
except ImportError:
    Image = None
from icons import I
from art import ART, DEFS
import content as C, hashlib
from blog_posts import POSTS, BLOG_CATS, AUTHOR
from datetime import date as _date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "assets/img/work")
S = C.SITE
CUR = ' aria-current="page"'
ARR = I["arrow"]
PBY = {p["id"]: p for p in C.PROJECTS}
T = C.SITE_TEXT                       # site-wide text (content/site.yml)
PG = C.P                               # per-page text (content/<page>.yml)


def has_media(p):
    return bool(p.get("video") or (p["cover"] and not p["cover"].startswith("logo:") and not p.get("logo")))


# Portfolio order: projects with real photos/video first; the rest sit behind "View More"
PORT = sorted(C.PROJECTS, key=lambda p: not has_media(p))
VISIBLE = 9


def ver(path):
    """Content hash for cache-busting ?v= query strings."""
    return hashlib.md5(open(os.path.join(ROOT, path), "rb").read()).hexdigest()[:8]


# ------------------------------------------------------------------ helpers
IMG_EXT = (".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP")
CLIENT_DIR = os.path.join(ROOT, "assets/img/clients")


def source(folder, name):
    """Uploaded (non-WebP) file for an image name, whatever its extension (None if missing)."""
    for ext in IMG_EXT:
        f = os.path.join(folder, name + ext)
        if os.path.exists(f) and not f.lower().endswith(".webp"):
            return f
    return None


def webp(name, folder=IMG_DIR, max_w=1600, alpha=False):
    """Best file for an image: its .webp (made from the upload when Pillow is available),
    otherwise the uploaded file itself. None (with a warning) if the image is missing."""
    dst = os.path.join(folder, name + ".webp")
    src = source(folder, name)
    if src and Image and (not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src)):
        im = Image.open(src)
        im = im.convert("RGBA") if alpha and im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
        if im.width > max_w:
            im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
        im.save(dst, "WEBP", quality=90 if alpha else 80, method=6)
    if os.path.exists(dst):
        return dst
    if src:
        return src
    print(f"WARNING: image '{name}' not found in {os.path.relpath(folder, ROOT)}")
    return None


def _header_size(path):
    """Image (width, height) from the file header, for builds without Pillow (PNG, JPEG, WebP)."""
    with open(path, "rb") as fh:
        d = fh.read()
    if d[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", d[16:24])
    if d[:4] == b"RIFF" and d[8:12] == b"WEBP":
        kind = d[12:16]
        if kind == b"VP8 ":
            w, h = struct.unpack("<HH", d[26:30])
            return w & 0x3FFF, h & 0x3FFF
        if kind == b"VP8L":
            bits = int.from_bytes(d[21:25], "little")
            return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
        if kind == b"VP8X":
            return int.from_bytes(d[24:27], "little") + 1, int.from_bytes(d[27:30], "little") + 1
    if d[:2] == b"\xff\xd8":
        i = 2
        while i < len(d) - 9:
            if d[i] != 0xFF:
                i += 1
                continue
            marker = d[i + 1]
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                h, w = struct.unpack(">HH", d[i + 5:i + 9])
                return w, h
            if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
                i += 2
                continue
            i += 2 + struct.unpack(">H", d[i + 2:i + 4])[0]
    return 1200, 800


def size(path):
    if Image:
        with Image.open(path) as im:
            return im.size
    return _header_size(path)


def url(path):
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def wurl(name):
    """URL of a work image (or video poster) by name."""
    p = webp(name) if name else None
    return url(p) if p else ""


def img(name, alt="", cls="", lazy=True, sizes=""):
    path = webp(name) if name else None
    if not path:
        return ""
    w, h = size(path)
    return (f'<img src="{url(path)}" alt="{alt}" width="{w}" height="{h}"'
            f'{f" class={chr(34)}{cls}{chr(34)}" if cls else ""}{" loading=" + chr(34) + "lazy" + chr(34) if lazy else ""} decoding="async">')


def is_url(v):
    return isinstance(v, str) and v.startswith(("https://", "http://"))


def vurl(v):
    """Video source: an uploaded file in assets/video, or a full URL (large videos in Vercel Blob)."""
    return v if is_url(v) else f"assets/video/{v}.mp4"


def poster(v):
    """Cover image shown before a video plays: set next to the video in the admin, or <video>-poster."""
    return C.POSTERS.get(v) or (None if is_url(v) else v + "-poster")


def brand_img(path):
    """Brand image set in Admin → Contact details & settings: (url, width, height)."""
    f = os.path.join(ROOT, path)
    w, h = size(f) if os.path.exists(f) else (240, 100)
    return path, w, h


def logo(f):
    """Client logo (any format; transparent PNGs stay transparent) -> (url, width, height)."""
    p = webp(f, CLIENT_DIR, max_w=600, alpha=True)
    if not p:
        return "", 200, 200
    w, h = size(p)
    return url(p), w, h


def plain(t):
    return re.sub(r"<[^>]+>", "", t).replace("&amp;", "&")


def eyebrow(t):
    return f'<span class="eyebrow">{t}</span>'


def sec_head(eb, h, p="", tag="h2", cls=""):
    return f'''<div class="sec-head reveal {cls}">
        {eyebrow(eb)}
        <{tag}>{h}</{tag}>
        {f"<p>{p}</p>" if p else ""}
      </div>'''


def btn(label, href, kind="primary", arrow=True, ext=False):
    x = ' target="_blank" rel="noopener"' if ext else ""
    arr = f'<span class="btn__arrow" aria-hidden="true">{ARR}</span>' if arrow else ""
    return f'<a class="btn btn--{kind}" href="{href}"{x}>{label}{arr}</a>'


def devices(screen, phone=None, alt=""):
    """Laptop + phone device mockup (CSS 3D)."""
    phone = phone or screen
    return f'''<div class="devices" role="img" aria-label="{alt}">
          <div class="dev-laptop"><div class="dev-laptop__lid"><div class="dev-laptop__screen">{img(screen)}</div></div><div class="dev-laptop__base"></div></div>
          <div class="dev-phone"><div class="dev-phone__screen">{img(phone)}</div></div>
        </div>'''


# ------------------------------------------------------------------ layout
def head(title, desc, page, og=None, schema=None, noindex=False, og_type="website"):
    og = og or S["share_image"]
    nav = mega_nav(page)
    canon = S["url"] + "/" + ("" if page == "index.html" else page.replace(".html", ""))
    ld = f'\n  <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>' if schema else ""
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <script>document.documentElement.className="js"</script>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">{chr(10) + '  <meta name="robots" content="noindex">' if noindex else ""}
  <meta name="theme-color" content="#ffffff">
  <link rel="canonical" href="{canon}">
  <meta property="og:type" content="{og_type}">
  <meta property="og:site_name" content="OXE Marketing">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{canon}">
  <meta property="og:image" content="{S['url']}/{og}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="{S["favicon"]}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css?v={ver("assets/css/style.css")}">{ld}
  <!-- Google Analytics (GA4): replace G-XXXXXXXXXX with the OXE measurement ID and uncomment.
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>
  -->
</head>
<body>
{DEFS}
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <span class="scroll-progress" aria-hidden="true"></span>
  <div class="container site-header__inner">
    {brand()}
    <nav class="nav" id="site-nav" aria-label="Main">
      <div class="nav__links">
{nav}
      </div>
      <a href="contact.html" class="btn btn--primary btn--sm nav__cta">{T["header_button"]}</a>
      <div class="nav__contact">
        <a href="{S['whatsapp']}" target="_blank" rel="noopener" aria-label="WhatsApp">{I["whatsapp"]}</a>
        <a href="mailto:{S['email']}" aria-label="Email">{I["mail2"]}</a>
        <a href="tel:{S['phone_tel']}" aria-label="Call">{I["phone2"]}</a>
        <span>{S['city']}</span>
      </div>
    </nav>
    <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav"><span></span></button>
  </div>
</header>
<main id="main">
'''


def mega_visual(h, t):
    kind, v = C.MENU_META[h][2]
    if kind == "img":
        return f'<a class="mega__visual mega__visual--img" href="{h}" tabindex="-1" aria-hidden="true">{img(v, "")}<span>{t} {ARR}</span></a>'
    if kind == "mosaic":
        return f'<a class="mega__visual mega__visual--mosaic" href="{h}" tabindex="-1" aria-hidden="true">' + "".join(img(x, "") for x in v) + f'<span>{t} {ARR}</span></a>'
    if kind == "art":
        return f'<div class="mega__visual mega__visual--art" aria-hidden="true"><span class="float-a">{ART[v]}</span><span class="float-b">{ART["video"]}</span><span class="float-c">{ART["social"]}</span></div>'
    return f'''<div class="mega__visual mega__visual--contact">
                <a href="mailto:{S["email"]}"><span class="ico">{I["mail2"]}</span>{S["email"]}</a>
                <a href="tel:{S["phone_tel"]}"><span class="ico">{I["phone2"]}</span>{S["phone_display"]}</a>
                <a href="{S["whatsapp"]}" target="_blank" rel="noopener"><span class="ico">{I["whatsapp"]}</span>WhatsApp us</a>
              </div>'''


CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'


def mega_nav(page):
    """Top navigation. Desktop: each item opens a full-width panel (hover intent / button).
    Phones & tablets: each item is an accordion that drops down its section links."""
    out = ""
    for n, (h, t) in enumerate(C.NAV, 1):
        cur = CUR if h == page or (page.startswith("work/") and h == "portfolio.html") or (page.startswith("blog/") and h == "blog.html") else ""
        eb, intro, _ = C.MENU_META[h]
        pid = "menu-" + h.split(".")[0]
        links = "".join(f'<li><a href="{href}"><span class="mega__num">{i:02d}</span><span class="mega__label">{label}</span>{ARR}</a></li>'
                        for i, (href, label) in enumerate(C.MENU[h], 1))
        out += f'''
        <div class="nav__item" data-menu>
          <div class="nav__row">
            <a class="nav__link" href="{h}"{cur}><span class="nav__num">{n:02d}</span>{t}</a>
            <button class="nav__more" type="button" aria-expanded="false" aria-controls="{pid}" aria-label="Show {t} sections">{CHEV}</button>
          </div>
          <div class="mega" id="{pid}">
            <div class="mega__clip">
              <div class="container mega__inner">
                <div class="mega__intro">
                  <span class="mega__eyebrow">{eb}</span>
                  <a class="mega__title" href="{h}">{t}</a>
                  <p>{intro}</p>
                </div>
                <ul class="mega__list" aria-label="{t} sections">{links}</ul>
                {mega_visual(h, t)}
              </div>
            </div>
          </div>
        </div>'''
    return out


def brand(white=False):
    logo_src, lw, lh = brand_img(S["logo_white"] if white else S["logo"])
    return f'''<a class="brand" href="index.html" aria-label="OXE Marketing, home">
      <img src="{logo_src}" alt="" width="{lw}" height="{lh}">
      <span>Marketing</span>
    </a>'''


def socials():
    names = [("facebook", "Facebook"), ("instagram", "Instagram"), ("tiktok", "TikTok"), ("linkedin", "LinkedIn")]
    # TODO: fill SITE["social"] in content.py; "#" is a placeholder until then
    return "".join(f'<a href="{S["social"].get(k) or "#"}" aria-label="OXE Marketing on {n}"{" target=" + chr(34) + "_blank" + chr(34) + " rel=" + chr(34) + "noopener" + chr(34) if S["social"].get(k) else ""}>{I[k]}</a>' for k, n in names)


def foot():
    nav = "".join(f'<li><a href="{h}">{t}</a></li>' for h, t in C.NAV)
    svc = "".join(f'<li><a href="services.html#{s["key"]}">{s["title"]}</a></li>' for s in C.SERVICES)
    return f'''</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        {brand(True)}
        <p>{T["footer"]["text"]}</p>
        <div class="socials">{socials()}</div>
      </div>
      <nav aria-label="Footer"><h2>Explore</h2><ul>{nav}</ul></nav>
      <div><h2>Services</h2><ul>{svc}</ul></div>
      <div><h2>Contact</h2>
        <ul>
          <li><a href="mailto:{S['email']}">{S['email']}</a></li>
          <li><a href="tel:{S['phone_tel']}">{S['phone_display']}</a></li>
          <li><a href="{S['whatsapp']}" target="_blank" rel="noopener">WhatsApp</a></li>
          <li>{S['city']}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> {T["footer"]["copyright"]}</span>
      <span>{T["footer"]["slogan"]}</span>
    </div>
  </div>
</footer>

<div class="fab-stack">
  <button class="fab fab--top to-top" type="button" aria-label="Back to top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>
  <a class="fab fab--ig" href="{S["social"].get("instagram") or "#"}" target="_blank" rel="noopener" aria-label="OXE Marketing on Instagram">{I["instagram"]}</a>
  <a class="fab fab--fb" href="{S["social"].get("facebook") or "#"}" target="_blank" rel="noopener" aria-label="OXE Marketing on Facebook">{I["facebook"]}</a>
  <a class="fab fab--wa" href="{S['whatsapp']}" target="_blank" rel="noopener" aria-label="Chat with OXE Marketing on WhatsApp">{I["whatsapp"]}</a>
</div>
<script src="assets/js/main.js?v={ver("assets/js/main.js")}" defer></script>
</body>
</html>
'''


def contact_buttons(cls=""):
    """WhatsApp, email and phone as matching solid buttons: one of each, used everywhere."""
    return f'''<div class="cbtns {cls}">
          <a class="cbtn cbtn--wa" href="{S["whatsapp"]}" target="_blank" rel="noopener">{I["whatsapp"]}<span><small>WhatsApp</small>{S["phone_display"]}</span></a>
          <a class="cbtn cbtn--mail" href="mailto:{S["email"]}">{I["mail2"]}<span><small>Email</small>{S["email"]}</span></a>
          <a class="cbtn cbtn--call" href="tel:{S["phone_tel"]}">{I["phone2"]}<span><small>Call</small>{S["phone_display"]}</span></a>
        </div>'''


def contact_band():
    return f'''
  <section class="contact-band" id="get-in-touch">
    <div class="container">
      <div class="contact-band__inner reveal">
        <div class="contact-band__copy">
          <h2>{T["contact_band"]["title"]}</h2>
          <p>{T["contact_band"]["text"]}</p>
          {btn(T["contact_band"]["button"], "contact.html")}
        </div>
        <div class="contact-band__card">
          <p class="contact-band__label">{T["contact_band"]["card_label"]}</p>
          {contact_buttons("cbtns--band")}
          <p class="contact-loc">{I["pin2"]} {S["city"]}</p>
        </div>
        {badge("badge--band")}
      </div>
    </div>
  </section>
'''


# ------------------------------------------------------------------ shared components
def logo_img(p):
    """Client logo for projects without imagery: 'logo:<file>' (assets/img/clients) or a work image flagged logo."""
    alt = plain(p["client"]) + " logo"
    if p["cover"].startswith("logo:"):
        f = p["cover"][5:]
        u, w, h = logo(f)
        return f'<img src="{u}" alt="{alt}" width="{w}" height="{h}" loading="lazy">'
    return img(p["cover"], alt)


def project_media(p, big=False):
    """Visual for a project card."""
    alt = f'{plain(p["client"])}: {plain(p["title"])} by OXE Marketing'
    if p.get("device"):
        return f'<div class="media-stage">{devices(p["cover"], p.get("mobile"), alt=alt)}</div>'
    if p["cover"] and (p.get("logo") or p["cover"].startswith("logo:")):
        return f'<div class="media-logo">{logo_img(p)}</div>'
    if not p["cover"]:
        return f'<div class="media-placeholder" role="img" aria-label="{plain(p["client"])}">{ART["web"]}<span>{p["client"]}</span></div>'
    if p.get("video") and not big:
        v = p["video"]
        webp(poster(v))
        return (f'<video muted loop playsinline autoplay preload="metadata" poster="{wurl(poster(v))}" aria-label="{alt}">'
                f'<source src="{vurl(v)}" type="video/mp4"></video>')
    return img(p["cover"], alt, lazy=not big)


def media_items(p):
    """Everything we can show for a project, in order: video, device mockup / cover, gallery."""
    items = []
    if p.get("video"):
        items.append(("video", p["video"]))
    if p.get("device"):
        items.append(("device", p["cover"]))
    elif p["cover"] and not (p.get("logo") or p["cover"].startswith("logo:")):
        items.append(("img", p["cover"]))
    for g in p["gallery"]:
        if ("img", g) not in items:
            items.append(("img", g))
    return items


def media_count(p):
    items = media_items(p)
    n_img = sum(k != "video" for k, _ in items)
    parts = ([f'{n_img} image{"s" if n_img != 1 else ""}'] if n_img else []) + (["video"] if p.get("video") else [])
    return " · ".join(parts)


def project_card(p, extra=False, h="h3"):
    count = media_count(p)
    return f'''
        <article class="pcard reveal" data-category="{p["cat"]}"{" data-extra" if extra else ""}>
          <div class="pcard__media">{project_media(p)}</div>
          <div class="pcard__body">
            <span class="pcard__meta">{p["category"]}{f" · {count}" if count else ""}</span>
            <{h}><a href="work/{p["id"]}.html">{p["client"]}</a></{h}>
            <small>{p["title"]}</small>
            <p>{p["summary"]}</p>
            <span class="link-arrow" aria-hidden="true">View Project {ARR}</span>
          </div>
        </article>'''


def viewer(p):
    """Case-study media viewer: every image / video of the project, with thumbnails and arrows."""
    items = media_items(p)
    if not items:
        return f'<div class="case-media reveal">{project_media(p, big=True)}</div>'
    who = plain(p["client"])
    stage, thumbs = "", ""
    for n, (kind, name) in enumerate(items):
        active = " is-active" if n == 0 else ""
        hidden = "" if n == 0 else ' aria-hidden="true"'
        if kind == "video":
            webp(poster(name))
            body = f'<video controls muted loop playsinline{" autoplay" if n == 0 else ""} preload="{"metadata" if n == 0 else "none"}" poster="{wurl(poster(name))}"><source src="{vurl(name)}" type="video/mp4">Your browser does not support video.</video>'
            th = f'<img src="{wurl(poster(name))}" alt="" loading="lazy"><span class="play" aria-hidden="true"></span>'
            label = f"Play the {who} video"
        elif kind == "device":
            body = f'<div class="viewer__device">{devices(name, p.get("mobile"), alt=who + " website on laptop and phone")}</div>'
            th = f'<img src="{wurl(name)}" alt="" loading="lazy">'
            label = "Show the website on laptop and phone"
        else:
            body = img(name, f"{who} project by OXE Marketing, image {n + 1}", lazy=n > 0)
            th = f'<img src="{wurl(name)}" alt="" loading="lazy">'
            label = f"Show image {n + 1}"
        stage += f'<figure class="viewer__item viewer__item--{kind}{active}"{hidden}>{body}</figure>'
        thumbs += f'<li><button type="button" aria-label="{label}"{" aria-current=" + chr(34) + "true" + chr(34) if n == 0 else ""}>{th}</button></li>'
    multi = len(items) > 1
    nav = f'''<button class="viewer__nav viewer__nav--prev" type="button" aria-label="Previous">{ARR}</button>
          <button class="viewer__nav viewer__nav--next" type="button" aria-label="Next">{ARR}</button>
''' if multi else ""
    return f'''<div class="viewer reveal" data-viewer aria-roledescription="carousel" aria-label="{who} project media">
        <div class="viewer__stage">{stage}
          {nav}
        </div>
        {f'<ul class="viewer__thumbs">{thumbs}</ul>' if multi else ""}
      </div>'''


def clients_wall(tint=False):
    """Logo wall: bordered grid with a feature panel in the middle."""
    cells = ""
    for f, name in C.CLIENTS:
        u, w, h = logo(f)
        kind = "wide" if w / h > 1.6 else "badge"
        cells += f'<li class="logo-cell logo-cell--{kind}"><img src="{u}" alt="{plain(name) if name else ""}" width="{w}" height="{h}" loading="lazy" decoding="async"></li>'
    # pad the grid to a multiple of 6 (and so of 2 and 3) so no cell is left open
    cells += '<li class="logo-cell logo-cell--blank" aria-hidden="true"></li>' * ((-len(C.CLIENTS)) % 6)
    return f'''
  <section class="section clients-wall{" section--tint" if tint else ""}" id="clients" aria-labelledby="clients-title">
    <div class="container">
      <ul class="logo-wall reveal">
        <li class="logo-wall__feature">
          {eyebrow(T["clients"]["eyebrow"])}
          <h2 id="clients-title">{T["clients"]["title"]}</h2>
          <p>{T["clients"]["text"]}</p>
          <a class="btn btn--navy" href="contact.html">{T["clients"]["button"]} <span aria-hidden="true">»</span></a>
        </li>{cells}
      </ul>
    </div>
  </section>'''


BRANDS_H2 = "Brands we've <span class=\"hl\">worked with</span>"


def clients_marquee():
    """Home: two rows of client logos scrolling in opposite directions."""
    def tile(f, name):
        u, w, h = logo(f)
        return f'<li><img src="{u}" alt="{plain(name) if name else ""}" width="{w}" height="{h}" loading="lazy"></li>'
    half = (len(C.CLIENTS) + 1) // 2
    rows = ""
    for n, part in enumerate((C.CLIENTS[:half], C.CLIENTS[half:])):
        items = "".join(tile(f, nm) for f, nm in part)
        dup = items.replace('<li>', '<li aria-hidden="true">').replace('alt="', 'alt="" data-alt="')
        rows += f'<div class="marquee{" marquee--rev" if n else ""}"><ul class="marquee__track">{items}{dup}</ul></div>'
    return f'''
  <section class="section clients-slider" id="clients">
    <div class="container">
      {sec_head("Clients &amp; partners", BRANDS_H2, "From global technology names to local favourites.", cls="sec-head--center")}
    </div>
    <div class="marquees reveal">{rows}</div>
  </section>'''


def works_list():
    """Home "Our Works": large category rows + one media frame that crossfades on hover/focus."""
    rows, stage = "", ""
    for i, (key, title, cover, video) in enumerate(C.WORK_CATEGORIES):
        ps = [p for p in C.PROJECTS if key in p["cat"].split()]
        clients = list(dict.fromkeys(plain(p["client"]) for p in ps))[:3]
        on = " is-active" if i == 0 else ""
        rows += f'''
            <li><a class="wrow{on}" href="portfolio.html?filter={key}" data-i="{i}">
              <span class="wrow__count">{len(ps):02d}</span>
              <span class="wrow__title">{title}</span>
              <span class="wrow__clients"><span>{" · ".join(clients)}</span></span>
              <span class="wrow__go" aria-hidden="true">{ARR}</span>
            </a></li>'''
        if video:
            v = video
            webp(poster(v))
            media = f'<video muted loop playsinline autoplay preload="metadata" poster="{wurl(poster(v))}"><source src="{vurl(v)}" type="video/mp4"></video>'
        else:
            media = img(cover, "")
        stage += f'<figure class="wstage{on}" data-i="{i}" aria-hidden="true">{media}<figcaption>{title}</figcaption></figure>'
    return f'''<div class="wlist" data-wlist>
          <ol class="wlist__rows">{rows}
          </ol>
          <div class="wlist__stage">{stage}</div>
        </div>'''


def principle_list(items):
    return "".join(f'<li><span class="principles__ico">{I[i]}</span><h3>{t}</h3><p>{d}</p></li>' for i, t, d in items)


# ------------------------------------------------------------------ HOME
def org_schema():
    return {"@context": "https://schema.org", "@type": "ProfessionalService", "name": S["name"], "url": S["url"],
            "logo": S["url"] + "/" + S["org_logo"], "image": S["url"] + "/" + S["share_image"],
            "email": S["email"], "telephone": S["phone_tel"], "foundingDate": S["founded"],
            "address": {"@type": "PostalAddress", "addressLocality": "Bangkok", "addressCountry": "TH"},
            "areaServed": "Thailand", "description": C.HERO["text"],
            "knowsAbout": ["Website design", "Social media marketing", "Video production", "Photography", "Digital strategy"]}


def badge(cls=""):
    """Diamond badge with circular text (hero corner, why panel, contact band)."""
    return f'''<div class="badge {cls}" aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <defs><path id="badge-ring" d="M100,100 m-62,0 a62,62 0 1,1 124,0 a62,62 0 1,1 -124,0"/></defs>
            <circle cx="100" cy="100" r="80" fill="#fff"/>
            <text font-size="12.6" letter-spacing="3.4" fill="#0f2b50" font-family="Poppins, sans-serif" font-weight="500"><textPath href="#badge-ring">{T["badge_text"]} </textPath></text>
            <path d="M100 72 C103 92 108 97 128 100 C108 103 103 108 100 128 C97 108 92 103 72 100 C92 97 97 92 100 72Z" fill="#0f2b50"/>
          </svg>
        </div>'''


def intro_cards():
    """Home intro: two image/video cards linking to work (content/home.yml → intro_cards)."""
    out = ""
    for c in PG["home"]["intro_cards"][:2]:
        if c.get("video"):
            media = (f'<video muted loop playsinline autoplay preload="metadata" poster="{wurl(poster(c["video"]))}" aria-label="{c["alt"]}">'
                     f'<source src="{vurl(c["video"])}" type="video/mp4"></video>')
        else:
            media = img(c["image"], c["alt"])
        out += f'<a class="icard reveal" href="{c["link"]}">{media}<span class="icard__go">{ARR}</span><span class="icard__label">{c["label"]}</span></a>'
    return out


def home():
    tones = ["lav", "white", "lav", "white", "navy"]
    cards = ""
    for n, sv in enumerate(C.SERVICES):
        what = "".join(f"<li>{I['check']}<span>{x}</span></li>" for x in sv["what"][:4])
        cards += f'''
        <article class="scard2 scard2--{tones[n % len(tones)]}" style="--i:{n}">
          <div class="scard2__body">
            <span class="scard2__mark" aria-hidden="true">{ART[sv["art"]]}</span>
            <h3>{sv["title"]}</h3>
            <p class="scard2__intro">{sv["short"]}</p>
            <ul class="scard2__list">{what}</ul>
            <a class="link-arrow" href="services.html#{sv["key"]}">Learn more {ARR}</a>
          </div>
          <a class="scard2__media" href="services.html#{sv["key"]}" tabindex="-1" aria-hidden="true">{img(sv["img"], "")}</a>
        </article>'''
    return head(PG["home"]["seo_title"], PG["home"]["seo_description"], "index.html", schema=org_schema()) + f'''
  <section class="hero">
    <div class="container">
      <div class="hero__panel">
        <h1>{C.HOME["hero_title"]}</h1>
        <p class="lead">{C.HERO["text"]}</p>
        <div class="hero__actions">
          {btn(PG["home"]["hero_button"], "contact.html")}
          <div class="hero__proof">
            <div class="hero__logos">{"".join(f'<img src="{logo(f)[0]}" alt="{n or ""}" width="48" height="48">' for f, n in C.CLIENTS[:3])}</div>
            <p><b>{C.HOME["proof_title"]}</b><span>{C.HOME["proof_text"]}</span></p>
          </div>
        </div>
        {badge()}
      </div>
      <div class="intro">
        <div class="intro__copy reveal">
          <h2>{C.HOME["intro_title"]}</h2>
          <p>{C.HOME["intro_text"]}</p>
        </div>
        <div class="intro__cards">
          {intro_cards()}
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="services">
    <div class="container">
      <div class="sec-row">
        {sec_head(PG["home"]["services_eyebrow"], C.HOME["services_title"], C.HOME["services_text"])}
        <div class="reveal">{btn(PG["home"]["services_button"], "services.html")}</div>
      </div>
      <div class="svc-stack">{cards}
      </div>
    </div>
  </section>

  <section class="section why" id="why">
    <div class="container">
      <div class="why-panel">
        <div class="why-panel__media reveal">
          <figure class="why-panel__photo">{img(PG["home"]["why_photos"][0]["image"], PG["home"]["why_photos"][0]["alt"])}</figure>
          <figure class="why-panel__photo why-panel__photo--sm">{img(PG["home"]["why_photos"][1]["image"], PG["home"]["why_photos"][1]["alt"])}</figure>
        </div>
        <div class="why-panel__copy">
          {sec_head(PG["home"]["why_eyebrow"], C.WHY["title"], C.WHY["text"])}
          <ul class="principles reveal">{principle_list(C.WHY["principles"])}</ul>
          <div class="reveal">{btn(PG["home"]["why_button"], "about.html")}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section works-sec" id="work">
    <div class="container">
      <div class="works">
        <div class="works__head reveal">
          <h2 class="works__title">{C.HOME["works_title"]}</h2>
          <p class="works__lede">{C.HOME["works_text"]}</p>
          {btn(PG["home"]["works_button"], "portfolio.html")}
        </div>
        {works_list()}
      </div>
    </div>
  </section>

{clients_wall()}
{latest_insights()}
{contact_band()}''' + foot()


def collage(imgs, alts):
    """Three-photo collage used as the visual in page heroes."""
    return '<div class="collage">' + "".join(f'<figure>{img(i, a, lazy=False)}</figure>' for i, a in zip(imgs, alts)) + '</div>'


def page_hero(eb, h1, lead, visual="", after="", cls="", photos=()):
    """Inner-page hero: centred copy on the lavender panel, with tilted photos,
    soft glows, a breadcrumb pill and a slow text ticker along the bottom."""
    pics = "".join(f'<figure class="phero__pic phero__pic--{n}">{img(ph, "", lazy=False)}</figure>' for n, ph in enumerate(photos[:2], 1))
    words = "".join(f"<span>{w}</span><i>✦</i>" for w in T["ticker"])
    return f'''
  <section class="phero {cls}">
    <div class="container">
      <div class="phero__panel">
        <span class="phero__glow phero__glow--a" aria-hidden="true"></span>
        <span class="phero__glow phero__glow--b" aria-hidden="true"></span>
        <div class="phero__pics" aria-hidden="true">{pics}</div>
        <div class="phero__copy reveal">
          <nav class="phero__crumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">{eb}</span></nav>
          <h1>{h1}</h1>
          <p class="lead">{lead}</p>
          {after}
        </div>
        <div class="phero__ticker" aria-hidden="true"><div class="phero__track">{words}{words}</div></div>
      </div>
    </div>
  </section>'''


# ------------------------------------------------------------------ SERVICES
def service_media(s):
    """Several videos playing together, or a crossfading slideshow of images."""
    title = plain(s["title"])
    if s.get("videos"):
        tiles = ""
        for v, client in s["videos"]:
            webp(poster(v))
            tiles += (f'<figure class="vwall__item"><video muted loop playsinline autoplay preload="metadata" poster="{wurl(poster(v))}" '
                      f'aria-label="{plain(client)} video by OXE Marketing"><source src="{vurl(v)}" type="video/mp4"></video>'
                      f'</figure>')
        return f'<div class="vwall" data-vwall>{tiles}</div>'
    slides, dots = "", ""
    for i, name in enumerate(s["slides"]):
        if name.startswith("device:"):
            p = next((p for p in C.PROJECTS if p["cover"] == name[7:]), {"cover": name[7:], "client": title})
            inner = f'<div class="slide__devices">{devices(p["cover"], p.get("mobile"), alt=plain(p["client"]) + " website by OXE Marketing")}</div>'
        else:
            inner = img(name, f"{title} by OXE Marketing, image {i + 1}")
        slides += f'<figure class="slide{" is-active" if i == 0 else ""}"{"" if i == 0 else " aria-hidden=" + chr(34) + "true" + chr(34)}>{inner}</figure>'
        dots += f'<button type="button" aria-label="Show image {i + 1} of {len(s["slides"])}"{" aria-current=" + chr(34) + "true" + chr(34) if i == 0 else ""}></button>'
    only_devices = all(n.startswith("device:") for n in s["slides"])
    return f'''<div class="slideshow{" slideshow--devices" if only_devices else ""}" data-slideshow aria-roledescription="carousel" aria-label="{title} examples">
            <div class="slides">{slides}</div>
            <div class="slide-dots">{dots}</div>
          </div>'''


def services():
    jump = "".join(f'<a href="#{s["key"]}">{s["title"]}</a>' for s in C.SERVICES)
    blocks = ""
    for n, s in enumerate(C.SERVICES):
        what = "".join(f"<li>{I['check']}{x}</li>" for x in s["what"])
        blocks += f'''
      <article class="svc-block{" svc-block--rev" if n % 2 else ""}" id="{s["key"]}" data-svc>
        <div class="svc-block__visual reveal">
          {service_media(s)}
        </div>
        <div class="svc-block__body reveal">
          <div class="svc-block__head">
            <span class="svc-block__mark" aria-hidden="true">{ART[s["art"]]}</span>
            <h2>{s["title"]}</h2>
          </div>
          <p class="lead">{s["intro"]}</p>
          <h3 class="svc-block__label">{PG["services"]["what_label"]}</h3>
          <ul class="svc-block__list">{what}</ul>
          <div class="btn-row">
            {btn(PG["services"]["book_button"], "contact.html?service=" + s["key"])}
            {btn(PG["services"]["work_button"], "portfolio.html", "text")}
          </div>
        </div>
      </article>'''
    dock = "".join(f'<a href="#{sv["key"]}" data-dock="{sv["key"]}"><b>{n:02d}</b><span>{sv["short_name"]}</span></a>' for n, sv in enumerate(C.SERVICES, 1))
    ind = "".join(f'<li class="ind-tile reveal">{img(im, t + " industry")}<span>{t}</span></li>' for t, im in C.INDUSTRIES)
    return head(PG["services"]["seo_title"], PG["services"]["seo_description"], "services.html") + f'''
{page_hero(PG["services"]["eyebrow"], PG["services"]["title"], PG["services"]["intro"],
           after=f'<nav class="jump" aria-label="Services on this page">{jump}</nav>', photos=PG["services"]["photos"])}

  <section class="section section--flush svc-blocks" data-svc-section>
    <div class="container">{blocks}
    </div>
    <nav class="svc-dock" aria-label="Services on this page">
      <span class="svc-dock__fill" aria-hidden="true"></span>
      {dock}
    </nav>
  </section>

  <section class="section section--tint" id="industries">
    <div class="container">
      {sec_head(PG["services"]["industries_eyebrow"], PG["services"]["industries_title"], PG["services"]["industries_text"])}
      <ul class="ind-grid">{ind}</ul>
    </div>
  </section>
{contact_band()}''' + foot()


# ------------------------------------------------------------------ PORTFOLIO
SPANS = [7, 5, 4, 4, 4, 5, 7]   # bento rhythm on a 12-column grid (JS re-applies it after filtering)


def bento_spans(count):
    """Spans for `count` cards on a 12-col grid; the last card of an unfinished row stretches to fill it."""
    spans, row = [], 0
    for i in range(count):
        sp = SPANS[i % len(SPANS)]
        if row + sp > 12:
            row = 0
        spans.append(sp); row += sp
        if row == 12:
            row = 0
    if row:
        spans[-1] += 12 - row
    return spans


def pcard(p, n, extra=False, span=None):
    """Portfolio bento card: rounded media with arrow button, category + media count, client and project."""
    count = media_count(p)
    return f'''
        <article class="pc reveal" style="--span:{span or SPANS[n % len(SPANS)]}" data-category="{p["cat"]}"{" data-extra" if extra else ""}>
          <a class="pc__media" href="work/{p["id"]}.html" aria-label="{plain(p["client"])}: {plain(p["title"])}">{project_media(p)}<span class="pc__go" aria-hidden="true">{ARR}</span></a>
          <div class="pc__body">
            <p class="pc__meta"><span class="pc__cat">{p["category"]}</span>{f"<span>{count}</span>" if count else ""}</p>
            <h3><a href="work/{p["id"]}.html">{p["client"]}</a></h3>
            <p class="pc__title">{p["title"]}</p>
          </div>
        </article>'''


def portfolio():
    counts = {k: (len(C.PROJECTS) if k == "all" else sum(k in p["cat"].split() for p in C.PROJECTS)) for k, _ in C.FILTERS}
    fb = "".join(f'<button class="filter-btn{" is-active" if k == "all" else ""}" type="button" data-filter="{k}" aria-pressed="{"true" if k == "all" else "false"}">{t}<sup>{counts[k]:02d}</sup></button>' for k, t in C.FILTERS)
    grid_projects = PORT
    pdock = "".join(f'<button type="button" class="filter-btn{" is-active" if k == "all" else ""}" data-filter="{k}" aria-pressed="{"true" if k == "all" else "false"}">{t}<sup>{counts[k]:02d}</sup></button>' for k, t in C.FILTERS)
    first = bento_spans(7)
    cards = "".join(pcard(p, n, extra=n >= 7, span=first[n] if n < 7 else None) for n, p in enumerate(grid_projects))
    f = PBY.get(PG["portfolio"]["featured_project"]) or PORT[0]
    if f.get("video"):
        spot_media = f'<video muted loop playsinline autoplay preload="metadata" poster="{wurl(poster(f["video"]))}"><source src="{vurl(f["video"])}" type="video/mp4"></video>'
    else:
        spot_media = project_media(f, big=True)
    spot_logo = ""
    if PG["portfolio"].get("featured_logo"):
        lu, lw, lh = logo(PG["portfolio"]["featured_logo"])
        spot_logo = f'<img class="spot__logo" src="{lu}" alt="{plain(f["client"])} logo" width="{lw}" height="{lh}">'
    disciplines = len(C.FILTERS) - 1
    stats = f'<ul class="pstats"><li><b>{len(C.PROJECTS)}</b>{PG["portfolio"]["stats_projects"]}</li><li><b>{disciplines}</b>{PG["portfolio"]["stats_disciplines"]}</li><li><b>{PG["portfolio"]["stats_brands_value"]}</b>{PG["portfolio"]["stats_brands"]}</li></ul>'
    return head(PG["portfolio"]["seo_title"], PG["portfolio"]["seo_description"], "portfolio.html") + f'''
{page_hero(PG["portfolio"]["eyebrow"], PG["portfolio"]["title"], PG["portfolio"]["intro"], after=stats, photos=PG["portfolio"]["photos"])}

  <section class="section spot-sec">
    <div class="container">
      <article class="spot reveal">
        <header class="spot__bar">
          <span>{PG["portfolio"]["featured_label"]}</span>
          <span class="spot__rule" aria-hidden="true"></span>
          <span>{f["category"]}</span>
        </header>
        <div class="spot__grid">
          <div class="spot__copy">
            {spot_logo}
            <p class="spot__client">{f["client"]}</p>
            <h2><span class="hl">{f["title"]}</span></h2>
            <p>{f["summary"]}</p>
            <dl class="spot__facts">
              <div><dt>Client</dt><dd>{f["client"]}</dd></div>
              <div><dt>Service</dt><dd>{f["category"]}</dd></div>
              <div><dt>Scope</dt><dd>{PG["portfolio"]["featured_scope"]}</dd></div>
            </dl>
            <a class="link-arrow" href="work/{f["id"]}.html">{PG["portfolio"]["featured_link"]} {ARR}</a>
          </div>
          <a class="spot__media" href="work/{f["id"]}.html" aria-label="{plain(f["client"])} case study">
            {spot_media}
          </a>
        </div>
      </article>
    </div>
  </section>

  <section class="section section--flush" id="projects" data-port-section>
    <div class="container">
      <div class="pbento" data-projects>{cards}
      </div>
      <p class="filter-empty" hidden>{PG["portfolio"]["empty_text"]}</p>
      <div class="more-wrap"><button class="btn btn--primary" type="button" data-more>{PG["portfolio"]["more_button"]}<span class="btn__arrow" aria-hidden="true">{ARR}</span></button></div>
    </div>
    <nav class="svc-dock port-dock" aria-label="Filter projects">
      <span class="svc-dock__fill" aria-hidden="true"></span>
      {pdock}
    </nav>
  </section>
{contact_band()}''' + foot()


# ------------------------------------------------------------------ CASE STUDY
def case(p):
    i = PORT.index(p)
    nxt = PORT[(i + 1) % len(PORT)]
    svc = "".join(f"<li>{I['check']}{x}</li>" for x in p["services"])
    tags = "".join(f"<li>{t}</li>" for t in p["tags"])
    def block(n, label, text):
        if text:
            return f'<section class="ccs reveal"><span class="num">{n}</span><div><h2>{label}</h2><p>{text}</p></div></section>'
        # TODO: OXE to supply this part of the case study
        return f'<section class="ccs ccs--todo reveal"><span class="num">{n}</span><div><h2>{label}</h2><p>Full case study coming soon. <a href="contact.html">Contact us</a> to hear more about this project.</p></div></section>'

    if p["challenge"] or p["solution"] or p["outcome"]:
        ccso = block("01", "Client", p["client"] + ".") + block("02", "Challenge", p["challenge"]) + block("03", "Solution", p["solution"]) + block("04", "Outcome", p["outcome"])
    else:  # TODO: OXE to supply Challenge / Solution / Outcome for this project
        ccso = block("01", "Client", p["client"] + ".") + f'''<section class="ccs ccs--todo reveal"><span class="num">02</span><div><h2>Challenge, solution &amp; outcome</h2><p>The full case study for this project is being written. <a href="contact.html">Contact us</a> to hear more about the work, or browse the gallery below.</p></div></section>'''
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Portfolio", "item": S["url"] + "/portfolio"},
        {"@type": "ListItem", "position": 2, "name": plain(p["client"]), "item": S["url"] + "/work/" + p["id"]}]}
    return head(f'{plain(p["client"])}: {plain(p["title"])} | OXE Marketing',
                plain(p["summary"]) + " A " + plain(p["category"]).lower() + " project by OXE Marketing, Bangkok.",
                f'work/{p["id"]}.html', schema=crumbs) + f'''
  <section class="page-hero page-hero--compact case-hero">
    <div class="container">
      <nav class="crumbs reveal" aria-label="Breadcrumb"><a href="portfolio.html">Portfolio</a><span aria-hidden="true">/</span><span aria-current="page">{p["client"]}</span></nav>
      <div class="case-hero__grid">
        <div class="reveal">
          {eyebrow(p["category"])}
          <h1>{p["client"]}<span class="case-hero__sub">{p["title"]}</span></h1>
          <p class="lead">{p["summary"]}</p>
        </div>
        <dl class="case-meta reveal">
          <div><dt>Client</dt><dd>{p["client"]}</dd></div>
          <div><dt>Category</dt><dd>{p["category"]}</dd></div>
          <div><dt>Tags</dt><dd><ul class="tags">{tags}</ul></dd></div>
        </dl>
      </div>
      {viewer(p)}
    </div>
  </section>

  <section class="section">
    <div class="container case-body">
      <div class="case-body__main">
        {ccso}
      </div>
      <aside class="case-aside reveal">
        <h2>{T["case_study"]["services_title"]}</h2>
        <ul class="checks">{svc}</ul>
        {btn(T["case_study"]["start_button"], "contact.html")}
      </aside>
    </div>
  </section>
  <section class="section section--flush">
    <div class="container">
      <a class="next-project reveal" href="work/{nxt["id"]}.html">
        <small>{T["case_study"]["next_label"]}</small>
        <b>{nxt["client"]}: {nxt["title"]}</b>
        <span class="arrow-circle">{ARR}</span>
      </a>
    </div>
  </section>
{contact_band()}''' + foot()


# ------------------------------------------------------------------ ABOUT
def bento():
    """Why companies choose OXE: bento grid with one feature card, a photo tile and a year card."""
    items = C.ABOUT["choose"]
    # grid-area letter for each item, in content order
    areas = ["b", "c", "a", "e", "d", "f", "g", "h"]
    cells = ""
    for n, ((ico, t, d), area) in enumerate(zip(items, areas), 1):
        num = f'<span class="bento__num">{n:02d}</span>'
        if area == "a":
            body = f'<div class="bento__art" aria-hidden="true"><span class="float-a">{ART["web"]}</span><span class="float-b">{ART["video"]}</span><span class="float-c">{ART["social"]}</span></div>{num}<h3>{t}</h3><p>{d}</p>'
        elif area == "d":
            body = f'{img(PG["about"]["bento_photo"], PG["about"]["bento_photo_alt"])}<div class="bento__overlay">{num}<h3>{t}</h3><p>{d}</p></div>'
        elif area == "g":
            body = f'{num}<b class="bento__year" aria-hidden="true">{PG["about"]["bento_year"]}</b><h3>{t}</h3><p>{d}</p>'
        else:
            body = f'<span class="ico">{I[ico]}</span>{num}<h3>{t}</h3><p>{d}</p>'
        cells += f'\n        <li class="bento__cell bento__cell--{area} reveal">{body}</li>'
    return f'<ul class="bento">{cells}\n      </ul>'


def about():
    facts = "".join(f"<li><b>{a}</b><span>{b}</span></li>" for a, b in C.ABOUT["facts"])
    story = "".join(f"<p>{t}</p>" for t in [C.ABOUT["intro"]] + C.ABOUT["story"])
    return head(PG["about"]["seo_title"], PG["about"]["seo_description"], "about.html") + f'''
{page_hero(PG["about"]["eyebrow"], C.ABOUT["title"], C.ABOUT["positioning"],
           photos=PG["about"]["photos"])}

  <section class="facts-wrap">
    <div class="container"><ul class="facts reveal">{facts}</ul></div>
  </section>

  <section class="section" id="mission">
    <div class="container mv">
      <article class="mv__card reveal">
        <span class="mv__art" aria-hidden="true">{ART["strategy"]}</span>
        {eyebrow(PG["about"]["mission_label"])}
        <p>{C.ABOUT["mission"]}</p>
      </article>
      <article class="mv__card mv__card--blue reveal">
        <span class="mv__art" aria-hidden="true">{ART["analytics"]}</span>
        {eyebrow(PG["about"]["vision_label"])}
        <p>{C.ABOUT["vision"]}</p>
      </article>
    </div>
  </section>

  <section class="section section--tint" id="story">
    <div class="container story">
      <div>
        {sec_head(PG["about"]["story_eyebrow"], PG["about"]["story_title"])}
        <div class="reveal">{story}</div>
      </div>
      <div class="mosaic reveal">
        {"".join(img(x["image"], x["alt"]) for x in PG["about"]["story_photos"][:3])}
      </div>
    </div>
  </section>

  <section class="section" id="why-oxe">
    <div class="container">
      {sec_head(PG["about"]["why_eyebrow"], PG["about"]["why_title"])}
      {bento()}
    </div>
  </section>

{clients_wall()}
{contact_band()}''' + foot()


FORM_ACTION = "https://api.web3forms.com/submit"   # contact form backend (works on any host, incl. Vercel)


# ------------------------------------------------------------------ CONTACT
REQ = ' <b aria-hidden="true">*</b>'


def form():
    keys = {"Website Design &amp; Development": "web", "Social Media Marketing": "social", "Video Production": "video",
            "Photography": "photo", "Branding &amp; Creative Design": "strategy"}
    chips = "".join(f'<label class="chip"><input type="checkbox" name="service" value="{plain(sv)}" data-key="{keys.get(sv, "")}"><span>{sv}</span></label>' for sv in C.SERVICE_OPTIONS)
    budget = "".join(f'<label class="chip"><input type="radio" name="budget" value="{b}"><span>{b}</span></label>' for b in C.BUDGETS)

    def field(id_, name, text, typ="text", req=False, ac="", ph="", err=""):
        return f'''<div class="field">
                <label for="{id_}">{text}{REQ if req else ""}</label>
                <input id="{id_}" name="{name}" type="{typ}" placeholder="{ph}"{f' autocomplete="{ac}"' if ac else ""}{" required" if req else ""}{f' aria-describedby="{id_}-err"' if err else ""}>
                {f'<span class="error" id="{id_}-err">{err}</span>' if err else ""}
              </div>'''
    # Web3Forms when a key is set (Admin → Contact details & settings); otherwise the JS hands off to email/WhatsApp
    action = FORM_ACTION if S["form_key"] else "mailto:" + S["email"]
    wa = re.search(r"wa\.me/(\d+)", S["whatsapp"]).group(1)
    hidden = (f'<input type="hidden" name="access_key" value="{S["form_key"]}">'
              '<input type="hidden" name="subject" value="New website enquiry">'
              '<input type="hidden" name="from_name" value="OXE Marketing website">'
              f'<input type="hidden" name="redirect" value="{S["url"]}/thank-you">') if S["form_key"] else ""
    return f'''<div class="form-card reveal" id="enquiry">
        <div class="form-card__head">
          <h2>{PG["contact"]["form_title"]}</h2>
          <p>Fields marked <b>*</b> are required.</p>
        </div>
        <form name="contact" method="POST" action="{action}" data-contact-form data-email="{S["email"]}" data-wa="{wa}" novalidate>
          {hidden}
          <p hidden><label>Don't fill this out: <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off"></label></p>
          <fieldset class="fset" data-chips-required aria-describedby="svc-err">
            <legend><span class="fset__n">01</span>{PG["contact"]["step_1"]} <b aria-hidden="true">*</b></legend>
            <div class="chips">{chips}</div>
            <span class="error" id="svc-err">Please choose at least one service.</span>
          </fieldset>
          <fieldset class="fset">
            <legend><span class="fset__n">02</span>{PG["contact"]["step_2"]}</legend>
            <div class="form-grid">
              {field("f-name", "name", "Name", req=True, ac="name", ph="Your full name", err="Please enter your name.")}
              {field("f-email", "email", "Email", "email", True, "email", "you@company.com", "Please enter a valid email address.")}
              {field("f-phone", "phone", "Phone", "tel", ac="tel", ph="+66")}
              {field("f-company", "company", "Company", ac="organization", ph="Company name")}
            </div>
          </fieldset>
          <fieldset class="fset">
            <legend><span class="fset__n">03</span>{PG["contact"]["step_3"]}</legend>
            <div class="field">
              <label for="f-details">{PG["contact"]["details_label"]} <b aria-hidden="true">*</b></label>
              <textarea id="f-details" name="details" rows="5" placeholder="{PG["contact"]["details_placeholder"]}" required aria-describedby="f-details-err"></textarea>
              <span class="error" id="f-details-err">Please tell us a little about your project.</span>
            </div>
            <p class="fset__sub">{PG["contact"]["budget_label"]} <em>optional</em></p>
            <div class="chips chips--sm">{budget}</div>
            <p class="fset__sub">{PG["contact"]["reply_label"]}</p>
            <div class="chips chips--sm">
              <label class="chip"><input type="radio" name="method" value="Email" checked><span>Email</span></label>
              <label class="chip"><input type="radio" name="method" value="Phone"><span>Phone</span></label>
              <label class="chip"><input type="radio" name="method" value="WhatsApp"><span>WhatsApp</span></label>
            </div>
          </fieldset>
          <div class="form-foot">
            <button type="submit" class="btn btn--primary form-submit">{PG["contact"]["submit_button"]}<span class="btn__arrow" aria-hidden="true">{ARR}</span></button>
            <p>{PG["contact"]["chat_prompt"]} <a href="{S["whatsapp"]}" target="_blank" rel="noopener">{PG["contact"]["chat_link"]}</a></p>
          </div>
          <div class="form-success" role="status" aria-live="polite">{PG["contact"]["success_message"]}</div>
        </form>
      </div>'''


def contact():
    steps = "".join(f'''<li class="reveal"><span class="step-num">{n}</span><h3>{t}</h3><p>{d}</p></li>''' for n, (t, d) in enumerate(((x["title"], x["text"]) for x in PG["contact"]["steps"]), 1))
    return head(PG["contact"]["seo_title"], PG["contact"]["seo_description"], "contact.html", schema=org_schema()) + f'''
{page_hero(PG["contact"]["eyebrow"], PG["contact"]["title"], PG["contact"]["intro"], photos=PG["contact"]["photos"])}

  <section class="section">
    <div class="container cgrid">
      <div class="cgrid__form">{form()}</div>
      <div class="cgrid__side">
      <a class="ctile ctile--wa reveal" href="{S["whatsapp"]}" target="_blank" rel="noopener">
        <span class="ctile__ico">{I["whatsapp"]}</span>
        <span class="ctile__txt"><small>{PG["contact"]["whatsapp_label"]}</small><b>WhatsApp</b><span class="ctile__val">{S["phone_display"]}</span></span>
        <span class="ctile__go" aria-hidden="true">{ARR}</span>
      </a>
      <a class="ctile ctile--mail reveal" href="mailto:{S["email"]}">
        <span class="ctile__ico">{I["mail2"]}</span>
        <span class="ctile__txt"><small>{PG["contact"]["email_label"]}</small><b>Email</b><span class="ctile__val">{S["email"]}</span></span>
        <span class="ctile__go" aria-hidden="true">{ARR}</span>
      </a>
      <a class="ctile ctile--call reveal" href="tel:{S["phone_tel"]}">
        <span class="ctile__ico">{I["phone2"]}</span>
        <span class="ctile__txt"><small>{PG["contact"]["call_label"]}</small><b>Call</b><span class="ctile__val">{S["phone_display"]}</span></span>
        <span class="ctile__go" aria-hidden="true">{ARR}</span>
      </a>
      <div class="ctile ctile--time reveal">
        <small>{PG["contact"]["time_label"]}</small>
        <b class="ctile__clock" data-bkk-clock>--:--</b>
        <span class="ctile__val">{I["pin2"]} {S["city"]} · ICT (UTC+7)</span>
      </div>
      </div>
    </div>
  </section>

  <section class="section section--flush" id="next">
    <div class="container">
      {sec_head(PG["contact"]["steps_eyebrow"], PG["contact"]["steps_title"], cls="sec-head--center")}
      <ol class="next-steps">{steps}</ol>
    </div>
  </section>

  <section class="section" id="map">
    <div class="container">
      <div class="map-card reveal">
        <div class="map"><iframe title="Map showing Bangkok, Thailand" src="https://www.google.com/maps?q={quote(plain(PG["contact"]["map_location"]), safe=",")}&amp;z=11&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
        {badge("badge--map")}
      </div>
    </div>
  </section>
''' + foot()


def simple(page, title, h1, text):
    return head(f"{title} | OXE Marketing", text, page, noindex=True) + f'''
  <section class="page-hero simple">
    <div class="container">
      {sec_head("OXE Marketing", h1, text, "h1")}
      <div class="btn-row reveal">{btn("Back to Home", "index.html")}{btn("View Portfolio", "portfolio.html", "outline", False)}</div>
    </div>
  </section>
''' + foot()


# ------------------------------------------------------------------ BLOG
CATS = dict(BLOG_CATS)
POSTS.sort(key=lambda p: p["date"], reverse=True)
CAT_SVC = {"web": "web", "social": "social", "video": "video", "photo": "photo", "strategy": "strategy"}


def nice_date(iso):
    d = _date.fromisoformat(iso)
    return f"{d.day} {d.strftime('%b %Y')}"   # portable (no %-d), also in the admin preview


def words(p):
    txt = p["text"] + " " + " ".join(q + " " + a for q, a in p["faq"])
    return len(plain(txt).split())


def read_min(p):
    return max(3, round(words(p) / 220))


def slugify(t):
    return re.sub(r"[^a-z0-9]+", "-", plain(t).lower()).strip("-")


def bmeta(p, cat=True):
    c = f'<span class="pc__cat">{CATS[p["cat"]]}</span>' if cat else ""
    return f'<p class="pc__meta">{c}<span><time datetime="{p["date"]}">{nice_date(p["date"])}</time></span><span>{read_min(p)} min read</span></p>'


def split_words(t, start=0):
    """Wrap each word so headings can rise in word by word (CSS .split)."""
    out = []
    for n, w in enumerate(t.split(), start):
        out.append(f'<span class="w"><span style="--i:{n}">{w}</span></span>')
    return " ".join(out)


def split_html(h):
    """split_words for a heading that may contain the <span class="hl"> highlight."""
    out, n = [], 0
    for part in re.split(r'(<span class="hl">.*?</span>)', h):
        m = re.match(r'<span class="hl">(.*?)</span>$', part)
        txt = m.group(1) if m else part
        if not txt.strip():
            continue
        words_ = split_words(txt, n)
        n += len(txt.split())
        out.append(f'<span class="hl">{words_}</span>' if m else words_)
    return " ".join(out)


def bitem(p, mode="card", attrs=""):
    """Article teaser. mode 'card' = large card, 'row' = editorial index row (the blog page JS swaps these)."""
    url = f'blog/{p["slug"]}.html'
    no = POSTS.index(p) + 1
    return f'''
        <article class="bitem is-{mode} reveal" data-category="{p["cat"]}"{attrs}>
          <a class="bitem__media" href="{url}" tabindex="-1" aria-hidden="true" data-scrub="pass">{img(p["cover"], "")}<span class="pc__go" aria-hidden="true">{ARR}</span></a>
          <div class="bitem__body">
            <span class="bitem__no" aria-hidden="true">{no:02d}</span>
            {bmeta(p)}
            <h3><a href="{url}">{p["title"]}</a></h3>
            <p class="bitem__ex">{p["excerpt"]}</p>
          </div>
          <span class="bitem__go" aria-hidden="true">{ARR}</span>
        </article>'''


def blog():
    f = POSTS[0]
    counts = {k: (len(POSTS) if k == "all" else sum(p["cat"] == k for p in POSTS)) for k, _ in BLOG_CATS}
    topics = "".join(f'<button type="button" class="bfilter{" is-active" if k == "all" else ""}" data-bfilter="{k}" aria-pressed="{"true" if k == "all" else "false"}">{t}<sup>{counts[k]:02d}</sup></button>'
                     for k, t in BLOG_CATS if counts[k])
    pills = "".join(f'<a href="blog.html?cat={k}">{t}</a>' for k, t in BLOG_CATS[1:] if counts[k])
    items = "".join(bitem(p, "card" if i in (1, 2) else "row", ' data-feat hidden' if i == 0 else "") for i, p in enumerate(POSTS))
    stack = "".join(f'<a class="bstack__card bstack__card--{n}" href="blog/{p["slug"]}.html" tabindex="-1" aria-hidden="true"><span class="bstack__in">{img(p["cover"], "", lazy=False)}<span class="bstack__tag">{CATS[p["cat"]]}</span></span></a>'
                    for n, p in enumerate(POSTS[:3], 1))
    words_ = "".join(f"<span>{w}</span><i>✦</i>" for w in T["ticker"])
    schema = {"@context": "https://schema.org", "@type": "Blog", "name": "OXE Marketing Blog", "url": S["url"] + "/blog",
              "publisher": {"@type": "Organization", "name": "OXE Marketing", "url": S["url"]},
              "blogPost": [{"@type": "BlogPosting", "headline": plain(p["title"]), "url": f'{S["url"]}/blog/{p["slug"]}', "datePublished": p["date"]} for p in POSTS]}
    return head(PG["blog-page"]["seo_title"], PG["blog-page"]["seo_description"], "blog.html", schema=schema) + f'''
  <section class="phero bhero">
    <div class="container">
      <div class="phero__panel bhero__panel">
        <span class="phero__glow phero__glow--a" aria-hidden="true"></span>
        <span class="phero__glow phero__glow--b" aria-hidden="true"></span>
        <div class="bhero__grid">
          <div class="bhero__copy">
            <nav class="phero__crumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">{PG["blog-page"]["eyebrow"]}</span></nav>
            <h1 class="split">{split_html(PG["blog-page"]["title"])}</h1>
            <p class="lead">{PG["blog-page"]["intro"]}</p>
            <nav class="jump" aria-label="Blog topics">{pills}</nav>
          </div>
          <div class="bstack" data-scrub="leave">{stack}</div>
        </div>
        <div class="phero__ticker" aria-hidden="true"><div class="phero__track">{words_}{words_}</div></div>
      </div>
    </div>
  </section>

  <section class="section bspot-sec">
    <div class="container">
      <a class="bspot" href="blog/{f["slug"]}.html" data-scrub="enter">
        <div class="bspot__media">{img(f["cover"], "", lazy=False)}</div>
        <div class="bspot__card">
          <p class="bspot__label"><span class="bspot__dot" aria-hidden="true"></span>{PG["blog-page"]["latest_label"]}</p>
          {bmeta(f)}
          <h2>{f["title"]}</h2>
          <p class="bspot__ex">{f["excerpt"]}</p>
          <span class="bspot__btn">{PG["blog-page"]["read_button"]}<span class="btn__arrow" aria-hidden="true">{ARR}</span></span>
        </div>
      </a>
    </div>
  </section>

  <section class="section section--flush" id="articles">
    <div class="container">
      <div class="bbar reveal">
        <h2>{PG["blog-page"]["all_title"]}</h2>
        <div class="btopics" role="group" aria-label="Filter articles by topic">{topics}</div>
      </div>
      <div class="blist" data-posts>{items}
      </div>
    </div>
  </section>
{contact_band()}''' + foot()


RING = '<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19"/><circle class="aprog__bar" cx="22" cy="22" r="19" pathLength="100"/></svg>'


def post(p):
    url = f'{S["url"]}/blog/{p["slug"]}'
    body, heads = p["body_html"], p["heads"]
    toc = "".join(f'<li><a href="#{slugify(h)}">{h}</a></li>' for h in heads)
    faq = "".join(f'<details class="afaq__item"><summary>{q}<span aria-hidden="true"></span></summary><p>{a}</p></details>' for q, a in p["faq"])
    i = POSTS.index(p)
    nxt = POSTS[(i + 1) % len(POSTS)]
    rel = [x for x in POSTS if x is not p and x is not nxt and x["cat"] == p["cat"]] + [x for x in POSTS if x is not p and x is not nxt and x["cat"] != p["cat"]]
    svc = next((s for s in C.SERVICES if s["key"] == CAT_SVC.get(p["cat"])), C.SERVICES[0])
    cover = wurl(p["cover"])
    webp(p["cover"])
    schema = [
        {"@context": "https://schema.org", "@type": "BlogPosting", "headline": plain(p["title"]), "description": p["description"],
         "image": f'{S["url"]}/{cover}', "datePublished": p["date"], "dateModified": p["date"], "inLanguage": "en",
         "wordCount": words(p), "articleSection": CATS[p["cat"]], "mainEntityOfPage": url,
         "author": {"@type": "Organization", "name": plain(PG["blog-page"]["author"]), "url": S["url"]},
         "publisher": {"@type": "Organization", "name": "OXE Marketing", "logo": {"@type": "ImageObject", "url": S["url"] + "/" + S["org_logo"]}}},
        {"@context": "https://schema.org", "@type": "FAQPage",
         "mainEntity": [{"@type": "Question", "name": plain(q), "acceptedAnswer": {"@type": "Answer", "text": plain(a)}} for q, a in p["faq"]]},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": S["url"] + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": S["url"] + "/blog"},
            {"@type": "ListItem", "position": 3, "name": plain(p["title"]), "item": url}]},
    ]
    return head(f'{plain(p["title"])} | OXE Marketing', p["description"], f'blog/{p["slug"]}.html', og=cover, schema=schema, og_type="article") + f'''
  <section class="phero ahero">
    <div class="container">
      <div class="phero__panel">
        <span class="phero__glow phero__glow--a" aria-hidden="true"></span>
        <span class="phero__glow phero__glow--b" aria-hidden="true"></span>
        <div class="phero__copy">
          <nav class="phero__crumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="blog.html">Blog</a><span aria-hidden="true">/</span><a href="blog.html?cat={p["cat"]}" aria-current="page">{CATS[p["cat"]]}</a></nav>
          <h1 class="split">{split_words(p["title"])}</h1>
          <p class="lead ahero__lead">{p["excerpt"]}</p>
          <div class="ahero__meta">
            <span class="ahero__by"><img src="{S["favicon"]}" alt="" width="36" height="36">{PG["blog-page"]["author"]}</span>
            <span><time datetime="{p["date"]}">{nice_date(p["date"])}</time></span>
            <span>{read_min(p)} min read</span>
          </div>
        </div>
      </div>
      <figure class="acover" data-scrub="enter">{img(p["cover"], plain(p["title"]), lazy=False)}</figure>
    </div>
  </section>

  <section class="section section--flush">
    <div class="container alayout">
      <aside class="arail">
        <div class="arail__in">
          <div class="aprog" data-min="{read_min(p)}" aria-hidden="true">{RING}<span><b data-prog>0%</b> read<small data-left>{read_min(p)} min left</small></span></div>
          <nav class="atoc" aria-label="In this article">
            <p class="atoc__label">{PG["blog-page"]["contents_label"]}</p>
            <ol>{toc}<li><a href="#faq">FAQ</a></li></ol>
          </nav>
        </div>
      </aside>
      <article class="prose" data-article>
        {body}
        <div class="acta reveal">
          <span class="acta__mark" aria-hidden="true">{ART[svc["art"]]}</span>
          <div>
            <p class="acta__eb">{PG["blog-page"]["help_eyebrow"]}</p>
            <p class="acta__h">{svc["title"]} by OXE</p>
            <p>{svc["short"]}</p>
          </div>
          {btn(PG["blog-page"]["help_button"], "contact.html?service=" + svc["key"])}
        </div>
        <section class="afaq" id="faq" aria-labelledby="faq-h">
          <h2 id="faq-h">{PG["blog-page"]["faq_title"]}</h2>
          {faq}
        </section>
        <footer class="afoot">
          <span class="ahero__by"><img src="{S["favicon"]}" alt="" width="36" height="36"><span><b>{PG["blog-page"]["author"]}</b><small>{PG["blog-page"]["author_line"]}</small></span></span>
          <a class="link-arrow" href="services.html#{svc["key"]}">Explore {plain(svc["title"])} {ARR}</a>
        </footer>
      </article>
    </div>
  </section>

  <section class="section anext-sec">
    <div class="container">
      <a class="anext" href="blog/{nxt["slug"]}.html" data-scrub="enter">
        <div class="anext__copy">
          <p class="anext__eb">{PG["blog-page"]["next_label"]}</p>
          <p class="anext__cat">{CATS[nxt["cat"]]} · {read_min(nxt)} min read</p>
          <h2>{nxt["title"]}</h2>
          <span class="anext__go" aria-hidden="true">{ARR}</span>
        </div>
        <div class="anext__media">{img(nxt["cover"], "")}</div>
      </a>
    </div>
  </section>

  <section class="section section--flush">
    <div class="container">
      <div class="sec-row">
        {sec_head(PG["blog-page"]["more_eyebrow"], PG["blog-page"]["more_title"])}
        <div class="reveal">{btn(PG["blog-page"]["more_button"], "blog.html")}</div>
      </div>
      <div class="bgrid">{"".join(bitem(x) for x in rel[:3])}
      </div>
    </div>
  </section>
{contact_band()}''' + foot()


def latest_insights():
    return f'''
  <section class="section" id="insights">
    <div class="container">
      <div class="sec-row">
        {sec_head(PG["home"]["insights_eyebrow"], C.HOME["insights_title"], C.HOME["insights_text"])}
        <div class="reveal">{btn(PG["home"]["insights_button"], "blog.html")}</div>
      </div>
      <div class="bgrid">{"".join(bitem(x) for x in POSTS[:3])}
      </div>
    </div>
  </section>'''


# ------------------------------------------------------------------ write
REL = re.compile(r'(\s(?:href|src|poster)=")(?!https?:|mailto:|tel:|#|data:|/)([^"]*)"')


def write(path, html):
    depth = path.count("/")
    if depth:  # pages in sub-folders: make relative URLs point back to the root
        html = REL.sub(lambda m: f'{m.group(1)}{"../" * depth}{m.group(2)}"', html)
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(html)
    print("wrote", path)


def sitemap(paths):
    urls = "".join(f"  <url><loc>{S['url']}/{'' if p == 'index.html' else p.replace('.html', '')}</loc></url>\n" for p in paths)
    with open(os.path.join(ROOT, "sitemap.xml"), "w") as fh:
        fh.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')


if __name__ == "__main__":
    pages = {"index.html": home, "services.html": services, "portfolio.html": portfolio, "about.html": about, "blog.html": blog, "contact.html": contact}
    for name, fn in pages.items():
        write(name, fn())
    for p in C.PROJECTS:
        write(f'work/{p["id"]}.html', case(p))
    for p in POSTS:
        write(f'blog/{p["slug"]}.html', post(p))
    ty, nf = T["thank_you"], T["not_found"]
    write("thank-you.html", simple("thank-you.html", ty["title"], ty["heading"], ty["text"]))
    write("404.html", simple("404.html", nf["title"], nf["heading"], nf["text"]))
    sitemap(list(pages) + [f'work/{p["id"]}.html' for p in PORT] + [f'blog/{p["slug"]}.html' for p in POSTS])
