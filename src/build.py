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
    nav = "\n".join(f'        <a href="{h}"{CUR if h == page or (page.startswith("work/") and h == "portfolio.html") else ""}>{t}</a>' for h, t in C.NAV)
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

<a class="wa-float" href="{S['whatsapp']}" target="_blank" rel="noopener" aria-label="Chat with OXE Marketing on WhatsApp">{I["whatsapp"]}</a>
<script src="assets/js/main.js?v={ver("assets/js/main.js")}" defer></script>
</body>
</html>
'''


def contact_band():
    items = contact_methods()
    return f'''
  <section class="contact-band">
    <div class="container">
      <div class="contact-band__inner reveal">
        <span class="shape shape--sphere cb-s1" aria-hidden="true"></span>
        <span class="shape shape--ring cb-s2" aria-hidden="true"></span>
        <div class="contact-band__copy">
          {eyebrow("Get in touch")}
          <h2>Let's create something great together.</h2>
          <p>Whether you're looking to build a new website, grow your brand through social media, or create professional photo and video content, we're here to help.</p>
          <div class="btn-row">
            {btn("Book a Consultation", "contact.html", "white")}
            {btn(I["whatsapp"] + " WhatsApp Us", S["whatsapp"], "glass", arrow=False, ext=True)}
          </div>
        </div>
        <ul class="contact-band__list">{items}</ul>
      </div>
    </div>
  </section>
'''


def contact_methods():
    rows = [("whatsapp", "WhatsApp", f'<a href="{S["whatsapp"]}" target="_blank" rel="noopener">{S["phone_display"]}</a>'),
            ("mail2", "Email", f'<a href="mailto:{S["email"]}">{S["email"]}</a>'),
            ("phone2", "Phone", f'<a href="tel:{S["phone_tel"]}">{S["phone_display"]}</a>'),
            ("pin2", "Location", f'<span>{S["city"]}</span>')]
    return "".join(f'<li><span class="ico">{I[i]}</span><div><small>{t}</small>{v}</div></li>' for i, t, v in rows)


# ------------------------------------------------------------------ shared components
def project_media(p, big=False):
    """Visual for a project card or case-study header."""
    alt = f'{plain(p["client"])}: {plain(p["title"])} by OXE Marketing'
    if p.get("device"):
        return f'<div class="media-stage">{devices(p["cover"], alt=alt)}</div>'
    if p.get("logo"):
        return f'<div class="media-logo">{img(p["cover"], plain(p["client"]) + " logo")}</div>'
    if not p["cover"]:
        return f'<div class="media-placeholder" role="img" aria-label="{plain(p["client"])}">{ART["web"]}<span>{p["client"]}</span></div>'
    return img(p["cover"], alt, lazy=not big)


def project_card(p, h="h3"):
    play = '<span class="play" aria-hidden="true"></span>' if p.get("video") else ""
    return f'''
        <article class="pcard reveal" data-category="{p["cat"]}"{" data-extra" if p.get("extra") else ""}>
          <div class="pcard__media">{project_media(p)}{play}<span class="chip">{p["category"]}</span></div>
          <div class="pcard__body">
            <small>{p["client"]}</small>
            <{h}><a href="work/{p["id"]}.html">{p["title"]}</a></{h}>
            <p>{p["summary"]}</p>
            <span class="link-arrow" aria-hidden="true">View Project {ARR}</span>
          </div>
        </article>'''


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
  <section class="section clients-wall{" section--tint" if tint else ""}" aria-labelledby="clients-title">
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


def hero_scene():
    return f'''<div class="scene" aria-hidden="true">
        <span class="scene__glow"></span>
        <span class="shape shape--sphere sc-sphere"></span>
        <span class="shape shape--ring sc-ring"></span>
        <span class="shape shape--pill sc-pill"></span>
        <span class="shape shape--sphere sc-sphere2"></span>
        <div class="podium"><span class="podium__top"></span></div>
        <div class="sc-devices">{devices("tailor-website", "haji-strawberry")}</div>
        <div class="sc-camera float-a">{ART["photo"]}</div>
        <div class="glass sc-chart float-b">
          <small>Campaign overview</small>
          <svg viewBox="0 0 120 54"><path d="M4 46 C24 44 30 30 46 32 S74 18 86 16 S108 6 116 4" fill="none" stroke="#1f6fd1" stroke-width="3" stroke-linecap="round"/><path d="M4 46 C24 44 30 30 46 32 S74 18 86 16 S108 6 116 4 V54 H4Z" fill="#1f6fd1" opacity=".1"/></svg>
          <span class="legend"><i></i>Reach <i class="b"></i>Engagement</span>
        </div>
        <div class="glass sc-social float-c">{I["instagram"]}{I["facebook"]}{I["tiktok"]}<span class="heart">{I["heart"]}</span></div>
      </div>'''


def home():
    cards = "".join(f'''
        <a class="svc-card reveal" href="services.html#{s["key"]}">
          <div class="svc-card__top"><span class="num">{s["num"]}</span><span class="svc-card__art">{ART[s["art"]]}</span></div>
          <h3>{s["title"]}</h3>
          <p>{s["short"]}</p>
          <span class="svc-card__go">Learn more {ARR}</span>
        </a>''' for s in C.SERVICES)
    f = PBY[C.FEATURED]
    more = "".join(project_card(PBY[i]) for i in ["xiaomi-redmi-watch", "rockers-supercars", "haji-cafe"])
    tags = "".join(f"<li>{t}</li>" for t in f["tags"])
    return head("OXE Marketing | Digital Marketing Agency in Bangkok",
                "Multicultural digital marketing agency in Bangkok: website design, social media marketing, video production, photography and digital strategy.",
                "index.html", schema=org_schema()) + f'''
  <section class="hero">
    <div class="container hero__inner">
      <div class="hero__copy">
        {eyebrow(C.HERO["eyebrow"])}
        <h1>{C.HERO["title"]}</h1>
        <p class="lead">{C.HERO["text"]}</p>
        <div class="btn-row">
          {btn("View Portfolio", "portfolio.html")}
          {btn("Book a Consultation", "contact.html", "outline")}
        </div>
      </div>
      {hero_scene()}
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

  <section class="section why">
    <div class="container why__inner">
      <div class="why__visual reveal">
        <figure class="why__photo">{img("bts-video-1", "The OXE Marketing crew filming a corporate interview in Bangkok")}</figure>
        <figure class="why__photo2">{img("about-team", "Laptop and camera set up in a Bangkok studio")}</figure>
        <div class="glass why__chip float-b"><span class="ico">{I["pin2"]}</span><div><b>Bangkok, Thailand</b><small>Multicultural team since 2020</small></div></div>
        <div class="why__art float-a" aria-hidden="true">{ART["analytics"]}</div>
        <span class="shape shape--sphere why__sphere" aria-hidden="true"></span>
      </div>
      <div class="why__copy">
        {sec_head("Why OXE", C.WHY["title"], C.WHY["text"])}
        <ul class="principles reveal">{principle_list(C.WHY["principles"])}</ul>
      </div>
    </div>
  </section>

  <section class="section" id="work">
    <div class="container">
      <div class="sec-row">
        {sec_head("Featured work", 'Selected <span class="hl">Projects</span>', "From websites to social media, video, and photography, we've helped brands across different industries tell their stories and grow online.")}
        <a class="link-arrow reveal" href="portfolio.html">View full portfolio {ARR}</a>
      </div>
      <article class="feature reveal">
        <div class="feature__media">{devices("tailor-website", alt="Tailor website designed by OXE Marketing on a laptop and phone")}</div>
        <div class="feature__body">
          {eyebrow(f["category"])}
          <h3>{f["client"]}</h3>
          <p>{f["summary"]}</p>
          <dl class="feature__rows">
            <div><dt>Challenge</dt><dd>{f["challenge"]}</dd></div>
            <div><dt>Solution</dt><dd>{f["solution"]}</dd></div>
            <div><dt>Result</dt><dd>{f["outcome"]}</dd></div>
          </dl>
          <ul class="tags">{tags}</ul>
          {btn("View Case Study", "work/" + f["id"] + ".html")}
        </div>
      </article>
      <div class="pgrid pgrid--3">{more}
      </div>
    </div>
  </section>
{clients_wall()}
{contact_band()}''' + foot()


# ------------------------------------------------------------------ SERVICES
def services():
    jump = "".join(f'<a href="#{s["key"]}"><b>{s["num"]}</b>{s["title"]}</a>' for s in C.SERVICES)
    blocks = ""
    for n, s in enumerate(C.SERVICES):
        what = "".join(f"<li>{I['check']}{x}</li>" for x in s["what"])
        dl = "".join(f"<li>{I['check']}{x}</li>" for x in s["deliverables"])
        steps = "".join(f"<li><b>{i}</b>{x}</li>" for i, x in enumerate(s["process"], 1))
        blocks += f'''
      <article class="svc-block{" svc-block--rev" if n % 2 else ""}" id="{s["key"]}">
        <div class="svc-block__visual reveal">
          {img(s["img"], plain(s["title"]) + " by OXE Marketing")}
          <span class="svc-block__badge float-a" aria-hidden="true">{ART[s["art"]]}</span>
        </div>
        <div class="svc-block__body reveal">
          <span class="num">{s["num"]}</span>
          <h2>{s["title"]}</h2>
          <p class="lead">{s["intro"]}</p>
          <div class="svc-block__lists">
            <div><h3>What we do</h3><ul class="checks">{what}</ul></div>
            <div><h3>Deliverables</h3><ul class="checks">{dl}</ul></div>
          </div>
          <h3>Process</h3>
          <ol class="steps">{steps}</ol>
          <div class="btn-row">
            {btn("Book a Consultation", "contact.html?service=" + s["key"])}
            {btn("See related work", "portfolio.html", "text")}
          </div>
        </div>
      </article>'''
    ind = "".join(f'<li class="reveal"><span class="ico">{I[i]}</span>{t}</li>' for i, t in C.INDUSTRIES)
    return head("Services | Website Design, Video & Social Media in Bangkok | OXE Marketing",
                "Website design & development, social media marketing, video production, photography and digital strategy for businesses in Bangkok and across Thailand.",
                "services.html") + f'''
  <section class="page-hero">
    <div class="container page-hero__inner">
      <div>
        {sec_head("Our services", 'Turn Your Ideas Into <span class="hl">Impact</span>', "Strategic marketing. Creative content. Measurable results. Five services, one team, planned around your goals.", "h1")}
        <nav class="jump reveal" aria-label="Services on this page">{jump}</nav>
      </div>
      <div class="page-hero__art reveal" aria-hidden="true">
        <span class="scene__glow"></span>
        <div class="pa-main float-a">{ART["web"]}</div>
        <div class="pa-a float-b">{ART["video"]}</div>
        <div class="pa-b float-c">{ART["social"]}</div>
      </div>
    </div>
  </section>

  <section class="section section--flush">
    <div class="container">{blocks}
    </div>
  </section>

  <section class="section section--tint">
    <div class="container">
      {sec_head("Industries", 'Who We <span class="hl">Work With</span>', "Experience across local businesses and international brands in Thailand.")}
      <ul class="industries">{ind}</ul>
    </div>
  </section>
{contact_band()}''' + foot()


# ------------------------------------------------------------------ PORTFOLIO
def portfolio():
    fb = "".join(f'<button class="filter-btn{" is-active" if k == "all" else ""}" type="button" data-filter="{k}" aria-pressed="{"true" if k == "all" else "false"}">{t}</button>' for k, t in C.FILTERS)
    cards = "".join(project_card(p) for p in C.PROJECTS)
    return head("Portfolio | OXE Marketing Bangkok",
                "Selected work by OXE Marketing: websites, video production, social media and photography for brands including Xiaomi, OPPO and Rockers Supercars.",
                "portfolio.html") + f'''
  <section class="page-hero page-hero--compact">
    <div class="container">
      {sec_head("Our work", 'Our <span class="hl">Portfolio</span>', "A collection of projects we're proud to share. Each one tells a story of collaboration, creativity, and results.", "h1")}
      <div class="filters reveal" role="group" aria-label="Filter projects by category">{fb}</div>
    </div>
  </section>

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
    i = C.PROJECTS.index(p)
    nxt = C.PROJECTS[(i + 1) % len(C.PROJECTS)]
    svc = "".join(f"<li>{I['check']}{x}</li>" for x in p["services"])
    tags = "".join(f"<li>{t}</li>" for t in p["tags"])
    if p.get("video"):
        v = p["video"]
        webp(v + "-poster")
        media = f'<video class="case-video" controls playsinline preload="none" poster="assets/img/work/{v}-poster.webp"><source src="assets/video/{v}.mp4" type="video/mp4">Your browser does not support video.</video>'
    else:
        media = project_media(p, big=True)
    gal_imgs = ([p["cover"]] if p.get("video") and p["cover"] and not p.get("device") else []) + p["gallery"]
    gallery = ""
    if gal_imgs:
        gallery = f'''
  <section class="section section--flush">
    <div class="container">
      <h2 class="h-sm reveal">Project gallery</h2>
      <div class="gallery reveal">{"".join(f"<figure>{img(g, plain(p['client']) + ' project image by OXE Marketing')}</figure>" for g in gal_imgs)}</div>
    </div>
  </section>'''

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
          <h1>{p["title"]}</h1>
          <p class="lead">{p["summary"]}</p>
        </div>
        <dl class="case-meta reveal">
          <div><dt>Client</dt><dd>{p["client"]}</dd></div>
          <div><dt>Category</dt><dd>{p["category"]}</dd></div>
          <div><dt>Tags</dt><dd><ul class="tags">{tags}</ul></dd></div>
        </dl>
      </div>
      <div class="case-media reveal">{media}</div>
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
{gallery}
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
def about():
    facts = "".join(f"<li><b>{a}</b><span>{b}</span></li>" for a, b in C.ABOUT["facts"])
    story = "".join(f"<p>{t}</p>" for t in C.ABOUT["story"])
    choose = "".join(f'<li class="reveal"><span class="ico">{I[i]}</span><h3>{t}</h3><p>{d}</p></li>' for i, t, d in C.ABOUT["choose"])
    return head("About Us | OXE Marketing, Multicultural Agency in Bangkok",
                "OXE Marketing is an ASEAN-based multicultural creative and digital agency headquartered in Bangkok, founded in 2020.",
                "about.html") + f'''
  <section class="page-hero">
    <div class="container page-hero__inner about-hero">
      <div>
        {sec_head("About us", 'A multicultural team with a <span class="hl">shared vision</span>', C.ABOUT["positioning"], "h1")}
        <p class="muted reveal">{C.ABOUT["intro"]}</p>
      </div>
      <div class="why__visual reveal">
        <figure class="why__photo">{img("bts-video-2", "OXE Marketing crew on a video shoot in Bangkok", lazy=False)}</figure>
        <figure class="why__photo2">{img("about-team", "Laptop and camera set up in a Bangkok studio")}</figure>
        <div class="glass why__chip float-b"><span class="ico">{I["calendar"]}</span><div><b>Founded in 2020</b><small>Headquartered in Bangkok</small></div></div>
        <span class="shape shape--sphere why__sphere" aria-hidden="true"></span>
      </div>
    </div>
  </section>

  <section class="facts-wrap">
    <div class="container"><ul class="facts reveal">{facts}</ul></div>
  </section>

  <section class="section">
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

  <section class="section section--tint">
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

  <section class="section">
    <div class="container">
      {sec_head("Why companies choose OXE", 'Your all-in-one <span class="hl">marketing partner</span>')}
      <ul class="choose">{choose}</ul>
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

    def field(id_, name, label, typ="text", req=False, ac="", ph="", err="", full=False):
        return f'''<div class="field{" field--full" if full else ""}">
              <label for="{id_}">{label}{' <span aria-hidden="true">*</span>' if req else ' <em>(optional)</em>'}</label>
              <input id="{id_}" name="{name}" type="{typ}"{f' autocomplete="{ac}"' if ac else ""}{f' placeholder="{ph}"' if ph else ""}{" required" if req else ""}{f' aria-describedby="{id_}-err"' if err else ""}>
              {f'<span class="error" id="{id_}-err">{err}</span>' if err else ""}
            </div>'''
    return f'''<div class="form-card reveal">
        <h2>Tell us about your project</h2>
        <p class="form-card__intro">Fill out the form and our team will get back to you as soon as possible. Fields marked * are required.</p>
        <form name="contact" method="POST" action="thank-you.html" data-netlify="true" netlify-honeypot="bot-field" data-contact-form novalidate>
          <input type="hidden" name="form-name" value="contact">
          <p hidden><label>Don't fill this out: <input name="bot-field"></label></p>
          <div class="form-grid">
            {field("f-name", "name", "Full Name", req=True, ac="name", ph="Your full name", err="Please enter your name.")}
            {field("f-email", "email", "Email Address", "email", True, "email", "you@company.com", "Please enter a valid email address.")}
            {field("f-phone", "phone", "Phone Number", "tel", ac="tel", ph="+66")}
            {field("f-company", "company", "Company", ac="organization", ph="Company name")}
            <div class="field">
              <label for="f-service">Service Interested In <span aria-hidden="true">*</span></label>
              <select id="f-service" name="service" required aria-describedby="f-service-err">
                <option value="" selected disabled>Select a service</option>
                {svc}
              </select>
              <span class="error" id="f-service-err">Please choose a service.</span>
            </div>
            <div class="field">
              <label for="f-budget">Budget <em>(optional)</em></label>
              <select id="f-budget" name="budget">
                <option value="" selected>Select a range</option>
                {bud}
              </select>
            </div>
            <div class="field field--full">
              <label for="f-details">Project Details <span aria-hidden="true">*</span></label>
              <textarea id="f-details" name="details" rows="5" placeholder="Your goals, timeline and anything else we should know" required aria-describedby="f-details-err"></textarea>
              <span class="error" id="f-details-err">Please tell us a little about your project.</span>
            </div>
            <fieldset class="field field--full">
              <legend>Preferred Contact Method</legend>
              <div class="radio-row">
                <label><input type="radio" name="method" value="Email" checked><span>{I["mail2"]}Email</span></label>
                <label><input type="radio" name="method" value="Phone"><span>{I["phone2"]}Phone</span></label>
                <label><input type="radio" name="method" value="WhatsApp"><span>{I["whatsapp"]}WhatsApp</span></label>
              </div>
            </fieldset>
          </div>
          <button type="submit" class="btn btn--primary btn--block">Send Message {ARR}</button>
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
      <div class="contact-intro">
        {sec_head("Get in touch", CONTACT_H1, "Whether you're looking to build a new website, grow your brand through social media, or create professional photo and video content, we're here to help.", "h1")}
        <ul class="methods reveal">{contact_methods()}</ul>
        <div class="reveal">{btn(I["whatsapp"] + " Chat on WhatsApp", S["whatsapp"], "whatsapp", arrow=False, ext=True)}</div>
      </div>
      {form()}
    </div>
  </section>

  <section class="section section--flush">
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
    sitemap(list(pages) + [f'work/{p["id"]}.html' for p in C.PROJECTS])
