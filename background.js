/* Background service worker: turns the user's blocked-site list (chrome.storage)
   into dynamic declarativeNetRequest rules that redirect each site to calm.html.
   Site normalization/validation is shared with the calm page via sites.js. */

if (typeof importScripts === "function") {
  importScripts("sites.js");
}

const DEFAULT_SITES = ["instagram.com"];
const CALM_PAGE = "/calm.html";

function utils() {
  if (typeof self !== "undefined" && self.SiteUtils) return self.SiteUtils;
  return { normalizeSite: function (x) { return x; }, isValidSite: function () { return true; } };
}

function buildRules(sites) {
  return sites.map(function (site, i) {
    return {
      id: i + 1,
      priority: 1,
      action: { type: "redirect", redirect: { extensionPath: CALM_PAGE } },
      condition: { urlFilter: "||" + site, resourceTypes: ["main_frame"] }
    };
  });
}

async function applyRules(sites) {
  const U = utils();
  const clean = (sites || []).map(U.normalizeSite).filter(U.isValidSite);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(function (r) { return r.id; }),
    addRules: buildRules(clean)
  });
}

async function getSites() {
  const { blockedSites } = await chrome.storage.local.get({ blockedSites: null });
  return blockedSites;
}

async function ensureSeeded() {
  let sites = await getSites();
  if (!Array.isArray(sites)) {
    sites = DEFAULT_SITES.slice();
    await chrome.storage.local.set({ blockedSites: sites });
  }
  return sites;
}

async function refresh() {
  const sites = await ensureSeeded();
  await applyRules(sites);
}

// Register listeners only in the extension runtime (skipped when required by unit tests).
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(refresh);
  chrome.runtime.onStartup.addListener(refresh);
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "local" && changes.blockedSites) {
      applyRules(changes.blockedSites.newValue || []);
    }
  });
  // Toolbar click opens the calm page, the single home for all settings.
  if (chrome.action && chrome.action.onClicked) {
    chrome.action.onClicked.addListener(function () {
      chrome.tabs.create({ url: chrome.runtime.getURL("calm.html") });
    });
  }
}

// Exposed for unit tests (ignored in the extension runtime).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildRules };
}
