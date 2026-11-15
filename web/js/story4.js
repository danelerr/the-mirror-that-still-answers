/* The Mirror That Still Answers — the ending, and the credits.
   Team Unsigned Int, NASA Space Apps Challenge 2026.
   Code written with an AI coding assistant, directed and reviewed by the team. */
(function () {
  "use strict";
  const F = window.F, W = F.W, H = F.H, EZ = F.EZ, IM = F.IM;
  const tw = F.tw, wait = F.wait, sfx = F.sfx;
  const S = F.story, atw = S.atw, mir = S.mir;

  // a lander of the future, drawn simply (no names, no logos)
  const lander = F.custom(function (c, t) {
    c.translate(this.x, this.y); c.scale(this.s, this.s);
    c.strokeStyle = F.INK; c.lineWidth = 5; c.lineJoin = "round";
    c.fillStyle = "#d9d4c6";
    for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 30, -20); c.lineTo(sx * 70, 40); c.stroke(); c.beginPath(); c.ellipse(sx * 72, 42, 16, 5, 0, 0, 6.2832); c.fill(); c.stroke(); }
    F.roundRect(c, -48, -90, 96, 76, 10); c.fill(); c.stroke();
    c.fillStyle = "#e8b53f"; F.roundRect(c, -40, -20, 80, 22, 6); c.fill(); c.stroke();
    c.fillStyle = "#9fc7d9"; c.beginPath(); c.arc(0, -56, 16, 0, 6.2832); c.fill(); c.stroke();
    if (this.flame > 0.01) {
      const L = (24 + (F.step(t) % 3) * 8) * this.flame;
      c.fillStyle = "#ffb347"; c.beginPath(); c.moveTo(-14, 4); c.quadraticCurveTo(0, 4 + L * 1.4, 14, 4); c.closePath(); c.fill(); c.stroke();
    }
  }, { z: 8, x: 1000, y: -120, s: 0.6, flame: 1 });

  async function abandoned29() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 640; mir.y = 600; mir.s = 0.62; mir.eyes = "half"; mir.mouth = "closed"; mir.brows = false; mir.lx = 0; mir.ly = 0; mir.glow = 0; mir.dust = 0;
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), mir], { bg: "#05060a", cam: { x: 640, y: 420, z: 1.5 } });
    await F.irisIn(640, 400, 800);
    const v = S.speak(29, mir);
    tw(F.cam, { z: 0.95, y: 360 }, 5200, EZ.inOut);          // we pull back: the Mirror looks very small and alone
    await atw(29, "abandoned", 0, 3.3);
    mir.ly = -3;
    await v;
    await wait(400);
  }

  async function no30() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 640; mir.y = 610; mir.s = 0.58; mir.eyes = "open"; mir.ly = 0;
    const p = S.fx();
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), mir, p], { bg: "#05060a", cam: { x: 640, y: 380, z: 1.1 } });
    const v = S.speak(30, mir);
    // "No." — a firm little hop
    mir.brows = true;
    await tw(mir, { sy: 1.1, sx: 0.94 }, 140, EZ.out);
    await tw(mir, { sy: 1, sx: 1 }, 380, EZ.elastic);
    mir.brows = false;
    await atw(30, "answer", 0, 2.6);
    mir.glow = 1; tw(mir, { glow: 0 }, 700, EZ.out); sfx("ting");
    p.emit("spark", mir.x, mir.y - 230, 8, { spread: 200, vy: -40, g: 0, r: 12, life: 0.8, fill: "#fff6c8" });
    await atw(30, "quiet", 0, 5.4);
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
      const st = F.stamp([k[2]], { x: 260 + i * 380, y: 170, size: 46, style: "card", rot: (i - 1) * 0.04, kicker: k[1] });
      made.push(st);
      F.popIn(st, 360, "stamp");
    }
    await v;
    await wait(500);
    made.forEach((st) => F.popOut(st));
  }

  async function true31() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 640; mir.y = 610; mir.s = 0.6; mir.eyes = "open"; mir.mouth = "smile";
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), mir], { bg: "#05060a", cam: { x: 640, y: 380, z: 1.1 } });
    const v = S.speak(31, mir);
    tw(F.cam, { z: 1.75, y: 330 }, 6500, EZ.inOut);           // closer and closer: the most important line
    const warm = F.custom(function (c) {
      c.globalCompositeOperation = "soft-light";
      c.fillStyle = "rgba(255,200,120," + this.k + ")"; c.fillRect(0, 0, W, H);
    }, { par: 0, z: 100, k: 0 });
    F.add(warm);
    tw(warm, { k: 0.45 }, 4000, EZ.inOut);
    await atw(31, "told", 0, 4.6);
    const rumor = F.icon("voice", { x: 330, y: 220, s: 0.7 });
    F.popIn(rumor, 300, "squeak");
    await wait(450);
    sfx("rip"); tw(rumor, { xp: 1 }, 380, EZ.out);
    await atw(31, "check", 0, 6.7);
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
  }

  async function back32() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 470; mir.y = 620; mir.s = 0.5; mir.eyes = "open"; mir.mouth = "smile"; mir.lx = 8; mir.ly = -2;
    const p = S.fx();
    lander.x = 1010; lander.y = -140; lander.flame = 1;
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), lander, mir, p], { bg: "#05060a", cam: { x: 640, y: 380, z: 1 } });
    const v = S.speak(32, mir);
    await atw(32, "come", 0, 1.6);
    sfx("rumble", 0.8);
    await tw(lander, { y: 440 }, 2600, EZ.out);
    lander.flame = 0;
    p.emit("puff", lander.x, 460, 8, { spread: 160, vy: -30, vxr: 220, g: 20, r: 14, life: 1.2, fill: "#cfc7b8", ink: "rgba(40,40,40,0.4)" });
    sfx("thud");
    await atw(32, "waiting", 0, 5.2);
    mir.eyes = "happy";
    await v;
    mir.eyes = "open"; mir.lx = 0; mir.ly = 0;
  }

  async function answer33() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 640; mir.y = 600; mir.s = 0.62; mir.eyes = "open"; mir.mouth = "smile";
    const p = S.fx();
    const ph = F.photon({ s: 0.6, op: 0 });
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), mir, ph, p], { bg: "#05060a", cam: { x: S.LUNA.earth.x + 100, y: S.LUNA.earth.y + 60, z: 1.4 } });
    const v = S.speak(33, mir);
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
    await atw(33, "answer", 0, 6.2);
    mir.eyes = "happy"; sfx("ding");
    tw(F.cam, { x: mir.x, y: mir.y - 190, z: 2 }, 1500, EZ.inOut);
    await v;
    await wait(900);
    await F.irisOut(W / 2, H / 2 - 20, 1100);
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
