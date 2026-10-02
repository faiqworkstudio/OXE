import { api } from "./api.js";
import { T, LANG_META, t as tr } from "./i18n.js";
import { AGENTS } from "./seed.js";

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const ICON = {
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>',
  done: '<svg viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="28" cy="28" r="25"/><path d="M17 29l7 7 15-15"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/></svg>',
  line: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11.1c0 4 3.6 7.4 8.4 8 .3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s6-3.5 8.2-6.1A7.4 7.4 0 0 0 22 11.1C22 6.6 17.5 3 12 3zM8.3 13.5H6.4a.5.5 0 0 1-.5-.5V9.1a.5.5 0 0 1 1 0v3.4h1.4a.5.5 0 0 1 0 1zm2 -.5a.5.5 0 0 1-1 0V9.1a.5.5 0 0 1 1 0zm4.6 0a.5.5 0 0 1-.9.3l-2-2.7V13a.5.5 0 0 1-1 0V9.1a.5.5 0 0 1 .9-.3l2 2.7V9.1a.5.5 0 0 1 1 0zm3.1-2.4a.5.5 0 0 1 0 1h-1.4v.9h1.4a.5.5 0 0 1 0 1h-1.9a.5.5 0 0 1-.5-.5V9.1c0-.3.2-.5.5-.5h1.9a.5.5 0 0 1 0 1h-1.4v.9z"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/></svg>',
  yt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z"/></svg>',
  li: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 8.5h-3V20h3zM5 3.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM20.5 13.2c0-3-1.6-4.9-4.2-4.9-1.4 0-2.4.8-2.8 1.5V8.5h-3V20h3v-6c0-1.5.6-2.6 2-2.6s1.9 1 1.9 2.6v6h3z"/></svg>',
};

// ---------- State ----------
const params = new URLSearchParams(location.search);
const LANGS = Object.keys(LANG_META);
let lang = params.get("lang");
if (!LANGS.includes(lang)) {
  try { lang = localStorage.getItem("aeterna-lang"); } catch {}
  if (!LANGS.includes(lang)) lang = (navigator.language || "en").slice(0, 2);
  if (!LANGS.includes(lang)) lang = "en";
}
const t = (k, v) => tr(lang, k, v);
let projects = [];
let filters = { q: "", cat: "", region: "", type: "", price: "", status: "", sort: "featured" };

// Keep UTM parameters from the landing URL for the whole visit.
const UTM_KEY = "aeterna-utm";
if (params.get("utm_source")) {
  try {
    sessionStorage.setItem(UTM_KEY, JSON.stringify({
      source: params.get("utm_source") || "", medium: params.get("utm_medium") || "", campaign: params.get("utm_campaign") || "",
    }));
  } catch {}
}
const utm = () => { try { return JSON.parse(sessionStorage.getItem(UTM_KEY)) || {}; } catch { return {}; } };

const pText = (p, key) => (p.i18n?.[lang]?.[key]) || p.i18n?.en?.[key] || "";
const money = (n) => {
  if (n >= 1e6) return "US$" + (n / 1e6).toFixed(n % 1e6 ? 2 : 1).replace(/\.?0+$/, "") + "M";
  return "US$" + Math.round(n / 1000) + "k";
};
const PRICE = { "": [0, Infinity], "<500k": [0, 5e5], "500k-1m": [5e5, 1e6], "1m-3m": [1e6, 3e6], "3m+": [3e6, Infinity] };
const BUDGET_LABEL = { "<500k": "< US$500k", "500k-1m": "US$500k – 1M", "1m-3m": "US$1M – 3M", "3m+": "US$3M +" };

// ---------- Analytics (demo) ----------
// Real site: GA4 via gtag and Meta Pixel + Conversions API, loaded only after consent.
let consent = null;
try { consent = localStorage.getItem("aeterna-consent"); } catch {}
window.dataLayer = window.dataLayer || [];
function track(event, data = {}) {
  window.dataLayer.push({ event, ...data });
  if (consent !== "granted") return;
  const pixel = event === "generate_lead" ? " · Meta Pixel: Lead" : "";
  $("#trackLog").textContent = `GA4 event: ${event}${pixel}`;
  clearTimeout(track.tm);
  track.tm = setTimeout(() => ($("#trackLog").textContent = ""), 3500);
}

// ---------- Images: show a branded gradient if a photo fails ----------
document.addEventListener("error", (e) => {
  const el = e.target;
  if (el.tagName !== "IMG" || el.dataset.ph) return;
  const ph = document.createElement("div");
  ph.className = "ph";
  ph.setAttribute("role", "img");
  ph.setAttribute("aria-label", el.alt || "");
  el.dataset.ph = "1";
  el.replaceWith(ph);
}, true);
const imgTag = (src, alt, eager) => `<img src="${esc(src)}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

// ---------- Chrome (header, footer, chat, cookie) ----------
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = LANG_META[lang].dir;
  try { localStorage.setItem("aeterna-lang", lang); } catch {}
  const u = new URL(location.href);
  u.searchParams.set("lang", lang);
  history.replaceState(null, "", u);
  document.querySelectorAll("[data-t]").forEach((el) => (el.textContent = t(el.dataset.t)));

  $("#nav").innerHTML = `
    <a href="#projects">${esc(t("nav_projects"))}</a>
    <a href="#/?cat=wellness" data-cat="wellness">${esc(t("cat_wellness"))}</a>
    <a href="#/?cat=longevity" data-cat="longevity">${esc(t("cat_longevity"))}</a>
    <a href="#/?cat=virgin-islands" data-cat="virgin-islands">${esc(t("cat_virgin-islands"))}</a>
    <a href="#about">${esc(t("nav_about"))}</a>
    <a href="#contact">${esc(t("nav_contact"))}</a>`;

  $("#lang").innerHTML = `
    <button class="lang__btn" aria-haspopup="true" aria-expanded="false" aria-label="${esc(t("language"))}">${ICON.globe}${esc(LANG_META[lang].short)}</button>
    <ul class="lang__menu" hidden>${LANGS.map((l) => `<li><button data-lang="${l}" lang="${l}" aria-current="${l === lang}">${esc(LANG_META[l].label)}<small>${l.toUpperCase()}</small></button></li>`).join("")}</ul>`;

  const year = new Date().getFullYear();
  $("#footer").innerHTML = `
    <div class="wrap">
      <div class="footer__grid">
        <div>
          <a class="logo" href="#/"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="currentColor"/><path d="M16 7l7 18h-3l-1.6-4.4h-4.8L12 25H9z" fill="#10201c"/></svg><span>AETERNA<small>ESTATES</small></span></a>
          <p>${esc(t("footer_tagline"))}</p>
          <div class="social">
            <a href="#" aria-label="Facebook">${ICON.fb}</a><a href="#" aria-label="Instagram">${ICON.ig}</a>
            <a href="#" aria-label="YouTube">${ICON.yt}</a><a href="#" aria-label="LinkedIn">${ICON.li}</a><a href="#" aria-label="LINE">${ICON.line}</a>
          </div>
        </div>
        <div><h4>${esc(t("nav_projects"))}</h4><ul>
          <li><a href="#/?cat=wellness">${esc(t("cat_wellness"))}</a></li>
          <li><a href="#/?cat=longevity">${esc(t("cat_longevity"))}</a></li>
          <li><a href="#/?cat=virgin-islands">${esc(t("cat_virgin-islands"))}</a></li></ul></div>
        <div><h4>${esc(t("f_region"))}</h4><ul>
          <li><a href="#/?region=thailand">${esc(t("region_thailand"))}</a></li>
          <li><a href="#/?region=bvi">${esc(t("region_bvi"))}</a></li></ul></div>
        <div><h4>${esc(t("nav_contact"))}</h4><ul>
          <li><a href="mailto:sales@aeterna-demo.com">sales@aeterna-demo.com</a></li>
          <li><a href="tel:+6600000000" dir="ltr">+66 00 000 0000</a></li>
          <li><a href="#contact">${esc(t("enquire"))}</a></li></ul></div>
      </div>
      <div class="footer__base"><span>© ${year} Aeterna Estates (${esc(t("sample"))}). ${esc(t("rights"))}</span><span><a href="#">${esc(t("privacy"))}</a> · <a href="#">${esc(t("terms"))}</a></span></div>
    </div>`;

  $("#chat").innerHTML = `
    <a class="line" href="https://line.me/" target="_blank" rel="noopener" aria-label="LINE">${ICON.line}</a>
    <a class="wa" href="https://wa.me/66824480050" target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.wa}</a>`;

  renderCookie();
}

function renderCookie() {
  const el = $("#cookie");
  if (consent) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<p>${esc(t("cookies_text"))}</p><div>
    <button class="btn btn--sm" data-consent="granted">${esc(t("cookies_accept"))}</button>
    <button class="btn btn--sm btn--ghost" data-consent="denied">${esc(t("cookies_reject"))}</button></div>`;
}

// ---------- Views ----------
function heroImage() {
  return (projects.find((p) => p.id === "aeterna-phuket") || projects[0])?.image || "";
}
function collImage(cat) {
  const p = projects.find((x) => x.categories.includes(cat) && x.featured) || projects.find((x) => x.categories.includes(cat));
  return p?.image || "";
}

function viewHome() {
  const cats = ["wellness", "longevity", "virgin-islands"];
  $("#main").innerHTML = `
    <section class="hero">
      <div class="hero__img">${imgTag(heroImage(), "", true)}</div>
      <div class="wrap hero__in">
        <p class="eyebrow">${esc(t("hero_eyebrow"))}</p>
        <h1>${esc(t("hero_title"))}</h1>
        <p>${esc(t("hero_sub"))}</p>
        <form class="search" id="heroSearch" role="search">
          <input type="search" name="q" placeholder="${esc(t("search_placeholder"))}" aria-label="${esc(t("search_btn"))}" value="${esc(filters.q)}">
          <button class="btn">${esc(t("search_btn"))}</button>
        </form>
        <div class="chips">${cats.map((c) => `<button class="chip" data-cat="${c}">${esc(t("cat_" + c))}</button>`).join("")}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section__head"><p class="eyebrow">${esc(t("hero_eyebrow"))}</p><h2>${esc(t("collections_title"))}</h2><p>${esc(t("collections_sub"))}</p></div>
        <div class="collections">${cats.map((c) => `
          <button class="coll" data-cat="${c}">
            ${imgTag(collImage(c), "")}
            <span class="count">${esc(countLabel(projects.filter((p) => p.categories.includes(c)).length))}</span>
            <h3>${esc(t("cat_" + c))}</h3>
            <p>${esc(t("catd_" + c))}</p>
            <span class="btn btn--light btn--sm">${esc(t("explore"))}</span>
          </button>`).join("")}
        </div>
      </div>
    </section>

    <section class="section section--paper" id="projects">
      <div class="wrap">
        <div class="section__head"><h2>${esc(t("projects_title"))}</h2><p>${esc(t("projects_sub"))}</p></div>
        <form class="filters" id="filters" role="search" aria-label="${esc(t("projects_title"))}">
          <label class="field field--q"><span>${esc(t("search_btn"))}</span><input class="input" type="search" name="q" placeholder="${esc(t("search_placeholder"))}"></label>
          <label class="field"><span>${esc(t("f_region"))}</span><select class="select" name="region">
            <option value="">${esc(t("f_all"))}</option><option value="thailand">${esc(t("region_thailand"))}</option><option value="bvi">${esc(t("region_bvi"))}</option></select></label>
          <label class="field"><span>${esc(t("f_type"))}</span><select class="select" name="type">
            <option value="">${esc(t("f_all"))}</option>${["villa", "condo", "penthouse", "land"].map((x) => `<option value="${x}">${esc(t("type_" + x))}</option>`).join("")}</select></label>
          <label class="field"><span>${esc(t("f_price"))}</span><select class="select" name="price">
            <option value="">${esc(t("price_any"))}</option>${Object.entries(BUDGET_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
          <label class="field"><span>${esc(t("f_status"))}</span><select class="select" name="status">
            <option value="">${esc(t("f_all"))}</option>${["prelaunch", "construction", "selling", "ready", "soldout"].map((x) => `<option value="${x}">${esc(t("status_" + x))}</option>`).join("")}</select></label>
          <div class="filters__cats">
            <div class="seg" role="group" aria-label="${esc(t("f_category"))}">
              <button type="button" data-fcat="">${esc(t("f_all"))}</button>
              ${cats.map((c) => `<button type="button" data-fcat="${c}">${esc(t("cat_" + c))}</button>`).join("")}
            </div>
          </div>
        </form>
        <div class="results-bar">
          <div><strong id="count" aria-live="polite"></strong><button class="link" id="clear" type="button">${esc(t("clear"))}</button></div>
          <select class="select" id="sort" aria-label="Sort">
            <option value="featured">${esc(t("sort_featured"))}</option><option value="asc">${esc(t("sort_price_asc"))}</option><option value="desc">${esc(t("sort_price_desc"))}</option></select>
        </div>
        <div class="grid" id="grid"></div>
      </div>
    </section>

    <section class="section" id="about">
      <div class="wrap about">
        <div>
          <p class="eyebrow">${esc(t("nav_about"))}</p>
          <h2 class="section__head" style="font-size:clamp(30px,4vw,46px)">${esc(t("about_title"))}</h2>
          <p>${esc(t("about_text"))}</p>
          <div class="stats">
            <div class="stat"><strong>${projects.length}</strong><span>${esc(t("stat_projects"))}</span></div>
            <div class="stat"><strong>40+</strong><span>${esc(t("stat_countries"))}</span></div>
            <div class="stat"><strong>5</strong><span>${esc(t("stat_languages"))}</span></div>
            <div class="stat"><strong>24/7</strong><span>${esc(t("stat_support"))}</span></div>
          </div>
        </div>
        <div class="about__img">${imgTag((projects.find((p) => p.id === "samui-sanctuary") || projects[0])?.gallery?.[1] || "", "")}</div>
      </div>
    </section>

    <section class="section section--paper" id="contact">
      <div class="wrap contact">
        <div class="contact__side">
          <p class="eyebrow">${esc(t("nav_contact"))}</p>
          <h2 style="font-size:clamp(30px,4vw,46px)">${esc(t("contact_title"))}</h2>
          <p style="color:var(--muted)">${esc(t("contact_sub"))}</p>
          <ul>
            <li>${ICON.mail}<a href="mailto:sales@aeterna-demo.com">sales@aeterna-demo.com</a></li>
            <li>${ICON.phone}<a href="tel:+6600000000" dir="ltr">+66 00 000 0000</a></li>
            <li>${ICON.wa}<a href="https://wa.me/66824480050" target="_blank" rel="noopener">WhatsApp</a></li>
            <li>${ICON.line}<a href="https://line.me/" target="_blank" rel="noopener">LINE @aeterna-demo</a></li>
          </ul>
        </div>
        <div id="contactForm">${formHTML({ type: "enquiry" })}</div>
      </div>
    </section>`;

  const f = $("#filters");
  for (const k of ["q", "region", "type", "price", "status"]) f.elements[k].value = filters[k];
  $("#sort").value = filters.sort;
  renderGrid();
}

function countLabel(n) {
  return n === 1 ? t("result_one") : t("results", { n });
}

function filtered() {
  const q = filters.q.toLowerCase().trim();
  const [lo, hi] = PRICE[filters.price] || PRICE[""];
  let list = projects.filter((p) => {
    if (filters.cat && !p.categories.includes(filters.cat)) return false;
    if (filters.region && p.region !== filters.region) return false;
    if (filters.type && p.type !== filters.type) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (p.priceFrom < lo || p.priceFrom >= hi) return false;
    if (q) {
      const hay = [p.name, p.location, pText(p, "tagline"), pText(p, "description"), ...p.features.map((f) => t("ft_" + f)), ...p.categories.map((c) => t("cat_" + c))].join(" ").toLowerCase();
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  if (filters.sort === "asc") list.sort((a, b) => a.priceFrom - b.priceFrom);
  else if (filters.sort === "desc") list.sort((a, b) => b.priceFrom - a.priceFrom);
  else list.sort((a, b) => (b.featured - a.featured) || (a.status === "soldout") - (b.status === "soldout"));
  return list;
}

function cardHTML(p) {
  const statusCls = p.status === "soldout" ? " badge--soldout" : p.status === "prelaunch" ? " badge--prelaunch" : "";
  return `
    <a class="card" href="#/project/${esc(p.id)}">
      <div class="card__img">${imgTag(p.image, p.name)}
        <div class="badges"><span class="badge badge--status${statusCls}">${esc(t("status_" + p.status))}</span>${p.categories.map((c) => `<span class="badge">${esc(t("cat_" + c))}</span>`).join("")}</div>
      </div>
      <div class="card__body">
        <span class="card__loc">${ICON.pin}${esc(p.location)}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(pText(p, "tagline"))}</p>
        <div class="card__meta">
          <div class="price"><small>${esc(t("from"))}</small><strong dir="ltr">${money(p.priceFrom)}</strong></div>
          <span class="card__go">${esc(t("view"))} ${LANG_META[lang].dir === "rtl" ? "←" : "→"}</span>
        </div>
      </div>
    </a>`;
}

function renderGrid() {
  const list = filtered();
  $("#grid").innerHTML = list.length ? list.map(cardHTML).join("") : `<div class="empty" style="grid-column:1/-1">${esc(t("no_results"))}</div>`;
  $("#count").textContent = countLabel(list.length);
  document.querySelectorAll("[data-fcat]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fcat === filters.cat)));
  document.querySelectorAll("#nav [data-cat]").forEach((a) => a.setAttribute("aria-current", String(a.dataset.cat === filters.cat)));
  const active = ["q", "cat", "region", "type", "price", "status"].some((k) => filters[k]);
  $("#clear").hidden = !active;
}

function viewProject(id) {
  const p = projects.find((x) => x.id === id);
  if (!p) { location.hash = "#/"; return; }
  const agent = AGENTS.find((a) => a.langs[0] === lang) || AGENTS[0];
  const primary = p.status === "soldout" ? "waitlist" : "viewing";
  const g = [...p.gallery, p.image, p.image].slice(0, 3);
  document.title = `${p.name} — Aeterna Estates (Demo)`;
  $("#main").innerHTML = `
    <section class="detail-hero">
      <div class="wrap">
        <a class="crumb" href="#/projects">${ICON.back}${esc(t("back"))}</a>
        <div class="detail-head">
          <div>
            <p class="eyebrow">${p.categories.map((c) => esc(t("cat_" + c))).join(" · ")}</p>
            <h1>${esc(p.name)}</h1>
            <span class="card__loc" style="margin-top:8px">${ICON.pin}${esc(p.location)}</span>
          </div>
          <span class="badge badge--status${p.status === "soldout" ? " badge--soldout" : p.status === "prelaunch" ? " badge--prelaunch" : ""}" style="font-size:14px;padding:8px 14px">${esc(t("status_" + p.status))}</span>
        </div>
        <div class="gallery">${g.map((src, i) => `<div>${imgTag(src, i ? "" : p.name, i === 0)}</div>`).join("")}</div>
        <div class="detail">
          <div>
            <div class="facts">
              <div class="fact"><small>${esc(t("from"))}</small><strong dir="ltr">${money(p.priceFrom)}</strong></div>
              <div class="fact"><small>${esc(t("beds"))}</small><strong>${esc(p.beds)}</strong></div>
              <div class="fact"><small>${esc(t("size"))}</small><strong dir="ltr">${esc(p.size)}</strong></div>
              <div class="fact"><small>${esc(t("completion"))}</small><strong>${esc(p.completion)}</strong></div>
            </div>
            <h2>${esc(t("overview"))}</h2>
            <p class="lead">${esc(pText(p, "tagline"))}</p>
            <p>${esc(pText(p, "description"))}</p>
            <h2>${esc(t("features_title"))}</h2>
            <ul class="features">${p.features.map((f) => `<li>${ICON.check}${esc(T[lang]["ft_" + f] || T.en["ft_" + f] || f)}</li>`).join("")}</ul>
            <h2>${esc(t("location_title"))}</h2>
            <div class="map"><iframe title="${esc(t("location_title"))}: ${esc(p.location)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(p.mapQuery || p.location)}&output=embed"></iframe></div>
          </div>
          <aside class="aside">
            <div class="price"><small>${esc(t("from"))}</small><strong dir="ltr">${money(p.priceFrom)}</strong></div>
            <button class="btn" data-open="${primary}" data-project="${esc(p.id)}">${esc(t(primary === "waitlist" ? "waitlist" : "book_viewing"))}</button>
            <button class="btn btn--ghost" data-open="brochure" data-project="${esc(p.id)}">${esc(t("brochure"))}</button>
            <a class="btn btn--ghost" href="https://wa.me/66824480050?text=${encodeURIComponent(p.name)}" target="_blank" rel="noopener">${ICON.wa.replace("<svg", '<svg width="18" height="18"')} WhatsApp</a>
            <hr>
            <div class="aside__agent"><span class="avatar">${esc(agent.name.split(" ").map((w) => w[0]).join(""))}</span><span><strong style="color:var(--ink)">${esc(agent.name)}</strong><br><span dir="ltr">${agent.langs.map((l) => l.toUpperCase()).join(" · ")}</span></span></div>
          </aside>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap contact">
        <div class="contact__side"><h2 style="font-size:clamp(28px,3.6vw,40px)">${esc(t("contact_title"))}</h2><p style="color:var(--muted)">${esc(t("contact_sub"))}</p></div>
        <div>${formHTML({ type: "enquiry", projectId: p.id })}</div>
      </div>
    </section>`;
  window.scrollTo({ top: 0 });
  track("view_item", { item_id: p.id, item_name: p.name });
}

// ---------- Lead forms ----------
function formHTML({ type, projectId = "" }) {
  const opts = projects.map((p) => `<option value="${esc(p.id)}" ${p.id === projectId ? "selected" : ""}>${esc(p.name)}</option>`).join("");
  return `
    <form class="form" data-lead-form data-type="${type}" novalidate>
      <label class="field"><span>${esc(t("form_name"))} *</span><input class="input" name="name" autocomplete="name" required maxlength="120"><small class="err" data-err="name"></small></label>
      <label class="field"><span>${esc(t("form_email"))}</span><input class="input" name="email" type="email" autocomplete="email" maxlength="160" dir="ltr"><small class="err" data-err="email"></small></label>
      <label class="field"><span>${esc(t("form_phone"))}</span><input class="input" name="phone" type="tel" autocomplete="tel" maxlength="40" dir="ltr"></label>
      <label class="field"><span>${esc(t("form_country"))}</span><input class="input" name="country" autocomplete="country-name" maxlength="60"></label>
      <label class="field ${type === "enquiry" ? "" : "full"}"><span>${esc(t("form_project"))}</span><select class="select" name="projectId"><option value="">${esc(t("form_project_any"))}</option>${opts}</select></label>
      ${type === "enquiry" ? `<label class="field"><span>${esc(t("form_budget"))}</span><select class="select" name="budget"><option value="">—</option>${Object.entries(BUDGET_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>` : ""}
      <label class="field full"><span>${esc(t("form_message"))}</span><textarea class="textarea" name="message" maxlength="2000"></textarea></label>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="check full"><input type="checkbox" name="consent"><span>${esc(t("form_consent"))}</span></label>
      <small class="err full" data-err="consent"></small>
      <div class="full"><button class="btn" type="submit">${esc(t("form_submit"))}</button> <small class="err" data-err="form"></small></div>
    </form>`;
}

async function submitLead(form) {
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());
  data.consent = fd.get("consent") === "on";
  const errs = {};
  if (!data.name.trim()) errs.name = t("err_name");
  if (!data.email.trim() && !data.phone.trim()) errs.email = t("err_contact");
  else if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errs.email = t("err_email");
  if (!data.consent) errs.consent = t("err_consent");
  form.querySelectorAll("[data-err]").forEach((el) => (el.textContent = errs[el.dataset.err] || ""));
  form.querySelectorAll("[name]").forEach((el) => el.removeAttribute("aria-invalid"));
  for (const k of Object.keys(errs)) form.elements[k]?.setAttribute("aria-invalid", "true");
  if (Object.keys(errs).length) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }

  const btn = form.querySelector("[type=submit]");
  btn.disabled = true;
  btn.textContent = t("form_sending");
  try {
    const res = await api("POST", "/leads", {
      ...data, type: form.dataset.type, language: lang, utm: utm(),
      page: location.pathname + location.hash,
    });
    track("generate_lead", { form_type: form.dataset.type, project: data.projectId || "" });
    form.outerHTML = `
      <div class="success" tabindex="-1">${ICON.done}
        <h3>${esc(t("form_success_title"))}</h3><p>${esc(t("form_success_text"))}</p>
        <div class="demo-note">Demo: this enquiry is now lead <strong>${esc(res.id || "")}</strong> in the CRM, auto-assigned to an agent who speaks ${esc(LANG_META[lang].label)}, with an email alert and an auto-reply logged. <a href="admin/#/leads/${esc(res.id || "")}" target="_blank">Open it in the CRM →</a></div>
      </div>`;
  } catch {
    btn.disabled = false;
    btn.textContent = t("form_submit");
    form.querySelector('[data-err="form"]').textContent = t("form_error");
  }
}

function openModal(type, projectId) {
  const titles = { brochure: ["brochure_title", "brochure_text"], viewing: ["viewing_title", "viewing_text"], waitlist: ["waitlist_title", "waitlist_text"] };
  const [h, p] = titles[type];
  $("#modalBody").innerHTML = `<h2 id="modalTitle">${esc(t(h))}</h2><p>${esc(t(p))}</p>${formHTML({ type, projectId })}`;
  $("#modalClose").setAttribute("aria-label", t("close"));
  $("#modal").showModal();
  track("form_open", { form_type: type });
}

// ---------- Router ----------
function readHashFilters() {
  const [, query = ""] = location.hash.split("?");
  const q = new URLSearchParams(query);
  if ([...q.keys()].length) {
    filters = { ...filters, q: "", cat: "", region: "", type: "", price: "", status: "" };
    for (const k of ["q", "cat", "region", "type", "price", "status"]) if (q.get(k)) filters[k] = q.get(k);
  }
  return [...q.keys()].length > 0;
}

let currentView = "";
function route() {
  const h = location.hash || "#/";
  const m = h.match(/^#\/project\/([\w-]+)/);
  if (m) { currentView = "project"; viewProject(m[1]); return; }
  if (h.startsWith("#/") || h === "#") {
    const hadFilters = readHashFilters();
    document.title = "Aeterna Estates — Wellness & Longevity Residences (Demo)";
    if (currentView !== "home") { currentView = "home"; viewHome(); }
    else renderGrid();
    if (hadFilters || h.startsWith("#/projects")) {
      requestAnimationFrame(() => $("#projects")?.scrollIntoView());
      if (hadFilters) track("filter", { ...filters });
    } else if (h === "#/" ) window.scrollTo({ top: 0 });
  } else if (currentView !== "home") {
    // In-page anchor (#contact) from a project page: render home, then scroll.
    currentView = "home";
    viewHome();
    requestAnimationFrame(() => document.querySelector(h)?.scrollIntoView());
  }
  $("#nav").classList.remove("is-open");
  $("#burger").setAttribute("aria-expanded", "false");
}

// ---------- Events ----------
document.addEventListener("click", (e) => {
  const langBtn = e.target.closest(".lang__btn");
  const menu = $(".lang__menu");
  if (langBtn) { const open = menu.hidden; menu.hidden = !open; langBtn.setAttribute("aria-expanded", String(open)); return; }
  const pickLang = e.target.closest("[data-lang]");
  if (pickLang) {
    lang = pickLang.dataset.lang;
    applyLang();
    currentView = "";
    route();
    track("language_change", { language: lang });
    return;
  }
  if (menu && !menu.hidden && !e.target.closest(".lang")) menu.hidden = true;

  const cat = e.target.closest("[data-cat]:not(a)");
  if (cat) { location.hash = "#/?cat=" + cat.dataset.cat; return; }
  const fcat = e.target.closest("[data-fcat]");
  if (fcat) { filters.cat = fcat.dataset.fcat; renderGrid(); track("filter", { cat: filters.cat }); return; }
  if (e.target.closest("#clear")) {
    filters = { ...filters, q: "", cat: "", region: "", type: "", price: "", status: "" };
    const f = $("#filters");
    for (const k of ["q", "region", "type", "price", "status"]) f.elements[k].value = "";
    renderGrid();
    return;
  }
  const open = e.target.closest("[data-open]");
  if (open) { openModal(open.dataset.open, open.dataset.project); return; }
  const c = e.target.closest("[data-consent]");
  if (c) {
    consent = c.dataset.consent;
    try { localStorage.setItem("aeterna-consent", consent); } catch {}
    renderCookie();
    if (consent === "granted") track("consent_granted");
    return;
  }
  if (e.target.closest("#burger")) {
    const nav = $("#nav");
    nav.classList.toggle("is-open");
    $("#burger").setAttribute("aria-expanded", String(nav.classList.contains("is-open")));
  }
  if (e.target.closest("#nav a")) { $("#nav").classList.remove("is-open"); $("#burger").setAttribute("aria-expanded", "false"); }
});

document.addEventListener("input", (e) => {
  const f = e.target.closest("#filters");
  if (!f) return;
  filters[e.target.name] = e.target.value;
  renderGrid();
});
document.addEventListener("change", (e) => {
  if (e.target.id === "sort") { filters.sort = e.target.value; renderGrid(); }
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "heroSearch") {
    e.preventDefault();
    filters.q = e.target.elements.q.value;
    const f = $("#filters");
    f.elements.q.value = filters.q;
    renderGrid();
    $("#projects").scrollIntoView();
    track("search", { search_term: filters.q });
    return;
  }
  if (e.target.matches("[data-lead-form]")) { e.preventDefault(); submitLead(e.target); }
  if (e.target.id === "filters") e.preventDefault();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { const m = $(".lang__menu"); if (m) m.hidden = true; $("#nav").classList.remove("is-open"); }
});
$("#modalClose").addEventListener("click", () => $("#modal").close());
$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") $("#modal").close(); });
window.addEventListener("hashchange", route);
window.addEventListener("scroll", () => $("#header").classList.toggle("is-scrolled", scrollY > 10), { passive: true });

// ---------- Boot ----------
(async function boot() {
  applyLang();
  try {
    projects = (await api("GET", "/projects")).projects;
  } catch {
    projects = [];
  }
  route();
  track("page_view", { language: lang });
})();
