"""Live preview for the admin panel.

The admin runs this site's real page builder in the browser (Pyodide), with the
editor's unsaved content written into an in-memory copy of content/. Image files
are empty stand-ins there, so their sizes come from engine.json (made by
scripts/make-engine.py at build time) plus any images uploaded in the admin.
"""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZES = {}
os.environ["OXE_PREVIEW_DRAFTS"] = "1"


def set_sizes(sizes):
    SIZES.update(sizes)


def _fresh_build():
    """Re-import the builder so it reads the current content files."""
    for m in ("content", "blog_posts", "build"):
        sys.modules.pop(m, None)
    import build as B

    def size(path):
        rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
        wh = SIZES.get(rel)
        return (int(wh[0]), int(wh[1])) if wh else (1200, 800)
    B.size = size
    return B


def render(route):
    """route: page:<name> | blog:<slug> | project:<id>  ->  (html, page path)"""
    B = _fresh_build()
    kind, _, key = route.partition(":")
    if kind == "blog":
        post = next((p for p in B.POSTS if p["slug"] == key), None)
        if post is None:
            raise ValueError(f"Article '{key}' not found")
        return B.post(post), f"blog/{key}.html"
    if kind == "project":
        if key not in B.PBY:
            raise ValueError(f"Project '{key}' not found")
        return B.case(B.PBY[key]), f"work/{key}.html"
    pages = {
        "home": (B.home, "index.html"), "site": (B.home, "index.html"), "services": (B.services, "services.html"),
        "portfolio": (B.portfolio, "portfolio.html"), "about": (B.about, "about.html"), "clients": (B.about, "about.html"),
        "blog-page": (B.blog, "blog.html"), "contact": (B.contact, "contact.html"), "settings": (B.contact, "contact.html"),
    }
    if key == "thank-you":
        t = B.T["thank_you"]
        return B.simple("thank-you.html", t["title"], t["heading"], t["text"]), "thank-you.html"
    if key == "404":
        t = B.T["not_found"]
        return B.simple("404.html", t["title"], t["heading"], t["text"]), "404.html"
    fn, path = pages.get(key, pages["home"])
    return fn(), path
