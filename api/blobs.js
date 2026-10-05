// Videos stored in Vercel Blob, for the admin's media library (login required).
//   GET              -> { enabled, blobs: [{ url, pathname, size, uploadedAt }] }
//   DELETE { url }   -> removes one video from Blob storage (immediately)
const { requireUser } = require("./_lib/auth");
const { send, fail, body, methods } = require("./_lib/http");

module.exports = async (req, res) => {
  if (!methods(req, res, ["GET", "DELETE"])) return;
  if (!requireUser(req, res)) return;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return send(res, 200, { enabled: false, blobs: [] });
  const { list, del } = require("@vercel/blob");
  try {
    if (req.method === "GET") {
      const blobs = []; let cursor;
      do {
        const page = await list({ prefix: "videos/", limit: 1000, cursor });
        blobs.push(...page.blobs.map((b) => ({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt })));
        cursor = page.hasMore ? page.cursor : null;
      } while (cursor && blobs.length < 5000);
      return send(res, 200, { enabled: true, blobs });
    }
    const url = String(body(req).url || "");
    let host = "";
    try { host = new URL(url).host; } catch (e) { /* invalid */ }
    if (!/\.public\.blob\.vercel-storage\.com$/.test(host)) return fail(res, 400, "That isn't a video in this site's storage.");
    await del(url);
    send(res, 200, { ok: true });
  } catch (e) {
    fail(res, 502, "Blob storage couldn't be reached. Please try again.");
  }
};
