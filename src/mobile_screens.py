"""Builds the phone-screen images used in the laptop + phone mockups.

We only have desktop screenshots of these client sites, so the mobile
screens are recomposed from pieces of the desktop screenshot (tailor) or
from the site's real headline copy over its hero image (Vincenzo Russo).
Replace with real mobile screenshots when available, then run build.py.

    python3 src/mobile_screens.py && python3 src/build.py
"""
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
W, H = 600, 1300
import os
WORK = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets/img/work") + "/"

def paste(canvas, src, box, x, y, width=None, scale=None):
    k = src.width / 1400 if src.width > 1000 else 1  # crop boxes are authored for a 1400px source
    c = src.crop(tuple(round(v * k) for v in box))
    s = (scale / k if scale else None) or (width / c.width)
    c = c.resize((round(c.width * s), round(c.height * s)), Image.LANCZOS)
    canvas.paste(c, (x, y))
    return y + c.height

# ---- Platinum tailor: mobile layout rebuilt from the desktop screenshot
src = Image.open(WORK + "tailor-website.jpg").convert("RGB")
m = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(m)
paste(m, src, (133, 16, 326, 72), 52, 70, scale=1.05)
for yy in (86, 98, 110): d.rounded_rectangle((502, yy, 546, yy + 4), 2, fill="#1d1d1f")
d.line((0, 152, W, 152), fill="#eeeeee", width=2)
y = paste(m, src, (732, 332, 918, 353), 52, 196, scale=1.4) + 20
y = paste(m, src, (726, 368, 1092, 590), 52, y, width=440) + 20
y = paste(m, src, (736, 606, 1268, 688), 52, y, width=496) + 24
y = paste(m, src, (736, 718, 962, 778), 52, y, scale=1.2) + 36
paste(m, src, (136, 219, 669, 875), 52, y, width=496)
m.save(WORK + "tailor-website-mobile.jpg", quality=88)

# ---- Vincenzo Russo: jewellery hero, headline redrawn from the real site copy
src = Image.open(WORK + "vincenzo-russo-site.jpg").convert("RGB")
strip = src.crop((0, 192, 321, 284))  # jewellery only, below the original headline
bg = strip.resize((round(strip.width * (H - 150) / strip.height), H - 150), Image.LANCZOS)
bg = bg.crop(((bg.width - W) // 2, 0, (bg.width - W) // 2 + W, H - 150))
bg = ImageEnhance.Brightness(bg.filter(ImageFilter.GaussianBlur(3))).enhance(.5)
m = Image.new("RGB", (W, H), "black"); m.paste(bg, (0, 150)); d = ImageDraw.Draw(m)
f_logo = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
f_h = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
f_s = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 25)
d.text((52, 80), "Vincenzo Russo", font=f_logo, fill="white")
for yy in (84, 96, 108): d.rounded_rectangle((502, yy, 546, yy + 4), 2, fill="white")
for i, line in enumerate(["Welcome to", "Vincenzo", "Russo"]):
    tw = d.textlength(line, font=f_h); d.text(((W - tw) / 2, 330 + i * 82), line, font=f_h, fill="white")
for i, line in enumerate(["Diamond Dealer &", "GIA Diamond Specialist"]):
    tw = d.textlength(line, font=f_s); d.text(((W - tw) / 2, 610 + i * 36), line, font=f_s, fill="#e8e8e8")
m.save(WORK + "vincenzo-russo-site-mobile.jpg", quality=88)
