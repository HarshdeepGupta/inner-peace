/* Perceptual volume curve, shared by the audio engine and unit tests.
   Cubic taper so most of the slider's travel lives in the quiet range,
   giving fine control at low volumes. Recordings are loudness-matched,
   so a single curve fits every soundscape.
   Input/output are both normalized to [0, 1]. */
(function (root) {
  function curve(v) {
    v = Number(v);
    if (!isFinite(v)) v = 0;
    v = Math.max(0, Math.min(1, v));
    return v * v * v;
  }
  var api = { curve: curve };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CalmVolume = api;
})(typeof window !== "undefined" ? window : null);
