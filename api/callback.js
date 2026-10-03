// GitHub login for the admin panel (Decap CMS) on Vercel — step 2 of 2.
// Exchanges GitHub's code for a token and hands it to the admin window that
// opened the login popup, using Decap's postMessage handshake. The token is
// only sent to this site's own origin (plus OAUTH_ALLOWED_ORIGINS, if set).

function page(status, payload, allowed) {
  const msg = JSON.stringify(`authorization:github:${status}:${JSON.stringify(payload)}`).replace(/</g, "\\u003c");
  const origins = JSON.stringify(allowed).replace(/</g, "\\u003c");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Signing in…</title></head>
<body style="font:16px system-ui;padding:32px;color:#0f2b50">Signing in to the OXE website editor…
<script>
(function () {
  var allowed = ${origins};
  function receive(e) {
    if (allowed.indexOf(e.origin) === -1) return;
    window.removeEventListener("message", receive, false);
    window.opener.postMessage(${msg}, e.origin);
  }
  if (!window.opener) { document.body.textContent = "Please start the login from the website editor (/admin)."; return; }
  window.addEventListener("message", receive, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`;
}

function cookie(req, name) {
  const m = (req.headers.cookie || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

module.exports = async (req, res) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const allowed = [`https://${host}`].concat((process.env.OAUTH_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean));
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Set-Cookie", "oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0");

  const { code, state, error } = req.query || {};
  if (error || !code) return res.end(page("error", { message: error || "Login was cancelled." }, allowed));
  if (!state || state !== cookie(req, "oauth_state")) {
    return res.end(page("error", { message: "Login expired or was not started here. Please try again." }, allowed));
  }
  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `https://${host}/api/callback`,
      }),
    });
    const data = await r.json();
    if (!data.access_token) {
      return res.end(page("error", { message: data.error_description || "GitHub did not return a token." }, allowed));
    }
    res.end(page("success", { token: data.access_token, provider: "github" }, allowed));
  } catch (e) {
    res.end(page("error", { message: "Could not reach GitHub. Please try again." }, allowed));
  }
};
