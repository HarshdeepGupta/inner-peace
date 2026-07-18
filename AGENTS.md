# Inner Peace: details & contributor guide

A gentle Manifest V3 browser extension that redirects distracting sites to a calm
breathing page. This file holds everything that doesn't belong on the landing
README: install-from-source, usage, development, project layout, and licensing.

## How it works

When you open a blocked site, `declarativeNetRequest` intercepts the navigation
*before* the network request and redirects it to `calm.html`. Because it fires
before DNS/network, it works even on HSTS-preloaded sites. Redirect rules are
built dynamically from your block list (`background.js`).

## Install from source (load unpacked)

No build step. The extension is plain HTML/CSS/JS.

1. Clone the repo:
   ```
   git clone https://github.com/HarshdeepGupta/inner-peace.git
   ```
2. Open `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the cloned folder.
5. (Recommended) Pin the toolbar icon via the 🧩 puzzle-piece menu.

To update later: `git pull`, then click **Reload** (⟳) on the extension's card.

## Using it

**Reaching your settings, any of these three, so you're never locked out:**

- Click the **toolbar icon**.
- `chrome://extensions` → the extension's **Details** → **Extension options**.
- Visit `chrome-extension://<extension-id>/calm.html` directly.

**On the calm page**, click **⚙** (top-left) to open the panel:

- **Soundscape**: pick a sound; it switches instantly. Only one plays at a time.
- **Volume**: drag the slider (a cubic curve keeps the quiet end gentle).
- **Blocked sites**: type a domain (e.g. `reddit.com`) and **Add**, or **✕** to
  remove. Changes apply immediately.

The **🔈 / 🔊** button toggles sound. Browsers block audible autoplay until you
interact with the page, so you may see a "click anywhere to let the sound in"
hint the first time.

### Optional: system-wide block (all browsers/apps)

The extension only covers Chromium browsers. For a stronger, system-wide block,
point a domain at `0.0.0.0` in your OS hosts file
(`C:\Windows\System32\drivers\etc\hosts` on Windows, `/etc/hosts` elsewhere).
This needs admin rights and shows a dead page rather than the calm page, so use
it only for sites you want hard-locked.

## Development

Tests are plain JavaScript, no TypeScript, no framework lock-in.

```
npm install            # installs Playwright (the only dev dependency)
npm run test:unit      # Node's built-in test runner (pure functions)
npm run test:e2e       # Playwright: loads the extension in Chromium
npm test               # both
npm run record:gifs    # re-record the hero + block-list GIFs
npm run record:redirect # re-record the live address-bar redirect GIF
```

- **Unit tests** (`test/unit/`) cover `sites.js` (normalize/validate),
  `background.js` (`buildRules`), and the `volume.js` curve.
- **E2E tests** (`test/e2e/`) load the unpacked extension in Chromium and verify
  redirects and the in-page add/remove flow against a local server (no external
  network).

### Project structure

```
manifest.json     MV3 manifest (background worker, options page, action)
background.js     builds dynamic redirect rules from the block list
sites.js          shared site normalize/validate helpers
calm.html/.js     the calm page + all settings UI
audio.js          soundscape engine (file playback + synthesis)
volume.js         perceptual volume curve (shared with tests)
icons/            pea-pod icon set
sounds/           licensed nature recordings (see CREDITS.txt)
assets/           README GIFs (recorded via tools/record-gifs.js)
tools/            dev scripts (GIF recorder)
test/             unit + e2e tests
```

## Roadmap

- Friction on removing a blocked site (e.g. a cooling-off delay) so blocks resist
  impulse.
- Chrome Web Store listing (branding art, privacy policy, permission
  justifications).
- Optionally narrow `host_permissions` before publishing.

## Licensing

- **Code:** MIT, see [LICENSE](LICENSE).
- **Audio:** third-party works under their own licenses (CC0 / public domain /
  CC BY-SA 3.0). See [CREDITS.txt](CREDITS.txt). Note `sounds/waterfall.ogg` is
  CC BY-SA 3.0 (attribution + share-alike); for a fully attribution-free build,
  swap it for a CC0/public-domain or synthesized sound.
