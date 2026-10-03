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
| Home | `index.html` | 3D hero, five service cards, Why OXE (real crew photos and four principles), "Our Works" category panel (links to the filtered portfolio), client logo wall, latest blog articles, contact band |
| Services | `services.html` | Five service blocks (image slideshow, device mockups or a wall of videos; 3D mark, intro, what we do, CTA), industries we worked with |
| Portfolio | `portfolio.html` | Category filters (All / Web Design / Social Media / Video / Photography), project cards, View More |
| Case studies | `work/<project>.html` | One page per project: a media viewer with every image and video of the project, Client / Challenge / Solution / Outcome, services provided, next project |
| About Us | `about.html` | Positioning, key facts, mission and vision, story, why companies choose OXE (bento grid), client logo wall |
| Blog | `blog.html` | Latest article, article cards, topic filter in the floating dock (`blog.html?cat=web` links straight to a topic) |
| Articles | `blog/<slug>.html` | One page per article: hero with date and reading time, cover, sticky contents, tips, FAQ, related service, more articles |
| Contact | `contact.html` | Contact methods, full enquiry form, map |
| — | `thank-you.html`, `404.html` | Form fallback and not-found pages |

## Editing the website (no code)

Go to **https://www.oxemarketingth.com/admin** and log in. Everything is edited in simple forms, and the design stays locked, so nothing can break the layout.

| In the admin panel | What you can change |
|---|---|
| **Blog** | Write, edit, schedule (as a draft) and publish articles: title, Google description, topic, date, cover photo, the article itself, and FAQ |
| **Portfolio projects** | Add or edit projects: client, title, filters, cover (photo, logo or website mockup), gallery, video, case study text, services, order on the page |
| **Pages → Home page** | Hero heading and text, trust line, intro, section headings, Why OXE principles, Our Works rows |
| **Pages → About page** | Heading, story, mission, vision, key facts, "why choose OXE" |
| **Pages → Page headers** | Heading and intro of the Services, Portfolio, Blog and Contact pages, and the "Get in touch" section on every page |
| **Pages → Services** | Each service's text, lists, card image, slideshow images or videos; industries |
| **Pages → Client logos** | Add, remove, rename and reorder logos |
| **Pages → Contact details & settings** | Email, phone, WhatsApp, city, social media links, contact-form options |

**How it works.** Click **Publish** and the change is saved to GitHub. Netlify rebuilds the site automatically, and the change is live in about 1–2 minutes.

**Tips**
- In headings, wrap words in `*asterisks*` to show them in the italic serif accent, e.g. `Our *Services*`.
- Upload photos as JPG or PNG. The site resizes them and converts them to fast WebP automatically.
- Blog: use **Heading 2** for each section (they build the article's contents list). A quote that starts with **Tip.** becomes a highlighted tip box. New articles start as a **Draft**; untick it to publish.
- Portfolio: leave Challenge, Solution or Outcome empty when they aren't known. The page shows "case study coming soon".
- Content rule: only use facts supplied by OXE or the client. No invented results, numbers or testimonials.

### One-time setup of the admin login (about 5 minutes)

The admin uses GitHub accounts to log in, through Netlify.

1. **Create a GitHub OAuth app.** On GitHub, go to *Settings → Developer settings → OAuth Apps → New OAuth App*. Fill in:
   - Application name: `OXE website editor`
   - Homepage URL: `https://www.oxemarketingth.com`
   - Authorization callback URL: `https://api.netlify.com/auth/done`

   Click *Register application*, copy the **Client ID**, then *Generate a new client secret* and copy it.
2. **Connect it to Netlify.** In Netlify, open the site, then *Site configuration → Access & security → OAuth → Install provider → GitHub*. Paste the Client ID and secret.
3. **Add editors.** Each editor needs a free GitHub account with *Write* access to this repository (GitHub repository → *Settings → Collaborators → Add people*).
4. Open `/admin`, click **Login with GitHub**, and start editing.

The admin saves to the branch set in `admin/config.yml` (`backend.branch`). If Netlify ever publishes a different branch, change it there too.

> Prefer email and password logins instead of GitHub accounts? A service such as DecapBridge can provide that; it only needs a small change to `backend` in `admin/config.yml`.

## For developers

- **Content files.** All content lives in `content/`, in YAML for pages, settings, services, clients and projects, and Markdown for blog posts. `src/content.py` and `src/blog_posts.py` load them; `src/build.py` holds the page templates.
- **Build.**

  ```bash
  pip install -r requirements.txt
  python3 src/build.py      # regenerates every page, /work, /blog and sitemap.xml
  ```

  Netlify runs the same build on every push (see `netlify.toml`).
- **Edit locally with the admin panel.** Run `npx decap-server` in the repository and `python3 -m http.server 8080`, then open `http://localhost:8080/admin/`. Changes are written straight to the files.
- **Menu.** The top menu and its panels are set in `MENU`, `MENU_META` and `NAV` in `src/content.py`.
- **Videos.** Videos go in `assets/video/<name>.mp4`, each with a cover image. The build converts images to WebP automatically, from any JPG or PNG.
- **3D illustrations.** These are in `src/art.py`. All of them share the same materials (white matte, OXE blue, soft shadow), so new ones stay consistent.

## Still to do before launch

- [ ] Set up the admin login (see *One-time setup* above).
- [ ] Social media profile URLs: *Admin → Pages → Contact details & settings*. The icons link to `#` until these are filled in.
- [ ] Screenshots of the Anthony Bespoke Tailor website. That card currently shows a branded placeholder.
- [ ] Written case studies for Haji Café, Dh Foods, Gaia Tribe, Wirever, Wine Connection, event coverage and the corporate video. These currently show real media plus a "coming soon" note.
- [ ] Campaign images for OPPO and Icy Lemonade (OPPO shows its logo, Icy Lemonade a placeholder until then).
- [ ] Names of six client logos (the wolf, brush-stroke, gown, star, gold-figure and "Y" logos) so they get alt text: *Admin → Pages → Client logos*.
- [ ] A higher-resolution jewellery photo for the Services → Industries "Jewelry" tile (`ind-jewelry.jpg`).
- [ ] Confirm the budget ranges in the contact form: *Admin → Pages → Contact details & settings*.
- [ ] Add the GA4 measurement ID: uncomment the snippet in `head()` in `build.py`.
- [ ] If OXE has a street address, update the map on the contact page.

## Put it live on Netlify

1. In Netlify, choose **Add new site → Import an existing project → GitHub** and pick this repository and branch. `netlify.toml` already sets the build command and the publish directory.
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
  - `ProfessionalService`, `BreadcrumbList`, `Blog`, `BlogPosting` and `FAQPage` structured data;
  - `sitemap.xml` and `robots.txt`.

## WordPress / Elementor mapping

- **Global colours:** Navy `#0F2B50`, Blue `#1F6FD1`, Light `#F1F6FD`, Text `#22324A`, Muted `#5B6B82`.
- **Global fonts:** Poppins (headings), Inter (body), Instrument Serif italic for accent words in headings.
- **Header and footer:** Theme Builder.
- **Hero:** a two-column container. The 3D scene can be exported as a single WebP or SVG image, or rebuilt as layered images.
- **Service cards, principles and "why choose" items:** Icon Box / Image Box widgets. The 3D icons are standalone SVGs in `src/art.py`.
- **Portfolio and case studies:** a *Portfolio* custom post type with ACF fields for Client, Category, Summary, Challenge, Solution, Outcome, Services and Gallery. Use a Loop Grid with a taxonomy filter and a single-post template.
- **Contact:** Elementor Pro Form with the same fields. For WhatsApp, use *Click to Chat* set to `66824480050`.
