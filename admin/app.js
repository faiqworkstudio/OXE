/* OXE Marketing admin.
 *
 * Content lives in the GitHub repository (content/*.yml, content/blog/*.md, content/projects/*.yml,
 * assets/...). The admin reads it through /api/repo/*, keeps every edit as a local draft
 * (browser storage) until you publish, previews drafts with the site's real page builder
 * (preview-worker.js), and publishes all drafts as one commit. Vercel then rebuilds the site.
 * Forms are generated from admin/schema.yml.
 */
(function () {
  "use strict";

  // ------------------------------------------------------------------ tiny DOM helpers
  const $ = (s, el) => (el || document).querySelector(s);
  function h(tag, attrs) {
    const el = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "text") el.textContent = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, v);
    }
    for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach((x) => add(el, x));
    else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const PATHS = {
    home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    page: "M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5",
    blog: "M4 5h16M4 10h16M4 15h10M4 20h7",
    work: "M3 7h18v13H3zM8 7V4h8v3",
    media: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5a1.5 1.5 0 1 0 0-.01",
    menu: "M4 6h16M4 12h16M4 18h16",
    logos: "M12 3l2.6 5.6L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.4-.7z",
    cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
    dash: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
    out: "M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3",
    plus: "M12 5v14M5 12h14",
    up: "M12 19V5M5 12l7-7 7 7",
    down: "M12 5v14M19 12l-7 7-7-7",
    trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
    copy: "M9 9h11v11H9zM5 15H4V4h11v1",
    x: "M6 6l12 12M18 6L6 18",
    chev: "M6 9l6 6 6-6",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    ext: "M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5",
    desk: "M3 4h18v12H3zM8 20h8M12 16v4",
    tab: "M6 3h12v18H6zM11 18h2",
    phone: "M8 2h8v20H8zM11 19h2",
    upload: "M12 16V4M7 9l5-5 5 5M4 16v4h16v-4",
    undo: "M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
    refresh: "M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
    video: "M3 6h12v12H3zM15 10l6-3v10l-6-3",
    check: "M5 12l5 5 9-11",
    link: "M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  };
  const icon = (n) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "i"); s.innerHTML = `<path d="${PATHS[n] || ""}"/>`; return s; };
  const slugify = (t) => String(t || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
  const ago = (d) => { const s = (Date.now() - new Date(d)) / 1000; if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + " min ago"; if (s < 86400) return Math.floor(s / 3600) + " h ago"; if (s < 604800) return Math.floor(s / 86400) + " days ago"; return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); };
  const kb = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
  const plainText = (s) => String(s == null ? "" : s).replace(/\*/g, "");

  // ------------------------------------------------------------------ toasts & dialogs
  function toast(text, kind, link) {
    const t = h("div", { class: "toast" + (kind ? " toast--" + kind : "") }, text, link ? h("a", { href: link.href, target: "_blank", rel: "noopener" }, link.text) : null);
    $("#toasts").appendChild(t);
    setTimeout(() => t.remove(), kind === "bad" ? 9000 : 5000);
  }
  function modal({ title, body, foot, wide, onClose }) {
    const close = () => { ov.remove(); document.removeEventListener("keydown", key); onClose && onClose(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    const ov = h("div", { class: "overlay", onclick: (e) => { if (e.target === ov) close(); } },
      h("div", { class: "modal" + (wide ? " modal--wide" : ""), role: "dialog", "aria-modal": "true", "aria-label": title },
        h("div", { class: "modal__head" }, h("h2", {}, title), h("button", { class: "close", "aria-label": "Close", onclick: close }, icon("x"))),
        h("div", { class: "modal__body" }, body),
        foot ? h("div", { class: "modal__foot" }, foot) : null));
    document.body.appendChild(ov);
    document.addEventListener("keydown", key);
    setTimeout(() => { const f = ov.querySelector("input, textarea, select, .modal__foot .btn"); f && f.focus(); }, 50);
    return { close, el: ov };
  }
  function confirmBox(title, text, okLabel, danger) {
    return new Promise((resolve) => {
      let done = false;
      const m = modal({
        title, body: h("p", { style: { margin: 0 } }, text),
        foot: [h("button", { class: "btn btn--ghost", onclick: () => { done = true; m.close(); resolve(false); } }, "Cancel"),
               h("button", { class: "btn" + (danger ? " btn--danger-solid" : ""), onclick: () => { done = true; m.close(); resolve(true); } }, okLabel)],
        onClose: () => { if (!done) resolve(false); },
      });
    });
  }

  // ------------------------------------------------------------------ API
  let reauth = null;
  async function api(method, url, data) {
    if (S.demo) return demoApi(method, url, data);
    const r = await fetch(url, {
      method, credentials: "same-origin",
      headers: Object.assign({ "X-OXE-Admin": "1" }, data ? { "Content-Type": "application/json" } : {}),
      body: data ? JSON.stringify(data) : undefined,
    });
    if (r.status === 401 && url !== "/api/session" && S.user) {
      await (reauth = reauth || loginAgain());
      reauth = null;
      return api(method, url, data);
    }
    const out = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(out.error || `Request failed (${r.status})`); e.status = r.status; e.data = out; throw e; }
    return out;
  }

  // ------------------------------------------------------------------ YAML documents
  const Y = {
    load: (t) => jsyaml.load(t || "", { schema: jsyaml.CORE_SCHEMA }) || {},
    // quoted strings so the site builder (PyYAML) reads exactly what was typed
    dump: (o) => jsyaml.dump(o, { schema: jsyaml.CORE_SCHEMA, lineWidth: -1, noRefs: true, forceQuotes: true, quotingType: "'" }),
  };
  const FRONT = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
  function parseDoc(path, text) {
    if (text == null) return null;
    if (path.endsWith(".md")) {
      const m = String(text).match(FRONT);
      const data = m ? Y.load(m[1]) : {};
      data.body = (m ? m[2] : text).replace(/^\n+/, "").replace(/\s+$/, "");
      if (data.date instanceof Date) data.date = data.date.toISOString().slice(0, 10);
      return data;
    }
    return Y.load(text);
  }
  function dumpDoc(path, data) {
    if (path.endsWith(".md")) {
      const front = Object.assign({}, data);
      const body = front.body || "";
      delete front.body;
      return "---\n" + Y.dump(front) + "---\n\n" + String(body).trim() + "\n";
    }
    return Y.dump(data);
  }
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ------------------------------------------------------------------ state
  const S = {
    user: null, schema: null, head: null, files: {}, media: [], norm: {},
    drafts: { base: null, items: {} }, blobURLs: {}, route: "", lastPublish: null,
  };
  const dkey = () => (S.demo ? "oxe-admin:demo-drafts:v1" : "oxe-admin:drafts:v1");
  const lkey = () => (S.demo ? "oxe-admin:demo-last" : "oxe-admin:last");
  function loadDrafts() { S.drafts = { base: null, items: {} }; try { const d = JSON.parse(localStorage.getItem(dkey())); if (d && d.items) S.drafts = d; } catch (e) { /* none */ } }
  function saveDrafts() {
    try { localStorage.setItem(dkey(), JSON.stringify(S.drafts)); }
    catch (e) { toast("Your browser storage is full: publish or discard some changes.", "bad"); }
    refreshChrome();
  }
  const draftCount = () => Object.keys(S.drafts.items).length;
  function current(path) {
    const d = S.drafts.items[path];
    if (d) return d.delete ? null : (d.text !== undefined ? d.text : null);
    return S.files[path] !== undefined ? S.files[path] : null;
  }
  function normalized(path) {
    if (!(path in S.norm) && S.files[path] !== undefined) S.norm[path] = dumpDoc(path, parseDoc(path, S.files[path]));
    return S.norm[path];
  }
  function setText(path, text) {
    if (S.files[path] !== undefined && (text === S.files[path] || text === normalized(path))) delete S.drafts.items[path];
    else S.drafts.items[path] = { text };
    if (!S.drafts.base) S.drafts.base = S.head;
    saveDrafts();
    preview.sync({ [path]: current(path) });
  }
  function discard(path) {
    const d = S.drafts.items[path];
    delete S.drafts.items[path];
    if (d && d.media) idb.del(path);
    if (!draftCount()) S.drafts.base = null;
    saveDrafts();
    preview.sync({ [path]: current(path) });
  }

  // pending media files (uploaded, not yet published): kept in IndexedDB for previews
  const idb = {
    db: null,
    open() { return this.db || (this.db = new Promise((res, rej) => { const r = indexedDB.open(S.demo ? "oxe-admin-demo" : "oxe-admin", 1); r.onupgradeneeded = () => r.result.createObjectStore("media"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); },
    async put(k, v) { const db = await this.open(); return new Promise((res) => { const t = db.transaction("media", "readwrite"); t.objectStore("media").put(v, k); t.oncomplete = res; t.onerror = res; }); },
    async get(k) { const db = await this.open(); return new Promise((res) => { const r = db.transaction("media").objectStore("media").get(k); r.onsuccess = () => res(r.result); r.onerror = () => res(null); }); },
    async del(k) { const db = await this.open(); return new Promise((res) => { const t = db.transaction("media", "readwrite"); t.objectStore("media").delete(k); t.oncomplete = res; t.onerror = res; }); },
    async clear() { const db = await this.open(); return new Promise((res) => { const t = db.transaction("media", "readwrite"); t.objectStore("media").clear(); t.oncomplete = res; t.onerror = res; }); },
  };
  async function restoreBlobURLs() {
    for (const [p, d] of Object.entries(S.drafts.items)) {
      if (d.media && !S.blobURLs[p]) { const b = await idb.get(p); if (b) S.blobURLs[p] = URL.createObjectURL(b); }
    }
  }
  // URL to show an asset in the admin (pending upload, or the live site file)
  function assetURL(path) {
    if (!path) return "";
    if (/^https?:\/\//.test(path)) return path;
    const p = path.replace(/^\//, "");
    return S.blobURLs[p] || "/" + p;
  }

  // ------------------------------------------------------------------ entities (what can be edited)
  const PAGE_META = {
    home: ["home", "The front page: hero, services, Why OXE, Our Works, latest articles"],
    services: ["page", "Hero, the services, industries"],
    portfolio: ["work", "Hero, featured project, project grid labels"],
    about: ["page", "Hero, key facts, mission, story, why choose OXE"],
    "blog-page": ["blog", "Blog page heading and the labels on every article"],
    contact: ["page", "Hero, enquiry form texts, steps, map"],
    site: ["menu", "Top menu, footer, shared sections, thank-you & 404 pages"],
    clients: ["logos", "Client logos shown on the site"],
    settings: ["cog", "Contact details, social links, brand images, form options"],
  };
  const coll = (name) => S.schema.collections.find((c) => c.name === name);
  const pageFiles = () => coll("pages").files;
  function pageEntity(name) { const f = pageFiles().find((x) => x.name === name); return f && { kind: "page", name, label: f.label, path: f.file, fields: f.fields, route: "page:" + name, href: "#/page/" + name }; }
  function folderEntities(cname) {
    const c = coll(cname), dir = c.folder + "/", ext = "." + c.extension;
    const paths = new Set(Object.keys(S.files).filter((p) => p.startsWith(dir) && p.endsWith(ext)));
    Object.keys(S.drafts.items).forEach((p) => { if (p.startsWith(dir) && p.endsWith(ext)) paths.add(p); });
    return [...paths].map((path) => {
      const id = path.slice(dir.length, -ext.length);
      const text = current(path), data = parseDoc(path, text) || parseDoc(path, S.files[path]) || {};
      const d = S.drafts.items[path];
      const state = d ? (d.delete ? "deleted" : S.files[path] === undefined ? "new" : "edited") : "";
      return cname === "blog"
        ? { kind: "blog", id, path, data, state, label: data.title || id, fields: c.fields, route: "blog:" + id, href: "#/blog/" + id }
        : { kind: "project", id, path, data, state, label: `${plainText(data.client || id)}: ${plainText(data.title || "")}`, fields: c.fields, route: "project:" + id, href: "#/project/" + id };
    });
  }
  function describe(path) {
    const p = pageFiles().find((f) => f.file === path);
    if (p) return { label: p.label + " page", href: "#/page/" + p.name, kind: "Page" };
    let m = path.match(/^content\/blog\/(.+)\.md$/);
    if (m) { const d = parseDoc(path, current(path) || S.files[path]) || {}; return { label: d.title || m[1], href: "#/blog/" + m[1], kind: "Article" }; }
    m = path.match(/^content\/projects\/(.+)\.yml$/);
    if (m) { const d = parseDoc(path, current(path) || S.files[path]) || {}; return { label: `${plainText(d.client || m[1])}: ${plainText(d.title || "")}`, href: "#/project/" + m[1], kind: "Project" }; }
    if (/^assets\/video\//.test(path)) return { label: path.split("/").pop(), href: "#/media", kind: "Video" };
    return { label: path.split("/").pop(), href: "#/media", kind: "Image" };
  }

  // ------------------------------------------------------------------ validation
  function validate(fields, data, prefix, errors) {
    for (const f of fields || []) {
      if (f.widget === "hidden") continue;
      if (f.widget === "group") { validate(f.fields, data, prefix, errors); continue; }
      const key = prefix ? prefix + "." + f.name : f.name;
      const v = data ? data[f.name] : undefined;
      const required = f.required !== false && f.widget !== "boolean";
      const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
      if (required && empty) { errors[key] = "This field is required"; continue; }
      if (empty) continue;
      if (f.pattern && typeof v === "string" && !new RegExp(f.pattern[0]).test(v)) errors[key] = f.pattern[1];
      if (f.widget === "list") {
        if (f.min !== undefined && v.length < f.min) errors[key] = `Add at least ${f.min}`;
        if (f.max !== undefined && v.length > f.max) errors[key] = `At most ${f.max}`;
        if (f.fields) v.forEach((item, i) => validate(f.fields, item, key + "." + i, errors));
        else if (f.field) v.forEach((item, i) => { if (f.field.required !== false && (item === "" || item == null)) errors[key + "." + i] = "Empty item"; });
      }
      if (f.widget === "object") validate(f.fields, v, key, errors);
    }
    return errors;
  }
  function fieldsFor(path) {
    const p = pageFiles().find((f) => f.file === path);
    if (p) return p.fields;
    if (path.startsWith("content/blog/")) return coll("blog").fields;
    if (path.startsWith("content/projects/")) return coll("projects").fields;
    return null;
  }

  // ------------------------------------------------------------------ live preview
  const preview = {
    worker: null, ready: false, failed: false, seq: 0, waiting: {}, sizes: {}, listeners: [],
    start() {
      if (this.worker) return;
      try { this.worker = new Worker("/admin/preview-worker.js"); } catch (e) { this.failed = true; return; }
      this.worker.onmessage = (e) => {
        const m = e.data;
        if (m.type === "ready") { this.ready = true; this.emit({ ready: true }); }
        else if (m.type === "progress") this.emit({ progress: m.text });
        else if (m.type === "rendered" || m.type === "error") { const cb = this.waiting[m.id]; delete this.waiting[m.id]; cb && cb(m); }
      };
      this.worker.onerror = () => { this.failed = true; this.emit({ failed: true }); };
      const files = {};
      Object.keys(S.files).forEach((p) => { files[p] = current(p); });
      Object.keys(S.drafts.items).forEach((p) => { if (/^content\//.test(p)) files[p] = current(p); });
      this.worker.postMessage({ type: "init", origin: location.origin, files });
      this.syncAssets();
    },
    emit(ev) { this.listeners.forEach((fn) => fn(ev)); },
    sync(files) { if (this.worker) this.worker.postMessage({ type: "files", files: Object.fromEntries(Object.entries(files).filter(([p]) => /^content\//.test(p))) }); },
    syncAssets() {
      if (!this.worker) return;
      const paths = [], sizes = {};
      for (const [p, d] of Object.entries(S.drafts.items)) if (d.media) { paths.push(p); if (d.media.w) sizes[p] = [d.media.w, d.media.h]; }
      this.worker.postMessage({ type: "assets", paths, sizes });
    },
    render(route) {
      return new Promise((resolve) => { const id = ++this.seq; this.waiting[id] = resolve; this.worker.postMessage({ type: "render", id, route }); });
    },
  };
  function previewHTML(html) {
    let out = html;
    for (const [p, u] of Object.entries(S.blobURLs)) out = out.split(p).join(u);   // pending uploads
    // show everything at once: no entrance animations or scroll reveals while editing
    const still = "<style>.js .reveal,.js .reveal-clip,.js .split .w>span,.js .bstack__in,.js .ahero__lead,.js .ahero__meta,.js .phero__crumb{opacity:1!important;transform:none!important;clip-path:none!important;animation:none!important}.js .reveal-clip img,.js .reveal-clip video{transform:none!important}</style>";
    const base = `<base href="${location.origin}/">` + still;
    const guard = `<script>document.addEventListener("click",function(e){var a=e.target.closest("a");if(!a)return;var h=a.getAttribute("href")||"";if(h.charAt(0)==="#")return;e.preventDefault();parent.postMessage({oxePreviewNav:a.href},"*")},true);document.addEventListener("submit",function(e){e.preventDefault()},true);<\/script>`;
    return out.replace(/<head>/i, "<head>" + base).replace(/<\/body>/i, guard + "</body>");
  }
  function routeForURL(href) {
    let u;
    try { u = new URL(href); } catch (e) { return null; }
    if (u.origin !== location.origin) return null;
    const p = u.pathname.replace(/^\//, "").replace(/\.html$/, "");
    if (!p || p === "index") return "#/page/home";
    let m = p.match(/^blog\/(.+)$/); if (m) return "#/blog/" + m[1];
    m = p.match(/^work\/(.+)$/); if (m) return "#/project/" + m[1];
    const map = { services: "services", portfolio: "portfolio", about: "about", blog: "blog-page", contact: "contact" };
    return map[p] ? "#/page/" + map[p] : null;
  }
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin && e.origin !== "null") return;
    if (e.data && e.data.oxePreviewNav) { const r = routeForURL(e.data.oxePreviewNav); if (r) location.hash = r; else window.open(e.data.oxePreviewNav, "_blank", "noopener"); }
  });

  function previewPane(entity) {
    const sizes = { desktop: 1440, tablet: 820, mobile: 390 };
    let device = localStorage.getItem("oxe-admin:device") || "desktop";
    let override = null;     // { text, label } when previewing an older version
    const frame = h("iframe", { class: "preview__frame", title: "Live preview", sandbox: "allow-scripts allow-same-origin" });
    const note = h("div", { class: "preview__note" }, h("div", {}, h("div", { class: "spin" }), h("span", { class: "msg" }, "Preparing the live preview…")));
    const stage = h("div", { class: "preview__stage" }, frame, note);
    const status = h("span", { class: "preview__status" }, "");
    const banner = h("div", { class: "preview__banner", hidden: true });
    const tabs = h("div", { class: "tabs", role: "group", "aria-label": "Preview size" });
    const url = h("span", { class: "preview__url" }, "");
    const pane = h("div", { class: "card preview" },
      h("div", { class: "preview__bar" }, tabs, url, status,
        h("button", { class: "btn btn--ghost btn--icon btn--sm", title: "Refresh preview", "aria-label": "Refresh preview", onclick: () => api_.refresh(true) }, icon("refresh")),
        h("a", { class: "btn btn--ghost btn--icon btn--sm", title: "Open the live page", "aria-label": "Open the live page", target: "_blank", rel: "noopener", href: "#" }, icon("ext"))),
      banner, stage);
    [["desktop", "desk", "Desktop"], ["tablet", "tab", "Tablet"], ["mobile", "phone", "Phone"]].forEach(([k, ic, label]) => {
      tabs.appendChild(h("button", { class: device === k ? "is-active" : "", title: label, "aria-label": label, onclick: (e) => { device = k; localStorage.setItem("oxe-admin:device", k); [...tabs.children].forEach((b) => b.classList.toggle("is-active", b === e.currentTarget)); fit(); } }, icon(ic)));
    });
    function fit() {
      const w = sizes[device], sw = stage.clientWidth - (device === "desktop" ? 0 : 32);
      const scale = Math.min(1, sw / w);
      frame.style.width = w + "px";
      frame.style.height = (stage.clientHeight - (device === "desktop" ? 0 : 32)) / scale + "px";
      frame.style.transform = `translateX(-50%) scale(${scale})`;
      frame.style.top = device === "desktop" ? "0" : "16px";
    }
    new ResizeObserver(fit).observe(stage);
    let timer = null, busy = false, again = false, lastScroll = 0;
    const api_ = {
      el: pane,
      async refresh(now) {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          if (!preview.ready) return;
          if (busy) { again = true; return; }
          busy = true; status.textContent = "Updating…";
          if (override) preview.sync({ [entity.path]: override.text });
          const r = await preview.render(entity.route);
          if (override) preview.sync({ [entity.path]: current(entity.path) });
          busy = false;
          if (r.type === "error") { status.textContent = ""; note.hidden = false; note.querySelector(".msg").textContent = "Preview problem: " + r.message; note.querySelector(".spin").hidden = true; }
          else {
            try { lastScroll = frame.contentWindow.scrollY || lastScroll; } catch (e) { /* not loaded */ }
            frame.onload = () => { try { frame.contentWindow.scrollTo(0, lastScroll); } catch (e) { /* ignore */ } };
            frame.srcdoc = previewHTML(r.html);
            note.hidden = true; status.textContent = "";
            const live = "/" + r.path.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
            url.textContent = location.host + live;
            pane.querySelector("a.btn").href = live;
          }
          if (again) { again = false; api_.refresh(true); }
        }, now ? 0 : 450);
      },
      showVersion(text, label, onRestore) {
        override = { text };
        banner.hidden = false; banner.innerHTML = "";
        add(banner, [h("span", { style: { flex: 1 } }, `Previewing the version from ${label}`),
          h("button", { class: "btn btn--sm", onclick: onRestore }, "Restore this version"),
          h("button", { class: "btn btn--ghost btn--sm", onclick: () => { api_.clearVersion(); } }, "Back to current")]);
        api_.refresh(true);
      },
      clearVersion() { override = null; banner.hidden = true; api_.refresh(true); },
    };
    preview.listeners.push((ev) => {
      if (ev.progress) note.querySelector(".msg").textContent = ev.progress;
      if (ev.ready) api_.refresh(true);
      if (ev.failed) { note.querySelector(".msg").textContent = "The live preview couldn't start in this browser. Your edits still work; use “Open the live page” after publishing."; note.querySelector(".spin").hidden = true; }
    });
    preview.start();
    if (preview.ready) api_.refresh(true);
    setTimeout(fit, 0);
    return api_;
  }

  // ------------------------------------------------------------------ media helpers
  const FOLDERS = [
    { key: "assets/img/work", label: "Photos", kind: "image" },
    { key: "assets/img/clients", label: "Client logos", kind: "image" },
    { key: "assets/img/brand", label: "Brand", kind: "image", also: /^assets\/img\/[^/]+$/ },
    { key: "assets/video", label: "Videos", kind: "video" },
  ];
  const isImg = (p) => /\.(jpe?g|png|webp|gif|avif|svg|ico)$/i.test(p);
  const isVid = (p) => /\.(mp4|webm)$/i.test(p) || /blob\.vercel-storage\.com/.test(p);
  function folderOf(path) { return FOLDERS.find((f) => path.startsWith(f.key + "/") || (f.also && f.also.test(path))); }
  // the media library: one item per file name (a photo.jpg and its photo.webp are one item)
  function mediaItems() {
    const all = new Map();
    S.media.forEach((f) => all.set(f.path, { path: f.path, size: f.size }));
    for (const [p, d] of Object.entries(S.drafts.items)) {
      if (d.media) all.set(p, { path: p, size: d.media.size, pending: true });
      if (d.delete && all.has(p)) all.get(p).deleted = true;
    }
    const groups = new Map();
    for (const it of all.values()) {
      if (!isImg(it.path) && !isVid(it.path)) continue;
      const stem = it.path.replace(/\.[^.]+$/, "");
      const g = groups.get(stem) || { stem, files: [] };
      g.files.push(it); groups.set(stem, g);
    }
    return [...groups.values()].map((g) => {
      const main = g.files.find((f) => !/\.webp$/i.test(f.path) && !f.deleted) || g.files.find((f) => !f.deleted) || g.files[0];
      return { path: main.path, files: g.files, size: main.size, pending: g.files.some((f) => f.pending), deleted: g.files.every((f) => f.deleted), name: g.stem.split("/").pop(), folder: folderOf(main.path) };
    }).filter((m) => m.folder);
  }
  function usages(item) {
    const stem = item.path.replace(/\.[^.]+$/, "").replace(/^\//, "");
    const out = [];
    const paths = new Set(Object.keys(S.files).concat(Object.keys(S.drafts.items)));
    paths.forEach((p) => {
      if (!/^content\//.test(p)) return;
      const t = current(p);
      if (t && (t.includes("/" + stem + ".") || t.includes(stem + "."))) out.push(p);
    });
    return out;
  }
  function uniqueName(folder, stem, ext) {
    const taken = new Set(mediaItems().map((m) => m.path.replace(/\.[^.]+$/, "")));
    let name = stem || "file", n = 1;
    while (taken.has(`${folder}/${name}`)) name = `${stem}-${++n}`;
    return `${folder}/${name}.${ext}`;
  }
  const b64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(blob); });
  async function compressImage(file, keepAlpha) {
    if (/svg|ico/.test(file.type)) return { blob: file, ext: file.type.includes("svg") ? "svg" : "ico", w: 0, h: 0 };
    const bmp = await createImageBitmap(file);
    const max = 2000, scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), hgt = Math.round(bmp.height * scale);
    const c = document.createElement("canvas"); c.width = w; c.height = hgt;
    c.getContext("2d").drawImage(bmp, 0, 0, w, hgt);
    const blob = await new Promise((res) => c.toBlob(res, "image/webp", keepAlpha ? 0.92 : 0.84));
    if (!blob || blob.type !== "image/webp") {   // browsers without WebP encoding
      const jpg = await new Promise((res) => c.toBlob(res, keepAlpha ? "image/png" : "image/jpeg", 0.86));
      return { blob: jpg, ext: keepAlpha ? "png" : "jpg", w, h: hgt };
    }
    return { blob, ext: "webp", w, h: hgt };
  }
  let blobEnabled = null;
  async function uploadFile(file, folder, opts) {
    opts = opts || {};
    const onProgress = opts.onProgress || (() => {});
    const isVideo = /^video\//.test(file.type) || /\.(mp4|webm)$/i.test(file.name);
    const stem = slugify(file.name.replace(/\.[^.]+$/, "")) || "upload";
    if (isVideo) {
      if (!/mp4$/i.test(file.type) && !/\.mp4$/i.test(file.name)) throw new Error("Please upload videos as MP4 files.");
      if (file.size <= 3.3 * 1024 * 1024) {
        const path = opts.replace || uniqueName("assets/video", stem, "mp4");
        onProgress(30);
        const r = await api("POST", "/api/repo/blob", { path, content: await b64(file) });
        await registerMedia(path, file, { sha: r.sha, size: file.size, type: "video" }, opts.replace);
        onProgress(100);
        return "/" + path;
      }
      if (blobEnabled === null) blobEnabled = (await api("GET", "/api/upload")).enabled;
      if (!blobEnabled) throw new Error(`This video is ${kb(file.size)}. Videos over 3.3 MB need Vercel Blob storage (Vercel → Storage → Blob, connect to the project), or compress the video below 3.3 MB.`);
      const { upload } = await import("https://esm.sh/@vercel/blob@2.8.0/client");
      const res = await upload(`videos/${stem}.mp4`, file, { access: "public", handleUploadUrl: "/api/upload", headers: { "X-OXE-Admin": "1" }, onUploadProgress: (p) => onProgress(p.percentage) });
      onProgress(100);
      return res.url;
    }
    if (!/^image\//.test(file.type)) throw new Error("Please choose an image (JPG, PNG, WebP) or an MP4 video.");
    onProgress(10);
    const keepAlpha = /png|webp|gif/.test(file.type) && folder !== "assets/img/work";
    const out = await compressImage(file, keepAlpha);
    if (out.blob.size > 3.3 * 1024 * 1024) throw new Error("This image is still larger than 3.3 MB after compression. Please use a smaller image.");
    const path = opts.replace ? opts.replace.replace(/\.[^.]+$/, "." + out.ext) : uniqueName(folder, stem, out.ext);
    onProgress(50);
    const r = await api("POST", "/api/repo/blob", { path, content: await b64(out.blob) });
    await registerMedia(path, out.blob, { sha: r.sha, size: out.blob.size, w: out.w, h: out.h, type: "image" }, opts.replace);
    onProgress(100);
    return "/" + path;
  }
  async function registerMedia(path, blob, meta, replaced) {
    S.drafts.items[path] = { media: meta };
    if (!S.drafts.base) S.drafts.base = S.head;
    // replacing a photo: remove the old file(s) with the same name so the new one is used everywhere
    if (replaced) {
      const stem = replaced.replace(/\.[^.]+$/, "");
      S.media.filter((f) => f.path.replace(/\.[^.]+$/, "") === stem && f.path !== path).forEach((f) => { S.drafts.items[f.path] = { delete: true }; });
    }
    await idb.put(path, blob);
    S.blobURLs[path] = URL.createObjectURL(blob);
    saveDrafts();
    preview.syncAssets();
  }

  // media picker (choose from the library, or upload)
  function pickMedia(folderKey, kind, onPick) {
    let tab = FOLDERS.find((f) => f.key === folderKey) || FOLDERS[kind === "video" ? 3 : 0];
    let q = "";
    const grid = h("div", { class: "media-grid" });
    const tabs = h("div", { class: "tabs" });
    const draw = () => {
      grid.innerHTML = "";
      const items = mediaItems().filter((m) => !m.deleted && m.folder === tab && (!q || m.name.includes(q)));
      if (!items.length) grid.appendChild(h("div", { class: "empty" }, h("b", {}, "Nothing here yet"), "Upload a file to use it."));
      items.forEach((m) => grid.appendChild(mediaCard(m, () => { onPick("/" + m.path); mm.close(); })));
    };
    FOLDERS.filter((f) => (kind === "video") === (f.kind === "video")).forEach((f) => tabs.appendChild(h("button", { class: f === tab ? "is-active" : "", onclick: (e) => { tab = f; [...tabs.children].forEach((b) => b.classList.toggle("is-active", b === e.currentTarget)); draw(); } }, f.label)));
    const input = h("input", { type: "file", accept: kind === "video" ? "video/mp4" : "image/*", hidden: true, onchange: async () => {
      const f = input.files[0]; if (!f) return;
      try { const p = await withProgress(f.name, (cb) => uploadFile(f, tab.key, { onProgress: cb })); onPick(p); mm.close(); } catch (e) { toast(e.message, "bad"); }
    } });
    const mm = modal({
      title: kind === "video" ? "Choose a video" : "Choose an image", wide: true,
      body: [h("div", { class: "toolbar" }, tabs, h("div", { class: "search" }, icon("search"), h("input", { type: "search", placeholder: "Search by name", oninput: (e) => { q = slugify(e.target.value); draw(); } })),
        h("button", { class: "btn", onclick: () => input.click() }, icon("upload"), "Upload new"), input), grid],
    });
    draw();
  }
  function mediaCard(m, onClick) {
    const vid = isVid(m.path);
    const box = h("div", { class: "media-item__img" + (m.folder && m.folder.key === "assets/img/work" ? " cover" : "") });
    if (vid) box.appendChild(h("video", { src: assetURL(m.path), muted: true, preload: "metadata" }));
    else box.style.backgroundImage = `url("${assetURL(m.path)}")`;
    if (m.pending) box.appendChild(h("span", { class: "badge badge--new" }, "New"));
    if (m.deleted) box.appendChild(h("span", { class: "badge badge--del" }, "Deleting"));
    return h("div", { class: "card media-item", tabindex: "0", role: "button", onclick: onClick, onkeydown: (e) => { if (e.key === "Enter") onClick(); } },
      box, h("div", { class: "media-item__body" }, h("b", { title: m.name }, m.name), h("small", {}, (m.path.split(".").pop() || "").toUpperCase() + (m.size ? " · " + kb(m.size) : ""))));
  }
  function withProgress(name, fn) {
    const bar = h("i");
    const t = h("div", { class: "toast" }, h("div", { style: { flex: 1 } }, h("div", {}, "Uploading " + name), h("div", { class: "progress", style: { marginTop: "6px" } }, bar)));
    $("#toasts").appendChild(t);
    return fn((p) => { bar.style.width = Math.round(p) + "%"; }).finally(() => t.remove());
  }

  // ------------------------------------------------------------------ form builder (from admin/schema.yml)
  function summaryOf(tpl, item) {
    if (!tpl) return "";
    return plainText(tpl.replace(/\{\{fields\.([\w-]+)\}\}|\{\{([\w-]+)\}\}/g, (_, a, b) => { const v = item && item[a || b]; return v == null ? "" : typeof v === "object" ? "" : String(v); })).replace(/^\/assets\/[^ ]*\//, "").trim();
  }
  const patternMax = (f) => { const m = f.pattern && f.pattern[0].match(/\{(\d+),(\d+)\}/); return m ? Number(m[2]) : null; };

  function buildForm(fields, data, ctx) {
    const wrap = h("div", { class: "form" });
    fields.forEach((f) => { const el = buildField(f, data, ctx, ""); if (el) wrap.appendChild(el); });
    return wrap;
  }
  function fieldBox(f, ctx, path, control, opts) {
    opts = opts || {};
    const id = "f" + Math.random().toString(36).slice(2, 9);
    const label = h(opts.group ? "div" : "label", { class: opts.group ? "label" : null, for: opts.group ? null : id }, f.label || f.name,
      f.required === false && f.widget !== "boolean" ? h("span", { class: "opt" }, "optional") : null);
    const box = h("div", { class: "field", "data-path": path }, label, typeof control === "function" ? control(id, label) : control);
    if (f.hint) box.appendChild(h("p", { class: "hint" }, f.hint));
    box.appendChild(h("p", { class: "err", hidden: true }));
    return box;
  }
  function buildField(f, data, ctx, prefix) {
    const path = prefix ? prefix + "." + f.name : f.name;
    const get = () => data[f.name];
    const set = (v) => { data[f.name] = v; ctx.changed(path); };
    switch (f.widget) {
      case "hidden": return null;
      case "group": {
        const g = h("div", { class: "group" }, h("div", { class: "label" }, f.label));
        f.fields.forEach((sub) => { const el = buildField(sub, data, ctx, prefix); if (el) g.appendChild(el); });
        return g;
      }
      case "object": {
        if (!data[f.name] || typeof data[f.name] !== "object") data[f.name] = {};
        const obj = data[f.name];
        const sub = h("small", {}, summaryOf(f.summary, obj));
        const dot = h("span", { class: "err-dot", hidden: true });
        const body = h("div", { class: "sect__body" }, f.hint ? h("p", { class: "sect__hint" }, f.hint) : null);
        f.fields.forEach((x) => { const el = buildField(x, obj, ctx, path); if (el) body.appendChild(el); });
        if (/seo/i.test(f.name)) body.appendChild(serp(obj, "seo_title", "seo_description", ctx));
        const d = h("details", { class: "card sect", "data-path": path, open: f.collapsed ? null : true },
          h("summary", {}, h("div", { class: "t" }, h("b", {}, f.label), sub), dot, h("span", { class: "chev" }, icon("chev"))), body);
        ctx.onChange(() => { sub.textContent = summaryOf(f.summary, obj); });
        ctx.sections.push({ path, dot, el: d });
        return d;
      }
      case "list": return listField(f, data, ctx, path);
      case "boolean": return fieldBox(f, ctx, path, (id) => {
        const state = h("span", {}, get() ? "Yes" : "No");
        return h("label", { class: "switch" }, h("input", { id, type: "checkbox", checked: !!get(), onchange: (e) => { set(e.target.checked); state.textContent = e.target.checked ? "Yes" : "No"; } }), state);
      }, { group: true });
      case "select": {
        const opts = (f.options || []).map((o) => (typeof o === "object" ? o : { label: o, value: o }));
        if (f.multiple) {
          if (!Array.isArray(get())) data[f.name] = [];
          return fieldBox(f, ctx, path, () => {
            const chips = h("div", { class: "chips" });
            opts.forEach((o) => chips.appendChild(h("button", { type: "button", class: get().includes(o.value) ? "is-on" : "", onclick: (e) => {
              const v = get().slice(); const i = v.indexOf(o.value); if (i > -1) v.splice(i, 1); else v.push(o.value);
              e.currentTarget.classList.toggle("is-on"); set(v); } }, o.label)));
            return chips;
          }, { group: true });
        }
        if (get() === undefined && f.default !== undefined) data[f.name] = f.default;
        return fieldBox(f, ctx, path, (id) => h("select", { id, onchange: (e) => set(e.target.value) },
          !opts.some((o) => o.value === get()) ? h("option", { value: "", selected: true }, "Choose…") : null,
          opts.map((o) => h("option", { value: o.value, selected: o.value === get() }, o.label))));
      }
      case "relation": {
        const items = folderEntities(f.collection).filter((e) => e.state !== "deleted").sort((a, b) => a.label.localeCompare(b.label));
        return fieldBox(f, ctx, path, (id) => h("select", { id, onchange: (e) => set(e.target.value) },
          items.map((e) => h("option", { value: e.id, selected: e.id === get() }, e.label))));
      }
      case "number": return fieldBox(f, ctx, path, (id) => h("input", { id, type: "number", value: get() == null ? "" : get(), min: f.min, oninput: (e) => set(e.target.value === "" ? null : Number(e.target.value)) }));
      case "datetime": return fieldBox(f, ctx, path, (id) => h("input", { id, type: "date", value: String(get() || "").slice(0, 10), onchange: (e) => set(e.target.value) }));
      case "image": case "file": return mediaField(f, data, ctx, path);
      case "markdown": return fieldBox(f, ctx, path, () => markdownEditor(get() || "", set), { group: true });
      case "text": return fieldBox(f, ctx, path, (id, label) => textControl(f, get, set, id, label, true));
      default: return fieldBox(f, ctx, path, (id, label) => textControl(f, get, set, id, label, false));
    }
  }
  function textControl(f, get, set, id, label, multi) {
    const max = patternMax(f);
    const count = max ? h("span", { class: "count" }) : null;
    if (count) label.appendChild(count);
    const upd = (v) => { if (count) { count.textContent = `${v.length} / ${max}`; count.classList.toggle("is-over", v.length > max); } };
    const el = multi
      ? h("textarea", { id, rows: Math.min(8, Math.max(3, Math.ceil(String(get() || "").length / 70))), oninput: (e) => { set(e.target.value); upd(e.target.value); } })
      : h("input", { id, type: "text", value: get() == null ? "" : get(), oninput: (e) => { set(e.target.value); upd(e.target.value); } });
    if (multi) el.value = get() == null ? "" : get();
    upd(String(get() || ""));
    return el;
  }
  function serp(obj, titleKey, descKey, ctx) {
    const t = h("b"), d = h("p");
    const upd = () => { t.textContent = plainText(obj[titleKey]) || "Page title"; d.textContent = plainText(obj[descKey]) || "Description shown in Google…"; };
    upd(); ctx.onChange(upd);
    return h("div", {}, h("div", { class: "serp__label" }, "How it looks in Google"), h("div", { class: "serp" }, h("small", {}, "oxemarketingth.com"), t, d));
  }
  function listField(f, data, ctx, path) {
    if (!Array.isArray(data[f.name])) data[f.name] = [];
    const arr = data[f.name];
    const wrap = h("div", { class: "list" });
    const meta = h("span", { class: "list__meta" });
    const addBtn = h("button", { type: "button", class: "btn btn--soft btn--sm list__add", onclick: () => {
      arr.push(f.fields ? defaults(f.fields) : "");
      ctx.changed(path); draw(arr.length - 1);
    } }, icon("plus"), "Add " + (f.label_singular || (f.field && f.field.label) || "item").toLowerCase());
    function draw(openIndex) {
      wrap.innerHTML = "";
      arr.forEach((item, i) => {
        const tools = h("div", { class: "item__tools" },
          h("button", { type: "button", title: "Move up", "aria-label": "Move up", disabled: i === 0 || f.allow_reorder === false, onclick: () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; ctx.changed(path); draw(i - 1); } }, icon("up")),
          h("button", { type: "button", title: "Move down", "aria-label": "Move down", disabled: i === arr.length - 1 || f.allow_reorder === false, onclick: () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; ctx.changed(path); draw(i + 1); } }, icon("down")),
          h("button", { type: "button", class: "del", title: "Remove", "aria-label": "Remove", disabled: f.allow_remove === false || (f.min !== undefined && arr.length <= f.min), onclick: async () => {
            if (f.fields && !(await confirmBox("Remove this item?", `“${summaryOf(f.summary, item) || "This item"}” will be removed when you publish.`, "Remove", true))) return;
            arr.splice(i, 1); ctx.changed(path); draw();
          } }, icon("trash")));
        if (!f.fields) {
          const sub = Object.assign({ name: i }, f.field || { widget: "string" });
          if (sub.widget === "image" || sub.widget === "file") {
            const holder = { [i]: item };
            const proxy = { changed: () => { arr[i] = holder[i]; ctx.changed(path); }, onChange: ctx.onChange, sections: ctx.sections };
            wrap.appendChild(h("div", { class: "item" }, h("div", { class: "item__head" }, h("span", { class: "num" }, i + 1), h("span", { class: "sum" }, (item || "").split("/").pop() || "Empty"), tools), h("div", { class: "item__body" }, mediaField(Object.assign({}, sub, { label: sub.label || "File" }), holder, proxy, path + "." + i))));
          } else {
            const inp = sub.widget === "text"
              ? h("textarea", { rows: 3, oninput: (e) => { arr[i] = e.target.value; ctx.changed(path); } })
              : h("input", { type: "text", value: item == null ? "" : item, "aria-label": (f.label || "Item") + " " + (i + 1), oninput: (e) => { arr[i] = e.target.value; ctx.changed(path); } });
            if (sub.widget === "text") inp.value = item || "";
            wrap.appendChild(h("div", { class: "item item--scalar", "data-path": path + "." + i }, h("span", { class: "num" }, i + 1), inp, tools));
          }
          return;
        }
        const sum = h("span", { class: "sum" });
        const updSum = () => { const s = summaryOf(f.summary, item); sum.textContent = s || "Untitled"; sum.classList.toggle("is-empty", !s); };
        updSum(); ctx.onChange(updSum);
        const body = h("div", { class: "item__body", hidden: openIndex !== i });
        f.fields.forEach((x) => { const el = buildField(x, item, ctx, path + "." + i); if (el) body.appendChild(el); });
        sum.onclick = () => { body.hidden = !body.hidden; };
        wrap.appendChild(h("div", { class: "item", "data-path": path + "." + i }, h("div", { class: "item__head" }, h("span", { class: "num" }, i + 1), sum, tools), body));
      });
      const canAdd = f.allow_add !== false && (f.max === undefined || arr.length < f.max);
      addBtn.hidden = !canAdd;
      meta.textContent = f.min !== undefined && f.max !== undefined && f.min === f.max ? `${f.max} items (fixed by the design)` : f.max !== undefined ? `Up to ${f.max}` : "";
      wrap.appendChild(h("div", { style: { display: "flex", gap: "10px", alignItems: "center" } }, addBtn, meta));
    }
    draw();
    return fieldBox(f, ctx, path, () => wrap, { group: true });
  }
  function defaults(fields) {
    const o = {};
    fields.forEach((f) => {
      if (f.widget === "group") Object.assign(o, defaults(f.fields));
      else if (f.default !== undefined) o[f.name] = f.default;
      else if (f.widget === "select") o[f.name] = f.multiple ? [] : ((f.options || [])[0] && (typeof f.options[0] === "object" ? f.options[0].value : f.options[0])) || "";
      else if (f.widget === "list") o[f.name] = [];
      else if (f.widget === "object") o[f.name] = defaults(f.fields);
      else if (f.widget === "boolean") o[f.name] = false;
      else if (f.widget !== "hidden") o[f.name] = "";
    });
    return o;
  }
  function mediaField(f, data, ctx, path) {
    const kind = f.widget === "file" ? "video" : "image";
    const folder = String(f.media_folder || S.schema.media_folder || "assets/img/work").replace(/^\//, "");
    const thumb = h("div", { class: "media-field__thumb" });
    const code = h("code");
    const bar = h("div", { class: "progress", hidden: true }, h("i"));
    const box = h("div", { class: "media-field" });
    const set = (v) => { data[f.name] = v; ctx.changed(path); draw(); };
    function draw() {
      const v = data[f.name];
      thumb.innerHTML = ""; thumb.style.backgroundImage = "";
      if (v && (kind === "video" || isVid(v))) thumb.appendChild(h("video", { src: assetURL(v), muted: true, preload: "metadata" }));
      else if (v) thumb.style.backgroundImage = `url("${assetURL(v)}")`;
      else thumb.appendChild(icon(kind === "video" ? "video" : "media"));
      code.textContent = v ? (/^https?:/.test(v) ? "Cloud: " + v.split("/").pop() : v.split("/").pop()) : "Nothing chosen";
      remove.hidden = !v;
    }
    const input = h("input", { type: "file", accept: kind === "video" ? "video/mp4" : "image/*", hidden: true, onchange: () => { const file = input.files[0]; input.value = ""; if (file) doUpload(file); } });
    async function doUpload(file) {
      bar.hidden = false;
      try { set(await uploadFile(file, folder, { onProgress: (p) => { bar.firstChild.style.width = p + "%"; } })); toast("Uploaded. It goes live when you publish.", "ok"); }
      catch (e) { toast(e.message, "bad"); }
      bar.hidden = true;
    }
    const remove = h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: () => set("") }, "Remove");
    add(box, [thumb, h("div", { class: "media-field__info" }, code, bar, h("div", { class: "media-field__btns" },
      h("button", { type: "button", class: "btn btn--soft btn--sm", onclick: () => pickMedia(folder, kind, set) }, "Choose"),
      h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: () => input.click() }, icon("upload"), "Upload"),
      kind === "video" ? h("button", { type: "button", class: "btn btn--ghost btn--sm", title: "Use a video link", onclick: () => {
        const v = prompt("Paste the video link (https://…mp4)", /^https?:/.test(data[f.name] || "") ? data[f.name] : "");
        if (v !== null) { if (v && !/^https:\/\/\S+$/.test(v.trim())) toast("Please paste a full https:// link.", "bad"); else set(v.trim()); }
      } }, icon("link")) : null,
      remove)), input]);
    box.addEventListener("dragover", (e) => { e.preventDefault(); box.classList.add("is-drop"); });
    box.addEventListener("dragleave", () => box.classList.remove("is-drop"));
    box.addEventListener("drop", (e) => { e.preventDefault(); box.classList.remove("is-drop"); const file = e.dataTransfer.files[0]; if (file) doUpload(file); });
    draw();
    return fieldBox(f, ctx, path, () => box, { group: true });
  }
  function markdownEditor(value, set) {
    const ta = h("textarea", { "aria-label": "Article text", spellcheck: "true" });
    ta.value = value;
    const foot = h("div", { class: "md__foot" });
    const stats = () => { const w = ta.value.trim().split(/\s+/).filter(Boolean).length; foot.textContent = `${w} words · about ${Math.max(1, Math.round(w / 220))} min read · Headings 2 build the contents list`; };
    const wrapSel = (before, after, ph) => {
      const s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e) || ph;
      ta.setRangeText(before + sel + after, s, e, "end"); ta.focus(); ta.dispatchEvent(new Event("input"));
    };
    const linePrefix = (prefix) => {
      const s = ta.value.lastIndexOf("\n", ta.selectionStart - 1) + 1;
      const e = ta.value.indexOf("\n", ta.selectionEnd); const end = e === -1 ? ta.value.length : e;
      const lines = ta.value.slice(s, end).split("\n").map((l, i) => (typeof prefix === "function" ? prefix(i) : prefix) + l.replace(/^(#{1,3} |> |- |\d+\. )/, ""));
      ta.setRangeText(lines.join("\n"), s, end, "end"); ta.focus(); ta.dispatchEvent(new Event("input"));
    };
    const B = (label, title, fn) => h("button", { type: "button", title, "aria-label": title, onclick: fn }, label);
    const bar = h("div", { class: "md__bar" },
      B("H2", "Section heading", () => linePrefix("## ")), B("H3", "Sub-heading", () => linePrefix("### ")), h("span", { class: "sep" }),
      B(h("b", {}, "B"), "Bold", () => wrapSel("**", "**", "bold text")), B(h("i", {}, "I"), "Italic", () => wrapSel("*", "*", "italic text")),
      B("Link", "Link", () => { const u = prompt("Link address (e.g. services.html#web or https://…)"); if (u) wrapSel("[", `](${u})`, "link text"); }), h("span", { class: "sep" }),
      B("• List", "Bulleted list", () => linePrefix("- ")), B("1. List", "Numbered list", () => linePrefix((i) => `${i + 1}. `)),
      B("❝ Quote", "Pull quote", () => linePrefix("> ")), B("✦ Tip", "Tip box", () => linePrefix("> **Tip.** ")));
    ta.addEventListener("input", () => { set(ta.value); stats(); });
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); wrapSel("**", "**", "bold text"); }
      if ((e.ctrlKey || e.metaKey) && e.key === "i") { e.preventDefault(); wrapSel("*", "*", "italic text"); }
    });
    stats();
    return h("div", { class: "md" }, bar, ta, foot);
  }

  // ------------------------------------------------------------------ editor screen
  let activePreview = null;
  function editor(entity) {
    const text = current(entity.path);
    if (text === null) return notFound(entity);
    const data = parseDoc(entity.path, text);
    const listeners = [];
    const ctx = {
      sections: [],
      onChange: (fn) => listeners.push(fn),
      changed: () => {
        listeners.forEach((fn) => fn());
        clearTimeout(ctx.t);
        ctx.t = setTimeout(() => { setText(entity.path, dumpDoc(entity.path, data)); showErrors(); statusBadge(); pv && pv.refresh(); }, 250);
      },
    };
    const form = buildForm(entity.fields, data, ctx);
    if (entity.kind === "blog") {
      const descBox = form.querySelector('[data-path="description"]');
      if (descBox) descBox.after(serp(data, "title", "description", ctx));
    }
    function showErrors() {
      const errs = validate(entity.fields, data, "", {});
      form.querySelectorAll(".field").forEach((b) => { b.classList.remove("has-error"); const e = b.querySelector(":scope > .err"); if (e) e.hidden = true; });
      ctx.sections.forEach((s) => { s.dot.hidden = true; });
      Object.entries(errs).forEach(([p, msg]) => {
        const box = form.querySelector(`.field[data-path="${CSS.escape(p)}"]`) || form.querySelector(`[data-path="${CSS.escape(p.split(".").slice(0, -1).join("."))}"]`);
        if (box && box.classList.contains("field")) { box.classList.add("has-error"); const e = box.querySelector(":scope > .err"); if (e) { e.textContent = msg; e.hidden = false; } }
        ctx.sections.forEach((s) => { if (p === s.path || p.startsWith(s.path + ".")) s.dot.hidden = false; });
      });
      return errs;
    }
    const badge = h("span", { class: "badge" });
    function statusBadge() {
      const d = S.drafts.items[entity.path];
      badge.className = "badge " + (d ? (S.files[entity.path] === undefined ? "badge--new" : "badge--edit") : "badge--live");
      badge.textContent = d ? (S.files[entity.path] === undefined ? "New, not published" : "Edited, not published") : "Published";
      discardBtn.hidden = !d;
    }
    const discardBtn = h("button", { class: "btn btn--ghost btn--sm", onclick: async () => {
      if (await confirmBox("Discard your changes?", `Your unpublished changes to “${entity.label}” will be lost.`, "Discard changes", true)) {
        discard(entity.path); if (S.files[entity.path] === undefined) location.hash = entity.kind === "blog" ? "#/blog" : "#/projects"; else render();
      }
    } }, icon("undo"), "Discard");
    const actions = [discardBtn,
      h("button", { class: "btn btn--ghost btn--sm", onclick: () => historyDrawer(entity, pv) }, icon("clock"), "History")];
    if (entity.kind !== "page") {
      actions.push(h("button", { class: "btn btn--ghost btn--sm", onclick: () => duplicate(entity) }, icon("copy"), "Duplicate"));
      actions.push(h("button", { class: "btn btn--danger btn--sm", onclick: () => removeEntity(entity) }, icon("trash"), "Delete"));
    }
    const pvToggle = h("button", { class: "btn btn--ghost btn--sm", onclick: () => { const on = localStorage.getItem("oxe-admin:preview") === "off"; localStorage.setItem("oxe-admin:preview", on ? "on" : "off"); render(); } }, icon("eye"), localStorage.getItem("oxe-admin:preview") === "off" ? "Show preview" : "Hide preview");
    actions.push(pvToggle);
    const showPv = localStorage.getItem("oxe-admin:preview") !== "off";
    const pv = showPv ? previewPane(entity) : null;
    activePreview = pv;
    statusBadge();
    setTimeout(showErrors, 0);
    const view = h("div", {},
      h("div", { class: "editor__head" }, h("h1", {}, plainText(entity.label)), badge, h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } }, actions)),
      h("div", { class: "editor" + (pv ? " with-preview" : "") }, form, pv ? pv.el : null));
    return view;
  }
  function notFound(entity) {
    return h("div", { class: "card empty" }, h("b", {}, "This item doesn't exist (anymore)"),
      S.drafts.items[entity.path] && S.drafts.items[entity.path].delete
        ? h("div", {}, "It's marked for deletion. ", h("button", { class: "btn btn--soft btn--sm", onclick: () => { discard(entity.path); render(); } }, "Undo delete"))
        : h("a", { href: "#/" }, "Back to the dashboard"));
  }

  // ------------------------------------------------------------------ history
  async function historyDrawer(entity, pv) {
    const list = h("ul", { class: "timeline" }, h("li", {}, "Loading…"));
    const close = () => d.remove();
    const d = h("div", { class: "drawer", role: "dialog", "aria-label": "History" },
      h("div", { class: "modal__head" }, h("h2", {}, "History"), h("button", { class: "close", "aria-label": "Close", onclick: close }, icon("x"))),
      h("div", { class: "modal__body" }, h("p", { class: "hint", style: { margin: 0 } }, "Every published version of “" + plainText(entity.label) + "”. Preview any version, then restore it if you need to. Restoring creates a draft you can review before publishing."), list));
    document.body.appendChild(d);
    try {
      const { commits } = await api("GET", "/api/repo/history?path=" + encodeURIComponent(entity.path) + "&limit=30");
      list.innerHTML = "";
      if (!commits.length) list.appendChild(h("li", {}, "No earlier versions yet."));
      commits.forEach((c, i) => {
        const restore = async () => {
          const f = await api("GET", `/api/repo/file?path=${encodeURIComponent(entity.path)}&ref=${c.sha}`);
          const text = new TextDecoder().decode(Uint8Array.from(atob(f.content), (ch) => ch.charCodeAt(0)));
          return text;
        };
        list.appendChild(h("li", {}, h("span", { class: "when" }, ago(c.date)), h("div", { style: { flex: 1 } }, h("b", {}, c.message.replace(/^Admin: /, "")), h("small", {}, c.author.replace(" (OXE admin)", "") + (i === 0 ? " · current live version" : ""))),
          i > 0 ? h("div", { style: { display: "flex", flexDirection: "column", gap: "4px" } },
            pv ? h("button", { class: "btn btn--ghost btn--sm", onclick: async () => { const t = await restore(); close(); pv.showVersion(t, ago(c.date), async () => { setText(entity.path, t); pv.clearVersion(); toast("Restored as a draft. Review it, then publish.", "ok"); render(); }); } }, "Preview") : null,
            h("button", { class: "btn btn--soft btn--sm", onclick: async () => {
              if (!(await confirmBox("Restore this version?", "The content will go back to this version as a draft. Nothing changes on the live site until you publish.", "Restore"))) return;
              setText(entity.path, await restore()); close(); toast("Restored as a draft. Review it, then publish.", "ok"); render();
            } }, "Restore")) : null));
      });
    } catch (e) { list.innerHTML = ""; list.appendChild(h("li", {}, e.message)); }
  }

  // ------------------------------------------------------------------ create / duplicate / delete
  function newEntity(kind) {
    const isBlog = kind === "blog";
    const title = h("input", { type: "text", placeholder: isBlog ? "e.g. How to plan a product photo shoot" : "e.g. Haji Café" });
    const sub = isBlog ? null : h("input", { type: "text", placeholder: "e.g. Social media & photography" });
    const slug = h("input", { type: "text" });
    let touched = false;
    title.addEventListener("input", () => { if (!touched) slug.value = slugify(title.value); });
    slug.addEventListener("input", () => { touched = true; });
    const err = h("p", { class: "err", hidden: true });
    const go = () => {
      const s = slugify(slug.value);
      const path = isBlog ? `content/blog/${s}.md` : `content/projects/${s}.yml`;
      if (!title.value.trim() || !s) { err.textContent = "Please fill in the name."; err.hidden = false; return; }
      if (current(path) !== null || S.files[path] !== undefined) { err.textContent = "That address is already used. Choose another."; err.hidden = false; return; }
      const c = coll(isBlog ? "blog" : "projects");
      const data = defaults(c.fields);
      if (isBlog) Object.assign(data, { title: title.value.trim(), date: new Date().toISOString().slice(0, 10), draft: true, body: "Start with a short introduction.\n\n## First section\n\nWrite your first section here." });
      else {
        const orders = folderEntities("projects").map((e) => Number(e.data.order) || 0);
        Object.assign(data, { id: s, client: title.value.trim(), title: sub.value.trim(), order: (orders.length ? Math.max(...orders) : 0) + 10, display: "photo" });
      }
      setText(path, dumpDoc(path, data));
      m.close();
      location.hash = (isBlog ? "#/blog/" : "#/project/") + s;
      toast(isBlog ? "Article created as a hidden draft." : "Project created.", "ok");
    };
    const m = modal({
      title: isBlog ? "New article" : "New project",
      body: [h("div", { class: "field" }, h("label", {}, isBlog ? "Title" : "Client"), title),
        sub ? h("div", { class: "field" }, h("label", {}, "Project title"), sub) : null,
        h("div", { class: "field" }, h("label", {}, "Page address"), slug, h("p", { class: "hint" }, `oxemarketingth.com/${isBlog ? "blog" : "work"}/…  Lowercase letters, numbers and dashes.`)), err],
      foot: [h("button", { class: "btn btn--ghost", onclick: () => m.close() }, "Cancel"), h("button", { class: "btn", onclick: go }, "Create")],
    });
    m.el.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.tagName === "INPUT") go(); });
  }
  function duplicate(entity) {
    const isBlog = entity.kind === "blog";
    let s = entity.id + "-copy", n = 1;
    const p = (x) => isBlog ? `content/blog/${x}.md` : `content/projects/${x}.yml`;
    while (current(p(s)) !== null || S.files[p(s)] !== undefined) s = `${entity.id}-copy-${++n}`;
    const data = parseDoc(entity.path, current(entity.path));
    if (isBlog) { data.title = (data.title || "") + " (copy)"; data.draft = true; } else { data.id = s; data.order = (Number(data.order) || 0) + 1; }
    setText(p(s), dumpDoc(p(s), data));
    location.hash = (isBlog ? "#/blog/" : "#/project/") + s;
    toast("Copy created. Edit it, then publish.", "ok");
  }
  async function removeEntity(entity) {
    const isNew = S.files[entity.path] === undefined;
    const ok = await confirmBox(`Delete “${plainText(entity.label)}”?`, isNew ? "This new item hasn't been published, so it will simply be removed." : "It will be removed from the website when you publish. Until then you can undo this.", "Delete", true);
    if (!ok) return;
    if (isNew) discard(entity.path);
    else { S.drafts.items[entity.path] = { delete: true }; if (!S.drafts.base) S.drafts.base = S.head; saveDrafts(); preview.sync({ [entity.path]: null }); }
    location.hash = entity.kind === "blog" ? "#/blog" : "#/projects";
    toast(isNew ? "Removed." : "Marked for deletion. Publish to remove it from the site.", "ok");
  }

  // ------------------------------------------------------------------ review & publish
  function changeList() {
    return Object.entries(S.drafts.items).map(([path, d]) => {
      const info = describe(path);
      const type = d.delete ? "Delete" : d.media ? "Upload" : S.files[path] === undefined ? "New" : "Edit";
      const fields = !d.delete && !d.media ? fieldsFor(path) : null;
      const errors = fields ? validate(fields, parseDoc(path, d.text), "", {}) : {};
      return { path, d, info, type, errors };
    }).sort((a, b) => a.info.kind.localeCompare(b.info.kind) || a.info.label.localeCompare(b.info.label));
  }
  function reviewModal() {
    const items = changeList();
    if (!items.length) return toast("Everything is already published.", "ok");
    const withErr = items.filter((x) => Object.keys(x.errors).length);
    const list = h("ul", { class: "changes" });
    items.forEach((x) => {
      const cls = { Delete: "badge--del", Upload: "badge--new", New: "badge--new", Edit: "badge--edit" }[x.type];
      list.appendChild(h("li", {}, h("span", { class: "badge " + cls }, x.type),
        h("div", { class: "t" }, h("b", {}, plainText(x.info.label)), h("small", {}, x.info.kind + (Object.keys(x.errors).length ? ` · ${Object.keys(x.errors).length} problem(s) to fix` : ""))),
        x.d.media ? null : h("a", { class: "btn btn--ghost btn--sm", href: x.info.href, onclick: () => m.close() }, "Open"),
        h("button", { class: "btn btn--ghost btn--sm", title: "Discard this change", onclick: async () => {
          if (await confirmBox("Discard this change?", `“${plainText(x.info.label)}” will go back to its published version.`, "Discard", true)) { discard(x.path); m.close(); reviewModal(); render(); }
        } }, icon("undo"))));
    });
    const msg = h("input", { type: "text", placeholder: "e.g. Updated the home hero and added a new article", maxlength: 200 });
    const publishBtn = h("button", { class: "btn", disabled: withErr.length > 0, onclick: () => publish(msg.value, m, publishBtn) }, icon("check"), `Publish ${items.length} change${items.length > 1 ? "s" : ""}`);
    const m = modal({
      title: "Review & publish", wide: false,
      body: [
        withErr.length ? h("div", { class: "callout callout--bad" }, h("b", {}, "Please fix these before publishing:"), h("ul", {}, withErr.map((x) => h("li", {}, h("a", { href: x.info.href, onclick: () => m.close() }, plainText(x.info.label)), ": " + Object.values(x.errors).slice(0, 2).join(", "))))) : h("div", { class: "callout callout--info" }, "These changes go live together in one update. The site rebuilds in about 1–2 minutes. You can always restore an earlier version from History."),
        list,
        h("div", { class: "field" }, h("label", {}, "What did you change? ", h("span", { class: "opt" }, "optional, shown in History")), msg),
      ],
      foot: [h("button", { class: "btn btn--danger", onclick: async () => {
        if (!(await confirmBox("Discard all changes?", "Every unpublished change will be lost. This can't be undone.", "Discard all", true))) return;
        S.drafts = { base: null, items: {} }; await idb.clear(); saveDrafts(); preview.start(); m.close(); location.reload();
      } }, "Discard all"), h("span", { style: { flex: 1 } }), h("button", { class: "btn btn--ghost", onclick: () => m.close() }, "Keep editing"), publishBtn],
    });
  }
  async function publish(message, m, btn, force) {
    btn.disabled = true; btn.textContent = "Publishing…";
    const changes = Object.entries(S.drafts.items).map(([path, d]) => d.delete ? { path, delete: true } : d.media ? { path, sha: d.media.sha } : { path, text: d.text });
    try {
      const r = await api("POST", "/api/repo/commit", { message, base: force ? null : S.drafts.base || S.head, changes });
      m.close();
      for (const [path, d] of Object.entries(S.drafts.items)) {
        if (d.delete) { delete S.files[path]; S.media = S.media.filter((f) => f.path !== path); }
        else if (d.media) S.media.push({ path, size: d.media.size });
        else S.files[path] = d.text;
        delete S.norm[path];
      }
      S.head = r.sha;
      S.drafts = { base: null, items: {} };
      saveDrafts();
      S.lastPublish = { sha: r.sha, at: Date.now(), state: "pending" };
      localStorage.setItem(lkey(), JSON.stringify(S.lastPublish));
      toast(S.demo ? "Demo: published in this browser only. The real website is not changed." : "Published! The site is updating.", "ok");
      trackDeploy();
      render();
    } catch (e) {
      btn.disabled = false; btn.textContent = "Publish";
      if (e.status === 409) return conflictModal(e.data.paths || [], message, m, btn);
      toast("Publishing failed: " + e.message, "bad");
    }
  }
  function conflictModal(paths, message, prev, btn) {
    const mm = modal({
      title: "Someone else published at the same time",
      body: [h("p", { style: { margin: 0 } }, "These items were changed and published by someone else while you were editing:"),
        h("ul", {}, paths.map((p) => h("li", {}, plainText(describe(p).label)))),
        h("div", { class: "callout callout--warn" }, "Choose what to do. “Use theirs” keeps their version of these items and drops your edits to them. “Use mine” replaces their changes with yours.")],
      foot: [h("button", { class: "btn btn--ghost", onclick: () => mm.close() }, "Cancel"),
        h("button", { class: "btn btn--soft", onclick: async () => { paths.forEach((p) => delete S.drafts.items[p]); saveDrafts(); mm.close(); prev.close(); await loadBundle(); toast("Loaded their version. Your other changes are still drafts.", "ok"); render(); } }, "Use theirs"),
        h("button", { class: "btn btn--danger-solid", onclick: () => { mm.close(); publish(message, prev, btn, true); } }, "Use mine")],
    });
  }
  async function trackDeploy() {
    const last = S.lastPublish;
    if (!last || last.state === "success" || last.state === "failure") return refreshChrome();
    for (let i = 0; i < 90 && S.lastPublish === last; i++) {
      try {
        const d = await api("GET", "/api/repo/deploy?sha=" + last.sha);
        last.state = d.state; last.url = d.url;
        localStorage.setItem(lkey(), JSON.stringify(last));
        refreshChrome();
        if (d.state === "success") { if (!S.demo) toast("Your changes are live.", "ok", { href: "/", text: "View site" }); return; }
        if (d.state === "failure" || d.state === "error") { toast("The site update failed. The previous version stays online. Open Activity for details.", "bad"); return; }
      } catch (e) { /* keep trying */ }
      await new Promise((r) => setTimeout(r, 6000));
    }
  }

  // ------------------------------------------------------------------ screens
  function dashboard() {
    const posts = folderEntities("blog"), projects = folderEntities("projects"), media = mediaItems();
    const live = posts.filter((p) => !p.data.draft && p.state !== "deleted").length;
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const recent = h("ul", { class: "timeline" }, h("li", {}, "Loading recent activity…"));
    api("GET", "/api/repo/history?limit=8").then(({ commits }) => {
      recent.innerHTML = "";
      commits.forEach((c) => recent.appendChild(h("li", {}, h("span", { class: "when" }, ago(c.date)), h("div", {}, h("b", {}, c.message.replace(/^Admin: /, "")), h("small", {}, c.author.replace(" (OXE admin)", ""))))));
    }).catch(() => { recent.innerHTML = "<li>History isn't available right now.</li>"; });
    const q = (href, ic, title, text) => h("a", { href }, h("span", { class: "ico" }, icon(ic)), h("span", {}, h("b", {}, title), h("small", {}, text)));
    const n = draftCount();
    return h("div", {},
      h("section", { class: "hello" }, h("span", { class: "eyebrow" }, "OXE website editor"),
        h("h1", { html: `${greet}, <span class="hl">${esc(S.user)}</span>` }),
        h("p", {}, n ? `You have ${n} unpublished change${n > 1 ? "s" : ""}. Review them and publish when you're ready.` : "Everything is published. Pick something to edit below, every change is previewed live before it goes online."),
        h("div", { class: "hello__actions" }, n ? h("button", { class: "btn", onclick: reviewModal }, "Review & publish") : null,
          h("a", { class: "btn btn--ghost", href: "/", target: "_blank", rel: "noopener" }, icon("ext"), "View the website"))),
      h("div", { class: "stats" },
        h("div", { class: "card stat" }, h("small", {}, "Articles"), h("b", {}, posts.length), h("span", {}, `${live} live · ${posts.length - live} hidden`)),
        h("div", { class: "card stat" }, h("small", {}, "Projects"), h("b", {}, projects.filter((p) => p.state !== "deleted").length), h("span", {}, "in the portfolio")),
        h("div", { class: "card stat" }, h("small", {}, "Media files"), h("b", {}, media.filter((m) => !m.deleted).length), h("span", {}, "photos, logos and videos")),
        h("div", { class: "card stat" }, h("small", {}, "Unpublished"), h("b", {}, n), h("span", {}, n ? "changes waiting" : "all live"))),
      h("div", { class: "dash-grid" },
        h("div", { class: "card panel" }, h("h2", {}, "Quick actions"), h("div", { class: "quick" },
          q("#/page/home", "home", "Edit the home page", "Hero, sections, photos"),
          h("a", { href: "#/blog", onclick: (e) => { e.preventDefault(); newEntity("blog"); } }, h("span", { class: "ico" }, icon("blog")), h("span", {}, h("b", {}, "Write an article"), h("small", {}, "New blog post"))),
          h("a", { href: "#/projects", onclick: (e) => { e.preventDefault(); newEntity("project"); } }, h("span", { class: "ico" }, icon("work")), h("span", {}, h("b", {}, "Add a project"), h("small", {}, "New case study"))),
          q("#/media", "media", "Media library", "Upload & manage files"),
          q("#/page/settings", "cog", "Contact & settings", "Email, phone, logos"),
          q("#/page/site", "menu", "Menu & footer", "Navigation and shared sections"))),
        h("div", { class: "card panel" }, h("h2", {}, "Recent activity", h("a", { href: "#/activity", class: "btn btn--ghost btn--sm" }, "All")), recent)));
  }
  function pagesScreen() {
    const cards = h("div", { class: "page-cards" });
    pageFiles().forEach((f) => {
      const [ic, text] = PAGE_META[f.name] || ["page", ""];
      const edited = !!S.drafts.items[f.file];
      cards.appendChild(h("div", { class: "card page-card", tabindex: "0", role: "link", onclick: () => { location.hash = "#/page/" + f.name; }, onkeydown: (e) => { if (e.key === "Enter") location.hash = "#/page/" + f.name; } },
        h("span", { class: "ico" }, icon(ic)), h("h3", {}, f.label, edited ? h("span", { class: "badge badge--edit", style: { marginLeft: "8px" } }, "Edited") : null), h("p", {}, text)));
    });
    return h("div", {}, h("div", { class: "page-head" }, h("div", {}, h("span", { class: "eyebrow" }, "Pages"), h("h1", { html: 'Every page, <span class="hl">editable</span>' }), h("p", {}, "Headings, text, buttons, photos and Google text for each page. Changes show in the live preview as you type."))), cards);
  }
  function blogScreen() {
    let q = "", tab = "all";
    const grid = h("div", { class: "tiles" });
    const draw = () => {
      grid.innerHTML = "";
      let items = folderEntities("blog").sort((a, b) => String(b.data.date || "").localeCompare(String(a.data.date || "")));
      if (tab === "live") items = items.filter((p) => !p.data.draft);
      if (tab === "hidden") items = items.filter((p) => p.data.draft);
      if (q) items = items.filter((p) => (plainText(p.label) + " " + (p.data.excerpt || "")).toLowerCase().includes(q));
      if (!items.length) grid.appendChild(h("div", { class: "card empty", style: { gridColumn: "1 / -1" } }, h("b", {}, "No articles found"), "Try another search, or write a new article."));
      items.forEach((p) => {
        const img = h("div", { class: "tile__img", style: { backgroundImage: p.data.cover ? `url("${assetURL(p.data.cover)}")` : "" } },
          h("span", { class: "badge " + (p.data.draft ? "badge--hidden" : "badge--live") }, p.data.draft ? "Hidden" : "Live"),
          p.state ? h("span", { class: "badge " + { edited: "badge--edit", new: "badge--new", deleted: "badge--del" }[p.state] }, { edited: "Edited", new: "New", deleted: "Deleting" }[p.state]) : null);
        grid.appendChild(h("div", { class: "card tile", tabindex: "0", role: "link", onclick: () => { location.hash = p.href; }, onkeydown: (e) => { if (e.key === "Enter") location.hash = p.href; } }, img,
          h("div", { class: "tile__body" }, h("h3", {}, plainText(p.label)), h("small", {}, [p.data.date, (topics[p.data.category] || p.data.category)].filter(Boolean).join(" · ")))));
      });
    };
    const topics = Object.fromEntries((coll("blog").fields.find((f) => f.name === "category").options || []).map((o) => [o.value, o.label]));
    const tabs = h("div", { class: "tabs" }, [["all", "All"], ["live", "Live"], ["hidden", "Hidden"]].map(([k, l]) => h("button", { class: k === tab ? "is-active" : "", onclick: (e) => { tab = k; [...e.currentTarget.parentNode.children].forEach((b) => b.classList.toggle("is-active", b === e.currentTarget)); draw(); } }, l)));
    draw();
    return h("div", {}, h("div", { class: "page-head" }, h("div", {}, h("span", { class: "eyebrow" }, "Blog"), h("h1", { html: 'Blog <span class="hl">articles</span>' }), h("p", {}, "Write, edit, hide or delete articles. New articles start hidden until you switch them live.")),
      h("button", { class: "btn btn-arrow", onclick: () => newEntity("blog") }, "New article")),
      h("div", { class: "toolbar" }, h("div", { class: "search" }, icon("search"), h("input", { type: "search", placeholder: "Search articles", oninput: (e) => { q = e.target.value.toLowerCase(); draw(); } })), tabs), grid);
  }
  function projectsScreen() {
    let q = "";
    const rows = h("div", { class: "card rows" });
    const draw = () => {
      rows.innerHTML = "";
      let items = folderEntities("projects").sort((a, b) => (Number(a.data.order) || 0) - (Number(b.data.order) || 0) || a.id.localeCompare(b.id));
      const all = items.filter((p) => p.state !== "deleted");
      if (q) items = items.filter((p) => plainText(p.label).toLowerCase().includes(q));
      if (!items.length) rows.appendChild(h("div", { class: "empty" }, h("b", {}, "No projects found")));
      items.forEach((p) => {
        const idx = all.indexOf(p);
        const move = (dir) => (e) => {
          e.stopPropagation();
          const other = all[idx + dir]; if (!other) return;
          // re-number the whole list so the order is clean (10, 20, 30 …)
          const list = all.slice(); [list[idx], list[idx + dir]] = [list[idx + dir], list[idx]];
          list.forEach((x, i) => { const want = (i + 1) * 10; if (Number(x.data.order) !== want) { const d = parseDoc(x.path, current(x.path)); d.order = want; setText(x.path, dumpDoc(x.path, d)); } });
          draw();
        };
        const cover = p.data.cover ? assetURL(p.data.cover) : "";
        rows.appendChild(h("div", { class: "row", tabindex: "0", role: "link", onclick: () => { location.hash = p.href; }, onkeydown: (e) => { if (e.key === "Enter") location.hash = p.href; } },
          h("div", { class: "row__order" }, h("button", { title: "Move up", "aria-label": "Move up", disabled: idx <= 0, onclick: move(-1) }, "▲"), h("button", { title: "Move down", "aria-label": "Move down", disabled: idx < 0 || idx >= all.length - 1, onclick: move(1) }, "▼")),
          h("div", { class: "row__thumb", style: { backgroundImage: cover ? `url("${cover}")` : "" } }),
          h("div", { class: "row__main" }, h("b", {}, plainText(p.label)), h("small", {}, [plainText(p.data.category), (p.data.filters || []).join(", ")].filter(Boolean).join(" · "))),
          p.state ? h("span", { class: "badge " + { edited: "badge--edit", new: "badge--new", deleted: "badge--del" }[p.state] }, { edited: "Edited", new: "New", deleted: "Deleting" }[p.state]) : null));
      });
    };
    draw();
    return h("div", {}, h("div", { class: "page-head" }, h("div", {}, h("span", { class: "eyebrow" }, "Portfolio"), h("h1", { html: 'Portfolio <span class="hl">projects</span>' }), h("p", {}, "Add, edit, reorder or delete projects. The order here is the order on the Portfolio page.")),
      h("button", { class: "btn btn-arrow", onclick: () => newEntity("project") }, "New project")),
      h("div", { class: "toolbar" }, h("div", { class: "search" }, icon("search"), h("input", { type: "search", placeholder: "Search projects", oninput: (e) => { q = e.target.value.toLowerCase(); draw(); } }))), rows);
  }
  function mediaScreen() {
    let tab = FOLDERS[0], q = "";
    const grid = h("div", { class: "media-grid" });
    const tabs = h("div", { class: "tabs" });
    const input = h("input", { type: "file", multiple: true, hidden: true, onchange: () => { uploadMany([...input.files]); input.value = ""; } });
    const drop = h("div", { class: "drop" }, icon("upload"), h("b", {}, "Drop files here to upload"), h("span", {}, "Images are resized and converted to fast WebP automatically. Videos: MP4."), h("button", { class: "btn btn--soft btn--sm", onclick: () => input.click() }, "Choose files"), input);
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("is-drop"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("is-drop"));
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("is-drop"); uploadMany([...e.dataTransfer.files]); });
    async function uploadMany(files) {
      for (const f of files) {
        try { await withProgress(f.name, (cb) => uploadFile(f, /^video\//.test(f.type) ? "assets/video" : tab.key === "assets/video" ? "assets/img/work" : tab.key, { onProgress: cb })); }
        catch (e) { toast(f.name + ": " + e.message, "bad"); }
      }
      draw();
      if (files.length) toast("Uploaded. Use the files in any page, then publish.", "ok");
    }
    const draw = () => {
      grid.innerHTML = "";
      const items = mediaItems().filter((m) => m.folder === tab && (!q || m.name.includes(q))).sort((a, b) => (b.pending - a.pending) || a.name.localeCompare(b.name));
      if (!items.length) grid.appendChild(h("div", { class: "card empty", style: { gridColumn: "1 / -1" } }, h("b", {}, "Nothing here yet"), "Drop files above to upload."));
      items.forEach((m) => grid.appendChild(mediaCard(m, () => mediaDetails(m, draw))));
    };
    FOLDERS.forEach((f) => tabs.appendChild(h("button", { class: f === tab ? "is-active" : "", onclick: (e) => { tab = f; [...tabs.children].forEach((b) => b.classList.toggle("is-active", b === e.currentTarget)); draw(); } }, f.label)));
    draw();
    return h("div", {}, h("div", { class: "page-head" }, h("div", {}, h("span", { class: "eyebrow" }, "Media"), h("h1", { html: 'Media <span class="hl">library</span>' }), h("p", {}, "Every photo, logo and video on the site. Upload, replace or delete files; replacing a file updates it everywhere it's used."))),
      drop, h("div", { class: "toolbar" }, tabs, h("div", { class: "search" }, icon("search"), h("input", { type: "search", placeholder: "Search by name", oninput: (e) => { q = slugify(e.target.value); draw(); } }))), grid);
  }
  function mediaDetails(m, redraw) {
    const used = usages(m);
    const vid = isVid(m.path);
    const input = h("input", { type: "file", accept: vid ? "video/mp4" : "image/*", hidden: true, onchange: async () => {
      const f = input.files[0]; if (!f) return;
      try { await withProgress(f.name, (cb) => uploadFile(f, m.folder.key, { replace: m.path, onProgress: cb })); mm.close(); redraw(); toast("Replaced. Every page using it shows the new file after you publish.", "ok"); }
      catch (e) { toast(e.message, "bad"); }
    } });
    const mm = modal({
      title: m.name,
      body: [vid ? h("video", { src: assetURL(m.path), controls: true, style: { width: "100%", borderRadius: "14px", background: "#000" } })
                 : h("div", { style: { aspectRatio: "16 / 10", borderRadius: "14px", background: `#eef1f8 url("${assetURL(m.path)}") center / contain no-repeat` } }),
        h("div", { class: "callout callout--info" }, h("b", {}, used.length ? `Used in ${used.length} place${used.length > 1 ? "s" : ""}` : "Not used on any page"),
          used.length ? h("ul", {}, used.map((p) => h("li", {}, h("a", { href: describe(p).href, onclick: () => mm.close() }, plainText(describe(p).label))))) : null),
        h("p", { class: "hint", style: { margin: 0 } }, m.files.map((f) => f.path).join(" · ") + (m.size ? " · " + kb(m.size) : "")), input],
      foot: [m.deleted ? h("button", { class: "btn btn--soft", onclick: () => { m.files.forEach((f) => { if (S.drafts.items[f.path] && S.drafts.items[f.path].delete) discard(f.path); }); mm.close(); redraw(); } }, "Undo delete")
        : h("button", { class: "btn btn--danger", onclick: async () => {
          if (used.length && !(await confirmBox("This file is in use", `It's used in ${used.length} place(s). Deleting it will leave those spots empty. Delete anyway?`, "Delete anyway", true))) return;
          if (!used.length && !(await confirmBox("Delete this file?", "It will be removed when you publish.", "Delete", true))) return;
          m.files.forEach((f) => { if (S.drafts.items[f.path] && S.drafts.items[f.path].media) discard(f.path); else { S.drafts.items[f.path] = { delete: true }; if (!S.drafts.base) S.drafts.base = S.head; } });
          saveDrafts(); mm.close(); redraw();
        } }, icon("trash"), "Delete"),
        h("span", { style: { flex: 1 } }),
        h("button", { class: "btn btn--ghost", onclick: () => { navigator.clipboard && navigator.clipboard.writeText("/" + m.path); toast("Path copied.", "ok"); } }, icon("copy"), "Copy path"),
        h("button", { class: "btn", onclick: () => input.click() }, icon("upload"), "Replace")],
    });
  }
  function activityScreen() {
    const list = h("ul", { class: "timeline" }, h("li", {}, "Loading…"));
    api("GET", "/api/repo/history?limit=40").then(({ commits }) => {
      list.innerHTML = "";
      commits.forEach((c) => list.appendChild(h("li", {}, h("span", { class: "when" }, ago(c.date)), h("div", { style: { flex: 1 } }, h("b", {}, c.message.replace(/^Admin: /, "")), h("small", {}, c.author.replace(" (OXE admin)", "") + " · " + new Date(c.date).toLocaleString())))));
    }).catch((e) => { list.innerHTML = ""; list.appendChild(h("li", {}, e.message)); });
    const last = S.lastPublish;
    return h("div", {}, h("div", { class: "page-head" }, h("div", {}, h("span", { class: "eyebrow" }, "Activity"), h("h1", { html: 'Publishing <span class="hl">history</span>' }), h("p", {}, "Every update to the website, newest first. To undo a change, open the page and use History."))),
      last ? h("div", { class: "callout " + (last.state === "success" ? "callout--ok" : last.state === "failure" || last.state === "error" ? "callout--bad" : "callout--info"), style: { marginBottom: "16px" } },
        `Last publish ${ago(last.at)}: ` + ({ success: "live on the website.", failure: "the site update failed; the previous version is still online.", error: "the site update failed; the previous version is still online.", pending: "updating the website…", waiting: "waiting for the website update to start…" }[last.state] || last.state)) : null,
      h("div", { class: "card panel" }, list));
  }

  // ------------------------------------------------------------------ login (Supabase) & demo
  // Demo account: explore the whole admin with a copy of the site content. Publishing is
  // simulated, so the demo can never change the website. Only a hash is kept here.
  const DEMO_HASH = "74e36ce282a033ba2445b7ab4e8d483ccf8f710f6f8134ac176eca3d5f7c408b";
  async function isDemo(user, pass) {
    if (!crypto.subtle) return false;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(user).trim().toLowerCase() + ":" + pass));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("") === DEMO_HASH;
  }
  let demoBundle = null;
  async function demoApi(method, url, data) {
    const path = url.split("?")[0], q = new URLSearchParams(url.split("?")[1] || "");
    const fake = () => [...crypto.getRandomValues(new Uint8Array(20))].map((b) => b.toString(16).padStart(2, "0")).join("");
    if (!demoBundle) {
      const r = await fetch("/admin/demo/bundle.json", { cache: "no-cache" });
      if (!r.ok) throw new Error("The demo isn't available on this site.");
      demoBundle = await r.json();
    }
    if (path === "/api/session") return method === "GET" ? { user: "Demo" } : { ok: true };
    if (path === "/api/repo/bundle") return { head: demoBundle.head, files: Object.assign({}, demoBundle.files), media: demoBundle.media.slice() };
    if (path === "/api/repo/history") return { commits: q.get("path") ? [] : demoBundle.history || [] };
    if (path === "/api/repo/file") { const t = demoBundle.files[q.get("path")]; if (t == null) throw new Error("File not found"); return { content: btoa(unescape(encodeURIComponent(t))) }; }
    if (path === "/api/repo/blob") return { sha: fake(), path: data.path };
    if (path === "/api/repo/commit") { await new Promise((r) => setTimeout(r, 600)); return { sha: fake() }; }
    if (path === "/api/repo/deploy") return { state: "success", description: "Demo" };
    if (path === "/api/upload") return { enabled: false };
    throw new Error("Not available in the demo");
  }
  function enterDemo() {
    S.demo = true; S.user = "Demo";
    try { sessionStorage.setItem("oxe-admin:demo", "1"); } catch (e) { /* private mode */ }
    start();
  }
  function authLayout(title, intro, content) {
    const app = $("#app");
    app.innerHTML = "";
    app.appendChild(h("div", { class: "login" },
      h("section", { class: "login__art" },
        h("div", { class: "login__brand" }, h("img", { src: "/assets/img/oxe-wordmark.png", alt: "OXE Marketing" })),
        h("div", {}, h("h1", { html: 'Your website, <span class="hl">your way</span>' }), h("p", {}, "Edit every page, article, project, photo and video. See each change live before it's published.")),
        h("div", { class: "login__chips" }, ["Live preview", "Drafts until you publish", "Full version history"].map((t) => h("span", {}, t)))),
      h("section", { class: "login__form" }, h("div", { class: "login__card" }, h("h2", {}, title), h("p", {}, intro), content,
        h("div", { class: "login__foot" }, icon("lock"), "Secured by Supabase. Your session ends after 12 hours.")))));
  }
  function loginScreen(message, kind) {
    const email = h("input", { type: "text", id: "u", autocomplete: "username", inputmode: "email", required: true });
    const pass = h("input", { type: "password", id: "p", autocomplete: "current-password", required: true });
    const note = h("div", { class: "callout callout--" + (kind || "bad"), hidden: !message }, message || "");
    const btn = h("button", { class: "btn", type: "submit" }, "Log in");
    const form = h("form", { onsubmit: async (e) => {
      e.preventDefault(); note.hidden = true; btn.disabled = true; btn.textContent = "Checking…";
      if (await isDemo(email.value, pass.value)) return enterDemo();
      try { const r = await api("POST", "/api/session", { email: email.value, password: pass.value }); S.user = r.user; start(); }
      catch (x) { note.className = "callout callout--bad"; note.textContent = x.message; note.hidden = false; btn.disabled = false; btn.textContent = "Log in"; pass.select(); }
    } },
      h("div", { class: "field" }, h("label", { for: "u" }, "Email"), email),
      h("div", { class: "field" }, h("label", { for: "p", style: { justifyContent: "space-between", display: "flex" } }, "Password",
        h("a", { href: "#", style: { fontWeight: 400 }, onclick: (e) => { e.preventDefault(); forgotScreen(email.value); } }, "Forgot password?")), pass),
      note, btn);
    authLayout("Welcome back", "Log in to the OXE website editor.", form);
    email.focus();
  }
  function forgotScreen(prefill) {
    const email = h("input", { type: "email", id: "u", autocomplete: "email", value: prefill && prefill.includes("@") ? prefill : "", required: true });
    const note = h("div", { class: "callout", hidden: true });
    const btn = h("button", { class: "btn", type: "submit" }, "Send reset link");
    const form = h("form", { onsubmit: async (e) => {
      e.preventDefault(); btn.disabled = true; btn.textContent = "Sending…";
      try { const r = await api("POST", "/api/session", { action: "recover", email: email.value }); note.className = "callout callout--ok"; note.textContent = r.message; }
      catch (x) { note.className = "callout callout--bad"; note.textContent = x.message; }
      note.hidden = false; btn.disabled = false; btn.textContent = "Send reset link";
    } }, h("div", { class: "field" }, h("label", { for: "u" }, "Email"), email), note, btn,
      h("p", { style: { marginTop: "16px" } }, h("a", { href: "#", onclick: (e) => { e.preventDefault(); loginScreen(); } }, "← Back to log in")));
    authLayout("Reset your password", "Enter your email and we'll send you a link to choose a new password.", form);
    email.focus();
  }
  function resetScreen(token) {
    const p1 = h("input", { type: "password", id: "p1", autocomplete: "new-password", minlength: 10, required: true });
    const p2 = h("input", { type: "password", id: "p2", autocomplete: "new-password", required: true });
    const note = h("div", { class: "callout callout--bad", hidden: true });
    const btn = h("button", { class: "btn", type: "submit" }, "Save new password");
    const form = h("form", { onsubmit: async (e) => {
      e.preventDefault(); note.hidden = true;
      if (p1.value.length < 10) { note.textContent = "Please use at least 10 characters."; note.hidden = false; return; }
      if (p1.value !== p2.value) { note.textContent = "The two passwords don't match."; note.hidden = false; return; }
      btn.disabled = true; btn.textContent = "Saving…";
      try { const r = await api("POST", "/api/session", { action: "reset", access_token: token, password: p1.value }); loginScreen(r.message, "ok"); }
      catch (x) { note.textContent = x.message; note.hidden = false; btn.disabled = false; btn.textContent = "Save new password"; }
    } }, h("div", { class: "field" }, h("label", { for: "p1" }, "New password"), p1, h("p", { class: "hint" }, "At least 10 characters.")),
      h("div", { class: "field" }, h("label", { for: "p2" }, "Repeat new password"), p2), note, btn);
    authLayout("Choose a new password", "Set the password for your admin account.", form);
    p1.focus();
  }
  function loginAgain() {
    return new Promise((resolve) => {
      const email = h("input", { type: "text", autocomplete: "username" });
      const pass = h("input", { type: "password", autocomplete: "current-password" });
      const err = h("p", { class: "err", hidden: true });
      const m = modal({
        title: "Your session has ended",
        body: [h("p", { style: { margin: 0 } }, "Please log in again. Your unpublished changes are safe."), h("div", { class: "field" }, h("label", {}, "Email"), email), h("div", { class: "field" }, h("label", {}, "Password"), pass), err],
        foot: [h("button", { class: "btn", onclick: async () => {
          try { await api("POST", "/api/session", { email: email.value, password: pass.value }); m.close(); resolve(); }
          catch (e) { err.textContent = e.message; err.hidden = false; }
        } }, "Log in")],
      });
      setTimeout(() => email.focus(), 60);
    });
  }

  // ------------------------------------------------------------------ shell & routing
  let shellEls = null;
  function shell() {
    const nav = h("nav", { class: "side", "aria-label": "Admin" });
    const top = h("header", { class: "top" });
    const view = h("main", { class: "view", id: "view" });
    const app = $("#app");
    app.innerHTML = "";
    app.appendChild(h("div", { class: "shell" }, nav, h("div", { class: "main" }, top, view)));
    shellEls = { nav, top, view };
  }
  const NAV = [
    ["", [["#/", "dash", "Dashboard"]]],
    ["Pages", [["#/page/home", "home", "Home"], ["#/page/services", "page", "Services"], ["#/page/portfolio", "work", "Portfolio"], ["#/page/about", "page", "About"], ["#/page/blog-page", "blog", "Blog page"], ["#/page/contact", "page", "Contact"]]],
    ["Content", [["#/blog", "blog", "Blog articles"], ["#/projects", "work", "Portfolio projects"], ["#/media", "media", "Media library"]]],
    ["Site", [["#/page/site", "menu", "Menu & footer"], ["#/page/clients", "logos", "Client logos"], ["#/page/settings", "cog", "Contact & settings"], ["#/activity", "clock", "Activity"]]],
  ];
  function refreshChrome() {
    if (!shellEls) return;
    const { nav, top } = shellEls;
    const hash = location.hash || "#/";
    nav.innerHTML = "";
    nav.appendChild(h("div", { class: "side__brand" }, h("img", { src: "/assets/img/oxe-wordmark-white.png", alt: "OXE" }), h("span", {}, "admin")));
    const dirty = (href) => {
      const m = href.match(/^#\/page\/(.+)$/); if (m) { const e = pageEntity(m[1]); return e && !!S.drafts.items[e.path]; }
      if (href === "#/blog") return Object.keys(S.drafts.items).some((p) => p.startsWith("content/blog/"));
      if (href === "#/projects") return Object.keys(S.drafts.items).some((p) => p.startsWith("content/projects/"));
      if (href === "#/media") return Object.keys(S.drafts.items).some((p) => p.startsWith("assets/"));
      return false;
    };
    NAV.forEach(([label, links]) => {
      if (label) nav.appendChild(h("div", { class: "side__label" }, label));
      links.forEach(([href, ic, text]) => {
        const active = href === "#/" ? hash === "#/" || hash === "#" : hash === href || hash.startsWith(href + "/") || (href === "#/blog" && hash.startsWith("#/blog/")) || (href === "#/projects" && hash.startsWith("#/project/"));
        nav.appendChild(h("a", { href, class: active ? "is-active" : "", onclick: () => document.body.classList.remove("menu-open") }, icon(ic), text, dirty(href) ? h("span", { class: "dot", title: "Unpublished changes" }) : null));
      });
    });
    nav.appendChild(h("div", { class: "side__user" }, h("span", { class: "side__avatar" }, (S.user || "?").slice(0, 1).toUpperCase()), h("div", {}, h("b", {}, S.user), h("small", {}, S.demo ? "Demo account" : "Administrator")),
      h("button", { title: "Log out", "aria-label": "Log out", onclick: logout }, icon("out"))));
    const n = draftCount();
    const last = S.lastPublish;
    const deploying = last && (last.state === "pending" || last.state === "waiting");
    top.innerHTML = "";
    add(top, [
      h("button", { class: "btn btn--ghost btn--icon top__menu", "aria-label": "Menu", onclick: () => document.body.classList.toggle("menu-open") }, icon("menu")),
      h("div", { class: "top__title" }, h("small", {}, "OXE Marketing"), h("b", {}, titleFor(hash))),
      h("div", { class: "top__actions" },
        S.demo ? h("span", { class: "badge badge--new", title: "Nothing you do in the demo changes the real website" }, "Demo mode · changes stay in this browser") : null,
        deploying && !S.demo ? h("span", { class: "deploy hide-sm" }, h("span", { class: "spin" }), "Updating the live site…") : null,
        n ? h("button", { class: "pending", onclick: reviewModal }, `${n} unpublished change${n > 1 ? "s" : ""}`) : h("span", { class: "pending pending--clear hide-sm" }, "All changes live"),
        h("a", { class: "btn btn--ghost btn--sm hide-sm", href: "/", target: "_blank", rel: "noopener" }, icon("ext"), "View site"),
        h("button", { class: "btn btn--sm", disabled: !n, onclick: reviewModal }, "Publish", n ? h("span", { class: "btn__count" }, n) : null)),
    ]);
  }
  function titleFor(hash) {
    let m = hash.match(/^#\/page\/(.+)$/); if (m) { const e = pageEntity(m[1]); return e ? e.label : "Page"; }
    m = hash.match(/^#\/blog\/(.+)$/); if (m) return "Article";
    m = hash.match(/^#\/project\/(.+)$/); if (m) return "Project";
    return { "#/blog": "Blog articles", "#/projects": "Portfolio projects", "#/media": "Media library", "#/pages": "Pages", "#/activity": "Activity" }[hash] || "Dashboard";
  }
  function render() {
    if (!S.user || !shellEls) return;
    const hash = location.hash || "#/";
    activePreview = null;
    preview.listeners = [];
    let view;
    let m;
    if ((m = hash.match(/^#\/page\/(.+)$/))) { const e = pageEntity(m[1]); view = e ? editor(e) : h("div", { class: "card empty" }, h("b", {}, "Page not found")); }
    else if ((m = hash.match(/^#\/blog\/(.+)$/))) { const e = folderEntities("blog").find((x) => x.id === m[1]); view = e ? editor(e) : notFound({ path: `content/blog/${m[1]}.md` }); }
    else if ((m = hash.match(/^#\/project\/(.+)$/))) { const e = folderEntities("projects").find((x) => x.id === m[1]); view = e ? editor(e) : notFound({ path: `content/projects/${m[1]}.yml` }); }
    else if (hash === "#/pages") view = pagesScreen();
    else if (hash === "#/blog") view = blogScreen();
    else if (hash === "#/projects") view = projectsScreen();
    else if (hash === "#/media") view = mediaScreen();
    else if (hash === "#/activity") view = activityScreen();
    else view = dashboard();
    shellEls.view.innerHTML = "";
    shellEls.view.appendChild(view);
    refreshChrome();
    window.scrollTo(0, 0);
  }
  async function logout() {
    if (draftCount() && !(await confirmBox("Log out?", "Your unpublished changes stay saved in this browser, ready for next time.", "Log out"))) return;
    await api("DELETE", "/api/session").catch(() => {});
    if (S.demo) { try { sessionStorage.removeItem("oxe-admin:demo"); } catch (e) { /* ignore */ } }
    S.user = null; S.demo = false; shellEls = null; idb.db = null;
    if (preview.worker) { preview.worker.terminate(); preview.worker = null; preview.ready = false; }
    loginScreen();
  }
  async function loadBundle() {
    const b = await api("GET", "/api/repo/bundle");
    S.head = b.head; S.files = b.files; S.media = b.media; S.norm = {};
  }
  async function start() {
    $("#app").innerHTML = '<div class="boot"><div><div class="spin"></div>Loading your website content…</div></div>';
    try {
      const [schemaText] = await Promise.all([fetch("/admin/schema.yml", { cache: "no-cache" }).then((r) => r.text()), loadBundle()]);
      S.schema = jsyaml.load(schemaText);
    } catch (e) {
      $("#app").innerHTML = "";
      $("#app").appendChild(h("div", { class: "boot" }, h("div", { class: "card panel", style: { maxWidth: "520px" } }, h("h2", {}, "The content couldn't be loaded"), h("p", {}, e.message), h("button", { class: "btn", onclick: start }, "Try again"))));
      return;
    }
    loadDrafts();
    await restoreBlobURLs();
    try { S.lastPublish = JSON.parse(localStorage.getItem(lkey())); } catch (e) { S.lastPublish = null; }
    shell();
    render();
    preview.start();    // warm up the preview engine in the background
    if (S.lastPublish && S.lastPublish.state !== "success") trackDeploy();
  }
  window.addEventListener("hashchange", () => {
    const hp = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (hp.get("type") === "recovery" && hp.get("access_token")) { const t = hp.get("access_token"); history.replaceState(null, "", location.pathname); S.user = null; shellEls = null; return resetScreen(t); }
    render();
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); if (S.user) toast("Your changes are saved as drafts automatically. Publish when ready.", "ok"); }
  });
  (async function boot() {
    if (typeof jsyaml === "undefined") { $("#app").innerHTML = '<div class="boot">The editor couldn\'t load. Check your internet connection and refresh.</div>'; return; }
    // back from a Supabase password-reset email: #access_token=…&type=recovery
    const hp = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (hp.get("type") === "recovery" && hp.get("access_token")) {
      const token = hp.get("access_token");
      history.replaceState(null, "", location.pathname);
      return resetScreen(token);
    }
    if (hp.get("error_description")) { history.replaceState(null, "", location.pathname); return loginScreen(hp.get("error_description").replace(/\+/g, " ")); }
    try { if (sessionStorage.getItem("oxe-admin:demo") === "1") return enterDemo(); } catch (e) { /* private mode */ }
    try { const me = await api("GET", "/api/session"); S.user = me.user; start(); }
    catch (e) { loginScreen(e.data && e.data.configured === false ? "The login isn't connected to Supabase yet. You can still explore with the demo account." : "", "info"); }
  })();
})();
