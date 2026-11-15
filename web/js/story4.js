/* The Mirror That Still Answers — the ending, and the credits.
   Team Unsigned Int, NASA Space Apps Challenge 2026.
   Code written with an AI coding assistant, directed and reviewed by the team. */
(function () {
  "use strict";
  const F = window.F, W = F.W, H = F.H, EZ = F.EZ, IM = F.IM;
  const tw = F.tw, wait = F.wait, sfx = F.sfx;
  const S = F.story, atw = S.atw, mir = S.mir;

  // people coming back: the same painted rocket as the launches, coming down tail first on its flame
  // (y is the bottom of the rocket; s squashes it as it touches down)
  const lander = F.custom(function (c, t) {
    const img = F.ready(IM.obj_cohete2) ? IM.obj_cohete2 : IM.obj_cohete;   // the team's drawn rocket (O3 sheet)
    if (!F.ready(img)) return;
    const w = img === IM.obj_cohete2 ? 22 : 36, h = w * img.height / img.width;          // small: it lands far away on the plain
    c.translate(this.x, this.y);
    if (this.flame > 0.01) {
      const L = (34 + (F.step(t) % 3) * 10) * this.flame;
      c.fillStyle = "#ffb347"; c.strokeStyle = F.INK; c.lineWidth = 3; c.lineJoin = "round";
      c.beginPath(); c.moveTo(-12, 2); c.quadraticCurveTo(-9, L * 0.6, 0, L); c.quadraticCurveTo(9, L * 0.6, 12, 2); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#fff3b0"; c.beginPath(); c.moveTo(-6, 2); c.quadraticCurveTo(0, L * 0.55, 6, 2); c.closePath(); c.fill();
    }
    c.scale(this.sx, this.sy);
    c.drawImage(img, -w / 2, -h, w, h);
  }, { z: 8, x: 1000, y: -120, sx: 1, sy: 1, flame: 1 });

  // the team's drawn frames over the puppet: show(set, frame) swaps in a drawn pose (in two small steps,
  // with a little squash as it lands); hide() gives the stage back to the puppet
  let ov = null;
  function show(name, k) {
    if (!F.hasSprites(name)) return false;
    if (!ov || ov.set !== name) {
      if (ov) F.remove(ov);
      ov = F.mirrorFrames(name, mir, { frame: k });
      ov.set = name;
    }
    F.place(ov, name, "mirror", mir.s, mir.x, mir.y + 13 * mir.s);
    F.add(ov);                       // (no-op if it is already on stage; puts it back after a scene change)
    ov.frame = k; ov.sx = 1.04; ov.sy = 0.96;
    tw(ov, { sx: 1, sy: 1 }, 240, EZ.back);
    mir.op = 0;
    const me = ov;
    wait(100).then(() => { if (ov === me && me.frame === k) me.frame = k + 1; }).catch(() => {});
    return true;
  }
  function hide() { if (ov) { F.remove(ov); ov = null; } mir.op = 1; }

  async function abandoned29() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 640; mir.y = 600; mir.s = 0.62; mir.eyes = "half"; mir.mouth = "closed"; mir.brows = false; mir.lx = 0; mir.ly = 0; mir.glow = 0; mir.dust = 0;
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), mir], { bg: "#05060a", cam: { x: 640, y: 420, z: 1.5 } });
    F.faceNow(mir, "sad"); F.gesture(mir, "droop", 1);
    show("E11_espejo_mira_lejos", 4);                         // small and lonely, looking down
    await F.irisIn(640, 400, 800);
    const v = S.speak(29, mir);
    tw(F.cam, { z: 0.95, y: 360 }, 5200, EZ.inOut);          // we pull back: the Mirror looks very small and alone
    await atw(29, "abandoned", 0, 3.3);
    mir.ly = -3;
    show("E11_espejo_mira_lejos", 0);                         // it looks up at the sky
    await v;
    await wait(400);
    hide();
  }

  async function no30() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 640; mir.y = 610; mir.s = 0.58; mir.eyes = "open"; mir.ly = 0;
    const p = S.fx();
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), mir, p], { bg: "#05060a", cam: { x: 640, y: 380, z: 1.1 } });
    const v = S.speak(30, mir);
    // "No." — a firm little hop
    mir.brows = true; F.face(mir, "determined"); F.gesture(mir, "one", 180);
    if (show("E6_espejo_cuenta", 10)) {                       // drawn: one finger up
      ov.sy = 1.1; ov.sx = 0.94; await tw(ov, { sy: 1, sx: 1 }, 420, EZ.elastic);
    } else {
      await tw(mir, { sy: 1.1, sx: 0.94 }, 140, EZ.out);
      await tw(mir, { sy: 1, sx: 1 }, 380, EZ.elastic);
    }
    mir.brows = false;
    await atw(30, "answer", 0, 2.6);
    mir.glow = 1; tw(mir, { glow: 0 }, 700, EZ.out); sfx("ting");
    F.face(mir, "happy"); F.gesture(mir, "cheer", 200);
    show("E11_espejo_mira_lejos", 12);                        // drawn: beaming
    p.emit("spark", mir.x, mir.y - 230, 8, { spread: 200, vy: -40, g: 0, r: 12, life: 0.8, fill: "#fff6c8" });
    await atw(30, "quiet", 0, 5.4);
    F.face(mir, "sad"); F.gesture(mir, "droop");
    show("E11_espejo_mira_lejos", 4);                         // drawn: sad, looking down
    // two framed portraits of the neighbors who went quiet
    const frames = [
      F.proof("ph_opp", "Opportunity, 2004-2018", { x: 300, y: 250, w: 230, rot: -0.07, label: "QUIET" }),
      F.proof("ph_p10", "Pioneer 10, 1972-2003", { x: 980, y: 250, w: 250, rot: 0.06, label: "QUIET" })
    ];
    frames.forEach((f, i) => wait(i * 200).then(() => F.popIn(f, 380, "pop")).catch(() => {}));
    await atw(30, "check", 0, 10.1);
    frames.forEach((f) => F.popOut(f));
    // what each one left: a time, a number, a measurement
    const today = F.p10 ? F.p10.today() : { au: 141 };
    const cards = [
      [10.9, "a time", "2.505 s", "the light's round trip"],
      [11.7, "a number", "10.8", "Opportunity's last dust reading"],
      [12.6, "a measurement", today.au.toFixed(1) + " AU", "Pioneer 10's distance today"]
    ];
    const made = [];
    for (let i = 0; i < 3; i++) {
      const k = cards[i];
      await atw(30, ["time", "number", "measurement"][i], 0, k[0]);
      F.face(mir, "proud"); F.gesture(mir, ["one", "two", "three"][i], 200);
      show("E6_espejo_cuenta", i * 2);                        // drawn: one, two, three fingers
      const st = F.stamp([k[2]], { x: 520 + i * 290, y: 170, size: 44, style: "card", rot: (i - 1) * 0.04, kicker: k[1] });   // clear of the Earth, top left
      made.push(st);
      F.popIn(st, 360, "stamp");
    }
    await v;
    show("E6_espejo_cuenta", 14);                             // drawn: gloves open, smiling
    await wait(500);
    made.forEach((st) => F.popOut(st));
    hide();
  }

  async function true31() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 640; mir.y = 610; mir.s = 0.6; mir.eyes = "open"; mir.mouth = "smile";
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), mir], { bg: "#05060a", cam: { x: 640, y: 380, z: 1.1 } });
    const v = S.speak(31, mir);
    const drawn = show("E6_espejo_cuenta", 14);               // drawn: gloves open toward the viewer
    // closer and closer: the most important line (the drawn Mirror sits lower in its frame, so aim lower)
    tw(F.cam, drawn ? { z: 1.5, y: 450 } : { z: 1.75, y: 330 }, 6500, EZ.inOut);
    const warm = F.custom(function (c) {
      c.globalCompositeOperation = "soft-light";
      c.fillStyle = "rgba(255,200,120," + this.k + ")"; c.fillRect(0, 0, W, H);
    }, { par: 0, z: 100, k: 0 });
    F.add(warm);
    tw(warm, { k: 0.45 }, 4000, EZ.inOut);
    F.faceNow(mir, "neutral"); F.gesture(mir, "present", 1);
    await atw(31, "told", 0, 4.6);
    F.face(mir, "worried"); F.gesture(mir, "shrug");
    const shrug = show("E6_espejo_cuenta", 6);                // drawn: a doubtful shrug
    const rumor = F.icon("voice", { x: 330, y: 220, s: 0.7 });
    if (!shrug) {                                             // (the crossed-out icon only goes with the old puppet)
      F.popIn(rumor, 300, "squeak");
      await wait(450);
      sfx("rip"); tw(rumor, { xp: 1 }, 380, EZ.out);
    } else sfx("squeak", 0.8);
    await atw(31, "check", 0, 6.7);
    F.face(mir, "happy"); F.gesture(mir, "thumb", 200);
    show("E11_espejo_mira_lejos", 14);                        // drawn: a wink and a thumbs up
    F.popOut(rumor);
    const tick = F.custom(function (c) {
      c.translate(this.x, this.y); c.scale(this.s, this.s);
      c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = F.INK; c.lineWidth = 34; c.beginPath(); c.moveTo(-60, 0); c.lineTo(-15, 50); c.lineTo(80, -70); c.stroke();
      c.strokeStyle = "#ffe07a"; c.lineWidth = 20; c.stroke();
    }, { par: 0, z: 110, x: 990, y: 220, s: 1 });
    await F.stampDown(tick);
    sfx("tada");
    await v;
    await wait(500);
    hide();
  }

  async function back32() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 470; mir.y = 620; mir.s = 0.5; mir.eyes = "open"; mir.mouth = "smile"; mir.lx = 8; mir.ly = -2;
    const p = S.fx();
    lander.x = 1010; lander.y = -140; lander.flame = 1;
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), lander, mir, p], { bg: "#05060a", cam: { x: 640, y: 380, z: 1 } });
    F.faceNow(mir, "curious"); F.gesture(mir, "shade", 1);
    // the team's drawn frames when they are there: it shades its eyes to watch the lander, then waves to it
    let far = null;
    if (F.hasSprites("E11_espejo_mira_lejos")) {
      far = F.mirrorFrames("E11_espejo_mira_lejos", mir, { frame: 2 });
      F.add(far); mir.op = 0;
      wait(120).then(() => { if (far) far.frame = 3; }).catch(() => {});
    }
    const v = S.speak(32, mir);
    await atw(32, "come", 0, 1.6);
    sfx("rumble", 0.8);
    // it comes down fast and brakes on its flame before the ground (slow in), kicking up dust as it gets close,
    // then touches down with a little squash and settles (follow-through)
    const dust = F.every(90, () => {
      if (lander.y > 380 && lander.flame > 0.1) p.emit("puff", lander.x, 470, 2, { spread: 40, vy: -20, vxr: 160, g: 10, r: 9, life: 0.9, fill: "#cfc7b8", ink: "rgba(40,40,40,0.35)" });
    });
    try {
      lander.sx = 0.92; lander.sy = 1.1;
      tw(lander, { sx: 1, sy: 1 }, 2200, EZ.out);
      await tw(lander, { y: 470 }, 2600, EZ.out);
    } finally { dust(); }
    lander.flame = 0;
    lander.sx = 1.15; lander.sy = 0.85; tw(lander, { sx: 1, sy: 1 }, 450, EZ.elastic);
    p.emit("puff", lander.x, 472, 8, { spread: 120, vy: -30, vxr: 220, g: 20, r: 12, life: 1.2, fill: "#cfc7b8", ink: "rgba(40,40,40,0.4)" });
    sfx("thud");
    await atw(32, "waiting", 0, 5.2);
    F.face(mir, "happy"); F.gesture(mir, "rest");
    if (far) {
      for (let k = 0; k < 6; k++) { far.frame = 10 + (k % 2); await wait(110); }
      far.frame = 12; wait(110).then(() => { if (far) far.frame = 13; }).catch(() => {});
    }
    await v;
    if (far) { F.remove(far); far = null; mir.op = 1; }
    mir.eyes = "open"; mir.lx = 0; mir.ly = 0;
  }

  async function answer33() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 640; mir.y = 600; mir.s = 0.62; mir.eyes = "open"; mir.mouth = "smile";
    const p = S.fx();
    const ph = F.photon({ s: 0.6, op: 0 });
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), mir, ph, p], { bg: "#05060a", cam: { x: S.LUNA.earth.x + 100, y: S.LUNA.earth.y + 60, z: 1.4 } });
    F.faceNow(mir, "neutral"); F.gesture(mir, "rest", 1);
    // the team's drawn frames when they are there: hopeful, looking up at the Earth; a joyful glow; a wink to the viewer
    let fin = null;
    if (F.hasSprites("E11_espejo_mira_lejos")) {
      fin = F.mirrorFrames("E11_espejo_mira_lejos", mir, { frame: 8 });
      F.add(fin); mir.op = 0;
    }
    const v = S.speak(33, mir);
    if (fin) wait(900).then(() => { if (fin) fin.frame = 9; }).catch(() => {});
    await atw(33, "light", 0, 3.3);
    // a tiny spark leaves the Earth...
    p.emit("spark", S.LUNA.earth.x, S.LUNA.earth.y, 6, { spread: 40, vy: 0, vyr: 60, vxr: 60, g: 0, r: 10, life: 0.6, fill: "#ffe07a" });
    sfx("sparkle");
    ph.x = S.LUNA.earth.x; ph.y = S.LUNA.earth.y; ph.op = 1;
    const tx = mir.x - 25, ty = mir.y - 240;
    ph.dir = Math.atan2(ty - ph.y, tx - ph.x);
    tw(F.cam, { x: 560, y: 400, z: 1.05 }, 1500, EZ.inOut);
    await tw(ph, { x: tx, y: ty }, 1500, EZ.in);
    ph.op = 0;
    // ...and the Mirror answers
    await atw(33, "and", 0, 5.0);
    mir.glow = 1; F.flash(0.5); sfx("ting", 1.2);
    p.emit("spark", tx, ty, 12, { spread: 30, vy: 0, vyr: 260, vxr: 260, g: 0, r: 14, life: 0.7, fill: "#ffe07a" });
    tw(mir, { glow: 0 }, 900, EZ.out);
    if (fin) { fin.frame = 12; fin.sx = 1.06; fin.sy = 0.94; tw(fin, { sx: 1, sy: 1 }, 400, EZ.elastic); wait(110).then(() => { if (fin) fin.frame = 13; }).catch(() => {}); }
    await atw(33, "answer", 0, 6.2);
    F.face(mir, "happy"); F.gesture(mir, "wave", 220); sfx("ding");
    if (fin) { fin.frame = 14; wait(120).then(() => { if (fin) fin.frame = 15; }).catch(() => {}); }
    tw(F.cam, { x: mir.x, y: mir.y - 150, z: 1.8 }, 1500, EZ.inOut);
    await v;
    await wait(900);
    await F.irisOut(W / 2, H / 2 - 20, 1100);
    if (fin) { F.remove(fin); fin = null; mir.op = 1; }
  }

  // ---------- credits: where every number and picture came from ----------
  const CREDITS = [
    ["The Mirror That Still Answers", ""],
    ["By Team Unsigned Int · NASA Space Apps Challenge 2026", ""],
    ["Real data", "Laser measurements to the Apollo 11 mirror, 2025-2026: NASA CDDIS / International Laser Ranging Service"],
    ["", "Distance between the Earth and the Moon, and Pioneer 10's distance since 1972: NASA/JPL Horizons"],
    ["", "Dust in the sky over Opportunity, 2004-2018: NASA Planetary Data System (MER Pancam atmospheric opacity)"],
    ["", "Opportunity's last reading (tau about 10.8): NASA/JPL-Caltech, PIA22930"],
    ["Real photos", "NASA AS11-40-5948 · AS17-148-22727 · art002e009057 · NASA/JPL-Caltech PIA17759 · NASA Ames ARC-1972-AC72-2135 and ARC-1972-AC72-1354 (artwork)"],
    ["Voice", "Recorded by a member of the team (not synthetic)"],
    ["Made with AI tools", "Painted scenes and character drawings: AI image generators. Music: AI music generator. Sound effects: made by code."],
    ["", "Code and animation: AI coding assistant, directed and checked by the team."]
  ];
  const credits = F.custom(function (c) {
    c.textAlign = "center"; c.textBaseline = "middle";
    let y = 120;
    CREDITS.forEach((r, i) => {
      c.globalAlpha = F.clamp(this.k * CREDITS.length - i, 0, 1);
      if (i === 0) { c.font = "bold 44px " + F.FONT; c.fillStyle = "#ffe07a"; c.fillText(r[0], W / 2, y); y += 46; return; }
      if (i === 1) { c.font = "20px " + F.FONT; c.fillStyle = F.PAPER; c.fillText(r[0], W / 2, y); y += 52; return; }
      if (r[0]) { c.font = "bold 18px " + F.FONT; c.fillStyle = "#ffe07a"; c.fillText(r[0], W / 2, y); y += 24; }
      c.font = "15px Arial, sans-serif"; c.fillStyle = F.PAPER; c.fillText(r[1], W / 2, y); y += 30;
    });
  }, { par: 0, z: 10, k: 0 });

  async function closing() {
    S.setChapter(4);
    F.music("assets/music/tierna.mp3", 0.34);
    await abandoned29();
    await no30();
    await true31();
    await back32();
    await answer33();
    F.scene([credits], { bg: "#0b0b0b" });
    await F.irisIn(W / 2, H / 2, 700);
    await tw(credits, { k: 1 }, 3500, EZ.lin);
    F.show(F.$("again"));
  }
  F.CHAPTERS[4] = closing;
})();
