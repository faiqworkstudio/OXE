"""Static site generator for oxemarketingth.com.

    python3 src/build.py

Reads copy/data from content.py, icons from icons.py and the 3D illustration
set from art.py, and writes the HTML pages to the repository root (plus one
case-study page per project in /work). Each section function below maps to
one Elementor section when the site is rebuilt in WordPress.
"""
import os, re, json
from PIL import Image
from icons import I
from art import ART, DEFS
import content as C, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "assets/img/work")
S = C.SITE
CUR = ' aria-current="page"'
ARR = I["arrow"]
PBY = {p["id"]: p for p in C.PROJECTS}


def has_media(p):
    return bool(p.get("video") or (p["cover"] and not p["cover"].startswith("logo:") and not p.get("logo")))


# Portfolio order: projects with real photos/video first; the rest sit behind "View More"
PORT = sorted(C.PROJECTS, key=lambda p: not has_media(p))
VISIBLE = 9


def ver(path):
    """Content hash for cache-busting ?v= query strings."""
    return hashlib.md5(open(os.path.join(ROOT, path), "rb").read()).hexdigest()[:8]


# ------------------------------------------------------------------ helpers
def webp(name):
    """Return the .webp path for a work image, converting from .jpg on first use."""
    src = os.path.join(IMG_DIR, name + ".jpg")
    dst = os.path.join(IMG_DIR, name + ".webp")
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        im = Image.open(src).convert("RGB")
        if im.width > 1600:
            im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
        im.save(dst, "WEBP", quality=80, method=6)
    return dst


def img(name, alt="", cls="", lazy=True, sizes=""):
    w, h = Image.open(webp(name)).size
    return (f'<img src="assets/img/work/{name}.webp" alt="{alt}" width="{w}" height="{h}"'
            f'{f" class={chr(34)}{cls}{chr(34)}" if cls else ""}{" loading=" + chr(34) + "lazy" + chr(34) if lazy else ""} decoding="async">')


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
    return f'<a class="btn btn--{kind}" href="{href}"{x}>{label}{" " + ARR if arrow else ""}</a>'


def devices(screen, phone=None, alt=""):
    """Laptop + phone device mockup (CSS 3D)."""
    phone = phone or screen
    return f'''<div class="devices" role="img" aria-label="{alt}">
          <div class="dev-laptop"><div class="dev-laptop__lid"><div class="dev-laptop__screen">{img(screen)}</div></div><div class="dev-laptop__base"></div></div>
          <div class="dev-phone"><div class="dev-phone__screen">{img(phone)}</div></div>
        </div>'''


# ------------------------------------------------------------------ layout
def head(title, desc, page, og="assets/img/og-image.jpg", schema=None, noindex=False):
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
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="OXE Marketing">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{canon}">
  <meta property="og:image" content="{S['url']}/{og}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/png" href="assets/img/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
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
  <div class="container site-header__inner">
    {brand()}
    <nav class="nav" id="site-nav" aria-label="Main">
      <div class="nav__links">
{nav}
      </div>
      <a href="contact.html" class="btn btn--primary btn--sm nav__cta">Book a Consultation</a>
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


def mega_nav(page):
    """Top navigation. Each item opens a full-width panel: title, numbered section links and a visual."""
    out = ""
    for n, (h, t) in enumerate(C.NAV, 1):
        cur = CUR if h == page or (page.startswith("work/") and h == "portfolio.html") else ""
        eb, intro, _ = C.MENU_META[h]
        links = "".join(f'<li><a href="{href}"><span class="mega__num">{i:02d}</span><span class="mega__label">{label}</span>{ARR}</a></li>'
                        for i, (href, label) in enumerate(C.MENU[h], 1))
        out += f'''
        <div class="nav__item">
          <a class="nav__link" href="{h}"{cur}><span class="nav__num">{n:02d}</span>{t}</a>
          <div class="mega">
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
        </div>'''
    return out


def brand(white=False):
    return f'''<a class="brand" href="index.html" aria-label="OXE Marketing, home">
      <img src="assets/img/oxe-wordmark{'-white' if white else ''}.png" alt="" width="243" height="100">
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
        <p>{C.HERO["text"]}</p>
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
      <span>© <span data-year>2026</span> OXE Marketing. All rights reserved.</span>
      <span>Better ideas. Bigger impact.</span>
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
          {eyebrow("Get in touch")}
          <h2>Let's create something great together.</h2>
          <p>Whether you're looking to build a new website, grow your brand through social media, or create professional photo and video content, we're here to help.</p>
          {btn("Book a Consultation", "contact.html", "white")}
        </div>
        {contact_buttons("cbtns--band")}
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
        w, h = Image.open(os.path.join(ROOT, "assets/img/clients", f + ".webp")).size
        return f'<img src="assets/img/clients/{f}.webp" alt="{alt}" width="{w}" height="{h}" loading="lazy">'
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
        webp(v + "-poster")
        return (f'<video muted loop playsinline autoplay preload="metadata" poster="assets/img/work/{v}-poster.webp" aria-label="{alt}">'
                f'<source src="assets/video/{v}.mp4" type="video/mp4"></video>')
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
            webp(name + "-poster")
            body = f'<video controls muted loop playsinline{" autoplay" if n == 0 else ""} preload="{"metadata" if n == 0 else "none"}" poster="assets/img/work/{name}-poster.webp"><source src="assets/video/{name}.mp4" type="video/mp4">Your browser does not support video.</video>'
            th = f'<img src="assets/img/work/{name}-poster.webp" alt="" loading="lazy"><span class="play" aria-hidden="true"></span>'
            label = f"Play the {who} video"
        elif kind == "device":
            body = f'<div class="viewer__device">{devices(name, p.get("mobile"), alt=who + " website on laptop and phone")}</div>'
            th = f'<img src="assets/img/work/{name}.webp" alt="" loading="lazy">'
            label = "Show the website on laptop and phone"
        else:
            body = img(name, f"{who} project by OXE Marketing, image {n + 1}", lazy=n > 0)
            th = f'<img src="assets/img/work/{name}.webp" alt="" loading="lazy">'
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
        w, h = Image.open(os.path.join(ROOT, "assets/img/clients", f + ".webp")).size
        kind = "wide" if w / h > 1.6 else "badge"
        cells += f'<li class="logo-cell logo-cell--{kind}"><img src="assets/img/clients/{f}.webp" alt="{plain(name) if name else ""}" width="{w}" height="{h}" loading="lazy" decoding="async"></li>'
    # pad the grid to a multiple of 6 (and so of 2 and 3) so no cell is left open
    cells += '<li class="logo-cell logo-cell--blank" aria-hidden="true"></li>' * ((-len(C.CLIENTS)) % 6)
    return f'''
  <section class="section clients-wall{" section--tint" if tint else ""}" id="clients" aria-labelledby="clients-title">
    <div class="container">
      <ul class="logo-wall reveal">
        <li class="logo-wall__feature">
          {eyebrow("Clients &amp; partners")}
          <h2 id="clients-title">Trusted by brands across <span class="hl">Thailand</span> and beyond</h2>
          <p>From global technology names to local favourites, these are some of the businesses we've worked with.</p>
          <a class="btn btn--navy" href="contact.html">Book a Consultation <span aria-hidden="true">»</span></a>
        </li>{cells}
      </ul>
    </div>
  </section>'''


BRANDS_H2 = "Brands we've <span class=\"hl\">worked with</span>"


def clients_marquee():
    """Home: two rows of client logos scrolling in opposite directions."""
    def tile(f, name):
        w, h = Image.open(os.path.join(ROOT, "assets/img/clients", f + ".webp")).size
        return f'<li><img src="assets/img/clients/{f}.webp" alt="{plain(name) if name else ""}" width="{w}" height="{h}" loading="lazy"></li>'
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


def works_cards():
    """Home "Our Works": one card per portfolio category, linking to the filtered portfolio."""
    out = ""
    for key, title, cover in C.WORK_CATEGORIES:
        n = sum(key in p["cat"].split() for p in C.PROJECTS)
        out += f'''
          <a class="wcard reveal" href="portfolio.html?filter={key}" aria-label="{plain(title)}: view {n} projects">
            <div class="wcard__head"><h3>{title}</h3><span class="wcard__count">{n:02d}</span></div>
            <div class="wcard__stack">
              <div class="wcard__img">{img(cover, "")}</div>
              <span class="wcard__notch" aria-hidden="true"><span class="wcard__btn">{ARR}</span></span>
            </div>
          </a>'''
    return out


def principle_list(items):
    return "".join(f'<li><span class="ico">{I[i]}</span><div><h3>{t}</h3><p>{d}</p></div></li>' for i, t, d in items)


# ------------------------------------------------------------------ HOME
def org_schema():
    return {"@context": "https://schema.org", "@type": "ProfessionalService", "name": S["name"], "url": S["url"],
            "logo": S["url"] + "/assets/img/oxe-logo.png", "image": S["url"] + "/assets/img/og-image.jpg",
            "email": S["email"], "telephone": S["phone_tel"], "foundingDate": S["founded"],
            "address": {"@type": "PostalAddress", "addressLocality": "Bangkok", "addressCountry": "TH"},
            "areaServed": "Thailand", "description": C.HERO["text"],
            "knowsAbout": ["Website design", "Social media marketing", "Video production", "Photography", "Digital strategy"]}


HERO_LOGOS = [("xiaomi", "Xiaomi"), ("oppo", "OPPO"), ("netflix", "Netflix"), ("rockers", "Rockers"), ("michael-tailors", "Michael Tailors")]


HERO_STRIP = [("wirever", "Wirever"), ("the-continent", "The Continent"), ("minor-international", "Minor International"), ("dh-foods", "Dh Foods")]


def hero_visual():
    ppl = "".join(f'<li><img src="assets/img/clients/{f}.webp" alt=""><small>{n}</small></li>' for f, n in HERO_LOGOS)
    return f'''<div class="hv" aria-hidden="true">
        <span class="hv__blob hv__blob--a"></span>
        <span class="hv__blob hv__blob--b"></span>
        <svg class="hv__arrow" viewBox="0 0 200 220" fill="none"><path d="M190 20C120 -5 40 30 22 120" stroke="#0f2b50" stroke-width="5" stroke-linecap="round"/><path d="M4 96l18 28 24-22" stroke="#0f2b50" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <svg class="hv__arc" viewBox="0 0 60 300" fill="none"><path d="M10 6c40 70 44 200-4 288" stroke="#0f2b50" stroke-width="5" stroke-linecap="round"/></svg>
        <img class="hv__person" src="assets/img/work/hero-person.png" alt="" width="678" height="1078">
        <div class="hv__card hv__chip"><span class="hv__ico">{I["monitor"]}</span>Websites that bring enquiries</div>
        <div class="hv__card hv__stat"><span class="hv__ico hv__ico--round">{I["camcorder"]}</span><b>Since 2020</b><span>Creating content in Bangkok</span><small>{I["check"]} 5 core services</small></div>
        <div class="hv__card hv__clients"><b>Brands we work with</b><small>Tech, food, retail &amp; lifestyle</small><ul>{ppl}</ul></div>
      </div>'''


def home():
    cards = "".join(f'''
        <a class="svc-card reveal" href="services.html#{s["key"]}">
          <div class="svc-card__top"><span class="num">{s["num"]}</span><span class="svc-card__art">{ART[s["art"]]}</span></div>
          <h3>{s["title"]}</h3>
          <p>{s["short"]}</p>
          <span class="svc-card__go">Learn more {ARR}</span>
        </a>''' for s in C.SERVICES)
    return head("OXE Marketing | Digital Marketing Agency in Bangkok",
                "Multicultural digital marketing agency in Bangkok: website design, social media marketing, video production, photography and digital strategy.",
                "index.html", schema=org_schema()) + f'''
  <section class="hero">
    <div class="container hero__inner">
      <div class="hero__copy">
        <p class="hero__tag"><b>OXE</b><em>Marketing agency in Bangkok</em></p>
        <h1>Helping businesses build a stronger <span class="hero__mark">digital presence</span> in a connected world.</h1>
        <p class="lead">{C.HERO["text"]}</p>
        <div class="hero__actions">
          {btn("Book a Consultation", "contact.html")}
          <div class="hero__proof">
            <div class="hero__logos">{"".join(f'<img src="assets/img/clients/{f}.webp" alt="{n}" width="44" height="44">' for f, n in HERO_LOGOS[:3])}<span>20+</span></div>
            <p>Brands across Thailand<br>work with OXE</p>
          </div>
        </div>
      </div>
      {hero_visual()}
    </div>
    <div class="container">
      <ul class="hero__brands" aria-label="Some of our clients">{"".join(f'<li><img src="assets/img/clients/{f}.webp" alt="{n}" loading="lazy"></li>' for f, n in HERO_STRIP)}</ul>
    </div>
  </section>

  <section class="section" id="services">
    <div class="container">
      <div class="sec-row">
        {sec_head("What we do", 'Our <span class="hl">Services</span>', "We offer a full range of digital marketing services to help your brand grow, engage your audience, and achieve real results.")}
        <a class="link-arrow reveal" href="services.html">All services {ARR}</a>
      </div>
      <div class="svc-cards">{cards}
      </div>
    </div>
  </section>

  <section class="section why" id="why">
    <div class="container why__inner">
      <div class="why__visual reveal">
        <figure class="why__photo">{img("bts-video-1", "The OXE Marketing crew filming a corporate interview in Bangkok")}</figure>
        <figure class="why__photo2">{img("about-team", "Laptop and camera set up in a Bangkok studio")}</figure>
      </div>
      <div class="why__copy">
        {sec_head("Why OXE", C.WHY["title"], C.WHY["text"])}
        <ul class="principles reveal">{principle_list(C.WHY["principles"])}</ul>
      </div>
    </div>
  </section>

  <section class="section works-sec" id="work">
    <div class="container">
      <div class="works">
        <div class="works__head reveal">
          <h2>Our Works</h2>
          <p>Explore the websites, campaigns and visual content we've created in partnership with brands across Thailand.</p>
        </div>
        <div class="works__grid">{works_cards()}
        </div>
      </div>
    </div>
  </section>

{clients_wall()}
{contact_band()}''' + foot()


def collage(imgs, alts):
    """Three-photo collage used as the visual in page heroes."""
    return '<div class="collage">' + "".join(f'<figure>{img(i, a, lazy=False)}</figure>' for i, a in zip(imgs, alts)) + '</div>'


def page_hero(eb, h1, lead, visual="", after="", cls=""):
    """One hero layout for every inner page: same background, type scale and spacing."""
    return f'''
  <section class="page-hero{" page-hero--split" if visual else ""} {cls}">
    <div class="container page-hero__inner">
      <div class="page-hero__copy reveal">
        {eyebrow(eb)}
        <h1>{h1}</h1>
        <p class="lead">{lead}</p>
        {after}
      </div>
      {f'<div class="page-hero__visual reveal">{visual}</div>' if visual else ""}
    </div>
  </section>'''


# ------------------------------------------------------------------ SERVICES
def service_media(s):
    """Several videos playing together, or a crossfading slideshow of images."""
    title = plain(s["title"])
    if s.get("videos"):
        tiles = ""
        for v, client in s["videos"]:
            webp(v + "-poster")
            tiles += (f'<figure class="vwall__item"><video muted loop playsinline autoplay preload="metadata" poster="assets/img/work/{v}-poster.webp" '
                      f'aria-label="{plain(client)} video by OXE Marketing"><source src="assets/video/{v}.mp4" type="video/mp4"></video>'
                      f'</figure>')
        return f'<div class="vwall" data-vwall>{tiles}</div>'
    slides, dots = "", ""
    for i, name in enumerate(s["slides"]):
        if name.startswith("device:"):
            p = next(p for p in C.PROJECTS if p["cover"] == name[7:])
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
      <article class="svc-block{" svc-block--rev" if n % 2 else ""}" id="{s["key"]}">
        <div class="svc-block__visual reveal">
          {service_media(s)}
        </div>
        <div class="svc-block__body reveal">
          <div class="svc-block__head">
            <span class="svc-block__mark" aria-hidden="true">{ART[s["art"]]}</span>
            <h2>{s["title"]}</h2>
          </div>
          <p class="lead">{s["intro"]}</p>
          <h3 class="svc-block__label">What we do</h3>
          <ul class="svc-block__list">{what}</ul>
          <div class="btn-row">
            {btn("Book a Consultation", "contact.html?service=" + s["key"])}
            {btn("See related work", "portfolio.html", "text")}
          </div>
        </div>
      </article>'''
    ind = "".join(f'<li class="ind-tile reveal">{img(im, t + " industry")}<span>{t}</span></li>' for t, im in C.INDUSTRIES)
    return head("Services | Website Design, Video & Social Media in Bangkok | OXE Marketing",
                "Website design & development, social media marketing, video production, photography and digital strategy for businesses in Bangkok and across Thailand.",
                "services.html") + f'''
{page_hero("Our services", 'Turn your ideas into <span class="hl">impact</span>', "Strategic marketing, creative content and measurable results: five services, one team, planned around your goals.",
           collage(["shoot-1", "haji-strawberry", "bts-video-1"], ["Rockers Supercars shoot", "Haji Café social media design", "Corporate video shoot"]),
           f'<nav class="jump" aria-label="Services on this page">{jump}</nav>')}

  <section class="section section--flush">
    <div class="container">{blocks}
    </div>
  </section>

  <section class="section section--tint" id="industries">
    <div class="container">
      {sec_head("Industries", 'Industries We <span class="hl">Worked With</span>', "Experience across local businesses and international brands in Thailand.")}
      <ul class="ind-grid">{ind}</ul>
    </div>
  </section>
{contact_band()}''' + foot()


# ------------------------------------------------------------------ PORTFOLIO
def portfolio():
    fb = "".join(f'<button class="filter-btn{" is-active" if k == "all" else ""}" type="button" data-filter="{k}" aria-pressed="{"true" if k == "all" else "false"}">{t}</button>' for k, t in C.FILTERS)
    cards = "".join(project_card(p, extra=n >= VISIBLE) for n, p in enumerate(PORT))
    return head("Portfolio | OXE Marketing Bangkok",
                "Selected work by OXE Marketing: websites, video production, social media and photography for brands including Xiaomi, OPPO and Rockers Supercars.",
                "portfolio.html") + f'''
{page_hero("Our work", 'Our <span class="hl">Portfolio</span>', "A collection of projects we're proud to share. Each one tells a story of collaboration, creativity, and results.",
           after=f'<div class="filters" role="group" aria-label="Filter projects by category">{fb}</div>')}

  <section class="section section--flush">
    <div class="container">
      <div class="pgrid" data-projects>{cards}
      </div>
      <p class="filter-empty" hidden>No projects in this category yet.</p>
      <div class="more-wrap"><button class="btn btn--outline" type="button" data-more>View More Projects</button></div>
    </div>
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
        <h2>Services provided</h2>
        <ul class="checks">{svc}</ul>
        {btn("Start a similar project", "contact.html")}
      </aside>
    </div>
  </section>
  <section class="section section--flush">
    <div class="container">
      <a class="next-project reveal" href="work/{nxt["id"]}.html">
        <small>Next project</small>
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
            body = f'{img("bts-video-1", "OXE Marketing crew on set during a corporate video shoot")}<div class="bento__overlay">{num}<h3>{t}</h3><p>{d}</p></div>'
        elif area == "g":
            body = f'{num}<b class="bento__year" aria-hidden="true">2020</b><h3>{t}</h3><p>{d}</p>'
        else:
            body = f'<span class="ico">{I[ico]}</span>{num}<h3>{t}</h3><p>{d}</p>'
        cells += f'\n        <li class="bento__cell bento__cell--{area} reveal">{body}</li>'
    return f'<ul class="bento">{cells}\n      </ul>'


def about():
    facts = "".join(f"<li><b>{a}</b><span>{b}</span></li>" for a, b in C.ABOUT["facts"])
    story = "".join(f"<p>{t}</p>" for t in C.ABOUT["story"])
    return head("About Us | OXE Marketing, Multicultural Agency in Bangkok",
                "OXE Marketing is an ASEAN-based multicultural creative and digital agency headquartered in Bangkok, founded in 2020.",
                "about.html") + f'''
{page_hero("About us", 'A multicultural team with a <span class="hl">shared vision</span>', C.ABOUT["positioning"] + " " + C.ABOUT["intro"],
           collage(["bts-video-2", "about-team", "cake-strawberry"], ["OXE crew on a video shoot in Bangkok", "Laptop and camera in a Bangkok studio", "Dessert photography by OXE"]))}

  <section class="facts-wrap">
    <div class="container"><ul class="facts reveal">{facts}</ul></div>
  </section>

  <section class="section" id="mission">
    <div class="container mv">
      <article class="mv__card reveal">
        <span class="mv__art" aria-hidden="true">{ART["strategy"]}</span>
        {eyebrow("Our mission")}
        <p>{C.ABOUT["mission"]}</p>
      </article>
      <article class="mv__card mv__card--blue reveal">
        <span class="mv__art" aria-hidden="true">{ART["analytics"]}</span>
        {eyebrow("Our vision")}
        <p>{C.ABOUT["vision"]}</p>
      </article>
    </div>
  </section>

  <section class="section section--tint" id="story">
    <div class="container story">
      <div>
        {sec_head("Our story", 'Creative and digital marketing, <span class="hl">since 2020</span>')}
        <div class="reveal">{story}</div>
      </div>
      <div class="mosaic reveal">
        {img("shoot-1", "Rockers Supercars showroom shoot by OXE Marketing")}
        {img("cake-strawberry", "Dessert photography by OXE Marketing for Haji Café")}
        {img("wirever-lifestyle", "Product photography by OXE Marketing for Wirever")}
      </div>
    </div>
  </section>

  <section class="section" id="why-oxe">
    <div class="container">
      {sec_head("Why companies choose OXE", 'Your all-in-one <span class="hl">marketing partner</span>')}
      {bento()}
    </div>
  </section>

{clients_wall()}
{contact_band()}''' + foot()


# ------------------------------------------------------------------ CONTACT
def form():
    keys = {"Website Design &amp; Development": "web", "Social Media Marketing": "social", "Video Production": "video",
            "Photography": "photo", "Branding &amp; Creative Design": "strategy"}
    svc = "".join(f'<option data-key="{keys.get(s, "")}">{s}</option>' for s in C.SERVICE_OPTIONS)
    bud = "".join(f"<option>{b}</option>" for b in C.BUDGETS)

    def label(id_, text, req):
        return f'<label for="{id_}">{text}{"" if req else " <em>Optional</em>"}</label>'

    def field(id_, name, text, typ="text", req=False, ac="", err=""):
        return f'''<div class="field">
              {label(id_, text, req)}
              <input id="{id_}" name="{name}" type="{typ}"{f' autocomplete="{ac}"' if ac else ""}{" required" if req else ""}{f' aria-describedby="{id_}-err"' if err else ""}>
              {f'<span class="error" id="{id_}-err">{err}</span>' if err else ""}
            </div>'''
    return f'''<div class="form-card reveal" id="enquiry">
        <h2>Send us a message</h2>
        <form name="contact" method="POST" action="thank-you.html" data-netlify="true" netlify-honeypot="bot-field" data-contact-form novalidate>
          <input type="hidden" name="form-name" value="contact">
          <p hidden><label>Don't fill this out: <input name="bot-field"></label></p>
          <div class="form-grid">
            {field("f-name", "name", "Name", req=True, ac="name", err="Please enter your name.")}
            {field("f-email", "email", "Email", "email", True, "email", "Please enter a valid email address.")}
            {field("f-phone", "phone", "Phone", "tel", ac="tel")}
            {field("f-company", "company", "Company", ac="organization")}
            <div class="field">
              {label("f-service", "Service", True)}
              <select id="f-service" name="service" required aria-describedby="f-service-err">
                <option value="" selected disabled>Choose one</option>
                {svc}
              </select>
              <span class="error" id="f-service-err">Please choose a service.</span>
            </div>
            <div class="field">
              {label("f-budget", "Budget", False)}
              <select id="f-budget" name="budget">
                <option value="" selected>Choose a range</option>
                {bud}
              </select>
            </div>
            <div class="field field--full">
              {label("f-details", "Project details", True)}
              <textarea id="f-details" name="details" rows="5" required aria-describedby="f-details-err"></textarea>
              <span class="error" id="f-details-err">Please tell us a little about your project.</span>
            </div>
            <fieldset class="field field--full">
              <legend>Reply by</legend>
              <div class="segmented">
                <label><input type="radio" name="method" value="Email" checked><span>Email</span></label>
                <label><input type="radio" name="method" value="Phone"><span>Phone</span></label>
                <label><input type="radio" name="method" value="WhatsApp"><span>WhatsApp</span></label>
              </div>
            </fieldset>
          </div>
          <button type="submit" class="btn btn--navy form-submit">Send message {ARR}</button>
          <div class="form-success" role="status" aria-live="polite">Thank you! Your message has been sent. Our team will get back to you shortly.</div>
        </form>
      </div>'''


CONTACT_H1 = "Let's create something <span class=\"hl\">great together.</span>"


def contact():
    return head("Contact OXE Marketing | Digital Marketing Agency Bangkok",
                f"Contact OXE Marketing in Bangkok: email {S['email']}, call {S['phone_display']} or message us on WhatsApp to discuss your project.",
                "contact.html", schema=org_schema()) + f'''
  <section class="page-hero contact-hero">
    <div class="container contact-grid">
      <div class="page-hero__copy contact-intro reveal">
        {eyebrow("Get in touch")}
        <h1>{CONTACT_H1}</h1>
        <p class="lead">Whether you're looking to build a new website, grow your brand through social media, or create professional photo and video content, we're here to help.</p>
        <div id="methods">{contact_buttons()}</div>
        <p class="contact-loc">{I["pin2"]} {S["city"]}</p>
      </div>
      {form()}
    </div>
  </section>

  <section class="section section--flush" id="map">
    <div class="container">
      <div class="map reveal">
        <iframe title="Map showing Bangkok, Thailand" src="https://www.google.com/maps?q=Bangkok,Thailand&amp;z=11&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
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
    pages = {"index.html": home, "services.html": services, "portfolio.html": portfolio, "about.html": about, "contact.html": contact}
    for name, fn in pages.items():
        write(name, fn())
    for p in C.PROJECTS:
        write(f'work/{p["id"]}.html', case(p))
    write("thank-you.html", simple("thank-you.html", "Thank You", "Thank you! Message received.", "Our team will get back to you as soon as possible. Need a faster reply? Message us on WhatsApp."))
    write("404.html", simple("404.html", "Page Not Found", "Sorry, we couldn't find that page.", "The page may have moved. Head back home or explore our work."))
    sitemap(list(pages) + [f'work/{p["id"]}.html' for p in PORT])
