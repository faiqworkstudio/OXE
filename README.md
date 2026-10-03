# OXE Marketing — Website

The website for **OXE Marketing**, a multicultural digital marketing agency in Bangkok.

It is a fast static site: HTML, one CSS file and a small script, with no framework. The look is modern editorial with soft 3D:
- white and very light blue backgrounds, with OXE blue as the accent;
- Poppins for headings and Inter for body text;
- device mockups and a set of 3D illustrations built in CSS and SVG, all sharing one lighting style.

The site is hosted on Vercel, and all content is edited in the branded admin at `/admin`.

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

Go to **https://www.oxemarketingth.com/admin** and log in with your username and password. The admin uses the OXE look and is built for this site, and nothing goes live until you publish.

| Area | What you can do |
|---|---|
| **Dashboard** | See unpublished changes, live/hidden articles, projects and media at a glance; quick actions; recent activity |
| **Pages** (Home, Services, Portfolio, About, Blog page, Contact) | Edit every heading, text, button, photo, video and Google (SEO) text; add, remove and reorder list items such as services, principles, facts, steps and industries |
| **Blog articles** | Create, edit, duplicate, hide or show, and delete articles; Markdown editor with buttons for headings, lists, quotes and tip boxes; Google snippet preview |
| **Portfolio projects** | Create, edit, duplicate, reorder (▲▼) and delete projects, with cover style, gallery, video and case study |
| **Media library** | Upload by drag and drop (images are resized and converted to WebP in the browser); replace a file everywhere it's used; delete it, with a warning when it's still in use; see where each file is used |
| **Menu & footer, Client logos, Contact & settings** | Menu labels and panels, footer, shared sections, thank-you and 404 pages; client logos; contact details, social links, logo, favicon and sharing image, contact-form options and key |
| **Activity** | Every published update, by whom and when |

**How it keeps you safe**
- **Live preview.** While you type, the preview on the right shows the exact page the site will publish (desktop, tablet or phone), including unpublished photos. Click a link in the preview to edit that page.
- **Drafts.** Edits are saved automatically in your browser as drafts. Nothing changes on the website until you click **Publish**.
- **Review & publish.** You see every change before it goes live. Problems, such as an empty required field or a Google title that's too long, are shown and block publishing until fixed. Each change can be discarded on its own.
- **One update.** All changes go live together. Vercel rebuilds the site in about 1–2 minutes, and the admin shows when it's live. If a rebuild ever fails, the previous version stays online.
- **History.** Every page, article and project has a version history: preview any earlier version and restore it, as a draft to review first.
- **Two editors at once.** If someone else publishes the same item while you're editing, the admin tells you and lets you keep theirs or yours.
- **Sessions** last 12 hours. If one ends while you work, you log in again in a pop-up and keep your drafts.

In headings, wrap words in `*asterisks*` to show them in the italic serif accent, e.g. `Our *Services*`.

### Setting up the admin (once, in Vercel)

In the Vercel project, go to **Settings → Environment Variables**, add the following, then redeploy:

| Variable | Value |
|---|---|
| `ADMIN_USERNAME` and `ADMIN_PASSWORD` | Login for one admin user (use a long password) |
| `ADMIN_USERS` (instead, for several users) | One line per user: `name:scrypt$…`. Create a line with `node scripts/admin-password.js <name>`; it stores a hash, not the password |
| `SESSION_SECRET` | A long random string, at least 32 characters (e.g. from a password generator) |
| `GITHUB_TOKEN` | A GitHub fine-grained token for **this repository only**, with **Contents: Read and write** (GitHub → Settings → Developer settings → Fine-grained tokens). The admin saves through it; it is never sent to the browser |
| `GITHUB_BRANCH` *(optional)* | The branch Vercel deploys to production (default: `claude/website-design-requirements-89zc90`) |
| `ADMIN_COMMIT_EMAIL` *(optional)* | Email shown on admin updates in GitHub |

- **Videos over 3.3 MB** are uploaded straight to Vercel Blob storage. Enable it once: **Vercel → Storage → Create → Blob**, then connect it to this project (this adds `BLOB_READ_WRITE_TOKEN`). Smaller videos and all images are stored in the repository.
- **Contact form.** Paste a free Web3Forms key into *Contact & settings → Contact form key*. On web3forms.com, enter `Sales@oxemarketingth.com` and the key is emailed to you. Until a key is set, the form opens the visitor's email app or WhatsApp with their message.
- **Supabase login (later).** All login logic is in `api/_lib/auth.js`. Replace `verifyCredentials()` with Supabase's `signInWithPassword` and the rest of the admin stays the same.

### Content rule

Only use facts supplied by OXE or the client: no invented results, numbers or testimonials. Leave a case study's Challenge, Solution or Outcome empty when it isn't known; the page then shows "case study coming soon".

## For developers

- **Content files.** All content lives in `content/`:
  - one YAML file per page (`home`, `services`, `portfolio`, `about`, `blog-page`, `contact`), plus `site`, `clients` and `settings`;
  - one file per project in `content/projects/`;
  - one Markdown file per article in `content/blog/`.

  Keys starting with `sec_` only group fields into admin sections. `src/content.py` and `src/blog_posts.py` load the files; `src/build.py` holds the page templates.
- **Admin.**
  - **Forms:** `admin/schema.yml` defines every editable field. When you add a field to a template, add it there too.
  - **App:** `admin/app.js` (single-page app) and `admin/admin.css`.
  - **Live preview:** `admin/preview-worker.js` runs the real builder (`src/preview.py`) in the browser with Pyodide. `scripts/make-engine.py` ships the builder and image sizes to `public/admin/engine/` at build time.
- **API (Vercel functions in `api/`).**
  - `session` handles login and logout.
  - `repo/*` provides `bundle`, `tree`, `file`, `blob` (upload), `commit` (atomic publish with a conflict check), `history` and `deploy` (status).
  - `upload` issues Vercel Blob tokens for large videos.
  - Writes are limited to `content/` and `assets/img|video/`, and core page files can't be deleted.
- **Build.** The build needs only Python 3.8 or newer: PyYAML and Markdown are bundled in `src/vendor/`, and Pillow is optional (WebP conversion).

  ```bash
  python3 src/build.py            # pages, /work, /blog, sitemap.xml
  bash scripts/vercel-build.sh    # what Vercel runs: build + public/ + admin preview engine
  ```

  GitHub Actions runs the same build on every push (`.github/workflows/build.yml`).
- **Admin locally.** This runs the admin against a local git checkout, with real commits and no GitHub token:

  ```bash
  bash scripts/vercel-build.sh
  ADMIN_LOCAL_REPO=/path/to/a/clone ADMIN_USERNAME=me ADMIN_PASSWORD=secret \
    SESSION_SECRET=$(openssl rand -hex 24) node scripts/admin-dev-server.js 3000
  ```
- **Videos** are files in `assets/video/<name>.mp4`, or full URLs (Vercel Blob). Every video field has a cover-image field next to it.
- **3D illustrations** are in `src/art.py`. All of them share the same materials (white matte, OXE blue, soft shadow), so new ones stay consistent.

## Still to do before launch

- [ ] Set up the admin (environment variables above) and the contact form key.
- [ ] Social media profile URLs: *Admin → Pages → Contact details & settings*. The icons link to `#` until these are filled in.
- [ ] Screenshots of the Anthony Bespoke Tailor website. That card currently shows a branded placeholder.
- [ ] Written case studies for Haji Café, Dh Foods, Gaia Tribe, Wirever, Wine Connection, event coverage and the corporate video. These currently show real media plus a "coming soon" note.
- [ ] Campaign images for OPPO and Icy Lemonade (OPPO shows its logo, Icy Lemonade a placeholder until then).
- [ ] Names of six client logos (the wolf, brush-stroke, gown, star, gold-figure and "Y" logos) so they get alt text: *Admin → Pages → Client logos*.
- [ ] A higher-resolution jewellery photo for the Services → Industries "Jewelry" tile (`ind-jewelry.jpg`).
- [ ] Confirm the budget ranges in the contact form: *Admin → Pages → Contact details & settings*.
- [ ] Add the GA4 measurement ID: uncomment the snippet in `head()` in `build.py`.
- [ ] If OXE has a street address, update the map on the contact page.

## Hosting on Vercel

1. In Vercel, choose **Add New → Project** and import this GitHub repository. `vercel.json` already sets the build command (`bash scripts/vercel-build.sh`) and the output directory (`public`). Leave the framework preset as **Other**.
2. Under *Settings → Git*, set the **Production Branch** to the branch that `admin/config.yml` saves to.
3. Under *Settings → Domains*, add `oxemarketingth.com` and `www.oxemarketingth.com`, and redirect the bare domain to `www`. SSL is issued automatically.
4. Add the admin environment variables (see *Setting up the admin* above) and the contact form key.

`vercel.json` also:
- serves clean URLs (`/services` instead of `/services.html`);
- adds the security headers;
- caches images and video for a week, and revalidates CSS and JS on every visit. Pages link them with a `?v=` content hash, so a new deploy never shows new pages with an old stylesheet.

The source folders (`src/`, `content/`) are not published.

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
