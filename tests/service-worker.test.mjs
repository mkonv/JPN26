import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

class BrowserRequest extends Request {
  constructor(input, init) {
    const value = typeof input === "string" ? new URL(input, "https://example.test/JPN26/").href : input;
    super(value, init);
  }
}

function requestKey(input, ignoreSearch = false) {
  const raw = typeof input === "string" ? input : input.url;
  const url = new URL(raw, "https://example.test/JPN26/");
  if (ignoreSearch) url.search = "";
  return url.href;
}

class FakeCache {
  entries = new Map();
  async put(request, response) { this.entries.set(requestKey(request), response.clone()); }
  async match(request, options = {}) {
    const key = requestKey(request, options.ignoreSearch);
    if (!options.ignoreSearch) return this.entries.get(key)?.clone();
    for (const [candidate, response] of this.entries) {
      if (requestKey(candidate, true) === key) return response.clone();
    }
  }
}

class FakeCacheStorage {
  stores = new Map();
  async open(name) {
    if (!this.stores.has(name)) this.stores.set(name, new FakeCache());
    return this.stores.get(name);
  }
  async keys() { return [...this.stores.keys()]; }
  async delete(name) { return this.stores.delete(name); }
  async has(name) { return this.stores.has(name); }
}

function waitableEvent(extra = {}) {
  const pending = [];
  return {
    ...extra,
    waitUntil(promise) { pending.push(Promise.resolve(promise)); },
    async done() { await Promise.all(pending); },
  };
}

test("service worker installs atomically, preserves unrelated caches and serves a route offline", async () => {
  const source = await readFile(new URL("../out/sw.js", import.meta.url), "utf8");
  const listeners = new Map();
  const caches = new FakeCacheStorage();
  let online = true;

  const self = {
    registration: { scope: "https://example.test/JPN26/" },
    location: new URL("https://example.test/JPN26/sw.js"),
    clients: { async claim() {} },
    async skipWaiting() {},
    addEventListener(type, callback) { listeners.set(type, callback); },
  };

  const context = vm.createContext({
    self,
    caches,
    URL,
    Request: BrowserRequest,
    Response,
    Error,
    Set,
    Promise,
    console,
    fetch: async (input) => {
      if (!online) throw new Error("offline");
      const url = requestKey(input);
      return new Response(`<html><body>Япония 2026 · ${url}</body></html>`, { status: 200, headers: { "content-type": "text/html" } });
    },
  });
  vm.runInContext(source, context);

  await caches.open("unrelated-pages-project");
  const install = waitableEvent();
  listeners.get("install")(install);
  await install.done();

  const activate = waitableEvent();
  listeners.get("activate")(activate);
  await activate.done();
  assert.equal(await caches.has("unrelated-pages-project"), true);

  let status;
  const message = waitableEvent({
    data: { type: "GET_STATUS" },
    ports: [{ postMessage(value) { status = value; } }],
  });
  listeners.get("message")(message);
  await message.done();
  assert.equal(status.ready, true);
  assert.equal(status.cached, status.total);

  online = false;
  let responsePromise;
  const fetchEvent = {
    request: { method: "GET", mode: "navigate", url: "https://example.test/JPN26/day/sep-21-osaka/" },
    respondWith(promise) { responsePromise = Promise.resolve(promise); },
  };
  listeners.get("fetch")(fetchEvent);
  const response = await responsePromise;
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Япония 2026/);
});
