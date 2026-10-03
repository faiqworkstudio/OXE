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
