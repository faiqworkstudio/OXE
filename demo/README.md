# Client demo: Aeterna Estates (website + admin + CRM)

A working sample of the full system proposed to the real estate client. "Aeterna Estates", its projects, people and leads are fictional sample content.

- **Website:** `/demo/`
- **Admin & CRM:** `/demo/admin/`. Demo password: `aeterna-demo`

## What it shows (mapped to the client's checklist)

| Client requirement | Where in the demo |
|---|---|
| Worldwide audience; project presentation | Home, three collections, project pages with gallery, key facts, highlights and map |
| Search & filter: Wellness / Longevity / Virgin Islands | Hero search, collection cards, filter bar (collection, destination, type, budget, status), sorting; links like `#/?cat=longevity` can be shared |
| Multilingual TH / EN / DE / ZH / AR | Language switcher; Arabic is fully right-to-left; script-specific fonts; `?lang=` in the URL plus hreflang tags |
| Standard pages | Home, projects, project detail, about, contact, footer with legal links |
| Backend customization | Admin → Projects & content: edit details, collections, highlights, photo, publish/feature, and translations side by side per language |
| Sales pipeline / lead management | Admin → Dashboard, Pipeline (drag and drop), Leads (search, filters, CSV export), lead detail with notes, agent assignment and an activity log |
| CRM connected directly to the website | Every website form (enquiry, brochure, viewing, waiting list) creates a lead with language, project, UTM and page data |
| Facebook leads into the CRM | "Simulate Facebook lead" shows the Meta webhook → Graph API → lead flow. The real webhook verification endpoint is `/api/demo/webhooks/facebook` |
| Google Analytics / Search Console / Meta Pixel | Consent banner; tracked events appear in the top demo bar; Admin → Integrations |
| Other integrations | WhatsApp, LINE, email alerts and auto-reply, outgoing webhook / Zapier |
| Developer + client access | Admin → Users & roles, with a permissions matrix |
| Responsive | Tested at 375px and up, for both the website and the admin |

## Suggested pitch walkthrough (5 minutes)

1. Open the website in English, switch to **العربية** (right-to-left), then **中文**.
2. Click **Longevity**, add the **British Virgin Islands** filter, then open a project.
3. Click **Download brochure** and submit the form. The thank-you message shows the new lead ID.
4. Open the **admin** (password above). The lead is at the top of the Dashboard, already assigned to an agent who speaks the buyer's language.
5. Under **Pipeline**, drag the lead to *Contacted*. Open it, add a note and look at the activity log.
6. Under **Integrations**, click **Send test lead** to show a Facebook Lead Ad arriving.
7. Under **Projects & content**, change a price or the Arabic text, save, then click **Preview**. The website updates immediately.
8. To clean up before the next pitch, go to **Settings → Reset demo data**.

## How it works

- `demo/index.html`, `assets/site.*`: the public website (no framework).
- `demo/admin/`: the admin and CRM.
- `demo/assets/core.js`: the API router (leads, projects, settings, stats, Facebook simulation).
- `netlify/functions/demo-api.mjs`: serves `core.js` at `/api/demo/*` and stores the data in **Netlify Blobs**. This is the real shared backend once deployed.
- `demo/assets/api.js`: calls the backend. When no backend is reachable (for example on a plain static server), it runs the same router in the browser using localStorage. The admin footer shows which mode is active.

### Run locally

```bash
npm install
npm run dev:demo      # http://localhost:8888/demo/  (backend state is kept in memory)
```

### Deploy

Push to the branch Netlify builds. Netlify installs `@netlify/blobs` and deploys the function automatically (`netlify.toml` sets the functions directory). No environment variables are needed. You can optionally set `FB_VERIFY_TOKEN` for the Meta webhook handshake.

## Not production-ready, by design

- There is one shared demo password; production would have a login per user, with roles enforced on the server.
- Facebook leads are simulated. Going live needs a Meta app, the `leads_retrieval` permission and a page access token.
- Photos come from Unsplash and fall back to a branded gradient if they fail to load.
- Translations are sample drafts and need review by native speakers.
- The production site would use language paths (`/th/`, `/ar/` …) with server-rendered pages for SEO.
