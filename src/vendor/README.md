# Bundled Python packages

Pure-Python copies so the site builds even where `pip install` is not available,
for example on a hosting build machine. Installed versions take precedence.

| Package | Version | Licence |
|---|---|---|
| [PyYAML](https://pyyaml.org) (`yaml/`, pure-Python part only) | 6.0.1 | MIT |
| [Python-Markdown](https://python-markdown.github.io) (`markdown/`) | 3.6 | BSD-3-Clause |

Pillow (image conversion to WebP) is optional and is not bundled. Without it the
build uses the uploaded images as they are.
