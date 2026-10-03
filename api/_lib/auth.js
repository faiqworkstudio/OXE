// Admin authentication: username + password, signed session cookie.
//
// Users come from Vercel environment variables:
//   ADMIN_USERS     one user per line or comma: username:scrypt$<salt>$<hash>
//                   (create a line with:  node scripts/admin-password.js <username>)
//   ADMIN_USERNAME + ADMIN_PASSWORD   quick start with a single user
//   SESSION_SECRET  long random string (at least 32 characters) that signs sessions
//
// Supabase later: replace verifyCredentials() with supabase.auth.signInWithPassword()
// and keep issuing the same session cookie. Nothing else in the admin needs to change.
const crypto = require("crypto");

const COOKIE = "oxe_admin";
const SESSION_HOURS = 12;
const attempts = new Map();   // ip -> { fails, lockedUntil } (per server instance)

function secret() {
  const s = process.env.SESSION_SECRET || "";
  if (s.length < 32) throw new Error("SESSION_SECRET is missing or shorter than 32 characters.");
  return s;
}

function users() {
  const list = {};
  (process.env.ADMIN_USERS || "").split(/[\n,]+/).map((l) => l.trim()).filter(Boolean).forEach((line) => {
    const i = line.indexOf(":");
    if (i > 0) list[line.slice(0, i).trim().toLowerCase()] = { name: line.slice(0, i).trim(), hash: line.slice(i + 1).trim() };
  });
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    list[process.env.ADMIN_USERNAME.trim().toLowerCase()] = { name: process.env.ADMIN_USERNAME.trim(), plain: process.env.ADMIN_PASSWORD };
  }
  return list;
}

function configured() {
  return Object.keys(users()).length > 0 && (process.env.SESSION_SECRET || "").length >= 32;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64");
  const hash = crypto.scryptSync(password, salt, 64).toString("base64");
  return `scrypt$${salt}$${hash}`;
}

function checkHash(password, stored) {
  const parts = String(stored).split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const hash = crypto.scryptSync(password, parts[1], 64).toString("base64");
  return safeEqual(hash, parts[2]);
}

// The one place that decides whether a username/password is valid.
async function verifyCredentials(username, password) {
  const u = users()[String(username || "").trim().toLowerCase()];
  if (!u || !password) {
    checkHash("x", "scrypt$c2FsdA==$x");   // spend similar time for unknown users
    return null;
  }
  const ok = u.plain !== undefined ? safeEqual(password, u.plain) : checkHash(password, u.hash);
  return ok ? { name: u.name } : null;
}

function ip(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
}

function locked(req) {
  const a = attempts.get(ip(req));
  return a && a.lockedUntil > Date.now() ? Math.ceil((a.lockedUntil - Date.now()) / 60000) : 0;
}

function recordFailure(req) {
  const key = ip(req), a = attempts.get(key) || { fails: 0, lockedUntil: 0 };
  a.fails += 1;
  if (a.fails >= 5) { a.lockedUntil = Date.now() + 10 * 60 * 1000; a.fails = 0; }
  attempts.set(key, a);
}

function clearFailures(req) { attempts.delete(ip(req)); }

function sign(data) {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

function createSession(user) {
  const payload = Buffer.from(JSON.stringify({ u: user.name, exp: Date.now() + SESSION_HOURS * 3600 * 1000 })).toString("base64url");
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
    if (!users()[String(data.u).toLowerCase()]) return null;   // user removed: session ends
    return { name: data.u, expires: data.exp };
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
  try { user = readSession(req); } catch (e) { /* missing SESSION_SECRET */ }
  if (!user) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Please log in again." }));
  }
  return user;
}

module.exports = {
  COOKIE, SESSION_HOURS, configured, verifyCredentials, hashPassword, createSession, readSession,
  setCookie, requireUser, locked, recordFailure, clearFailures,
};
