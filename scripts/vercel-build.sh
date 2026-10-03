#!/usr/bin/env bash
# Vercel build: install Python deps, generate the pages from /content, then copy
# only the public files into public/ (Vercel's output directory).
set -euo pipefail
cd "$(dirname "$0")/.."

PY=python3
if ! $PY -m pip --version >/dev/null 2>&1; then
  $PY -m ensurepip --user >/dev/null 2>&1 || true
fi
$PY -m pip install --quiet --user -r requirements.txt 2>/dev/null \
  || $PY -m pip install --quiet --break-system-packages -r requirements.txt 2>/dev/null \
  || $PY -m pip install --quiet -r requirements.txt

$PY src/build.py

rm -rf public && mkdir public
cp -R *.html sitemap.xml robots.txt assets admin blog work public/
echo "Built $(find public -name '*.html' | wc -l) pages into public/"
