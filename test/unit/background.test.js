"use strict";
const { test } = require("node:test");
const assert = require("node:assert");
const { buildRules } = require("../../background.js");
const { normalizeSite, isValidSite } = require("../../sites.js");

test("normalizeSite strips scheme, path, port, www and lowercases", () => {
  assert.equal(normalizeSite("https://www.Instagram.com/foo/bar"), "instagram.com");
  assert.equal(normalizeSite("INSTAGRAM.COM"), "instagram.com");
  assert.equal(normalizeSite("  reddit.com/r/all  "), "reddit.com");
  assert.equal(normalizeSite("http://example.com:8080"), "example.com");
  assert.equal(normalizeSite("www.news.ycombinator.com"), "news.ycombinator.com");
});

test("normalizeSite handles empty / nullish input", () => {
  assert.equal(normalizeSite(""), "");
  assert.equal(normalizeSite(null), "");
  assert.equal(normalizeSite(undefined), "");
});

test("isValidSite accepts real domains", () => {
  for (const s of ["instagram.com", "a.b.co", "news.ycombinator.com", "x-y.co.uk"]) {
    assert.equal(isValidSite(s), true, s);
  }
});

test("isValidSite rejects non-domains", () => {
  for (const s of ["", "localhost", "notadomain", "has space.com", "http://x.com"]) {
    assert.equal(isValidSite(s), false, s);
  }
});

test("buildRules produces one DNR redirect rule per site", () => {
  const rules = buildRules(["instagram.com", "reddit.com"]);
  assert.equal(rules.length, 2);

  assert.deepEqual(rules[0], {
    id: 1,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/calm.html" } },
    condition: { urlFilter: "||instagram.com", resourceTypes: ["main_frame"] }
  });

  assert.equal(rules[1].id, 2);
  assert.equal(rules[1].condition.urlFilter, "||reddit.com");
});

test("buildRules returns empty array for no sites", () => {
  assert.deepEqual(buildRules([]), []);
});
