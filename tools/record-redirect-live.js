"use strict";
/* Records the real "type a URL, get redirected" demo for the README.
   Capture: Win32 PrintWindow grabs the exact browser window's pixels regardless
   of z-order/occlusion (no screen-region race, no other windows leaking in).
   Input:   omnibox typing via SendKeys, gated by a hardened foreground guard
            that verifies the target window is foreground before every keystroke
            and aborts otherwise, so keys can never spill into other apps.
   Run: node tools/record-redirect-live.js  (or: npm run record:redirect) */
const { chromium } = require("@playwright/test");
const { execFile, execFileSync } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");
const os = require("os");
const fs = require("fs");

const EXT_DIR = path.resolve(__dirname, "..");
const OUT_DIR = path.join(EXT_DIR, "assets");
const IN = path.join(__dirname, "win-input.ps1");
const LOOP = path.join(__dirname, "capture-loop.ps1");
const FPS = 12;
const SECONDS = 10;
const WIDTH = 900;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function ps(args) {
  return execFileSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", IN, ...args],
    { encoding: "utf8" }
  ).trim();
}
function ff(args) {
  return new Promise((res, rej) => {
    execFile(ffmpegPath, args, (e, _o, se) => (e ? rej(new Error(se || e.message)) : res()));
  });
}
async function framesToGif(dir, gif) {
  const pal = path.join(dir, "palette.png");
  const src = path.join(dir, "frame_%05d.png");
  const vf = `scale=${WIDTH}:-1:flags=lanczos`;
  await ff(["-y", "-framerate", String(FPS), "-i", src, "-vf", `${vf},palettegen=stats_mode=diff`, pal]);
  await ff(["-y", "-framerate", String(FPS), "-i", src, "-i", pal,
    "-lavfi", `${vf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`, gif]);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const udd = fs.mkdtempSync(path.join(os.tmpdir(), "ip-rec-"));
  const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), "ip-frames-"));

  const context = await chromium.launchPersistentContext(udd, {
    channel: "chromium",
    headless: false,
    viewport: null,
    args: [
      "--disable-extensions-except=" + EXT_DIR,
      "--load-extension=" + EXT_DIR,
      "--disable-gpu", // software render so PrintWindow captures page content
      "--window-position=60,60",
      "--window-size=1120,780",
      "--hide-crash-restore-bubble"
    ]
  });

  const sw = context.serviceWorkers()[0] || (await context.waitForEvent("serviceworker"));
  await sw.evaluate((s) => chrome.storage.local.set(s),
    { enabled: false, blockedSites: ["instagram.com"], sound: "waterfall", volume: 40 });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto("chrome://newtab", { waitUntil: "domcontentloaded" }).catch(() => {});
  await sleep(1200);

  let win = null;
  for (const m of ["Chrome for Testing", "Chromium"]) {
    const out = ps(["-Action", "find", "-Match", m]);
    if (out && out !== "null") { win = JSON.parse(out); break; }
  }
  if (!win) throw new Error("could not find the browser window");
  const hwnd = String(win.hwnd);
  console.log("window:", win.title);

  // Start capturing the exact window (z-order independent).
  const cap = execFile("powershell", [
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", LOOP,
    "-Hwnd", hwnd, "-Dir", framesDir, "-Seconds", String(SECONDS), "-Fps", String(FPS)
  ]);
  const capDone = new Promise((res) => cap.on("close", res));
  await sleep(1200); // a beat on the new-tab page

  // Type instagram.com into the real omnibox, leak-safe.
  const focused = ps(["-Action", "focus", "-Hwnd", hwnd]);
  if (focused === "ok" && ps(["-Action", "verify", "-Hwnd", hwnd]) === "ok") {
    ps(["-Action", "keys", "-Text", "^l", "-Hwnd", hwnd]);
    await sleep(500);
    const typed = ps(["-Action", "type", "-Text", "instagram.com", "-Hwnd", hwnd, "-CharDelayMs", "160"]);
    await sleep(400);
    if (typed === "ok") ps(["-Action", "keys", "-Text", "~", "-Hwnd", hwnd]); // Enter
    else console.warn("typing aborted (focus lost); falling back to navigation");
  } else {
    console.warn("could not focus window safely; using navigation fallback (no typing)");
  }

  // Fallback / ensure the redirect happens even if typing was aborted.
  if (!context.pages().some((p) => p.url().includes("calm.html"))) {
    await page.goto("http://instagram.com/", { waitUntil: "domcontentloaded" }).catch(() => {});
  }
  for (let i = 0; i < 40; i++) {
    if (context.pages().some((p) => p.url().includes("calm.html"))) break;
    await sleep(150);
  }

  await capDone;         // capture loop runs for SECONDS then exits
  await context.close();

  const gif = path.join(OUT_DIR, "redirect.gif");
  await framesToGif(framesDir, gif);
  const kb = Math.round(fs.statSync(gif).size / 1024);
  console.log(`redirect.gif (${kb} KB)`);

  fs.rmSync(udd, { recursive: true, force: true });
  fs.rmSync(framesDir, { recursive: true, force: true });
}

main().catch((e) => { console.error(e); process.exit(1); });
