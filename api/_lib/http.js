// Small helpers shared by the admin API functions (files starting with _ are not routes on Vercel).

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function fail(res, status, message, extra) {
  send(res, status, Object.assign({ error: message }, extra || {}));
}

// Vercel parses JSON bodies into req.body; the local dev server does the same.
function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body) {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
}

// Requests that change something must come from the admin app itself:
// same-origin (Origin header) and a custom header that cross-site forms cannot set.
function sameOrigin(req) {
  if (req.method === "GET" || req.method === "HEAD") return true;
  if (req.headers["x-oxe-admin"] !== "1") return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  try { return new URL(origin).host === host; } catch (e) { return false; }
}

function methods(req, res, allowed) {
  if (allowed.indexOf(req.method) === -1) {
    res.setHeader("Allow", allowed.join(", "));
    fail(res, 405, "Method not allowed");
    return false;
  }
  if (!sameOrigin(req)) {
    fail(res, 403, "Request blocked: it did not come from the admin app.");
    return false;
  }
  return true;
}

module.exports = { send, fail, body, methods };
