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
  assert.match(html, /四柱见山河/);
  assert.match(html, /八字反查/);
  assert.match(html, /2 × 4 正交网格/);
  assert.match(html, /路径藏干展开 · 强弱用神/);
  assert.match(html, /按起始节点排列的连续三节点组合/);
  assert.match(html, /十神·六亲/);
  assert.match(html, /地支·本气/);
  assert.match(html, /藏干·六亲/);
  assert.match(html, /hidden-focus/);
  assert.doesNotMatch(html, /chart-relation-panel|动态信息 · 八字八格/);
  assert.match(html, /术数排盘模块/);
  assert.match(html, /八字反排/);
  assert.match(html, /六壬/);
  assert.match(html, /奇门/);
  assert.match(html, /挂起/);
  assert.match(html, /现在/);
  assert.match(html, /复制文字简排/);
  assert.match(html, /女 · 坤造 · 0/);
  assert.match(html, /男 · 乾造 · 1/);
  assert.doesNotMatch(html, /大六壬排盘|时家奇门 · 拆补法|八字反查出生时刻/);
  const luckIndex = html.indexOf('<section class="bazi-luck-panel"');
  const pillarIndex = html.indexOf('<div class="pillars"');
  const nodeIndex = html.indexOf('<section class="manhattan-panel"');
  assert.ok(luckIndex < pillarIndex && pillarIndex < nodeIndex, "大运流年应置于八字命盘上方，八字节点保持在末尾");
  assert.match(html, /当前计算点/);
  assert.match(html, /恢复日干/);
  assert.match(html, /月令旺衰/);
  assert.match(html, /坐宫旺衰/);
  const nodeModule = html.slice(nodeIndex, html.indexOf("<footer>", nodeIndex));
  assert.equal((nodeModule.match(/path-start-group/g) || []).length, 8);
  assert.match(nodeModule, /日干强弱/);
  assert.match(nodeModule, /喜克、泄、耗/);
  assert.doesNotMatch(nodeModule, /十二长生|旺相休囚死|十神|六亲|神煞|element-/);
  assert.match(html, /十二长生/);
  assert.match(html, /神煞/);
  assert.doesNotMatch(html, /五行权重|节气定位|命盘详解/);
  assert.doesNotMatch(html, /CALCULATION NOTES|每一步，都说明怎么算|计算与展示，分层组合|开发者接入/);
  assert.match(html, /https:\/\/example\.test\/ink-mountains\.png/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("HTTP API returns the same four pillars as the shared core", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("https://example.test/api/bazi?solarTime=1992-03-15%2014:30&longitude=113.27"), env, ctx);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.fourPillars.text, "壬申 癸卯 庚寅 癸未");
});

test("lightweight pillars API excludes presentation data", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("https://example.test/api/pillars?solarTime=1992-03-15%2014:30&longitude=113.27"), env, ctx);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.module.name, "four-pillars");
  assert.equal(result.fourPillars.text, "壬申 癸卯 庚寅 癸未");
  assert.match(result.luckStart.startTime, /^1998-/);
  assert.equal(result.profile, undefined);
  assert.equal(result.luck, undefined);
});

test("public core and simple-chart APIs expose the reusable JSON layers", async () => {
  const app = await worker();
  const coreResponse = await app.fetch(new Request("https://example.test/api/core?solarTime=1992-03-15%2014:30&longitude=113.27"), env, ctx);
  assert.equal(coreResponse.status, 200);
  const core = await coreResponse.json();
  assert.equal(core.module.name, "metaphysics-core");
  assert.equal(core.source.fourPillars, "壬申 癸卯 庚寅 癸未");
  assert.equal(core.monthGeneral.name, "登明");
  assert.equal(core.qiMen.yuan.hou, "下候");

  const simpleResponse = await app.fetch(new Request("https://example.test/api/simple?solarTime=1992-03-15%2014:30&longitude=113.27"), env, ctx);
  assert.equal(simpleResponse.status, 200);
  const simple = await simpleResponse.json();
  assert.equal(simple.module.name, "simple-chart");
  assert.equal(simple.core.module.name, "metaphysics-core");
  assert.equal(simple.liuRen.module.name, "liu-ren");
  assert.equal(simple.qiMen.module.name, "qi-men");

  const simpleTextResponse = await app.fetch(new Request("https://example.test/api/simple?solarTime=1992-03-15%2014:30&longitude=113.27&format=text"), env, ctx);
  const simpleText = await simpleTextResponse.text();
  assert.match(simpleText, /四课（第一课在最右/);
  assert.match(simpleText, /天盘十二宫/);
  assert.match(simpleText, /奇门九宫（巽离坤／震中兑／艮坎乾）/);
});

test("Liu Ren API reuses the four-pillar time and supports manual month general", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("https://example.test/api/liuren?solarTime=1992-03-15%2014:30&longitude=113.27&monthGeneral=%E5%AD%90"), env, ctx);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.module.name, "liu-ren");
  assert.equal(result.source.fourPillars, "壬申 癸卯 庚寅 癸未");
  assert.equal(result.monthGeneral.branch, "子");
  assert.equal(result.monthGeneral.mode, "手动指定");
  assert.equal(result.earthPlate.length, 12);
  assert.ok(result.earthPlate.some((palace) => palace.shenSha.length > 0));
  assert.equal(result.fourLessons.length, 4);
  assert.equal(result.threeTransmissions.items.length, 3);

  const textResponse = await app.fetch(new Request("https://example.test/api/liuren?solarTime=1992-03-15%2014:30&longitude=113.27&format=text"), env, ctx);
  const text = await textResponse.text();
  assert.match(text, /四课（第一课在最右/);
  assert.match(text, /天盘十二宫/);
});

test("Qi Men API reuses the four-pillar time and returns a Chai-Bu plate", async () => {
  const app = await worker();
  const response = await app.fetch(new Request("https://example.test/api/qimen?solarTime=1992-03-15%2014:30&longitude=113.27"), env, ctx);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.module.name, "qi-men");
  assert.equal(result.source.fourPillars, "壬申 癸卯 庚寅 癸未");
  assert.equal(result.config.method, "chai-bu");
  assert.equal(result.solarTerm.current.name, "惊蛰");
  assert.equal(result.ju.label, "阳遁4局");
  assert.equal(result.palaces.length, 9);
  assert.ok(result.palaces.some((palace) => palace.heavenGrowth.length > 0));

  const textResponse = await app.fetch(new Request("https://example.test/api/qimen?solarTime=1992-03-15%2014:30&longitude=113.27&format=text"), env, ctx);
  const text = await textResponse.text();
  assert.match(text, /奇门九宫（巽离坤／震中兑／艮坎乾）/);
  assert.match(text, /天盘长生/);
  assert.match(text, /地盘长生/);
});
