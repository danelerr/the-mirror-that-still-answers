/* The Mirror That Still Answers — chapter 2: Opportunity.
   The sky, the Sun and the dust follow the rover's own measurements of the atmosphere (NASA PDS).
   Team Unsigned Int, NASA Space Apps Challenge 2026.
   Code written with an AI coding assistant, directed and reviewed by the team. */
(function () {
  "use strict";
  const F = window.F, W = F.W, H = F.H, EZ = F.EZ, IM = F.IM;
  const tw = F.tw, wait = F.wait, sfx = F.sfx;
  const S = F.story, atw = S.atw;

  // ---------- data: one dust measurement (tau) per sol ----------
  const OPP = window.OPP_TAU;
  const OPP_FINAL = [5111, 10.8];               // NASA Photojournal PIA22930: "a tau of about 10.8" on sol 5,111
  const OPP_ALL = OPP.concat([OPP_FINAL]);
  const LAND_MS = Date.UTC(2004, 0, 25, 5, 5), SOL_MS = 88775244;   // Opportunity's sol 1, and one Martian day
  const monthYear = (sol) => new Date(LAND_MS + (sol - 1) * SOL_MS).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  function idxOfSol(sol) {
    let lo = 0, hi = OPP_ALL.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (OPP_ALL[mid][0] <= sol) lo = mid; else hi = mid - 1; }
    return lo;
  }
  const M = { idx: 0, shown: OPP[0][1], view: null, reveal: 999, finalShown: false, odo: false };
  const tauNow = () => M.shown;
  F.onFrame((t, dt) => {
    const i = F.clamp(Math.round(M.idx), 0, OPP_ALL.length - 1);
    M.shown += (OPP_ALL[i][1] - M.shown) * Math.min(1, dt * 5);     // slow in and slow out from day to day
  });

  // ---------- the narrator: the Mirror in a little round window, as in old cartoons ----------
  const nar = F.mirror({ x: 0, y: 0, s: 0.33, eyes: "open", mouth: "smile", shadow: false, bobAmt: 0.6, hands: false });
  // the rover waves with the glove at the end of its arm
  async function roverWave(ms, pose) {
    rv.hand = pose || "wave";
    await tw(rv, { armT: 2.2 }, 260, EZ.back);
    await wait(ms || 1100);
    rv.hand = "open";
    tw(rv, { armT: 0.1 }, 320, EZ.inOut);
  }
  const inset = F.custom(function (c, t) {
    const R = 78, cx = 104, cy = 100;
    c.globalAlpha = this.op;
    c.translate(cx, cy); c.scale(this.s, this.s); c.translate(-cx, -cy);
    c.fillStyle = "rgba(0,0,0,0.35)"; c.beginPath(); c.arc(cx + 5, cy + 7, R + 6, 0, 6.2832); c.fill();
    c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.clip();
    const pl = IM.sc_luna;
    if (F.ready(pl)) c.drawImage(pl, cx - 300, cy - 210, 520, 292);
    nar.x = cx + 6; nar.y = cy + 92; nar.op = 1;
    nar.draw(c, t);
    c.restore();
    c.strokeStyle = F.INK; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.stroke();
    c.strokeStyle = F.GOLD; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cy, R - 5, 0, 6.2832); c.stroke();
  }, { par: 0, z: 160, op: 1, s: 1 });
  const say = (n) => F.speak(n, nar.talk);
  async function showInset() { inset.s = 0.01; F.add(inset); await tw(inset, { s: 1 }, 420, EZ.bigBack); }

  // ---------- the Martian sky, coloured by the measured dust ----------
  const marsSky = F.custom(function (c) {
    const tau = tauNow(), d = 1 - Math.exp(-tau / 3);
    const g = c.createLinearGradient(0, 0, 0, 420);
    g.addColorStop(0, "rgba(92,58,36," + (d * 0.85).toFixed(3) + ")");
    g.addColorStop(1, "rgba(140,94,60," + (d * 0.7).toFixed(3) + ")");
    c.fillStyle = g; c.fillRect(-400, -200, W + 800, 620);
  }, { z: -90 });
  const marsDark = F.custom(function (c) {
    const d = 1 - Math.exp(-tauNow() / 3);
    c.fillStyle = "rgba(40,20,10," + (d * 0.42).toFixed(3) + ")"; c.fillRect(-400, -200, W + 800, H + 400);
  }, { z: 45 });
  const sun = F.sprite("cielo_sol", { x: 1090, y: 140, w: 170, z: -80, op: 1 });
  sun.update = function () { this.op = Math.max(0.04, Math.exp(-tauNow() / 2.2)) * this.vis; };
  sun.vis = 1;
  const clouds = F.custom(function (c, t) {
    const tau = tauNow(), d = 1 - Math.exp(-tau / 3), n = Math.min(this.list.length, Math.round(tau * 3));
    for (let i = 0; i < this.list.length; i++) {
      const cl = this.list[i], im = IM[cl.k];
      cl.x += cl.v * F.dt * (0.4 + d * 1.5);
      if (cl.x > W + 80) cl.x = -480;
      const want = i < n ? Math.min(1, 0.3 + d) : 0;
      cl.a += (want - cl.a) * Math.min(1, F.dt * 2);
      if (cl.a > 0.02 && F.ready(im)) { c.globalAlpha = cl.a; c.drawImage(im, cl.x, cl.y, im.width * cl.s, im.height * cl.s); }
    }
  }, { z: -70, list: [] });
  (function () {
    const r = F.rng(7), kinds = ["cielo_nube_a", "cielo_nube_b", "cielo_nube_c", "cielo_tormenta"];
    for (let i = 0; i < 16; i++) clouds.list.push({ x: r() * 1500 - 110, y: 30 + r() * 280, s: 0.3 + r() * 0.45, v: 10 + r() * 26, k: kinds[i % 4], a: 0 });
  })();
  // the plain: two copies side by side, one mirrored, so it can scroll forever
  const plain = F.custom(function (c) {
    const im = IM.sc_marte_llanura;
    if (!F.ready(im)) return;
    const x = ((this.pan % (W * 2)) + W * 2) % (W * 2);
    for (let k = -1; k <= 1; k++) {
      const x0 = -x + k * W * 2;
      c.drawImage(im, x0, 0, W, H);
      c.save(); c.translate(x0 + W * 2, 0); c.scale(-1, 1); c.drawImage(im, 0, 0, W, H); c.restore();
    }
  }, { z: -100, pan: 0, v: 0 });
  plain.update = function (dt) { this.pan += this.v * dt; };

  // ---------- the data panel ----------
  const panel = F.$("oppPanel"), chartEl = F.$("oppChart"), occ = chartEl.getContext("2d");
  const slider = F.$("oppSlider"), read = F.$("oppRead"), goBtn = F.$("oppGo");
  slider.max = String(OPP_ALL.length - 1);
  let lastSlide = 0, held = false, lastI = -1;
  slider.addEventListener("input", () => { M.idx = +slider.value; lastSlide = performance.now(); });
  ["pointerdown", "click", "keydown"].forEach((ev) => slider.addEventListener(ev, (e) => { e.stopPropagation(); if (ev === "pointerdown") held = true; }));
  ["pointerup", "pointercancel", "blur"].forEach((ev) => window.addEventListener(ev, () => { held = false; }));
  slider.addEventListener("lostpointercapture", () => { held = false; });
  function drawPanel() {
    if (panel.classList.contains("hidden")) return;
    const i = F.clamp(Math.round(M.idx), 0, OPP_ALL.length - 1);
    if (i !== lastI) {
      lastI = i;
      const sol = OPP_ALL[i][0], tau = OPP_ALL[i][1], direct = Math.exp(-tau) * 100;
      const pct = direct >= 1 ? Math.round(direct) + "%" : "less than 1%";
      read.innerHTML = "<b>" + monthYear(sol) + "</b> · dust (tau) <b>" + tau.toFixed(2) + "</b>" + (i === OPP_ALL.length - 1 ? " (NASA estimate)" : "") +
        " · sunlight <b>" + pct + "</b>" + (M.odo ? " · driven <b>45.16 km</b>" : "");
      if (!held) slider.value = String(i);
    }
    const c = occ, w = 540, h = 120, L = 34, R = 8, T = 8, B = 18;
    c.clearRect(0, 0, w, h);
    const v = M.view || { s0: 1, s1: 5118, tMax: 5 }, full = v.s1 - v.s0 > 500;
    const x = (s) => L + (s - v.s0) / (v.s1 - v.s0) * (w - L - R), y = (t) => T + (1 - Math.min(t, v.tMax) / v.tMax) * (h - T - B);
    c.font = "11px Arial, sans-serif"; c.lineWidth = 1; c.strokeStyle = "rgba(244,236,216,0.16)"; c.fillStyle = "rgba(244,236,216,0.8)";
    c.textAlign = "right"; c.textBaseline = "middle";
    for (let t = 0; t <= v.tMax; t += v.tMax > 6 ? 2 : 1) { c.beginPath(); c.moveTo(L, y(t)); c.lineTo(w - R, y(t)); c.stroke(); c.fillText(String(t), L - 5, y(t)); }
    c.textAlign = "center"; c.textBaseline = "top";
    if (full) for (let yr = 2004; yr <= 2018; yr += 2) c.fillText(String(yr), x(1 + (Date.UTC(yr, 0, 1) - LAND_MS) / SOL_MS), h - B + 4);
    else for (let s = Math.ceil(v.s0 / 5) * 5; s <= v.s1; s += 5) c.fillText("sol " + s, x(s), h - B + 4);
    c.save(); c.beginPath(); c.rect(L, 0, w - L - R, h - B + 2); c.clip();
    if (full) {
      c.strokeStyle = "#ffe07a"; c.lineWidth = 1.2; c.beginPath();
      OPP.forEach((r, k) => { if (k === 0) c.moveTo(x(r[0]), y(r[1])); else c.lineTo(x(r[0]), y(r[1])); });
      c.stroke();
    } else {
      let n = 0;
      for (const r of OPP) {
        if (r[0] < v.s0) continue;
        if (n++ >= M.reveal) break;
        c.fillStyle = "#ffe07a"; c.beginPath(); c.arc(x(r[0]), y(r[1]), 4, 0, 6.2832); c.fill();
        if (r[0] >= 5103) { c.fillStyle = "#f4ecd8"; c.textBaseline = "bottom"; c.fillText(r[1].toFixed(2), x(r[0]), y(r[1]) - 6); }
      }
    }
    if (M.finalShown) { c.strokeStyle = "#ff9a6a"; c.lineWidth = 2.5; c.beginPath(); c.arc(x(OPP_FINAL[0]), y(OPP_FINAL[1]), 6, 0, 6.2832); c.stroke(); }
    c.restore();
    if (M.finalShown) { c.fillStyle = "#ff9a6a"; c.textAlign = "right"; c.textBaseline = "middle"; c.fillText("about 10.8 on its last day (NASA)", x(OPP_FINAL[0]) - 10, y(OPP_FINAL[1]) + (full ? 10 : 2)); }
    if (full) { c.strokeStyle = "#fff"; c.lineWidth = 2; const cx = x(OPP_ALL[i][0]); c.beginPath(); c.moveTo(cx, T); c.lineTo(cx, h - B); c.stroke(); }
    c.save(); c.translate(10, (h - B) / 2 + 2); c.rotate(-Math.PI / 2); c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "rgba(244,236,216,0.8)"; c.fillText("dust (tau)", 0, 0); c.restore();
  }
  F.onFrame(drawPanel);
  function waitSlide() {
    const id = F.runId;
    return F.quiet(new Promise((resolve, reject) => {
      const t0 = performance.now();
      let skipped = false;
      const skip = (e) => { e.stopPropagation(); skipped = true; };
      panel.classList.add("invite");
      F.show(goBtn);
      goBtn.addEventListener("click", skip);
      (function check() {
        if (id !== F.runId) { end(); reject(F.ABORT); return; }
        const now = performance.now();
        const done = skipped || now - t0 > 30000 || (F.AUTOPLAY && now - t0 > 2500) ||
          (lastSlide > t0 ? now - lastSlide > 4500 && !held : now - t0 > 12000);
        if (done) { end(); resolve(); } else setTimeout(check, 200);
      })();
      function end() { panel.classList.remove("invite"); goBtn.removeEventListener("click", skip); F.hide(goBtn); slider.blur(); }
    }));
  }

  // ---------- the cast on Mars ----------
  let rv = null, P = null;
  function marsScene(extra) {
    P = F.particles({ z: 50 });
    rv = rv || F.rover({});
    rv.puffs = P;
    F.scene([plain, marsSky, sun, clouds, rv, P, marsDark, inset, F.credit("Painted scene: AI image generator. Sky colour, Sun and dust follow Opportunity's real measurements (NASA PDS).")].concat(extra || []), { bg: "#7a5636" });
  }
  function resetRover() {
    rv = F.rover({ x: 760, y: 640, s: 0.46 });
  }

  // =================== the wordless start: launch, landing, waking up ===================
  async function launch() {
    const pad = F.plate("sc_plataforma", { x: -30, y: -20, w: 1340, h: 754 });
    const rocket = F.sprite("obj_cohete", { x: 650, y: 552, w: 120, ax: 0.5, ay: 1, z: 20 });
    const flame = F.custom(function (c, t) {
      if (this.k <= 0.01) return;
      const st = F.step(t), L = (60 + (st % 3) * 14) * this.k, x = rocket.x, y = rocket.y + 2 + (rocket.y < 552 ? 0 : 0);
      c.translate(x, y); c.scale(rocket.sx, 1);
      c.fillStyle = "#ffb347"; c.strokeStyle = F.INK; c.lineWidth = 4; c.lineJoin = "round";
      c.beginPath(); c.moveTo(-24, 0); c.quadraticCurveTo(-18, L * 0.6, 0, L); c.quadraticCurveTo(18, L * 0.6, 24, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#fff3b0"; c.beginPath(); c.moveTo(-12, 0); c.quadraticCurveTo(-8, L * 0.4, 0, L * 0.6); c.quadraticCurveTo(8, L * 0.4, 12, 0); c.closePath(); c.fill();
    }, { z: 19, k: 0 });
    const p = F.particles({ z: 25 });
    F.scene([pad, flame, rocket, p, F.credit("Painted scene: AI image generator.")], { bg: "#e8c9a0", cam: { x: 640, y: 380, z: 1.05 } });
    await F.irisIn(650, 420, 700);
    const when = F.stamp(["July 2003"], { x: 1030, y: 110, size: 46, rot: -0.05, kicker: "A rover leaves Earth for Mars" });
    F.popIn(when, 420, "stamp");
    for (const n of ["3", "2", "1"]) {
      const s = F.stamp([n], { x: 300, y: 260, size: 120, style: "gold" });
      F.popIn(s, 260, "beep");
      await wait(520);
      F.remove(s);
    }
    // ignition and anticipation: smoke, a crouch, a shake
    sfx("rumble", 1.4);
    tw(flame, { k: 1 }, 300, EZ.out);
    const smoke = setInterval(() => p.emit("smoke", rocket.x, Math.min(552, rocket.y) + 10, 3, { spread: 60, vx: 0, vxr: 260, vy: -30, vyr: 40, g: -10, r: 26, grow: 2.2, life: 1.6, fill: "#f6efe2", ink: "rgba(60,40,30,0.5)" }), 90);
    F.shake(4);
    await tw(rocket, { sx: 1.06, sy: 0.93 }, 420, EZ.inOut);
    await wait(250);
    // lift-off: slow at first, then faster and faster, stretching as it goes
    sfx("whoosh", 2);
    F.shake(8);
    tw(rocket, { sx: 0.9, sy: 1.16 }, 300, EZ.out);
    tw(F.cam, { y: 120, z: 1 }, 2200, EZ.inOut);
    await tw(rocket, { y: -700 }, 2400, EZ.in);
    clearInterval(smoke);
    F.popOut(when);
    await wait(300);
    await F.irisOut(640, 300, 500);
  }

  async function landing() {
    const sky = F.plate("sc_marte_arriba", { x: -30, y: -20, w: 1340, h: 754 });
    const chute = F.sprite("obj_paracaidas", { x: 640, y: -260, w: 180, ax: 0.5, ay: 0.25, z: 20 });
    const bags = F.sprite("obj_bolsas", { x: 640, y: -60, w: 150, ax: 0.5, ay: 0.5, z: 22 });
    const p = F.particles({ z: 30 });
    F.scene([sky, chute, bags, p, F.credit("Painted scene: AI image generator.")], { bg: "#d9a77a", cam: { x: 640, y: 360, z: 1 } });
    await F.irisIn(640, 200, 600);
    const when = F.stamp(["January 2004"], { x: 1030, y: 110, size: 46, rot: 0.04, kicker: "Arriving at Mars" });
    F.popIn(when, 420, "stamp");
    // the parachute floats down, swinging like a pendulum (arcs)
    const swing = F.onFrame((t) => { chute.rot = Math.sin(t / 420) * 0.12; bags.x = chute.x - Math.sin(chute.rot) * 120; bags.rot = chute.rot; });
    tw(chute, { y: 140 }, 2200, EZ.out);
    await tw(bags, { y: 340 }, 2200, EZ.out);
    swing();
    // the bundle drops: it falls, then bounces, smaller each time (squash on impact, stretch in the air)
    sfx("slideDown", 0.9);
    tw(chute, { y: -400, x: 900 }, 1600, EZ.in);
    const ground = 600, hops = [[260, 520], [150, 420], [80, 320], [36, 230]];
    let x = bags.x;
    bags.sx = 0.9; bags.sy = 1.12;
    await tw(bags, { y: ground - 75 }, 520, EZ.in);
    for (let i = 0; i <= hops.length; i++) {
      bags.sx = 1.3; bags.sy = 0.72;
      sfx("boing", 1 - i * 0.12);
      F.shake(6 - i);
      p.emit("puff", bags.x, ground - 10, 5, { spread: 90, vy: -50, vxr: 200, r: 16, life: 0.9, fill: "#d9a77a" });
      await tw(bags, { sx: 1, sy: 1 }, 110, EZ.out);
      if (i === hops.length) break;
      const [hgt, ms] = hops[i];
      x += 140 - i * 25;
      bags.sx = 0.9; bags.sy = 1.12;
      tw(bags, { rot: bags.rot + 1.2 }, ms, EZ.lin);
      await F.arc(bags, x, ground - 75, hgt, ms, EZ.lin);
    }
    await tw(bags, { rot: bags.rot + 0.5, x: x + 50 }, 600, EZ.out);
    F.popOut(when);
    await wait(400);
    await F.irisOut(F.toScreen(bags.x, bags.y).x, F.toScreen(bags.x, bags.y).y, 500);
  }

  async function wakeUp() {
    resetRover();
    rv.x = 560; rv.y = 640; rv.op = 0; rv.mastT = -1.4; rv.mast = -1.4; rv.eyes = "closed"; rv.armT = 0.6; rv.arm = 0.6;
    M.idx = idxOfSol(20); M.shown = OPP_ALL[M.idx][1];
    sun.vis = 1;
    const bags = F.sprite("obj_bolsas", { x: 560, y: 560, w: 300, ax: 0.5, ay: 0.85, z: 35 });
    marsScene([bags]);
    F.remove(inset);
    F.cam.z = 1.15; F.cam.y = 420;
    await F.irisIn(560, 520, 600);
    // the airbags sag and flatten
    sfx("slideDown", 0.6);
    await tw(bags, { sy: 0.25, sx: 1.25 }, 900, EZ.inOut);
    rv.op = 1;
    await tw(bags, { op: 0 }, 300, EZ.out);
    F.remove(bags);
    // the mast springs up (follow-through does the overshoot), then the eyes open
    sfx("slideUp", 0.9);
    rv.mastT = 0;
    await wait(500);
    F.faceNow(rv, "tired");
    rv.eyes = "half"; await wait(250); rv.eyes = "closed"; await wait(120); rv.eyes = "open";
    F.faceNow(rv, "surprised");
    sfx("ting");
    rv.lookX = -10; await wait(350); rv.lookX = 10; await wait(350); rv.lookX = 0;
    rv.armT = 0.1;
    await tw(rv, { sy: 1.14, sx: 0.92 }, 160, EZ.out);
    F.face(rv, "happy");
    await tw(rv, { sy: 1, sx: 1 }, 360, EZ.elastic);
    F.guard(roverWave(900));
  }

  // =================== the story of its days ===================
  async function intro14() {
    await showInset();
    tw(F.cam, { z: 1, y: 360 }, 1200, EZ.inOut);
    const v = say(14);
    await atw(14, "opportunity", 0, 1.0);
    const name = F.stamp(["Opportunity"], { x: 1000, y: 150, size: 52, style: "card", rot: -0.04, kicker: "Mars rover, 2004 - 2018" });
    F.popIn(name, 420, "tada");
    F.face(rv, "happy"); F.guard(roverWave(1000));
    await wait(1100);
    F.face(rv, "determined");
    // anticipation, then it drives forward a little, kicking up dust
    await tw(rv, { sx: 1.05, sy: 0.94 }, 200);
    rv.drive = 1;
    tw(rv, { sx: 1, sy: 1 }, 200, EZ.out);
    await tw(rv, { x: 400 }, 1500, EZ.out);
    rv.drive = 0;
    await atw(14, "water", 0, 7.8);
    F.popOut(name);
    // it digs into a rock and dreams of ancient water
    rv.armT = 0.8; rv.hand = "point"; sfx("click"); F.face(rv, "curious"); rv.look = 6; rv.lookX = -6;
    const dream = F.thought("sc_marte_agua", { x: 820, y: 230, w: 440, h: 280, fromX: rv.x + 40, fromY: rv.y - 330, z: 70 });
    F.add(dream);
    await tw(dream, { open: 1 }, 600, EZ.bigBack);
    sfx("sparkle"); F.face(rv, "happy"); rv.look = -6; rv.lookX = 8;
    await v;
    await wait(500);
    await tw(dream, { open: 0 }, 300, EZ.inBack);
    F.remove(dream);
    rv.armT = 0.1; rv.hand = "open"; rv.look = 0; rv.lookX = 0; F.face(rv, "neutral");
  }

  async function sunlight15() {
    const v = say(15);
    await atw(15, "sunlight", 0, 0.9);
    // the Sun pops up and the solar panels shine
    sun.y = 260; tw(sun, { y: 140 }, 700, EZ.bigBack);
    sfx("slideUp");
    tw(rv, { glow: 1 }, 700, EZ.inOut);
    rv.eyes = "open"; F.face(rv, "happy");
    tw(rv, { sy: 1.06 }, 250, EZ.out).then(() => tw(rv, { sy: 1 }, 400, EZ.back)).catch(() => {});
    const beam = F.custom(function (c, t) {
      if (this.k <= 0.01) return;
      const hd = rv.head();
      c.globalAlpha = this.k; c.setLineDash([10, 9]); c.lineDashOffset = -t / 25;
      c.strokeStyle = "#ffe07a"; c.lineWidth = 5;
      c.beginPath(); c.moveTo(hd.x, hd.y); c.lineTo(sun.x, sun.y); c.stroke();
    }, { z: 40, k: 0 });
    F.add(beam);
    await atw(15, "sun", 0, 5.4);
    // it looks straight up at the Sun: a small dip first, then up
    F.face(rv, "proud");
    await tw(rv, { mastT: -0.1 }, 220);
    tw(rv, { mastT: 0.25, look: -10, lookX: 8 }, 600, EZ.back);
    await tw(beam, { k: 1 }, 500, EZ.out);
    sfx("radio");
    await atw(15, "dust", 0, 7.8);
    showPanel();
    await v;
    tw(beam, { k: 0 }, 500, EZ.in);
    tw(rv, { mastT: 0, look: 0, lookX: 0, glow: 0.5 }, 700);
    F.face(rv, "neutral");
  }
  function showPanel() {
    if (!panel.classList.contains("hidden")) return;
    lastI = -1;
    F.show(panel);
    sfx("pop");
  }

  async function slide16() {
    const v = say(16);
    await v;
    // the viewer's turn: every position of the slider is a real day on Mars
    const follow = F.onFrame(() => {
      const d = 1 - Math.exp(-tauNow() / 3);
      rv.glow = Math.exp(-tauNow()) * 1.1;
      const want = d < 0.3 ? "happy" : d < 0.5 ? "neutral" : d < 0.7 ? "worried" : "tired";
      if (rv.faceName !== want) F.face(rv, want, 200);
    });
    await waitSlide();
    follow();
  }

  async function storm17() {
    const v = say(17);
    await tw(M, { idx: idxOfSol(1150) }, 1400);
    await atw(17, "darkened", 0, 4.0);
    // the storm rolls in: the real 2007 measurements darken the sky
    const wall = F.sprite("cielo_tormenta", { x: -500, y: 290, w: 1150, ax: 0.5, ay: 0.5, z: 28, op: 0.8 });
    F.add(wall);
    sfx("wind", 1.6);
    tw(wall, { x: 640 }, 2200, EZ.out);
    const gust = setInterval(() => P.emit("streak", -40, 120 + Math.random() * 480, 2, { vx: 900, vxr: 200, vy: 0, vyr: 20, g: 0, r: 14, len: 90, life: 1.6, fill: "rgba(240,200,150,0.6)" }), 120);
    tw(M, { idx: idxOfSol(1236) }, 2000, EZ.in);
    F.face(rv, "scared");
    rv.hand = "open";
    tw(rv, { sy: 0.88, sx: 1.07, mastT: -0.5, armT: 2.0, glow: 0, dusty: 0.8 }, 900);
    await atw(17, "waited", 0, 7.1);
    F.face(rv, "asleep");
    const zz = F.stamp(["z z z"], { x: rv.x + 120, y: rv.y - 300, size: 40, style: "ink", par: 1, z: 60 });
    F.popIn(zz, 300);
    tw(zz, { y: rv.y - 360 }, 1500, EZ.inOut);
    await atw(17, "cleared", 0, 9.3);
    clearInterval(gust);
    F.remove(zz);
    tw(wall, { x: 1900 }, 1500, EZ.in);
    await tw(M, { idx: idxOfSol(1420) }, 1100, EZ.out);
    // the take: eyes pop open, it springs up and shakes the dust off
    rv.eyes = "open"; F.faceNow(rv, "surprised");
    sfx("boing", 1.2);
    await tw(rv, { sy: 1.12, sx: 0.94, mastT: 0.05 }, 160, EZ.out);
    for (let k = 0; k < 3; k++) { await tw(rv, { tilt: 0.05, sx: 1.03 }, 70); await tw(rv, { tilt: -0.05, sx: 0.98 }, 70); }
    P.emit("puff", rv.x, rv.y - 220, 10, { spread: 300, vy: -120, vxr: 260, g: 140, r: 14, life: 1, fill: "#c79466" });
    rv.dusty = 0;
    tw(rv, { sy: 1, sx: 1, tilt: 0, mastT: 0, armT: 0.1, glow: 0.8 }, 320, EZ.back);
    F.face(rv, "happy");
    await atw(17, "work", 0, 11.2);
    rv.drive = 0.8; plain.v = 60;
    await v;
    F.remove(wall);
  }

  async function drive18() {
    const v = say(18);
    rv.drive = 1; plain.v = 420; F.face(rv, "determined");
    const odo = F.stamp(["0.0 km"], { x: 1010, y: 130, size: 52, style: "card", kicker: "distance driven" });
    F.popIn(odo, 360);
    const year = F.stamp(["2007"], { x: 300, y: 130, size: 52, style: "gold" });
    F.add(year);
    const yS = idxOfSol(1420), yE = idxOfSol(5050);
    await F.tw({ u: 0 }, { u: 1 }, 2800, EZ.inOut, (e) => {
      odo.lines = [(45.16 * e).toFixed(1) + " km"];
      M.idx = F.lerp(yS, yE, e);
      year.lines = [String(new Date(LAND_MS + (OPP_ALL[Math.round(M.idx)][0] - 1) * SOL_MS).getUTCFullYear())];
      if (Math.random() < 0.2) sfx("tick");
    });
    M.odo = true; lastI = -1;
    odo.lines = ["45.16 km"]; sfx("ding");
    odo.sx = 1.15; odo.sy = 0.88; tw(odo, { sx: 1, sy: 1 }, 400, EZ.elastic);
    F.face(rv, "proud"); F.guard(roverWave(700, "thumb"));
    await atw(18, "june", 0, 5.0);
    rv.drive = 0; plain.v = 0; F.face(rv, "worried");
    F.popOut(odo); F.remove(year);
    // the whole planet disappears under dust (drawn: Mars from space)
    await globe(18);
    await v;
  }

  async function globe(n) {
    const planet = F.custom(function (c, t) {
      const cx = W / 2, cy = H / 2 + 20, R = 250;
      c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.clip();
      const im = IM.sc_marte_arriba;
      if (F.ready(im)) c.drawImage(im, cx - R * 1.6 - (t / 40) % 200, cy - R, R * 3.6, R * 2.1);
      c.fillStyle = "rgba(196,120,70," + (this.cover * 0.85).toFixed(3) + ")"; c.fillRect(cx - R, cy - R, R * 2, R * 2);
      for (let i = 0; i < 18 * this.cover; i++) {
        const a = i * 2.4 + t / 3000, r = R * (0.2 + (i % 5) * 0.17);
        F.puffShape(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, 40, "rgba(222,160,110,0.9)", "rgba(120,60,30,0.3)");
      }
      const g = c.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.2, cx, cy, R * 1.05);
      g.addColorStop(0, "rgba(255,255,255,0.05)"); g.addColorStop(1, "rgba(0,0,0,0.55)");
      c.fillStyle = g; c.fillRect(cx - R, cy - R, R * 2, R * 2);
      c.restore();
      c.strokeStyle = F.INK; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.stroke();
    }, { par: 0, z: 10, cover: 0 });
    const when = F.stamp(["June 2018"], { x: 1060, y: 110, size: 46, rot: 0.04, kicker: "a storm around the whole planet" });
    F.hide(panel);
    F.scene([F.stars({ n: 220, par: 0 }), planet, inset, F.credit("Drawing of Mars. Not to scale.")], { bg: "#05060a" });
    F.popIn(when, 400, "stamp");
    sfx("rumble", 1.5);
    await atw(n, "covered", 0, 8.9);
    await tw(planet, { cover: 1 }, 1800, EZ.inOut);
    await wait(300);
  }

  async function last19() {
    marsScene();
    rv.x = 400; rv.drive = 0; rv.eyes = "open"; rv.dusty = 0.4; rv.glow = 0.2; rv.armT = 0.1; rv.hand = "open";
    F.faceNow(rv, "worried");
    M.idx = idxOfSol(5102); M.shown = 0.76; plain.v = 0;
    F.show(panel); lastI = -1;
    M.view = { s0: 5084, s1: 5114, tMax: 11 };
    M.reveal = 0;
    const v = say(19);
    // the numbers climb: each new measurement steps up like a stair, and the sky gets darker
    const calm = OPP.filter((r) => r[0] >= 5084 && r[0] <= 5102).length;
    for (let i = 1; i <= calm; i++) { M.reveal = i; await wait(Math.max(40, 4400 / calm)); }
    const steps = [[5103, 1.71, "climb", 0, 5.6], [5105, 2.26, "climb", 1, 6.8], [5111, 10.8, "stop", 0, 9.5]];
    const stair = [];
    for (let k = 0; k < steps.length; k++) {
      const s = steps[k];
      await atw(19, s[2], s[3], s[4]);
      M.reveal = calm + k + 1;
      M.idx = idxOfSol(s[0]);
      if (k === 2) M.finalShown = true;
      const st = F.stamp([s[1].toFixed(k === 2 ? 1 : 2)], { x: 640 + k * 190, y: 350 - k * 95, size: 46 + k * 10, style: k === 2 ? "gold" : "card", rot: -0.04 + k * 0.03, kicker: k === 2 ? "last day" : "" });
      stair.push(st);
      F.popIn(st, 360, k === 2 ? "stamp" : "pop");
      tw(rv, { glow: 0, dim: Math.min(1, (k + 1) * 0.33) }, 700);
      F.face(rv, ["worried", "tired", "asleep"][k], 400);
      if (k === 2) {
        rv.eyes = "closed";
        tw(rv, { mastT: -0.42, armT: 0.35, sy: 0.92, sx: 1.04 }, 1900);
        F.musicVol(0);
      }
    }
    await v;
    await wait(700);
    stair.forEach((st) => F.popOut(st));
  }

  async function quiet20() {
    const crater = F.plate("sc_crater_atardecer", { x: -30, y: -20, w: 1340, h: 754 });
    const little = F.rover({ x: 1040, y: 655, s: 0.2, eyes: "closed", mastT: -0.42, mast: -0.42, armT: 0.35, arm: 0.35, dim: 0.4, flip: -1, z: 30 });
    F.faceNow(little, "asleep");
    // fourteen years of measurements rise like stars and draw their curve across the sky
    const pts = OPP.filter((r, i) => i % 6 === 0).concat([OPP[OPP.length - 1]]);
    const sky = F.custom(function (c, t) {
      const n = Math.floor(pts.length * this.k);
      for (let i = 0; i < n; i++) {
        const r = pts[i], x = 120 + (r[0] / 5111) * 1040, y = 250 - Math.min(r[1], 5) / 5 * 190;
        const tw2 = 0.6 + 0.4 * Math.sin(t / 300 + i);
        c.globalAlpha = tw2;
        c.fillStyle = "#ffe07a"; c.beginPath(); c.arc(x, y, 2.4, 0, 6.2832); c.fill();
      }
      c.globalAlpha = 1;
      if (this.k > 0.98) {
        c.font = "bold 22px " + F.FONT; c.textAlign = "center"; c.lineWidth = 5; c.strokeStyle = F.INK; c.fillStyle = F.PAPER;
        const txt = OPP.length.toLocaleString("en-US") + " real measurements of dust in the sky · NASA Planetary Data System";
        c.strokeText(txt, W / 2, 300); c.fillText(txt, W / 2, 300);
      }
    }, { z: 10, k: 0, par: 1 });
    const p = F.particles({ z: 40 });
    F.hide(panel);
    F.scene([crater, sky, little, p, inset, F.credit("Painted scene: AI image generator. Dots: Opportunity's real measurements (NASA PDS).")], { bg: "#3a1f16", cam: { x: 640, y: 380, z: 1.05 } });
    await F.irisIn(1040, 600, 800);
    const v = say(20);
    sfx("sad");
    await atw(20, "numbers", 0, 4.0);
    const rise = setInterval(() => p.emit("dot", little.x, little.y - 40, 2, { spread: 30, vx: -60, vxr: 120, vy: -160, vyr: 60, g: 0, r: 5, life: 1.6, fill: "rgba(255,224,122,0.95)" }), 60);
    sfx("sparkle");
    await tw(sky, { k: 1 }, 2600, EZ.inOut);
    clearInterval(rise);
    await atw(20, "check", 0, 6.9);
    const ok = F.stamp(["Anyone can check them"], { x: W / 2, y: 470, size: 40, style: "gold", rot: -0.03 });
    F.popIn(ok, 420, "tada");
    await v;
    await wait(1400);
    await F.irisOut(1040, 600, 900);
  }

  async function chapter2() {
    S.setChapter(2);
    F.music("assets/music/alegre.mp3", 0.3);
    M.idx = 0; M.shown = OPP[0][1]; M.view = null; M.reveal = 999; M.finalShown = false; M.odo = false;
    plain.pan = 0; plain.v = 0; sun.vis = 1; sun.y = 140;
    await S.chapterCard("Chapter 2", "Opportunity");
    await launch();
    await landing();
    await wakeUp();
    await intro14();
    await sunlight15();
    await slide16();
    await storm17();
    await drive18();
    await last19();
    await quiet20();
    F.hide(panel);
  }
  F.CHAPTERS[2] = chapter2;
})();
