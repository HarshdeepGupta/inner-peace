# Chrome Web Store — listing copy

Paste these into the Developer Dashboard when you create the item. Fields map to
the **Store listing**, **Privacy**, and **Distribution** tabs.

---

## Item name
Inner Peace

## Summary / short description (max 132 chars)
Redirect Instagram and other time-sinks to a calm breathing page with nature sounds. Block any site. No account, no tracking.

## Category
Well-being  (fallback: Workflow & Planning)

## Language
English (United States)

---

## Detailed description

You know the feeling. You opened a tab to do one thing, and somehow half an hour
was gone. You didn't decide to spend it. It just happened, and you surface feeling
a little emptier than before.

I got tired of losing hours I never chose to spend. So I built this.

Now when you open Instagram out of habit, it doesn't open. You get a slow breath,
a quiet reminder that you're alive right now, and a bit of nature sound. The pull
lets go, and a few seconds later you remember what you actually sat down to do.

WHAT IT DOES
• Redirects the sites you choose to a calm breathing page instead of loading them.
• Instagram is blocked out of the box. Add X, Reddit, YouTube, TikTok, or anything
  else, right from the calm page. No menus to dig through.
• Plays gentle nature soundscapes (waterfall, fountain, stream, forest, rain,
  ocean, wind) at a volume you set. One sound at a time.
• Three calm backgrounds: Calm, Sunny, Dusk. Pick your mood.
• A slow breathing circle and a rotating reminder to come back to the moment.

WHAT IT DOESN'T DO
• No accounts. No sign-up.
• No tracking, no analytics, no ads.
• Nothing leaves your browser. Your block list and settings are stored on your
  own device.

It's free and open source. Block whatever steals your time, and get a breath
instead of a feed.

Open source: https://github.com/HarshdeepGupta/inner-peace

---

## Privacy tab

### Single purpose (required)
Inner Peace helps you break the habit of visiting distracting websites by
redirecting the sites you choose to a calm breathing page hosted inside the
extension. That is its single purpose.

### Permission justifications

**declarativeNetRequest**
Used to redirect the websites you add to your block list to the extension's own
calm page. The redirect rules are built only from your block list and are
evaluated locally by the browser. No browsing data is read or collected.

**storage**
Stores your block list and your preferences (chosen sound, volume, and background
theme) locally on your device with chrome.storage.local, so they persist between
sessions. This data never leaves the browser.

**Host permissions (`*://*/*`)**
You can block any website you choose, so the extension needs match access across
sites to redirect requests to the domains on your block list. It only acts on the
domains you have added, does not read page content, and transmits nothing.

> Optional, to ease review: you can narrow risk by moving to
> `declarativeNetRequestWithHostAccess` or optional host permissions later. Broad
> host access is honest here because the user picks arbitrary sites to block.

### Data usage disclosures (check these)
- Does the extension collect or use user data? **No data is collected or transmitted.**
- Not sold or transferred to third parties (except for the required cases). ✔
- Not used or transferred for purposes unrelated to the single purpose. ✔
- Not used to determine creditworthiness or for lending. ✔

### Privacy policy URL (required)
Host `store/PRIVACY.md` and paste the URL here. Easiest options:
- Enable GitHub Pages on the repo, then link the rendered page, or
- Put the text in a public Gist and link that.

---

## Distribution tab
- Visibility: Public (or Unlisted for a soft launch, then flip to Public).
- Pricing: Free.
- Regions: All regions.

---

## Assets checklist (all generated in this folder)
- Store icon: `icons/icon128.png` (ships in the ZIP; a 128×128 is also uploaded in
  the listing). Optional polish: add ~16px transparent padding around the artwork.
- Screenshots (1280×800), upload 1–5: `store/screenshots/01…05*.png`
- Small promo tile (440×280, required): `store/promo/promo-small-440x280.png`
- Marquee (1400×560, optional, needed to be featured): `store/promo/promo-marquee-1400x560.png`
