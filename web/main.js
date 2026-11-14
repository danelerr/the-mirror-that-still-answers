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
  function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function fmtDate(ms) {
    return new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  }
  function fmtKm(km) { return Math.round(km).toLocaleString("en-US") + " km"; }

  // Resolves on click, Space or Enter; or after `auto` ms if given
  function advance(el, auto) {
    return new Promise(function (res) {
      var done = false, to = null;
      function finish() {
        if (done) return;
        done = true;
        el.removeEventListener("click", finish);
        document.removeEventListener("keydown", onKey);
        if (to) clearTimeout(to);
        res();
      }
      function onKey(e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); finish(); } }
      el.addEventListener("click", finish);
      document.addEventListener("keydown", onKey);
      if (auto) to = setTimeout(finish, auto);
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
    weave.x = (Math.random() - 0.5) * 1.6;
    weave.y = (Math.random() - 0.5) * 1.6;
    if (Math.random() < 0.035) weave.y += Math.random() < 0.5 ? -3 : 3;
    applyStage();

    fctx.clearRect(0, 0, 640, 360);
    // flicker: kept gentle on purpose
    var f = Math.random();
    if (f < 0.45) { fctx.fillStyle = "rgba(0,0,0," + (Math.random() * 0.07).toFixed(3) + ")"; fctx.fillRect(0, 0, 640, 360); }
    else if (f > 0.965) { fctx.fillStyle = "rgba(255,255,255,0.045)"; fctx.fillRect(0, 0, 640, 360); }
    // vertical scratches that live for a few frames
    if (Math.random() < 0.09 && scratches.length < 3) {
      scratches.push({ x: Math.random() * 640, life: 4 + Math.random() * 22, light: Math.random() < 0.7 });
    }
    scratches = scratches.filter(function (s) { return s.life-- > 0; });
    scratches.forEach(function (s) {
      s.x += (Math.random() - 0.5) * 1.2;
      fctx.strokeStyle = s.light ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.4)";
      fctx.lineWidth = 0.6;
      fctx.beginPath();
      fctx.moveTo(s.x, 0);
      fctx.lineTo(s.x + (Math.random() - 0.5) * 2, 360);
      fctx.stroke();
    });
    // dust specks and hairs
    var n = Math.random() < 0.38 ? 1 + Math.floor(Math.random() * 3) : 0;
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
    return new Promise(function (res) {
      irisEl.style.display = "block";
      var frames = Math.max(2, Math.round(ms / 42)), i = 0;
      (function tick() {
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
  var talking = null;
  function say(html, restMouth) {
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
    var plain = balloonText.textContent || "";
    var until = performance.now() + Math.min(4200, 600 + plain.length * 32);
    var open = false;
    if (talking) clearInterval(talking);
    talking = setInterval(function () {
      if (performance.now() > until) {
        clearInterval(talking); talking = null;
        setMouth(restMouth || "smile");
        return;
      }
      open = !open;
      setMouth(open ? (Math.random() < 0.5 ? "open" : "small") : "closed");
    }, 130);
    return advance(balloon).then(function () {
      if (talking) { clearInterval(talking); talking = null; }
      setMouth(restMouth || "smile");
    });
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
      await advance(card, 5200);
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

    var half = (shot.tof / 2).toFixed(6);
    await say("Oh! … Hello. Was that <b>you</b>?", "smile");
    mirror.classList.remove("surprised");
    await say("I am a mirror. Two astronauts set me down here in July 1969, and I have not moved since.", "smile");
    await say("No battery. No motor. I cannot call you. But when your light reaches me, I send it <b>straight back</b> to where it came from.", "closed");
    await say("Your light took <b>" + shot.tof.toFixed(6) + " seconds</b> to come home. Light always travels at the same speed, so half of that time, " + half + " seconds, tells you how far away I am.", "smile");
    await say("On that day I was <b>" + fmtKm(shot.km) + "</b> from the telescope. That is how people know the distance to the Moon. Nobody guessed it. They timed it.", "smile");
    await say("And you do not have to take my word for it. <b>Look.</b>", "smile");

    hide(base);
    drawChart(shot, 0);
    show(chart);
    animateChart(shot, 2600);
    balloon.classList.add("overChart");
    await say("Every dot is a real measurement from 2025 and 2026. <b>" + DATA.length + "</b> times, someone on Earth sent me light. " + DATA.length + " times, I answered.", "smile");
    await say("See the wave? The Moon swings closer and farther every month. The line is the distance between the centers of the Earth and the Moon.", "smile");
    await say("My dots sit a little below the line, because the telescope and I both stand on the surface, facing each other. <b>The numbers agree.</b>", "smile");
    hide(balloon);
    balloon.classList.remove("overChart");
    show(againBtn);
  }

  async function backToSky() {
    hide(againBtn);
    await iris(285, 450, 1500, 0, 700);
    hide(chart); hide(mirror); hide(balloon);
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
    sendLight();
  });
  againBtn.addEventListener("click", function (e) { e.stopPropagation(); backToSky(); });

  // Skip straight to a scene with ?scene=sky (useful while building)
  var start = new URLSearchParams(location.search).get("scene");
  (async function () {
    if (start !== "sky") await titleCards();
    show(sky); show(obs); show(photonLayer);
    obsBreathe();
    show(sendBtn);
  })();
})();
