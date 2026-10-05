// Leads for the admin (login required). Changes are saved immediately, no publishing needed.
//   GET                                          all leads, newest first  { leads, configured }
//   GET    ?trash=1                              leads in "Recently deleted" (kept 30 days)
//   POST   { lead }                              add a lead by hand
//   POST   { restore }                           put back a lead that was just deleted (undo)
//   PATCH  { id, changes?, log? }                edit fields and/or add a note / activity { type, text }
//   PATCH  { id, activity_at, text }             edit a note (text: null removes it)
//   PATCH  { ids, status }                       move several leads to a status
//   POST   { undelete: ids }                     bring leads back from "Recently deleted"
//   DELETE { ids, forever? }                     move leads to "Recently deleted" (forever: remove now)
const leads = require("./_lib/leads");
const { requireAccess } = require("./_lib/auth");
const roles = require("./_lib/roles");
const { send, fail, body, methods } = require("./_lib/http");

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET", "POST", "PATCH", "DELETE"])) return;
  const user = await requireAccess(req, res, "leads");
  if (!user) return;
  const by = user.name || user.email;
  const d = body(req);
  try {
    if (req.method === "GET") {
      if (!leads.configured()) return send(res, 200, { configured: false, leads: [] });
      return send(res, 200, { configured: true, leads: await leads.list(!!(req.query && req.query.trash)) });
    }
    if (req.method === "POST") {
      if (d.undelete) return send(res, 200, { leads: await leads.undelete(d.undelete) });
      if (d.restore) {
        const r = d.restore;
        const lead = await leads.create(r, { id: r.id, created_at: r.created_at, page: r.page || null, utm: r.utm || {}, activity: Array.isArray(r.activity) ? r.activity : [] });
        return send(res, 200, { lead });
      }
      const lead = await leads.create(d.lead || {}, { source: String((d.lead && d.lead.source) || "Added by hand").slice(0, 60), activity: [leads.entry(by, "created", "Lead added in the admin")] });
      return send(res, 200, { lead });
    }
    if (req.method === "PATCH") {
      if (Array.isArray(d.ids)) return send(res, 200, { leads: await leads.bulkStatus(d.ids, d.status, by) });
      if (d.activity_at) return send(res, 200, { lead: await leads.editActivity(d.id, d.activity_at, d.text) });
      return send(res, 200, { lead: await leads.update(d.id, d.changes, d.log, by) });
    }
    if (req.method === "DELETE") {
      // deleting for good can't be undone: master admins only (others move leads to the bin)
      if (d.forever && !roles.can(user.role, "leads.purge")) return fail(res, 403, "Only a master admin can delete leads for good. Deleted leads stay in “Recently deleted” for 30 days.");
      return send(res, 200, await leads.remove(d.ids || d.id, !!d.forever));
    }
  } catch (e) {
    fail(res, e instanceof leads.LeadError ? e.status : 502, e instanceof leads.LeadError ? e.message : "The leads service couldn't be reached. Please try again.");
  }
};
