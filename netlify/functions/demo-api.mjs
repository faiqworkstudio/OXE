// Backend for the client demo at /demo. Stores everything as one JSON document
// in Netlify Blobs; outside Netlify (local dev) it keeps state in memory.
import { createState, handle } from "../../demo/assets/core.js";

export const config = { path: "/api/demo/*" };

const KEY = "state";
let memory = null;

async function openStore() {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "aeterna-demo", consistency: "strong" });
    return {
      get: () => store.get(KEY, { type: "json" }),
      set: (state) => store.setJSON(KEY, state),
    };
  } catch {
    return { get: async () => memory, set: async (state) => { memory = state; } };
  }
}

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export default async function (req) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/demo/, "") || "/";

  // Meta Lead Ads webhook verification handshake (GET with hub.* params).
  if (path === "/webhooks/facebook" && req.method === "GET") {
    const verify = process.env.FB_VERIFY_TOKEN || "aeterna-demo-verify";
    if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === verify) {
      return new Response(url.searchParams.get("hub.challenge") || "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  let body = {};
  if (req.method !== "GET" && req.method !== "HEAD") {
    const text = await req.text();
    if (text.length > 50000) return json(413, { error: "too_large" });
    try { body = text ? JSON.parse(text) : {}; } catch { return json(400, { error: "bad_json" }); }
  }

  const store = await openStore();
  let state = await store.get();
  if (!state || !state.version) {
    state = createState();
    await store.set(state);
  }

  const out = handle(state, req.method, path, body, req.headers.get("x-demo-key") || "");
  if (out.changed) await store.set(state);
  return json(out.status, out.body);
}
