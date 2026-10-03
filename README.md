# OXE Marketing — Website

The website for **OXE Marketing**, a multicultural digital marketing agency in Bangkok.

It is a fast static site: HTML, one CSS file and a small script, with no framework. The look is modern editorial with soft 3D:
- white and very light blue backgrounds, with OXE blue as the accent;
- Poppins for headings and Inter for body text;
- device mockups and a set of 3D illustrations built in CSS and SVG, all sharing one lighting style.

The site is hosted on Vercel. Content is edited in the admin panel at `/admin`, and every section maps to an Elementor section for the planned WordPress build.

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
| **Pages → Home** | SEO title and description; hero; intro and picture cards; section headings and buttons; Why OXE photos and principles; Our Works rows; blog section |
| **Pages → Services** | SEO; hero and photos; the five services (titles, texts, lists, card image, slideshow images or videos); industries |
| **Pages → Portfolio** | SEO; hero, photos and stats labels; which project is featured (pick from a list); grid labels |
| **Pages → About** | SEO; hero, photos and key facts; mission and vision; story text and photos; the eight "why choose OXE" cards |
| **Pages → Blog page** | SEO; hero; list labels; labels shown on every article (author, contents, help box, FAQ, up next) |
| **Pages → Contact** | SEO; hero and photos; every enquiry form label and message; contact tiles; "what happens next" steps; map location |
| **Pages → Menu, footer & shared sections** | Header button; top menu labels, panel texts, images and links; moving words under page headings; badge text; "Get in touch" section; client logos section; footer; case-study labels; thank-you and "page not found" pages |
| **Pages → Client logos** | Add, remove, rename and reorder logos |
| **Pages → Contact details & settings** | Email, phone, WhatsApp, city, social links, contact form key, form options |
| **Blog articles** | Write, edit, save as draft and publish articles: title, Google description, topic, date, cover, article, FAQ |
| **Portfolio projects** | Add or edit projects: client, title, filters, cover (photo, logo or website mockup), gallery, video, case study, services, order |

Every page form is split into sections (SEO, hero, and so on); click a section to open it. Fields check their content as you type: SEO title and description lengths, email, WhatsApp number, social links and page addresses. Lists with a fixed design, such as the two home picture cards or the eight About cards, can be edited but not added to or removed from, so the layout can't break. **View Live** on each page opens it on the website.

**How it works.** Click **Publish** and the change is saved to GitHub. Vercel rebuilds the site automatically, and the change is live in about 1–2 minutes. If a build ever fails, Vercel keeps the previous version of the site online, and the error shows on GitHub under **Actions → Site build**.

**Tips**
- In headings, wrap words in `*asterisks*` to show them in the italic serif accent, e.g. `Our *Services*`.
- Upload photos as JPG or PNG. The site resizes them and converts them to fast WebP automatically.
- Blog: use **Heading 2** for each section (they build the article's contents list). A quote that starts with **Tip.** becomes a highlighted tip box. New articles start as a **Draft**; untick it to publish.
- Portfolio: leave Challenge, Solution or Outcome empty when they aren't known. The page shows "case study coming soon".
- Content rule: only use facts supplied by OXE or the client. No invented results, numbers or testimonials.

### One-time setup of the admin login (about 5 minutes)

The admin uses GitHub accounts to log in, through two small Vercel functions in `api/` (`/api/auth` and `/api/callback`).

1. **Create a GitHub OAuth app.** On GitHub, go to *Settings → Developer settings → OAuth Apps → New OAuth App*. Fill in:
   - Application name: `OXE website editor`
   - Homepage URL: `https://www.oxemarketingth.com`
   - Authorization callback URL: `https://www.oxemarketingth.com/api/callback`

   Click *Register application*, copy the **Client ID**, then *Generate a new client secret* and copy it.
2. **Add them to Vercel.** In the Vercel project, go to *Settings → Environment Variables* and add:
   - `GITHUB_CLIENT_ID`: the Client ID
   - `GITHUB_CLIENT_SECRET`: the client secret

   Then redeploy (*Deployments → ⋯ → Redeploy*) so the functions pick them up.
3. **Add editors.** Each editor needs a free GitHub account with *Write* access to this repository (GitHub repository → *Settings → Collaborators → Add people*).
4. Open `https://www.oxemarketingth.com/admin`, click **Login with GitHub**, and start editing.

The admin saves to the branch set in `admin/config.yml` (`backend.branch`). It must be the branch Vercel deploys to production (*Vercel → Settings → Git → Production Branch*). If you change one, change the other.

> GitHub only allows one callback URL per OAuth app, so log in from the address you entered there (`www.oxemarketingth.com`). To use the admin on another address too, such as a `*.vercel.app` preview, create a second OAuth app for it.

### Contact form

Enquiries are sent by [Web3Forms](https://web3forms.com), which is free and works on any host.

1. On web3forms.com, enter `Sales@oxemarketingth.com` and you'll receive an **access key** by email.
2. Paste it into *Admin → Pages → Contact details & settings → Contact form key* and publish.

Enquiries then arrive in that inbox. Until a key is set, the form opens the visitor's email app or WhatsApp, with their message filled in, so no enquiry is lost.

## For developers

- **Content files.** All content lives in `content/`:
  - one YAML file per page (`home`, `services`, `portfolio`, `about`, `blog-page`, `contact`), plus `site` (menu, footer and shared sections), `clients` and `settings`;
  - one file per project in `content/projects/`;
  - one Markdown file per article in `content/blog/`.

  Keys starting with `sec_` only group fields into admin sections. `src/content.py` and `src/blog_posts.py` load the files; `src/build.py` holds the page templates. When you add a field, add it to `admin/config.yml` too.
- **Dependencies.** The build needs only Python 3.8 or newer. PyYAML and Markdown are bundled in `src/vendor/`. Pillow is optional and adds WebP conversion of new uploads.
- **Build.**

  ```bash
  pip install -r requirements.txt
  python3 src/build.py      # regenerates every page, /work, /blog and sitemap.xml
  ```

  Vercel runs `scripts/vercel-build.sh` on every push (see `vercel.json`). It installs the requirements, builds the pages, and copies only the public files into `public/`.
- **Edit locally with the admin panel.** Run `npx decap-server` in the repository and `python3 -m http.server 8080`, then open `http://localhost:8080/admin/`. Changes are written straight to the files.
- **Checks.** GitHub Actions runs the same build on every push (`.github/workflows/build.yml`).
- **Videos.** Videos go in `assets/video/<name>.mp4`, each with a cover image. The build converts images to WebP automatically, from any JPG or PNG.
- **3D illustrations.** These are in `src/art.py`. All of them share the same materials (white matte, OXE blue, soft shadow), so new ones stay consistent.

## Still to do before launch

- [ ] Set up the admin login and the contact form key (see above).
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
4. Add the admin login environment variables (see *One-time setup* above) and the contact form key.

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
