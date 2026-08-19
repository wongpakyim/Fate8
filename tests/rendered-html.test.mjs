import assert from "node:assert/strict";
import test from "node:test";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const ctx = { waitUntil() {}, passThroughOnException() {} };

test("server-renders the finished product page and metadata", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("https://example.test/", { headers: { accept: "text/html", host: "example.test" } }), env, ctx);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /知命排盘/);
  assert.match(html, /四柱见天地/);
  assert.match(html, /八字反查/);
  assert.match(html, /https:\/\/example\.test\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("HTTP API returns the same four pillars as the shared core", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("https://example.test/api/bazi?solarTime=1992-03-15%2014:30&longitude=113.27"), env, ctx);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.fourPillars.text, "壬申 癸卯 庚寅 癸未");
});
