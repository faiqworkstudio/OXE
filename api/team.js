// Team: who can log in to the admin, and with which role (master admins only).
//   GET                         -> { roles, members: [{ id, email, name, role, locked, lastSignIn, created, mustChange }] }
//   POST  { email, name, role } -> add a person with a temporary password -> { member, password }
//   PATCH { id, role }          -> change a person's role ("none" removes their access)
//   PATCH { id, reset: true }   -> new temporary password (they choose their own at next login)
// Accounts live in Supabase Auth; the role is app_metadata.role. Uses the service role key.
const crypto = require("crypto");
const { requireAccess } = require("./_lib/auth");
const roles = require("./_lib/roles");
const { send, fail, body, methods } = require("./_lib/http");

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// a strong temporary password: letters, digits and symbols, never ambiguous characters
function tempPassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!#%+=?@"];
  const all = sets.join("");
  const chars = sets.map((set) => set[crypto.randomInt(set.length)]);
  while (chars.length < 16) chars.push(all[crypto.randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join("");
}

function member(u) {
  const email = String(u.email || "").toLowerCase();
  const m = u.user_metadata || {};
  return {
    id: u.id, email, name: m.name || m.full_name || "",
    role: roles.roleOf(u),
    locked: roles.allowedEmails().includes(email),     // master admin through ADMIN_EMAILS (set in Vercel)
    lastSignIn: u.last_sign_in_at || null, created: u.created_at || null,
    mustChange: !!(u.app_metadata && u.app_metadata.must_change),
  };
}

async function allMembers() {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const d = await roles.adminApi("GET", `/users?page=${page}&per_page=200`);
    const users = d.users || [];
    out.push(...users.map(member));
    if (users.length < 200) break;
  }
  return out;
}

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET", "POST", "PATCH"])) return;
  const me = await requireAccess(req, res, "team");
  if (!me) return;
  if (!roles.adminConfigured()) return fail(res, 503, "Team management needs SUPABASE_SERVICE_ROLE_KEY in Vercel (README → Setting up the admin).");
  const d = body(req);
  try {
    if (req.method === "GET") {
      const members = await allMembers();
      members.sort((a, b) => (!!b.role - !!a.role) || String(a.email).localeCompare(b.email));
      return send(res, 200, { members, roles: Object.fromEntries(Object.entries(roles.ROLES).map(([k, v]) => [k, { label: v.label, about: v.about }])) });
    }

    if (req.method === "POST") {
      const email = String(d.email || "").trim().toLowerCase();
      const role = roles.normalize(d.role);
      if (!isEmail(email)) return fail(res, 400, "Please enter a valid email address.");
      if (!role) return fail(res, 400, "Please choose a role.");
      const password = tempPassword();
      let u;
      try {
        u = await roles.adminApi("POST", "/users", {
          email, password, email_confirm: true,
          app_metadata: { role, must_change: true },
          user_metadata: d.name ? { name: String(d.name).trim().slice(0, 80) } : {},
        });
      } catch (e) {
        if (e.status === 422 || /already/i.test(e.message)) return fail(res, 409, "This email already has an account. Find it in the list and change its role instead.");
        throw e;
      }
      return send(res, 200, { member: member(u.user || u), password });
    }

    // PATCH: change role / reset password
    const id = String(d.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return fail(res, 400, "Unknown person.");
    const target = member(await roles.adminApi("GET", `/users/${id}`).then((r) => r.user || r));
    if (d.reset) {
      const password = tempPassword();
      await roles.adminApi("PUT", `/users/${id}`, { password, app_metadata: { must_change: true } });
      roles.forget(id);
      return send(res, 200, { member: Object.assign(target, { mustChange: true }), password });
    }
    const role = d.role === "none" ? null : roles.normalize(d.role);
    if (d.role !== "none" && !role) return fail(res, 400, "Unknown role.");
    // guard rails: no locking yourself out, no admin-less site
    if (id === me.id) return fail(res, 400, "You can't change your own role. Ask another master admin.");
    if (target.locked) return fail(res, 400, `${target.email} is a master admin through ADMIN_EMAILS in Vercel. Remove it there to change this.`);
    if (target.role === "owner" && role !== "owner") {
      const owners = (await allMembers()).filter((m) => m.role === "owner");
      if (owners.length <= 1) return fail(res, 400, "There must always be at least one master admin.");
    }
    await roles.adminApi("PUT", `/users/${id}`, { app_metadata: { role: role || "none" } });
    roles.forget(id);   // takes effect on their next click, not at the end of their session
    send(res, 200, { member: Object.assign(target, { role }) });
  } catch (e) {
    fail(res, e.status === 404 ? 404 : 502, e.status === 404 ? "That person doesn't exist anymore." : "Supabase couldn't be reached: " + e.message);
  }
};
