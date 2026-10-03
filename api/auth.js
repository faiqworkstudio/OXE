// GitHub login for the admin panel (Decap CMS) on Vercel — step 1 of 2.
// Opens GitHub's sign-in page. Needs the Vercel environment variables
// GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (from a GitHub OAuth app whose
// callback URL is https://<your domain>/api/callback).
const crypto = require("crypto");

module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Admin login is not set up yet: add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Vercel → Settings → Environment Variables.");
  }
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const state = crypto.randomBytes(16).toString("hex");
  const scope = (req.query && req.query.scope) || "repo,user";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `https://${host}/api/callback`,
    scope,
    state,
  });
  // the state cookie protects the callback against forged requests
  res.setHeader("Set-Cookie", `oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.statusCode = 302;
  res.setHeader("Location", `https://github.com/login/oauth/authorize?${params}`);
  res.end();
};
