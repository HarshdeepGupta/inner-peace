"use strict";
const { test } = require("node:test");
const assert = require("node:assert");
const { curve } = require("../../volume.js");

test("curve maps endpoints to 0 and 1", () => {
  assert.equal(curve(0), 0);
  assert.equal(curve(1), 1);
});

test("curve is cubic (fine control at the quiet end)", () => {
  assert.ok(Math.abs(curve(0.5) - 0.125) < 1e-9);
  assert.ok(Math.abs(curve(0.25) - 0.015625) < 1e-9);
  // A slider at 40% yields a gentle gain well under a tenth of full.
  assert.ok(curve(0.4) < 0.1);
});

test("curve is monotonically increasing", () => {
  let prev = -1;
  for (let i = 0; i <= 100; i++) {
    const g = curve(i / 100);
    assert.ok(g >= prev, "not monotonic at " + i);
    prev = g;
  }
});

test("curve clamps out-of-range and non-numeric input", () => {
  assert.equal(curve(-1), 0);
  assert.equal(curve(2), 1);
  assert.equal(curve(NaN), 0);
  assert.equal(curve("not a number"), 0);
});
