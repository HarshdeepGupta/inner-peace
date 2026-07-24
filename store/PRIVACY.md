# Privacy Policy — Inner Peace

_Last updated: 2026-07-24_

Inner Peace is a browser extension that redirects websites you choose to a calm
breathing page. This policy explains what it does with your data. The short
version: it doesn't collect any.

## What we collect
Nothing. Inner Peace has no accounts, no analytics, no tracking, and no ads.

## What is stored, and where
The extension stores two things locally on your own device using the browser's
`chrome.storage.local`:

- Your block list (the sites you choose to redirect).
- Your preferences: chosen soundscape, volume, and background theme.

This information never leaves your browser. It is not sent to us or to anyone
else, because there is no server to send it to.

## What is transmitted
Nothing is transmitted off your device. The extension does not make network
requests to any server we control. Bundled nature sounds are packaged inside the
extension and play locally.

## Permissions
- **declarativeNetRequest** is used to redirect the sites on your block list to
  the extension's local calm page. Rules are built only from your block list and
  run inside your browser.
- **storage** keeps your block list and settings on your device.
- **Host access** is required because you can block any site you choose; the
  extension only acts on the domains you add and does not read page content.

## Children's privacy
The extension collects no data from anyone, including children.

## Changes
If this policy ever changes, the updated version will be posted here.

## Contact
Questions: open an issue at
https://github.com/HarshdeepGupta/inner-peace/issues
