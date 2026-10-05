// Admin login with Supabase.
//   GET     who is logged in (401 + { configured } when not)
//   POST    { email, password }                     log in
//   POST    { action: "recover", email }            email a password-reset link
//   POST    { action: "reset", access_token, password }  set a new password from that link
//   DELETE  log out
const auth = require("./_lib/auth");
const sec = require("./_lib/security");
const { send, fail, body, methods } = require("./_lib/http");

const NOT_SET_UP = "The admin login isn't set up yet: add SUPABASE_URL, SUPABASE_ANON_KEY and SESSION_SECRET in Vercel → Settings → Environment Variables, then redeploy.";

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET", "POST", "DELETE"])) return;
  if (req.method === "GET") {
    let user = null;
    try { user = auth.readSession(req); } catch (e) { /* not configured */ }
    return user ? send(res, 200, { user: user.name, email: user.email, expires: user.expires }) : send(res, 401, { configured: auth.configured() });
  }
  if (req.method === "DELETE") {
    auth.setCookie(req, res, "", 0);
    return send(res, 200, { ok: true });
  }
  if (!auth.configured()) return fail(res, 503, NOT_SET_UP);
  const data = body(req);
  const ip = "ip:" + (sec.ipHash(req) || sec.ipOf(req));
  const email = "email:" + String(data.email || data.username || "").trim().toLowerCase().slice(0, 160);
  try {
    if (data.action === "recover") {
      // reset emails: at most 3 per email and 10 per IP an hour
      if (await sec.limited("recover", [[email, 3], [ip, 10]], 60)) return fail(res, 429, "Too many reset requests. Please wait an hour and try again.");
      await sec.record("recover", [email, ip]);
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const proto = req.headers["x-forwarded-proto"] || (/^localhost|^127\./.test(host) ? "http" : "https");
      await auth.sendReset(data.email, `${proto}://${host}/admin`);
      return send(res, 200, { ok: true, message: "If that email has an admin account, a reset link is on its way." });
    }
    if (data.action === "reset") {
      if (await sec.limited("reset_fail", [[ip, 10]], 60)) return fail(res, 429, "Too many attempts. Please wait an hour and try again.");
      try { await auth.resetPassword(data.access_token, data.password); }
      catch (e) { if (e instanceof auth.AuthError && e.status === 400) await sec.record("reset_fail", [ip]); throw e; }
      return send(res, 200, { ok: true, message: "Your password has been changed. You can log in now." });
    }
    // password guessing: lock an email after 5 wrong passwords, and an IP after 20, for 15 minutes
    if (await sec.limited("login_fail", [[email, 5], [ip, 20]], 15)) {
      await new Promise((r) => setTimeout(r, 500));
      return fail(res, 429, "Too many wrong attempts. For your security, logging in to this account is paused for 15 minutes. Please try again later, or reset your password.");
    }
    let user;
    try { user = await auth.verifyCredentials(data.email || data.username, data.password); }
    catch (e) { if (e instanceof auth.AuthError && (e.status === 401 || e.status === 403)) await sec.record("login_fail", [email, ip]); throw e; }
    auth.setCookie(req, res, auth.createSession(user), auth.SESSION_HOURS * 3600);
    send(res, 200, { user: user.name, email: user.email });
  } catch (e) {
    if (e instanceof auth.AuthError) {
      if (e.status === 401) await new Promise((r) => setTimeout(r, 300));
      return fail(res, e.status, e.message);
    }
    fail(res, 502, "The login service couldn't be reached. Please try again.");
  }
};
