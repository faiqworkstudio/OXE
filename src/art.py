"""OXE 3D illustration set (inline SVG).

Every object uses the same materials, defined once per page in DEFS:
  m-top    white matte (lit faces)        m-side   white matte (shaded faces)
  m-blue   OXE blue (lit)                 m-blue-d OXE blue (shaded / device bodies)
  m-sphere glossy blue sphere             m-shadow soft contact shadow
Light comes from the top-left; every object sits on the same soft shadow.
To add an object, draw it on a 120x110 canvas with these fills only.
"""

DEFS = '''<svg class="svg-defs" width="0" height="0" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="m-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e4eefb"/></linearGradient>
    <linearGradient id="m-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d3e3f7"/><stop offset="1" stop-color="#a8c4ea"/></linearGradient>
    <linearGradient id="m-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#63a8f4"/><stop offset="1" stop-color="#1f6fd1"/></linearGradient>
    <linearGradient id="m-blue-d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a78d8"/><stop offset="1" stop-color="#134f9c"/></linearGradient>
    <radialGradient id="m-sphere" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#9cc6f7"/><stop offset="1" stop-color="#1f6fd1"/></radialGradient>
    <radialGradient id="m-shadow"><stop offset="0" stop-color="#1b4f93" stop-opacity=".28"/><stop offset="1" stop-color="#1b4f93" stop-opacity="0"/></radialGradient>
  </defs>
</svg>'''

EDGE = 'stroke="#d2e2f6" stroke-width="1"'


def svg(body, label="", cls="art"):
    aria = f'role="img" aria-label="{label}"' if label else 'aria-hidden="true"'
    return f'<svg class="{cls}" viewBox="0 0 120 110" {aria}><ellipse cx="60" cy="98" rx="50" ry="7" fill="url(#m-shadow)"/>{body}</svg>'


def bar3d(x, h, w=14, base=90):
    y = base - h
    return (f'<path d="M{x+w} {y} l6 -4 v{h} l-6 4z" fill="url(#m-side)"/>'
            f'<path d="M{x} {y} l6 -4 h{w} l-6 4z" fill="#fff" {EDGE}/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#m-top)" {EDGE}/>')


ART = {
    # Laptop + phone showing a website
    "web": svg(f'''
      <rect x="14" y="14" width="72" height="50" rx="5" fill="url(#m-blue-d)"/>
      <rect x="18" y="18" width="64" height="42" rx="2" fill="#fff"/>
      <rect x="18" y="18" width="64" height="6" fill="#e6f0fc"/>
      <circle cx="22" cy="21" r="1.2" fill="#9dbde6"/><circle cx="26" cy="21" r="1.2" fill="#9dbde6"/><circle cx="30" cy="21" r="1.2" fill="#9dbde6"/>
      <rect x="23" y="30" width="26" height="4" rx="2" fill="#1f6fd1"/>
      <rect x="23" y="37" width="21" height="3" rx="1.5" fill="#c4d9f3"/>
      <rect x="23" y="42" width="17" height="3" rx="1.5" fill="#c4d9f3"/>
      <rect x="23" y="49" width="15" height="6" rx="3" fill="#1f6fd1"/>
      <rect x="54" y="29" width="23" height="26" rx="2" fill="url(#m-blue)"/>
      <path d="M12 64 H88 L100 74 H0 Z" fill="url(#m-top)" {EDGE}/>
      <path d="M0 74 H100 V77 Q100 79 98 79 H2 Q0 79 0 77 Z" fill="url(#m-side)"/>
      <rect x="43" y="65" width="14" height="2" rx="1" fill="#c9dbf2"/>
      <rect x="86" y="40" width="28" height="50" rx="6" fill="url(#m-blue-d)"/>
      <rect x="89.5" y="44" width="21" height="42" rx="3" fill="#fff"/>
      <rect x="92.5" y="48" width="15" height="11" rx="2" fill="url(#m-blue)"/>
      <rect x="92.5" y="62" width="15" height="3" rx="1.5" fill="#c4d9f3"/>
      <rect x="92.5" y="67" width="10" height="3" rx="1.5" fill="#c4d9f3"/>
      <rect x="92.5" y="75" width="15" height="6" rx="3" fill="#1f6fd1"/>''', "Website on a laptop and phone"),

    # Phone with floating social reactions
    "social": svg(f'''
      <rect x="38" y="12" width="44" height="80" rx="9" fill="url(#m-blue-d)"/>
      <rect x="42" y="18" width="36" height="68" rx="5" fill="#fff"/>
      <circle cx="48" cy="25" r="3" fill="url(#m-blue)"/><rect x="53" y="23.5" width="16" height="3" rx="1.5" fill="#c4d9f3"/>
      <rect x="46" y="31" width="28" height="24" rx="3" fill="url(#m-blue)"/>
      <circle cx="54" cy="39" r="3.5" fill="#fff" opacity=".8"/>
      <path d="M46 55 l9 -9 6 6 5 -4 8 7z" fill="#fff" opacity=".55"/>
      <rect x="46" y="60" width="22" height="3" rx="1.5" fill="#c4d9f3"/>
      <rect x="46" y="66" width="16" height="3" rx="1.5" fill="#c4d9f3"/>
      <rect x="46" y="74" width="28" height="7" rx="3.5" fill="#e6f0fc"/>
      <circle cx="20" cy="34" r="15" fill="url(#m-top)" {EDGE}/>
      <path d="M20 42 l-7.5-7.3a4.4 4.4 0 0 1 6.3-6.2l1.2 1.2 1.2-1.2a4.4 4.4 0 0 1 6.3 6.2z" fill="#1f6fd1"/>
      <path d="M90 44 h22 a8 8 0 0 1 8 8 v2 a8 8 0 0 1 -8 8 h-14 l-6 5 v-5 a8 8 0 0 1 -8 -8 v-2 a8 8 0 0 1 8 -8z" fill="url(#m-blue)"/>
      <circle cx="96" cy="53" r="2" fill="#fff"/><circle cx="103" cy="53" r="2" fill="#fff"/><circle cx="110" cy="53" r="2" fill="#fff"/>
      <circle cx="98" cy="22" r="7" fill="url(#m-sphere)"/>''', "Phone with social media reactions"),

    # Cinema camera with film reels
    "video": svg(f'''
      <circle cx="36" cy="28" r="13" fill="url(#m-top)" {EDGE}/><circle cx="36" cy="28" r="5" fill="url(#m-blue)"/>
      <circle cx="64" cy="28" r="13" fill="url(#m-top)" {EDGE}/><circle cx="64" cy="28" r="5" fill="url(#m-blue)"/>
      <rect x="18" y="42" width="62" height="40" rx="7" fill="url(#m-top)" {EDGE}/>
      <rect x="18" y="72" width="62" height="10" rx="0" fill="url(#m-side)" opacity=".7"/>
      <rect x="18" y="74" width="62" height="8" rx="4" fill="url(#m-side)"/>
      <rect x="26" y="50" width="20" height="10" rx="3" fill="url(#m-blue-d)"/>
      <circle cx="30" cy="68" r="3" fill="#1f6fd1"/>
      <path d="M80 52 L104 42 V82 L80 72 Z" fill="url(#m-blue)"/>
      <ellipse cx="104" cy="62" rx="6" ry="20" fill="url(#m-blue-d)"/>
      <ellipse cx="104.5" cy="62" rx="3.5" ry="13" fill="#0d3a73"/>
      <ellipse cx="103.5" cy="56" rx="1.3" ry="4" fill="#fff" opacity=".7"/>''', "Video camera"),

    # Photo camera
    "photo": svg(f'''
      <path d="M40 34 l6 -11 h28 l6 11z" fill="url(#m-top)" {EDGE}/>
      <rect x="86" y="27" width="11" height="7" rx="2" fill="url(#m-blue-d)"/>
      <rect x="12" y="33" width="96" height="58" rx="11" fill="url(#m-top)" {EDGE}/>
      <rect x="12" y="46" width="96" height="12" fill="url(#m-blue)" opacity=".92"/>
      <rect x="12" y="80" width="96" height="11" rx="5" fill="url(#m-side)" opacity=".8"/>
      <rect x="19" y="38" width="13" height="5" rx="2" fill="#e6f0fc"/>
      <circle cx="60" cy="62" r="24" fill="url(#m-top)" {EDGE}/>
      <circle cx="60" cy="62" r="19" fill="url(#m-blue-d)"/>
      <circle cx="60" cy="62" r="13" fill="url(#m-blue)"/>
      <circle cx="60" cy="62" r="7" fill="#0d3a73"/>
      <circle cx="55" cy="56" r="3.5" fill="#fff" opacity=".75"/>''', "Photo camera"),

    # Target, arrow and growth bars
    "strategy": svg(f'''
      {bar3d(66, 24)}{bar3d(84, 40)}{bar3d(102, 56, w=12)}
      <circle cx="43" cy="61" r="30" fill="url(#m-side)"/>
      <circle cx="40" cy="58" r="30" fill="url(#m-top)" {EDGE}/>
      <circle cx="40" cy="58" r="21" fill="url(#m-blue)"/>
      <circle cx="40" cy="58" r="13" fill="#fff"/>
      <circle cx="40" cy="58" r="6" fill="url(#m-blue-d)"/>
      <path d="M41 57 L78 22" stroke="#0f2b50" stroke-width="3" stroke-linecap="round"/>
      <path d="M78 22 l8 -2 -3 7 -7 3z" fill="#0f2b50"/>
      <path d="M72 24 l3 -9 M76 28 l9 -3" stroke="#0f2b50" stroke-width="2.5" stroke-linecap="round"/>''', "Target with growth chart"),

    # Floating analytics chart
    "analytics": svg(f'''
      {bar3d(18, 22, w=16)}{bar3d(42, 36, w=16)}{bar3d(66, 50, w=16)}{bar3d(90, 66, w=16)}
      <path d="M22 54 L50 42 L74 30 L100 12" stroke="#1f6fd1" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="100" cy="12" r="5" fill="url(#m-sphere)"/>''', "Growth chart"),
}
