"""Copy the page builder and an image-size list into the admin, for its live preview.

    python3 scripts/make-engine.py <output dir>     (scripts/vercel-build.sh uses public/admin/engine)
"""
import os, sys, json, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "src"))
import build  # noqa: E402  (also provides size())

out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "public/admin/engine"))
files = []
for base, dirs, names in os.walk(os.path.join(ROOT, "src")):
    dirs[:] = [d for d in dirs if d != "__pycache__"]
    for n in names:
        if n.endswith(".py"):
            rel = os.path.relpath(os.path.join(base, n), ROOT).replace(os.sep, "/")
            files.append(rel)
            os.makedirs(os.path.dirname(os.path.join(out, rel)), exist_ok=True)
            shutil.copy(os.path.join(ROOT, rel), os.path.join(out, rel))

assets, sizes = [], {}
for folder in ("assets/img", "assets/video", "assets/css", "assets/js"):
    for base, dirs, names in os.walk(os.path.join(ROOT, folder)):
        for n in names:
            rel = os.path.relpath(os.path.join(base, n), ROOT).replace(os.sep, "/")
            assets.append(rel)
            if n.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif")):
                try:
                    sizes[rel] = list(build.size(os.path.join(ROOT, rel)))
                except Exception:
                    pass

with open(os.path.join(out, "engine.json"), "w") as fh:
    json.dump({"files": sorted(files), "assets": sorted(assets), "sizes": sizes}, fh, separators=(",", ":"))
print(f"Preview engine: {len(files)} source files, {len(assets)} assets, {len(sizes)} image sizes -> {os.path.relpath(out, ROOT)}")

# Demo account data: a read-only copy of the content, so the admin can be explored with the
# demo login without touching the real site. Turn it off with ADMIN_DEMO=off at build time.
demo_dir = os.path.join(os.path.dirname(out), "demo")
if os.environ.get("ADMIN_DEMO", "on").lower() in ("off", "0", "false", "no"):
    shutil.rmtree(demo_dir, ignore_errors=True)
    print("Admin demo: off")
else:
    import subprocess
    content = {}
    for base, dirs, names in os.walk(os.path.join(ROOT, "content")):
        for n in names:
            if n.endswith((".yml", ".md")):
                rel = os.path.relpath(os.path.join(base, n), ROOT).replace(os.sep, "/")
                content[rel] = open(os.path.join(ROOT, rel), encoding="utf-8").read()
    media = [{"path": a, "size": os.path.getsize(os.path.join(ROOT, a))} for a in assets if a.startswith(("assets/img/", "assets/video/"))]
    history = []
    try:
        log = subprocess.run(["git", "log", "-n15", "--format=%H%x1f%s%x1f%aI%x1f%an"], cwd=ROOT, capture_output=True, text=True, timeout=10).stdout
        for line in log.splitlines():
            sha, msg, date, author = line.split("\x1f")
            history.append({"sha": sha, "message": msg, "date": date, "author": author})
    except Exception:
        pass
    os.makedirs(demo_dir, exist_ok=True)
    with open(os.path.join(demo_dir, "bundle.json"), "w", encoding="utf-8") as fh:
        json.dump({"head": "demo", "files": content, "media": media, "history": history}, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"Admin demo: {len(content)} content files, {len(media)} media files")
