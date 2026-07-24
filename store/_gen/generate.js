"use strict";
/* Generates Chrome Web Store assets from the real extension UI:
   - 5 screenshots at 1280x800 (store spec: full-bleed, square corners)
   - small promo tile 440x280 (required)
   - marquee 1400x560 (optional, needed for featuring)
   Screenshots load the actual calm.html and drive its DOM so what users see
   in the store is exactly what ships. Promo art is brand-forward and text-light. */
const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT_SHOTS = path.resolve(__dirname, "..", "screenshots");
const OUT_PROMO = path.resolve(__dirname, "..", "promo");
const calmUrl = "file://" + path.join(ROOT, "calm.html").replace(/\\/g, "/");
const iconUrl = "data:image/png;base64," +
  fs.readFileSync(path.join(ROOT, "icons", "icon512.png")).toString("base64");

// A consistent glass caption that reads on every theme (dark, sunny, dusk).
function captionScript() {
  return (o) => {
    const bar = document.createElement("div");
    bar.textContent = o.text;
    Object.assign(bar.style, {
      position: "fixed", top: o.top + "px", left: "50%", transform: "translateX(-50%)",
      zIndex: "50", maxWidth: "80%", textAlign: "center",
      font: "600 26px -apple-system,'Segoe UI',Roboto,sans-serif", color: "#fff",
      letterSpacing: "0.01em", padding: "14px 26px", borderRadius: "16px",
      background: "rgba(10,20,30,0.55)", border: "1px solid rgba(255,255,255,0.18)",
      backdropFilter: "blur(6px)", boxShadow: "0 10px 40px rgba(0,0,0,0.25)"
    });
    document.body.appendChild(bar);
  };
}

function setState(opts) {
  return (o) => {
    document.documentElement.setAttribute("data-theme", o.theme);
    if (o.message) document.getElementById("message").textContent = o.message;
    const hint = document.getElementById("soundHint");
    if (hint) hint.style.display = "none";
    const panel = document.getElementById("panel");
    if (o.panel) panel.classList.add("open"); else panel.classList.remove("open");
    if (o.blocked) {
      const list = document.getElementById("blkList");
      list.innerHTML = "";
      o.blocked.forEach((s) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.className = "site"; span.textContent = s;
        const rm = document.createElement("button");
        rm.textContent = "\u2715"; rm.title = "Remove";
        li.appendChild(span); li.appendChild(rm); list.appendChild(li);
      });
    }
    // mark the active theme chip so the picker looks real
    document.querySelectorAll("#themes .sound-chip").forEach((c) =>
      c.classList.toggle("active", c.dataset.themeName === o.theme));
  };
}

// A fake omnibox strip for the "you typed instagram.com, peace loaded" shot.
function omniboxScript() {
  return () => {
    const bar = document.createElement("div");
    Object.assign(bar.style, {
      position: "fixed", top: "0", left: "0", right: "0", height: "60px", zIndex: "60",
      display: "flex", alignItems: "center", padding: "0 18px",
      background: "rgba(12,20,28,0.85)", borderBottom: "1px solid rgba(255,255,255,0.12)",
      backdropFilter: "blur(6px)"
    });
    const dots = document.createElement("div");
    dots.style.cssText = "display:flex;gap:8px;margin-right:16px";
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c) => {
      const d = document.createElement("span");
      d.style.cssText = `width:13px;height:13px;border-radius:50%;background:${c}`;
      dots.appendChild(d);
    });
    const pill = document.createElement("div");
    pill.style.cssText =
      "flex:1;max-width:640px;display:flex;align-items:center;gap:10px;" +
      "background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.14);" +
      "border-radius:999px;padding:9px 16px;color:#e8f1ef;font:500 17px -apple-system,'Segoe UI',sans-serif";
    pill.innerHTML = '<span style="opacity:.7">\uD83D\uDD12</span>' +
      '<span style="text-decoration:line-through;opacity:.85">instagram.com</span>' +
      '<span style="margin-left:auto;opacity:.6">\u2192 calm</span>';
    bar.appendChild(dots); bar.appendChild(pill);
    document.body.appendChild(bar);
  };
}

const SHOTS = [
  { file: "01-hero.png", theme: "calm",
    message: "This breath is happening. You are alive for it.",
    caption: "The scroll ends here." },
  { file: "02-redirect.png", theme: "calm",
    message: "What did you actually want? It probably wasn't this.",
    omnibox: true, caption: "You typed a time-sink. Peace loaded instead." },
  { file: "03-settings.png", theme: "calm", panel: true,
    blocked: ["instagram.com", "x.com", "reddit.com", "youtube.com", "tiktok.com"],
    caption: "Block anything. Sounds, volume, backgrounds. One panel." },
  { file: "04-sunny.png", theme: "sunny",
    message: "Rest here a second. The world will keep turning without a scroll.",
    caption: "Three calm backgrounds. Pick your mood." },
  { file: "05-dusk.png", theme: "dusk",
    message: "You are more present than any feed could make you.",
    caption: "No accounts. No tracking. No feed." }
];

function promoHtml(w, h, layout) {
  // layout: "tile" (stacked) or "marquee" (horizontal)
  const bg = `radial-gradient(1000px 520px at 80% 12%, #1c4a4a 0%, rgba(28,74,74,0) 62%), linear-gradient(160deg, #0b1e2d 0%, #123141 45%, #16414a 100%)`;
  const horizontal = layout === "marquee";
  const icon = horizontal ? 210 : 118;
  const halo = Math.round(icon * 2.1);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
    .wrap{width:100%;height:100%;background:${bg};display:flex;
      flex-direction:${horizontal ? "row" : "column"};align-items:center;
      justify-content:center;gap:${horizontal ? "70px" : "26px"};
      font-family:-apple-system,'Segoe UI',Roboto,sans-serif;position:relative}
    .badge{position:relative;display:flex;align-items:center;justify-content:center}
    .badge::before{content:"";position:absolute;width:${halo}px;height:${halo}px;border-radius:50%;
      background:radial-gradient(circle, rgba(140,224,205,0.5) 0%, rgba(90,178,176,0.18) 42%, rgba(90,178,176,0) 70%);
      filter:blur(6px)}
    .badge img{position:relative;width:${icon}px;height:${icon}px;border-radius:24%;
      box-shadow:0 0 34px rgba(140,224,205,0.35), 0 18px 44px rgba(0,0,0,0.45)}
    .txt{display:flex;flex-direction:column;align-items:${horizontal ? "flex-start" : "center"};
      ${horizontal ? "" : "text-align:center"};position:relative}
    .name{color:#eafaf4;font-weight:600;font-size:${horizontal ? 88 : 42}px;letter-spacing:0.01em;line-height:1.02}
    .tag{color:#8ce0cd;font-weight:500;font-size:${horizontal ? 34 : 19}px;margin-top:${horizontal ? 18 : 9}px;letter-spacing:0.04em}
  </style></head><body>
    <div class="wrap">
      <div class="badge"><img src="${iconUrl}"></div>
      <div class="txt">
        <div class="name">Inner Peace</div>
        <div class="tag">The scroll ends here.</div>
      </div>
    </div></body></html>`;
}

(async () => {
  fs.mkdirSync(OUT_SHOTS, { recursive: true });
  fs.mkdirSync(OUT_PROMO, { recursive: true });
  const b = await chromium.launch({ channel: "chromium" });

  // Screenshots (1280x800)
  const page = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  for (const s of SHOTS) {
    await page.goto(calmUrl, { waitUntil: "domcontentloaded" });
    await page.evaluate(setState(), {
      theme: s.theme, message: s.message, panel: !!s.panel, blocked: s.blocked
    });
    if (s.omnibox) await page.evaluate(omniboxScript());
    if (s.caption) await page.evaluate(captionScript(), { text: s.caption, top: s.omnibox ? 92 : 38 });
    await page.waitForTimeout(350);
    await page.evaluate(() => { const h = document.getElementById("soundHint"); if (h) h.style.display = "none"; });
    await page.screenshot({ path: path.join(OUT_SHOTS, s.file) });
    console.log("shot", s.file);
  }
  await page.close();

  // Promo tile 440x280 + marquee 1400x560
  const specs = [
    { file: "promo-small-440x280.png", w: 440, h: 280, layout: "tile" },
    { file: "promo-marquee-1400x560.png", w: 1400, h: 560, layout: "marquee" }
  ];
  for (const sp of specs) {
    const p = await b.newPage({ viewport: { width: sp.w, height: sp.h }, deviceScaleFactor: 1 });
    await p.setContent(promoHtml(sp.w, sp.h, sp.layout), { waitUntil: "networkidle" });
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(OUT_PROMO, sp.file), clip: { x: 0, y: 0, width: sp.w, height: sp.h } });
    await p.close();
    console.log("promo", sp.file);
  }

  await b.close();
  console.log("done");
})();
