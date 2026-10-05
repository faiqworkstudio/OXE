// Protection against bots, spam and password guessing, shared by the API functions.
//
//   - Form tokens: the contact form must first ask /api/lead for a signed token, and can
//     only be sent between 3 seconds and 12 hours later (bots post instantly, or replay).
//   - Cloudflare Turnstile (optional): a free, mostly invisible "are you human" check.
//     The site key (public) is below; set TURNSTILE_SECRET_KEY in Vercel to switch it on.
//   - Throttling: failed logins and reset requests are counted per email and per IP
//     (in Supabase's security_events table, so it holds across all server instances).
// IP addresses are never stored: only a keyed hash, so they can be compared but not read.
const crypto = require("crypto");

const SECRET = () => process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

function ipOf(req) {
  return String(req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || (req.socket && req.socket.remoteAddress) || "").split(",")[0].trim();
}
function ipHash(req) {
  if (!SECRET()) return null;
  return crypto.createHmac("sha256", SECRET()).update("ip:" + ipOf(req)).digest("base64url").slice(0, 22);
}

// ---- signed form tokens
const MIN_MS = 3000, MAX_MS = 12 * 3600 * 1000;
function sign(data) { return crypto.createHmac("sha256", SECRET()).update("form:" + data).digest("base64url"); }
function formToken() {
  if (!SECRET()) return null;
  const t = Date.now().toString(36) + "." + crypto.randomBytes(6).toString("base64url");
  return `${t}.${sign(t)}`;
}
// returns null when fine, or a reason
function checkFormToken(token) {
  if (!SECRET()) return null;
  const m = String(token || "").match(/^([0-9a-z]+\.[\w-]+)\.([\w-]+)$/);
  if (!m) return "missing";
  const want = sign(m[1]);
  if (want.length !== m[2].length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(m[2]))) return "invalid";
  const age = Date.now() - parseInt(m[1].split(".")[0], 36);
  if (age < MIN_MS) return "too-fast";
  if (age > MAX_MS) return "expired";
  return null;
}

// ---- Cloudflare Turnstile
// The widget's site key is public by design (browsers use it). TURNSTILE_SITE_KEY overrides it,
// e.g. with Cloudflare's test key 1x00000000000000000000AA for local testing.
const SITE_KEY = "0x4AAAAAAFOAs13rqrJZF0b9";
const TURNSTILE_ACTION = "contact";   // must match `action` in assets/js/main.js
// The secret: TURNSTILE_SECRET (Cloudflare's name) or TURNSTILE_SECRET_KEY (earlier README name).
const turnstileSecret = () => process.env.TURNSTILE_SECRET || process.env.TURNSTILE_SECRET_KEY || "";
const turnstileSiteKey = () => (turnstileSecret() ? process.env.TURNSTILE_SITE_KEY || SITE_KEY : null);
// Frontend hostnames this deployment accepts tokens from. Production default: the live domains.
// Set TURNSTILE_HOSTNAMES (comma-separated) to change it; never put localhost in production.
const expectedHostnames = () => new Set(String(process.env.TURNSTILE_HOSTNAMES || "oxemarketingth.com,www.oxemarketingth.com")
  .split(",").map((x) => x.trim().toLowerCase()).filter(Boolean));

// Canonical server-side siteverify. Returns { ok: true } or { ok: false, reason }:
//   "missing"  no / malformed token        "rejected"  Cloudflare said no (or wrong action / site)
//   "unavailable"  Cloudflare couldn't be reached: refused (fail closed); the form then hands the
//                  message to email / WhatsApp instead, so the visitor isn't stuck.
async function checkTurnstile(token, req) {
  const secret = turnstileSecret();
  if (!secret) return { ok: true, off: true };     // not switched on
  const hosts = expectedHostnames();
  if (typeof token !== "string" || token.length === 0 || token.length > 2048 || hosts.size === 0) return { ok: false, reason: "missing" };
  let result;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10000),
      body: new URLSearchParams({ secret, response: token, remoteip: ipOf(req) }),
    });
    if (!r.ok) throw new Error(`siteverify ${r.status}`);
    result = await r.json();
  } catch (e) {
    console.warn("Turnstile siteverify unavailable:", e.message);
    return { ok: false, reason: "unavailable" };
  }
  if (!result.success || result.action !== TURNSTILE_ACTION || !hosts.has(String(result.hostname || "").toLowerCase())) {
    console.warn("Turnstile rejected:", (result["error-codes"] || []).join(", ") || `action=${result.action} hostname=${result.hostname}`);
    return { ok: false, reason: "rejected" };
  }
  return { ok: true };   // tokens are single-use: replaying this one is rejected by Cloudflare
}

// ---- throttling (Supabase table, with an in-memory fallback)
const memory = new Map();
function db() { try { const l = require("./leads"); return l.configured() ? l : null; } catch (e) { return null; } }
async function count(kind, key, minutes) {
  const since = Date.now() - minutes * 60000;
  const d = db();
  if (d) {
    try {
      const rows = await d.rest("GET", `security_events?select=id&kind=eq.${encodeURIComponent(kind)}&key=eq.${encodeURIComponent(key)}&at=gte.${new Date(since).toISOString()}&limit=100`);
      return rows.length;
    } catch (e) { /* table missing: fall back to memory */ }
  }
  return (memory.get(kind + "|" + key) || []).filter((t) => t >= since).length;
}
async function record(kind, keys) {
  const now = Date.now();
  keys.filter(Boolean).forEach((key) => {
    const k = kind + "|" + key, list = (memory.get(k) || []).filter((t) => now - t < 86400000);
    list.push(now); memory.set(k, list);
  });
  if (memory.size > 10000) memory.clear();
  const d = db();
  if (!d) return;
  try {
    await d.rest("POST", "security_events", keys.filter(Boolean).map((key) => ({ kind, key })), "return=minimal");
    if (Math.random() < 0.05) await d.rest("DELETE", `security_events?at=lt.${new Date(now - 2 * 86400000).toISOString()}`);
  } catch (e) { /* memory still counts */ }
}
// true when any key has reached its limit: [[key, limit], …] within `minutes`
async function limited(kind, checks, minutes) {
  for (const [key, max] of checks) {
    if (key && (await count(kind, key, minutes)) >= max) return true;
  }
  return false;
}

module.exports = { ipOf, ipHash, formToken, checkFormToken, turnstileSiteKey, checkTurnstile, record, limited };
