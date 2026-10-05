// Where the website's content lives: the GitHub repository (production), or a local
// git checkout (ADMIN_LOCAL_REPO, for testing). Every publish is one atomic commit;
// Vercel rebuilds the site from it.
//
// Production environment variables:
//   GITHUB_TOKEN   fine-grained token with "Contents: read and write" on the repository
//   GITHUB_REPO    owner/name (default faiqworkstudio/OXE)
//   GITHUB_BRANCH  branch Vercel deploys to production (default below)
const { execFileSync } = require("child_process");

const REPO = process.env.GITHUB_REPO || "faiqworkstudio/OXE";
const BRANCH = process.env.GITHUB_BRANCH || "claude/website-design-requirements-89zc90";

// ------------------------------------------------------------------ what the admin may touch
const READABLE = /^(content|assets\/img|assets\/video)\//;
const WRITABLE = [
  /^content\/[a-z0-9-]+\.yml$/,
  /^content\/(blog|projects)\/[a-z0-9]+(-[a-z0-9]+)*\.(md|yml)$/,
  /^assets\/img\/(work|clients|brand)\/[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp|gif|avif|svg)$/,
  /^assets\/img\/[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|webp|svg|ico)$/,
  /^assets\/video\/[A-Za-z0-9][A-Za-z0-9._-]*\.(mp4|webm)$/,
];
const DELETABLE = [
  /^content\/(blog|projects)\//,
  /^assets\/img\/(work|clients|brand)\//,
  /^assets\/video\//,
];

function checkPath(path, del) {
  if (typeof path !== "string" || path.includes("..") || path.startsWith("/")) return "Invalid path";
  if (!WRITABLE.some((r) => r.test(path))) return `This file can't be changed from the admin: ${path}`;
  if (del && !DELETABLE.some((r) => r.test(path))) return `This file can't be deleted: ${path}`;
  return null;
}

class Conflict extends Error {
  constructor(paths) { super("Someone else changed the same content"); this.paths = paths; }
}

// ------------------------------------------------------------------ GitHub
async function gh(method, path, body, accept) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set in Vercel → Settings → Environment Variables.");
  const r = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept || "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "oxe-admin",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 404) return null;
  const data = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) {
    const raw = (data && data.message) || `GitHub error ${r.status}`;
    // plain-language versions of the errors that will happen one day (expired token, busy GitHub)
    const msg = r.status === 401 ? "The GitHub token has expired or is wrong. Create a new one (README: GITHUB_TOKEN), update it in Vercel → Settings → Environment Variables, then redeploy. Your drafts are safe."
      : r.status === 403 && /rate limit/i.test(raw) ? "GitHub is busy right now (too many requests). Please try again in a few minutes. Your drafts are safe."
      : r.status === 403 ? "The GitHub token isn't allowed to change this repository. It needs Contents: Read and write on " + REPO + "."
      : r.status >= 500 ? "GitHub isn't responding right now. Please try again in a few minutes. Your drafts are safe."
      : raw;
    const e = new Error(msg);
    e.status = r.status;
    throw e;
  }
  return data;
}

const github = {
  name: "github",
  async head() {
    const ref = await gh("GET", `/repos/${REPO}/git/ref/heads/${encodeURIComponent(BRANCH)}`);
    if (!ref) throw new Error(`Branch ${BRANCH} not found in ${REPO}.`);
    const commit = await gh("GET", `/repos/${REPO}/git/commits/${ref.object.sha}`);
    return { sha: ref.object.sha, tree: commit.tree.sha };
  },
  async tree() {
    const head = await this.head();
    const t = await gh("GET", `/repos/${REPO}/git/trees/${head.tree}?recursive=1`);
    const files = t.tree.filter((e) => e.type === "blob" && READABLE.test(e.path)).map((e) => ({ path: e.path, size: e.size, sha: e.sha }));
    return { head: head.sha, files };
  },
  async read(path, ref) {
    const meta = await gh("GET", `/repos/${REPO}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref || BRANCH)}`);
    if (!meta || Array.isArray(meta)) return null;
    let b64 = meta.content;
    if (!b64 || meta.encoding !== "base64") b64 = (await gh("GET", `/repos/${REPO}/git/blobs/${meta.sha}`)).content;
    return { sha: meta.sha, content: Buffer.from(b64, "base64") };
  },
  async blob(buffer) {
    const r = await gh("POST", `/repos/${REPO}/git/blobs`, { content: buffer.toString("base64"), encoding: "base64" });
    return r.sha;
  },
  async changedSince(base, head) {
    const c = await gh("GET", `/repos/${REPO}/compare/${base}...${head}`);
    return c ? (c.files || []).map((f) => f.filename) : [];
  },
  async commit({ message, base, changes, author }) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const head = await this.head();
      if (base && base !== head.sha) {
        const touched = await this.changedSince(base, head.sha);
        const clash = changes.map((c) => c.path).filter((p) => touched.includes(p));
        if (clash.length) throw new Conflict(clash);
      }
      const entries = [];
      for (const c of changes) {
        if (c.delete) entries.push({ path: c.path, mode: "100644", type: "blob", sha: null });
        else entries.push({ path: c.path, mode: "100644", type: "blob", sha: c.sha || (await this.blob(c.buffer)) });
      }
      const tree = await gh("POST", `/repos/${REPO}/git/trees`, { base_tree: head.tree, tree: entries });
      const when = new Date().toISOString();
      const who = { name: /OXE admin/.test(author) ? author : `${author} (OXE admin)`, email: process.env.ADMIN_COMMIT_EMAIL || "admin@oxemarketingth.com", date: when };
      const commit = await gh("POST", `/repos/${REPO}/git/commits`, { message, tree: tree.sha, parents: [head.sha], author: who, committer: who });
      try {
        await gh("PATCH", `/repos/${REPO}/git/refs/heads/${encodeURIComponent(BRANCH)}`, { sha: commit.sha, force: false });
        return { sha: commit.sha };
      } catch (e) {
        if (e.status !== 422 || attempt === 1) throw e;   // the branch moved meanwhile: try once more
        base = base || head.sha;
      }
    }
  },
  async history(path, limit) {
    const list = await gh("GET", `/repos/${REPO}/commits?sha=${encodeURIComponent(BRANCH)}&per_page=${limit}${path ? `&path=${encodeURIComponent(path)}` : ""}`);
    return (list || []).map((c) => ({ sha: c.sha, message: c.commit.message.split("\n")[0], date: c.commit.author.date, author: c.commit.author.name }));
  },
  async deploy(sha) {
    const list = await gh("GET", `/repos/${REPO}/commits/${sha}/statuses?per_page=20`);
    const v = (list || []).find((s) => /vercel/i.test(s.context));
    if (!v) return { state: "waiting" };
    return { state: v.state, description: v.description, url: v.target_url };
  },
};

// ------------------------------------------------------------------ local git checkout (testing)
function git(args, input) {
  return execFileSync("git", args, { cwd: process.env.ADMIN_LOCAL_REPO, input, maxBuffer: 200 * 1024 * 1024 });
}

const local = {
  name: "local",
  async head() {
    const sha = git(["rev-parse", "HEAD"]).toString().trim();
    return { sha, tree: git(["rev-parse", "HEAD^{tree}"]).toString().trim() };
  },
  async tree() {
    const head = await this.head();
    const files = git(["ls-tree", "-r", "-l", "HEAD"]).toString().split("\n").filter(Boolean).map((l) => {
      const [meta, path] = l.split("\t");
      const p = meta.split(/\s+/);
      return { path, size: Number(p[3]) || 0, sha: p[2] };
    }).filter((f) => READABLE.test(f.path));
    return { head: head.sha, files };
  },
  async read(path, ref) {
    try {
      const sha = git(["rev-parse", `${ref || "HEAD"}:${path}`]).toString().trim();
      return { sha, content: git(["cat-file", "blob", sha]) };
    } catch (e) { return null; }
  },
  async blob(buffer) {
    return git(["hash-object", "-w", "--stdin"], buffer).toString().trim();
  },
  async commit({ message, base, changes, author }) {
    const head = await this.head();
    if (base && base !== head.sha) {
      const touched = git(["diff", "--name-only", base, head.sha]).toString().split("\n").filter(Boolean);
      const clash = changes.map((c) => c.path).filter((p) => touched.includes(p));
      if (clash.length) throw new Conflict(clash);
    }
    const index = require("path").join(require("os").tmpdir(), `oxe-index-${process.pid}-${Date.now()}`);
    const env = Object.assign({}, process.env, { GIT_INDEX_FILE: index, GIT_AUTHOR_NAME: `${author} (OXE admin)`, GIT_AUTHOR_EMAIL: "admin@oxemarketingth.com", GIT_COMMITTER_NAME: `${author} (OXE admin)`, GIT_COMMITTER_EMAIL: "admin@oxemarketingth.com" });
    const run = (args, input) => execFileSync("git", args, { cwd: process.env.ADMIN_LOCAL_REPO, env, input, maxBuffer: 200 * 1024 * 1024 });
    run(["read-tree", head.sha]);
    for (const c of changes) {
      if (c.delete) run(["update-index", "--force-remove", c.path]);
      else run(["update-index", "--add", "--cacheinfo", `100644,${c.sha || (await this.blob(c.buffer))},${c.path}`]);
    }
    const tree = run(["write-tree"]).toString().trim();
    const sha = run(["commit-tree", tree, "-p", head.sha, "-m", message]).toString().trim();
    run(["update-ref", "HEAD", sha, head.sha]);
    require("fs").rmSync(index, { force: true });
    return { sha };
  },
  async history(path, limit) {
    const out = git(["log", `-n${limit}`, "--format=%H%x1f%s%x1f%aI%x1f%an", "HEAD", ...(path ? ["--", path] : [])]).toString();
    return out.split("\n").filter(Boolean).map((l) => {
      const [sha, message, date, author] = l.split("\x1f");
      return { sha, message, date, author };
    });
  },
  async deploy() {
    return { state: "success", description: "Local test repository (no deployment)", url: null };
  },
};

const backend = process.env.ADMIN_LOCAL_REPO ? local : github;

module.exports = { backend, checkPath, Conflict, BRANCH, REPO };
