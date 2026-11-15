/* The Mirror That Still Answers — the animation engine.
   Shots on one canvas: camera, layers with parallax, tweens, voice with lip sync, cartoon sound effects
   and an old-film finish. Team Unsigned Int, NASA Space Apps Challenge 2026.
   Code written with an AI coding assistant, directed and reviewed by the team. */
(function () {
  "use strict";
  const F = window.F = {};
  const W = F.W = 1280, H = F.H = 720;
  const $ = F.$ = (id) => document.getElementById(id);
  const stage = $("stage"), cv = $("view"), c = cv.getContext("2d");
  F.ctx = c;
  F.REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // ?render: used only to make the video. Sound is not played live; it is logged and mixed afterwards.
  F.RENDER = new URLSearchParams(location.search).has("render");
  F.renderLog = { voice: [], sfx: [], t0: 0 };

  // ---------- run ids: jumping to a chapter cancels everything that was playing ----------
  F.runId = 0;
  const ABORT = F.ABORT = { abort: true };
  window.addEventListener("unhandledrejection", (e) => { if (e.reason === ABORT) e.preventDefault(); });
  F.guard = (p) => p.catch((e) => { if (e !== ABORT) console.error(e); });
  F.quiet = (p) => { p.catch(() => {}); return p; };
  F.wait = (ms) => {
    const id = F.runId;
    return F.quiet(new Promise((res, rej) => setTimeout(() => (id === F.runId ? res() : rej(ABORT)), ms)));
  };
  F.alive = (id) => { if (id !== F.runId) throw ABORT; };

  // ---------- the stage fills the window; the canvas is drawn at the screen's real resolution ----------
  let scale = 1, res = 1;
  const weave = { x: 0, y: 0 };
  function applyStage() {
    stage.style.transform = "translate(-50%, -50%) translate(" + weave.x.toFixed(2) + "px, " + weave.y.toFixed(2) + "px) scale(" + scale + ")";
  }
  function fit() {
    scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    res = Math.min(2, Math.max(1, scale * (window.devicePixelRatio || 1)));
    cv.width = Math.round(W * res);
    cv.height = Math.round(H * res);
    applyStage();
  }
  window.addEventListener("resize", fit);
  fit();
  stage.addEventListener("scroll", () => { stage.scrollTop = 0; stage.scrollLeft = 0; });

  // ---------- images ----------
  const IM = F.IM = {};
  F.ready = (im) => !!im && im.complete && im.naturalWidth > 0;
  F.load = (list) => Promise.all(list.map(([name, src]) => new Promise((resolve) => {
    if (IM[name]) { resolve(); return; }
    const im = new Image();
    im.onload = im.onerror = () => resolve();
    im.src = src + (src.indexOf("?") < 0 ? "?" : "&") + "v=" + window.BUILD;
    IM[name] = im;
  })));

  // ---------- easing: slow in and slow out, overshoot, bounces ----------
  const EZ = F.EZ = {
    lin: (u) => u,
    inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    out: (u) => 1 - Math.pow(1 - u, 3),
    in: (u) => u * u * u,
    back: (u) => { const k = 1.70158, d = u - 1; return 1 + (k + 1) * d * d * d + k * d * d; },
    bigBack: (u) => { const k = 3.2, d = u - 1; return 1 + (k + 1) * d * d * d + k * d * d; },
    inBack: (u) => { const k = 1.70158; return (k + 1) * u * u * u - k * u * u; },
    elastic: (u) => (u === 0 || u === 1 ? u : Math.pow(2, -10 * u) * Math.sin((u * 10 - 0.75) * 2.0944) + 1),
    bounce: (u) => {
      const n = 7.5625, d = 2.75;
      if (u < 1 / d) return n * u * u;
      if (u < 2 / d) return n * (u -= 1.5 / d) * u + 0.75;
      if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + 0.9375;
      return n * (u -= 2.625 / d) * u + 0.984375;
    }
  };

  // ---------- tweens ----------
  let tweens = [];
  F.tw = function (o, to, ms, ease, step) {
    tweens = tweens.filter((t) => t.o !== o || !Object.keys(to).some((k) => k in t.to));
    const id = F.runId;
    return F.quiet(new Promise((resolve, reject) => {
      const from = {};
      for (const k in to) from[k] = o[k];
      tweens.push({ o, from, to, t0: performance.now(), ms: F.REDUCED ? 1 : Math.max(1, ms), ease: ease || EZ.inOut, resolve, reject, id, step });
    }));
  };
  function runTweens(t) {
    tweens = tweens.filter((tw) => {
      if (tw.id !== F.runId) { tw.reject(ABORT); return false; }
      const u = Math.min(1, (t - tw.t0) / tw.ms), e = tw.ease(u);
      for (const k in tw.to) tw.o[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
      if (tw.step) tw.step(e, u);
      if (u >= 1) { tw.resolve(); return false; }
      return true;
    });
  }
  // Moves along a curve, never in a straight line (arcs)
  F.arc = function (o, x, y, lift, ms, ease) {
    const x0 = o.x, y0 = o.y, mx = (x0 + x) / 2, my = (y0 + y) / 2 - lift, p = { u: 0 };
    return F.tw(p, { u: 1 }, ms, ease || EZ.inOut, (e) => {
      const v = 1 - e;
      o.x = v * v * x0 + 2 * v * e * mx + e * e * x;
      o.y = v * v * y0 + 2 * v * e * my + e * e * y;
    });
  };
  // Key poses one after another: [[props, ms, ease], ...]
  F.keys = async function (o, list) {
    for (const k of list) await F.tw(o, k[0], k[1], k[2]);
  };

  // ---------- camera ----------
  const cam = F.cam = { x: W / 2, y: H / 2, z: 1, r: 0, shake: 0 };
  const shk = { x: 0, y: 0 };
  F.shake = (amt) => { cam.shake = Math.max(cam.shake, amt); };
  function applyCam(par) {
    c.setTransform(res, 0, 0, res, 0, 0);
    if (!par) return;
    const z = 1 + (cam.z - 1) * par;
    const x = W / 2 + (cam.x - W / 2) * par + shk.x * par, y = H / 2 + (cam.y - H / 2) * par + shk.y * par;
    c.translate(W / 2, H / 2);
    if (cam.r) c.rotate(cam.r * par);
    c.scale(z, z);
    c.translate(-x, -y);
  }
  // From a point in the world to the screen (for things drawn in screen space)
  F.toScreen = (x, y, par) => {
    const p = par === undefined ? 1 : par, z = 1 + (cam.z - 1) * p;
    const cx = W / 2 + (cam.x - W / 2) * p, cy = H / 2 + (cam.y - H / 2) * p;
    return { x: W / 2 + (x - cx) * z, y: H / 2 + (y - cy) * z };
  };

  // ---------- the scene: a list of actors drawn back to front ----------
  let actors = [], bg = "#000";
  F.scene = function (list, opts) {
    opts = opts || {};
    actors = list.filter(Boolean);
    bg = opts.bg || "#000";
    cam.x = W / 2; cam.y = H / 2; cam.z = 1; cam.r = 0; cam.shake = 0;
    tweens = tweens.filter((t) => t.o !== cam);
    if (opts.cam) Object.assign(cam, opts.cam);
  };
  F.add = (a) => { if (actors.indexOf(a) < 0) actors.push(a); return a; };
  F.remove = (a) => { actors = actors.filter((b) => b !== a); };
  F.actors = () => actors;

  // ---------- screen overlays: iris, fades and flashes ----------
  const ov = F.ov = { iris: 2000, ix: W / 2, iy: H / 2, fade: 0, fadeColor: "#000", flash: 0 };
  function drawOverlay() {
    c.setTransform(res, 0, 0, res, 0, 0);
    if (ov.iris < 1600) {
      c.fillStyle = "#000";
      c.beginPath();
      c.rect(0, 0, W, H);
      c.arc(ov.ix, ov.iy, Math.max(0.01, ov.iris), 0, Math.PI * 2, true);
      c.fill("evenodd");
    }
    if (ov.fade > 0.001) {
      c.globalAlpha = Math.min(1, ov.fade);
      c.fillStyle = ov.fadeColor;
      c.fillRect(0, 0, W, H);
      c.globalAlpha = 1;
    }
    if (ov.flash > 0.001) {
      c.globalAlpha = Math.min(1, ov.flash);
      c.fillStyle = "#fff7dc";
      c.fillRect(0, 0, W, H);
      c.globalAlpha = 1;
    }
    if (ov.snapA > 0.001 && snap) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = Math.min(1, ov.snapA);
      c.drawImage(snap, 0, 0, cv.width, cv.height);
      c.globalAlpha = 1;
    }
  }
  // A real dissolve: the old picture is kept and fades away over the new scene
  let snap = null;
  ov.snapA = 0;
  F.dissolve = function (setup, ms) {
    if (!snap) snap = document.createElement("canvas");
    snap.width = cv.width; snap.height = cv.height;
    snap.getContext("2d").drawImage(cv, 0, 0);
    ov.snapA = 1;
    setup();
    return F.tw(ov, { snapA: 0 }, ms || 900, EZ.inOut);
  };
  // The classic way old cartoons end and start a scene
  F.irisOut = (x, y, ms) => { ov.ix = x; ov.iy = y; if (ov.iris > 1500) ov.iris = 1500; return F.tw(ov, { iris: 0 }, ms || 700, EZ.in); };
  F.irisIn = (x, y, ms) => {
    ov.ix = x; ov.iy = y; ov.iris = 0;
    return F.tw(ov, { iris: 1500 }, ms || 800, EZ.out).then(() => { ov.iris = 2000; });
  };
  F.black = () => { ov.iris = 0; };
  F.fadeTo = (v, ms, color) => { if (color) ov.fadeColor = color; return F.tw(ov, { fade: v }, ms || 500, EZ.inOut); };
  F.flash = (v) => { ov.flash = v || 0.8; F.tw(ov, { flash: 0 }, 260, EZ.out); };

  // ---------- per-frame hooks and waits on the clock ----------
  const hooks = [];
  F.onFrame = (fn) => { hooks.push(fn); return () => { const i = hooks.indexOf(fn); if (i >= 0) hooks.splice(i, 1); }; };
  F.until = (test) => {
    const id = F.runId;
    return F.quiet(new Promise((resolve, reject) => {
      const off = F.onFrame(() => {
        if (id !== F.runId) { off(); reject(ABORT); return; }
        if (test()) { off(); resolve(); }
      });
    }));
  };

  // ---------- the frame loop ----------
  let last = 0;
  F.t = 0; F.dt = 0;
  F.step = (t) => Math.floor(t / 83);      // drawings change on twos: twelve times a second
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t; F.t = t; F.dt = dt;
    runTweens(t);
    hooks.slice().forEach((h) => h(t, dt));
    if (cam.shake > 0.05) {
      shk.x = (Math.random() - 0.5) * 2 * cam.shake;
      shk.y = (Math.random() - 0.5) * 2 * cam.shake;
      cam.shake *= Math.pow(0.004, dt);
    } else { shk.x = shk.y = 0; cam.shake = 0; }
    c.setTransform(res, 0, 0, res, 0, 0);
    c.globalAlpha = 1;
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    const list = actors.slice().sort((a, b) => (a.z || 0) - (b.z || 0));
    for (const a of list) {
      if (a.hidden) continue;
      if (a.update) a.update(dt, t);
      if (a.op !== undefined && a.op <= 0.001) continue;
      applyCam(a.par === undefined ? 1 : a.par);
      c.save();
      try { a.draw(c, t, dt); } catch (e) { console.error(e); a.hidden = true; }
      c.restore();
    }
    drawOverlay();
  }
  requestAnimationFrame(frame);

  // =================== sound ===================
  F.muted = false;
  let AC = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null, OFF = 0;
  F.audioInit = function () {
    if (AC) { if (AC.state === "suspended") AC.resume(); return; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    AC = new Ctx();
    master = AC.createGain();
    master.connect(AC.destination);
    sfxBus = AC.createGain();
    sfxBus.gain.value = 0.5;
    sfxBus.connect(master);
    musicBus = AC.createGain();
    musicBus.gain.value = 0.5;
    musicBus.connect(master);
    master.gain.value = F.muted ? 0 : 1;
  };
  function env(g, t, a, d, peak) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function osc(type, f0, f1, dur, vol, a, when) {
    const t = AC.currentTime + (when || 0) + OFF, o = AC.createOscillator(), g = AC.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, a || 0.005, dur, vol);
    o.connect(g); g.connect(sfxBus);
    o.start(t); o.stop(t + (a || 0.005) + dur + 0.05);
    return o;
  }
  function noise(dur, type, f0, f1, vol, q, a, when) {
    const t = AC.currentTime + (when || 0) + OFF;
    if (!noiseBuf) {
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = type; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, a || 0.01, dur, vol);
    s.connect(f); f.connect(g); g.connect(sfxBus);
    s.start(t); s.stop(t + (a || 0.01) + dur + 0.05);
  }
  function vibrato(o, rate, depth, dur) {
    const l = AC.createOscillator(), lg = AC.createGain();
    l.frequency.value = rate; lg.gain.value = depth;
    l.connect(lg); lg.connect(o.frequency);
    l.start(AC.currentTime + OFF); l.stop(AC.currentTime + OFF + dur);
  }
  // Cartoon sound effects, synthesized here (no recordings needed)
  const SFX = {
    pop: (k) => osc("sine", 520 * k, 1500 * k, 0.07, 0.45),
    boing: (k) => vibrato(osc("triangle", 150 * k, 330 * k, 0.42, 0.5), 16, 30 * k, 0.5),
    whoosh: (k) => noise(0.42 * k, "bandpass", 300, 2600, 0.4, 0.9, 0.14),
    swish: (k) => noise(0.2 * k, "bandpass", 2400, 700, 0.3, 1.2, 0.05),
    thud: () => { osc("sine", 130, 42, 0.28, 0.9); noise(0.14, "lowpass", 900, 180, 0.35); },
    ding: () => { osc("sine", 1318, 0, 1.1, 0.25); osc("sine", 2636, 0, 0.6, 0.07); },
    ting: (k) => { osc("sine", 2093 * k, 0, 0.45, 0.18); osc("sine", 3136 * k, 0, 0.25, 0.05); },
    tick: () => noise(0.03, "highpass", 3200, 0, 0.35, 1, 0.001),
    tock: () => noise(0.03, "bandpass", 1400, 0, 0.35, 2, 0.001),
    stamp: () => { osc("square", 95, 48, 0.09, 0.22); noise(0.1, "lowpass", 2000, 300, 0.45, 1, 0.002); },
    zap: () => osc("sawtooth", 1900, 260, 0.2, 0.14),
    sparkle: () => { for (let i = 0; i < 6; i++) osc("sine", 1700 + Math.random() * 2000, 0, 0.16, 0.07, 0.003, i * 0.045); },
    rumble: (k) => noise(1.8 * k, "lowpass", 170, 80, 0.8, 1, 0.25),
    wind: (k) => noise(2.6 * k, "bandpass", 320, 760, 0.28, 0.7, 0.9),
    beep: (k) => osc("square", 880 * k, 0, 0.11, 0.1),
    slideUp: (k) => osc("sine", 280 * k, 980 * k, 0.32, 0.25),
    slideDown: (k) => osc("sine", 980 * k, 240 * k, 0.42, 0.25),
    click: () => noise(0.016, "highpass", 2200, 0, 0.6, 1, 0.001),
    pluck: (k) => osc("triangle", 440 * k, 0, 0.3, 0.3),
    squeak: (k) => osc("square", 1150 * k, 1750 * k, 0.07, 0.07),
    shutter: () => { noise(0.04, "highpass", 1800, 0, 0.5, 1, 0.001); noise(0.05, "highpass", 1500, 0, 0.4, 1, 0.001, 0.07); },
    rip: () => noise(0.3, "highpass", 900, 4000, 0.3, 0.8, 0.01),
    tada: () => { [523, 659, 784, 1046].forEach((f, i) => osc("triangle", f, 0, 0.5, 0.16, 0.01, i * 0.07)); },
    sad: () => { [392, 370, 349, 330].forEach((f, i) => osc("triangle", f, 0, 0.45, 0.12, 0.02, i * 0.32)); },
    radio: (k) => { for (let i = 0; i < 3; i++) osc("sine", 1250 * k, 0, 0.08, 0.1, 0.003, i * 0.16); },
    // an old television: k seconds of grey "snow" hiss, then the dial clicking onto a station
    static: (k) => {
      noise(k, "highpass", 1200, 0, 0.55, 0.6, 0.02);                  // the hiss of the grey snow, loud and wide
      noise(k, "bandpass", 3800, 2600, 0.3, 0.5, 0.02);
      noise(k, "lowpass", 260, 0, 0.18, 0.7, 0.05);                     // a low hum of the old set
      for (let i = 0; i < k * 9; i++) noise(0.014, "highpass", 2500, 0, 0.55, 1, 0.001, Math.random() * k);   // crackles
    },
    tvon: () => { osc("sine", 15600, 15600, 0.25, 0.03, 0.002); noise(0.18, "bandpass", 900, 3200, 0.35, 1.2, 0.004); },
    tune: () => { noise(0.22, "bandpass", 4200, 500, 0.32, 2.5, 0.005); osc("sine", 90, 50, 0.12, 0.35, 0.002, 0.2); }
  };
  F.sfx = function (name, k) {
    if (F.RENDER) { F.renderLog.sfx.push([name, k || 1, performance.now()]); return; }
    if (!AC || F.muted || !SFX[name]) return;
    try { SFX[name](k || 1); } catch (e) { /* sound is never allowed to stop the story */ }
  };

  F.renderSfx = async function (seconds) {
    const sr = 44100, off = new OfflineAudioContext(1, Math.ceil(sr * seconds), sr);
    AC = off; noiseBuf = null;
    master = off.createGain(); master.connect(off.destination);
    sfxBus = off.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
    for (const e of F.renderLog.sfx) {
      OFF = Math.max(0, (e[2] - F.renderLog.t0) / 1000);
      try { SFX[e[0]](e[1]); } catch (err) { /* skip */ }
    }
    OFF = 0;
    const buf = await off.startRendering(), d = buf.getChannelData(0);
    const out = new DataView(new ArrayBuffer(44 + d.length * 2));
    const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    str(0, "RIFF"); out.setUint32(4, 36 + d.length * 2, true); str(8, "WAVE"); str(12, "fmt ");
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true); out.setUint32(24, sr, true);
    out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); str(36, "data"); out.setUint32(40, d.length * 2, true);
    for (let i = 0; i < d.length; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
    const bytes = new Uint8Array(out.buffer);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
    return btoa(bin);
  };

  // ---------- music: one looping track under the voice, lowered while someone speaks ----------
  let music = null, musicTarget = 0.5, musicNow = 0, musicSrc = "";
  F.renderLog.music = [];
  F.music = function (src, vol) {
    if (F.RENDER) {
      if (musicSrc === src && vol === undefined) return;
      musicSrc = src || ""; musicTarget = vol === undefined ? 0.35 : vol;
      F.renderLog.music.push([musicSrc, musicTarget, performance.now()]);
      return;
    }
    if (music && music._src === src) { if (vol !== undefined) musicTarget = vol; return; }
    if (music) { music.pause(); music = null; }
    if (!src) return;
    music = new Audio(src + "?v=" + window.BUILD);
    music._src = src;
    music.loop = true;
    music.volume = 0;
    music.muted = F.muted;
    musicNow = 0;
    musicTarget = vol === undefined ? 0.35 : vol;
    music.play().catch(() => {});
  };
  F.musicVol = (v) => {
    musicTarget = v;
    if (F.RENDER) F.renderLog.music.push([musicSrc, v, performance.now()]);
  };

  // =================== voice: the team's recordings, with the mouth following their loudness ===================
  const VOICE = window.VOICE || {};
  let cur = null;
  F.voiceLevel = function (n, sec) {
    const v = VOICE[n];
    if (!v) return 0;
    const i = Math.floor(sec * 12) * 2;            // read on twos: the mouth changes 12 times a second
    return v.env[Math.min(i, v.env.length - 1)] || 0;
  };
  F.speak = function (n, onLevel) {
    F.stopVoice();
    const id = F.runId;
    return F.quiet(new Promise((resolve, reject) => {
      const v = VOICE[n];
      if (!v) { resolve(); return; }
      const a = new Audio("assets/voice/" + (n < 10 ? "0" : "") + n + ".mp3?v=" + window.BUILD);
      a.muted = F.muted || F.RENDER;
      const me = {
        n, a, t0: performance.now(), silent: false, done: false, onLevel,
        finish(stopped) {
          if (me.done) return;
          me.done = true;
          if (onLevel) onLevel(0);
          if (cur === me) { cur = null; F.caption(0); }    // the line is over: its caption goes away too
          if (stopped || id !== F.runId) reject(ABORT); else resolve();
        }
      };
      cur = me;
      if (F.RENDER) {
        me.silent = true;
        F.renderLog.voice.push([n, performance.now()]);
      } else {
        a.addEventListener("ended", () => me.finish());
        a.addEventListener("error", () => { me.silent = true; });
        // if the browser refuses to play, the story keeps the timing of the line anyway
        a.play().catch(() => { me.silent = true; });
      }
      F.caption(n);
    }));
  };
  // the voice clock: the audio's own time, but never more than 1 s behind the real clock, so a voice that
  // stalls or starts late can never freeze the story (with a healthy voice, the audio time always wins)
  F.vt = () => {
    if (!cur) return Infinity;
    const wall = (performance.now() - cur.t0) / 1000;
    return cur.silent ? wall : Math.max(cur.a.currentTime, wall - 1);
  };
  F.speaking = () => !!cur;
  F.stopVoice = function () {
    if (!cur) return;
    const me = cur;
    me.a.pause();
    me.finish(true);
    F.caption(0);
  };
  // Resolves when line n reaches `sec` seconds (or when the line is over)
  F.at = (n, sec) => F.until(() => !cur || cur.n !== n || F.vt() >= sec);
  F.onFrame(() => {
    if (cur) {
      const sec = F.vt();
      if (cur.onLevel) cur.onLevel(F.voiceLevel(cur.n, sec));
      const late = !cur.silent && (performance.now() - cur.t0) / 1000 > VOICE[cur.n].d + 2;   // the audio never said "ended"
      if ((cur.silent && sec >= VOICE[cur.n].d) || late) { if (late) cur.a.pause(); cur.finish(); F.caption(0); }
    }
    if (music) {
      const want = F.muted ? 0 : musicTarget * (cur ? 0.35 : 1);
      musicNow += (want - musicNow) * Math.min(1, F.dt * 3);
      music.volume = Math.max(0, Math.min(1, musicNow));
    }
  });

  // ---------- captions, off unless asked for ----------
  const ccEl = $("cc"), ccBtn = $("ccBtn");
  let ccOn = false;
  F.LINES = {};
  // each word lights up in gold as the voice says it (times from web/data/words.js; words the speech model
  // missed are spread evenly between the ones it caught)
  let ccWords = [], ccN = 0;
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  function wordTimes(n, words) {
    const W = (window.WORDS || {})[n] || [];
    const out = new Array(words.length).fill(null);
    let j = 0;
    for (let i = 0; i < words.length; i++) {
      const a = norm(words[i]);
      for (let k = j; k < Math.min(W.length, j + 5); k++) {
        const b = norm(W[k][0]);
        if (a && b && (a === b || a.startsWith(b.slice(0, 3)) || b.startsWith(a.slice(0, 3)))) { out[i] = W[k][1]; j = k + 1; break; }
      }
    }
    const d = (VOICE[n] && VOICE[n].d) || words.length * 0.4;
    let last = -1;
    for (let i = 0; i <= words.length; i++) {
      if (i === words.length || out[i] !== null) {
        const t0 = last < 0 ? 0 : out[last], t1 = i === words.length ? d : out[i];
        for (let m = last + 1; m < i; m++) out[m] = t0 + (t1 - t0) * (m - last) / (i - last);
        last = i;
      }
    }
    return out;
  }
  F.caption = function (n) {
    if (!ccEl) return;
    const txt = n ? F.LINES[n] || "" : "";
    ccEl.textContent = "";
    ccWords = []; ccN = n;
    if (txt) {
      const words = txt.split(/\s+/), times = wordTimes(n, words);
      words.forEach((w, i) => {
        const s = document.createElement("span");
        s.textContent = w + (i < words.length - 1 ? " " : "");
        ccEl.appendChild(s);
        ccWords.push([s, times[i]]);
      });
    }
    ccEl.classList.toggle("hidden", !ccOn || !txt);
  };
  F.onFrame(() => {
    if (!ccOn || !ccWords.length || !cur || cur.n !== ccN) return;
    const t = F.vt();
    for (const [s, ts] of ccWords) s.classList.toggle("said", ts <= t + 0.05);
  });
  if (ccBtn) {
    ccBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      ccOn = !ccOn;
      ccBtn.textContent = "Captions: " + (ccOn ? "on" : "off");
      ccBtn.setAttribute("aria-pressed", ccOn ? "true" : "false");
      ccEl.classList.toggle("hidden", !ccOn || !ccEl.textContent);
      ccBtn.blur();
    });
  }

  // ---------- sound button ----------
  const muteBtn = $("mute");
  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    F.muted = !F.muted;
    if (cur) cur.a.muted = F.muted;
    if (music) music.muted = F.muted;
    if (master) master.gain.value = F.muted ? 0 : 1;
    muteBtn.textContent = "Sound: " + (F.muted ? "off" : "on");
    muteBtn.setAttribute("aria-pressed", F.muted ? "true" : "false");
    muteBtn.blur();
  });

  // =================== old film finish: grain, flicker, scratches, specks, a frame that weaves ===================
  let fxOn = !F.REDUCED;
  const grainEl = $("grain"), film = $("film"), fctx = film.getContext("2d"), fxBtn = $("fx");
  (function () {
    const g0 = document.createElement("canvas");
    g0.width = g0.height = 256;
    const g = g0.getContext("2d"), img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    grainEl.style.backgroundImage = "url(" + g0.toDataURL() + ")";
  })();
  let scratches = [];
  function filmFrame() {
    grainEl.style.backgroundPosition = Math.floor(Math.random() * 256) + "px " + Math.floor(Math.random() * 256) + "px";
    weave.x = (Math.random() - 0.5) * 0.8;
    weave.y = (Math.random() - 0.5) * 0.8;
    if (Math.random() < 0.02) weave.y += Math.random() < 0.5 ? -1.5 : 1.5;
    applyStage();
    fctx.clearRect(0, 0, 640, 360);
    const f = Math.random();
    if (f < 0.45) { fctx.fillStyle = "rgba(0,0,0," + (Math.random() * 0.035).toFixed(3) + ")"; fctx.fillRect(0, 0, 640, 360); }
    else if (f > 0.965) { fctx.fillStyle = "rgba(255,255,255,0.045)"; fctx.fillRect(0, 0, 640, 360); }
    if (Math.random() < 0.035 && scratches.length < 2) scratches.push({ x: Math.random() * 640, life: 4 + Math.random() * 22, light: Math.random() < 0.7 });
    scratches = scratches.filter((s) => s.life-- > 0);
    scratches.forEach((s) => {
      s.x += (Math.random() - 0.5) * 1.2;
      fctx.strokeStyle = s.light ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.25)";
      fctx.lineWidth = 0.6;
      fctx.beginPath(); fctx.moveTo(s.x, 0); fctx.lineTo(s.x + (Math.random() - 0.5) * 2, 360); fctx.stroke();
    });
    if (Math.random() < 0.15) {
      const x = Math.random() * 640, y = Math.random() * 360;
      if (Math.random() < 0.72) {
        fctx.fillStyle = "rgba(0,0,0,0.6)";
        fctx.beginPath(); fctx.arc(x, y, 0.6 + Math.random() * 1.8, 0, 6.2832); fctx.fill();
      } else {
        fctx.strokeStyle = "rgba(0,0,0,0.5)";
        fctx.lineWidth = 0.5;
        fctx.beginPath(); fctx.moveTo(x, y); fctx.quadraticCurveTo(x + 6 - Math.random() * 12, y + 5, x + 10 - Math.random() * 20, y + 12); fctx.stroke();
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
  fxBtn.addEventListener("click", (e) => { e.stopPropagation(); setFx(!fxOn); fxBtn.blur(); });
  setInterval(() => { if (fxOn) filmFrame(); }, 83);

  // ---------- small helpers ----------
  F.lerp = (a, b, u) => a + (b - a) * u;
  F.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  F.mix = (c1, c2, u) => "rgb(" + Math.round(F.lerp(c1[0], c2[0], u)) + "," + Math.round(F.lerp(c1[1], c2[1], u)) + "," + Math.round(F.lerp(c1[2], c2[2], u)) + ")";
  F.rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  F.show = (el) => el.classList.remove("hidden");
  F.hide = (el) => el.classList.add("hidden");
})();
