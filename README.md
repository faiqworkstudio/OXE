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

Go to **https://www.oxemarketingth.com/admin** and log in with your email and password. The admin uses the OXE look and is built for this site, and nothing goes live until you publish.

The switch at the top of the admin moves between two workspaces:

- **Website**: edit the site, with live preview and publishing (below).
- **Leads**: manage enquiries. The red number on the switch is how many new leads are waiting for a reply.

| Area | What you can do |
|---|---|
| **Dashboard** | See unpublished changes, live/hidden articles, projects and media at a glance; quick actions; recent activity |
| **Pages** (Home, Services, Portfolio, About, Blog page, Contact) | Edit every heading, text, button, photo, video and Google (SEO) text; add, remove and reorder list items such as services, principles, facts, steps and industries |
| **Blog articles** | Create, edit, duplicate, hide or show, and delete articles; Markdown editor with buttons for headings, lists, quotes and tip boxes; Google snippet preview |
| **Portfolio projects** | Create, edit, duplicate, reorder (▲▼) and delete projects, with cover style, gallery, video and case study |
| **Media library** | Upload by drag and drop (images are resized and converted to WebP in the browser); **import from Google Drive** by pasting share links or a folder link; replace a file everywhere it's used; delete it, with a warning when it's still in use; see where each file is used. Videos stored in Vercel Blob are listed too (marked *Cloud*) |
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

### Leads

Every enquiry sent through the website's contact form is saved as a lead, together with the page it came from and the campaign (UTM) or referring website. Lead changes save instantly; there is nothing to publish.

| Area | What you can do |
|---|---|
| **All leads** | Search by name, email, phone, company or message. Filter by service, sort by date, follow-up or value. Change a lead's status right in the list. Select several to move, export or delete them together. Export to CSV (opens in Excel or Google Sheets) |
| **Views** | New · Follow-ups due (today or overdue) · In progress · Won · Lost, with counts in the menu |
| **Pipeline board** | Columns for New → Contacted → Qualified → Proposal sent → Won / Lost. Drag a card to move it, with the total expected value per stage |
| **A lead** | One-tap **Email**, **Call** and **WhatsApp** buttons. Each opens a ready-written greeting, notes the contact in the lead's activity, and moves a New lead to Contacted (with Undo). Pipeline stepper; follow-up date (Today, Tomorrow, In 3 days…); notes you can edit or delete; editable details (saved when you leave a field); the full enquiry and where it came from |
| **Add lead** | Add enquiries that came by phone, WhatsApp, LINE, email or in person |

Deleting a lead shows **Undo** for a few seconds. With a Web3Forms key set, each enquiry is also emailed to you. Leads need one-time setup: see *Setting up the admin*, steps 1 and 5.

In headings, wrap words in `*asterisks*` to show them in the italic serif accent, e.g. `Our *Services*`.

### Logging in

The admin login uses **Supabase Auth**. Supabase stores and checks passwords, limits repeated attempts and sends password-reset emails. After a successful login, the site gives the admin a signed, HttpOnly session cookie that lasts 12 hours.

**Demo account.** To look around before Supabase is connected, log in with:

- email: `demo`
- password: `OXE-demo-2026`

The demo uses a copy of the site's content, and publishing in it is only simulated, so the real website is never changed. Its Leads workspace shows sample leads that are kept in your browser only. To turn the demo off, set `ADMIN_DEMO=off` in Vercel and redeploy.

### Setting up the admin (once): connecting Supabase

Do these steps in order. Allow about 20 minutes. Each step names the exact place to click.

**1. Create the database tables**
1. Supabase → your project → **SQL Editor** → **New query**.
2. Open `supabase/setup.sql` from this repository, copy all of it, paste it in, and press **Run**. You should see *Success. No rows returned*. This creates:
   - the `leads` table;
   - a `security_events` table that counts failed logins.

   Both are locked with Row Level Security, so the public key can't read them. It's safe to run again after future updates.
3. Check: **Advisors → Security Advisor** should show no errors for `leads` or `security_events`.

**2. Lock down sign-ups and logins**
1. **Authentication → Sign In / Providers**:
   - Keep **Email** enabled.
   - Turn **off** "Allow new users to sign up". Only people you add can have an account.
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://www.oxemarketingth.com`
   - **Redirect URLs**: add `https://www.oxemarketingth.com/admin`. Password-reset links only ever go to addresses on this list.
3. **Authentication → Attack Protection** (names can vary by plan):
   - Set the minimum password length to **12**, and require lowercase, uppercase, digits and symbols.
   - **Leaked password protection** in Supabase is a paid (Pro) feature, and you don't need it: the admin does the same check for free. Every login, password change and password reset is checked privately against Have I Been Pwned's list of breached passwords (only the first 5 characters of a scrambled version of the password are sent, never the password). If an account's password is breached or too simple (under 12 characters, or missing lowercase, uppercase, a number or a symbol), the admin asks for a new password before anything else works, and the server enforces this too. Anyone can change their own password anytime with the key button next to *Log out*. Supabase's advisor will keep showing its *Leaked Password Protection Disabled* warning; that's expected and safe to ignore.
   - Leave Supabase's own **CAPTCHA protection off**. The website runs its own checks (step 6), and Supabase's CAPTCHA would block the admin login.
4. **Authentication → Emails → SMTP Settings**: connect your own email sender, such as Hostinger email for `sales@oxemarketingth.com`, Resend or Brevo. Supabase's built-in sender only delivers to your Supabase team members and only a few emails an hour, so password resets need this.

**3. Create the admin accounts**
1. **Authentication → Users → Add user → Create new user**. Enter the email and a strong password, and tick **Auto Confirm User**. Repeat for each editor.
2. Make each account an admin. Either list the emails in `ADMIN_EMAILS` (step 5), or run this in the SQL Editor:

   ```sql
   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = 'you@oxemarketingth.com';
   ```

   Accounts that aren't admins are refused, even with the right password.

**4. Copy the keys.** Supabase → **Project Settings → API Keys** (the Project URL is under **Data API**, or the **Connect** button at the top). You need:
- the **Project URL**: `https://xxxx.supabase.co`;
- the **publishable** key (`sb_publishable_…`), or the legacy **anon** key;
- the **secret** key (`sb_secret_…`), or the legacy **service_role** key. **Never** paste this one anywhere except Vercel.

**5. Add them to Vercel.** Vercel → the project → **Settings → Environment Variables**. Add each one for **Production** (and Preview if you use previews), then **Deployments → ⋯ → Redeploy**:

- 🔒 **Secret**: gives access to something. In Vercel, tick **Sensitive** so it can't be read back. Never put it in code, chat, email or screenshots. If one leaks, create a new one at the source and replace it in Vercel.
- ⚙️ **Config**: a setting. It's harmless if seen, so it doesn't need to be marked Sensitive.

| Variable | Type | Value |
|---|---|---|
| `SUPABASE_URL` | ⚙️ Config | The Project URL |
| `SUPABASE_ANON_KEY` | ⚙️ Config | The publishable / anon key. It's designed to be public: the tables are locked, so it can't read anything. It's only used on the server here anyway |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 **Secret** | The secret / service_role key. It can read and change all data, so mark it **Sensitive**. Server-only, never sent to the browser |
| `SESSION_SECRET` | 🔒 **Secret** | A random string of at least 32 characters. Create one at <https://generate-secret.vercel.app/32>, or run `openssl rand -base64 32`. Changing it logs everyone out |
| `GITHUB_TOKEN` | 🔒 **Secret** | A GitHub fine-grained token for **this repository only**, with **Contents: Read and write** and an expiry date. The admin publishes through it; it is never sent to the browser |
| `TURNSTILE_SECRET_KEY` *(recommended)* | 🔒 **Secret** | Cloudflare Turnstile secret key (step 6). Setting it switches the "I'm human" check on |
| `GOOGLE_API_KEY` *(optional)* | 🔒 **Secret** | Only needed to import a **whole Drive folder** at once (single files work without it). Google Cloud Console → APIs & Services → enable **Google Drive API** → Credentials → Create API key → restrict it to the Google Drive API |
| `BLOB_READ_WRITE_TOKEN` *(added automatically)* | 🔒 **Secret** | Vercel creates this when you connect Blob storage for large videos. Don't edit it |
| `TURNSTILE_SITE_KEY` *(optional)* | ⚙️ Config | Not needed: the site key `0x4AAAAAAFOAs13rqrJZF0b9` is built in (it's public by design). Set it only to use a different widget, e.g. Cloudflare's test key `1x00000000000000000000AA` when testing locally |
| `ADMIN_EMAILS` *(optional)* | ⚙️ Config | Comma-separated admin emails, e.g. `sales@oxemarketingth.com, faiq@…` |
| `GITHUB_BRANCH` *(optional)* | ⚙️ Config | The branch Vercel deploys to production (default: `claude/website-design-requirements-89zc90`) |
| `GITHUB_REPO` *(optional)* | ⚙️ Config | `owner/name` of the repository (default: `faiqworkstudio/OXE`) |
| `ADMIN_DEMO` *(set when live)* | ⚙️ Config | `off` turns off the demo account. Do this once your real accounts work |

**6. Turn on the "I'm human" check (free).** The Cloudflare Turnstile widget already exists, and its site key `0x4AAAAAAFOAs13rqrJZF0b9` is built into the site.
1. In Cloudflare → **Turnstile** → the widget → **Settings**, make sure the **Hostnames** include `oxemarketingth.com` and `www.oxemarketingth.com`. Also add your `….vercel.app` address if you want to test on Vercel preview links. On any other address the widget shows an error and visitors fall back to email/WhatsApp.
2. Copy the widget's **Secret key** into Vercel as `TURNSTILE_SECRET_KEY` (mark it Sensitive), then redeploy. That switches it on.
3. Test: open the Contact page. An "I'm human" box appears above the send button, usually ticking itself. Send a test enquiry and check it appears in Leads.

Most visitors never see a puzzle; Cloudflare decides in the background.

How it works:
- The widget gives the form a one-time token.
- The server checks that token with Cloudflare, confirms it came from the contact form (`action: contact`), and refuses reused or expired tokens.
- If the widget can't load at all (blocked by a browser extension or network), the visitor isn't stuck: their message is handed to email or WhatsApp instead.

**7. Test it**
1. Open `/admin` and log in with your new account.
2. Send a test enquiry from the Contact page, wait a few seconds after the page loads, and check that it appears under **Leads**.
3. Try **Forgot password?** once and check that the email arrives.

- **Videos over 3.3 MB** are stored in **Vercel Blob**, whether uploaded or imported from Google Drive. Enable it once: **Vercel → Storage → Create → Blob**, then connect it to this project (this adds `BLOB_READ_WRITE_TOKEN`). Smaller videos and all images are stored with the website files. Blob videos appear in *Media library → Videos* with a *Cloud* badge; deleting one there removes it from storage immediately. For long videos (full ads, interviews), use YouTube or Vimeo instead: they're free, stream better on slow phones and help search.
- **Google Drive import.** *Media library → Import from Google Drive* (also *From Google Drive* in every photo or video picker). Share the files as "Anyone with the link" and paste the links, one per line, or a folder link (folders need `GOOGLE_API_KEY`).
  - Photos are resized on the server (up to 60 MB originals, any orientation) to fit 2000 px as WebP, then added like uploads.
  - Videos must be MP4 or WebM, up to 300 MB, and go to Vercel Blob.
  - iPhone HEIC photos need saving as JPG first.

  The website never loads anything from Drive itself. Drive isn't made for serving websites: it has view limits and is slow, and links break when files move.
- **Email alerts for new enquiries (optional).** Paste a free Web3Forms key into *Contact & settings → Contact form key*. On web3forms.com, enter `Sales@oxemarketingth.com` and the key is emailed to you. Enquiries are saved to Leads either way. If neither leads nor a key is set up, the form opens the visitor's email app or WhatsApp with their message.

### Security: what protects the site

**Contact form (bots and spam)**, in layers:
1. **Hidden honeypot field.** Bots fill it in and are silently ignored.
2. **Signed time token.** The page must first fetch a token from the server, and the form is only accepted 3 seconds to 12 hours later. Instant bot posts and replays are dropped.
3. **Cloudflare Turnstile** (when its keys are set).
4. **Limits per sender.** At most 3 enquiries an hour and 10 a day, plus a per-minute brake.
5. **Content checks.** No more than 3 links per message, and exact duplicates are ignored.
6. **Origin check** and length limits on every field.

Senders' IP addresses are never stored, only a keyed fingerprint used for the limits.

**Admin login**
- Passwords are checked by Supabase Auth.
- An account is locked for 15 minutes after 5 wrong passwords, and an address after 20 attempts. Reset emails are limited to 3 per hour per email.
- Only admin accounts get in, and sign-ups are off.
- Sessions use a signed, HttpOnly, SameSite=Strict cookie that expires after 12 hours. To log everyone out immediately, change `SESSION_SECRET` and redeploy.
- Every change request must come from the admin page itself (same-origin and custom-header checks against cross-site attacks).

**Data**
- Leads live in Supabase behind Row Level Security. The secret key exists only in Vercel's server functions.
- The GitHub token is limited to this repository.
- Lead details are always shown as plain text, never as HTML.
- CSV exports are protected against spreadsheet formula tricks.

**Browser security headers** (`vercel.json`), on every page:
- A strict **Content-Security-Policy**: only this site's own scripts, plus named services (Google Fonts, Cloudflare, Web3Forms, and the admin's editor libraries) can run.
- **HSTS**: HTTPS only.
- **X-Frame-Options**: other sites can't embed the site to trick clicks.
- **nosniff**, a strict **Referrer-Policy**, and a **Permissions-Policy** that blocks camera, microphone and location.

The admin and `/api` are hidden from search engines.

> If you add a new outside service later (a chat widget, a booking tool, Google Analytics' inline snippet), add its domain to the matching `Content-Security-Policy` in `vercel.json`, or the browser will block it.

**Extra protection on Vercel (recommended).**
- Under **Vercel → the project → Firewall**, turn on the **Bot Protection** / managed rules your plan offers.
- If the site is ever attacked, switch on **Attack Challenge Mode** there.
- Under **Settings → Deployment Protection**, keep preview deployments protected.
- In GitHub, turn on **two-factor authentication** for every account with access to this repository and to Vercel.

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
  - `session` handles login, logout and password reset through Supabase Auth (`api/_lib/auth.js`).
  - `repo/*` provides `bundle`, `tree`, `file`, `blob` (upload), `commit` (atomic publish with a conflict check), `history` and `deploy` (status).
  - `lead` (public): `GET` hands out a signed form token, and `POST` saves a contact-form enquiry. `leads` (login required) lists, adds, edits, re-stages, notes, deletes and restores leads. Both use `api/_lib/leads.js` and the `leads` table from `supabase/setup.sql`, through Supabase's REST API with the service role key. Bot, spam and login protection is in `api/_lib/security.js`.
  - `drive` imports a shared Google Drive file (photos resized with `sharp`, videos streamed into Vercel Blob) or lists a shared folder. `blobs` lists and deletes the videos in Blob. `upload` issues Blob tokens for large browser uploads.
  - `upload` issues Vercel Blob tokens for large videos.
  - Writes are limited to `content/` and `assets/img|video/`, and core page files can't be deleted.
- **Build.** The build needs only Python 3.8 or newer: PyYAML and Markdown are bundled in `src/vendor/`, and Pillow is optional (WebP conversion).

  ```bash
  python3 src/build.py            # pages, /work, /blog, sitemap.xml
  bash scripts/vercel-build.sh    # what Vercel runs: build + public/ + admin preview engine
  ```

  GitHub Actions runs the same build on every push (`.github/workflows/build.yml`).
- **Admin locally.** This runs the admin against a local git checkout, with real commits and no GitHub token. Or just use the demo account:

  ```bash
  bash scripts/vercel-build.sh
  ADMIN_LOCAL_REPO=/path/to/a/clone SUPABASE_URL=https://….supabase.co SUPABASE_ANON_KEY=… \
    ADMIN_EMAILS=you@example.com SESSION_SECRET=$(openssl rand -hex 24) node scripts/admin-dev-server.js 3000
  ```
- **Videos** are files in `assets/video/<name>.mp4`, or full URLs (Vercel Blob). Every video field has a cover-image field next to it.
- **3D illustrations** are in `src/art.py`. All of them share the same materials (white matte, OXE blue, soft shadow), so new ones stay consistent.

## Still to do before launch

- [ ] Set up the admin (environment variables above), the leads table and the contact form key.
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
