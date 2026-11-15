/* The Mirror That Still Answers — opening and chapter 1.
   Team Unsigned Int, NASA Space Apps Challenge 2026.
   Code written with an AI coding assistant, directed and reviewed by the team.
   Data: window.LLR, real lunar laser ranging measurements (NASA CDDIS / ILRS). */

(function () {
  "use strict";

  var W = 1280, H = 720;
  var SPEED_OF_LIGHT_KM_S = 299792.458;
  var STATIONS = { GRSM: "Grasse, France", APOL: "Apache Point, New Mexico" };

  var $ = function (id) { return document.getElementById(id); };
  var stage = $("stage"), sky = $("sky"), chart = $("chart"), base = $("base");
  var mirror = $("mirror"), balloon = $("balloon"), balloonText = $("balloonText");
  var card = $("card"), cardText = $("cardText");
  var readout = $("readout"), timer = $("timer"), note = $("readoutNote");
  var sendBtn = $("send"), againBtn = $("again");
  var ctx = sky.getContext("2d");
  var obs = $("obs"), photonLayer = $("photons");

  // Each row: [utc, station, round trip seconds, one-way km, photons]
  var DATA = window.LLR.map(function (r) {
    return { t: Date.parse(r[0]), utc: r[0], station: r[1], tof: r[2], km: r[3], photons: r[4] };
  });
  var shot = DATA[DATA.length - 1]; // the most recent measurement goes first
  var shotsFired = 0;

  // ---------- helpers ----------
  function show(el) { el.classList.remove("hidden"); }
  function hide(el) { el.classList.add("hidden"); }
  // Jumping to a chapter cancels the scene that was playing: every timer checks this run number
  var runId = 0, ABORT = { abort: true };
  window.addEventListener("unhandledrejection", function (e) { if (e.reason === ABORT) e.preventDefault(); });
  function guard(p) { return p.catch(function (e) { if (e !== ABORT) console.error(e); }); }
  function wait(ms) {
    var id = runId;
    return new Promise(function (res, rej) { setTimeout(function () { if (id === runId) res(); else rej(ABORT); }, ms); });
  }
  function fmtDate(ms) {
    return new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  }
  function fmtKm(km) { return Math.round(km).toLocaleString("en-US") + " km"; }

  // Resolves on click, Space or Enter; or after `auto` ms if given
  function advance(el, auto, until) {
    var id = runId;
    return new Promise(function (res, rej) {
      var done = false, to = null;
      function finish() {
        if (done) return;
        done = true;
        el.removeEventListener("click", finish);
        document.removeEventListener("keydown", onKey);
        if (to) clearTimeout(to);
        if (id === runId) res(); else rej(ABORT);
      }
      function onKey(e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); finish(); } }
      el.addEventListener("click", finish);
      document.addEventListener("keydown", onKey);
      if (auto) to = setTimeout(finish, auto);
      if (until) until.then(finish);
    });
  }

  // ---------- fit the stage to the window ----------
  var scale = 1, weave = { x: 0, y: 0 };
  function applyStage() {
    stage.style.transform = "translate(-50%, -50%) translate(" + weave.x.toFixed(2) + "px, " + weave.y.toFixed(2) + "px) scale(" + scale + ")";
  }
  function fit() {
    scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    applyStage();
  }
  window.addEventListener("resize", fit);
  fit();
  // Browsers without overflow: clip could still scroll the stage when a button gets focus
  stage.addEventListener("scroll", function () { stage.scrollTop = 0; stage.scrollLeft = 0; });

  // ---------- old film look: grain, flicker, scratches, dust and a shaky frame ----------
  var fxOn = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var grainEl = $("grain"), film = $("film"), fctx = film.getContext("2d"), fxBtn = $("fx");
  (function () {
    var c = document.createElement("canvas");
    c.width = c.height = 256;
    var g = c.getContext("2d"), img = g.createImageData(256, 256);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    grainEl.style.backgroundImage = "url(" + c.toDataURL() + ")";
  })();

  var scratches = [];
  function filmFrame() {
    grainEl.style.backgroundPosition = Math.floor(Math.random() * 256) + "px " + Math.floor(Math.random() * 256) + "px";
    // the frame never sits perfectly still in an old projector
    weave.x = (Math.random() - 0.5) * 0.8;
    weave.y = (Math.random() - 0.5) * 0.8;
    if (Math.random() < 0.02) weave.y += Math.random() < 0.5 ? -1.5 : 1.5;
    applyStage();

    fctx.clearRect(0, 0, 640, 360);
    // flicker: kept gentle on purpose
    var f = Math.random();
    if (f < 0.45) { fctx.fillStyle = "rgba(0,0,0," + (Math.random() * 0.035).toFixed(3) + ")"; fctx.fillRect(0, 0, 640, 360); }
    else if (f > 0.965) { fctx.fillStyle = "rgba(255,255,255,0.045)"; fctx.fillRect(0, 0, 640, 360); }
    // vertical scratches that live for a few frames
    if (Math.random() < 0.035 && scratches.length < 2) {
      scratches.push({ x: Math.random() * 640, life: 4 + Math.random() * 22, light: Math.random() < 0.7 });
    }
    scratches = scratches.filter(function (s) { return s.life-- > 0; });
    scratches.forEach(function (s) {
      s.x += (Math.random() - 0.5) * 1.2;
      fctx.strokeStyle = s.light ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.25)";
      fctx.lineWidth = 0.6;
      fctx.beginPath();
      fctx.moveTo(s.x, 0);
      fctx.lineTo(s.x + (Math.random() - 0.5) * 2, 360);
      fctx.stroke();
    });
    // dust specks and hairs
    var n = Math.random() < 0.15 ? 1 : 0;
    for (var i = 0; i < n; i++) {
      var x = Math.random() * 640, y = Math.random() * 360;
      if (Math.random() < 0.72) {
        fctx.fillStyle = "rgba(0,0,0,0.6)";
        fctx.beginPath();
        fctx.arc(x, y, 0.6 + Math.random() * 1.8, 0, 6.2832);
        fctx.fill();
      } else {
        fctx.strokeStyle = "rgba(0,0,0,0.5)";
        fctx.lineWidth = 0.5;
        fctx.beginPath();
        fctx.moveTo(x, y);
        fctx.quadraticCurveTo(x + 6 - Math.random() * 12, y + 5, x + 10 - Math.random() * 20, y + 12);
        fctx.stroke();
      }
    }
  }
  function setFx(on) {
    fxOn = on;
    stage.classList.toggle("nofx", !on);
    fxBtn.textContent = "Old film look: " + (on ? "on" : "off");
    fxBtn.setAttribute("aria-pressed", on ? "true" : "false");
    if (!on) { weave.x = weave.y = 0; applyStage(); fctx.clearRect(0, 0, 640, 360); }
  }
  setFx(fxOn);
  fxBtn.addEventListener("click", function (e) { e.stopPropagation(); setFx(!fxOn); });
  setInterval(function () { if (fxOn) filmFrame(); }, 83); // twelve times a second

  // ---------- iris wipe, the classic way old cartoons change scene ----------
  var irisEl = $("iris");
  function iris(cx, cy, from, to, ms) {
    var id = runId;
    return new Promise(function (res, rej) {
      irisEl.style.display = "block";
      var frames = Math.max(2, Math.round(ms / 42)), i = 0;
      (function tick() {
        if (id !== runId) { rej(ABORT); return; }
        var r = from + (to - from) * (i / frames);
        irisEl.style.background = "radial-gradient(circle at " + cx + "px " + cy + "px, rgba(0,0,0,0) " + r + "px, #000 " + (r + 3) + "px)";
        if (i++ < frames) setTimeout(tick, 42);
        else { if (to > 1000) irisEl.style.display = "none"; res(); }
      })();
    });
  }

  // ---------- motion helpers: Disney's principles of animation ----------
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EASE = {
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",   // slow in and slow out
    out: "cubic-bezier(0.22, 1, 0.36, 1)",
    back: "cubic-bezier(0.34, 1.56, 0.64, 1)"  // overshoot, then settle
  };
  function anim(el, frames, opts) {
    if (REDUCED) return Promise.resolve();
    return el.animate(frames, opts).finished.catch(function () {});
  }

  // ---------- the Mirror's face ----------
  function setMouth(m) { mirror.setAttribute("data-mouth", m); }
  function setEyes(e) { mirror.setAttribute("data-eyes", e); }
  setInterval(function () {
    if (mirror.getAttribute("data-eyes") !== "open") return;
    mirror.classList.add("blink");
    setTimeout(function () { mirror.classList.remove("blink"); }, 150);
  }, 3400);

  // ---------- the voice: lines recorded by the team; the mouth follows their loudness ----------
  var muted = false, currentVoice = null;
  function voiceLevel(n, sec) {
    var v = window.VOICE && window.VOICE[n];
    if (!v) return 0;
    var i = Math.floor(sec * 12) * 2;   // read on twos: the mouth changes 12 times a second
    return v.env[Math.min(i, v.env.length - 1)] || 0;
  }
  function mouthFor(level) {
    if (level < 0.12) return "closed";
    if (level < 0.4) return "small";
    if (level < 0.84) return "open";
    return "oh";
  }
  function playVoice(n, onLevel) {
    return new Promise(function (res) {
      var v = window.VOICE && window.VOICE[n];
      if (!v) { res(); return; }
      var a = new Audio("assets/voice/" + (n < 10 ? "0" : "") + n + ".mp3?v=" + window.BUILD);
      a.muted = muted;
      currentVoice = a;
      var done = false, raf = 0, silent = false, t0 = performance.now();
      function finish() {
        if (done) return;
        done = true;
        cancelAnimationFrame(raf);
        if (onLevel) onLevel(0);
        if (currentVoice === a) currentVoice = null;
        res();
      }
      a._finish = finish;
      a.addEventListener("ended", finish);
      a.addEventListener("error", function () { silent = true; });
      // if the browser refuses to play, keep the timing of the line anyway
      a.play().catch(function () { silent = true; });
      (function tick() {
        var sec = silent ? (performance.now() - t0) / 1000 : a.currentTime;
        if (onLevel) onLevel(voiceLevel(n, sec));
        if (silent && sec >= v.d) { finish(); return; }
        raf = requestAnimationFrame(tick);
      })();
    });
  }
  function stopVoice() {
    if (!currentVoice) return;
    currentVoice.pause();
    currentVoice._finish();
  }
  var muteBtn = $("mute");
  muteBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    muted = !muted;
    if (currentVoice) currentVoice.muted = muted;
    muteBtn.textContent = "Sound: " + (muted ? "off" : "on");
    muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
  });

  // ---------- Shot A: the sky ----------
  var earthImg = new Image(), moonImg = new Image();
  earthImg.src = "assets/earth.png";
  moonImg.src = "assets/moon.png";
  var photonImg = new Image();
  photonImg.src = "assets/art/foton_rapido.png";

  var EARTH = { x: 150, y: 650, r: 330 };
  var MOON = { x: 1060, y: 215, r: 100 };
  // The telescope stands on Earth's edge, tilted so that its tube points at the Moon.
  // The beam leaves the tip of the tube and lands on the Moon.
  var PHI = 25 * Math.PI / 180;
  var BASE = { x: EARTH.x + Math.sin(PHI) * EARTH.r * 0.97, y: EARTH.y - Math.cos(PHI) * EARTH.r * 0.97 };
  var A = { x: BASE.x + 69.7, y: BASE.y - 58.5 };
  var ang = Math.atan2(MOON.y - A.y, MOON.x - A.x);
  var B = { x: MOON.x - Math.cos(ang) * MOON.r * 0.45, y: MOON.y - Math.sin(ang) * MOON.r * 0.45 };
  obs.style.left = (BASE.x - 46) + "px";
  obs.style.top = (BASE.y - 95 + 5) + "px";
  obs.style.transform = "rotate(" + PHI + "rad)";

  function obsPose(sx, sy, tilt, offset) {
    var f = { transform: "rotate(" + (PHI + (tilt || 0)) + "rad) scale(" + sx + ", " + sy + ")" };
    if (offset !== undefined) f.offset = offset;
    return f;
  }
  var obsIdle = null;
  function obsBreathe() {
    if (REDUCED) return;
    if (obsIdle) obsIdle.cancel();
    obsIdle = obs.animate([obsPose(1, 1), obsPose(1.035, 0.965, -0.02)],
      { duration: 1100, direction: "alternate", iterations: Infinity, easing: EASE.inOut });
  }
  function obsStop() { if (obsIdle) { obsIdle.cancel(); obsIdle = null; } }
  // Anticipation: it crouches and leans back before firing, and holds the pose for a moment
  function obsWindUp() {
    obsStop();
    return anim(obs, [obsPose(1, 1, 0, 0), obsPose(1.16, 0.78, -0.14, 0.72), obsPose(1.18, 0.76, -0.15, 1)],
      { duration: 560, easing: EASE.inOut });
  }
  // Action and follow-through: it stretches as it fires, recoils, overshoots and settles
  function obsFire() {
    anim(obs, [obsPose(0.84, 1.24, 0.07, 0), obsPose(1.1, 0.88, -0.05, 0.28), obsPose(0.97, 1.05, 0.02, 0.58),
      obsPose(1.01, 0.99, 0, 0.8), obsPose(1, 1, 0, 1)], { duration: 820, easing: EASE.out }).then(obsBreathe);
  }
  // It catches the light coming home: squash on impact, then rebound
  function obsCatch() {
    obsStop();
    return anim(obs, [obsPose(1, 1, 0, 0), obsPose(1.14, 0.84, -0.04, 0.22), obsPose(0.95, 1.07, 0.02, 0.55), obsPose(1, 1, 0, 1)],
      { duration: 640, easing: EASE.out }).then(obsBreathe);
  }

  // The photons that came home: one small character for each (up to 70 on screen)
  function clearPhotons() { photonLayer.innerHTML = ""; }
  function spawnPhotons(n) {
    clearPhotons();
    var count = Math.min(n, 70);
    var cx = A.x + Math.cos(ang) * 190, cy = A.y + Math.sin(ang) * 190 + 70;
    for (var i = 0; i < count; i++) {
      var im = document.createElement("img");
      im.src = "assets/art/foton_" + (i % 5 === 4 ? "cansado" : "feliz") + ".png";
      im.alt = "";
      var a = Math.random() * 6.2832, r = Math.sqrt(Math.random());
      var tx = cx + Math.cos(a) * r * 150, ty = cy + Math.sin(a) * r * 80;
      im.style.left = (tx - 18) + "px";
      im.style.top = (ty - 18) + "px";
      im.style.animationDelay = (i * 37 % 700) + "ms";
      photonLayer.appendChild(im);
      if (REDUCED) continue;
      // Arcs and overlapping action: each photon pops out of the telescope and flies to its
      // place along a curve, a moment after the one before it, then squashes as it lands.
      var dx = A.x - tx, dy = A.y - ty, lift = 60 + Math.random() * 70, frames = [];
      for (var f = 0; f <= 5; f++) {
        var u = f / 5, inv = 1 - u;
        var bx = dx * inv * inv + dx * 0.5 * 2 * inv * u;
        var by = dy * inv * inv + (dy * 0.5 - lift) * 2 * inv * u;
        frames.push({ transform: "translate(" + bx.toFixed(1) + "px, " + by.toFixed(1) + "px) scale(" + (0.25 + 0.75 * u).toFixed(2) + ")",
          opacity: f === 0 ? 0 : 1, offset: u * 0.7 });
      }
      frames.push({ transform: "translate(0px, 0px) scale(1.3, 0.78)", opacity: 1, offset: 0.82 });
      frames.push({ transform: "translate(0px, 0px) scale(0.92, 1.1)", opacity: 1, offset: 0.92 });
      frames.push({ transform: "translate(0px, 0px) scale(1)", opacity: 1, offset: 1 });
      im.animate(frames, { duration: 760, delay: i * 26, easing: "linear", fill: "backwards" });
    }
  }

  var stars = [];
  (function () {
    var seed = 1969;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < 260; i++) stars.push({ x: rnd() * W, y: rnd() * H, r: 0.4 + rnd() * 1.3, p: rnd() * 6.28 });
  })();

  var flight = null; // { start, tof, done }
  var muzzleAt = -1;

  function drawSky(now) {
    ctx.fillStyle = "#020308";
    ctx.fillRect(0, 0, W, H);
    // stars twinkle in steps, like drawings being swapped
    var tw = Math.floor(now / 250);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      ctx.globalAlpha = 0.3 + 0.6 * (((i * 7919 + tw * 104729) % 97) / 97);
      if (i % 11 === 0) {
        var q = s.r * 3.4;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s.x - q, s.y); ctx.lineTo(s.x + q, s.y);
        ctx.moveTo(s.x, s.y - q); ctx.lineTo(s.x, s.y + q);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // Follow-through: the Moon squashes a little when the light lands, then wobbles back
    var mb = flight ? Math.min((now - flight.start) / 1000, flight.tof) - flight.tof / 2 : -1;
    var msx = 1, msy = 1;
    if (mb >= 0 && mb < 0.7) {
      var wv = Math.sin(mb * 26) * Math.exp(-mb * 7) * 0.07;
      msx = 1 + wv; msy = 1 - wv;
    }
    if (moonImg.complete) ctx.drawImage(moonImg, MOON.x - MOON.r * msx, MOON.y - MOON.r * msy, MOON.r * 2 * msx, MOON.r * 2 * msy);
    if (earthImg.complete) ctx.drawImage(earthImg, EARTH.x - EARTH.r, EARTH.y - EARTH.r, EARTH.r * 2, EARTH.r * 2);

    if (flight) {
      var el = Math.min((now - flight.start) / 1000, flight.tof);
      var p = (el / flight.tof) * 2;                    // 0..1 going out, 1..2 coming home
      var elq = Math.floor(el * 24) / 24;               // drawn 24 times a second, like film
      var pq = Math.min((elq / flight.tof) * 2, 2);
      var k = pq <= 1 ? pq : 2 - pq;                    // position along the path
      var px = A.x + (B.x - A.x) * k, py = A.y + (B.y - A.y) * k;
      var back = pq > 1;
      var dir = back ? ang + Math.PI : ang;
      var step = Math.floor(now / 83);

      if (!flight.done) {
        // speed lines behind the photon: three ink strokes, redrawn on every step
        ctx.lineCap = "round";
        for (var j = -1; j <= 1; j++) {
          var len = 60 + ((step * 31 + (j + 2) * 17) % 70);
          var sx = px - Math.cos(dir) * 30 + Math.cos(dir + 1.5708) * j * 14;
          var sy = py - Math.sin(dir) * 30 + Math.sin(dir + 1.5708) * j * 14;
          var ex = sx - Math.cos(dir) * len, ey = sy - Math.sin(dir) * len;
          ctx.strokeStyle = "#111"; ctx.lineWidth = 10;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
          ctx.strokeStyle = "#ffe07a"; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        }
        // the photon itself, squashing and stretching as it flies
        if (photonImg.complete) {
          var wob = step % 2 ? 1.13 : 1;
          var launch = Math.max(0, 1 - el / 0.18);   // extra stretch right after it leaves
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(ang);
          ctx.scale((back ? -1 : 1) * 1.1 * wob * (1 + 0.6 * launch), 0.94 / wob * (1 - 0.3 * launch));
          ctx.drawImage(photonImg, -36, -39, 72, 78);
          ctx.restore();
        }
      }
      // a starburst on the Moon when the light arrives: five drawings
      var sinceHit = el - flight.tof / 2;
      if (sinceHit > 0 && sinceHit < 0.42) {
        var fr = Math.floor(sinceHit * 12);
        var R = [18, 36, 50, 42, 26][fr] || 20;
        ctx.beginPath();
        for (var v = 0; v < 18; v++) {
          var rr = v % 2 ? R * 0.48 : R;
          var aa = v * Math.PI / 9 + (fr % 2) * 0.17;
          ctx[v ? "lineTo" : "moveTo"](B.x + Math.cos(aa) * rr, B.y + Math.sin(aa) * rr);
        }
        ctx.closePath();
        ctx.fillStyle = "#ffe07a"; ctx.fill();
        ctx.strokeStyle = "#111"; ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.stroke();
      }
      // readout
      if (!flight.done) {
        timer.textContent = el.toFixed(3) + " s";
        if (p >= 1 && !flight.hit) {
          flight.hit = true;
          note.innerHTML = "It reached the mirror. Now it is coming home…";
        }
        if (el >= flight.tof) {
          flight.done = true;
          timer.textContent = flight.tof.toFixed(6) + " s";
          flight.resolve();
        }
      }
    }
    // Muzzle flash at the telescope: three drawings and a puff ring
    var sm = (now - muzzleAt) / 1000;
    if (muzzleAt > 0 && sm >= 0 && sm < 0.28) {
      var mf = Math.floor(sm * 12);
      var MR = [30, 22, 13, 9][mf] || 9;
      ctx.beginPath();
      for (var w = 0; w < 14; w++) {
        var r2 = w % 2 ? MR * 0.45 : MR;
        var a2 = ang + w * Math.PI / 7;
        ctx[w ? "lineTo" : "moveTo"](A.x + Math.cos(a2) * r2, A.y + Math.sin(a2) * r2);
      }
      ctx.closePath();
      ctx.fillStyle = "#fff6c8"; ctx.fill();
      ctx.strokeStyle = "#111"; ctx.lineWidth = 3.5; ctx.lineJoin = "round"; ctx.stroke();
      ctx.strokeStyle = "rgba(244, 236, 216, " + Math.max(0, 0.8 - sm * 3).toFixed(2) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(A.x, A.y, 14 + sm * 160, 0, 6.2832); ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "13px Arial, sans-serif";
    ctx.fillText("Earth: NASA AS17-148-22727 (1972). Moon: NASA art002e009057 (Artemis II, 2026). Sizes and distance not to scale.", 16, H - 12);
  }

  (function loop(now) {
    if (!sky.classList.contains("hidden")) drawSky(now || 0);
    requestAnimationFrame(loop);
  })();

  function fire(m) {
    return new Promise(function (resolve) {
      flight = { start: performance.now(), tof: m.tof, done: false, hit: false, resolve: resolve };
    });
  }

  // ---------- chart of the real measurements ----------
  function drawChart(sel, prog) {
    if (prog === undefined) prog = 1;
    var c = chart.getContext("2d");
    var X0 = 590, X1 = 1235, Y0 = 322, Y1 = 632;
    var t0 = DATA[0].t, t1 = DATA[DATA.length - 1].t;
    var kmMin = Infinity, kmMax = -Infinity;
    DATA.forEach(function (d) { kmMin = Math.min(kmMin, d.km); kmMax = Math.max(kmMax, d.km); });
    kmMin = Math.floor(kmMin / 10000) * 10000;
    kmMax = Math.ceil(kmMax / 10000) * 10000;
    function x(t) { return X0 + (t - t0) / (t1 - t0) * (X1 - X0); }
    function y(km) { return Y1 - (km - kmMin) / (kmMax - kmMin) * (Y1 - Y0); }
    var cut = t0 + prog * (t1 - t0);
    function popSize(tt) {
      var age = (cut - tt) / ((t1 - t0) * 0.05);
      if (age >= 1) return 1;
      var q = age - 1;
      return Math.max(0, 1 + 2.70158 * q * q * q + 1.70158 * q * q);
    }

    c.clearRect(0, 0, W, H);
    c.fillStyle = "#0b0b0b";
    c.fillRect(0, 0, W, H);

    c.font = "15px Arial, sans-serif";
    c.textBaseline = "middle";
    for (var km = kmMin; km <= kmMax; km += 10000) {
      c.strokeStyle = "rgba(244, 236, 216, 0.18)";
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(X0, y(km)); c.lineTo(X1, y(km)); c.stroke();
      c.fillStyle = "#f4ecd8";
      c.textAlign = "right";
      c.fillText(km.toLocaleString("en-US") + " km", X0 - 10, y(km));
    }
    c.textAlign = "center";
    c.textBaseline = "top";
    var d0 = new Date(t0);
    for (var m = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), 1)); m.getTime() <= t1; m.setUTCMonth(m.getUTCMonth() + 3)) {
      if (m.getTime() < t0) continue;
      c.fillStyle = "#f4ecd8";
      c.fillText(m.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }), x(m.getTime()), Y1 + 10);
    }

    // The Moon's orbit: distance between the centers of Earth and Moon (NASA/JPL Horizons)
    c.save();
    c.beginPath(); c.rect(X0, Y0 - 6, X1 - X0, Y1 - Y0 + 12); c.clip();
    c.strokeStyle = "rgba(244, 236, 216, 0.5)";
    c.lineWidth = 2;
    c.beginPath();
    window.MOON_ORBIT.forEach(function (p, i) {
      if (p[0] > cut) return;
      if (i === 0) c.moveTo(x(p[0]), y(p[1])); else c.lineTo(x(p[0]), y(p[1]));
    });
    c.stroke();
    c.restore();

    if (prog < 1) {
      c.strokeStyle = "rgba(255, 224, 122, 0.35)";
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(x(cut), Y0 - 6); c.lineTo(x(cut), Y1 + 4); c.stroke();
    }
    DATA.forEach(function (d) {
      if (d.t > cut) return;
      var px = x(d.t), py = y(d.km), k = popSize(d.t);
      if (d.station === "APOL") {
        c.fillStyle = "#8fd3ff";
        c.fillRect(px - 4 * k, py - 4 * k, 8 * k, 8 * k);
      } else {
        c.fillStyle = "#ffe07a";
        c.beginPath(); c.arc(px, py, 4.5 * k, 0, 6.2832); c.fill();
      }
    });
    if (sel && prog >= 1) {
      c.strokeStyle = "#fff";
      c.lineWidth = 3;
      c.beginPath(); c.arc(x(sel.t), y(sel.km), 13, 0, 6.2832); c.stroke();
      c.fillStyle = "#fff";
      c.textAlign = "right";
      c.textBaseline = "bottom";
      c.font = "bold 16px Arial, sans-serif";
      c.fillText("your light", x(sel.t) - 16, y(sel.km) - 8);
    }

    c.textAlign = "left";
    c.textBaseline = "top";
    c.fillStyle = "#f4ecd8";
    c.font = "17px Arial, sans-serif";
    c.fillStyle = "#ffe07a"; c.beginPath(); c.arc(X0 + 6, Y1 + 50, 5, 0, 6.2832); c.fill();
    c.fillStyle = "#f4ecd8"; c.fillText("Grasse, France", X0 + 20, Y1 + 41);
    c.fillStyle = "#8fd3ff"; c.fillRect(X0 + 170, Y1 + 45, 10, 10);
    c.fillStyle = "#f4ecd8"; c.fillText("Apache Point, New Mexico", X0 + 188, Y1 + 41);
    c.strokeStyle = "rgba(244, 236, 216, 0.6)"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(X0 + 420, Y1 + 50); c.lineTo(X0 + 450, Y1 + 50); c.stroke();
    c.fillText("center to center", X0 + 458, Y1 + 41);
    c.font = "13px Arial, sans-serif";
    c.fillStyle = "rgba(244, 236, 216, 0.7)";
    c.textAlign = "right";
    c.fillText("Dots: distance from each telescope to the Apollo 11 mirror. Data: NASA CDDIS / ILRS.", X1, Y0 - 44);
    c.fillText("Line: distance between the centers of the Earth and the Moon. Data: NASA/JPL Horizons.", X1, Y0 - 26);
  }

  function animateChart(sel, ms) {
    if (REDUCED) { drawChart(sel, 1); return Promise.resolve(); }
    return new Promise(function (res) {
      var start = performance.now();
      (function step(now) {
        var u = Math.min((now - start) / ms, 1);
        var e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;  // slow in, slow out
        drawChart(sel, e);
        if (u < 1) requestAnimationFrame(step); else res();
      })(start);
    });
  }

  // ---------- the Mirror speaks ----------
  function say(html, restMouth, n) {
    var wasShown = !balloon.classList.contains("hidden");
    balloonText.innerHTML = html;
    show(balloon);
    // the balloon pops in and overshoots; later lines just give it a small bounce
    if (wasShown) anim(balloon, [{ transform: "scale(1)" }, { transform: "scale(1.03, 0.95)", offset: 0.4 }, { transform: "scale(1)" }], { duration: 240, easing: EASE.out });
    else anim(balloon, [{ transform: "scale(0.6)" }, { transform: "scale(1.06)", offset: 0.65 }, { transform: "scale(1)" }], { duration: 380, easing: EASE.out });
    // secondary action: the Mirror leans toward you as it starts each line
    if (!mirror.classList.contains("hidden")) {
      anim(mirror, [{ transform: "none" }, { transform: "rotate(1.6deg) translateX(5px)", offset: 0.35 }, { transform: "rotate(-0.4deg)", offset: 0.75 }, { transform: "none" }],
        { duration: 900, easing: EASE.inOut });
    }
    stopVoice();
    var hasVoice = !!(n && window.VOICE && window.VOICE[n]);
    var spoken = hasVoice
      ? playVoice(n, function (lv) { setMouth(lv > 0 ? mouthFor(lv) : "closed"); }).then(function () { return wait(650); })
      : wait(Math.min(6500, 1400 + (balloonText.textContent || "").length * 45));
    return advance(balloon, null, spoken).then(function () {
      stopVoice();
      setMouth(restMouth || "smile");
    });
  }

  // The number the Mirror is talking about, on a small card over the photo
  function showNumber(m) {
    readout.classList.add("onBase");
    timer.textContent = m.tof.toFixed(6) + " s";
    note.innerHTML = "Your light's round trip. Half of it: <b>" + (m.tof / 2).toFixed(6) + " s</b> = <b>" + fmtKm(m.km) + "</b> away.";
    show(readout);
    anim(readout, [{ transform: "scale(0.6)" }, { transform: "scale(1.06)", offset: 0.65 }, { transform: "scale(1)" }], { duration: 420, easing: EASE.out });
  }
  function hideNumber() {
    hide(readout);
    setTimeout(function () { readout.classList.remove("onBase"); }, 900);
  }

  // ---------- the story ----------
  async function titleCards() {
    var lines = [
      "In 1969, two astronauts left a <em>mirror</em> on the Moon.",
      "It has no battery.<br>No motor.<br>No voice.",
      "But send it light…<br>and it <em>answers</em>."
    ];
    show(card);
    for (var i = 0; i < lines.length; i++) {
      cardText.innerHTML = lines[i];
      anim(cardText, [{ transform: "translateY(-30px) scale(0.94)", opacity: 0 }, { transform: "translateY(5px) scale(1.02)", opacity: 1, offset: 0.65 }, { transform: "none", opacity: 1 }],
        { duration: 650, easing: EASE.out });
      var read = playVoice(i + 1).then(function () { return wait(900); });
      await advance(card, null, read);
      stopVoice();
    }
    hide(card);
  }

  async function sendLight() {
    // squash and stretch: the button gives under your finger
    await anim(sendBtn, [
      { transform: "translateX(-50%) scale(1)" },
      { transform: "translateX(-50%) scale(1.12, 0.84)", offset: 0.4 },
      { transform: "translateX(-50%) scale(0.96, 1.06)", offset: 0.75 },
      { transform: "translateX(-50%) scale(1)" }
    ], { duration: 260, easing: EASE.out });
    hide(sendBtn); hide(againBtn);
    clearPhotons();
    shot = shotsFired === 0 ? DATA[DATA.length - 1] : DATA[Math.floor(Math.random() * DATA.length)];
    shotsFired++;
    timer.textContent = "0.000 s";
    note.innerHTML = "Light crosses space at <b>299,792 km every second</b>.";
    show(readout);
    await obsWindUp();
    muzzleAt = performance.now();
    obsFire();
    await fire(shot);
    obsCatch();
    spawnPhotons(shot.photons);
    note.innerHTML = "It answered. Your wait was real: on <b>" + fmtDate(shot.t) + "</b>, light sent from <b>" +
      STATIONS[shot.station] + "</b> took exactly this long. <b>" + shot.photons + " photons</b> came home.";
    if (shotsFired > 1) {
      await wait(1200);
      show(againBtn);
      sending = false;
      return;
    }
    await advance(stage, 5200);
    await mirrorScene();
  }

  async function mirrorScene() {
    await iris(B.x, B.y, 1500, 0, 800);
    hide(readout);
    hide(sky); hide(obs); hide(photonLayer);
    show(base);
    setEyes("closed");
    setMouth("closed");
    show(mirror);
    await wait(1000);
    await iris(285, 450, 0, 1500, 900);
    await wait(900);
    mirror.classList.add("flash");
    await wait(320);
    mirror.classList.remove("flash");
    setEyes("half");                  // groggy
    await wait(700);
    // anticipation: it sinks a little...
    var sink = REDUCED ? null : mirror.animate([{ transform: "none" }, { transform: "scale(1.06, 0.9)", offset: 0.6 }, { transform: "scale(1.07, 0.89)" }],
      { duration: 320, easing: EASE.inOut, fill: "forwards" });
    if (sink) await sink.finished.catch(function () {});
    // ...then the take: eyes pop open, it springs up, overshoots and settles
    setEyes("open");
    setMouth("oh");
    mirror.classList.add("surprised");
    var take = anim(mirror, [
      { transform: "scale(0.93, 1.13) translateY(-16px)", offset: 0 },
      { transform: "scale(1.04, 0.96)", offset: 0.5 },
      { transform: "scale(0.99, 1.01)", offset: 0.78 },
      { transform: "none", offset: 1 }
    ], { duration: 700, easing: EASE.out });
    if (sink) sink.cancel();
    await take;
    await wait(250);

    await say("Oh! … Hello. Was that <b>you</b>?", "smile", 4);
    mirror.classList.remove("surprised");
    await say("I'm a mirror. Two astronauts set me down here in July 1969, and I have not moved since.", "smile", 5);
    await say("No battery. No motor. I cannot call you. But when your light reaches me, I send it <b>straight back</b> to where it came from.", "closed", 6);
    showNumber(shot);
    await say("Look at the number on the screen. That is how long your light took to come home. Light always travels at the <b>same speed</b>, so half of that time tells you how far away I am.", "smile", 7);
    await say("That is how people know the distance to the Moon. Nobody <b>guessed</b> it. They <b>timed</b> it.", "smile", 8);
    hideNumber();
    await say("And you don't have to take my word for it. <b>Look.</b>", "smile", 9);

    hide(base);
    drawChart(shot, 0);
    show(chart);
    animateChart(shot, 2600);
    balloon.classList.add("overChart");
    await say("Every dot is a real measurement from 2025 and 2026. <b>" + DATA.length + "</b> times, someone on Earth sent me light. " + DATA.length + " times, <b>I answered.</b>", "smile", 10);
    await say("See the wave? The Moon swings closer and farther every month. The line is the distance between the centers of the Earth and the Moon.", "smile", 11);
    await say("My dots sit a little below the line, because the telescope and I both stand on the surface, facing each other. <b>The numbers agree.</b>", "smile", 12);
    await say("I have neighbors, you know. They cannot answer anymore… but they left their measurement behind. <b>Let me introduce one.</b>", "smile", 13);
    await chapter2();
  }

  async function backToSky() {
    hide(againBtn);
    await iris(285, 450, 1500, 0, 700);
    hide(chart); hide(mirror); hide(balloon);
    if (typeof marsCv !== "undefined") { hide(marsCv); hide(oppPanel); }
    mirror.classList.remove("inset");
    balloon.classList.remove("caption");
    flight = null;
    clearPhotons();
    timer.textContent = "0.000 s";
    note.innerHTML = "Each try replays a different real measurement.";
    show(sky); show(obs); show(photonLayer); show(readout);
    obsBreathe();
    sending = false;
    await wait(1000);
    await iris(A.x, A.y, 0, 1500, 800);
    show(sendBtn);
  }

  var sending = false;
  sendBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (sending) return;
    sending = true;
    guard(sendLight());
  });
  againBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (!sky.classList.contains("hidden")) {   // still in the sky: just fire again
      if (sending) return;
      sending = true;
      hide(againBtn);
      guard(sendLight());
      return;
    }
    guard(backToSky());
  });

  // =================== Chapter 2: Opportunity on Mars ===================
  // The sky, the Sun and the dust follow the rover's own measurements of the atmosphere.
  var marsCv = $("mars"), mctx = marsCv.getContext("2d");
  var oppPanel = $("oppPanel"), oppChartEl = $("oppChart"), occ = oppChartEl.getContext("2d");
  var oppSlider = $("oppSlider"), oppRead = $("oppRead");
  var OPP = window.OPP_TAU;
  var OPP_FINAL = [5111, 10.8];              // NASA Photojournal PIA22930: "a tau of about 10.8" on sol 5,111
  var OPP_ALL = OPP.concat([OPP_FINAL]);      // every slider position is a real measurement
  var LAND_MS = Date.UTC(2004, 0, 25, 5, 5), SOL_MS = 88775244;   // Opportunity's sol 1, and one Martian day
  function monthYear(sol) {
    return new Date(LAND_MS + (sol - 1) * SOL_MS).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  function idxOfSol(sol) {
    var lo = 0, hi = OPP_ALL.length - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (OPP_ALL[mid][0] <= sol) lo = mid; else hi = mid - 1;
    }
    return lo;
  }
  // When key words are spoken inside each recorded line (seconds from the start of the line)
  var CUE = {
    15: { sun: 5.6, dust: 7.9 },
    17: { darkened: 4.0, waited: 7.1, cleared: 9.3, work: 11.2 },
    18: { km: 2.8, june: 5.0, covered: 8.9 },
    19: { climb1: 5.6, climb2: 6.8, stop: 9.5 },
    20: { quiet: 1.7, check: 6.9 }
  };

  var mi = {};
  ["mars_ground", "art/rover_cuerpo", "art/rover_mastil", "art/rover_brazo", "art/rover_ojos_abiertos", "art/rover_ojos_medio",
    "art/rover_ojos_cerrados", "art/cielo_sol", "art/cielo_nube_a", "art/cielo_nube_b", "art/cielo_nube_c", "art/cielo_tormenta"].forEach(function (f) {
    var im = new Image();
    im.src = "assets/" + f + ".png?v=" + window.BUILD;
    mi[f.replace("art/", "")] = im;
  });

  var GROUND_Y = 692, RS = 0.46;            // where the wheels touch the ground; rover scale
  var M = {
    idx: 0, shown: OPP[0][1], lastIdx: -1, pan: 0, panV: 6, clouds: [], puffs: [], tweens: [], beam: 0, sunPop: 0,
    view: null, reveal: 999, finalShown: false, odoShow: false, lastPuff: 0,
    rv: { x: 1500, px: 1500, lvx: 0, y: 0, sx: 1, sy: 1, tilt: 0, mast: 0, mastV: 0, mastT: 0, arm: 0.1, armV: 0, armT: 0.1, look: 0, lookX: 0, eyes: "open", drive: 0 }
  };
  (function () {
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var kinds = ["cielo_nube_a", "cielo_nube_b", "cielo_nube_c", "cielo_tormenta"];
    for (var i = 0; i < 16; i++) {
      M.clouds.push({ x: rnd() * 1500 - 110, y: 40 + rnd() * 300, s: 0.3 + rnd() * 0.45, v: 10 + rnd() * 26, k: kinds[i % 4], a: 0 });
    }
  })();

  var EZ = {
    inOut: function (u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; },
    out: function (u) { return 1 - Math.pow(1 - u, 3); },
    in: function (u) { return u * u * u; },
    back: function (u) { var c = 1.70158, d = u - 1; return 1 + (c + 1) * d * d * d + c * d * d; }
  };
  function tween(obj, to, ms, ease) {
    return new Promise(function (res) {
      var from = {};
      for (var k in to) from[k] = obj[k];
      M.tweens.push({ obj: obj, from: from, to: to, t0: performance.now(), ms: REDUCED ? 1 : Math.max(1, ms), ease: ease || EZ.inOut, res: res, id: runId });
    });
  }
  function runTweens(now) {
    M.tweens = M.tweens.filter(function (tw) {
      var u = Math.min(1, (now - tw.t0) / tw.ms), e = tw.ease(u);
      for (var k in tw.to) tw.obj[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
      if (u >= 1) { if (tw.id === runId) tw.res(); return false; }
      return true;
    });
  }
  function springStep(o, k, vk, target, stiff, damp, dt) {
    var a = (target - o[k]) * stiff - o[vk] * damp;
    o[vk] += a * dt;
    o[k] += o[vk] * dt;
  }
  function puff(x, y, n, spread) {
    for (var i = 0; i < n; i++) {
      M.puffs.push({ x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * 20, vx: 20 + Math.random() * 60, vy: -40 - Math.random() * 50,
        s: 0.07 + Math.random() * 0.07, life: 0, max: 0.8 + Math.random() * 0.6 });
    }
  }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function mix(c1, c2, u) {
    return "rgb(" + Math.round(lerp(c1[0], c2[0], u)) + "," + Math.round(lerp(c1[1], c2[1], u)) + "," + Math.round(lerp(c1[2], c2[2], u)) + ")";
  }

  function drawRoverEyes(c, rv, now) {
    var e = rv.eyes;
    if (e === "open" && now % 4300 < 140) e = "closed";      // a blink now and then
    var im = mi[e === "closed" ? "rover_ojos_cerrados" : e === "half" ? "rover_ojos_medio" : "rover_ojos_abiertos"];
    if (!im.complete) return;
    var half = im.width / 2, f = 0.7, w = half * f, h = im.height * f;
    var sockets = [[78 - 172, 75 - 640], [262 - 172, 75 - 640]];   // the two camera "eyes" at the top of the mast (mast pivot at 172, 640)
    for (var i = 0; i < 2; i++) {
      c.drawImage(im, i * half, 0, half, im.height, sockets[i][0] - w / 2 + rv.lookX, sockets[i][1] - h / 2 + rv.look, w, h);
    }
  }
  function drawRover(c, now, x, y, sx, sy, tilt) {
    var rv = M.rv;
    if (!mi.rover_cuerpo.complete) return;
    c.save();
    c.translate(x, y);
    c.rotate(tilt);
    c.scale(RS * sx, RS * sy);
    c.drawImage(mi.rover_cuerpo, -466, -789);
    c.save();                                                 // the mast stands on the front of the deck
    c.translate(300 - 466, 330 - 789);
    c.rotate(rv.mast);
    c.scale(0.62, 0.62);
    c.drawImage(mi.rover_mastil, -172, -640);
    drawRoverEyes(c, rv, now);
    c.restore();
    c.save();                                                 // the arm hangs from the front of the body
    c.translate(210 - 466, 395 - 789);
    c.rotate(rv.arm);
    c.scale(0.5, 0.5);
    c.drawImage(mi.rover_brazo, -205, -45);
    c.restore();
    c.restore();
  }
  function roverHead() {
    var rv = M.rv, bx = rv.x + (300 - 466) * RS * rv.sx, by = GROUND_Y + (330 - 789) * RS * rv.sy, L = 565 * 0.62 * RS;
    return { x: bx + Math.sin(rv.mast) * L, y: by - Math.cos(rv.mast) * L };
  }

  var lastMars = 0;
  function drawMars(now) {
    var dt = Math.min(0.05, (now - (lastMars || now)) / 1000);
    lastMars = now;
    runTweens(now);
    var i0 = Math.max(0, Math.min(OPP_ALL.length - 1, Math.round(M.idx)));
    if (i0 !== M.lastIdx) { M.lastIdx = i0; updateOppRead(); }
    M.shown += (OPP_ALL[i0][1] - M.shown) * Math.min(1, dt * 5);      // slow in and slow out from day to day
    var tau = M.shown, d = 1 - Math.exp(-tau / 3), c = mctx;

    // the sky: its colour comes from the measured dust
    var g = c.createLinearGradient(0, 0, 0, 430);
    g.addColorStop(0, mix([196, 150, 106], [92, 62, 40], d));
    g.addColorStop(1, mix([236, 200, 152], [140, 98, 64], d));
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // the Sun dims as the dust gets thicker
    var sunA = Math.max(0.03, Math.exp(-tau / 2.2)), sp = 1 + 0.14 * M.sunPop;
    var glow = c.createRadialGradient(1075, 165, 10, 1075, 165, 230);
    glow.addColorStop(0, "rgba(255,236,180," + (0.6 * sunA).toFixed(3) + ")");
    glow.addColorStop(1, "rgba(255,236,180,0)");
    c.fillStyle = glow;
    c.fillRect(780, 0, 500, 430);
    if (mi.cielo_sol.complete) {
      c.globalAlpha = sunA;
      c.drawImage(mi.cielo_sol, 1075 - 85 * sp, 165 - 83 * sp, 170 * sp, 166 * sp);
      c.globalAlpha = 1;
    }

    // dust clouds: more of them, and thicker, as tau rises
    var nC = Math.min(M.clouds.length, Math.round(tau * 3));
    for (var i = 0; i < M.clouds.length; i++) {
      var cl = M.clouds[i], im = mi[cl.k];
      cl.x += cl.v * dt * (0.4 + d);
      if (cl.x > W + 60) cl.x = -470;
      var want = i < nC ? Math.min(1, 0.3 + d) : 0;
      cl.a += (want - cl.a) * Math.min(1, dt * 2);
      if (cl.a > 0.02 && im.complete) {
        c.globalAlpha = cl.a;
        c.drawImage(im, cl.x, cl.y, im.width * cl.s, im.height * cl.s);
      }
    }
    c.globalAlpha = 1;

    // the ground: Opportunity's own last panorama
    c.fillStyle = "#7a5636";
    c.fillRect(0, 560, W, H - 560);
    if (mi.mars_ground.complete) {
      var gh = 400, gw = 4096 * gh / 410, gy = 330;
      M.pan = ((M.pan + M.panV * dt) % gw + gw) % gw;
      c.drawImage(mi.mars_ground, -M.pan, gy, gw, gh);
      c.drawImage(mi.mars_ground, -M.pan + gw, gy, gw, gh);
    }
    c.fillStyle = "rgba(70, 42, 24, " + (d * 0.4).toFixed(3) + ")";
    c.fillRect(0, 300, W, H - 300);

    // the rover. Follow-through: the mast and the arm lag behind every change of speed, then spring back
    var rv = M.rv;
    var vx = (rv.x - rv.px) / Math.max(dt, 0.001), acc = (vx - rv.lvx) / Math.max(dt, 0.001);
    rv.lvx = vx;
    rv.px = rv.x;
    var lag = Math.max(-0.35, Math.min(0.35, -acc * 0.00022));
    springStep(rv, "mast", "mastV", rv.mastT + lag, 90, 9, dt);
    springStep(rv, "arm", "armV", rv.armT + lag * 1.4, 70, 6, dt);
    var step = Math.floor(now / 83);                          // drawn on twos
    var bob = rv.drive ? -Math.abs(Math.sin(step * 1.3)) * 7 * rv.drive : -Math.sin(now / 900) * 1.5;
    var sq = rv.drive && step % 3 === 0 ? 0.03 * rv.drive : 0;
    drawRover(c, now, rv.x, GROUND_Y + rv.y + bob, rv.sx * (1 + sq), rv.sy * (1 - sq), rv.tilt);
    if (rv.drive && step - M.lastPuff >= 4) {
      M.lastPuff = step;
      puff(rv.x + 170 * rv.sx, GROUND_Y - 30, 2, 60);
    }

    // dust puffs rise and drift back in arcs, then fade
    for (var p = 0; p < M.puffs.length; p++) {
      var pf = M.puffs[p], im2 = mi.cielo_nube_b;
      pf.life += dt;
      pf.x += pf.vx * dt;
      pf.y += pf.vy * dt;
      pf.vy += 30 * dt;
      var u = pf.life / pf.max, s = pf.s * (1 + u * 1.6);
      if (im2.complete) {
        c.globalAlpha = Math.max(0, 0.85 * (1 - u));
        c.drawImage(im2, pf.x - im2.width * s / 2, pf.y - im2.height * s / 2, im2.width * s, im2.height * s);
      }
    }
    c.globalAlpha = 1;
    M.puffs = M.puffs.filter(function (pf) { return pf.life < pf.max; });

    // Opportunity looks straight at the Sun to measure the dust
    if (M.beam > 0.01) {
      var hd = roverHead();
      c.save();
      c.globalAlpha = M.beam;
      c.setLineDash([10, 9]);
      c.lineDashOffset = -now / 25;
      c.strokeStyle = "#ffe07a";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(hd.x, hd.y);
      c.lineTo(1075, 165);
      c.stroke();
      c.restore();
    }

    c.fillStyle = "rgba(0,0,0," + (d * 0.14).toFixed(3) + ")";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(255,255,255,0.6)";
    c.font = "13px Arial, sans-serif";
    c.fillText("Ground: Opportunity's last panorama, May 13 - June 10, 2018 (NASA/JPL-Caltech, PIA22909). Sky and dust follow its real measurements.", 16, H - 12);
  }

  function drawOppChart() {
    var c = occ, w = 540, h = 150, L = 36, R = 10, T = 12, B = 22;
    c.clearRect(0, 0, w, h);
    var v = M.view || { s0: 1, s1: 5118, tMax: 5 };
    var full = v.s1 - v.s0 > 500;
    function x(s) { return L + (s - v.s0) / (v.s1 - v.s0) * (w - L - R); }
    function y(t) { return T + (1 - Math.min(t, v.tMax) / v.tMax) * (h - T - B); }
    c.font = "11px Arial, sans-serif";
    c.lineWidth = 1;
    c.strokeStyle = "rgba(244,236,216,0.16)";
    c.fillStyle = "rgba(244,236,216,0.78)";
    c.textAlign = "right";
    c.textBaseline = "middle";
    for (var t = 0; t <= v.tMax; t += v.tMax > 6 ? 2 : 1) {
      c.beginPath(); c.moveTo(L, y(t)); c.lineTo(w - R, y(t)); c.stroke();
      c.fillText(String(t), L - 6, y(t));
    }
    c.textAlign = "center";
    c.textBaseline = "top";
    if (full) {
      for (var yr = 2004; yr <= 2018; yr += 2) c.fillText(String(yr), x(1 + (Date.UTC(yr, 0, 1) - LAND_MS) / SOL_MS), h - B + 6);
    } else {
      for (var s2 = Math.ceil(v.s0 / 5) * 5; s2 <= v.s1; s2 += 5) c.fillText("sol " + s2, x(s2), h - B + 6);
    }
    c.save();
    c.beginPath(); c.rect(L, 0, w - L - R, h - B + 2); c.clip();
    if (full) {
      c.strokeStyle = "#ffe07a";
      c.lineWidth = 1.2;
      c.beginPath();
      for (var i = 0; i < OPP.length; i++) {
        if (i === 0) c.moveTo(x(OPP[i][0]), y(OPP[i][1])); else c.lineTo(x(OPP[i][0]), y(OPP[i][1]));
      }
      c.stroke();
    } else {
      var n = 0;
      for (var j = 0; j < OPP.length; j++) {
        if (OPP[j][0] < v.s0) continue;
        if (n++ >= M.reveal) break;
        c.fillStyle = "#ffe07a";
        c.beginPath(); c.arc(x(OPP[j][0]), y(OPP[j][1]), 4, 0, 6.2832); c.fill();
        if (OPP[j][0] >= 5103) {                          // label only the climb, so the numbers never overlap
          c.fillStyle = "#f4ecd8";
          c.textBaseline = "bottom";
          c.fillText(OPP[j][1].toFixed(2), x(OPP[j][0]), y(OPP[j][1]) - 7);
        }
      }
    }
    if (M.finalShown) {
      c.strokeStyle = "#ff9a6a";
      c.lineWidth = 2.5;
      c.beginPath(); c.arc(x(OPP_FINAL[0]), y(OPP_FINAL[1]), 6, 0, 6.2832); c.stroke();
    }
    c.restore();
    if (M.finalShown) {
      c.fillStyle = "#ff9a6a";
      c.textAlign = "right";
      c.textBaseline = "middle";
      c.fillText("about 10.8 on its last day (NASA)", x(OPP_FINAL[0]) - 10, y(OPP_FINAL[1]) + (full ? 10 : 2));
    }
    if (full) {
      var cur = OPP_ALL[Math.max(0, Math.min(OPP_ALL.length - 1, Math.round(M.idx)))];
      c.strokeStyle = "#ffffff";
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(x(cur[0]), T); c.lineTo(x(cur[0]), h - B); c.stroke();
    }
    c.save();
    c.translate(11, (h - B) / 2 + 4);
    c.rotate(-Math.PI / 2);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "rgba(244,236,216,0.78)";
    c.fillText("dust (tau)", 0, 0);
    c.restore();
  }
  function updateOppRead() {
    var i = Math.max(0, Math.min(OPP_ALL.length - 1, Math.round(M.idx)));
    var sol = OPP_ALL[i][0], tau = OPP_ALL[i][1], direct = Math.exp(-tau) * 100;
    var pct = direct >= 1 ? Math.round(direct) + "%" : "less than 1%";
    var est = i === OPP_ALL.length - 1 ? " (NASA estimate)" : "";
    oppRead.innerHTML = "Sol <b>" + sol + "</b> &middot; " + monthYear(sol) + " &middot; dust (tau): <b>" + tau.toFixed(2) + "</b>" + est +
      "<br>Sunlight shining straight through the dust: <b>" + pct + "</b>" +
      (M.odoShow ? " &middot; total driven: <b>45.16 km</b>" : "");
    if (document.activeElement !== oppSlider) oppSlider.value = String(i);
  }

  oppSlider.max = String(OPP_ALL.length - 1);
  var lastSlide = 0, sliderHeld = false;
  oppSlider.addEventListener("input", function () {
    M.idx = +oppSlider.value;
    lastSlide = performance.now();
    updateOppRead();
  });
  ["pointerdown", "click", "keydown"].forEach(function (ev) {
    oppSlider.addEventListener(ev, function (e) { e.stopPropagation(); if (ev === "pointerdown") sliderHeld = true; });
  });
  window.addEventListener("pointerup", function () { sliderHeld = false; });
  function waitSlide() {
    return new Promise(function (res) {
      var t0 = performance.now(), id = runId;
      oppPanel.classList.add("invite");
      (function check() {
        if (id !== runId) { oppPanel.classList.remove("invite"); return; }
        var now = performance.now();
        var done = lastSlide > t0 ? now - lastSlide > 4500 && !sliderHeld : now - t0 > 12000;
        if (done) { oppPanel.classList.remove("invite"); res(); } else setTimeout(check, 200);
      })();
    });
  }

  (function marsLoop(now) {
    if (!marsCv.classList.contains("hidden")) { drawMars(now || 0); drawOppChart(); }
    requestAnimationFrame(marsLoop);
  })();

  function resetMars() {
    M.idx = 0; M.shown = OPP[0][1]; M.lastIdx = -1; M.view = null; M.reveal = 999; M.finalShown = false; M.odoShow = false;
    M.beam = 0; M.sunPop = 0; M.panV = 6; M.puffs = []; M.tweens = [];
    var rv = M.rv;
    rv.x = rv.px = 1500; rv.lvx = 0; rv.y = 0; rv.sx = rv.sy = 1; rv.tilt = 0; rv.mast = rv.mastV = rv.mastT = 0;
    rv.arm = rv.armT = 0.1; rv.armV = 0; rv.look = 0; rv.lookX = 0; rv.eyes = "open"; rv.drive = 0;
    M.clouds.forEach(function (cl) { cl.a = 0; });
  }
  function showPanel() {
    if (!oppPanel.classList.contains("hidden")) return;
    updateOppRead();
    show(oppPanel);
    anim(oppPanel, [{ transform: "scale(0.6)" }, { transform: "scale(1.05)", offset: 0.65 }, { transform: "scale(1)" }], { duration: 450, easing: EASE.out });
  }

  // Opportunity drives in from the right, front first
  async function roverDriveIn() {
    var rv = M.rv;
    await wait(250);
    // anticipation: it rocks back before it rolls
    await tween(rv, { sx: 1.05, sy: 0.94, tilt: 0.03 }, 220);
    rv.drive = 1;
    tween(rv, { sx: 1, sy: 1, tilt: 0 }, 200, EZ.out);
    await tween(rv, { x: 420 }, 2700, EZ.out);           // slows in as it arrives
    rv.drive = 0;
    // it stops: squash, rebound, settle
    await tween(rv, { sx: 1.06, sy: 0.93 }, 130, EZ.out);
    await tween(rv, { sx: 0.97, sy: 1.04 }, 170, EZ.out);
    await tween(rv, { sx: 1, sy: 1 }, 220);
  }
  // It tilts its cameras up toward the Sun, and the measurements appear
  async function lookAtSun() {
    var rv = M.rv;
    await wait(Math.max(0, CUE[15].sun * 1000 - 1100));
    await tween(rv, { mastT: -0.1 }, 260);               // anticipation: a small dip the other way
    tween(rv, { mastT: 0.3, look: -10, lookX: 6 }, 650, EZ.back);
    await tween(M, { beam: 1 }, 600, EZ.out);
    tween(M, { sunPop: 1 }, 170, EZ.out).then(function () { return tween(M, { sunPop: 0 }, 420, EZ.back); });
    await wait(Math.max(0, (CUE[15].dust - CUE[15].sun) * 1000 - 500));
    showPanel();
    await wait(1200);
    tween(M, { beam: 0 }, 500, EZ.in);
    tween(rv, { mastT: 0, look: 0, lookX: 0 }, 700);
  }
  // 2007: the days roll on to the storm, Opportunity waits it out, then shakes off the dust
  async function storm2007() {
    var rv = M.rv, c = CUE[17];
    await tween(M, { idx: idxOfSol(1150) }, 1400);
    await tween(M, { idx: idxOfSol(1236) }, Math.max(300, (c.darkened + 0.5) * 1000 - 1400), EZ.in);
    rv.eyes = "half";
    tween(rv, { sy: 0.9, sx: 1.05, mastT: -0.2, armT: 0.25 }, 700);
    await wait(Math.max(0, (c.waited - c.darkened) * 1000 - 200));
    rv.eyes = "closed";
    await wait(Math.max(0, (c.cleared - c.waited) * 1000 - 900));
    await tween(M, { idx: idxOfSol(1420) }, 1300, EZ.out);
    rv.eyes = "open";                                      // the take: eyes pop open and it springs up
    await tween(rv, { sy: 1.12, sx: 0.94, mastT: 0.05 }, 160, EZ.out);
    for (var k = 0; k < 3; k++) {                          // it shakes off the dust
      await tween(rv, { tilt: 0.05, sx: 1.03 }, 70);
      await tween(rv, { tilt: -0.05, sx: 0.98 }, 70);
    }
    puff(rv.x + 60, GROUND_Y - 150, 8, 260);
    tween(rv, { sy: 1, sx: 1, tilt: 0, mastT: 0, armT: 0.1 }, 320, EZ.back);
    rv.drive = 0.6;
    await wait(900);
    rv.drive = 0;
  }
  // Years go by; then the 2018 storm rolls in
  async function drive2018() {
    var rv = M.rv, c = CUE[18];
    rv.drive = 1;
    M.panV = -70;                                          // a time-lapse: the ground slides by
    await tween(M, { idx: idxOfSol(5050) }, c.km * 1000, EZ.inOut);
    M.odoShow = true;
    updateOppRead();
    anim(oppRead, [{ transform: "scale(1)" }, { transform: "scale(1.06)", offset: 0.4 }, { transform: "scale(1)" }], { duration: 400, easing: EASE.out });
    await wait(Math.max(0, (c.june - c.km) * 1000));
    rv.drive = 0;
    M.panV = 6;
    await tween(M, { idx: idxOfSol(5105) }, Math.max(400, (c.covered - c.june + 0.6) * 1000), EZ.in);
    rv.eyes = "half";
    tween(rv, { sy: 0.95, sx: 1.03, mastT: -0.12 }, 900);
  }
  // The last days, one dot at a time: the numbers climb, and climb, and stop
  async function lastDays() {
    var rv = M.rv, c = CUE[19];
    M.view = { s0: 5084, s1: 5114, tMax: 11 };
    M.reveal = 0;
    anim(oppChartEl, [{ transform: "scale(0.9)", opacity: 0.3 }, { transform: "scale(1)", opacity: 1 }], { duration: 400, easing: EASE.out });
    var calm = OPP.filter(function (r) { return r[0] >= 5084 && r[0] <= 5102; }).length;
    for (var i = 1; i <= calm; i++) {
      M.reveal = i;
      await wait(Math.max(40, (c.climb1 * 1000 - 500) / calm));
    }
    M.reveal = calm + 1;
    M.idx = idxOfSol(5103);
    await wait((c.climb2 - c.climb1) * 1000);
    M.reveal = calm + 2;
    M.idx = idxOfSol(5105);
    await wait(Math.max(0, (c.stop - c.climb2) * 1000 - 400));
    M.finalShown = true;
    M.idx = OPP_ALL.length - 1;
    // it settles, slowly, and its eyes close
    tween(rv, { mastT: -0.42, armT: 0.35, sy: 0.92, sx: 1.04 }, 1900);
    await wait(800);
    rv.eyes = "closed";
  }
  // The chart steps back out: fourteen years of numbers, still there
  async function goQuiet() {
    var c = CUE[20];
    await wait((c.quiet + 0.6) * 1000);
    M.view = null;
    anim(oppChartEl, [{ transform: "scale(1.05)" }, { transform: "scale(1)" }], { duration: 500, easing: EASE.out });
    await wait(Math.max(0, (c.check - c.quiet - 0.6) * 1000));
    anim(oppPanel, [{ transform: "scale(1)" }, { transform: "scale(1.04)", offset: 0.4 }, { transform: "scale(1)" }], { duration: 600, easing: EASE.out });
  }

  async function chapter2() {
    setChapter(2);
    await iris(640, 360, 1500, 0, 700);
    hide(chart); hide(balloon); hide(mirror);
    balloon.classList.remove("overChart");
    irisEl.style.display = "none";
    await chapterCard("Chapter 2", "Opportunity,<br>the rover that watched the sky");
    resetMars();
    show(marsCv);
    await wait(400);
    await iris(420, 560, 0, 1500, 900);
    // the Mirror keeps telling the story from a small window in the corner
    mirror.classList.add("inset");
    balloon.classList.add("caption");
    setEyes("open");
    setMouth("smile");
    show(mirror);
    var line = say("This is <b>Opportunity</b>. It landed on Mars in January 2004, to look for signs of ancient water.", "smile", 14);
    roverDriveIn();
    await line;
    line = say("It ran on <b>sunlight</b>. And every day, it looked straight at the Sun and measured how much dust was in the sky.", "smile", 15);
    lookAtSun();
    await line;
    showPanel();
    await say("<b>Slide through its days.</b> When the sky gets dusty, less sunlight reaches its solar panels.", "smile", 16);
    await waitSlide();
    line = say("In 2007, a huge dust storm darkened the sky. Opportunity <b>waited</b>… and when the dust cleared, it went back to work.", "smile", 17);
    storm2007();
    await line;
    line = say("It drove more than <b>45 kilometers</b>. Then, in June 2018, the biggest storm of all covered the whole planet.", "smile", 18);
    drive2018();
    await line;
    line = say("Look at its last measurement. The numbers climb… and climb… and then they <b>stop</b>.", "closed", 19);
    lastDays();
    await line;
    line = say("Opportunity went quiet. But its numbers are still here, and <b>anyone</b> can check them.", "smile", 20);
    goQuiet();
    await line;
    await wait(800);
    hide(balloon);
    show(againBtn);
  }

  // =================== Chapters: a bar to see where you are and jump ===================
  var chaptersEl = $("chapters");
  function setChapter(n) {
    [].forEach.call(chaptersEl.querySelectorAll("button"), function (b) {
      var on = +b.getAttribute("data-ch") === n;
      b.classList.toggle("current", on);
      b.setAttribute("aria-current", on ? "step" : "false");
    });
  }
  async function chapterCard(kicker, title) {
    cardText.innerHTML = '<span class="kicker">' + kicker + "</span>" + title;
    show(card);
    anim(cardText, [{ transform: "translateY(-30px) scale(0.94)", opacity: 0 }, { transform: "translateY(5px) scale(1.02)", opacity: 1, offset: 0.65 }, { transform: "none", opacity: 1 }],
      { duration: 650, easing: EASE.out });
    await advance(card, 2800);
    hide(card);
    await wait(500);
  }
  function resetAll() {
    runId++;
    stopVoice();
    flight = null;
    clearPhotons();
    obsStop();
    M.tweens = [];
    [startEl, card, sky, obs, photonLayer, base, chart, mirror, balloon, readout, sendBtn, againBtn, marsCv, oppPanel].forEach(hide);
    mirror.classList.remove("inset", "surprised", "flash");
    balloon.classList.remove("caption", "overChart");
    readout.classList.remove("onBase");
    irisEl.style.display = "none";
    sending = false;
  }
  async function chapter1() {
    setChapter(1);
    shotsFired = 0;
    await chapterCard("Chapter 1", "The mirror on the Moon");
    show(sky); show(obs); show(photonLayer);
    obsBreathe();
    show(sendBtn);
  }
  chaptersEl.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-ch]");
    if (!b) return;
    e.stopPropagation();
    resetAll();
    show(chaptersEl);
    var n = +b.getAttribute("data-ch");
    if (n === 1) guard(chapter1());
    if (n === 2) guard(chapter2());
  });

  // Skip straight to a scene with ?scene=sky (useful while building)
  var start = new URLSearchParams(location.search).get("scene");
  var startEl = $("start"), goBtn = $("go");
  function waitStart() {
    return new Promise(function (res) {
      goBtn.addEventListener("click", function h(e) {
        e.stopPropagation();
        goBtn.removeEventListener("click", h);
        res();
      });
    });
  }
  guard((async function () {
    if (start === "mars") {
      await waitStart();                 // one click first, so the browser lets the voice play
      hide(startEl); hide(sky); hide(obs); hide(photonLayer);
      show(chaptersEl);
      shotsFired = 1;
      await chapter2();
      return;
    }
    if (start !== "sky") {
      await waitStart();
      await anim(goBtn, [{ transform: "scale(1)" }, { transform: "scale(1.12, 0.84)", offset: 0.4 }, { transform: "scale(0.96, 1.06)", offset: 0.75 }, { transform: "scale(1)" }],
        { duration: 260, easing: EASE.out });
      hide(startEl);
      show(chaptersEl);
      setChapter(1);
      await wait(500);
      await titleCards();
      await chapterCard("Chapter 1", "The mirror on the Moon");
    } else {
      hide(startEl);
      show(chaptersEl);
      setChapter(1);
    }
    show(sky); show(obs); show(photonLayer);
    obsBreathe();
    show(sendBtn);
  })());
})();
