"use strict";
/* End-to-end tests: load the unpacked extension in Chromium and verify that
   configured sites redirect to the calm page, and that the in-page add/remove
   flow updates blocking. A tiny local HTTP server stands in for a "distracting"
   site so the tests never touch the real network. */
const { test, expect, chromium } = require("@playwright/test");
const path = require("path");
const os = require("os");
const fs = require("fs");
const http = require("http");

const EXT_DIR = path.resolve(__dirname, "..", "..");
const TEST_HOST = "127.0.0.1";

let context;
let userDataDir;
let sw;            // background service worker
let extId;
let server;
let siteUrl;

async function setBlockedSites(sites) {
  await sw.evaluate((s) => chrome.storage.local.set({ blockedSites: s }), sites);
}

async function getDynamicRuleFilters() {
  return sw.evaluate(async () => {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    return rules.map((r) => r.condition.urlFilter);
  });
}

test.beforeAll(async () => {
  // Local stand-in for a distracting site.
  server = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end("<!doctype html><title>local test page</title><h1>local test page ok</h1>");
  });
  await new Promise((resolve) => server.listen(0, TEST_HOST, resolve));
  siteUrl = "http://" + TEST_HOST + ":" + server.address().port + "/";

  userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "calm-e2e-"));
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    args: [
      "--disable-extensions-except=" + EXT_DIR,
      "--load-extension=" + EXT_DIR
    ]
  });

  sw = context.serviceWorkers()[0] || (await context.waitForEvent("serviceworker"));
  extId = new URL(sw.url()).host;
});

test.afterAll(async () => {
  if (context) await context.close();
  if (server) await new Promise((r) => server.close(r));
  if (userDataDir) fs.rmSync(userDataDir, { recursive: true, force: true });
});

test("seeds instagram.com as the default blocked site", async () => {
  await expect
    .poll(getDynamicRuleFilters)
    .toContain("||instagram.com");
});

test("a configured site redirects to the calm page", async () => {
  await setBlockedSites([TEST_HOST]);
  await expect.poll(getDynamicRuleFilters).toContain("||" + TEST_HOST);

  const page = await context.newPage();
  await expect
    .poll(async () => {
      await page.goto(siteUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
      return page.url();
    })
    .toContain("/calm.html");

  await expect(page.locator(".foot")).toContainText("you are alive");
  await page.close();
});

test("the calm page shows exactly one reminder message", async () => {
  const page = await context.newPage();
  await page.goto("chrome-extension://" + extId + "/calm.html", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#message")).toHaveCount(1);
  const text = (await page.locator("#message").textContent()).trim();
  expect(text.length).toBeGreaterThan(0);
  await page.close();
});

test("calm-page add flow blocks a new site", async () => {
  await setBlockedSites([]);
  const calm = await context.newPage();
  await calm.goto("chrome-extension://" + extId + "/calm.html", { waitUntil: "domcontentloaded" });
  await calm.locator("#gearBtn").click();               // open the settings panel

  await calm.locator("#blkInput").fill(TEST_HOST);
  await calm.locator("#blkAdd").click();
  await expect(calm.locator("#blkList")).toContainText(TEST_HOST);
  await expect.poll(getDynamicRuleFilters).toContain("||" + TEST_HOST);

  const page = await context.newPage();
  await expect
    .poll(async () => {
      await page.goto(siteUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
      return page.url();
    })
    .toContain("/calm.html");
  await page.close();
  await calm.close();
});

test("calm-page theme picker switches and persists the background", async () => {
  const calm = await context.newPage();
  await calm.goto("chrome-extension://" + extId + "/calm.html", { waitUntil: "domcontentloaded" });

  // defaults to the calm theme
  await expect(calm.locator("html")).toHaveAttribute("data-theme", "calm");

  await calm.locator("#gearBtn").click();
  await calm.locator('#themes button[data-theme="sunny"]').click();
  await expect(calm.locator("html")).toHaveAttribute("data-theme", "sunny");
  await expect(calm.locator('#themes button[data-theme="sunny"]')).toHaveClass(/active/);

  const stored = await sw.evaluate(() =>
    new Promise((r) => chrome.storage.local.get({ theme: "calm" }, (x) => r(x.theme)))
  );
  expect(stored).toBe("sunny");

  // a freshly opened calm page restores the saved theme
  const calm2 = await context.newPage();
  await calm2.goto("chrome-extension://" + extId + "/calm.html", { waitUntil: "domcontentloaded" });
  await expect(calm2.locator("html")).toHaveAttribute("data-theme", "sunny");

  await calm2.close();
  await calm.close();
});

test("calm-page remove flow stops blocking", async () => {
  await setBlockedSites([TEST_HOST]);
  await expect.poll(getDynamicRuleFilters).toContain("||" + TEST_HOST);

  const calm = await context.newPage();
  await calm.goto("chrome-extension://" + extId + "/calm.html", { waitUntil: "domcontentloaded" });
  await calm.locator("#gearBtn").click();
  await expect(calm.locator("#blkList")).toContainText(TEST_HOST);
  await calm.locator("#blkList button", { hasText: "✕" }).first().click();
  await expect.poll(getDynamicRuleFilters).not.toContain("||" + TEST_HOST);

  const page = await context.newPage();
  await page.goto(siteUrl, { waitUntil: "domcontentloaded" });
  expect(page.url()).toContain(TEST_HOST);
  await expect(page.locator("h1")).toContainText("local test page ok");
  await page.close();
  await calm.close();
});
