// Import photos and videos from Google Drive into the website (login required).
//   POST { action: "list", url }  a shared Drive folder -> its photos and videos (needs GOOGLE_API_KEY)
//   POST { url | id }              one shared Drive file ->
//        photo: resized on the server (max 2000 px, WebP) and returned to the admin, which adds it
//               to the media library like any upload (stored with the website files)
//        video: copied straight into Vercel Blob storage -> { kind: "video", url }
//               (a small video can come back to the admin instead when Blob isn't connected)
// Files must be shared as "Anyone with the link". The website never loads anything from Drive:
// Drive isn't built for serving websites (limits, slow, breaks if a file is moved).
const { requireAccess } = require("./_lib/auth");
const { send, fail, body, methods } = require("./_lib/http");

const MAX_IMAGE = 60 * 1024 * 1024;     // original photo size we accept
const MAX_VIDEO = 300 * 1024 * 1024;    // longer videos belong on YouTube / Vimeo
const INLINE_VIDEO = 3.2 * 1024 * 1024; // small enough to keep with the website files (and fit a response)
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|tiff?|heic|heif|svg)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv)$/i;

class DriveError extends Error { constructor(m, s) { super(m); this.status = s || 400; } }

function fileId(input) {
  const s = String(input || "").trim();
  if (/^[\w-]{20,}$/.test(s)) return s;
  const m = s.match(/\/(?:file\/)?d\/([\w-]{20,})/) || s.match(/[?&]id=([\w-]{20,})/);
  return m ? m[1] : null;
}
const folderId = (input) => { const m = String(input || "").match(/\/folders\/([\w-]{20,})/); return m ? m[1] : null; };
const slug = (t) => String(t || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "drive-file";

function fileName(res) {
  const cd = res.headers.get("content-disposition") || "";
  const star = cd.match(/filename\*=UTF-8''([^;]+)/i);
  if (star) { try { return decodeURIComponent(star[1]); } catch (e) { /* fall through */ } }
  const plain = cd.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : "";
}

async function download(id) {
  const r = await fetch(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`, { redirect: "follow" });
  const type = (r.headers.get("content-type") || "").toLowerCase();
  if (!r.ok || type.includes("text/html")) {
    throw new DriveError(r.status === 404 ? "That Drive file wasn't found. Check the link." :
      "Couldn't open that Drive file. In Google Drive, set Share → General access to “Anyone with the link”, then try again.");
  }
  const name = fileName(r) || id;
  const size = Number(r.headers.get("content-length")) || 0;
  const kind = type.startsWith("video/") || VIDEO_EXT.test(name) ? "video" : type.startsWith("image/") || IMAGE_EXT.test(name) ? "image" : null;
  if (!kind) { try { r.body && r.body.cancel(); } catch (e) { /* ignore */ } throw new DriveError(`“${name}” isn't a photo or video.`); }
  return { r, name, size, type, kind };
}

async function readAll(r, max) {
  const chunks = []; let total = 0;
  for await (const c of r.body) {
    total += c.length;
    if (total > max) throw new DriveError("This file is too large to import.");
    chunks.push(Buffer.from(c));
  }
  return Buffer.concat(chunks);
}

async function importImage(f) {
  if (f.size > MAX_IMAGE) throw new DriveError(`“${f.name}” is ${Math.round(f.size / 1048576)} MB. Photos up to 60 MB can be imported.`);
  const buf = await readAll(f.r, MAX_IMAGE);
  const stem = slug(f.name.replace(/\.[^.]+$/, ""));
  if (/svg/.test(f.type) || /\.svg$/i.test(f.name)) return { kind: "image", name: stem + ".svg", type: "image/svg+xml", data: buf.toString("base64") };
  let sharp;
  try { sharp = require("sharp"); } catch (e) { throw new DriveError("Photo processing isn't available on this server.", 500); }
  try {
    // rotate() applies the camera's orientation; 2000 px is plenty for the site and keeps files small
    let quality = 90, out;
    do {
      out = await sharp(buf, { failOn: "none" }).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality }).toBuffer();
      quality -= 12;
    } while (out.length > 3 * 1024 * 1024 && quality > 40);
    return { kind: "image", name: stem + ".webp", type: "image/webp", data: out.toString("base64") };
  } catch (e) {
    throw new DriveError(/heif|heic/i.test(f.name + e.message) ? `“${f.name}” is an iPhone HEIC photo. Please save it as JPG first (or set the iPhone camera to “Most Compatible”).` : `“${f.name}” couldn't be read as a photo.`);
  }
}

async function importVideo(f) {
  if (!/\.(mp4|webm|m4v)$/i.test(f.name) && !/mp4|webm/.test(f.type)) throw new DriveError(`“${f.name}” isn't an MP4 video. Please export it as MP4 (H.264) so it plays in every browser.`);
  if (f.size > MAX_VIDEO) throw new DriveError(`“${f.name}” is ${Math.round(f.size / 1048576)} MB. Videos up to 300 MB can be imported; put longer videos on YouTube or Vimeo.`);
  const stem = slug(f.name.replace(/\.[^.]+$/, ""));
  const ext = /webm/.test(f.type) || /\.webm$/i.test(f.name) ? "webm" : "mp4";
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    if (f.size && f.size <= INLINE_VIDEO) return { kind: "video-inline", name: `${stem}.${ext}`, type: `video/${ext}`, data: (await readAll(f.r, INLINE_VIDEO)).toString("base64") };
    throw new DriveError("Videos over 3.3 MB are stored in Vercel Blob. Connect it once: Vercel → Storage → Create → Blob → connect to this project, then redeploy.", 503);
  }
  const { put } = require("@vercel/blob");
  const blob = await put(`videos/${stem}.${ext}`, f.r.body, { access: "public", contentType: `video/${ext}`, addRandomSuffix: true, multipart: true });
  return { kind: "video", name: `${stem}.${ext}`, url: blob.url, size: f.size };
}

async function listFolder(id) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new DriveError("To import a whole folder, add a GOOGLE_API_KEY in Vercel (see the README). Or paste the links of the files instead, one per line.");
  const files = []; let page = "";
  do {
    const q = encodeURIComponent(`'${id}' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')`);
    const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name,mimeType,size)&pageSize=200&key=${encodeURIComponent(key)}${page ? "&pageToken=" + page : ""}`);
    const d = await r.json();
    if (!r.ok) throw new DriveError("Couldn't open that folder. Share it as “Anyone with the link” and try again.");
    files.push(...(d.files || []).map((f) => ({ id: f.id, name: f.name, type: f.mimeType, size: Number(f.size) || 0 })));
    page = d.nextPageToken || "";
  } while (page && files.length < 500);
  return files;
}

module.exports = async (req, res) => {
  if (!methods(req, res, ["POST"])) return;
  if (!(await requireAccess(req, res, "site.edit"))) return;
  const d = body(req);
  try {
    if (d.action === "list") {
      const fid = folderId(d.url);
      if (!fid) throw new DriveError("That isn't a Drive folder link.");
      return send(res, 200, { files: await listFolder(fid) });
    }
    if (folderId(d.url)) throw new DriveError("That's a folder link. Use “Import a folder”, or paste the links of the files.");
    const id = fileId(d.id || d.url);
    if (!id) throw new DriveError("That doesn't look like a Google Drive file link.");
    const f = await download(id);
    send(res, 200, f.kind === "image" ? await importImage(f) : await importVideo(f));
  } catch (e) {
    fail(res, e instanceof DriveError ? e.status : 502, e instanceof DriveError ? e.message : "Google Drive couldn't be reached. Please try again.");
  }
};
