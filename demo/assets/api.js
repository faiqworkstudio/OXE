// API client for the demo. Uses the real backend at /api/demo when it is
// available; otherwise runs the same router in the browser (localStorage), so
// the demo still works when opened from a plain static server.
import { createState, handle } from "./core.js";

const BASE = "/api/demo";
const LS_KEY = "aeterna-demo-state";
let mode = null; // "server" | "local"

function loadLocal() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY));
    if (s && s.version) return s;
  } catch {}
  const s = createState();
  saveLocal(s);
  return s;
}
function saveLocal(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

async function detect() {
  if (mode) return mode;
  try {
    const r = await fetch(BASE + "/projects", { headers: { accept: "application/json" } });
    const type = r.headers.get("content-type") || "";
    mode = r.ok && type.includes("json") ? "server" : "local";
  } catch {
    mode = "local";
  }
  return mode;
}

export async function api(method, path, body) {
  let key = "";
  try { key = localStorage.getItem("aeterna-key") || ""; } catch {}
  if ((await detect()) === "server") {
    const r = await fetch(BASE + path, {
      method,
      headers: { "content-type": "application/json", "x-demo-key": key },
      body: method === "GET" ? undefined : JSON.stringify(body || {}),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.error || "request_failed"), { status: r.status });
    return data;
  }
  const state = loadLocal();
  const out = handle(state, method, path, JSON.parse(JSON.stringify(body || {})), key);
  if (out.changed) saveLocal(state);
  if (out.status >= 400) throw Object.assign(new Error(out.body.error), { status: out.status });
  return JSON.parse(JSON.stringify(out.body));
}

export const backendMode = () => detect();
