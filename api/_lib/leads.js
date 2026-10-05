// Leads storage: the "leads" table in Supabase (see supabase/leads.sql), used through
// Supabase's REST API with the service role key. Only these server functions use the key;
// the table has Row Level Security on, so the public anon key can't read it.
//
// Vercel environment variables:
//   SUPABASE_URL               https://<project>.supabase.co (same as the login)
//   SUPABASE_SERVICE_ROLE_KEY  Supabase → Project Settings → API → service_role / secret key. Keep it secret.

const SB_URL = () => String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

const STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"];
const LABELS = { new: "New", contacted: "Contacted", qualified: "Qualified", proposal: "Proposal sent", won: "Won", lost: "Lost" };
const TEXT = { name: 120, email: 160, phone: 40, company: 120, budget: 60, method: 20, message: 5000, source: 60, page: 200 };
const EDITABLE = ["name", "email", "phone", "company", "services", "budget", "method", "message", "status", "value", "follow_up", "source"];

class LeadError extends Error {
  constructor(message, status) { super(message); this.status = status || 400; }
}

function configured() { return !!(SB_URL() && KEY()); }

async function rest(method, path, body, prefer) {
  if (!configured()) throw new LeadError("Leads aren't connected yet: add SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables, run supabase/leads.sql, then redeploy.", 503);
  const headers = { apikey: KEY(), "Content-Type": "application/json" };
  // legacy service_role keys are JWTs and go in Authorization too; new sb_secret_ keys only in apikey
  if (/^eyJ/.test(KEY())) headers.Authorization = `Bearer ${KEY()}`;
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(`${SB_URL()}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!r.ok) {
    const msg = data && (data.message || data.hint) || `Supabase error ${r.status}`;
    if (/relation .*leads.* does not exist|Could not find the table/i.test(msg)) throw new LeadError("The leads table doesn't exist yet: run supabase/leads.sql in Supabase → SQL Editor.", 503);
    throw new LeadError(msg, r.status >= 500 ? 502 : 400);
  }
  return data;
}

const str = (v, max) => (v == null ? null : String(v).trim().slice(0, max) || null);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isUUID = (v) => /^[0-9a-f-]{36}$/i.test(String(v || ""));

// Clean user input into table columns (only known fields, trimmed and length-limited).
function clean(input, partial) {
  const out = {};
  for (const k of EDITABLE) {
    if (!(k in input)) continue;
    const v = input[k];
    if (k === "services") out.services = (Array.isArray(v) ? v : v ? [v] : []).map((s) => String(s).trim().slice(0, 80)).filter(Boolean).slice(0, 12);
    else if (k === "status") { if (!STATUSES.includes(v)) throw new LeadError("Unknown status."); out.status = v; }
    else if (k === "value") { const n = v === "" || v == null ? null : Number(String(v).replace(/[^\d.]/g, "")); out.value = Number.isFinite(n) ? n : null; }
    else if (k === "follow_up") { if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new LeadError("Follow-up must be a date."); out.follow_up = v || null; }
    else out[k] = str(v, TEXT[k]);
  }
  if (!partial || "name" in out) { if (!out.name) throw new LeadError("Please enter a name."); }
  if (out.email && !isEmail(out.email)) throw new LeadError("That email address doesn't look right.");
  return out;
}

function entry(by, type, text) {
  return { at: new Date().toISOString(), by: by || "Website", type, text: String(text || "").slice(0, 2000) };
}

async function list() {
  return rest("GET", "leads?select=*&order=created_at.desc&limit=5000");
}

async function get(id) {
  if (!isUUID(id)) throw new LeadError("Unknown lead.", 404);
  const rows = await rest("GET", `leads?id=eq.${id}&select=*`);
  if (!rows || !rows.length) throw new LeadError("This lead doesn't exist anymore.", 404);
  return rows[0];
}

// New lead. `extra` holds server-set fields (source, page, utm, activity, or the original id when undoing a delete).
async function create(input, extra) {
  const row = Object.assign({ status: "new" }, clean(input), extra || {});
  const rows = await rest("POST", "leads", row, "return=representation");
  return rows[0];
}

// Change fields and/or add an activity entry ({type, text}) in one go.
async function update(id, changes, log, by) {
  const current = await get(id);
  const row = clean(changes || {}, true);
  if (log && log.text) row.activity = (Array.isArray(current.activity) ? current.activity : []).concat(entry(by, log.type || "note", log.text)).slice(-500);
  if (!Object.keys(row).length) return current;
  const rows = await rest("PATCH", `leads?id=eq.${id}`, row, "return=representation");
  return rows[0];
}

// Edit or remove one activity entry (notes), matched by its timestamp.
async function editActivity(id, at, text) {
  const current = await get(id);
  const activity = (current.activity || []).map((a) => (a.at === at ? (text == null ? null : Object.assign({}, a, { text: String(text).slice(0, 2000), edited: new Date().toISOString() })) : a)).filter(Boolean);
  const rows = await rest("PATCH", `leads?id=eq.${id}`, { activity }, "return=representation");
  return rows[0];
}

async function remove(ids) {
  ids = (Array.isArray(ids) ? ids : [ids]).filter(isUUID);
  if (!ids.length) throw new LeadError("Nothing to delete.");
  await rest("DELETE", `leads?id=in.(${ids.join(",")})`);
  return ids.length;
}

async function bulkStatus(ids, status, by) {
  if (!STATUSES.includes(status)) throw new LeadError("Unknown status.");
  const out = [];
  for (const id of (ids || []).filter(isUUID)) {
    const cur = await get(id);
    if (cur.status === status) { out.push(cur); continue; }
    out.push(await update(id, { status }, { type: "status", text: `Status: ${LABELS[cur.status] || cur.status} → ${LABELS[status]}` }, by));
  }
  return out;
}

module.exports = { STATUSES, LeadError, configured, clean, entry, list, get, create, update, editActivity, remove, bulkStatus, isEmail };
