// Admin authentication with Supabase Auth.
//
// Supabase checks the email + password (password hashing, rate limits, password
// reset emails). When it confirms the user and the user is an admin, the site issues
// its own signed, HttpOnly session cookie for 12 hours.
//
// Vercel environment variables:
//   SUPABASE_URL       https://<project>.supabase.co
//   SUPABASE_ANON_KEY  the project's anon / publishable key (Supabase → Project Settings → API)
//   SESSION_SECRET     long random string (at least 32 characters) that signs sessions
//   ADMIN_EMAILS       optional: comma-separated emails allowed into the admin.
//                      Users whose app_metadata.role is "admin" are always allowed.
const crypto = require("crypto");

const COOKIE = "oxe_admin";
const SESSION_HOURS = 12;

const SB_URL = () => String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SB_KEY = () => process.env.SUPABASE_ANON_KEY || "";

function secret() {
  const s = process.env.SESSION_SECRET || "";
  if (s.length < 32) throw new Error("SESSION_SECRET is missing or shorter than 32 characters.");
  return s;
}

function configured() {
  return !!(SB_URL() && SB_KEY() && (process.env.SESSION_SECRET || "").length >= 32);
}

function allowedEmails() {
  // tolerant of spaces, semicolons and quotes pasted into Vercel
  return String(process.env.ADMIN_EMAILS || "").split(/[,;\s]+/).map((e) => e.replace(/["'<>]/g, "").trim().toLowerCase()).filter(Boolean);
}

function isAdmin(user) {
  if (!user) return false;
  const m = user.app_metadata || {};
  if (String(m.role || "").toLowerCase() === "admin" || m.admin === true || (Array.isArray(m.roles) && m.roles.includes("admin"))) return true;
  return allowedEmails().includes(String(user.email || "").toLowerCase());
}

async function supabase(method, path, body, token) {
  const r = await fetch(`${SB_URL()}/auth/v1${path}`, {
    method,
    headers: Object.assign({ apikey: SB_KEY(), "Content-Type": "application/json" }, token ? { Authorization: `Bearer ${token}` } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok, data };
}

class AuthError extends Error {
  constructor(message, status) { super(message); this.status = status || 401; }
}

function displayName(user) {
  const m = user.user_metadata || {};
  return m.name || m.full_name || String(user.email || "admin").split("@")[0];
}

// Email + password -> admin user, or an AuthError explaining why not.
async function verifyCredentials(email, password) {
  if (!email || !password) throw new AuthError("Please enter your email and password.", 400);
  const r = await supabase("POST", "/token?grant_type=password", { email: String(email).trim(), password: String(password) });
  if (r.status === 429) throw new AuthError("Too many attempts. Please wait a few minutes and try again.", 429);
  if (!r.ok || !r.data.user) {
    const msg = String(r.data.error_description || r.data.msg || r.data.message || "");
    if (/confirm/i.test(msg)) throw new AuthError("Please confirm your email address first (check your inbox).", 401);
    throw new AuthError("That email and password don't match.", 401);
  }
  if (!isAdmin(r.data.user)) throw new AuthError(`The password is right, but ${r.data.user.email} isn't an admin yet. Add this email to ADMIN_EMAILS in Vercel (then redeploy), or give it the admin role in Supabase (see the README, “Create the admin accounts”).`, 403);
  // the short-lived Supabase token is only kept in memory, for "change password"
  return { id: r.data.user.id, email: r.data.user.email, name: displayName(r.data.user), token: r.data.access_token };
}

// "Forgot password": Supabase emails a reset link that returns to /admin.
async function sendReset(email, redirectTo) {
  if (!email) throw new AuthError("Please enter your email.", 400);
  const r = await supabase("POST", `/recover?redirect_to=${encodeURIComponent(redirectTo)}`, { email: String(email).trim() });
  if (r.status === 429) throw new AuthError("Too many requests. Please wait a few minutes and try again.", 429);
  // Always answer the same way, so the form doesn't reveal which emails exist.
}

// Has this password appeared in a known data breach? Uses Have I Been Pwned's k-anonymity
// API: only the first 5 characters of the password's SHA-1 hash leave the server, never the
// password. If the service can't be reached, the check is skipped (Supabase's own rules still apply).
async function breached(password) {
  try {
    const hash = crypto.createHash("sha1").update(String(password)).digest("hex").toUpperCase();
    const r = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, { headers: { "Add-Padding": "true" } });
    if (!r.ok) return false;
    const rest = hash.slice(5);
    return (await r.text()).split("\n").some((line) => { const [suffix, n] = line.trim().split(":"); return suffix === rest && Number(n) > 0; });
  } catch (e) {
    return false;
  }
}

function strongEnough(password) {
  const p = String(password || "");
  if (p.length < 12) return "Please choose a password with at least 12 characters.";
  if (!/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/\d/.test(p) || !/[^A-Za-z0-9]/.test(p)) return "Please use lowercase and uppercase letters, a number and a symbol.";
  return null;
}

// The reset link signs the user in for a moment; use that to set the new password.
async function resetPassword(accessToken, password) {
  if (!accessToken) throw new AuthError("This reset link is invalid or has expired. Request a new one.", 400);
  return setPassword(accessToken, password, "This reset link is invalid or has expired. Request a new one.");
}

// Set a new password with a Supabase user token (from a reset link, or a fresh login),
// after the strength and data-breach checks. Works on every Supabase plan.
async function setPassword(accessToken, password, failMessage) {
  const weak = strongEnough(password);
  if (weak) throw new AuthError(weak, 400);
  if (await breached(password)) throw new AuthError("This password has appeared in a known data breach, so it isn't safe. Please choose a different one.", 400);
  const r = await supabase("PUT", "/user", { password: String(password) }, accessToken);
  if (!r.ok) throw new AuthError(r.data.msg || r.data.message || failMessage || "The password couldn't be changed. Please try again.", 400);
  return { email: r.data.email };
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function sign(data) {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

function createSession(user) {
  const payload = Buffer.from(JSON.stringify({ u: user.name, e: user.email, id: user.id, w: user.weak ? 1 : 0, exp: Date.now() + SESSION_HOURS * 3600 * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readSession(req) {
  const m = (req.headers.cookie || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]+)"));
  if (!m) return null;
  const [payload, sig] = m[1].split(".");
  if (!payload || !sig) return null;
  try {
    if (!safeEqual(sig, sign(payload))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return { name: data.u, email: data.e, id: data.id, weak: !!data.w, expires: data.exp };
  } catch (e) {
    return null;
  }
}

function secure(req) {
  const proto = req.headers["x-forwarded-proto"];
  return proto ? proto === "https" : !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || "");
}

function setCookie(req, res, value, maxAge) {
  res.setHeader("Set-Cookie", `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure(req) ? "; Secure" : ""}`);
}

// For API handlers: returns the user, or answers 401 and returns null.
function requireUser(req, res) {
  let user = null;
  try { user = readSession(req); } catch (e) { /* SESSION_SECRET missing */ }
  if (!user) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Please log in again." }));
    return null;
  }
  if (user.weak) {   // a breached or too-simple password: nothing works until it's changed
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Please change your password first.", code: "weak_password" }));
    return null;
  }
  return user;
}

module.exports = {
  COOKIE, SESSION_HOURS, AuthError, configured, verifyCredentials, sendReset, resetPassword,
  createSession, readSession, setCookie, requireUser, setPassword, strongEnough, breached,
};
