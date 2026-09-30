# OXE Marketing — Website Design

The website design for **OXE Marketing Thailand**, a multicultural marketing agency in Bangkok.
It follows the *OXE websites guidelines* brief and the *What is OXE — Overall Guide* content document.
The layout follows the client's mockup. Section patterns (the work ticker, numbered process, FAQ accordion and pill buttons) are adapted from asiamediastudio.com, the main reference, using OXE's blue and white.

It is a fast static site: plain HTML, CSS and a small amount of JavaScript. It has no build step, so it can go live on Netlify as it is.
It also serves as the pixel reference for the planned WordPress + Elementor build.

## Pages

| Page | File | Contents |
|---|---|---|
| Home | `index.html` | Hero, services overview, Why OXE, auto-scrolling "Selected work" strip, featured case study (tailor website), CTA |
| Services | `services.html` | Website Design, Video Production, Social Media Marketing (each with its "Include" list), Photography, Digital Strategy and Branding, industries, a five-step process, FAQ |
| Portfolio | `portfolio.html` | Category filter, project cards plus "View More Projects", and a pop-up with Client / Challenge / Solution / Outcome, photos or a playable video, and the services provided |
| About Us | `about.html` | Story, stats, mission & vision, values, brands we've worked with |
| Contact | `contact.html` | Contact form, phone, email, WhatsApp button, Google Map, FAQ |
| — | `thank-you.html`, `404.html` | Form fallback page and not-found page |

## Brief checklist

- **Branding:** OXE logo (taken from the reference-work PDF), light blue & white theme, Poppins + Inter fonts, consistent spacing scale (see the `:root` tokens in `assets/css/style.css`)
- **Home:** hero ✔ services overview ✔ Why OXE ✔ featured case study ✔ CTA ✔
- **Services:** Website Design ✔ Video Production ✔ Social Media Marketing ✔
- **Portfolio:** filter by category ✔ project cards ✔ Client / Challenge / Solution / Outcome ✔
- **Contact:** form ✔ WhatsApp button (on the page, plus a floating button on every page) ✔ email ✔ phone ✔ Google Map ✔
- **Technical:** mobile responsive ✔ fast loading (about 1.3 MB of images, lazy-loaded) ✔ basic SEO (titles, meta descriptions, canonical, Open Graph, `sitemap.xml`, `robots.txt`) ✔ SSL (automatic on Netlify) ✔ Google Analytics ready (GA4 snippet commented out in every `<head>`) ✔

## Put it live on Netlify

**Option A: connect the GitHub repository (recommended; redeploys on every push)**

1. Sign in at <https://app.netlify.com> and choose **Add new site → Import an existing project → GitHub**.
2. Pick the `faiqworkstudio/OXE` repository and the branch you want to publish.
3. Leave **Build command** empty and set **Publish directory** to `.`, because `netlify.toml` already sets this. Then click **Deploy**.
4. Under **Domain management**, add `oxemarketingth.com`. Netlify issues the free SSL certificate automatically.

**Option B: drag and drop.** Download the repository as a ZIP, unzip it, and drag the folder onto <https://app.netlify.com/drop>.

### Contact form (Netlify Forms)

The form is already set up for Netlify Forms (`data-netlify="true"`, with a honeypot to block spam).
After the first deploy:

- Go to **Site configuration → Forms** and enable form detection if Netlify asks you to, then redeploy once.
- Submissions appear under **Forms → contact**. To have them emailed to the team, open **Forms → Form notifications → Add notification → Email** and enter `Sales@oxemarketingth.com`.

If the site is opened outside Netlify, for example directly from disk, the form falls back to opening the visitor's email app or WhatsApp.

## Still to do before launch

- Confirm the client names on the portfolio cards (for example Wine Connection, Haji Café, DH Foods) and the FAQ answers (prices, timelines).
- To add a project, put its photos in `assets/img/work/` and add an entry with its Client / Challenge / Solution / Outcome.
- Videos live in `assets/video/` (web-compressed H.264 with a poster frame in `assets/img/work/*-poster.jpg`). To add one, drop the MP4 there and give the project a `video` name.
- Add the real social media links in the footer. They currently point to `#`.
- Add the GA4 measurement ID: uncomment the snippet in each page's `<head>` and replace `G-XXXXXXXXXX`.
- If OXE has a street address, update the map `src` on `contact.html`. It currently centres on Bangkok.
- Confirm the budget ranges in the contact form and the "20+ brands" figure.

## Moving to WordPress + Elementor

The brief asks for a WordPress + Elementor site that can be edited without coding. Each section of this design maps directly to an Elementor section:

- **Global settings:** in *Site Settings → Global Colors*, add Primary `#0B47A8`, Secondary `#2F80ED`, Accent `#3EC1E0`, Light `#E6F4FD` and Text `#0F1B2D`. In *Global Fonts*, set Poppins for headings and Inter for text.
- **Header and footer:** Theme Builder → Header / Footer.
- **Service cards, Why OXE items and industries:** Icon Box widgets in a 3-column container.
- **Portfolio:** a *Portfolio* custom post type. Use ACF fields for Client, Challenge, Solution, Outcome and Services, then a Loop Grid with taxonomy filter set to category.
- **Contact form:** Elementor Pro *Form* widget, with the same fields and options as the form here.
- **Floating WhatsApp button:** a plugin such as *Click to Chat*, with the number set to `66824480050`.
- **Hosting:** SSL via the host or Let's Encrypt, Rank Math or Yoast for SEO, Site Kit for Google Analytics.

## Project structure

```
index.html  services.html  portfolio.html  about.html  contact.html
thank-you.html  404.html  netlify.toml  robots.txt  sitemap.xml
assets/
  css/style.css      design tokens, components, responsive rules
  js/main.js         mobile menu, scroll reveal, portfolio filter & pop-up, form
  img/oxe-logo.png   logo (transparent PNG)
  img/work/          portfolio and section images
```

To preview locally, run `python3 -m http.server` in this folder and open <http://localhost:8000>.
