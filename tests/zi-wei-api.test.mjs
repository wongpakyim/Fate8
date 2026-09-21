import assert from "node:assert/strict";
import test from "node:test";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("ziwei-test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const ctx = { waitUntil() {}, passThroughOnException() {} };

test("Zi Wei API reuses shared time and supports JSON and visual text", async () => {
  const app = await worker();
  const jsonResponse = await app.fetch(new Request("https://example.test/api/ziwei?solarTime=1992-03-15%2014:30&longitude=113.27&sex=male&referenceYear=2026"), env, ctx);
  assert.equal(jsonResponse.status, 200);
  const result = await jsonResponse.json();
  assert.equal(result.module.name, "zi-wei");
  assert.equal(result.source.fourPillars, "壬申 癸卯 庚寅 癸未");
  assert.equal(result.source.trueSolarTime, "1992-03-15 13:54:10");
  assert.equal(result.rules.starAlgorithm, "中州派");
  assert.equal(result.palaces.length, 12);
  assert.equal(result.defaultSelection.year, 2026);

  const textResponse = await app.fetch(new Request("https://example.test/api/ziwei?solarTime=1992-03-15%2014:30&longitude=113.27&sex=male&referenceYear=2026&format=text"), env, ctx);
  assert.equal(textResponse.status, 200);
  const text = await textResponse.text();
  assert.match(text, /紫微斗数 · 三合派（中州派安星）/);
  assert.match(text, /大限 35–44岁 2026–2035/);
  assert.match(text, /┌/);
});
