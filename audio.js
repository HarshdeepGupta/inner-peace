/* Audio engine for the calm page.
   - "file" soundscapes loop real CC0 / public-domain recordings (sounds/*).
   - "synth" soundscapes are generated live with the Web Audio API.
   Only ever one sound plays at a time. Exposes window.CalmAudio. */
(function () {
  // Real recordings (see CREDITS.txt for licenses).
  var FILES = {
    waterfall: "sounds/waterfall.ogg",
    fountain:  "sounds/fountain.ogg",
    stream:    "sounds/stream.ogg",
    forest:    "sounds/forest.ogg"
  };
  // Order shown in the UI.
  var ORDER = ["waterfall", "fountain", "stream", "forest", "rain", "ocean", "wind"];

  var mode = "none";      // "file" | "synth" | "none"
  var fileEl = null;
  var fileBlocked = false;
  var vol = 0.2;

  /* ---------- Web Audio (synth) ---------- */
  var ctx = null, master = null, nodes = [], noiseBuffer = null;

  function ensureCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    return ctx;
  }
  function makeNoise() {
    if (noiseBuffer) return noiseBuffer;
    var len = Math.floor(ctx.sampleRate * 5);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuffer.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuffer;
  }
  function noiseSource() {
    var s = ctx.createBufferSource(); s.buffer = makeNoise(); s.loop = true; return s;
  }
  function stopSynth() {
    nodes.forEach(function (n) {
      try { if (n.stop) n.stop(); } catch (e) {}
      try { n.disconnect(); } catch (e) {}
    });
    nodes = [];
  }
  function lfo(param, base, depth, freq, type) {
    var osc = ctx.createOscillator(); osc.type = type || "sine"; osc.frequency.value = freq;
    var g = ctx.createGain(); g.gain.value = depth;
    osc.connect(g); g.connect(param); param.value = base; osc.start();
    nodes.push(osc, g);
  }

  var synth = {
    rain: function (out) {
      var s = noiseSource();
      var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1800;
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 9000;
      var g = ctx.createGain(); g.gain.value = 0.4;
      s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
      lfo(g.gain, 0.4, 0.12, 1.6);
      s.start(); nodes.push(s, hp, lp, g);
    },
    ocean: function (out) {
      var s = noiseSource();
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 550; lp.Q.value = 0.2;
      var g = ctx.createGain(); g.gain.value = 0.0;
      s.connect(lp); lp.connect(g); g.connect(out);
      lfo(g.gain, 0.5, 0.48, 0.09);
      lfo(lp.frequency, 550, 300, 0.09);
      s.start(); nodes.push(s, lp, g);
    },
    wind: function (out) {
      var s = noiseSource();
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380; lp.Q.value = 0.6;
      var g = ctx.createGain(); g.gain.value = 0.4;
      s.connect(lp); lp.connect(g); g.connect(out);
      lfo(lp.frequency, 380, 260, 0.05);
      lfo(g.gain, 0.4, 0.25, 0.06);
      s.start(); nodes.push(s, lp, g);
    }
  };

  /* ---------- file playback ---------- */
  function stopFile() {
    if (fileEl) { try { fileEl.pause(); } catch (e) {} fileEl = null; }
  }
  // Perceptual volume: cubic taper so the slider gives fine control at the
  // quiet end. Shared with unit tests via volume.js (window.CalmVolume).
  var curve = (window.CalmVolume && window.CalmVolume.curve) ||
    function (v) { v = Math.max(0, Math.min(1, v)); return v * v * v; };
  function applyVol() {
    var g = curve(vol);
    if (mode === "file" && fileEl) fileEl.volume = Math.min(1, g * 0.7);          // recordings
    else if (master) master.gain.setTargetAtTime(g * 0.5, ctx.currentTime, 0.25); // synth
  }

  var CalmAudio = {
    presets: ORDER,
    start: function (name, volume) {
      vol = volume;
      stopSynth(); stopFile();
      if (FILES[name]) {
        mode = "file";
        fileBlocked = false;
        fileEl = new Audio(FILES[name]);
        fileEl.loop = true;
        applyVol();
        var p = fileEl.play();
        if (p && p.catch) return p.catch(function () { fileBlocked = true; });
        return Promise.resolve();
      }
      mode = "synth";
      ensureCtx(); makeNoise();
      (synth[name] || synth.rain)(master);
      applyVol();
      if (ctx.state === "suspended") return ctx.resume();
      return Promise.resolve();
    },
    setVolume: function (volume) { vol = volume; applyVol(); },
    stop: function () {
      if (mode === "file") { if (fileEl) fileEl.pause(); }
      else if (master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    },
    resume: function () {
      if (mode === "file" && fileEl) { fileBlocked = false; return fileEl.play() || Promise.resolve(); }
      if (ctx) return ctx.resume();
      return Promise.resolve();
    },
    state: function () {
      if (mode === "file") return fileEl ? (fileEl.paused ? "suspended" : "running") : "none";
      if (mode === "synth") return ctx ? ctx.state : "none";
      return "none";
    }
  };

  window.CalmAudio = CalmAudio;
})();
