"use strict";
/* Records short GIFs of the extension in action, for the README.
   Uses Playwright to load the unpacked extension in Chromium, records each
   scenario to webm, then converts to an optimized GIF with ffmpeg (two-pass
   palette). A tiny local server serves a mock "distracting feed" so the
   redirect demo reads clearly. Run: npm run record:gifs */
const { chromium } = require("@playwright/test");
const { execFile } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");
const os = require("os");
const fs = require("fs");
const http = require("http");

const EXT_DIR = path.resolve(__dirname, "..");
const OUT_DIR = path.join(EXT_DIR, "assets");
const SIZE = { width: 1000, height: 640 };
const FPS = 12;
const WIDTH = 760;

const FEED_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>feed</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,"Segoe UI",Roboto,sans-serif}
  body{background:#fafafa;color:#222}
  header{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;
    padding:14px 22px;background:#fff;border-bottom:1px solid #dbdbdb}
  .logo{font-weight:700;font-size:22px;background:linear-gradient(45deg,#f09433,#dc2743,#bc1888);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .icons{display:flex;gap:18px;font-size:20px}
  .feed{max-width:520px;margin:20px auto;display:flex;flex-direction:column;gap:22px}
  .post{background:#fff;border:1px solid #dbdbdb;border-radius:10px;overflow:hidden}
  .pdr{display:flex;align-items:center;gap:10px;padding:12px}
  .av{width:34px;height:34px;border-radius:50%;background:linear-gradient(45deg,#f09433,#bc1888)}
  .nm{font-weight:600;font-size:14px}
  .img{height:300px}
  .a{background:linear-gradient(135deg,#89f7fe,#66a6ff)}
  .b{background:linear-gradient(135deg,#fddb92,#d1fdff)}
  .c{background:linear-gradient(135deg,#f8b500,#fceabb)}
  .act{display:flex;gap:16px;padding:12px;font-size:20px}
  .cap{padding:0 12px 14px;font-size:14px}
</style></head><body>
<header><div class="logo">&#9678; feed</div><div class="icons">&#9825; &#9993; &#8853;</div></header>
<div class="feed">
  <div class="post"><div class="pdr"><div class="av"></div><div class="nm">wanderlust</div></div>
    <div class="img a"></div><div class="act">&#9825; &#128172; &#10148;</div><div class="cap"><b>wanderlust</b> just one more scroll&hellip;</div></div>
  <div class="post"><div class="pdr"><div class="av"></div><div class="nm">daily.dose</div></div>
    <div class="img b"></div><div class="act">&#9825; &#128172; &#10148;</div><div class="cap"><b>daily.dose</b> endless content &#10024;</div></div>
  <div class="post"><div class="pdr"><div class="av"></div><div class="nm">more.more</div></div>
    <div class="img c"></div><div class="act">&#9825; &#128172; &#10148;</div><div class="cap"><b>more.more</b> keep going&hellip;</div></div>
</div></body></html>`;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function ff(args) {
  return new Promise((res, rej) => {
    execFile(ffmpegPath, args, (e, _o, se) => (e ? rej(new Error(se || e.message)) : res()));
  });
}

async function toGif(webm, gif) {
  const pal = webm + ".png";
  const vf = `fps=${FPS},scale=${WIDTH}:-1:flags=lanczos`;
  await ff(["-y", "-i", webm, "-vf", `${vf},palettegen=stats_mode=diff`, pal]);
  await ff([
    "-y", "-i", webm, "-i", pal,
    "-lavfi", `${vf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
    gif
  ]);
  fs.rmSync(pal, { force: true });
}

async function record(name, seed, actions) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ip-rec-"));
  const videoDir = fs.mkdtempSync(path.join(os.tmpdir(), "ip-vid-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    viewport: SIZE,
    recordVideo: { dir: videoDir, size: SIZE },
    args: ["--disable-extensions-except=" + EXT_DIR, "--load-extension=" + EXT_DIR]
  });
  const sw = context.serviceWorkers()[0] || (await context.waitForEvent("serviceworker"));
  const extId = new URL(sw.url()).host;
  await sw.evaluate((s) => chrome.storage.local.set(s), seed);
  await sleep(300);

  const page = await context.newPage();
  await actions(page, extId);
  await context.close();

  const webm = fs
    .readdirSync(videoDir)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => path.join(videoDir, f))[0];
  const gif = path.join(OUT_DIR, name + ".gif");
  await toGif(webm, gif);
  const kb = Math.round(fs.statSync(gif).size / 1024);
  console.log(`  ${name}.gif  (${kb} KB)`);
  fs.rmSync(userDataDir, { recursive: true, force: true });
  fs.rmSync(videoDir, { recursive: true, force: true });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(FEED_HTML);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const feedUrl = "http://127.0.0.1:" + port + "/";
  const blockedUrl = "http://localhost:" + port + "/"; // same server, blockable by hostname

  console.log("Recording GIFs ->", OUT_DIR);

  // 1) Hero: the calm breathing page.
  await record(
    "hero",
    { enabled: false, sound: "waterfall", volume: 40 },
    async (page, extId) => {
      await page.goto(`chrome-extension://${extId}/calm.html`, { waitUntil: "domcontentloaded" });
      await sleep(8200); // roughly one full breath cycle
    }
  );

  // 2) Redirect: a distracting feed becomes the calm page.
  await record(
    "redirect",
    { enabled: false, blockedSites: ["localhost"] },
    async (page) => {
      await page.goto(feedUrl, { waitUntil: "domcontentloaded" });
      await sleep(2400);
      await page.goto(blockedUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
      await sleep(3600);
    }
  );

  // 3) Configurable block list, in the same calm settings panel.
  await record(
    "block-list",
    { enabled: false, blockedSites: ["instagram.com"] },
    async (page, extId) => {
      await page.goto(`chrome-extension://${extId}/calm.html`, { waitUntil: "domcontentloaded" });
      await sleep(900);
      await page.locator("#gearBtn").click();
      await sleep(900);
      await page.locator("#blkInput").pressSequentially("reddit.com", { delay: 130 });
      await sleep(500);
      await page.locator("#blkAdd").click();
      await sleep(1500);
      await page.locator("#blkList button", { hasText: "\u2715" }).first().click();
      await sleep(1600);
    }
  );

  await new Promise((r) => server.close(r));
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
