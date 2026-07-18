/* Calm page behaviour: one static message, clock, breath label, inline sound panel.
   A single audio instance is used throughout, so only one sound ever plays. */
(function () {
  var DEFAULTS = { enabled: true, sound: "waterfall", volume: 40 };
  var LABELS = {
    waterfall: "Waterfall", fountain: "Fountain", stream: "Stream", forest: "Forest",
    rain: "Rain", ocean: "Ocean", wind: "Wind"
  };

  var settings = Object.assign({}, DEFAULTS);
  var muted = false;

  /* ---------- one gentle reminder, chosen at load ---------- */
  var messages = [
    "You reached for something. Notice that you are here.",
    "This breath is happening. You are alive for it.",
    "Nothing needs scrolling right now. You are already whole.",
    "Feel your feet, your hands, the air. Come back to yourself.",
    "The moment you almost missed is this one. Stay in it.",
    "You are more present than any feed could make you.",
    "What did you actually want? It probably wasn't this.",
    "Rest here a second. The world will keep turning without a scroll."
  ];
  document.getElementById("message").textContent =
    messages[Math.floor(Math.random() * messages.length)];

  /* ---------- breath label ---------- */
  var label = document.getElementById("breathLabel");
  var inhale = true;
  setInterval(function () {
    inhale = !inhale;
    label.textContent = inhale ? "inhale" : "exhale";
  }, 5500);

  /* ---------- clock ---------- */
  function tick() {
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    var hh = (h % 12) || 12, mm = m < 10 ? "0" + m : m;
    document.getElementById("clock").textContent = hh + ":" + mm + " " + (h < 12 ? "AM" : "PM");
  }
  tick();
  setInterval(tick, 10000);

  /* ---------- audio + inline panel ---------- */
  var soundBtn = document.getElementById("soundBtn");
  var gearBtn = document.getElementById("gearBtn");
  var panel = document.getElementById("panel");
  var soundsEl = document.getElementById("sounds");
  var volEl = document.getElementById("volume");
  var volVal = document.getElementById("volVal");
  var hint = document.getElementById("soundHint");

  function updateBtn() {
    var on = settings.enabled && !muted && window.CalmAudio &&
             window.CalmAudio.state() === "running";
    soundBtn.textContent = on ? "🔊" : "🔈";
  }

  function save() {
    if (window.chrome && chrome.storage) chrome.storage.local.set(settings);
  }

  function playCurrent() {
    if (!window.CalmAudio) return;
    muted = false;
    window.CalmAudio.start(settings.sound, settings.volume / 100).then(function () {
      updateBtn();
      if (window.CalmAudio.state() === "suspended") { hint.style.display = "block"; armGesture(); }
    });
  }

  function armGesture() {
    function handler() {
      if (window.CalmAudio) window.CalmAudio.resume().then(updateBtn);
      hint.style.display = "none";
      updateBtn();
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    }
    window.addEventListener("pointerdown", handler);
    window.addEventListener("keydown", handler);
  }

  /* build soundscape chips */
  (window.CalmAudio ? window.CalmAudio.presets : ["waterfall"]).forEach(function (name) {
    var chip = document.createElement("button");
    chip.className = "sound-chip";
    chip.dataset.sound = name;
    chip.textContent = LABELS[name] || name;
    chip.addEventListener("click", function () {
      settings.sound = name;
      settings.enabled = true;
      markActive();
      save();
      playCurrent(); // switches the single instance instantly
    });
    soundsEl.appendChild(chip);
  });

  function markActive() {
    var chips = soundsEl.querySelectorAll(".sound-chip");
    for (var i = 0; i < chips.length; i++)
      chips[i].classList.toggle("active", chips[i].dataset.sound === settings.sound);
  }

  gearBtn.addEventListener("click", function () { panel.classList.toggle("open"); });

  soundBtn.addEventListener("click", function () {
    if (!window.CalmAudio) return;
    if (muted || window.CalmAudio.state() !== "running") {
      settings.enabled = true;
      if (window.CalmAudio.state() === "none") playCurrent();
      else { muted = false; window.CalmAudio.resume().then(function () {
        window.CalmAudio.setVolume(settings.volume / 100); updateBtn();
      }); }
      hint.style.display = "none";
      save();
    } else {
      muted = true;
      window.CalmAudio.stop();
      updateBtn();
    }
  });

  volEl.addEventListener("input", function () {
    settings.volume = parseInt(volEl.value, 10);
    volVal.textContent = settings.volume + "%";
    if (window.CalmAudio) window.CalmAudio.setVolume(settings.volume / 100); // live
  });
  volEl.addEventListener("change", save);

  /* ---------- blocked-site editor (same panel as sound) ---------- */
  var blkInput = document.getElementById("blkInput");
  var blkAdd = document.getElementById("blkAdd");
  var blkErr = document.getElementById("blkErr");
  var blkList = document.getElementById("blkList");
  var U = window.SiteUtils || {
    normalizeSite: function (x) { return (x || "").trim().toLowerCase(); },
    isValidSite: function () { return true; }
  };

  function getBlocked(cb) {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get({ blockedSites: [] }, function (r) {
        cb(Array.isArray(r.blockedSites) ? r.blockedSites : []);
      });
    } else { cb([]); }
  }
  function setBlocked(sites) {
    if (window.chrome && chrome.storage) chrome.storage.local.set({ blockedSites: sites });
  }

  function renderBlocked(sites) {
    blkList.innerHTML = "";
    if (!sites.length) {
      var d = document.createElement("div");
      d.className = "blk-empty";
      d.textContent = "No sites blocked yet.";
      blkList.appendChild(d);
      return;
    }
    sites.forEach(function (site) {
      var li = document.createElement("li");
      var span = document.createElement("span");
      span.className = "site"; span.textContent = site;
      var rm = document.createElement("button");
      rm.textContent = "\u2715"; rm.title = "Remove";
      rm.addEventListener("click", function () {
        getBlocked(function (cur) {
          setBlocked(cur.filter(function (s) { return s !== site; }));
        });
      });
      li.appendChild(span); li.appendChild(rm);
      blkList.appendChild(li);
    });
  }

  function addBlocked() {
    blkErr.textContent = "";
    var site = U.normalizeSite(blkInput.value);
    if (!U.isValidSite(site)) { blkErr.textContent = "Enter a valid domain, e.g. reddit.com"; return; }
    getBlocked(function (cur) {
      if (cur.indexOf(site) !== -1) { blkErr.textContent = site + " is already blocked."; return; }
      cur.push(site);
      setBlocked(cur);
      blkInput.value = "";
    });
  }

  blkAdd.addEventListener("click", addBlocked);
  blkInput.addEventListener("keydown", function (e) { if (e.key === "Enter") addBlocked(); });
  if (window.chrome && chrome.storage) {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area === "local" && changes.blockedSites) renderBlocked(changes.blockedSites.newValue || []);
    });
  }
  getBlocked(renderBlocked);

  /* ---------- init from saved settings ---------- */
  function init(s) {
    settings = Object.assign({}, DEFAULTS, s);
    volEl.value = settings.volume;
    volVal.textContent = settings.volume + "%";
    markActive();
    if (settings.enabled) playCurrent();
    else { muted = true; updateBtn(); }
  }
  if (window.chrome && chrome.storage) chrome.storage.local.get(DEFAULTS, init);
  else init(DEFAULTS);
})();
