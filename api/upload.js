// Large files (videos over 3.3 MB) go straight from the browser to Vercel Blob storage.
// Enable it once: Vercel → Storage → Create → Blob → connect to this project
// (this adds BLOB_READ_WRITE_TOKEN). Only logged-in admins can get an upload token.
const auth = require("./_lib/auth");
const { send, fail, body } = require("./_lib/http");

module.exports = async (req, res) => {
  if (req.method === "GET") return send(res, 200, { enabled: !!process.env.BLOB_READ_WRITE_TOKEN });
  if (req.method !== "POST") return fail(res, 405, "Method not allowed");
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fail(res, 503, "Large uploads need Vercel Blob storage: Vercel → Storage → Create → Blob, connect it to this project, then redeploy.");
  const data = body(req);
  if (data.type === "blob.generate-client-token" && !auth.requireUser(req, res)) return;
  try {
    const { handleUpload } = require("@vercel/blob/client");
    const result = await handleUpload({
      body: data,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["video/mp4", "video/webm", "image/jpeg", "image/png", "image/webp", "image/gif"],
        maximumSizeInBytes: 300 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    send(res, 200, result);
  } catch (e) {
    fail(res, 400, e.message);
  }
};
