// The website's contact form posts here: the enquiry is saved as a new lead in the admin.
//   POST { name, email, phone, company, services[], budget, method, details, page, utm, botcheck }
// Public (no login), so it only ever creates, and checks origin, size, spam and rate.
const leads = require("./_lib/leads");
const { send, fail, body } = require("./_lib/http");

const hits = new Map();   // ip -> [timestamps], per server instance: a light brake on floods
function tooMany(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 8;
}

function sameSite(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  try { return new URL(origin).host === host; } catch (e) { return false; }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return fail(res, 405, "Method not allowed"); }
  if (!sameSite(req)) return fail(res, 403, "Forms can only be sent from this website.");
  if (!leads.configured()) return fail(res, 503, "Lead storage isn't set up.");
  const d = body(req);
  if (d.botcheck) return send(res, 200, { ok: true });   // hidden field filled in: a bot
  const ip = String(req.headers["x-forwarded-for"] || req.socket && req.socket.remoteAddress || "").split(",")[0].trim();
  if (tooMany(ip)) return fail(res, 429, "Too many messages. Please wait a few minutes, or contact us on WhatsApp.");
  if (!d.email || !leads.isEmail(String(d.email).trim())) return fail(res, 400, "Please enter a valid email address.");
  const utm = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "referrer"]) {
    if (d.utm && d.utm[k]) utm[k] = String(d.utm[k]).slice(0, 200);
  }
  try {
    const lead = await leads.create(
      { name: d.name, email: d.email, phone: d.phone, company: d.company, services: d.services, budget: d.budget, method: d.method, message: d.details || d.message },
      { source: "Website form", page: String(d.page || "").slice(0, 200) || null, utm, activity: [leads.entry("Website", "created", "Enquiry sent from the website form")] });
    send(res, 200, { ok: true, id: lead.id });
  } catch (e) {
    fail(res, e instanceof leads.LeadError ? e.status : 502, e.message);
  }
};
