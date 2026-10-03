#!/usr/bin/env bash
# Vercel build: generate the pages from /content, then copy only the public files
# into public/ (Vercel's output directory).
#
# Nothing here needs pip: PyYAML and Markdown are bundled in src/vendor. Pillow
# (WebP conversion of newly uploaded images) is installed if possible; if that
# fails, the build carries on and uses the uploaded images as they are.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== Choosing Python"
PY=""
for c in python3.13 python3.12 python3.11 python3.10 python3 python; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(sys.version_info < (3, 8))' 2>/dev/null; then
    PY="$c"; break
  fi
done
if [ -z "$PY" ]; then
  echo "ERROR: Python 3.8+ was not found on the build machine." >&2
  exit 1
fi
echo "Using $($PY --version 2>&1) at $(command -v $PY)"

echo "== Installing Pillow (optional)"
if $PY -c 'import PIL' 2>/dev/null; then
  echo "Pillow already available"
else
  ( $PY -m pip install --quiet --disable-pip-version-check --user Pillow \
    || $PY -m pip install --quiet --disable-pip-version-check --break-system-packages Pillow \
    || $PY -m pip install --quiet --disable-pip-version-check Pillow \
    || { command -v uv >/dev/null 2>&1 && uv pip install --quiet --system --python "$PY" Pillow; } ) >/dev/null 2>&1 \
    && echo "Pillow installed" \
    || echo "Pillow not installed: continuing without it (images are used as uploaded)"
fi

echo "== Building pages"
$PY src/build.py

echo "== Copying the public site to public/"
rm -rf public && mkdir public
cp -R *.html sitemap.xml robots.txt assets admin blog work public/

echo "== Preparing the admin live preview"
$PY scripts/make-engine.py public/admin/engine
echo "Done: $(find public -name '*.html' | wc -l | tr -d ' ') pages"
