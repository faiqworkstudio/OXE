// Demo API: one router used by the Netlify Function (real backend) and by the
// in-browser fallback, so both behave the same.
import { PROJECTS, SETTINGS, AGENTS, USERS, STAGES, CATEGORIES, LANGS, seedLeads } from "./seed.js";

export const DEMO_PASSWORD = "aeterna-demo";
const MAX_LEADS = 500;

const clone = (o) => JSON.parse(JSON.stringify(o));

export function createState(now = Date.now()) {
  return {
    version: 1,
    seededAt: now,
    projects: clone(PROJECTS),
    leads: seedLeads(now),
    settings: clone(SETTINGS),
    agents: clone(AGENTS),
    users: clone(USERS),
    nextLead: 2001,
    rr: 0,
  };
}

const str = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function newLead(state, input, source, now) {
  const project = state.projects.find((p) => p.id === input.projectId);
  const lead = {
    id: "L" + state.nextLead++,
    createdAt: now,
    name: str(input.name, 120),
    email: str(input.email, 160).toLowerCase(),
    phone: str(input.phone, 40),
    country: str(input.country, 40),
    language: LANGS.includes(input.language) ? input.language : "en",
    projectId: project ? project.id : "",
    budget: str(input.budget, 20),
    message: str(input.message, 2000),
    type: ["enquiry", "brochure", "viewing", "waitlist"].includes(input.type) ? input.type : "enquiry",
    source,
    utm: {
      source: str(input.utm?.source, 80),
      medium: str(input.utm?.medium, 80),
      campaign: str(input.utm?.campaign, 120),
    },
    page: str(input.page, 300),
    stage: "new",
    agentId: null,
    value: project ? project.priceFrom : 0,
    notes: [],
    activity: [{ at: now, text: `Lead created from ${source}` }],
  };
  if (state.settings.autoAssign) {
    // Language match first, otherwise round robin.
    const agent = state.agents.find((a) => a.langs[0] === lead.language) || state.agents[state.rr++ % state.agents.length];
    lead.agentId = agent.id;
    lead.activity.push({ at: now, text: `Auto-assigned to ${agent.name}` });
  }
  if (state.settings.integrations.email) lead.activity.push({ at: now, text: `Email alert sent to ${state.settings.notifyEmail}` });
  if (state.settings.autoReply && lead.email) lead.activity.push({ at: now, text: `Auto-reply sent in ${lead.language.toUpperCase()}` });
  if (state.settings.integrations.webhook && state.settings.webhookUrl) lead.activity.push({ at: now, text: `Forwarded to webhook ${state.settings.webhookUrl}` });
  state.leads.unshift(lead);
  state.leads.length = Math.min(state.leads.length, MAX_LEADS);
  return lead;
}

// A Meta Lead Ads webhook only carries IDs; the server then fetches the form
// answers from the Graph API. Here the "fetched" answers are simulated.
const FB_PEOPLE = [
  ["Katharina Vogel", "de", "DE"], ["Liu Yang", "zh", "CN"], ["Yousef Al Amiri", "ar", "AE"],
  ["Chloe Martin", "en", "GB"], ["Supaporn Kaew", "th", "TH"], ["Ryan Mitchell", "en", "US"],
];

function facebookTestLead(state, now) {
  const [name, language, country] = FB_PEOPLE[Math.floor(Math.random() * FB_PEOPLE.length)];
  const project = state.projects.filter((p) => p.published && p.status !== "soldout")[Math.floor(Math.random() * 5)] || state.projects[0];
  const leadgenId = String(Math.floor(1e15 + Math.random() * 9e15));
  const webhook = {
    object: "page",
    entry: [{
      id: "102938475610293",
      time: Math.floor(now / 1000),
      changes: [{ field: "leadgen", value: { leadgen_id: leadgenId, page_id: "102938475610293", form_id: "778899001122", ad_id: "120210000000000001", created_time: Math.floor(now / 1000) } }],
    }],
  };
  const graph = {
    id: leadgenId,
    created_time: new Date(now).toISOString(),
    field_data: [
      { name: "full_name", values: [name] },
      { name: "email", values: [name.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com"] },
      { name: "phone_number", values: ["+44 7700 900" + Math.floor(100 + Math.random() * 899)] },
      { name: "which_project_are_you_interested_in?", values: [project.name] },
      { name: "budget", values: ["1m-3m"] },
    ],
  };
  const f = Object.fromEntries(graph.field_data.map((d) => [d.name, d.values[0]]));
  const lead = newLead(state, {
    name: f.full_name, email: f.email, phone: f.phone_number, country, language,
    projectId: project.id, budget: f.budget, type: "enquiry",
    message: "Submitted via Facebook Lead Ad form",
    utm: { source: "facebook", medium: "lead_ads", campaign: "demo-campaign" },
  }, "facebook", now);
  lead.activity.splice(1, 0, { at: now, text: `Received from Meta webhook (leadgen_id ${leadgenId})` });
  return { webhook, graph, lead };
}

function stats(state, now) {
  const day = 86400000;
  const leads = state.leads;
  const last30 = leads.filter((l) => now - l.createdAt < 30 * day);
  const prev30 = leads.filter((l) => now - l.createdAt >= 30 * day && now - l.createdAt < 60 * day);
  const count = (arr, key) => arr.reduce((m, l) => ((m[l[key] || "—"] = (m[l[key] || "—"] || 0) + 1), m), {});
  const weeks = [];
  for (let w = 11; w >= 0; w--) {
    const end = now - w * 7 * day;
    const start = end - 7 * day;
    weeks.push({ start, end, count: leads.filter((l) => l.createdAt >= start && l.createdAt < end).length });
  }
  const won = leads.filter((l) => l.stage === "won").length;
  const closed = won + leads.filter((l) => l.stage === "lost").length;
  const open = leads.filter((l) => !["won", "lost"].includes(l.stage));
  return {
    total: leads.length,
    last30: last30.length,
    prev30: prev30.length,
    newCount: leads.filter((l) => l.stage === "new").length,
    unassigned: leads.filter((l) => !l.agentId && !["won", "lost"].includes(l.stage)).length,
    winRate: closed ? Math.round((won / closed) * 100) : 0,
    pipelineValue: open.reduce((s, l) => s + (l.value || 0), 0),
    bySource: count(last30, "source"),
    byLanguage: count(last30, "language"),
    byProject: count(last30, "projectId"),
    byStage: count(leads, "stage"),
    weeks,
  };
}

function publicProject(p) {
  const { published, ...rest } = p;
  return rest;
}

function sanitizeProject(input, existing) {
  const p = existing ? clone(existing) : { id: "", gallery: [], features: [], i18n: {} };
  if (!existing) {
    const id = str(input.id || input.name, 60).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    p.id = id || "project-" + Date.now();
  }
  p.name = str(input.name, 120) || p.name || "Untitled project";
  p.categories = (Array.isArray(input.categories) ? input.categories : p.categories || []).filter((c) => CATEGORIES.includes(c));
  p.location = str(input.location, 120) || p.location || "";
  p.region = ["thailand", "bvi"].includes(input.region) ? input.region : p.region || "thailand";
  p.type = ["villa", "condo", "penthouse", "land"].includes(input.type) ? input.type : p.type || "villa";
  p.priceFrom = Math.max(0, Math.round(Number(input.priceFrom ?? p.priceFrom) || 0));
  p.beds = str(input.beds, 20) || p.beds || "";
  p.size = str(input.size, 40) || p.size || "";
  p.status = ["prelaunch", "construction", "selling", "ready", "soldout"].includes(input.status) ? input.status : p.status || "selling";
  p.completion = str(input.completion, 40);
  p.featured = Boolean(input.featured);
  p.published = Boolean(input.published);
  const url = str(input.image, 500);
  if (url && /^https:\/\//.test(url)) p.image = url;
  if (!p.gallery.length && p.image) p.gallery = [p.image];
  if (url && p.gallery[0] !== url) p.gallery = [url, ...p.gallery.filter((g) => g !== url)].slice(0, 8);
  p.mapQuery = str(input.mapQuery, 120) || p.location;
  if (Array.isArray(input.features)) p.features = input.features.map((f) => str(f, 40)).filter(Boolean).slice(0, 12);
  for (const lang of LANGS) {
    const t = input.i18n?.[lang];
    if (t) p.i18n[lang] = { tagline: str(t.tagline, 200), description: str(t.description, 2000) };
  }
  return p;
}

const ok = (body, changed = false) => ({ status: 200, body, changed });
const err = (status, message) => ({ status, body: { error: message }, changed: false });

// path is relative to the API root, e.g. "/projects" or "/leads/L1001".
export function handle(state, method, path, body = {}, key = "", now = Date.now()) {
  const parts = path.split("/").filter(Boolean);
  const admin = key === DEMO_PASSWORD;
  const [res, id] = parts;

  // ---- Public endpoints (used by the website) ----
  if (res === "projects" && method === "GET" && !id) {
    return ok({ projects: state.projects.filter((p) => p.published).map(publicProject) });
  }
  if (res === "leads" && method === "POST" && !id) {
    if (body.website) return ok({ ok: true }); // honeypot: bots fill the hidden field
    if (!str(body.name)) return err(400, "name_required");
    const email = str(body.email);
    if (!email && !str(body.phone)) return err(400, "contact_required");
    if (email && !isEmail(email)) return err(400, "email_invalid");
    if (!body.consent) return err(400, "consent_required");
    const lead = newLead(state, body, "website", now);
    return ok({ ok: true, id: lead.id }, true);
  }
  if (res === "login" && method === "POST") {
    return body.password === DEMO_PASSWORD ? ok({ ok: true, key: DEMO_PASSWORD }) : err(401, "wrong_password");
  }

  // ---- Admin endpoints ----
  if (!admin) return err(401, "unauthorized");

  if (res === "bootstrap" && method === "GET") {
    return ok({
      projects: state.projects, leads: state.leads, settings: state.settings,
      agents: state.agents, users: state.users, stages: STAGES, stats: stats(state, now),
      seededAt: state.seededAt,
    });
  }
  if (res === "stats" && method === "GET") return ok(stats(state, now));

  if (res === "leads" && id && method === "PATCH") {
    const lead = state.leads.find((l) => l.id === id);
    if (!lead) return err(404, "not_found");
    const by = str(body.by, 80) || "Admin";
    if (body.stage && STAGES.includes(body.stage) && body.stage !== lead.stage) {
      lead.activity.push({ at: now, text: `Stage changed from ${lead.stage} to ${body.stage} by ${by}` });
      lead.stage = body.stage;
    }
    if ("agentId" in body && body.agentId !== lead.agentId) {
      const agent = state.agents.find((a) => a.id === body.agentId);
      lead.agentId = agent ? agent.id : null;
      lead.activity.push({ at: now, text: agent ? `Assigned to ${agent.name}` : "Unassigned" });
    }
    if (body.value !== undefined) lead.value = Math.max(0, Math.round(Number(body.value) || 0));
    if (str(body.note)) {
      lead.notes.push({ at: now, by, text: str(body.note, 2000) });
      lead.activity.push({ at: now, text: `Note added by ${by}` });
    }
    return ok({ lead }, true);
  }
  if (res === "leads" && id && method === "DELETE") {
    const i = state.leads.findIndex((l) => l.id === id);
    if (i < 0) return err(404, "not_found");
    state.leads.splice(i, 1);
    return ok({ ok: true }, true);
  }

  if (res === "projects" && method === "POST" && !id) {
    const p = sanitizeProject(body);
    if (state.projects.some((x) => x.id === p.id)) p.id += "-" + String(now).slice(-4);
    state.projects.push(p);
    return ok({ project: p }, true);
  }
  if (res === "projects" && id && method === "PUT") {
    const i = state.projects.findIndex((p) => p.id === id);
    if (i < 0) return err(404, "not_found");
    state.projects[i] = sanitizeProject(body, state.projects[i]);
    return ok({ project: state.projects[i] }, true);
  }
  if (res === "projects" && id && method === "DELETE") {
    state.projects = state.projects.filter((p) => p.id !== id);
    return ok({ ok: true }, true);
  }

  if (res === "settings" && method === "PUT") {
    const s = state.settings;
    if (typeof body.autoAssign === "boolean") s.autoAssign = body.autoAssign;
    if (typeof body.autoReply === "boolean") s.autoReply = body.autoReply;
    for (const k of ["notifyEmail", "ga4Id", "pixelId", "whatsapp", "lineId", "webhookUrl"]) {
      if (typeof body[k] === "string") s[k] = str(body[k], 300);
    }
    if (body.integrations) {
      for (const k of Object.keys(s.integrations)) {
        if (typeof body.integrations[k] === "boolean") s.integrations[k] = body.integrations[k];
      }
    }
    return ok({ settings: s }, true);
  }

  if (res === "facebook-test" && method === "POST") {
    if (!state.settings.integrations.facebook) return err(409, "facebook_disabled");
    return ok(facebookTestLead(state, now), true);
  }

  if (res === "reset" && method === "POST") {
    Object.assign(state, createState(now));
    return ok({ ok: true }, true);
  }

  return err(404, "not_found");
}
