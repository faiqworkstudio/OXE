// Live preview engine for the admin. Runs the website's own page builder (src/*.py)
// in the browser with Pyodide, so a preview is exactly the page the site will publish.
// Messages in:  {type:"init", origin, files, sizes}  {type:"files", files:{path:text|null}}
//               {type:"assets", paths, sizes}        {type:"render", id, route}
// Messages out: {type:"ready"} {type:"progress", text} {type:"rendered", id, html, path} {type:"error", id, message}
const PYODIDE = "https://cdn.jsdelivr.net/npm/pyodide@0.27.7/";
importScripts(PYODIDE + "pyodide.js");

let py = null;
let booting = null;
const ROOT = "/oxe/";

function write(path, text) {
  const full = ROOT + path;
  py.FS.mkdirTree(full.slice(0, full.lastIndexOf("/")));
  py.FS.writeFile(full, text);
}

function remove(path) {
  try { py.FS.unlink(ROOT + path); } catch (e) { /* already gone */ }
}

async function init(msg) {
  postMessage({ type: "progress", text: "Starting the preview engine…" });
  py = await loadPyodide({ indexURL: PYODIDE });
  postMessage({ type: "progress", text: "Loading the site builder…" });
  const engine = await (await fetch(msg.origin + "/admin/engine/engine.json", { cache: "no-cache" })).json();
  const sources = await Promise.all(engine.files.map(async (f) => [f, await (await fetch(msg.origin + "/admin/engine/" + f, { cache: "no-cache" })).text()]));
  sources.forEach(([f, text]) => write(f, text));
  engine.assets.forEach((a) => write(a, ""));          // stand-ins: the builder only checks they exist
  Object.entries(msg.files || {}).forEach(([p, t]) => (t === null ? remove(p) : write(p, t)));
  py.globals.set("SIZES_JSON", JSON.stringify(Object.assign({}, engine.sizes, msg.sizes || {})));
  py.runPython([
    "import sys, json",
    "sys.path.insert(0, '/oxe/src')",
    "import preview",
    "preview.set_sizes(json.loads(SIZES_JSON))",
  ].join("\n"));
  postMessage({ type: "ready" });
}

onmessage = async (e) => {
  const msg = e.data;
  try {
    if (msg.type === "init") {
      booting = booting || init(msg);
      await booting;
      return;
    }
    await booting;
    if (msg.type === "files") {
      Object.entries(msg.files).forEach(([p, t]) => (t === null ? remove(p) : write(p, t)));
    } else if (msg.type === "assets") {
      (msg.paths || []).forEach((p) => write(p, ""));
      py.globals.set("SIZES_JSON", JSON.stringify(msg.sizes || {}));
      py.runPython("preview.set_sizes(json.loads(SIZES_JSON))");
    } else if (msg.type === "render") {
      py.globals.set("ROUTE", msg.route);
      const result = py.runPython("preview.render(ROUTE)");
      const [html, path] = result.toJs();
      result.destroy();
      postMessage({ type: "rendered", id: msg.id, html, path });
    }
  } catch (err) {
    const text = String(err && err.message || err);
    // keep the useful last line of a Python traceback
    const lines = text.trim().split("\n");
    postMessage({ type: "error", id: msg.id, message: lines[lines.length - 1] || text });
  }
};
