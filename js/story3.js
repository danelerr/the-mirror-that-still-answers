/* The Mirror That Still Answers — chapter 3: Pioneer 10, and the ending.
   Distances: NASA/JPL Horizons (target -23), month by month since 1972.
   Team Unsigned Int, NASA Space Apps Challenge 2026.
   Code written with an AI coding assistant, directed and reviewed by the team. */
(function () {
  "use strict";
  const F = window.F, W = F.W, H = F.H, EZ = F.EZ, IM = F.IM;
  const tw = F.tw, wait = F.wait, sfx = F.sfx;
  const S = F.story, atw = S.atw;

  F.load([["ph_opp", "assets/photos/PIA17759.jpg"], ["ph_p10", "assets/photos/ARC-1972-AC72-2135.jpg"], ["ph_p10art", "assets/photos/ARC-1972-AC72-1354.jpg"]]);

  // ---------- Pioneer 10's distance: real values for any day, from the monthly table ----------
  const P10 = window.PIONEER.map((r) => ({ t: Date.parse(r[0] + "T00:00:00Z"), sun: r[1], au: r[2], km: r[3], lt: r[4] }));
  function p10At(ms) {
    let i = 0;
    while (i < P10.length - 2 && P10[i + 1].t <= ms) i++;
    const a = P10[i], b = P10[i + 1], u = (ms - a.t) / (b.t - a.t);   // past the end of the table it carries on in a straight line
    return { au: F.lerp(a.au, b.au, u), km: F.lerp(a.km, b.km, u), lt: F.lerp(a.lt, b.lt, u) };
  }
  const today = () => p10At(Date.now());
  const hm = (h) => { const m = Math.round(h * 60); return Math.floor(m / 60) + " h " + (m % 60) + " min"; };
  const bil = (km) => (km / 1e9).toFixed(1) + " billion km";

  // ---------- the narrator window (shared look with chapter 2) ----------
  const nar = F.mirror({ x: 0, y: 0, s: 0.33, eyes: "open", mouth: "smile", shadow: false, bobAmt: 0.6, hands: false });
  const inset = F.custom(function (c, t) {
    const R = 78, cx = 104, cy = 100;
    c.globalAlpha = this.op;
    c.translate(cx, cy); c.scale(this.s, this.s); c.translate(-cx, -cy);
    c.fillStyle = "rgba(0,0,0,0.35)"; c.beginPath(); c.arc(cx + 5, cy + 7, R + 6, 0, 6.2832); c.fill();
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.clip();
    if (F.ready(IM.sc_luna)) c.drawImage(IM.sc_luna, cx - 300, cy - 210, 520, 292);
    nar.x = cx + 6; nar.y = cy + 92; nar.draw(c, t);
    c.restore();
    c.strokeStyle = F.INK; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.stroke();
    c.strokeStyle = F.GOLD; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cy, R - 5, 0, 6.2832); c.stroke();
  }, { par: 0, z: 160, op: 1, s: 1 });
  const say = (n) => F.speak(n, nar.talk);

  // ======================== Pioneer 10, the puppet ========================
  // Body and dish, two long trusses with power units and a thin boom: pieces of the team's illustration.
  F.probe = (o) => {
    const a = Object.assign({ x: 640, y: 360, s: 0.5, sx: 1, sy: 1, rot: 0, op: 1, z: 30, par: 1, eyes: "open", lx: 0, ly: 0, unfold: 1,
      ba: 0, baV: 0, bb: 0, bbV: 0, bl: 0, blV: 0, sleepy: 0, seed: Math.random() * 3000,
      lid: 0, browY: 0, browT: 0, pup: 1, happy: 0, eyeS: 1 }, o);
    a.update = function (dt) {
      const k = this.unfold, droop = this.sleepy * 0.25;
      spring(this, "ba", "baV", (1 - k) * 1.3 + droop, 60, 6, dt);
      spring(this, "bb", "bbV", -(1 - k) * 1.3 - droop, 55, 5, dt);
      spring(this, "bl", "blV", (1 - k) * -1.6 + droop, 40, 4, dt);
    };
    function spring(o, k, vk, target, stiff, damp, dt) { const acc = (target - o[k]) * stiff - o[vk] * damp; o[vk] += acc * dt; o[k] += o[vk] * dt; }
    function boom(c, im, attachX, attachY, ang, w) {
      const img = IM[im];
      if (!F.ready(img)) return;
      const h = w * img.height / img.width;
      c.save(); c.translate(attachX, attachY); c.rotate(ang);
      c.drawImage(img, -0.82 * w, -0.97 * h, w, h);
      c.restore();
    }
    // the drawn probe (the team's sheets): one design in every scene, chosen by its state
    a.drawing = function (t) {
      if (this.drawn === false) return null;
      const st = Math.floor(t / 1000 * 12), has = F.hasSprites, mood = this.faceName || "neutral";
      let set = null, k = 0;
      if (this.radio && has("P4_sonda_llama")) { set = "P4_sonda_llama"; k = Math.floor(st / 2) % 12; }
      else if (this.unfold < 0.5 && has("P1_sonda_despliega")) { set = "P1_sonda_despliega"; k = 0; }
      else if (this.eyes === "closed" && has("P5_sonda_se_apaga")) { set = "P5_sonda_se_apaga"; k = 15; }
      else if ((this.eyes === "half" || this.sleepy > 0.5) && has("P5_sonda_se_apaga")) { set = "P5_sonda_se_apaga"; k = 6; }
      else if (has("P3_sonda_jupiter")) {
        set = "P3_sonda_jupiter";
        k = { surprised: 4, scared: 6, curious: 0, happy: 8, proud: 9 }[mood];
        if (k === undefined) k = 8;
        if (k === 0 || k === 8) k += Math.floor(st / 6) % 2;     // a gentle two-step while it floats
      }
      const im = set ? IM["spr_" + set + "_" + k] : null;
      return F.ready(im) ? { im, set } : null;
    };
    a.draw = function (c, t) {
      const body = IM.sonda_cuerpo;
      if (!F.ready(body)) return;
      const bw = 420, bh = bw * 887 / 826, st = F.step(t);
      const drift = Math.sin(t / 1300) * 6;
      c.globalAlpha = this.op;
      c.translate(this.x, this.y + drift);
      c.rotate(this.rot + Math.sin(t / 2100) * 0.03);
      const dr = this.drawing(t);
      if (dr) {
        const meta = (window.SPRITES || {})[dr.set] || {}, P = F.CHAR.probe;
        let w = 400 * this.s / 0.45, h = w * dr.im.height / dr.im.width, x0 = -w / 2, y0 = -h / 2;
        if (meta.u) {                              // same dish size and same dish position for every sheet
          const k = P.k * this.s * P.U / meta.u;
          w = meta.w * k; h = meta.h * k; x0 = -meta.cx * k; y0 = -meta.cy * k;
        }
        c.scale(this.sx, this.sy);
        c.drawImage(dr.im, x0, y0, w, h);
        return;
      }
      c.scale(this.s * this.sx, this.sy * this.s);
      const hx = -bw / 2 + 0.16 * bw, hy = -bh / 2 + 0.72 * bh;      // the small six-sided body
      boom(c, "sonda_brazo_a", hx, hy, -1.05 + this.ba, 200);
      boom(c, "sonda_brazo_b", hx, hy, -2.35 + this.bb, 200);
      boom(c, "sonda_brazo_largo", hx + 40, hy + 30, 2.5 + this.bl, 260);
      c.drawImage(body, -bw / 2, -bh / 2, bw, bh);
      const base = { open: 0, half: 0.5, closed: 1 }[this.eyes] || 0, ex = -bw / 2 + 0.6 * bw, ey = -bh / 2 + 0.42 * bh;
      F.drawEyes(c, [[ex - 38, ey], [ex + 38, ey]], { lid: Math.max(base, this.lid), browY: this.browY, browT: this.browT, pup: this.pup,
        happy: this.happy, eyeS: this.eyeS, lx: this.lx / 10, ly: this.ly / 10, seed: this.seed, blinkEvery: 4100 }, t,
        { rx: 30, ry: 38, lidColor: "#f4ecd6", browGap: 12, lw: 6 });
    };
    return a;
  };

  // ---------- small pieces drawn here ----------
  function rocks(n, seed) {
    const r = F.rng(seed), list = [];
    for (let i = 0; i < n; i++) list.push({ x: r() * 2600, y: 60 + r() * 600, r: 14 + r() * 50, d: 0.3 + r() * 1.2, rot: r() * 6, vr: (r() - 0.5) * 1.2, k: Math.floor(r() * 3) });
    return list;
  }
  const belt = F.custom(function (c, t) {
    for (const a of this.list) {
      const x = ((a.x - this.pos * a.d) % 2600 + 2600) % 2600 - 600;
      c.save(); c.translate(x, a.y); c.rotate(a.rot + t / 1000 * a.vr); c.scale(a.d, a.d);
      c.fillStyle = ["#8a7a68", "#6f6252", "#a08c74"][a.k]; c.strokeStyle = F.INK; c.lineWidth = 4 / a.d;
      c.beginPath();
      for (let i = 0; i < 9; i++) { const an = i / 9 * 6.2832, rr = a.r * (0.75 + ((i * 37 + a.k * 11) % 10) / 30); c[i ? "lineTo" : "moveTo"](Math.cos(an) * rr, Math.sin(an) * rr); }
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "rgba(0,0,0,0.25)"; c.beginPath(); c.arc(a.r * 0.2, -a.r * 0.15, a.r * 0.22, 0, 6.2832); c.fill();
      c.restore();
    }
  }, { z: 20, par: 0, pos: 0, list: rocks(36, 22) });
  const jupiter = F.custom(function (c, t) {
    const cx = this.x, cy = this.y, R = this.r;
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.clip();
    const bands = ["#e9d5b0", "#c98b5a", "#efe0c2", "#b46d43", "#e7cfa6", "#c48958", "#f1e4c8", "#a8653e", "#e3c99e"];
    for (let i = 0; i < 18; i++) {
      c.fillStyle = bands[i % bands.length];
      const y0 = cy - R + i * (2 * R / 18), wob = Math.sin(i * 1.7 + t / 900) * 6;
      c.beginPath(); c.moveTo(cx - R, y0 + wob);
      for (let x = -R; x <= R; x += 40) c.lineTo(cx + x, y0 + Math.sin(x / 60 + i + t / 1500) * 7 + wob);
      c.lineTo(cx + R, y0 + 2 * R / 18 + 8); c.lineTo(cx - R, y0 + 2 * R / 18 + 8); c.closePath(); c.fill();
    }
    const sx = cx + R * 0.25 + Math.sin(t / 4000) * 30, sy = cy + R * 0.32;
    c.fillStyle = "#b5432c"; c.beginPath(); c.ellipse(sx, sy, R * 0.2, R * 0.11, 0, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(90,30,20,0.6)"; c.lineWidth = 4; c.stroke();
    const g = c.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
    g.addColorStop(0, "rgba(255,255,255,0.08)"); g.addColorStop(1, "rgba(0,0,0,0.6)");
    c.fillStyle = g; c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    c.restore();
    c.strokeStyle = F.INK; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.stroke();
  }, { z: 5, x: 980, y: 400, r: 330 });
  // radio rings travelling from a to b
  function rings(o) {
    return F.custom(function (c, t) {
      for (let i = 0; i < this.n; i++) {
        const u = ((t / this.period + i / this.n) % 1);
        if (u > this.k) continue;
        const x = F.lerp(this.ax, this.bx, u), y = F.lerp(this.ay, this.by, u), ang = Math.atan2(this.by - this.ay, this.bx - this.ax);
        c.strokeStyle = this.color; c.lineWidth = 4; c.globalAlpha = this.op * (1 - u * 0.6);
        c.beginPath(); c.arc(x, y, 18 + u * 30, ang - 0.7, ang + 0.7); c.stroke();
      }
    }, Object.assign({ z: 25, n: 5, period: 1400, k: 1, op: 1, color: "#ffe07a", ax: 0, ay: 0, bx: 0, by: 0 }, o));
  }
  const clock = F.custom(function (c) {
    c.translate(this.x, this.y); c.scale(this.s, this.s);
    c.lineCap = "round"; c.lineJoin = "round";
    c.fillStyle = "rgba(0,0,0,0.3)"; c.beginPath(); c.arc(7, 10, 118, 0, 6.2832); c.fill();           // soft drop shadow
    c.fillStyle = "#e3b04a"; c.strokeStyle = F.INK; c.lineWidth = 9;
    c.beginPath(); c.arc(0, 0, 116, 0, 6.2832); c.fill(); c.stroke();                                 // gold case
    c.strokeStyle = "rgba(255,240,190,0.85)"; c.lineWidth = 8; c.beginPath(); c.arc(0, 0, 104, -2.6, -1.3); c.stroke();
    c.strokeStyle = F.INK; c.fillStyle = "#f6ead0"; c.lineWidth = 7;
    c.beginPath(); c.arc(0, 0, 92, 0, 6.2832); c.fill(); c.stroke();                                  // cream face
    c.lineWidth = 7;
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832, r0 = i % 3 ? 72 : 62; c.beginPath(); c.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); c.lineTo(Math.sin(a) * 81, -Math.cos(a) * 81); c.stroke(); }
    const h = this.h, ah = (h % 12) / 12 * 6.2832, am = (h % 1) * 6.2832;
    c.lineWidth = 11; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(ah) * 46, -Math.cos(ah) * 46); c.stroke();
    c.lineWidth = 11; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(am) * 68, -Math.cos(am) * 68); c.stroke();
    c.lineWidth = 5; c.strokeStyle = F.RED; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(am) * 68, -Math.cos(am) * 68); c.stroke();
    c.fillStyle = F.INK; c.beginPath(); c.arc(0, 0, 11, 0, 6.2832); c.fill();
    c.font = "bold 40px " + F.FONT; c.textAlign = "center"; c.textBaseline = "middle";
    const txt = hm(this.h); const w = c.measureText(txt).width + 36;
    c.fillStyle = F.INK; F.roundRect(c, -w / 2, 128, w, 58, 12); c.fill();
    c.fillStyle = "#ffe07a"; c.fillText(txt, 0, 158);
  }, { par: 0, z: 90, x: 1010, y: 300, s: 0.9, h: 0 });

  // ======================== CHAPTER 3 ========================
  async function launch72() {
    const pad = F.plate("sc_plataforma", { x: -30, y: -20, w: 1340, h: 754, tint: "#0b1030", tintA: 0.55 });
    const rocket = F.sprite("obj_cohete2", { x: 650, y: 552, w: 81, ax: 0.5, ay: 1, z: 20 });
    const p = F.particles({ z: 25 });
    F.scene([F.stars({ n: 120, par: 0.2, h: 300 }), pad, rocket, p, inset], { bg: "#0b1030", cam: { x: 640, y: 380, z: 1.05 } });
    await F.irisIn(650, 420, 600);
    const v = say(21);
    await atw(21, "1972", 0, 3.5);
    const when = F.stamp(["March 1972"], { x: 1030, y: 110, size: 46, rot: -0.05, kicker: "Pioneer 10 leaves Earth" });
    F.popIn(when, 400, "stamp");
    await tw(F.cam, { x: 655, y: 440, z: 1.45 }, 700, EZ.inOut);   // staging: close on the rocket before it goes
    // the same clear beats as the 2003 launch, a little quicker to keep up with the voice
    await F.rocketLaunch(rocket, p, { smoke: "#e9e3d6", ink: "rgba(30,30,50,0.5)", build: 600, hold: 150, creep: 500, ms: 1400, cam: { x: 640, y: 150, z: 1 }, camMs: 2000 });
    F.popOut(when);
    // in space, the probe unfolds its arms (follow-through makes them bounce)
    const pr = F.probe({ x: 640, y: 380, s: 0.62, unfold: 0, ba: 1.3, bb: -1.3, bl: -1.6, eyes: "closed" });
    F.scene([F.stars({ n: 260, par: 0.2 }), pr, inset], { bg: "#05060a" });
    F.flash(0.4);
    await atw(21, "pioneer", 0, 5.2);
    if (F.hasSprites("P1_sonda_despliega")) {
      // the team's drawn frames: the booms swing out, bounce too far and settle, it wakes up, stretches and waves
      const un = F.probeFrames("P1_sonda_despliega", pr);
      F.add(un); pr.op = 0;
      // pose to pose, each beat held long enough to read: folded and asleep, the booms swing out and overshoot
      // (a squash on each bounce), they settle, one eye opens, both open, a stretch, a wave
      await wait(380);
      sfx("slideUp");
      for (const [f, ms, snd, sq] of [[2, 150], [3, 130, "boing", 1], [4, 130], [5, 150, null, 1], [6, 200], [7, 320],
        [8, 420, "ting"], [9, 260], [10, 200], [11, 300], [12, 220, "swish"], [13, 260], [14, 220], [15, 520, "tada"]]) {
        un.frame = f; if (snd) sfx(snd);
        if (sq) { un.sx = 1.08; un.sy = 0.93; tw(un, { sx: 1, sy: 1 }, 260, EZ.elastic); }
        await wait(ms);
      }
      pr.unfold = 1; pr.eyes = "open"; F.faceNow(pr, "happy");
      F.remove(un); pr.op = 1;
    } else {
      pr.unfold = 1; sfx("slideUp");
      await wait(400);
      pr.eyes = "open"; F.faceNow(pr, "surprised"); sfx("ting");
      wait(500).then(() => F.face(pr, "happy")).catch(() => {});
    }
    const name = F.stamp(["Pioneer 10"], { x: 1020, y: 140, size: 52, style: "card", rot: 0.04, kicker: "spacecraft, 1972" });
    F.popIn(name, 400, "tada");
    await v;
    const proof = F.proof("ph_p10", "Pioneer 10 being prepared, 1972. NASA Ames photo ARC-1972-AC72-2135.", { x: 960, y: 340, w: 420, rot: 0.04 });
    tw(pr, { x: 330 }, 600, EZ.inOut);
    F.popOut(name);
    F.popIn(proof, 400, "shutter");
    await wait(1700);
    F.popOut(proof);
    return pr;
  }

  async function belt22(pr) {
    pr.x = 520; pr.y = 380; pr.s = 0.45; pr.unfold = 1;
    F.scene([F.stars({ n: 260, par: 0.1 }), pr, belt, inset], { bg: "#05060a" });
    const v = say(22);
    const go = F.onFrame((t, dt) => { belt.pos += 900 * dt; });
    // it dodges the rocks: leans, squashes, and its eyes go wide
    const dodges = [[-0.25, -90, 900], [0.3, 110, 1000], [-0.2, -40, 800]];
    let p2 = null;
    if (F.hasSprites("P2_sonda_esquiva")) {
      // the team's drawn frames: it ducks, leans, spins and squeezes between the rocks, then cheers
      p2 = F.probeFrames("P2_sonda_esquiva", pr, { x: 560, y: 380 });
      F.add(p2); pr.op = 0;
      F.guard((async () => { for (let i = 0; i < 4; i++) { p2.frame = i; await wait(900); } })());
    }
    await atw(22, "asteroid", 0, 4.1);
    if (p2) {
      for (const i of [4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15]) {      // (drawing 12 came out with a dark, hollow dish)
        p2.frame = i;
        if (i % 3 === 1) sfx("swish");
        tw(p2, { y: 380 + Math.sin(i * 1.3) * 40 }, 110, EZ.inOut);
        await wait(130);
      }
      sfx("tada");
    } else {
      F.face(pr, "scared");
      for (const d of dodges) {
        sfx("swish"); pr.lx = d[0] > 0 ? 8 : -8;
        tw(pr, { rot: d[0], y: 380 + d[1], sx: 0.92, sy: 1.08 }, 260, EZ.out);
        await wait(260);
        tw(pr, { sx: 1, sy: 1 }, 300, EZ.elastic);
        await wait(d[2] / 3);
      }
      pr.lx = 0; F.face(pr, "happy");
      tw(pr, { rot: 0, y: 380 }, 400, EZ.inOut);
    }
    await atw(22, "jupiter", 0, 5.9);
    go();
    if (p2) { F.remove(p2); pr.op = 1; }
    // past the giant planet
    jupiter.x = 1100; jupiter.r = 340;
    pr.x = -100; pr.y = 260; pr.s = 0.3;
    F.scene([F.stars({ n: 260, par: 0.1 }), jupiter, pr, inset, F.credit("Drawing of Jupiter. Pioneer 10 flew past it in December 1973.")], { bg: "#05060a", cam: { x: 640, y: 360, z: 1 } });
    tw(jupiter, { x: 900 }, 3600, EZ.inOut);
    sfx("whoosh", 1.5);
    await tw(pr, { x: 620, y: 300 }, 2200, EZ.out);
    pr.eyes = "open"; pr.lx = 10; F.face(pr, "surprised");
    let amaze = null;
    if (F.hasSprites("P3_sonda_jupiter")) {
      // the team's drawn frames: it looks up at the giant, eyes widening, "oh!", then smiles, waves and takes a photo
      amaze = F.probeFrames("P3_sonda_jupiter", pr);
      F.add(amaze); pr.op = 0;
      F.guard((async () => {
        for (const [f, ms, snd] of [[0, 300], [1, 260], [2, 200], [3, 200, "boing"], [4, 360], [8, 260], [9, 260], [10, 180, "swish"], [11, 180],
          [10, 180], [11, 220], [12, 220, "shutter"], [13, 380], [14, 200], [15, 380], [14, 200], [15, 600]]) {
          if (!amaze) return;
          amaze.frame = f; if (snd) sfx(snd); if (f === 12) F.flash(0.3);
          await wait(ms);
        }
      })());
    } else wait(900).then(() => F.face(pr, "curious")).catch(() => {});
    await v;
    const art = F.proof("ph_p10art", "How NASA pictured Pioneer 10 at Jupiter. NASA Ames artwork ARC-1972-AC72-1354.", { x: 380, y: 470, w: 380, rot: -0.04, label: "NASA ART" });
    F.popIn(art, 400, "shutter");
    await wait(1800);
    F.popOut(art);
    if (amaze) { F.remove(amaze); amaze = null; pr.op = 1; F.faceNow(pr, "happy"); }
    pr.lx = 0;
  }

  async function years23(pr) {
    const earth = F.sprite("earth", { x: 140, y: 560, w: 90, z: 10 });
    pr.x = 980; pr.y = 300; pr.s = 0.38; pr.rot = 0; F.faceNow(pr, "happy");
    const r1 = rings({ ax: 900, ay: 330, bx: 160, by: 560, k: 1, op: 0 });
    F.scene([F.stars({ n: 260, par: 0.1 }), earth, r1, pr, inset], { bg: "#05060a" });
    const v = say(23);
    await atw(23, "21", 0, 2.0);
    const plan = F.stamp(["21 months"], { x: 640, y: 160, size: 50, style: "card", kicker: "what it was built for" });
    F.popIn(plan, 360);
    await atw(23, "kept", 0, 3.5);
    plan.lines = ["21 months"];
    sfx("rip");
    const x = F.icon("voice", { x: 640, y: 160, s: 0.01, op: 0 });
    F.popOut(plan);
    tw(r1, { op: 1 }, 400);
    pr.radio = true;                       // drawn: it talks home through its dish, sending little radio waves
    const yr = F.stamp(["1972"], { x: 640, y: 170, size: 64, style: "gold" });
    F.add(yr);
    const beeps = F.every(900, () => sfx("radio", 1.2));
    const yy = { y: 1972 };
    await F.tw(yy, { y: 2003 }, 2600, EZ.inOut, () => { yr.lines = [String(Math.round(yy.y))]; });
    beeps();
    yr.lines = ["2003"];
    const more = F.stamp(["more than 30 years"], { x: 640, y: 260, size: 34, style: "card", rot: 0.03 });
    F.popIn(more, 360, "tada");
    await v;
    pr.radio = false;
    F.remove(x);
  }

  async function signal24() {
    const dish = F.plate("sc_antena", { x: -30, y: -20, w: 1340, h: 754 });
    const r1 = rings({ ax: 60, ay: 40, bx: 500, by: 330, k: 0, period: 1800, color: "#fff2b0" });
    const p = F.particles({ z: 40 });
    F.scene([dish, r1, p, inset, F.credit("Painted scene: AI image generator. Distance: NASA/JPL Horizons.")], { bg: "#4a3a5a", cam: { x: 640, y: 360, z: 1 } });
    await F.irisIn(500, 330, 600);
    const v = say(24);
    tw(r1, { k: 1 }, 1600, EZ.inOut);
    await atw(24, "january", 0, 2.8);
    const last = p10At(Date.UTC(2003, 0, 22));
    const when = F.stamp(["January 2003"], { x: 1040, y: 110, size: 44, rot: 0.04, kicker: "its last signal" });
    F.popIn(when, 360, "stamp");
    await atw(24, "billion", 0, 6.8);
    const far = F.stamp([bil(last.km)], { x: 1040, y: 230, size: 40, style: "card", kicker: "away from Earth" });
    F.popIn(far, 360);
    sfx("radio");
    await atw(24, "signal", 0, 9.3);
    F.popOut(when); F.popOut(far);
    clock.h = 0; clock.x = 1010; clock.y = 280;
    F.popIn(clock, 400);
    await tw(clock, { h: 11 + 20 / 60 }, 3000, EZ.inOut, () => { if (Math.random() < 0.25) sfx("tick"); });
    sfx("ding");
    await v;
    F.popOut(clock);
  }

  // the viewer sends a greeting: a little winged letter leaves the dish
  const greetBtn = F.$("greet");
  function waitGreet() {
    const id = F.runId;
    F.show(greetBtn);
    return F.quiet(new Promise((resolve, reject) => {
      function go(e) {
        if (e) e.stopPropagation();
        greetBtn.removeEventListener("click", go); clearInterval(chk); greetBtn.blur(); F.hide(greetBtn);
        if (id !== F.runId) reject(F.ABORT); else resolve();
      }
      const chk = setInterval(() => { if (id !== F.runId) { clearInterval(chk); greetBtn.removeEventListener("click", go); F.hide(greetBtn); reject(F.ABORT); } }, 200);
      greetBtn.addEventListener("click", go);
      if (F.AUTOPLAY) setTimeout(go, 2500);
    }));
  }
  async function greet25() {
    const dish = F.plate("sc_antena", { x: -30, y: -20, w: 1340, h: 754 });
    const letter = F.sprite("carta", { x: 520, y: 330, w: 150, z: 30, op: 0 });
    const p = F.particles({ z: 40 });
    F.scene([dish, letter, p, inset], { bg: "#4a3a5a", cam: { x: 640, y: 360, z: 1 } });
    await say(25);
    await waitGreet();
    letter.op = 1; letter.s = 0.2;
    sfx("pop");
    await tw(letter, { s: 1 }, 300, EZ.bigBack);
    // anticipation: it crouches, then flies off along an arc, flapping
    await tw(letter, { sx: 1.15, sy: 0.85 }, 200);
    sfx("whoosh", 1.2);
    const flap = F.onFrame((t) => { letter.sy = 1 + Math.sin(t / 60) * 0.08; });
    letter.sx = 1;
    tw(letter, { s: 0.25 }, 1500, EZ.in);
    await F.arc(letter, 120, 30, 160, 1500, EZ.in);
    flap();
    p.emit("spark", 120, 30, 6, { spread: 30, vy: 0, vyr: 120, vxr: 120, g: 0, r: 10, life: 0.5, fill: "#ffe07a" });
  }

  async function far26() {
    const now = today();
    // one step is the distance from the Earth to the Sun; Pioneer 10 is about 141 steps away
    const steps = Math.round(now.au);
    const line = F.custom(function (c, t) {
      const n = Math.floor(steps * this.k), gap = 24, q = 1 / Math.sqrt(F.cam.z);   // things grow a little as the camera pulls back
      for (let i = 2; i <= n; i++) {
        c.fillStyle = i % 10 === 0 ? "#ffe07a" : "rgba(244,236,216,0.7)";
        c.beginPath(); c.arc(60 + i * gap, 360, (i % 10 === 0 ? 4 : 2.4) * q, 0, 6.2832); c.fill();
      }
      const sun = IM.cielo_sol, rs = 13 * q, re = 10 * q;
      if (F.ready(sun)) c.drawImage(sun, 60 + gap - rs, 360 - rs, rs * 2, rs * 2 * sun.height / sun.width);
      if (F.ready(IM.earth)) c.drawImage(IM.earth, 60 - re, 360 - re, re * 2, re * 2);
      // Pioneer 10 flies at the head of the road (the same drawing as in the rest of the chapter)
      const pim = IM.spr_P3_sonda_jupiter_8 || IM.sonda_cuerpo;
      if (n >= 5 && F.ready(pim)) {
        const w = 74 * q * q, h = w * pim.height / pim.width, bob = Math.sin(t / 300) * 3 * q;
        c.drawImage(pim, 60 + (steps * this.k) * gap + 6 * q, 360 - h * 0.55 + bob, w, h);
      }
    }, { z: 10, k: 0 });
    const count = F.stamp(["1"], { x: W / 2, y: 120, size: 56, style: "gold", kicker: "times the Earth-Sun distance" });
    const tag = F.stamp(["1 step = Earth to Sun"], { x: 250, y: 470, size: 26, style: "card", rot: -0.04 });
    F.scene([F.stars({ n: 260, par: 0.05, w: 6000, x: -200 }), line, count, tag, inset, F.credit("Distance today: NASA/JPL Horizons, Pioneer 10 seen from Earth.")], { bg: "#05060a", cam: { x: 330, y: 360, z: 1.6 } });
    F.flash(0.3);
    const v = say(26);
    F.popIn(tag, 360);
    await atw(26, "140", 0, 3.3);
    sfx("slideUp", 0.6);
    tw(F.cam, { x: 60 + steps * 24 / 2 + 40, z: 0.33 }, 2600, EZ.inOut);
    await tw(line, { k: 1 }, 2600, EZ.inOut, (e) => { count.lines = [Math.max(1, Math.round(now.au * e)).toString()]; if (Math.random() < 0.2) sfx("tick"); });
    count.lines = [now.au.toFixed(1)];
    sfx("ding");
    count.sx = 1.15; count.sy = 0.88; tw(count, { sx: 1, sy: 1 }, 400, EZ.elastic);
    F.popOut(tag);
    await atw(26, "message", 0, 10.4);
    clock.h = 0; clock.x = 1010; clock.y = 330;
    F.popIn(clock, 400);
    await tw(clock, { h: now.lt }, 3200, EZ.inOut, () => { if (Math.random() < 0.2) sfx("tick"); });
    sfx("ding");
    const note = F.stamp(["Your greeting arrives in " + hm(now.lt)], { x: W / 2, y: 600, size: 30, style: "card" });
    F.popIn(note, 360);
    await v;
    await wait(600);
  }

  async function moves27(pr) {
    pr.x = 640; pr.y = 330; pr.s = 0.5; pr.rot = 0; pr.eyes = "open";
    F.scene([F.stars({ n: 260, par: 0.1 }), pr, inset], { bg: "#05060a" });
    // the team's drawn frames: it smiles, yawns, its booms droop and it falls asleep
    let p5 = null;
    if (F.hasSprites("P5_sonda_se_apaga")) {
      p5 = F.probeFrames("P5_sonda_se_apaga", pr, { x: 640, y: 350 });
      F.add(p5); pr.op = 0;
      p5.update = function (dt, tt) { this.y = 350 + Math.sin(tt / 1300) * 6; };      // it drifts
    }
    const v = say(27);
    await atw(27, "powers", 0, 3.0);
    sfx("sad");
    if (p5) {
      for (let i = 1; i < 16; i++) { p5.frame = i; await wait(165); }
    } else {
      pr.eyes = "open"; F.face(pr, "tired", 500);
      tw(pr, { sleepy: 1 }, 1200, EZ.inOut);
      await wait(600); F.face(pr, "asleep", 500);
    }
    await atw(27, "know", 0, 5.5);
    // its path: real distances from 1972 to today, and the line keeps going because we know how it moves
    const graph = F.custom(function (c, t) {
      const X0 = 130, X1 = 1180, Y0 = 150, Y1 = 600;
      const t0 = P10[0].t, t1 = Date.UTC(2040, 0, 1), max = 170;
      const x = (ms) => X0 + (ms - t0) / (t1 - t0) * (X1 - X0), y = (au) => Y1 - au / max * (Y1 - Y0);
      c.globalAlpha = this.op;
      c.fillStyle = "rgba(36,23,14,0.88)"; F.roundRect(c, X0 - 90, Y0 - 70, X1 - X0 + 130, Y1 - Y0 + 130, 18); c.fill();
      c.strokeStyle = F.PAPER; c.lineWidth = 3; c.stroke();
      c.font = "14px Arial, sans-serif"; c.fillStyle = F.PAPER; c.textAlign = "right"; c.textBaseline = "middle";
      for (let au = 0; au <= max; au += 40) { c.globalAlpha = this.op * 0.3; c.fillRect(X0, y(au), X1 - X0, 1); c.globalAlpha = this.op; c.fillText(au + " AU", X0 - 8, y(au)); }
      c.textAlign = "center"; c.textBaseline = "top";
      for (let yr = 1975; yr <= 2040; yr += 10) c.fillText(String(yr), x(Date.UTC(yr, 0, 1)), Y1 + 8);
      const nowMs = Date.now(), cut = t0 + (Math.min(nowMs, P10[P10.length - 1].t) - t0) * this.k;
      c.strokeStyle = "#ffe07a"; c.lineWidth = 4; c.beginPath();
      let first = true;
      for (const r of P10) { if (r.t > cut) break; if (first) { c.moveTo(x(r.t), y(r.au)); first = false; } else c.lineTo(x(r.t), y(r.au)); }
      c.stroke();
      if (this.k2 > 0) {                         // where it will be: the same motion, carried forward
        const a = p10At(nowMs), endMs = nowMs + (t1 - nowMs) * this.k2;
        const rate = (P10[P10.length - 1].au - P10[P10.length - 13].au) / (P10[P10.length - 1].t - P10[P10.length - 13].t);
        c.setLineDash([10, 8]); c.lineDashOffset = -t / 40; c.beginPath(); c.moveTo(x(nowMs), y(a.au)); c.lineTo(x(endMs), y(a.au + rate * (endMs - nowMs))); c.stroke(); c.setLineDash([]);
      }
      if (this.k >= 1) {
        const a = p10At(nowMs), px = x(nowMs), py = y(a.au), pulse = 6 + Math.sin(t / 200) * 2;
        c.fillStyle = F.RED; c.beginPath(); c.arc(px, py, pulse, 0, 6.2832); c.fill();
        c.font = "bold 18px " + F.FONT; c.fillStyle = F.PAPER; c.textAlign = "right"; c.textBaseline = "bottom";
        c.fillText("today: " + a.au.toFixed(1) + " AU", px - 12, py - 10);
      }
      c.font = "bold 20px " + F.FONT; c.textAlign = "left"; c.textBaseline = "top"; c.fillStyle = "#ffe07a";
      c.fillText("Pioneer 10's distance from Earth, every month since 1972 (NASA/JPL Horizons)", X0 - 70, Y0 - 56);
    }, { par: 0, z: 50, op: 0, k: 0, k2: 0 });
    F.add(graph);
    if (p5) tw(p5, { op: 0.15 }, 400); else tw(pr, { op: 0.15 }, 400);
    await tw(graph, { op: 1 }, 400);
    sfx("slideUp", 0.7);
    await tw(graph, { k: 1 }, 2200, EZ.inOut);
    await atw(27, "moves", 0, 10.5);
    sfx("slideUp", 1.1);
    await tw(graph, { k2: 1 }, 1200, EZ.inOut);
    await v;
    await wait(700);
    F.remove(graph);
    if (p5) F.remove(p5);
    pr.op = 1; F.faceNow(pr, "asleep"); pr.sleepy = 1;
  }

  async function plaque28(pr) {
    const plaque = F.custom(function (c, t) {
      c.translate(this.x, this.y); c.scale(this.s, this.s); c.rotate(-0.05);
      c.fillStyle = "rgba(0,0,0,0.4)"; F.roundRect(c, -170, -100, 352, 212, 14); c.fill();
      const g = c.createLinearGradient(-180, -110, 180, 110);
      g.addColorStop(0, "#f3d27a"); g.addColorStop(0.5, "#c99a3c"); g.addColorStop(1, "#f0cf76");
      c.fillStyle = g; F.roundRect(c, -180, -110, 360, 220, 14); c.fill();
      c.strokeStyle = F.INK; c.lineWidth = 6; c.stroke();
      c.strokeStyle = "rgba(60,40,10,0.75)"; c.lineWidth = 2;
      for (let i = 0; i < 14; i++) { const a = i / 14 * 6.2832; c.beginPath(); c.moveTo(-70, -10); c.lineTo(-70 + Math.cos(a) * (40 + (i % 4) * 14), -10 + Math.sin(a) * (40 + (i % 4) * 14)); c.stroke(); }
      for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(-140 + i * 34, 80, 4 + (i === 3 ? 4 : 0), 0, 6.2832); c.stroke(); }
      c.beginPath(); c.arc(-140, -75, 10, 0, 6.2832); c.arc(-110, -75, 10, 0, 6.2832); c.stroke();
      const sh = ((t / 1400) % 1.6) - 0.3;
      F.roundRect(c, -180, -110, 360, 220, 14); c.clip();                // the shine stays on the plaque
      c.globalAlpha = 0.5; c.fillStyle = "#fff8d0";
      c.beginPath(); c.moveTo(-180 + sh * 400, -110); c.lineTo(-140 + sh * 400, -110); c.lineTo(-220 + sh * 400, 110); c.lineTo(-260 + sh * 400, 110); c.closePath(); c.fill();
    }, { par: 0, z: 60, x: 820, y: 330, s: 0.01 });
    pr.x = 380; pr.y = 360; pr.s = 0.42; pr.eyes = "closed"; pr.sleepy = 1; pr.rot = 0; F.faceNow(pr, "asleep");
    F.scene([F.stars({ n: 260, par: 0.1 }), pr, plaque, inset, F.credit("Drawing inspired by the Pioneer plaque.")], { bg: "#05060a" });
    const v = say(28);
    tw(pr, { x: 300 }, 3000, EZ.inOut);
    await atw(28, "plaque", 0, 2.8);
    sfx("ting"); await tw(plaque, { s: 1.15 }, 500, EZ.bigBack);
    await atw(28, "heading", 0, 7.2);
    // toward the red star
    const deep = F.plate("sc_espacio_profundo", { x: -60, y: -40, w: 1440, h: 810 });
    pr.x = 380; pr.y = 380; pr.s = 0.3; pr.eyes = "closed"; pr.sleepy = 1; pr.rot = -0.1;
    const band = F.custom(function (c) {
      const g = c.createLinearGradient(0, 520, 0, 720);
      g.addColorStop(0, "rgba(10,8,12,0)"); g.addColorStop(0.45, "rgba(10,8,12,0.92)"); g.addColorStop(1, "rgba(10,8,12,1)");
      c.fillStyle = g; c.fillRect(0, 520, W, 200);
    }, { par: 0, z: -50 });
    F.scene([deep, band, pr, inset, F.credit("Painted scene: AI image generator.")], { bg: "#05060a", cam: { x: 640, y: 360, z: 1 } });
    tw(pr, { x: 900, y: 300, s: 0.16 }, 7000, EZ.inOut);
    await atw(28, "aldebaran", 0, 9.1);
    const star = F.stamp(["Aldebaran"], { x: 1060, y: 420, size: 34, style: "ink" });
    F.popIn(star, 360);
    await atw(28, "million", 0, 13.8);
    const yrs = F.stamp(["about 2,000,000 years"], { x: W / 2, y: 120, size: 46, style: "gold" });
    F.popIn(yrs, 400, "tada");
    await v;
    await wait(900);
    await F.irisOut(F.toScreen(pr.x, pr.y).x, F.toScreen(pr.x, pr.y).y, 900);
  }

  async function chapter3() {
    S.setChapter(3);
    F.music("assets/music/alegre.mp3", 0.3);
    await S.chapterCard("Chapter 3", "Pioneer 10");
    const pr = await launch72();
    await belt22(pr);
    await years23(pr);
    await signal24();
    await greet25();
    await far26();
    await moves27(pr);
    await plaque28(pr);
  }
  F.CHAPTERS[3] = chapter3;
  F.p10 = { today, hm };
})();
