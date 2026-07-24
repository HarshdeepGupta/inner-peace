# Launch + marketing plan — Inner Peace

A free, open-source tool. The goal is reach, not revenue, so the plan leans on
communities that actually want this and on your own writing.

## Before launch (do once)
- [ ] Register the developer account and pay the $5: https://chrome.google.com/webstore/devconsole
- [ ] Host `store/PRIVACY.md` (GitHub Pages or a Gist) and grab the URL.
- [ ] Build the upload ZIP: `pwsh store/package.ps1` (see that file).
- [ ] Create the item, upload the ZIP, paste copy from `store/LISTING.md`, upload
      the screenshots + promo tile + marquee.
- [ ] Submit for review. Reviews can take a few days. Do NOT announce a date until
      it is live (or use "deferred publish" so you control the go-live moment).

## Launch day
Post in this order, spaced across the day so you can reply to each:

1. Product Hunt (morning, 12:01am PT is traditional but not required).
2. Show HN.
3. One or two subreddits that fit.
4. X and LinkedIn.
5. A short Substack note linking the two posts you already wrote.

Reply to every comment for the first few hours. Early engagement is most of the
game on PH and HN.

---

## Product Hunt

**Name:** Inner Peace
**Tagline (60 char max):** The scroll ends here
**Topics:** Productivity, Chrome Extensions, Wellness

**First comment (maker's story):**
I built this because I kept losing hours I never chose to spend. I'd open a tab to
do one thing and surface half an hour later on Instagram, feeling emptier.

Inner Peace redirects the sites you pick to a calm breathing page instead of
loading them. You get a slow breath, a quiet reminder, and some nature sound, and
the pull just lets go. Instagram is blocked out of the box; add anything else from
the page itself.

No accounts, no tracking, nothing leaves your browser. It's free and open source.
I'd love to hear what sites you end up blocking, and what would make the pause
land better for you.

**Gallery:** use the five screenshots in `store/screenshots/`, lead with the hero.

---

## Show HN (Hacker News)

**Title:** Show HN: Inner Peace – redirect time-sink sites to a calm breathing page

**Body:**
I kept opening Instagram out of habit and losing half an hour without deciding to.
So I built a small Chrome/Edge extension that redirects the sites I choose to a
calm breathing page instead of loading them. A slow breath, a short reminder, some
nature sound, and the urge passes.

It's MV3, no accounts, no analytics, nothing leaves the browser. Block list and
settings live in chrome.storage.local. Blocking any site needs broad host match
access to redirect it; it reads no page content. Sounds are bundled and play
locally, three are CC0/PD and one is CC BY-SA (credited).

Source: https://github.com/HarshdeepGupta/inner-peace
Store: <paste live link>

Happy to talk about the redirect approach (declarativeNetRequest dynamic rules) or
the audio (a few files plus real-time synthesis for rain/ocean/wind).

> Note: HN dislikes hype. Keep it technical and plain, and answer questions.

---

## Reddit

Read each sub's self-promotion rules first. Lead with the story, link at the end,
and say plainly that you made it. Good fits:
- r/nosurf
- r/digitalminimalism
- r/productivity
- r/getdisciplined

**Post title:** I got tired of losing hours to Instagram, so I made a free tool
that redirects it to a breathing page

**Body:**
Willpower never worked for me. I'd open a tab and surface half an hour later on a
feed I didn't decide to open. So I built a small extension: the sites you pick
don't load, you get a breath and a reminder instead, and the pull lets go.

It's free and open source, no accounts, no tracking. Instagram is blocked by
default and you can add any site from the page. Would love feedback from people who
have fought this same pull.

Link: <store link> (source on GitHub if you'd rather load it unpacked)

---

## X

**Single post:**
I kept losing hours to Instagram without deciding to.

So I built Inner Peace: a free extension that redirects the sites you pick to a
calm breathing page. A breath, a reminder, some nature sound, and the urge passes.

No accounts. No tracking. Open source.

<store link>

**Optional thread (2–4 posts):** the story, then a screenshot, then how it works
(redirect + block any site + sounds/themes), then the link and "it's free."

---

## LinkedIn

Frame it as a build story (this tends to travel further there than a plain plug):

I write software for a living, which means I know exactly how these feeds are
built to hold attention. Knowing didn't help. I still lost hours to Instagram I
never chose to spend.

So I built a small thing for myself and I'm sharing it. Inner Peace redirects the
sites you pick to a calm breathing page instead of loading them. A breath, a
reminder, some nature sound. The pull lets go.

Free, open source, no tracking. If you've felt that same half-hour disappear,
try it: <store link>

---

## Substack
You already have two posts. Add a one-line note when the store link is live, and
drop the store link into the Inner Peace post's intro/outro.
- Post 1 (published): "How to find inner peace" → links the repo; add the store link.
- Post 2: README-as-landing-page → cross-promotes the writing-craft skill.

---

## After launch
- Ask a few friends to try it and leave an honest store review (reviews help
  ranking and trust). Don't fake them.
- Watch the PH/HN/Reddit threads for the most common request; ship one small
  improvement and reply to the people who asked. That's the Kaizen loop and it
  also brings people back.
- If it gets traction, make the marquee count: extensions can only be featured if
  the 1400×560 marquee is uploaded (it is, in `store/promo/`).
