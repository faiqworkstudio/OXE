// The website's contact form.
//   GET   -> { token, turnstile }  a signed form token (and the Turnstile site key, if switched on)
//   POST  { name, email, phone, company, services[], budget, method, details, page, utm,
//           token, turnstile, botcheck }  -> saves the enquiry as a new lead in the admin
// Public (no login), so it only ever creates, and filters bots and spam in layers:
// origin check, hidden honeypot field, signed time token, optional Turnstile, per-IP
// limits, link limits and duplicate detection.
const leads = require("./_lib/leads");
const sec = require("./_lib/security");
const { send, fail, body } = require("./_lib/http");

const burst = new Map();   // ip -> timestamps, per server instance: a first brake on floods
function tooFast(ip) {
  const now = Date.now(), list = (burst.get(ip) || []).filter((t) => now - t < 60000);
  list.push(now); burst.set(ip, list);
  if (burst.size > 5000) burst.clear();
  return list.length > 5;
}

function sameSite(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  try { return new URL(origin).host === host; } catch (e) { return false; }
}

const LINKS = /(https?:\/\/|www\.)\S+/gi;

module.exports = async (req, res) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    return send(res, 200, { token: sec.formToken(), turnstile: sec.turnstileSiteKey(), enabled: leads.configured() });
  }
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return fail(res, 405, "Method not allowed"); }
  if (!sameSite(req)) return fail(res, 403, "Forms can only be sent from this website.");
  if (!leads.configured()) return fail(res, 503, "Lead storage isn't set up.");
  const d = body(req);
  const ok = () => send(res, 200, { ok: true });
  if (d.botcheck) return ok();                              // hidden field filled in: a bot (pretend it worked)
  if (tooFast(sec.ipOf(req))) return fail(res, 429, "Too many messages. Please wait a minute, or contact us on WhatsApp.");
  const tokenProblem = sec.checkFormToken(d.token);
  if (tokenProblem === "too-fast") return ok();              // filled in faster than a person can: a bot
  if (tokenProblem) return fail(res, 400, "This form has expired. Please refresh the page and send it again.");
  if (!(await sec.checkTurnstile(d.turnstile, req))) return fail(res, 400, "Please complete the “I'm human” check and send again.");

  const email = String(d.email || "").trim();
  if (!email || !leads.isEmail(email)) return fail(res, 400, "Please enter a valid email address.");
  const message = String(d.details || d.message || "");
  if ((message.match(LINKS) || []).length > 3 || /<a\s|\[url=/i.test(message)) return fail(res, 400, "Please send fewer links in your message (3 at most).");

  const ipHash = sec.ipHash(req);
  try {
    if (ipHash) {
      const recent = await leads.rest("GET", `leads?select=email,message,created_at&ip_hash=eq.${encodeURIComponent(ipHash)}&created_at=gte.${new Date(Date.now() - 86400000).toISOString()}&order=created_at.desc&limit=20`);
      if (recent.some((r) => String(r.email).toLowerCase() === email.toLowerCase() && String(r.message || "") === message.trim())) return ok();   // same message again
      const lastHour = recent.filter((r) => Date.now() - new Date(r.created_at) < 3600000).length;
      if (lastHour >= 3 || recent.length >= 10) return fail(res, 429, "We've received several messages from you already. We'll be in touch soon, or contact us on WhatsApp.");
    }
    const utm = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "referrer"]) {
      if (d.utm && d.utm[k]) utm[k] = String(d.utm[k]).slice(0, 200);
    }
    const lead = await leads.create(
      { name: d.name, email, phone: d.phone, company: d.company, services: d.services, budget: d.budget, method: d.method, message },
      { source: "Website form", page: String(d.page || "").slice(0, 200) || null, utm, ip_hash: ipHash, activity: [leads.entry("Website", "created", "Enquiry sent from the website form")] });
    send(res, 200, { ok: true, id: lead.id });
  } catch (e) {
    fail(res, e instanceof leads.LeadError ? e.status : 502, e.message);
  }
};
