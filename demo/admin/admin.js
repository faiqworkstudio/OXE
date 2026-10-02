import { api, backendMode } from "../assets/api.js";
import { LANG_META } from "../assets/i18n.js";

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const LANGS = Object.keys(LANG_META);
const ME = "Admin (Client)";

const I = {
  dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  pipe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/></svg>',
  leads: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.2 2.5 3.6 5.2"/></svg>',
  proj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  logo: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#2c5047"/><path d="M16 7l7 18h-3l-1.6-4.4h-4.8L12 25H9z" fill="#e9dcc3"/></svg>',
};

const STAGE_LABEL = { new: "New", contacted: "Contacted", viewing: "Viewing", negotiation: "Negotiation", won: "Won", lost: "Lost" };
const SOURCE_LABEL = { website: "Website", facebook: "Facebook", instagram: "Instagram", whatsapp: "WhatsApp", referral: "Referral" };
const TYPE_LABEL = { enquiry: "Enquiry", brochure: "Brochure request", viewing: "Viewing request", waitlist: "Waiting list" };
const STATUS_LABEL = { prelaunch: "Pre-launch", construction: "Under construction", selling: "Now selling", ready: "Ready", soldout: "Sold out" };
const CAT_LABEL = { wellness: "Wellness", longevity: "Longevity", "virgin-islands": "Virgin Islands" };
const FEATURES = ["longevity_clinic", "private_pool", "biohacking", "organic_kitchen", "concierge_doctor", "spa", "yoga_pavilion", "beachfront", "rental_program", "mountain_view", "community_garden", "marina"];
const FEATURE_LABEL = (f) => f.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

let D = null; // bootstrap data
let mode = "server";
const leadFilter = { q: "", stage: "", source: "", language: "", projectId: "", agentId: "" };

// ---------- helpers ----------
const money = (n) => (n >= 1e6 ? "$" + (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M" : "$" + Math.round((n || 0) / 1000) + "k");
const fmtDate = (ts) => new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
function ago(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}
const initials = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");
const agentOf = (id) => D.agents.find((a) => a.id === id);
const projectOf = (id) => D.projects.find((p) => p.id === id);
const avatar = (id) => { const a = agentOf(id); return a ? `<span class="av" title="${esc(a.name)}">${esc(initials(a.name))}</span>` : '<span class="av av--none" title="Unassigned">–</span>'; };
const srcTag = (s) => `<span class="tag tag--${esc(s)}">${esc(SOURCE_LABEL[s] || s)}</span>`;
const stageTag = (s) => `<span class="stage stage--${esc(s)}">${esc(STAGE_LABEL[s] || s)}</span>`;
const langTag = (l) => `<span class="lang-tag">${esc((l || "").toUpperCase())}</span>`;

function toast(html, ms = 4000) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = html;
  $("#toasts").append(el);
  setTimeout(() => el.remove(), ms);
}

async function load() {
  D = await api("GET", "/bootstrap");
}

// ---------- Login ----------
function viewLogin(error = "") {
  $("#app").innerHTML = `
    <div class="login"><div class="login__box">
      <a class="brand" href="../">${I.logo}<span><b>AETERNA</b><small>Admin &amp; CRM</small></span></a>
      <h1>Sign in</h1><p class="muted" style="margin:0">Website content, projects, translations and leads in one place.</p>
      <form id="loginForm">
        <label class="field"><span>Email</span><input class="input" value="admin@aeterna-demo.com" autocomplete="username"></label>
        <label class="field"><span>Password</span><input class="input" type="password" name="password" autocomplete="current-password" required autofocus></label>
        <div class="err">${esc(error)}</div>
        <button class="btn btn--primary" style="height:42px">Sign in</button>
      </form>
      <div class="login__hint">Demo password: <code>aeterna-demo</code><br>The live version would use secure logins per user, with optional two-factor sign-in.</div>
    </div></div>`;
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const r = await api("POST", "/login", { password: e.target.password.value });
      localStorage.setItem("aeterna-key", r.key);
      await start();
    } catch {
      viewLogin("Wrong password. Use the demo password below.");
    }
  });
}

// ---------- Layout ----------
const NAV = [
  ["dashboard", "Dashboard", I.dash],
  ["pipeline", "Pipeline", I.pipe],
  ["leads", "Leads", I.leads],
  ["projects", "Projects & content", I.proj],
  ["integrations", "Integrations", I.plug],
  ["users", "Users & roles", I.users],
  ["settings", "Settings", I.gear],
];

function layout(active, title, sub, actions, body) {
  const newCount = D.leads.filter((l) => l.stage === "new").length;
  $("#app").innerHTML = `
    <div class="mtop"><a class="brand" href="#/dashboard">${I.logo}<span><b>AETERNA</b></span></a><button id="menuBtn" aria-controls="side" aria-expanded="false">Menu</button></div>
    <div class="layout">
      <aside class="side" id="side">
        <a class="brand" href="#/dashboard">${I.logo}<span><b>AETERNA</b><small>Admin &amp; CRM · Demo</small></span></a>
        <nav aria-label="Admin">
          <p>CRM</p>
          ${NAV.slice(0, 3).map(navLink(active, newCount)).join("")}
          <p>Website</p>
          ${NAV.slice(3, 5).map(navLink(active)).join("")}
          <p>Account</p>
          ${NAV.slice(5).map(navLink(active)).join("")}
          <a href="../" target="_blank">${I.ext}View website</a>
        </nav>
        <div class="side__foot">
          <span class="dot ${mode === "server" ? "" : "dot--local"}"></span>${mode === "server" ? "Connected to live backend" : "Offline demo mode (browser storage)"}<br>
          <span style="color:#7f978d">Signed in as ${esc(ME)} · <a href="#" id="logout">Sign out</a></span>
        </div>
      </aside>
      <main class="main" id="main">
        <div class="top"><div><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="top__actions">${actions || ""}</div></div>
        ${body}
      </main>
    </div>`;
  $("#menuBtn").addEventListener("click", () => { const s = $("#side"); s.classList.toggle("is-open"); $("#menuBtn").setAttribute("aria-expanded", String(s.classList.contains("is-open"))); });
  $("#logout").addEventListener("click", (e) => { e.preventDefault(); localStorage.removeItem("aeterna-key"); viewLogin(); });
}
const navLink = (active, newCount) => ([id, label, icon]) =>
  `<a href="#/${id}" ${active === id ? 'aria-current="page"' : ""}>${icon}${esc(label)}${id === "leads" && newCount ? `<span class="pill">${newCount}</span>` : ""}</a>`;

const fbButton = `<button class="btn btn--fb" data-act="fb-test">${I.fb}Simulate Facebook lead</button>`;

// ---------- Dashboard ----------
function viewDashboard() {
  const s = D.stats;
  const delta = s.prev30 ? Math.round(((s.last30 - s.prev30) / s.prev30) * 100) : 100;
  const maxW = Math.max(1, ...s.weeks.map((w) => w.count));
  const barList = (obj, label, keepOrder) => {
    const rows = Object.entries(obj);
    if (!keepOrder) rows.sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return rows.length ? `<div class="bars">${rows.map(([k, v]) => `
      <div class="bar" title="${esc(label(k))}: ${v} leads"><span class="bar__label">${esc(label(k))}</span><span class="bar__track"><span class="bar__fill" style="width:${(v / max) * 100}%"></span></span><span class="bar__n">${v}</span></div>`).join("")}</div>` : '<p class="muted">No leads yet.</p>';
  };
  const recent = D.leads.slice(0, 7);
  layout("dashboard", "Dashboard", "Lead performance across the website, Facebook, Instagram and chat.",
    `<a class="btn" href="../" target="_blank">${I.ext}Open website</a>${fbButton}`,
    `
    ${mode === "server" ? "" : '<div class="banner">Running in offline demo mode: data is stored in this browser only. Deployed on Netlify, the same screens use the shared live backend.</div>'}
    <div class="kpis">
      <div class="kpi"><small>Leads, last 30 days</small><strong>${s.last30}</strong><span><span class="${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}%</span> vs previous 30 days</span></div>
      <div class="kpi"><small>New, not yet contacted</small><strong>${s.newCount}</strong><span>${s.unassigned} unassigned</span></div>
      <div class="kpi"><small>Open pipeline value</small><strong>${money(s.pipelineValue)}</strong><span>Based on project starting prices</span></div>
      <div class="kpi"><small>Win rate</small><strong>${s.winRate}%</strong><span>Won ÷ (won + lost)</span></div>
    </div>
    <div class="grid2">
      <section class="panel">
        <h2>Leads per week</h2><p class="panel__sub">Last 12 weeks, all sources</p>
        <div class="cols" role="img" aria-label="Leads per week, last 12 weeks: ${s.weeks.map((w) => w.count).join(", ")}">
          ${s.weeks.map((w) => `<div class="cols__c" tabindex="0"><div class="cols__bar" style="height:${(w.count / maxW) * 100}%"></div><span class="cols__tip">${new Date(w.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${w.count} leads</span></div>`).join("")}
        </div>
        <div class="cols__x">${s.weeks.map((w, i) => `<span>${i % 3 === 2 || i === 11 ? new Date(w.end).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</span>`).join("")}</div>
      </section>
      <section class="panel">
        <div class="panel__head"><div><h2>Latest leads</h2><p class="panel__sub" style="margin:0">Click to open</p></div><a href="#/leads" class="btn btn--sm">All leads</a></div>
        <div class="list">${recent.map((l) => `
          <a href="#/leads/${esc(l.id)}"><strong>${esc(l.name)} ${langTag(l.language)}</strong><span>${srcTag(l.source)}</span>
          <small>${esc(projectOf(l.projectId)?.name || "General enquiry")}</small><small>${ago(l.createdAt)}</small></a>`).join("")}</div>
      </section>
    </div>
    <div class="grid3">
      <section class="panel"><h2>By source</h2><p class="panel__sub">Last 30 days</p>${barList(s.bySource, (k) => SOURCE_LABEL[k] || k)}</section>
      <section class="panel"><h2>By language</h2><p class="panel__sub">Language the visitor used on the site</p>${barList(s.byLanguage, (k) => LANG_META[k]?.label ? `${LANG_META[k].label} (${k.toUpperCase()})` : k)}</section>
      <section class="panel"><h2>By project</h2><p class="panel__sub">Last 30 days</p>${barList(s.byProject, (k) => projectOf(k)?.name || "General enquiry")}</section>
    </div>
    <section class="panel"><h2>Pipeline</h2><p class="panel__sub">All leads by stage</p>
      ${barList(Object.fromEntries(D.stages.map((st) => [st, s.byStage[st] || 0])), (k) => STAGE_LABEL[k], true)}
    </section>`);
}

// ---------- Pipeline ----------
function viewPipeline() {
  const cols = D.stages.map((st) => {
    const leads = D.leads.filter((l) => l.stage === st);
    const value = leads.reduce((sum, l) => sum + (l.value || 0), 0);
    return `
      <section class="col" data-stage="${st}" aria-label="${STAGE_LABEL[st]}">
        <div class="col__head">${stageTag(st)}<small>${leads.length}</small></div>
        <span class="col__val">${money(value)}</span>
        ${leads.slice(0, 40).map((l) => `
          <article class="lcard" draggable="true" data-id="${esc(l.id)}" tabindex="0">
            <strong>${esc(l.name)}</strong>
            <p>${esc(projectOf(l.projectId)?.name || "General enquiry")}</p>
            <div class="lcard__foot">${srcTag(l.source)}${langTag(l.language)}<span class="lcard__age">${ago(l.createdAt)}</span>${avatar(l.agentId)}</div>
            <select class="select move" data-move="${esc(l.id)}" aria-label="Move ${esc(l.name)} to stage">${D.stages.map((x) => `<option value="${x}" ${x === st ? "selected" : ""}>${STAGE_LABEL[x]}</option>`).join("")}</select>
          </article>`).join("")}
        ${leads.length > 40 ? `<p class="muted" style="font-size:12px;padding:4px">+${leads.length - 40} more in Leads</p>` : ""}
      </section>`;
  }).join("");
  layout("pipeline", "Sales pipeline", "Drag a card to move a lead to the next stage. Every change is logged on the lead.", fbButton, `<div class="board">${cols}</div>`);

  let dragId = null;
  document.querySelectorAll(".lcard").forEach((c) => {
    c.addEventListener("dragstart", (e) => { dragId = c.dataset.id; c.classList.add("is-dragging"); e.dataTransfer.setData("text/plain", dragId); });
    c.addEventListener("dragend", () => c.classList.remove("is-dragging"));
    c.addEventListener("click", (e) => { if (!e.target.closest("select")) location.hash = "#/pipeline/" + c.dataset.id; });
    c.addEventListener("keydown", (e) => { if (e.key === "Enter") location.hash = "#/pipeline/" + c.dataset.id; });
  });
  document.querySelectorAll(".col").forEach((col) => {
    col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("is-over"); });
    col.addEventListener("dragleave", () => col.classList.remove("is-over"));
    col.addEventListener("drop", async (e) => {
      e.preventDefault();
      col.classList.remove("is-over");
      const id = e.dataTransfer.getData("text/plain") || dragId;
      await moveLead(id, col.dataset.stage);
    });
  });
  document.querySelectorAll("[data-move]").forEach((s) => s.addEventListener("change", () => moveLead(s.dataset.move, s.value)));
}

async function moveLead(id, stage) {
  const lead = D.leads.find((l) => l.id === id);
  if (!lead || lead.stage === stage) return;
  await api("PATCH", "/leads/" + id, { stage, by: ME });
  await load();
  render();
  toast(`${esc(lead.name)} moved to <b>${STAGE_LABEL[stage]}</b>`);
}

// ---------- Leads ----------
function filteredLeads() {
  const q = leadFilter.q.toLowerCase();
  return D.leads.filter((l) =>
    (!leadFilter.stage || l.stage === leadFilter.stage) &&
    (!leadFilter.source || l.source === leadFilter.source) &&
    (!leadFilter.language || l.language === leadFilter.language) &&
    (!leadFilter.projectId || l.projectId === leadFilter.projectId) &&
    (!leadFilter.agentId || (leadFilter.agentId === "none" ? !l.agentId : l.agentId === leadFilter.agentId)) &&
    (!q || [l.name, l.email, l.phone, l.country, l.id, l.utm?.campaign].join(" ").toLowerCase().includes(q)));
}

function viewLeads() {
  const sel = (name, label, opts) => `<select class="select" data-lf="${name}" aria-label="${label}"><option value="">${label}: all</option>${opts.map(([v, t]) => `<option value="${esc(v)}" ${leadFilter[name] === v ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
  layout("leads", "Leads", "Every enquiry from the website, Facebook and Instagram Lead Ads, WhatsApp and referrals.",
    `<button class="btn" data-act="csv">${I.dl}Export CSV</button>${fbButton}`,
    `<div class="toolbar">
      <input class="input" type="search" data-lf="q" placeholder="Search name, email, phone, ID…" value="${esc(leadFilter.q)}" aria-label="Search leads">
      ${sel("stage", "Stage", D.stages.map((s) => [s, STAGE_LABEL[s]]))}
      ${sel("source", "Source", Object.entries(SOURCE_LABEL))}
      ${sel("language", "Language", LANGS.map((l) => [l, LANG_META[l].label]))}
      ${sel("projectId", "Project", D.projects.map((p) => [p.id, p.name]))}
      ${sel("agentId", "Agent", [...D.agents.map((a) => [a.id, a.name]), ["none", "Unassigned"]])}
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Lead</th><th>Project</th><th>Source</th><th>Lang</th><th>Stage</th><th>Agent</th><th>Received</th></tr></thead>
      <tbody id="leadRows"></tbody>
    </table></div>
    <p class="muted" id="leadCount" style="margin-top:10px"></p>`);
  renderLeadRows();
  document.querySelectorAll("[data-lf]").forEach((el) => el.addEventListener("input", () => { leadFilter[el.dataset.lf] = el.value; renderLeadRows(); }));
}

function renderLeadRows() {
  const rows = filteredLeads();
  $("#leadRows").innerHTML = rows.length ? rows.map((l) => `
    <tr data-lead="${esc(l.id)}" tabindex="0">
      <td><strong>${esc(l.name)}</strong><span class="sub">${esc(l.email || l.phone)} · ${esc(l.id)}</span></td>
      <td>${esc(projectOf(l.projectId)?.name || "General enquiry")}<span class="sub">${esc(TYPE_LABEL[l.type] || l.type)}</span></td>
      <td>${srcTag(l.source)}${l.utm?.campaign ? `<span class="sub">${esc(l.utm.campaign)}</span>` : ""}</td>
      <td>${langTag(l.language)}</td>
      <td>${stageTag(l.stage)}</td>
      <td>${avatar(l.agentId)}</td>
      <td>${ago(l.createdAt)}<span class="sub">${new Date(l.createdAt).toLocaleDateString("en-GB")}</span></td>
    </tr>`).join("") : '<tr><td colspan="7" class="empty">No leads match these filters.</td></tr>';
  $("#leadCount").textContent = `${rows.length} of ${D.leads.length} leads`;
  document.querySelectorAll("[data-lead]").forEach((tr) => {
    const go = () => (location.hash = "#/leads/" + tr.dataset.lead);
    tr.addEventListener("click", go);
    tr.addEventListener("keydown", (e) => e.key === "Enter" && go());
  });
}

function exportCSV() {
  const cols = ["id", "createdAt", "name", "email", "phone", "country", "language", "project", "type", "budget", "source", "utm_source", "utm_medium", "utm_campaign", "stage", "agent", "message"];
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [cols.join(",")].concat(filteredLeads().map((l) => [
    l.id, new Date(l.createdAt).toISOString(), l.name, l.email, l.phone, l.country, l.language, projectOf(l.projectId)?.name || "", l.type, l.budget,
    l.source, l.utm?.source, l.utm?.medium, l.utm?.campaign, l.stage, agentOf(l.agentId)?.name || "", l.message,
  ].map(q).join(",")));
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `aeterna-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- Lead drawer ----------
function openLead(id, back) {
  const l = D.leads.find((x) => x.id === id);
  if (!l) return;
  const p = projectOf(l.projectId);
  const phone = (l.phone || "").replace(/[^\d+]/g, "");
  $("#drawer").innerHTML = `
    <div class="drawer__head">
      <div><p class="muted" style="margin:0 0 4px">${esc(l.id)} · ${esc(TYPE_LABEL[l.type] || l.type)}</p><h2>${esc(l.name)}</h2>
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">${srcTag(l.source)}${langTag(l.language)}${stageTag(l.stage)}</div></div>
      <button class="btn btn--sm" id="drawerClose" aria-label="Close">✕</button>
    </div>
    <div class="quick">
      ${l.email ? `<a class="btn btn--sm" href="mailto:${esc(l.email)}?subject=${encodeURIComponent((p?.name || "Aeterna Estates") + " — your enquiry")}">Email</a>` : ""}
      ${phone ? `<a class="btn btn--sm" href="https://wa.me/${esc(phone.replace("+", ""))}" target="_blank" rel="noopener">WhatsApp</a><a class="btn btn--sm" href="tel:${esc(phone)}">Call</a>` : ""}
      ${p ? `<a class="btn btn--sm" href="../?lang=${esc(l.language)}#/project/${esc(p.id)}" target="_blank">${I.ext}View project</a>` : ""}
    </div>
    <div class="controls">
      <label class="field"><span>Stage</span><select class="select" id="dStage">${D.stages.map((s) => `<option value="${s}" ${s === l.stage ? "selected" : ""}>${STAGE_LABEL[s]}</option>`).join("")}</select></label>
      <label class="field"><span>Assigned agent</span><select class="select" id="dAgent"><option value="">Unassigned</option>${D.agents.map((a) => `<option value="${a.id}" ${a.id === l.agentId ? "selected" : ""}>${esc(a.name)} (${a.langs.map((x) => x.toUpperCase()).join("/")})</option>`).join("")}</select></label>
    </div>
    <h3>Contact & interest</h3>
    <dl class="dl">
      <dt>Email</dt><dd>${esc(l.email || "—")}</dd>
      <dt>Phone</dt><dd dir="ltr">${esc(l.phone || "—")}</dd>
      <dt>Country</dt><dd>${esc(l.country || "—")}</dd>
      <dt>Language</dt><dd>${esc(LANG_META[l.language]?.label || l.language)}</dd>
      <dt>Project</dt><dd>${esc(p?.name || "General enquiry")}</dd>
      <dt>Budget</dt><dd>${esc(l.budget || "—")}</dd>
      <dt>Est. value</dt><dd>${money(l.value)}</dd>
      <dt>Received</dt><dd>${fmtDate(l.createdAt)}</dd>
    </dl>
    ${l.message ? `<h3>Message</h3><div class="msg">${esc(l.message)}</div>` : ""}
    <h3>Attribution</h3>
    <dl class="dl">
      <dt>Source</dt><dd>${esc(SOURCE_LABEL[l.source] || l.source)}</dd>
      <dt>UTM source / medium</dt><dd>${esc(l.utm?.source || "—")} / ${esc(l.utm?.medium || "—")}</dd>
      <dt>Campaign</dt><dd>${esc(l.utm?.campaign || "—")}</dd>
      <dt>Page</dt><dd>${esc(l.page || "—")}</dd>
    </dl>
    <h3>Notes</h3>
    ${l.notes.map((n) => `<div class="note"><small>${esc(n.by)} · ${fmtDate(n.at)}</small>${esc(n.text)}</div>`).join("") || '<p class="muted">No notes yet.</p>'}
    <form id="noteForm" style="display:grid;gap:8px;margin-top:8px">
      <textarea class="textarea" name="note" placeholder="Add a note (call summary, next step…)" maxlength="2000" required></textarea>
      <div><button class="btn btn--primary btn--sm">Add note</button></div>
    </form>
    <h3>Activity</h3>
    <ul class="timeline">${[...l.activity].reverse().map((a) => `<li>${esc(a.text)}<small>${fmtDate(a.at)}</small></li>`).join("")}</ul>`;
  $("#drawerWrap").hidden = false;
  $("#drawerClose").focus();
  const close = () => { $("#drawerWrap").hidden = true; location.hash = back; };
  $("#drawerClose").onclick = close;
  $("#drawerWrap").onclick = (e) => { if (e.target.id === "drawerWrap") close(); };
  const patch = async (body, msg) => {
    await api("PATCH", "/leads/" + l.id, { ...body, by: ME });
    await load();
    render();
    toast(msg);
  };
  $("#dStage").onchange = (e) => patch({ stage: e.target.value }, `Stage updated to <b>${STAGE_LABEL[e.target.value]}</b>`);
  $("#dAgent").onchange = (e) => patch({ agentId: e.target.value || null }, "Agent updated");
  $("#noteForm").onsubmit = (e) => { e.preventDefault(); patch({ note: e.target.note.value }, "Note added"); };
}

// ---------- Projects ----------
function trStatus(p) {
  return `<div class="tr-status" title="Translation status">${LANGS.map((l) => `<span class="${p.i18n?.[l]?.tagline && p.i18n?.[l]?.description ? "" : "miss"}">${l.toUpperCase()}</span>`).join("")}</div>`;
}

function viewProjects() {
  layout("projects", "Projects & content", "Add and edit projects, photos, collections and all five languages. Changes appear on the website straight away.",
    `<a class="btn" href="../" target="_blank">${I.ext}View website</a><a class="btn btn--primary" href="#/projects/new">${I.plus}New project</a>`,
    `<div class="pgrid">${D.projects.map((p) => `
      <article class="pcard">
        <div class="pcard__img"><img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.remove()"></div>
        <div class="pcard__body">
          <div class="pcard__row"><strong>${esc(p.name)}</strong><span class="status ${p.published ? "status--on" : "status--off"}">${p.published ? "Published" : "Draft"}</span></div>
          <span class="muted">${esc(p.location)} · from ${money(p.priceFrom)}</span>
          <div class="pcard__row"><span>${p.categories.map((c) => `<span class="tag">${esc(CAT_LABEL[c])}</span>`).join(" ")}</span></div>
          <div class="pcard__row">${trStatus(p)}<span class="muted" style="font-size:12px">${esc(STATUS_LABEL[p.status])}</span></div>
          <div class="pcard__row" style="margin-top:auto"><a class="btn btn--sm" href="#/projects/${esc(p.id)}">Edit</a><a class="btn btn--sm" href="../#/project/${esc(p.id)}" target="_blank">${I.ext}Preview</a></div>
        </div>
      </article>`).join("")}</div>`);
}

function viewProjectEdit(id) {
  const isNew = id === "new";
  const p = isNew
    ? { id: "", name: "", categories: [], location: "", region: "thailand", type: "villa", priceFrom: 0, beds: "", size: "", status: "prelaunch", completion: "", featured: false, published: false, image: "", features: [], mapQuery: "", i18n: {} }
    : projectOf(id);
  if (!p) { location.hash = "#/projects"; return; }
  let tab = "en";
  layout("projects", isNew ? "New project" : `Edit: ${p.name}`, `<a href="#/projects">← All projects</a>`,
    `${isNew ? "" : `<button class="btn btn--danger" data-act="del-project">Delete</button><a class="btn" href="../#/project/${esc(p.id)}" target="_blank">${I.ext}Preview</a>`}<button class="btn btn--primary" form="pForm">Save &amp; publish changes</button>`,
    `<form id="pForm" class="editor">
      <div style="display:grid;gap:14px">
        <section class="panel">
          <h2>Details</h2>
          <label class="field"><span>Project name</span><input class="input" name="name" value="${esc(p.name)}" required maxlength="120"></label>
          <div class="row2">
            <label class="field"><span>Location</span><input class="input" name="location" value="${esc(p.location)}"></label>
            <label class="field"><span>Destination</span><select class="select" name="region"><option value="thailand" ${p.region === "thailand" ? "selected" : ""}>Thailand</option><option value="bvi" ${p.region === "bvi" ? "selected" : ""}>British Virgin Islands</option></select></label>
          </div>
          <div class="row2">
            <label class="field"><span>Property type</span><select class="select" name="type">${["villa", "condo", "penthouse", "land"].map((t) => `<option ${p.type === t ? "selected" : ""} value="${t}">${t[0].toUpperCase() + t.slice(1)}</option>`).join("")}</select></label>
            <label class="field"><span>Sales status</span><select class="select" name="status">${Object.entries(STATUS_LABEL).map(([k, v]) => `<option value="${k}" ${p.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          </div>
          <div class="row2">
            <label class="field"><span>Price from (USD)</span><input class="input" name="priceFrom" type="number" min="0" step="1000" value="${p.priceFrom}"></label>
            <label class="field"><span>Completion</span><input class="input" name="completion" value="${esc(p.completion)}"></label>
          </div>
          <div class="row2">
            <label class="field"><span>Bedrooms</span><input class="input" name="beds" value="${esc(p.beds)}"></label>
            <label class="field"><span>Size</span><input class="input" name="size" value="${esc(p.size)}"></label>
          </div>
          <label class="field"><span>Map location (Google Maps search)</span><input class="input" name="mapQuery" value="${esc(p.mapQuery)}"></label>
        </section>
        <section class="panel">
          <h2>Collections & filters</h2><p class="panel__sub" style="margin:0">Controls where the project appears in the website search and filters.</p>
          <div class="checks">${Object.entries(CAT_LABEL).map(([k, v]) => `<label><input type="checkbox" name="categories" value="${k}" ${p.categories.includes(k) ? "checked" : ""}>${v}</label>`).join("")}</div>
          <span class="field"><span>Highlights</span></span>
          <div class="checks">${FEATURES.map((f) => `<label><input type="checkbox" name="features" value="${f}" ${p.features.includes(f) ? "checked" : ""}>${FEATURE_LABEL(f)}</label>`).join("")}</div>
          <div class="checks">
            <label><input type="checkbox" name="published" ${p.published ? "checked" : ""}>Published on website</label>
            <label><input type="checkbox" name="featured" ${p.featured ? "checked" : ""}>Featured</label>
          </div>
        </section>
      </div>
      <div style="display:grid;gap:14px">
        <section class="panel">
          <h2>Main photo</h2>
          <div class="preview" id="imgPrev">${p.image ? `<img src="${esc(p.image)}" alt="" onerror="this.remove()">` : ""}</div>
          <label class="field"><span>Image URL</span><input class="input" name="image" value="${esc(p.image)}" placeholder="https://…"></label>
          <p class="muted" style="margin:0;font-size:12px">The live version would let you upload photos, floor plans and brochure PDFs here, resized and converted to WebP automatically.</p>
        </section>
        <section class="panel">
          <div class="panel__head"><div><h2>Translations</h2><p class="panel__sub" style="margin:0">Tagline and description in each language</p></div><button type="button" class="btn btn--sm" data-act="draft">Fill missing from English</button></div>
          <div class="tabs" role="tablist">${LANGS.map((l) => `<button type="button" role="tab" data-tab="${l}" aria-selected="${l === tab}"><span class="dot ${p.i18n?.[l]?.description ? "" : "miss"}"></span>${esc(LANG_META[l].label)}</button>`).join("")}</div>
          ${LANGS.map((l) => `
            <div class="pane" data-pane="${l}" ${l === tab ? "" : "hidden"} lang="${l}" dir="${LANG_META[l].dir}">
              <label class="field"><span>Tagline (${l.toUpperCase()})</span><input class="input" name="tagline_${l}" value="${esc(p.i18n?.[l]?.tagline || "")}" maxlength="200"></label>
              <label class="field"><span>Description (${l.toUpperCase()})</span><textarea class="textarea" name="description_${l}" rows="7" maxlength="2000">${esc(p.i18n?.[l]?.description || "")}</textarea></label>
            </div>`).join("")}
          <p class="muted" style="margin:0;font-size:12px">Arabic is edited and shown right-to-left. Machine translation (DeepL or AI) can pre-fill drafts for review by a native speaker.</p>
        </section>
      </div>
    </form>`);

  const form = $("#pForm");
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => {
    tab = b.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    document.querySelectorAll("[data-pane]").forEach((x) => (x.hidden = x.dataset.pane !== tab));
  }));
  form.image.addEventListener("change", () => { $("#imgPrev").innerHTML = form.image.value ? `<img src="${esc(form.image.value)}" alt="" onerror="this.remove()">` : ""; });
  $("[data-act=draft]").addEventListener("click", () => {
    let n = 0;
    for (const l of LANGS.slice(1)) {
      if (!form["tagline_" + l].value) { form["tagline_" + l].value = form.tagline_en.value; n++; }
      if (!form["description_" + l].value) { form["description_" + l].value = form.description_en.value; n++; }
    }
    toast(n ? "Missing fields filled from English, marked for translation." : "All languages already have text.");
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = {
      name: fd.get("name"), location: fd.get("location"), region: fd.get("region"), type: fd.get("type"), status: fd.get("status"),
      priceFrom: Number(fd.get("priceFrom")), completion: fd.get("completion"), beds: fd.get("beds"), size: fd.get("size"),
      mapQuery: fd.get("mapQuery"), image: fd.get("image"), categories: fd.getAll("categories"), features: fd.getAll("features"),
      published: fd.get("published") === "on", featured: fd.get("featured") === "on",
      i18n: Object.fromEntries(LANGS.map((l) => [l, { tagline: fd.get("tagline_" + l), description: fd.get("description_" + l) }])),
    };
    const r = isNew ? await api("POST", "/projects", body) : await api("PUT", "/projects/" + p.id, body);
    await load();
    location.hash = "#/projects/" + r.project.id;
    render();
    toast(`Saved. <a href="../#/project/${esc(r.project.id)}" target="_blank">View on website</a>`);
  });
  const del = $("[data-act=del-project]");
  if (del) del.addEventListener("click", async () => {
    if (!confirm(`Delete "${p.name}"? It will be removed from the website.`)) return;
    await api("DELETE", "/projects/" + p.id);
    await load();
    location.hash = "#/projects";
    toast("Project deleted");
  });
}

// ---------- Integrations ----------
const INTEGRATIONS = [
  ["forms", "Website forms → CRM", "Enquiry, brochure, viewing and waiting-list forms create leads here instantly, with UTM and page data.", "#2f7a5f", "WEB"],
  ["facebook", "Facebook Lead Ads", "Meta sends a webhook for each new lead; the backend fetches the answers from the Graph API and creates the lead.", "#1877f2", I.fb],
  ["instagram", "Instagram Lead Ads", "Same Meta connection as Facebook. Leads are tagged with Instagram as the source.", "#c13584", "IG"],
  ["ga4", "Google Analytics 4", "Page views, searches, filters, form opens and generate_lead events, loaded only after cookie consent.", "#e37400", "GA"],
  ["gsc", "Google Search Console", "Domain verified; sitemap with all five language versions (hreflang) submitted.", "#4285f4", "GSC"],
  ["pixel", "Meta Pixel + Conversions API", "Tracks Lead events from the browser and server for better ad optimisation.", "#0866ff", "PX"],
  ["whatsapp", "WhatsApp Business", "Click-to-chat buttons on every page; optional new-lead alerts to the sales team.", "#25d366", "WA"],
  ["line", "LINE Official Account", "Chat button for Thai buyers; optional LINE Notify alerts for new leads.", "#06c755", "LINE"],
  ["email", "Email alerts & auto-reply", "Instant email to the sales inbox and an auto-reply to the buyer in their language.", "#5b6b82", "@"],
  ["webhook", "Outgoing webhook / Zapier", "Optionally forward every new lead to another system (HubSpot, Zoho, Google Sheets, ERP).", "#7a4fd1", "API"],
];

function viewIntegrations() {
  const s = D.settings;
  const origin = location.origin;
  layout("integrations", "Integrations", "Everything that sends data into the CRM or measures the website.", fbButton, `
    <div class="flow" aria-label="Lead flow">
      <b>Website forms</b><i>+</i><b>Facebook / Instagram Lead Ads</b><i>+</i><b>WhatsApp / LINE</b><i>→</i><b>Aeterna CRM</b><i>→</i><b>Auto-assign agent</b><i>→</i><b>Email / LINE alert</b><i>→</i><b>Pipeline &amp; reports</b>
    </div>
    <div class="igrid">${INTEGRATIONS.map(([k, name, desc, color, logo]) => `
      <section class="icard">
        <div class="icard__head"><span class="icard__logo" style="background:${color}">${logo}</span><div><h3>${esc(name)}</h3><span class="status ${s.integrations[k] ? "status--on" : "status--off"}">${s.integrations[k] ? "Connected" : "Off"}</span></div>
          <label class="switch"><input type="checkbox" data-int="${k}" ${s.integrations[k] ? "checked" : ""} aria-label="${esc(name)}"><span></span></label></div>
        <p>${esc(desc)}</p>
        ${k === "facebook" ? `<label class="field"><span>Webhook callback URL (for Meta)</span><input class="input" readonly value="${esc(origin)}/api/demo/webhooks/facebook"></label><div><button class="btn btn--fb btn--sm" data-act="fb-test">${I.fb}Send test lead</button></div>` : ""}
        ${k === "ga4" ? `<label class="field"><span>Measurement ID</span><input class="input" data-set="ga4Id" value="${esc(s.ga4Id)}"></label>` : ""}
        ${k === "pixel" ? `<label class="field"><span>Pixel ID</span><input class="input" data-set="pixelId" value="${esc(s.pixelId)}"></label>` : ""}
        ${k === "whatsapp" ? `<label class="field"><span>WhatsApp number</span><input class="input" data-set="whatsapp" value="${esc(s.whatsapp)}"></label>` : ""}
        ${k === "line" ? `<label class="field"><span>LINE ID</span><input class="input" data-set="lineId" value="${esc(s.lineId)}"></label>` : ""}
        ${k === "email" ? `<label class="field"><span>Send alerts to</span><input class="input" data-set="notifyEmail" value="${esc(s.notifyEmail)}"></label>` : ""}
        ${k === "webhook" ? `<label class="field"><span>Webhook URL</span><input class="input" data-set="webhookUrl" value="${esc(s.webhookUrl)}" placeholder="https://hooks.zapier.com/…"></label>` : ""}
        ${k === "gsc" ? `<p><a href="../../sitemap.xml" target="_blank">sitemap.xml</a> · 5 languages · hreflang tags</p>` : ""}
      </section>`).join("")}</div>`);

  document.querySelectorAll("[data-int]").forEach((el) => el.addEventListener("change", async () => {
    await api("PUT", "/settings", { integrations: { [el.dataset.int]: el.checked } });
    await load();
    render();
    toast(`${INTEGRATIONS.find((x) => x[0] === el.dataset.int)[1]} ${el.checked ? "connected" : "turned off"}`);
  }));
  document.querySelectorAll("[data-set]").forEach((el) => el.addEventListener("change", async () => {
    await api("PUT", "/settings", { [el.dataset.set]: el.value });
    await load();
    toast("Saved");
  }));
}

async function facebookTest() {
  try {
    const r = await api("POST", "/facebook-test", {});
    await load();
    render();
    $("#dlgBody").innerHTML = `
      <h2>Facebook lead received</h2>
      <p class="muted" style="margin:0">1. Meta calls the webhook with the lead ID → 2. the backend fetches the form answers from the Graph API → 3. the lead is created, assigned and alerts are sent.</p>
      <div class="codes">
        <div><strong style="font-size:12px">Webhook from Meta</strong><pre class="code">${esc(JSON.stringify(r.webhook, null, 2))}</pre></div>
        <div><strong style="font-size:12px">Graph API answers</strong><pre class="code">${esc(JSON.stringify(r.graph, null, 2))}</pre></div>
      </div>
      <p style="margin:0">Created lead <b>${esc(r.lead.id)}</b> for <b>${esc(r.lead.name)}</b> → ${esc(projectOf(r.lead.projectId)?.name || "")}, assigned to ${esc(agentOf(r.lead.agentId)?.name || "nobody")}.</p>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-close>Close</button><a class="btn btn--primary" href="#/leads/${esc(r.lead.id)}" data-close>Open lead</a></div>`;
    $("#dlg").showModal();
  } catch (e) {
    toast(e.message === "facebook_disabled" ? "Facebook Lead Ads is turned off in Integrations." : "Could not create the test lead.");
  }
}

// ---------- Users ----------
function viewUsers() {
  const perms = [
    ["View dashboard & reports", [1, 1, 1, 0, 1]],
    ["View all leads", [1, 1, 0, 0, 1]],
    ["View own assigned leads", [1, 1, 1, 0, 1]],
    ["Edit leads, notes & stages", [1, 1, 1, 0, 0]],
    ["Assign leads to agents", [1, 1, 0, 0, 0]],
    ["Export leads (CSV)", [1, 1, 0, 0, 0]],
    ["Edit projects & translations", [1, 0, 0, 1, 1]],
    ["Publish website changes", [1, 0, 0, 1, 1]],
    ["Manage integrations & settings", [1, 0, 0, 0, 1]],
    ["Manage users", [1, 0, 0, 0, 0]],
  ];
  const roles = ["Owner", "Sales Manager", "Sales Agent", "Content Editor", "Developer"];
  layout("users", "Users & roles", "Developer and client access, with permissions per role.", `<button class="btn btn--primary" data-act="invite">${I.plus}Invite user</button>`, `
    <div class="table-wrap" style="margin-bottom:14px"><table>
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Languages</th><th>Status</th></tr></thead>
      <tbody>${D.users.map((u) => {
        const a = D.agents.find((x) => x.name === u.name);
        return `<tr style="cursor:default"><td><strong>${esc(u.name)}</strong></td><td>${esc(u.email)}</td><td>${esc(u.role)}</td><td>${a ? a.langs.map(langTag).join(" ") : "—"}</td><td><span class="status status--on">Active</span></td></tr>`;
      }).join("")}</tbody>
    </table></div>
    <section class="panel"><h2>Permissions by role</h2><p class="panel__sub">Roles can be adjusted to match how the sales team works.</p>
      <div class="table-wrap"><table class="matrix">
        <thead><tr><th>Permission</th>${roles.map((r) => `<th>${r}</th>`).join("")}</tr></thead>
        <tbody>${perms.map(([name, v]) => `<tr><td>${name}</td>${v.map((x) => (x ? '<td class="yes" aria-label="Yes">✓</td>' : '<td class="no" aria-label="No">—</td>')).join("")}</tr>`).join("")}</tbody>
      </table></div>
    </section>`);
}

// ---------- Settings ----------
function viewSettings() {
  const s = D.settings;
  layout("settings", "Settings", "Lead routing and demo controls.", "", `
    <div class="grid2">
      <section class="panel" style="display:grid;gap:14px">
        <h2>Lead routing</h2>
        <label style="display:flex;gap:12px;align-items:center"><span class="switch"><input type="checkbox" data-opt="autoAssign" ${s.autoAssign ? "checked" : ""}><span></span></span><span><b>Auto-assign new leads</b><br><span class="muted">Match the buyer's language to an agent, otherwise round robin.</span></span></label>
        <label style="display:flex;gap:12px;align-items:center"><span class="switch"><input type="checkbox" data-opt="autoReply" ${s.autoReply ? "checked" : ""}><span></span></span><span><b>Auto-reply to buyers</b><br><span class="muted">Instant confirmation email in the language they used.</span></span></label>
        <h2 style="margin-top:8px">Agents</h2>
        <div class="list">${D.agents.map((a) => `<a style="cursor:default"><strong>${esc(a.name)}</strong><span>${a.langs.map(langTag).join(" ")}</span><small>${esc(a.role)}</small><small>${D.leads.filter((l) => l.agentId === a.id && !["won", "lost"].includes(l.stage)).length} open leads</small></a>`).join("")}</div>
      </section>
      <section class="panel" style="display:grid;gap:12px;align-content:start">
        <h2>Demo data</h2>
        <p class="muted" style="margin:0">Backend: <b>${mode === "server" ? "Live (Netlify Functions + Netlify Blobs)" : "Offline (this browser only)"}</b>. Sample data created ${fmtDate(D.seededAt)}.</p>
        <p class="muted" style="margin:0">Reset restores the sample projects and leads and removes everything added during the demo.</p>
        <div><button class="btn btn--danger" data-act="reset">Reset demo data</button></div>
      </section>
    </div>`);
  document.querySelectorAll("[data-opt]").forEach((el) => el.addEventListener("change", async () => {
    await api("PUT", "/settings", { [el.dataset.opt]: el.checked });
    await load();
    toast("Saved");
  }));
}

// ---------- Router ----------
function render() {
  const h = location.hash.replace(/^#\/?/, "") || "dashboard";
  const [view, id] = h.split("/");
  const views = { dashboard: viewDashboard, pipeline: viewPipeline, leads: viewLeads, projects: viewProjects, integrations: viewIntegrations, users: viewUsers, settings: viewSettings };
  if (view === "projects" && id) viewProjectEdit(id);
  else (views[view] || viewDashboard)();
  if ((view === "leads" || view === "pipeline") && id) openLead(id, "#/" + view);
  else $("#drawerWrap").hidden = true;
}

document.addEventListener("click", (e) => {
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "fb-test") facebookTest();
  if (act === "csv") exportCSV();
  if (act === "invite") toast("In the live version this sends an email invitation with a role.");
  if (act === "reset" && confirm("Reset all demo data?")) {
    api("POST", "/reset").then(load).then(() => { render(); toast("Demo data reset"); });
  }
  if (e.target.closest("[data-close]")) $("#dlg").close();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#drawerWrap").hidden) $("#drawerClose")?.click();
});
window.addEventListener("hashchange", () => { if (D) render(); });

// New leads from the website show up while the admin is open.
async function poll() {
  if (!D || document.hidden || !$("#drawerWrap").hidden || document.activeElement?.matches("input, textarea, select")) return;
  const known = new Set(D.leads.map((l) => l.id));
  try { await load(); } catch { return; }
  const fresh = D.leads.filter((l) => !known.has(l.id));
  if (!fresh.length) return;
  const h = location.hash;
  if (!/projects\/|integrations|settings|users/.test(h)) render();
  for (const l of fresh.slice(0, 3)) toast(`New ${esc(SOURCE_LABEL[l.source] || l.source)} lead: <b>${esc(l.name)}</b> ${langTag(l.language)} · <a href="#/leads/${esc(l.id)}">Open</a>`, 7000);
}

async function start() {
  try {
    mode = await backendMode();
    await load();
  } catch (e) {
    if (e.status === 401) { localStorage.removeItem("aeterna-key"); viewLogin(); return; }
    $("#app").innerHTML = '<p class="empty">Could not reach the backend. Please reload.</p>';
    return;
  }
  render();
  clearInterval(start.timer);
  start.timer = setInterval(poll, 8000);
}

if (localStorage.getItem("aeterna-key")) start();
else viewLogin();
