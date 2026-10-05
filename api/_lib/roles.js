// Admin roles and what each one may do. The server checks these on every request; the admin
// app only hides what a role can't use.
//
// A person's role is stored in Supabase (auth user → app_metadata.role) and managed by a master
// admin in Admin → Team. Emails listed in ADMIN_EMAILS are always master admins.
const ROLES = {
  owner: {
    label: "Master admin",
    about: "Everything: all pages and settings, leads, and the team (who can log in, and their roles).",
    perms: ["site.read", "site.edit", "site.settings", "media.delete", "leads", "leads.purge", "team"],
  },
  developer: {
    label: "Developer",
    about: "All website content, media and site-wide settings (menu, footer, contact details, brand images, form options). No leads, no team.",
    perms: ["site.read", "site.edit", "site.settings", "media.delete"],
  },
  editor: {
    label: "Website editor",
    about: "Pages, blog articles, portfolio projects, client logos and media. Not the menu, footer or site settings. No leads.",
    perms: ["site.read", "site.edit", "media.delete"],
  },
  leads: {
    label: "Lead manager",
    about: "Only the Leads workspace: view, contact, update and delete leads (deleted leads stay restorable). Can't change the website.",
    perms: ["site.read", "leads"],
  },
};
const ROLE_NAMES = Object.keys(ROLES);
const ALIASES = { admin: "owner", master: "owner", "master admin": "owner", superadmin: "owner", dev: "developer", "website editor": "editor", content: "editor", "lead manager": "leads", sales: "leads" };

// files only roles with "site.settings" may change (site-wide: menu, footer, contact details, keys)
const SETTINGS_FILES = /^content\/(site|settings)\.yml$/;

function allowedEmails() {
  // tolerant of spaces, semicolons and quotes pasted into Vercel
  return String(process.env.ADMIN_EMAILS || "").split(/[,;\s]+/).map((e) => e.replace(/["'<>]/g, "").trim().toLowerCase()).filter(Boolean);
}

function normalize(r) {
  const v = String(r || "").trim().toLowerCase();
  return ROLES[v] ? v : ALIASES[v] || null;
}

// Supabase user -> role name, or null (no admin access)
function roleOf(user) {
  if (!user) return null;
  if (allowedEmails().includes(String(user.email || "").toLowerCase())) return "owner";
  const m = user.app_metadata || {};
  if (m.admin === true) return "owner";
  return normalize(m.role) || (Array.isArray(m.roles) ? m.roles.map(normalize).find(Boolean) || null : null);
}

const can = (role, perm) => !!(role && ROLES[role] && ROLES[role].perms.includes(perm));
const permsOf = (role) => (ROLES[role] ? ROLES[role].perms.slice() : []);

// ---- Supabase Auth admin API (service role key; server only)
const SB_URL = () => String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
const adminConfigured = () => !!(SB_URL() && SERVICE_KEY());

async function adminApi(method, path, body) {
  const headers = { apikey: SERVICE_KEY(), "Content-Type": "application/json" };
  if (/^eyJ/.test(SERVICE_KEY())) headers.Authorization = `Bearer ${SERVICE_KEY()}`;
  const r = await fetch(`${SB_URL()}/auth/v1/admin${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10000) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(data.msg || data.message || data.error_description || `Supabase error ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return data;
}

// Current role of a logged-in user, re-read from Supabase at most once a minute, so removing
// someone or changing their role takes effect within a minute (not at the end of their session).
const cache = new Map();
async function freshRole(id, fallback) {
  if (!id || !adminConfigured()) return fallback;
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < 60000) return hit.role;
  try {
    const u = await adminApi("GET", `/users/${encodeURIComponent(id)}`);
    const role = roleOf(u.user || u);
    cache.set(id, { role, at: Date.now() });
    if (cache.size > 500) cache.clear();
    return role;
  } catch (e) {
    if (e.status === 404) { cache.set(id, { role: null, at: Date.now() }); return null; }   // account deleted
    return fallback;   // Supabase unreachable: keep the session's role rather than lock everyone out
  }
}
const forget = (id) => cache.delete(id);

module.exports = { ROLES, ROLE_NAMES, SETTINGS_FILES, allowedEmails, normalize, roleOf, can, permsOf, adminApi, adminConfigured, freshRole, forget };
