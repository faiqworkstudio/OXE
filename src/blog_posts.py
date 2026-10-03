"""Blog articles: one Markdown file per article in content/blog/<slug>.md.

Edit them in the admin panel (/admin → Blog) or by hand. Each file has a header
(title, description, category, date, cover, excerpt, draft, faq) and a Markdown body:

    ## Section heading        (each one appears in the article's contents list)
    ### Sub-heading
    - bullet list             1. numbered list (start at 4. to continue numbering)
    **bold**  *italic*  [link text](services.html#web)
    > **Tip.** A quote that starts with "Tip." becomes a highlighted tip box.
    > Any other quote becomes a large pull quote.

Content rule: practical, accurate advice. No invented statistics, prices or
client results. Link to OXE services where relevant.
"""
import os, re, html
import markdown
from markdown.extensions.sane_lists import SaneListExtension
from content import DATA, fmt, asset, load

BLOG_CATS = [("all", "All"), ("web", "Websites & SEO"), ("social", "Social Media"), ("video", "Video"),
             ("photo", "Photography"), ("strategy", "Strategy")]

AUTHOR = "OXE Marketing Team"


def _slugify(t):
    return re.sub(r"[^a-z0-9]+", "-", re.sub(r"<[^>]+>", "", t).lower()).strip("-")


def render(md_text):
    """Markdown -> article HTML, plus the list of section headings for the contents."""
    out = markdown.markdown(md_text, extensions=[SaneListExtension()], output_format="html")
    heads = []

    def h2(m):
        t = re.sub(r"^[0-9]+[.)] ", "", m.group(1).strip())
        heads.append(t)
        return f'<h2 id="{_slugify(html.unescape(t))}">{t}</h2>'
    out = re.sub(r"<h2>(.*?)</h2>", h2, out, flags=re.S)

    def quote(m):
        inner = m.group(1).strip()
        tip = re.match(r"<p><strong>Tip[.:]?</strong>:?\s*(.*)</p>$", inner, flags=re.S)
        if tip:
            return f'<aside class="atip reveal"><span class="atip__ico" aria-hidden="true">✦</span><p><strong>Tip.</strong> {tip.group(1).strip()}</p></aside>'
        return f'<blockquote class="reveal">{inner}</blockquote>'
    out = re.sub(r"<blockquote>(.*?)</blockquote>", quote, out, flags=re.S)
    # numbered lists that continue across sections (<ol start="4">) keep their count
    out = re.sub(r'<ol start="(\d+)">', lambda m: f'<ol style="counter-reset: ol {int(m.group(1)) - 1}">', out)
    return out, heads


def _post(path):
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, flags=re.S)
    front = __import__("yaml").safe_load(m.group(1)) if m else {}
    body = m.group(2) if m else raw
    body_html, heads = render(body)
    return dict(
        slug=os.path.splitext(os.path.basename(path))[0],
        title=fmt(front["title"]), description=fmt(front.get("description") or ""),
        cat=front.get("category") or "web", date=str(front["date"])[:10],
        cover=asset(front.get("cover")), excerpt=fmt(front.get("excerpt") or ""),
        draft=bool(front.get("draft")),
        faq=[(fmt(x["question"]), fmt(x["answer"])) for x in front.get("faq") or [] if x.get("question")],
        body_html=body_html, heads=heads,
        text=re.sub(r"<[^>]+>", " ", body_html),
    )


_dir = os.path.join(DATA, "blog")
POSTS = [_post(os.path.join(_dir, f)) for f in sorted(os.listdir(_dir)) if f.endswith(".md")]
POSTS = [p for p in POSTS if not p["draft"]]
POSTS.sort(key=lambda p: p["date"], reverse=True)
