# OXE Marketing — Website

The website for **OXE Marketing**, a multicultural digital marketing agency in Bangkok.

It is a fast static site: HTML, one CSS file and a small script, with no framework. The look is modern editorial with soft 3D:
- white and very light blue backgrounds, with OXE blue as the accent;
- Poppins for headings and Inter for body text;
- device mockups and a set of 3D illustrations built in CSS and SVG, all sharing one lighting style.

The site runs on Netlify as it is, and every section maps to an Elementor section for the planned WordPress build.

## Pages

| Page | File | Sections |
|---|---|---|
| Home | `index.html` | 3D hero, five service cards, Why OXE (real crew photos and four principles), "Our Works" category panel (links to the filtered portfolio), featured case study, client logo wall, contact band |
| Services | `services.html` | Five service blocks (visual, intro, what we do, deliverables, process, CTA), industries |
| Portfolio | `portfolio.html` | Category filters (All / Web Design / Social Media / Video / Photography), project cards, View More |
| Case studies | `work/<project>.html` | One page per project: Client / Challenge / Solution / Outcome, video or gallery, services provided, next project |
| About Us | `about.html` | Positioning, key facts, mission and vision, story, why companies choose OXE, client logo wall |
| Contact | `contact.html` | Contact methods, full enquiry form, map |
| — | `thank-you.html`, `404.html` | Form fallback and not-found pages |

## Editing content

All text, services and projects live in **`src/content.py`**. The page templates are in `src/build.py`. After editing, rebuild with:

```bash
pip install pillow        # once
python3 src/build.py      # regenerates every page, the /work pages and sitemap.xml
```

- **Adding a project.** Put the images (as `.jpg`) in `assets/img/work/` and add an entry to `PROJECTS`. Videos go in `assets/video/<name>.mp4` with a `<name>-poster.jpg`. The build converts images to WebP automatically.
- **Content rule.** Only use facts supplied by OXE. When a Challenge, Solution or Outcome isn't known, leave it as `None` and the page shows a neutral "case study coming soon" note. Don't add results, numbers or testimonials that OXE hasn't supplied.
- **3D illustrations.** These are in `src/art.py`. All of them share the same materials (white matte, OXE blue, soft shadow), so new ones stay consistent.

## Still to do before launch

- [ ] Social media profile URLs: `SITE["social"]` in `content.py`. The icons link to `#` until these are filled in.
- [ ] Screenshots of the Anthony Bespoke Tailor website. That card currently shows a branded placeholder.
- [ ] Written case studies for Haji Café, Dh Foods, Gaia Tribe, Wirever, Wine Connection, event coverage and the corporate video. These currently show real media plus a "coming soon" note.
- [ ] Confirm that the OPPO and Icy Lemonade card images belong to those campaigns.
- [ ] Names of six client logos (the wolf, brush-stroke, gown, star, gold-figure and "Y" logos) so they get alt text: `CLIENTS` in `content.py`.
- [ ] Confirm the budget ranges in the contact form (`BUDGETS`).
- [ ] Add the GA4 measurement ID: uncomment the snippet in `head()` in `build.py`.
- [ ] If OXE has a street address, update the map on the contact page.

## Put it live on Netlify

1. In Netlify, choose **Add new site → Import an existing project → GitHub** and pick this repository and branch. Leave the build command empty and set the publish directory to `.` (`netlify.toml` already sets this).
2. Add the custom domain `oxemarketingth.com` under **Domain management**. SSL is issued automatically.
3. **Forms → contact.** Add an email notification to `Sales@oxemarketingth.com`.

`netlify.toml` caches images and video for a week. CSS and JS are revalidated on every visit and are linked with a `?v=` content hash, so a new deploy never shows new pages with an old stylesheet.

## Quality checklist

- **Responsive:** tested at 375, 390, 768, 1024 and 1440px with no horizontal scrolling.
- **Accessibility:**
  - semantic landmarks, one `h1` per page, and a skip link;
  - visible focus states and keyboard-accessible menu and filters (Esc closes the menu);
  - labelled form fields with error messages;
  - `prefers-reduced-motion` respected.
- **Performance:**
  - WebP images, lazy-loaded below the fold;
  - no JavaScript framework; one small deferred script;
  - 3D built in CSS and SVG, with no WebGL.
- **SEO:**
  - unique titles and descriptions, canonical URLs and Open Graph;
  - `ProfessionalService` and `BreadcrumbList` structured data;
  - `sitemap.xml` and `robots.txt`.

## WordPress / Elementor mapping

- **Global colours:** Navy `#0F2B50`, Blue `#1F6FD1`, Light `#F1F6FD`, Text `#22324A`, Muted `#5B6B82`.
- **Global fonts:** Poppins (headings), Inter (body).
- **Header and footer:** Theme Builder.
- **Hero:** a two-column container. The 3D scene can be exported as a single WebP or SVG image, or rebuilt as layered images.
- **Service cards, principles and "why choose" items:** Icon Box / Image Box widgets. The 3D icons are standalone SVGs in `src/art.py`.
- **Portfolio and case studies:** a *Portfolio* custom post type with ACF fields for Client, Category, Summary, Challenge, Solution, Outcome, Services and Gallery. Use a Loop Grid with a taxonomy filter and a single-post template.
- **Contact:** Elementor Pro Form with the same fields. For WhatsApp, use *Click to Chat* set to `66824480050`.
