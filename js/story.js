/* The Mirror That Still Answers — the story, shot by shot.
   Team Unsigned Int, NASA Space Apps Challenge 2026.
   Code written with an AI coding assistant, directed and reviewed by the team.
   Data: real lunar laser ranging (NASA CDDIS / ILRS), the Moon's orbit (NASA/JPL Horizons),
   Opportunity's dust measurements (NASA PDS), Pioneer 10's distance (NASA/JPL Horizons). */
(function () {
  "use strict";
  const F = window.F, W = F.W, H = F.H, EZ = F.EZ, IM = F.IM;
  const tw = F.tw, wait = F.wait, sfx = F.sfx;

  // ---------- data ----------
  F.LLR = window.LLR.map((r) => ({ t: Date.parse(r[0]), utc: r[0], station: r[1], tof: r[2], km: r[3], photons: r[4] }));
  const LLR = F.LLR;
  const STATIONS = { GRSM: "Grasse, France", APOL: "Apache Point, New Mexico" };
  let shot = LLR[LLR.length - 1];          // the most recent measurement goes first
  let shotsFired = 0;
  const fmtDate = (ms) => new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const fmtKm = (km) => Math.round(km).toLocaleString("en-US") + " km";
  const countBy = (k) => LLR.filter((d) => d.station === k).length;

  // ---------- what each line says (for captions) ----------
  F.LINES = {
    1: "In 1969, two astronauts left a mirror on the Moon.",
    2: "It has no battery. No motor. No voice.",
    3: "But send it light… and it answers.",
    4: "Oh! …Hello. Was that you?",
    5: "I am a mirror. Two astronauts set me down here in July 1969, and I have not moved since.",
    6: "No battery. No motor. I cannot call you. But when your light reaches me, I send it straight back to where it came from.",
    7: "Look at the number on the screen. That is how long your light took to come home. Light always travels at the same speed, so half of that time tells you how far away I am.",
    8: "That is how people know the distance to the Moon. Nobody guessed it. They timed it.",
    9: "And you don't have to take my word for it. Look.",
    10: "Every dot is a real measurement from 2025 and 2026. Two hundred seventy-five times, someone on Earth sent me light. Two hundred seventy-five times, I answered.",
    11: "See the wave? The Moon swings closer, and farther, every month. The line is the distance between the centers of the Earth and the Moon.",
    12: "My dots sit a little below the line, because the telescope and I both stand on the surface, facing each other. The numbers agree.",
    13: "I have neighbors, you know. They cannot answer anymore… but they left their measurements behind. Let me introduce one.",
    14: "This is Opportunity. It landed on Mars in January 2004, to look for signs of ancient water.",
    15: "It ran on sunlight. And every day, it looked straight at the Sun and measured how much dust was in the sky.",
    16: "Slide through its days. When the sky gets dusty, less sunlight reaches its solar panels.",
    17: "In 2007, a huge dust storm darkened the sky. Opportunity waited… and when the dust cleared, it went back to work.",
    18: "It drove more than forty-five kilometers. Then, in June 2018, the biggest storm of all covered the whole planet.",
    19: "Look at its last measurements. The numbers climb… and climb… and then they stop.",
    20: "Opportunity went quiet. But its numbers are still here, and anyone can check them.",
    21: "My farthest neighbor left Earth in 1972. Pioneer 10.",
    22: "It was the first spacecraft to fly through the asteroid belt and past Jupiter.",
    23: "It was built to last twenty-one months. It kept talking for more than thirty years.",
    24: "Its last signal reached us in January 2003, from more than twelve billion kilometers away. That signal took eleven hours and twenty minutes to arrive.",
    25: "Send it a greeting.",
    26: "Today, Pioneer 10 is more than a hundred and forty times farther from us than the Sun. Your message would take more than nineteen and a half hours to get there.",
    27: "It cannot answer anymore. Its power ran out. But we still know where it is. Not because it calls us… because we know how it moves.",
    28: "It carries a small metal plaque, a message for anyone who finds it. It is heading toward the star Aldebaran. It will pass it in about two million years.",
    29: "So… were we abandoned?",
    30: "No. Some of us still answer. Some of us went quiet. But every one of us left something you can check: a time, a number, a measurement.",
    31: "That is how you know what is true. Not because someone told you. Because you can check.",
    32: "And when people come back to the Moon, I will still be here, waiting for their light.",
    33: "Somewhere on Earth, someone will send me light again. And I will answer."
  };

  // ---------- when each word is spoken (measured on the recordings) ----------
  const WORDS = window.WORDS || {};
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  function wt(n, word, k) {
    const list = WORDS[n] || [], w0 = norm(word);
    let seen = 0;
    for (const w of list) {
      if (norm(w[0]) === w0 || (w0.length > 3 && norm(w[0]).indexOf(w0) === 0)) {
        if (seen === (k || 0)) return w[1];
        seen++;
      }
    }
    return null;
  }
  // wait until line n says `word` (the k-th time); `fb` is the fallback time in seconds
  const atw = (n, word, k, fb) => { const t = wt(n, word, k); return F.at(n, t !== null ? t : (fb || 0)); };
  const at = F.at;

  // ---------- pictures ----------
  const ART = ["espejo_cuerpo", "espejo_cejas", "espejo_ojos_abiertos", "espejo_ojos_medio", "espejo_ojos_cerrados", "espejo_boca_cerrada",
    "espejo_boca_poco", "espejo_boca_abierta", "espejo_boca_oh", "espejo_boca_sonrisa", "foton_rapido", "foton_feliz", "foton_cansado",
    "foton_decidido", "foton_dormido", "observatorio", "rover_cuerpo", "rover_mastil", "rover_brazo", "rover_ojos_abiertos",
    "rover_ojos_medio", "rover_ojos_cerrados", "cielo_sol", "cielo_nube_a", "cielo_nube_b", "cielo_nube_c", "cielo_tormenta", "carta",
    "marco_cartel", "sonda_cuerpo", "sonda_brazo_a", "sonda_brazo_b", "sonda_brazo_largo", "sonda_ojos_abiertos", "sonda_ojos_medio",
    "sonda_ojos_cerrados"];
  const SCENES = ["luna", "espacio", "observatorio", "teatro", "marte_llanura", "marte_arriba", "plataforma", "marte_agua",
    "crater_atardecer", "espacio_profundo", "antena"];
  const PROPS = ["obj_cohete", "obj_paracaidas", "obj_bolsas"];
  const loading = F.load(
    ART.map((n) => [n, "assets/art/" + n + ".png"])
      .concat(SCENES.map((n) => ["sc_" + n, "assets/scenes/" + n + ".jpg"]))
      .concat(PROPS.map((n) => [n, "assets/scenes/" + n + ".png"]))
      .concat([["earth", "assets/earth.png"], ["moon", "assets/moon.png"], ["as11", "assets/tranquility_as11-40-5948.jpg"],
        ["mars_ground", "assets/mars_ground.png"]])
  ).then(() => F.loadSprites());

  // ---------- the cast ----------
  const mir = F.mirror({ x: 640, y: 560, s: 0.62 });
  const speak = (n, who) => F.speak(n, who ? who.talk : null);
  const fx = () => F.particles({ z: 55 });
  // Glove gestures for the Mirror (positions are around its body; up is negative)
  const GP = {
    rest: [["open", -255, -170, 0.25], ["open", 255, -170, -0.25]],
    ground: [["open", -250, -25, 1.5], ["open", 250, -25, -1.5]],
    up: [["open", -300, -400, -0.5], ["open", 300, -400, 0.5]],
    wave: [["open", -255, -170, 0.25], ["wave", 270, -340, -0.25]],
    self: [["open", -255, -170, 0.25], ["point", 150, -250, -1.55]],
    right: [["open", -255, -170, 0.25], ["point", 300, -260, 1.5]],
    left: [["point", -300, -260, -1.5], ["open", 255, -170, -0.25]],
    pointUp: [["open", -255, -170, 0.25], ["point", 270, -390, 0.15]],
    one: [["open", -255, -170, 0.25], ["one", 270, -330, -0.1]],
    two: [["open", -255, -170, 0.25], ["two", 270, -330, -0.1]],
    three: [["open", -255, -170, 0.25], ["three", 270, -330, -0.1]],
    shrug: [["open", -300, -270, -0.75], ["open", 300, -270, 0.75]],
    present: [["open", -310, -230, -1.0], ["open", 310, -230, 1.0]],
    whisper: [["open", -255, -170, 0.25], ["open", 95, -215, -0.55]],
    thumb: [["open", -255, -170, 0.25], ["thumb", 270, -300, 0]],
    hips: [["fist", -235, -110, 2.5], ["fist", 235, -110, -2.5]],
    cheer: [["fist", -290, -420, -0.3], ["fist", 290, -420, 0.3]],
    shade: [["open", -255, -170, 0.25], ["open", 60, -345, -1.65]],
    droop: [["open", -230, -60, 1.9], ["open", 230, -60, -1.9]],
    tap: [["fist", -250, -120, 0.4], ["open", 255, -170, -0.25]]
  };
  function gesture(p, name, ms) {
    const g = GP[name] || GP.rest;
    p.pose = name;                     // the drawn Mirror picks its drawing from this
    [p.gL, p.gR].forEach((h, i) => {
      h.pose = g[i][0];
      F.tw(h, { x: g[i][1], y: g[i][2], rot: g[i][3] }, ms || 260, EZ.back);
    });
  }
  F.gesture = gesture;

  // ---------- where things are in the painted scenes ----------
  const LUNA = { earth: { x: 305, y: 173 }, mirror: { x: 640, y: 600 } };
  const OBS = { moon: { x: 815, y: 95 } };

  // the painted space scene has a stray mark in its lower left corner: a soft dark patch hides it
  function spacePatch(pl) {
    return F.custom(function (c) {
      const g = c.createRadialGradient(pl.x + 50, 660, 10, pl.x + 50, 660, 240);
      g.addColorStop(0, "rgba(17,15,13,1)"); g.addColorStop(0.62, "rgba(17,15,13,0.96)"); g.addColorStop(1, "rgba(17,15,13,0)");
      c.fillStyle = g; c.fillRect(pl.x - 200, 400, 520, 400);
    }, { z: -99 });
  }

  // =================== CHAPTER CARD ===================
  async function chapterCard(kicker, title) {
    const frame = F.custom(function (c) {
      const img = IM.marco_cartel;
      if (F.ready(img)) c.drawImage(img, 110, 64, 1060, 592);
    }, { par: 0, z: 0 });
    const t = F.stamp([title], { x: W / 2, y: H / 2 + 14, size: 70, style: "gold", kicker, par: 0 });
    F.scene([frame], { bg: "#0b0b0b" });
    await F.irisIn(W / 2, H / 2, 500);
    F.popIn(t, 520, "slideUp");
    await wait(2100);
    await F.irisOut(W / 2, H / 2, 500);
  }

  // =================== OPENING ===================
  async function opening() {
    setChapter(0);
    // --- 0. An old television: grey snow and its hiss, then the dial clicks and the picture rolls in
    const snow = F.custom(function (c, t) {
      if (this.op <= 0.01) return;
      if (!this.cv) {
        this.cv = document.createElement("canvas"); this.cv.width = 256; this.cv.height = 144;
        this.cx = this.cv.getContext("2d"); this.img = this.cx.createImageData(256, 144);
      }
      const st = Math.floor(t / 1000 * 24);          // fresh snow 24 times a second
      if (st !== this.last) {
        this.last = st;
        const d = this.img.data;
        for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 235) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
        this.cx.putImageData(this.img, 0, 0);
      }
      c.globalAlpha = this.op;
      // the picture tube warming up: a bright line in the middle opens into the full screen of snow
      const hh = Math.max(3, H * this.on), y0 = H / 2 - hh / 2;
      c.save(); c.beginPath(); c.rect(0, y0, W, hh); c.clip();
      c.imageSmoothingEnabled = false;
      c.drawImage(this.cv, 0, 0, W, H);
      c.imageSmoothingEnabled = true;
      const band = ((t / 850) % 1.4 - 0.2) * H;      // a darker band rolling down the screen
      const g = c.createLinearGradient(0, band - 90, 0, band + 90);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.5, "rgba(0,0,0,0.4)"); g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g; c.fillRect(0, band - 90, W, 180);
      c.fillStyle = "rgba(0,0,0,0.2)";
      for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2);   // scan lines
      if (this.on < 1) { c.fillStyle = "rgba(255,252,235," + (1 - this.on).toFixed(2) + ")"; c.fillRect(0, y0, W, hh); }
      c.restore();
      const v = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);   // the rounded glass of an old set
      v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.75)");
      c.fillStyle = v; c.fillRect(0, 0, W, H);
    }, { par: 0, z: 200, op: 1, on: 0.004 });
    F.scene([snow], { bg: "#000" });
    F.fadeTo(0, 1);
    F.music("assets/music/tierna.mp3", 0.28);           // music from the very first frame after Start
    sfx("tvon");
    sfx("static", 1.8);                                  // the hiss starts with the picture, not after it
    await tw(snow, { on: 1 }, 300, EZ.out);
    await wait(1250);
    // --- 1. A real photo from July 1969. The mirror is the small tray in the middle.
    const LR = { x: 507, y: 307 };                 // the retroreflector in the photo (AS11-40-5948)
    const photo = F.plate("as11", { x: 0, y: -330, w: 1280, h: 1280 });
    const sepia = F.custom(function (c) {
      c.globalCompositeOperation = "multiply";
      c.fillStyle = "rgb(214, 186, 140)";
      c.fillRect(-200, -400, W + 400, H + 800);
    }, { z: 5 });
    const ring = F.custom(function (c, t) {
      if (this.k <= 0.01) return;
      c.strokeStyle = "#ffe07a"; c.lineWidth = 4 / F.cam.z; c.setLineDash([12 / F.cam.z, 8 / F.cam.z]); c.lineDashOffset = -t / 40;
      c.beginPath(); c.ellipse(LR.x, LR.y, 58 * this.k, 34 * this.k, 0, 0, 6.2832); c.stroke();
    }, { z: 6, k: 0 });
    F.scene([photo, sepia, ring, snow, F.credit("Real photo: NASA AS11-40-5948, Tranquility Base, July 1969.")], { bg: "#000" });
    // the dial clicks onto the station: the picture flickers through the snow, rolls once and settles
    sfx("tune");
    F.flash(0.25);
    photo.y = -330 + 260;
    tw(photo, { y: -330 }, 320, EZ.out);
    F.keys(snow, [[{ op: 0.3 }, 50], [{ op: 0.9 }, 60], [{ op: 0.15 }, 60], [{ op: 0.6 }, 50], [{ op: 0 }, 260, EZ.out]])
      .then(() => F.remove(snow)).catch(() => {});
    const v1 = speak(1);
    tw(F.cam, { z: 1.5, x: LR.x + 40, y: LR.y + 30 }, 5800, EZ.inOut);
    await atw(1, "1969", 0, 0.5);
    const july = F.stamp(["July 1969"], { x: 1010, y: 120, size: 46, rot: -0.06, kicker: "Tranquility Base, the Moon" });
    F.popIn(july, 420, "stamp");
    await atw(1, "mirror", 0, 3.3);
    tw(ring, { k: 1 }, 450, EZ.bigBack);
    sfx("ting");
    await v1;
    await wait(250);

    // --- the photo dissolves into our cartoon world: the same mirror, asleep
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = LUNA.mirror.x; mir.y = LUNA.mirror.y; mir.s = 0.62; mir.eyes = "closed"; mir.mouth = "closed"; mir.brows = false; mir.op = 1;
    mir.sx = mir.sy = 1; mir.rot = 0; mir.glow = 0; mir.dust = 0;
    F.faceNow(mir, "neutral"); gesture(mir, "ground", 1);
    const p = fx();
    await F.dissolve(() => {
      F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), mir, p], { bg: "#05060a", cam: { z: 1.7, x: mir.x, y: mir.y - 120 } });
      tw(F.cam, { z: 1.12, y: 420 }, 2400, EZ.inOut);
    }, 1100);

    // --- 2. "It has no battery. No motor. No voice."
    // three slow pushes in on the sleeping Mirror, one for each "No…" (no crossed-out icons: they broke the style)
    const v2 = speak(2);
    const words2 = [["battery", 1.4], ["motor", 2.8], ["no", 3.9]];
    for (let i = 0; i < 3; i++) {
      await atw(2, words2[i][0], i === 2 ? 2 : 0, words2[i][1]);
      tw(F.cam, { z: 1.12 + (i + 1) * 0.1, y: 420 - (i + 1) * 18 }, 600, EZ.out);
      sfx("tock", 0.8);
    }
    await v2;
    await wait(300);

    // --- 3. "But send it light… and it answers."
    const v3 = speak(3);
    tw(F.cam, { x: LUNA.earth.x + 120, y: LUNA.earth.y + 80, z: 1.25 }, 1200, EZ.inOut);
    await atw(3, "light", 0, 1.0);
    p.emit("spark", LUNA.earth.x, LUNA.earth.y, 6, { spread: 60, vy: 0, vyr: 60, vxr: 60, g: 0, r: 12, life: 0.7, fill: "#ffe07a" });
    sfx("sparkle");
    await atw(3, "answ", 0, 2.4);
    tw(F.cam, { x: mir.x, y: mir.y - 170, z: 2.2 }, 380, EZ.out);
    mir.glow = 1; tw(mir, { glow: 0 }, 700, EZ.out);
    mir.eyes = "half"; F.face(mir, "curious");
    gesture(mir, "up", 180);
    sfx("ting", 1.2);
    p.emit("spark", mir.x - 30, mir.y - 230, 8, { spread: 90, vy: -40, g: 0, r: 14, life: 0.8, fill: "#fff6c8" });
    await v3;
    await wait(500);
    mir.eyes = "closed";
    await F.irisOut(F.W / 2, F.H / 2 - 40, 600);
  }

  // =================== CHAPTER 1: THE MIRROR ===================
  // the cartoon observatory on Earth, aimed at the Moon
  // the team's drawn observatory (16 frames, with a face) when it is there; the single drawing otherwise
  const DRAWN_SCOPE = F.hasSprites("O1_observatorio_dispara");
  const scope = DRAWN_SCOPE
    ? F.spriteSet("O1_observatorio_dispara", { x: 293, y: 722, w: 410, ay: 1, z: 20, frame: 0 })
    : F.sprite("observatorio", { x: 293, y: 722, w: 380, ax: 0.5, ay: 1, z: 20 });
  const TIP = { x: 740 / 797, y: 60 / 824 };    // the end of the telescope tube, as a share of the picture
  // the end of the tube in each drawn frame (pixels of the 375 x 480 frame); frames 6 and 7 are the burst of light
  const O1_TIP = [[329, 118], [329, 118], [329, 166], [331, 160], [326, 156], [326, 157], [345, 45], [345, 30],
    [325, 95], [311, 92], [317, 107], [313, 107], [330, 132], [328, 134], [340, 145], [342, 145]];
  // the mouth of the telescope tube, wherever the squash, stretch and lean have put it,
  // plus a little way out along the tube so the light starts in front of it, not on top of it
  function tipPos(out) {
    let tx = TIP.x, ty = TIP.y, aspect = 824 / 797;
    if (DRAWN_SCOPE) {
      const f = O1_TIP[Math.round(scope.frame || 0)] || O1_TIP[0];
      tx = f[0] / 375; ty = f[1] / 480; aspect = 480 / 375;
    }
    const w = scope.w * scope.s, h = w * aspect;
    const lx = (tx - 0.5) * w * scope.sx, ly = -(1 - ty) * h * scope.sy;
    const r = scope.rot || 0, cs = Math.cos(r), sn = Math.sin(r);
    const tube = -0.63 + r, d = out === undefined ? (DRAWN_SCOPE ? 10 : 34) : out;   // the tube points up and to the right
    return { x: scope.x + lx * cs - ly * sn + Math.cos(tube) * d, y: scope.y + lx * sn + ly * cs + Math.sin(tube) * d };
  }
  let scopeIdle = true;
  F.onFrame((t) => {
    if (!scopeIdle) return;
    const k = Math.sin(t / 520) * 0.5 + 0.5;     // breathing: squash and stretch at rest
    scope.sx = 1 + 0.02 * k; scope.sy = 1 - 0.02 * k;
  });

  // big digital clock in screen space while the light travels
  const clock = F.custom(function (c) {
    const txt = this.sec.toFixed(this.digits) + " s";
    c.font = "bold 64px " + F.FONT; c.textAlign = "center"; c.textBaseline = "middle";
    const w = c.measureText(txt).width + 50;
    c.translate(W / 2, 70); c.scale(this.s, this.s);
    c.fillStyle = "rgba(0,0,0,0.4)"; F.roundRect(c, -w / 2 + 6, -40 + 8, w, 80, 16); c.fill();
    c.fillStyle = F.INK; F.roundRect(c, -w / 2, -40, w, 80, 16); c.fill();
    c.strokeStyle = F.PAPER; c.lineWidth = 3; c.stroke();
    c.fillStyle = "#ffe07a"; c.fillText(txt, 0, 3);
    if (this.note) {
      c.font = "bold 22px " + F.FONT; c.fillStyle = F.PAPER; c.lineWidth = 5; c.strokeStyle = F.INK;
      c.strokeText(this.note, 0, 64); c.fillText(this.note, 0, 64);
    }
  }, { par: 0, z: 150, sec: 0, digits: 3, s: 1, note: "" });

  async function observatoryShot() {
    const sky = F.plate("sc_observatorio", { x: -40, y: -24, w: 1360, h: 765 });
    scope.x = 293; scope.y = 722; scope.s = 1; scope.op = 1;
    if (DRAWN_SCOPE) scope.frame = 0;
    F.scene([sky, scope, F.credit("Painted scene: AI image generator. The telescope fires real timing data.")], { bg: "#0b1020" });
    clock.sec = 0; clock.note = "";
  }

  // the photon's round trip, shown in real time: the same number of seconds as a real measurement
  async function flight(m) {
    const T = m.tof, half = T / 2;
    const ph = F.photon({ s: 1.1 });
    const p = fx();
    const t0 = performance.now();
    const el = () => (performance.now() - t0) / 1000;
    let phase = -1;
    const off = F.onFrame(() => { clock.sec = Math.min(el(), T); });
    clock.digits = 3;
    // A. leaving the telescope
    const tip = tipPos();
    ph.x = tip.x; ph.y = tip.y; ph.dir = Math.atan2(OBS.moon.y - tip.y, OBS.moon.x - tip.x); ph.stretch = 0.6;
    F.add(ph); F.add(p); F.add(clock);
    const exitA = { x: OBS.moon.x, y: OBS.moon.y };
    tw(ph, { stretch: 0 }, 200, EZ.out);
    await F.tw({ u: 0 }, { u: 1 }, half * 0.22 * 1000, EZ.in, (e) => {
      ph.x = F.lerp(tip.x, exitA.x, e); ph.y = F.lerp(tip.y, exitA.y, e);
    });
    // B. across space (the camera keeps up with it)
    const space = F.plate("sc_espacio", { x: 0, y: 0, w: 1680, h: 720 });
    const EARTH_P = { x: 171, y: 216 }, MOON_P = { x: 1358, y: 216 };
    ph.x = EARTH_P.x + 60; ph.y = EARTH_P.y; ph.dir = 0;
    F.scene([space, spacePatch(space), F.stars({ n: 160, par: 0.3, w: 2000, h: 900, x: -200, y: -100 }), ph, p, clock], { bg: "#000", cam: { x: 640, y: 360, z: 1 } });
    const camFollow = F.onFrame(() => { F.cam.x = F.clamp(ph.x, 640, 1680 - 640); });
    sfx("whoosh", 1.4);
    await F.tw({ u: 0 }, { u: 1 }, half * 0.6 * 1000, EZ.lin, (e) => { ph.x = F.lerp(EARTH_P.x + 60, MOON_P.x - 70, e); });
    camFollow();
    // C. on the Moon: the light hits the sleeping Mirror
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = LUNA.mirror.x; mir.y = LUNA.mirror.y; mir.eyes = "closed"; mir.mouth = "closed"; mir.brows = false; mir.op = 1; mir.s = 0.62;
    const hitX = mir.x - 25, hitY = mir.y - 240;
    ph.x = -40; ph.y = 120; ph.dir = Math.atan2(hitY - 120, hitX + 40);
    F.scene([luna, mir, ph, p, clock], { bg: "#05060a", cam: { x: 640, y: 380, z: 1.1 } });
    await F.until(() => {
      const u = F.clamp((el() - half * 0.82) / (half * 0.18), 0, 1);
      ph.x = F.lerp(-40, hitX, u); ph.y = F.lerp(120, hitY, u);
      return el() >= half;
    });
    // the hit: flash, starburst, the Mirror jolts
    clock.note = "It reached the mirror!";
    mir.glow = 1; tw(mir, { glow: 0 }, 600, EZ.out);
    F.flash(0.5); F.shake(10); sfx("zap"); sfx("ting", 1.3);
    p.emit("spark", hitX, hitY, 12, { spread: 30, vy: 0, vyr: 260, vxr: 260, g: 0, r: 14, life: 0.6, fill: "#ffe07a" });
    mir.sx = 1.12; mir.sy = 0.86; tw(mir, { sx: 1, sy: 1 }, 500, EZ.elastic);
    mir.eyes = "half";
    ph.dir = Math.atan2(120 - hitY, -40 - hitX);
    await F.until(() => {
      const u = F.clamp((el() - half) / (half * 0.2), 0, 1);
      ph.x = F.lerp(hitX, -40, u); ph.y = F.lerp(hitY, 120, u);
      return u >= 1;
    });
    // D. back across space
    ph.x = MOON_P.x - 70; ph.y = MOON_P.y; ph.dir = Math.PI;
    F.scene([space, spacePatch(space), F.stars({ n: 160, par: 0.3, w: 2000, h: 900, x: -200, y: -100 }), ph, p, clock], { bg: "#000", cam: { x: 1040, y: 360, z: 1 } });
    clock.note = "…and now it is coming home";
    const camBack = F.onFrame(() => { F.cam.x = F.clamp(ph.x, 640, 1680 - 640); });
    sfx("whoosh", 1.4);
    await F.until(() => {
      const u = F.clamp((el() - half * 1.2) / (half * 0.62), 0, 1);
      ph.x = F.lerp(MOON_P.x - 70, EARTH_P.x + 60, u);
      return u >= 1;
    });
    camBack();
    // E. home: the telescope catches the light
    await observatoryShot();
    F.add(ph); F.add(p); F.add(clock);
    const tip2 = tipPos();
    ph.dir = Math.atan2(tip2.y - OBS.moon.y, tip2.x - OBS.moon.x);
    await F.until(() => {
      const u = F.clamp((el() - half * 1.82) / (half * 0.18), 0, 1);
      ph.x = F.lerp(OBS.moon.x, tip2.x, u); ph.y = F.lerp(OBS.moon.y, tip2.y, u);
      return el() >= T;
    });
    off();
    clock.sec = T; clock.digits = 6;
    clock.note = "Home! A real round trip, measured " + fmtDate(m.t);
    F.remove(ph);
    scopeIdle = false;
    sfx("thud");
    if (DRAWN_SCOPE) {
      // the drawn catch: eyes squeezed by the impact, a wobble, then the proud smile
      scope.frame = 3;
      await F.keys(scope, [[{ sx: 1.08, sy: 0.92 }, 90, EZ.out], [{ sx: 0.97, sy: 1.04 }, 160, EZ.out]]);
      scope.frame = 10;
      await F.keys(scope, [[{ sx: 1, sy: 1 }, 200, EZ.back]]);
      scope.frame = 15;
    } else {
      await F.keys(scope, [[{ sx: 1.16, sy: 0.82 }, 90, EZ.out], [{ sx: 0.94, sy: 1.08 }, 160, EZ.out], [{ sx: 1, sy: 1 }, 260, EZ.back]]);
    }
    scopeIdle = true;
    // the photons that came home: one cartoon for each one the telescope counted
    const n = Math.min(m.photons, 60);
    const home = [];
    for (let i = 0; i < n; i++) {
      const f = F.sprite(i % 5 === 4 ? "foton_cansado" : "foton_feliz", { x: OBS.moon.x, y: OBS.moon.y, w: 34, z: 40, op: 1, s: 0.3 });
      home.push(f);
    }
    const tip3 = tipPos();
    // they fly in from the Moon along curves and drop into the telescope, one by one, and get counted
    const tally = F.stamp(["0"], { x: tip3.x + 170, y: tip3.y - 70, size: 44, style: "gold", par: 1, z: 60, kicker: "real photons back" });
    F.add(tally);
    // what the little photons mean, said once and plainly
    const legend = F.stamp(["1 little photon = 1 real photon", "the telescope counted"], { x: 1010, y: 380, size: 26, style: "card", rot: 0.03, kicker: STATIONS[m.station] + " · " + fmtDate(m.t) });
    F.popIn(legend, 380, "pop");
    let got = 0;
    home.forEach((f, i) => {
      wait(i * 42).then(() => {
        F.add(f);
        f.x = OBS.moon.x + (Math.random() - 0.5) * 90; f.y = OBS.moon.y + (Math.random() - 0.5) * 50;
        tw(f, { s: 0.9 }, 300, EZ.out);
        return F.arc(f, tip3.x + (Math.random() - 0.5) * 10, tip3.y + (Math.random() - 0.5) * 10, 40 + Math.random() * 90, 680, EZ.in);
      }).then(() => tw(f, { s: 0.05 }, 110, EZ.in))
        .then(() => {
          F.remove(f);
          got++;
          tally.lines = [String(got)];
          if (got % 4 === 0) sfx("pop", 1 + got / 50);
        }).catch(() => {});
    });
    await wait(n * 42 + 1000);
    tally.lines = [String(m.photons)];
    tally.sx = 1.2; tally.sy = 0.85; tw(tally, { sx: 1, sy: 1 }, 400, EZ.elastic);
    F.popOut(legend);
    const count = F.stamp([m.photons + " photons came home"], { x: 1010, y: 380, size: 34, rot: 0.04, kicker: STATIONS[m.station] });
    F.popIn(count, 420, "tada");
    if (F.hasSprites("F4_foton_llega")) {
      // the team's drawn frames: one photon lands at home, squashes, bounces, waves and cheers
      // (drawings 8-9 carry a written word, so they are never used)
      const hero = F.spriteSet("F4_foton_llega", { x: 640, y: 714, w: 150, ay: 1, z: 45, frame: 0 });
      F.add(hero);
      for (const [f, ms, snd] of [[0, 140], [2, 110, "thud"], [3, 120], [4, 120, "boing"], [5, 140], [6, 170], [7, 170], [6, 170], [7, 170],
        [12, 190, "tada"], [13, 210], [12, 190], [13, 260], [10, 220], [11, 260]]) {
        hero.frame = f; if (snd) sfx(snd, 1.2); await wait(ms);
      }
      F.remove(hero);
    } else await wait(2600);
    return home;
  }

  // ---------- interactive: send your light ----------
  const sendBtn = F.$("send");
  function waitSend() {
    const id = F.runId;
    F.show(sendBtn);
    return F.quiet(new Promise((resolve, reject) => {
      function go(e) {
        if (e) e.stopPropagation();
        sendBtn.removeEventListener("click", go);
        clearInterval(chk);
        sendBtn.blur();
        F.hide(sendBtn);
        if (id !== F.runId) reject(F.ABORT); else resolve();
      }
      const chk = setInterval(() => { if (id !== F.runId) { clearInterval(chk); sendBtn.removeEventListener("click", go); F.hide(sendBtn); reject(F.ABORT); } }, 200);
      sendBtn.addEventListener("click", go);
      if (F.AUTOPLAY) setTimeout(go, 2500);
    }));
  }

  async function sendLight() {
    await observatoryShot();
    await F.irisIn(scope.x + 60, 480, 800);
    const hint = F.stamp(["Press the button to send light to the Moon"], { x: W / 2, y: 70, size: 26, style: "ink", par: 0 });
    F.popIn(hint, 400);
    await waitSend();
    F.popOut(hint);
    shotsFired++;
    // anticipation: the telescope crouches and leans back, holds, then fires and recoils
    scopeIdle = false;
    sfx("slideDown", 0.7);
    if (DRAWN_SCOPE) {
      // the drawn take: a breath in, the crouch with eyes squeezed shut, trembling, then it springs up as the light leaves
      scope.frame = 1; await wait(200);
      scope.frame = 2; tw(scope, { sx: 1.06, sy: 0.94 }, 300, EZ.inOut); await wait(240);
      scope.frame = 3; await wait(200);
      for (let k = 0; k < 6; k++) { scope.frame = 4 + (k % 2); scope.x = 293 + (k % 2 ? 2.5 : -2.5); await wait(65); }
      scope.x = 293;
      scope.frame = 6; scope.sx = 0.93; scope.sy = 1.1;
    } else {
      await F.keys(scope, [[{ sx: 1.14, sy: 0.8, rot: -0.06 }, 480, EZ.inOut]]);
      await wait(140);
    }
    sfx("zap");
    F.shake(6);
    const tip = tipPos();
    const p0 = fx(); F.add(p0);
    p0.emit("smoke", tip.x, tip.y, 6, { spread: 20, vx: -60, vy: -20, r: 16, life: 0.8, fill: "#f3e6c8", g: -20 });
    if (DRAWN_SCOPE) {
      // recoil, bounce, wobble, settle into a proud smile (frames 7 to 15)
      (async () => {
        await wait(90); scope.frame = 7;
        await wait(110); scope.frame = 8; tw(scope, { sx: 1, sy: 1 }, 300, EZ.back);
        for (const [f, ms] of [[9, 110], [10, 100], [11, 100], [10, 100], [11, 100], [12, 120], [13, 120], [14, 160], [15, 0]]) {
          scope.frame = f; await wait(ms);
        }
      })().then(() => { scopeIdle = true; }).catch(() => {});
    } else {
      F.keys(scope, [[{ sx: 0.86, sy: 1.22, rot: 0.05 }, 110, EZ.out], [{ sx: 1.08, sy: 0.9, rot: -0.03 }, 200, EZ.out],
        [{ sx: 1, sy: 1, rot: 0 }, 380, EZ.back]]).then(() => { scopeIdle = true; }).catch(() => {});
    }
    return flight(shot);
  }

  async function chapter1() {
    setChapter(1);
    F.music("assets/music/alegre.mp3", 0.3);
    await chapterCard("Chapter 1", "The Mirror");
    await sendLight();
    await F.irisOut(OBS.moon.x, OBS.moon.y, 600);

    // --- 4. The Mirror wakes up: "Oh! …Hello. Was that you?"
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    const p = fx();
    mir.x = LUNA.mirror.x; mir.y = LUNA.mirror.y; mir.s = 0.62; mir.eyes = "half"; mir.mouth = "closed"; mir.brows = false; mir.lx = 0; mir.ly = 0;
    mir.dust = 0.5;
    F.faceNow(mir, "tired"); gesture(mir, "ground", 1);
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), mir, p], { bg: "#05060a", cam: { x: 640, y: 400, z: 1.25 } });
    await F.irisIn(mir.x, mir.y - 200, 700);
    await wait(300);
    // the drawn wake-up with arms (16 drawings), the same design as every other drawing of the Mirror
    const WAKE = "E2_espejo_despierta_brazos";
    if (F.hasSprites(WAKE)) {
      const fw = (window.SPRITES[WAKE].w || 490) * 330 / 490;
      const take = F.spriteSet(WAKE, { x: mir.x + 4, y: mir.y + 8, w: fw, ay: 1, z: 21, frame: 0 });
      F.add(take); mir.op = 0;
      // (drawings 6-8 of the sheet gave the Mirror legs, which it does not have: the jump is done by moving
      // the startled drawing instead, with stretch going up and squash on landing)
      const y0 = mir.y + 8;
      const seq = [[0, 450], [1, 300], [2, 280, "ting"], [3, 240], [4, 110, "pop"], [5, 90, "boing", "up"], [5, 220, null, "air"],
        [9, 110, null, "down"], [10, 100, "thud", "land"], [11, 120], [12, 120], [13, 120], [14, 220], [15, 380]];
      for (const s of seq) {
        take.frame = s[0];
        if (s[2]) sfx(s[2], s[2] === "boing" ? 1.1 : 1);
        if (s[3] === "up") {
          p.emit("puff", mir.x, mir.y - 260, 10, { spread: 260, vy: -120, vyr: 80, vxr: 240, g: 160, r: 12, life: 1, fill: "#cfc7b8", ink: "rgba(40,40,40,0.4)" });
          mir.dust = 0;
          take.sx = 0.9; take.sy = 1.14;
          tw(take, { y: y0 - 70 }, 200, EZ.out);
        }
        if (s[3] === "air") tw(take, { sx: 1, sy: 1 }, 200, EZ.out);
        if (s[3] === "down") { take.sx = 0.94; take.sy = 1.08; tw(take, { y: y0 }, 110, EZ.in); }
        if (s[3] === "land") { take.sx = 1.12; take.sy = 0.88; tw(take, { sx: 1, sy: 1 }, 380, EZ.elastic); F.shake(5); }
        await wait(s[1]);
      }
      mir.eyes = "open"; mir.mouth = "smile"; mir.brows = false; F.faceNow(mir, "happy"); gesture(mir, "rest", 1);
      mir.op = 1; F.remove(take);
    } else {
      // anticipation: it sinks...
      await tw(mir, { sx: 1.08, sy: 0.88 }, 300, EZ.inOut);
      // ...then the take: eyes pop, it springs up, dust flies off, it overshoots and settles
      mir.eyes = "open"; mir.mouth = "oh"; mir.brows = true;
      F.faceNow(mir, "surprised"); gesture(mir, "up", 160);
      sfx("boing", 1.1);
      p.emit("puff", mir.x, mir.y - 300, 10, { spread: 260, vy: -120, vyr: 80, vxr: 240, g: 160, r: 12, life: 1, fill: "#cfc7b8", ink: "rgba(40,40,40,0.4)" });
      mir.dust = 0;
      await F.keys(mir, [[{ sx: 0.9, sy: 1.16, y: LUNA.mirror.y - 40 }, 160, EZ.out], [{ sx: 1.05, sy: 0.95, y: LUNA.mirror.y }, 220, EZ.in],
        [{ sx: 1, sy: 1 }, 380, EZ.elastic]]);
    }
    const v4 = speak(4, mir);
    if (F.hasSprites("E3_espejo_saluda")) {
      // the team's drawn frames: "Oh!" surprised, a shy smile, a friendly wave, then a curious "was that you?"
      const hi = F.spriteSet("E3_espejo_saluda", { x: mir.x + 4, y: mir.y + 8, w: 330, ay: 1, z: 21, frame: 0 });
      F.add(hi); mir.op = 0;
      const seq = async (s) => { for (const [f, ms] of s) { hi.frame = f; await wait(ms); } };
      await seq([[0, 120], [1, 120], [2, 0]]);
      await atw(4, "hello", 0, 1.2);
      await seq([[3, 110], [4, 110], [5, 160]]);
      sfx("swish", 0.8);
      let waving = true;
      (async () => { while (waving) { for (const f of [6, 7, 8, 9, 10, 11, 10, 9, 8, 7]) { if (!waving) break; hi.frame = f; await wait(75); } } })().catch(() => {});
      await atw(4, "you", 0, 3.4);
      waving = false;
      tw(F.cam, { z: 1.45, y: 400 }, 500, EZ.back);
      // "Was that you?": the talking Mirror asks, curious (drawings 13-15 of this sheet, gloves at the mouth, are not used)
      F.remove(hi); mir.op = 1; mir.brows = false; mir.lx = 0;
      F.faceNow(mir, "neutral"); gesture(mir, "present", 1);
      await v4;
      await wait(200);
      gesture(mir, "rest", 1);
    } else {
      await atw(4, "hello", 0, 1.2);
      mir.brows = false; F.face(mir, "happy"); gesture(mir, "wave", 300);
      await atw(4, "you", 0, 3.4);
      F.face(mir, "curious"); gesture(mir, "right", 260);
      tw(F.cam, { z: 1.45, y: 380 }, 500, EZ.back);
      mir.lx = 0; await v4;
    }
    mir.mouth = "smile"; F.face(mir, "neutral"); gesture(mir, "rest");
    await wait(250);

    // --- 5. "I am a mirror. Two astronauts set me down here in July 1969, and I have not moved since."
    tw(F.cam, { z: 1.15, y: 400 }, 900, EZ.inOut);
    const v5 = speak(5, mir);
    await atw(5, "mirror", 0, 0.8);
    F.face(mir, "proud"); gesture(mir, "self");
    sfx("sparkle");
    p.emit("spark", mir.x, mir.y - 220, 8, { spread: 240, vy: -30, g: 0, r: 12, life: 0.9, fill: "#fff6c8" });
    tw(mir, { sy: 1.06 }, 250, EZ.out).then(() => tw(mir, { sy: 1 }, 400, EZ.back)).catch(() => {});
    await atw(5, "july", 0, 2.6);
    F.face(mir, "happy"); gesture(mir, "right");
    const proof = F.proof("as11", "Tranquility Base, July 20, 1969. NASA photo AS11-40-5948.", { x: 1000, y: 300, w: 380, rot: 0.05 });
    F.popIn(proof, 450, "shutter");
    await atw(5, "moved", 0, 5.4);
    F.popOut(proof);
    // the years go by and the Mirror does not move: calendar pages fly past
    const years = F.custom(function (c) {
      if (this.y0 <= 0) return;
      c.font = "bold 64px " + F.FONT; c.textAlign = "center"; c.textBaseline = "middle";
      c.lineWidth = 10; c.strokeStyle = F.INK; c.fillStyle = "#ffe07a";
      const txt = String(Math.round(this.year));
      c.strokeText(txt, W / 2, 120); c.fillText(txt, W / 2, 120);
    }, { par: 0, z: 120, year: 1969, y0: 1 });
    F.add(years);
    tw(years, { year: 2026 }, 1700, EZ.inOut, () => { if (F.step(F.t) % 2) sfx("tick"); });
    if (F.hasSprites("E5_espejo_anios")) {
      // the team's drawn frames: bored, a yawn, the dust piles up, it nods off... then a hard shrug blows the dust away
      const yrs = F.spriteSet("E5_espejo_anios", { x: mir.x + 4, y: mir.y + 8, w: 330, ay: 1, z: 21, frame: 15 });
      F.add(yrs); mir.op = 0;
      // (drawings 10-11, arms tucked in odd stubs, and 13, colours swapped, are left out)
      for (const f of [2, 3, 2, 3, 4, 5, 6, 7, 8, 9]) { yrs.frame = f; await wait(165); }
      await v5;
      yrs.frame = 12; sfx("boing", 0.8);
      p.emit("puff", mir.x, mir.y - 260, 10, { spread: 280, vy: -90, g: 160, r: 12, life: 0.9, fill: "#cfc7b8", ink: "rgba(40,40,40,0.4)" });
      yrs.sx = 1.08; yrs.sy = 0.92; tw(yrs, { sx: 1, sy: 1 }, 420, EZ.elastic);
      await wait(260); yrs.frame = 14; await wait(220); yrs.frame = 15; await wait(260);
      F.remove(yrs); mir.op = 1; mir.dust = 0; mir.eyes = "open"; F.faceNow(mir, "happy");
    } else {
      tw(mir, { dust: 0.7 }, 1700, EZ.lin);
      mir.eyes = "half"; F.face(mir, "tired"); gesture(mir, "tap");
      await v5;
      // a shrug shakes the dust off
      mir.eyes = "open"; F.face(mir, "happy"); gesture(mir, "shrug", 180);
      sfx("boing", 0.8);
      p.emit("puff", mir.x, mir.y - 300, 8, { spread: 260, vy: -80, g: 160, r: 11, life: 0.9, fill: "#cfc7b8", ink: "rgba(40,40,40,0.4)" });
      mir.dust = 0;
      await F.keys(mir, [[{ sy: 1.08, sx: 0.95 }, 150, EZ.out], [{ sy: 1, sx: 1 }, 350, EZ.elastic]]);
    }
    F.remove(years);

    // --- 6. "No battery. No motor. I cannot call you. But when your light reaches me, I send it straight back."
    const v6 = speak(6, mir);
    const ic = [F.icon("battery", { x: 420, y: 170, s: 0.6 }), F.icon("gear", { x: 640, y: 150, s: 0.6 }), F.icon("voice", { x: 860, y: 170, s: 0.6 })];
    const w6 = [["battery", 0.4], ["motor", 1.5], ["call", 2.9]];
    // the team's drawn frames when they are there: it counts on its fingers, shrugs, droops, then gets an idea
    let tk = null;
    const pose6 = (k) => {           // one drawn pose in two small steps, with a little squash as it lands
      if (!tk) return;
      tk.frame = k; tk.sx = 1.04; tk.sy = 0.96;
      tw(tk, { sx: 1, sy: 1 }, 220, EZ.back);
      wait(90).then(() => { if (tk) tk.frame = k + 1; }).catch(() => {});
    };
    if (F.hasSprites("E6_espejo_cuenta")) {
      tk = F.spriteSet("E6_espejo_cuenta", { x: mir.x + 4, y: mir.y + 8, w: 330, ay: 1, z: 21, frame: 9 });
      F.add(tk); mir.op = 0;
    } else {
      mir.eyes = "open"; F.face(mir, "sad");
      tw(mir, { sy: 0.95 }, 600, EZ.inOut);
    }
    for (let i = 0; i < 3; i++) {
      await atw(6, w6[i][0], 0, w6[i][1]);
      ic[i].xp = 1; ic[i].s = 0.6;
      // the drawn Mirror counts on its fingers: no crossed-out icons needed (they broke the style)
      if (tk) { pose6(i * 2); sfx("pop", 1 + i * 0.15); } else { gesture(mir, ["one", "two", "three"][i], 200); F.popIn(ic[i], 300, "pop"); }
    }
    if (tk) {
      await wait(550); pose6(6);          // "I cannot call you": a sad shrug
      await wait(500); pose6(8);          // ...and it droops
    }
    await atw(6, "but", 0, 4.4);
    if (!tk) ic.forEach((x) => F.popOut(x));
    if (tk) {
      pose6(10); sfx("ting", 1.5);        // "But…": an idea, finger up
      wait(520).then(() => pose6(14)).catch(() => {});     // ...then both gloves open toward the viewer
    } else {
      mir.eyes = "open"; mir.brows = true; F.face(mir, "curious"); gesture(mir, "pointUp", 220);
      tw(mir, { sy: 1.05 }, 250, EZ.out).then(() => tw(mir, { sy: 1 }, 400, EZ.back)).catch(() => {});
    }
    await atw(6, "reaches", 0, 5.4);
    if (tk) { F.remove(tk); tk = null; mir.op = 1; mir.sy = 1; F.faceNow(mir, "happy"); }
    if (F.hasSprites("E7_espejo_atrapa")) {
      // the team's drawn frames: it catches the photon like a ball and throws it straight back
      const pitch = F.spriteSet("E7_espejo_atrapa", { x: mir.x + 4, y: mir.y + 8, w: 330, ay: 1, z: 21, frame: 0 });
      F.add(pitch); mir.op = 0;
      // (drawings 4, 13 and 14 came out with the colours swapped, so they are skipped; the poses hold a little longer)
      for (const [i, ms] of [[0, 140], [1, 140], [2, 180], [3, 140], [5, 130], [6, 130], [7, 160], [8, 110], [9, 110], [10, 110], [11, 200], [12, 140], [15, 220]]) {
        pitch.frame = i;
        if (i === 2) { sfx("ting", 1.3); F.shake(6); pitch.sx = 1.1; pitch.sy = 0.9; tw(pitch, { sx: 1, sy: 1 }, 300, EZ.elastic); }
        if (i === 10) { sfx("whoosh", 1.3); pitch.sx = 0.92; pitch.sy = 1.08; tw(pitch, { sx: 1, sy: 1 }, 300, EZ.back); }
        await wait(ms);
      }
      mir.op = 1; F.remove(pitch);
    }
    await cornerCube(6);
    await v6;

    // --- 7. The number: half the round trip tells the distance
    await numberShot();
    // --- 8. "Nobody guessed it. They timed it."
    await timedShot();
    // --- 9. "And you don't have to take my word for it. Look."
    await lookShot();
    // --- 10-12. The chart of real measurements, in a 1930s theater
    await theaterShots();
    // --- 13. The neighbors
    await neighborsShot();
  }

  // ---------- inside one of the mirror's glass corners: the light goes straight back ----------
  async function cornerCube(n) {
    const cx = W / 2, cy = H / 2 + 20;
    const cube = F.custom(function (c, t) {
      // three square mirrors meeting in one corner, seen from the front: three diamonds
      const R = 230;
      const faces = [[-Math.PI / 2, "#9fc7d9"], [Math.PI / 6, "#7fb0c6"], [5 * Math.PI / 6, "#b7dbe8"]];
      c.lineJoin = "round";
      for (const f of faces) {
        const a = f[0];
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(a - Math.PI / 3) * R, cy + Math.sin(a - Math.PI / 3) * R);
        c.lineTo(cx + Math.cos(a) * R * 1.15, cy + Math.sin(a) * R * 1.15);
        c.lineTo(cx + Math.cos(a + Math.PI / 3) * R, cy + Math.sin(a + Math.PI / 3) * R);
        c.closePath();
        c.fillStyle = f[1]; c.fill();
        c.strokeStyle = F.INK; c.lineWidth = 7; c.stroke();
      }
      // it is a corner seen from inside: deeper (darker) toward the middle
      const deep = c.createRadialGradient(cx, cy, 4, cx, cy, R * 1.05);
      deep.addColorStop(0, "rgba(10,30,55,0.55)"); deep.addColorStop(0.6, "rgba(10,30,55,0.15)"); deep.addColorStop(1, "rgba(10,30,55,0)");
      c.fillStyle = deep; c.beginPath(); c.arc(cx, cy, R * 1.1, 0, 6.2832); c.fill();
      // shine
      c.globalAlpha = 0.5 + 0.2 * Math.sin(t / 300);
      c.strokeStyle = "#fff"; c.lineWidth = 5; c.lineCap = "round";
      c.beginPath(); c.moveTo(cx - 120, cy - 60); c.lineTo(cx - 70, cy - 110); c.stroke();
      c.globalAlpha = 1;
      // the path of the light
      if (this.k > 0) {
        const pts = this.pts, segs = pts.length - 1, upto = this.k * segs;
        c.strokeStyle = "#ffe07a"; c.lineWidth = 6; c.setLineDash([14, 10]); c.lineDashOffset = -t / 30;
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i <= Math.ceil(upto); i++) {
          const u = Math.min(1, upto - (i - 1));
          c.lineTo(F.lerp(pts[i - 1][0], pts[i][0], u), F.lerp(pts[i - 1][1], pts[i][1], u));
        }
        c.stroke(); c.setLineDash([]);
      }
    }, { par: 0, z: 10, k: 0 });
    // in, bounce, bounce, bounce, out: parallel to the way in
    cube.pts = [[120, 60], [cx - 80, cy - 40], [cx + 60, cy - 10], [cx + 10, cy + 90], [cx - 150 + 330, 60 + 330 - 400]];
    cube.pts[4] = [cube.pts[3][0] - (cube.pts[1][0] - 120), cube.pts[3][1] - (cube.pts[1][1] - 60)];
    const ph = F.photon({ s: 0.9, z: 20, par: 0 });
    const lab = F.stamp(["Inside one of the mirror's 100 glass corners"], { x: W / 2, y: 660, size: 26, style: "ink" });
    const p = F.particles({ z: 30, par: 0 });
    F.scene([F.stars({ n: 200, par: 0 }), cube, ph, p], { bg: "#0b0f1c" });
    F.popIn(lab, 300);
    const pts = cube.pts;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      ph.x = a[0]; ph.y = a[1]; ph.dir = Math.atan2(b[1] - a[1], b[0] - a[0]);
      await F.tw({ u: 0 }, { u: 1 }, i === 1 ? 650 : 330, i === 1 ? EZ.in : EZ.lin, (e) => {
        ph.x = F.lerp(a[0], b[0], e); ph.y = F.lerp(a[1], b[1], e);
        cube.k = (i - 1 + e) / (pts.length - 1);
      });
      if (i < pts.length - 1) {
        sfx("ting", 1 + i * 0.25);
        p.emit("spark", b[0], b[1], 5, { spread: 10, vy: 0, vyr: 160, vxr: 160, g: 0, r: 10, life: 0.4, fill: "#ffe07a" });
        ph.stretch = -0.3; tw(ph, { stretch: 0 }, 200, EZ.out);
      }
    }
    F.remove(ph);
    const back = F.stamp(["Straight back to where it came from!"], { x: W / 2, y: 90, size: 34, style: "gold" });
    F.popIn(back, 380, "tada");
    await at(n, 99);
    await wait(400);
  }

  // ---------- 7: the number on the screen ----------
  async function numberShot() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    const sw = F.stopwatch({ x: 930, y: 300, s: 0.95, sec: shot.tof, digits: 6, label: "your light's round trip" });
    mir.x = 330; mir.y = 640; mir.s = 0.5; mir.eyes = "open"; mir.mouth = "smile"; mir.brows = false;
    F.faceNow(mir, "curious"); gesture(mir, "right", 1);
    const p = fx();
    F.scene([luna, mir, p], { bg: "#05060a", cam: { x: 640, y: 360, z: 1 } });
    const v7 = speak(7, mir);
    if (F.hasSprites("F2_foton_cronometro")) {
      // the little photon runs across with the stopwatch over its head: it brings the time home
      const run = F.spriteSet("F2_foton_cronometro", { x: -120, y: 702, w: 150, ay: 1, z: 25, fps: 14,
        frames: [0, 1, 2, 3, 4, 6, 7].map((i) => "spr_F2_foton_cronometro_" + i) });
      F.add(run);
      sfx("whoosh", 0.9);
      let last = 0;
      const off = F.onFrame((t) => {
        if (t - last > 150 && run.x > 0 && run.x < W) {
          last = t;
          p.emit("puff", run.x - 35, 698, 2, { spread: 10, vy: -30, vyr: 30, vxr: 60, g: 40, r: 8, life: 0.5, fill: "#cfc7b8" });
        }
      });
      tw(run, { x: W + 140 }, 2400, EZ.lin).catch(() => {}).then(() => { off(); F.remove(run); });
      await wait(1450);
    }
    F.popIn(sw, 500, "pop");
    mir.lx = 6;
    await atw(7, "same", 0, 8.4);
    // light always runs at the same speed
    const space = F.plate("sc_espacio", { x: 0, y: 0, w: 1680, h: 720 });
    const ph = F.photon({ s: 0.9, x: 200, y: 360, dir: 0 });
    const speed = F.stamp(["299,792 km every second"], { x: W / 2, y: 120, size: 38, style: "card", kicker: "the speed of light, always" });
    F.scene([space, spacePatch(space), F.stars({ n: 160, par: 0.3, w: 2000, h: 900, x: -200, y: -100 }), ph], { bg: "#000", cam: { x: 840, y: 360, z: 1 } });
    F.popIn(speed, 400);
    sfx("whoosh", 1.2);
    tw(ph, { x: 1480 }, 1800, EZ.lin);
    await atw(7, "half", 0, 11);
    // half the trip there, half back
    F.scene([luna, mir, p, sw], { bg: "#05060a", cam: { x: 640, y: 360, z: 1 } });
    sw.label = "half there, half back";
    F.face(mir, "happy"); gesture(mir, "present");
    sfx("slideUp");
    await tw(sw, { split: 1 }, 700, EZ.inOut);
    const halfS = F.stamp([(shot.tof / 2).toFixed(6) + " s each way"], { x: 930, y: 560, size: 30, style: "card" });
    F.popIn(halfS, 360);
    await atw(7, "far", 0, 13.8);
    // how far: time each way multiplied by the speed of light
    const tape = F.custom(function (c) {
      const x0 = 150, x1 = 150 + (1530 - 150) * this.k, y = 470;
      c.fillStyle = "#e9c86b"; c.strokeStyle = F.INK; c.lineWidth = 4;
      c.fillRect(x0, y - 14, x1 - x0, 28); c.strokeRect(x0, y - 14, x1 - x0, 28);
      c.lineWidth = 2;
      for (let x = x0 + 30; x < x1; x += 30) { c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x, y - (x % 150 < 30 ? 0 : 6)); c.stroke(); }
    }, { z: 30, k: 0 });
    const dist = F.stamp([fmtKm(shot.km * 0)], { x: W / 2, y: 140, size: 50, style: "gold", kicker: "telescope to mirror" });
    F.scene([space, spacePatch(space), F.stars({ n: 160, par: 0.3, w: 2000, h: 900, x: -200, y: -100 }), tape], { bg: "#000", cam: { x: 840, y: 360, z: 0.78 } });
    F.add(dist); dist.s = 1;
    sfx("slideUp", 0.6);
    await tw(tape, { k: 1 }, 1600, EZ.inOut, (e) => { dist.lines = [fmtKm(shot.km * e)]; });
    sfx("ding");
    dist.sx = 1.15; dist.sy = 0.88; tw(dist, { sx: 1, sy: 1 }, 400, EZ.elastic);
    await v7;
    await wait(600);
  }

  // ---------- 8: nobody guessed it, they timed it ----------
  async function timedShot() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 640; mir.y = 610; mir.s = 0.6; mir.eyes = "open"; mir.mouth = "smile";
    const p = fx();
    F.scene([luna, mir, p], { bg: "#05060a", cam: { x: 640, y: 380, z: 1.1 } });
    F.faceNow(mir, "neutral"); gesture(mir, "present", 1);
    const v8 = speak(8, mir);
    await atw(8, "guessed", 0, 3.9);
    const guess = F.stamp(["100 km?", "1 million km?"], { x: 330, y: 220, size: 34, style: "card", rot: -0.08, kicker: "a guess" });
    F.popIn(guess, 380, "squeak");
    mir.eyes = "open"; mir.lx = -8; F.face(mir, "worried"); gesture(mir, "shrug");
    await wait(900);
    // the guess goes up in a little cartoon puff (instead of loose white sparks)
    sfx("pop", 0.5);
    p.emit("puff", 330, 220, 9, { spread: 140, vy: -30, vyr: 60, vxr: 160, g: -10, r: 16, life: 0.7, fill: "#f3e6c8", ink: "rgba(60,40,30,0.45)" });
    F.popOut(guess, 160);
    await atw(8, "timed", 0, 5.6);
    mir.eyes = "open"; mir.lx = 0; F.face(mir, "proud"); gesture(mir, "thumb", 200);
    const sw = F.stopwatch({ x: 960, y: 290, s: 0.8, sec: shot.tof, digits: 6, label: "timed!" });
    await F.stampDown(sw);
    sfx("click");
    await v8;
    await wait(300);
  }

  // ---------- 9: "Look." ----------
  async function lookShot() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 640; mir.y = 610; mir.s = 0.6; mir.eyes = "open"; mir.mouth = "smile";
    F.scene([luna, mir], { bg: "#05060a", cam: { x: 640, y: 380, z: 1.1 } });
    const v9 = speak(9, mir);
    const drawn9 = F.hasSprites("E9_espejo_secreto");
    // the camera leans in to hear a secret (the drawn Mirror sits lower in its frame, so aim lower)
    tw(F.cam, drawn9 ? { z: 1.5, y: 450 } : { z: 1.7, y: 330 }, 2600, EZ.inOut);
    if (drawn9) {
      // the team's drawn frames: it looks around, whispers, then pulls a rope to open the show
      const se = F.spriteSet("E9_espejo_secreto", { x: mir.x + 4, y: mir.y + 8, w: 320, ay: 1, z: 21, frame: 0 });
      F.add(se); mir.op = 0;
      const seq = async (s) => { for (const [f, ms, snd] of s) { se.frame = f; if (snd) sfx(snd); await wait(ms); } };
      await seq([[0, 260], [1, 200], [2, 200, "tick"], [3, 260, "tock"], [4, 160], [5, 260, "sparkle"], [6, 160], [7, 0]]);
      await atw(9, "look", 0, 3.6);
      await seq([[8, 120], [9, 160], [12, 140, "click"], [13, 220, "boing"], [14, 160], [15, 0]]);
      await v9;
      await wait(450);
      F.remove(se); mir.op = 1;
      return;
    }
    mir.lx = 7; mir.ly = 2; F.face(mir, "curious"); gesture(mir, "whisper", 300);
    await atw(9, "look", 0, 3.6);
    mir.lx = 0; mir.ly = 0; F.face(mir, "surprised"); gesture(mir, "right", 180);
    await v9;
  }

  // ---------- 10-12: the real measurements on a movie screen ----------
  const SCREEN = { x0: 318, y0: 198, x1: 962, y1: 534 };   // the white screen in the painted theater
  async function theaterShots() {
    const hall = F.plate("sc_teatro", { x: 0, y: 0, w: 1280, h: 720 });
    const chart = F.llrChart({ x0: SCREEN.x0, y0: SCREEN.y0, x1: SCREEN.x1, y1: SCREEN.y1, prog: 0, line: 0, z: 10, op: 0 });
    const curtains = F.custom(function (c) {
      const k = this.k, w = (SCREEN.x1 - SCREEN.x0) / 2 + 40;
      for (const side of [-1, 1]) {
        const cx = (SCREEN.x0 + SCREEN.x1) / 2 + side * (w / 2 + w * k);
        c.fillStyle = "#8f1f1a"; c.strokeStyle = F.INK; c.lineWidth = 5;
        c.fillRect(cx - w / 2, SCREEN.y0 - 40, w, SCREEN.y1 - SCREEN.y0 + 80);
        c.strokeRect(cx - w / 2, SCREEN.y0 - 40, w, SCREEN.y1 - SCREEN.y0 + 80);
        c.strokeStyle = "rgba(40,0,0,0.6)"; c.lineWidth = 3;
        for (let i = 1; i < 6; i++) { const x = cx - w / 2 + i * w / 6; c.beginPath(); c.moveTo(x, SCREEN.y0 - 40); c.lineTo(x + Math.sin(i) * 6, SCREEN.y1 + 40); c.stroke(); }
      }
    }, { z: 12, k: 0 });
    const beam = F.custom(function (c, t) {
      const fl = 0.16 + 0.04 * Math.sin(t / 37) * Math.sin(t / 91);
      const g = c.createLinearGradient(640, 760, 640, SCREEN.y0);
      g.addColorStop(0, "rgba(255,246,210," + (fl * 2).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,246,210,0)");
      c.globalAlpha = this.op; c.fillStyle = g;
      c.beginPath(); c.moveTo(620, 760); c.lineTo(SCREEN.x0, SCREEN.y0); c.lineTo(SCREEN.x1, SCREEN.y0); c.lineTo(SCREEN.x1, SCREEN.y1); c.lineTo(SCREEN.x0, SCREEN.y1); c.lineTo(660, 760); c.closePath(); c.fill();
    }, { z: 11, op: 0 });
    const presenter = F.mirror({ x: 1135, y: 650, s: 0.4, eyes: "open", mouth: "smile", z: 30, par: 0 });
    gesture(presenter, "left", 1);
    const p = fx();
    F.scene([hall, chart, beam, curtains, presenter, p, F.credit("Dots: NASA CDDIS / ILRS laser ranging normal points, 2025-2026. Line: NASA/JPL Horizons.")], { bg: "#1a0e0a", cam: { x: 640, y: 360, z: 1.05 } });
    sfx("whoosh");
    tw(curtains, { k: 1 }, 1100, EZ.inOut);
    tw(beam, { op: 1 }, 600, EZ.inOut);
    await tw(chart, { op: 1 }, 600, EZ.inOut);
    tw(F.cam, { x: (SCREEN.x0 + SCREEN.x1) / 2 + 40, y: (SCREEN.y0 + SCREEN.y1) / 2 + 40, z: 1.25 }, 2000, EZ.inOut);

    // 10. every dot is a real measurement
    const v10 = speak(10, presenter);
    tw(chart, { prog: 1 }, 7000, EZ.inOut, (e) => { if (Math.random() < 0.15) sfx("tick"); });
    await atw(10, "someone", 0, 7.6);
    F.face(presenter, "curious");
    const tally = F.stamp([countBy("GRSM") + " from Grasse, France", countBy("APOL") + " from Apache Point, USA"], { x: 1080, y: 150, size: 24, style: "card", rot: 0.04, kicker: LLR.length + " real measurements" });
    F.popIn(tally, 420);
    await atw(10, "answer", 0, 14.2);
    sfx("sparkle"); sfx("tada");
    tw(chart, { glowAll: 1 }, 200, EZ.out).then(() => tw(chart, { glowAll: 0 }, 800, EZ.inOut)).catch(() => {});
    presenter.sy = 1.1; tw(presenter, { sy: 1 }, 500, EZ.elastic);
    F.face(presenter, "happy"); gesture(presenter, "cheer", 200);
    await v10;
    F.popOut(tally);

    // 11. the wave: the Moon swings closer and farther
    const v11 = speak(11, presenter);
    await atw(11, "wave", 0, 0.6);
    F.face(presenter, "curious"); gesture(presenter, "left");
    sfx("slideUp", 0.8);
    tw(chart, { line: 1 }, 2200, EZ.inOut);
    await atw(11, "closer", 0, 2.8);
    await swingShot(11);
    F.scene([hall, chart, beam, presenter, p], { bg: "#1a0e0a", cam: { x: (SCREEN.x0 + SCREEN.x1) / 2 + 40, y: (SCREEN.y0 + SCREEN.y1) / 2 + 40, z: 1.25 } });
    await v11;

    // 12. the dots sit below the line: both ends stand on the surfaces
    const v12 = speak(12, presenter);
    await atw(12, "because", 0, 2.6);
    await surfacesShot(12);
    F.scene([hall, chart, beam, presenter, p], { bg: "#1a0e0a", cam: { x: (SCREEN.x0 + SCREEN.x1) / 2 + 40, y: (SCREEN.y0 + SCREEN.y1) / 2 + 40, z: 1.25 } });
    await atw(12, "agree", 0, 10);
    F.face(presenter, "proud"); gesture(presenter, "thumb", 200);
    const ok = F.stamp(["The numbers agree"], { x: W / 2, y: H / 2, size: 56, style: "gold", rot: -0.05 });
    await F.stampDown(ok);
    sfx("tada");
    await v12;
    await wait(500);
  }

  // the Moon really does swing closer and farther: real distances from JPL Horizons
  async function swingShot(n) {
    const orbit = window.MOON_ORBIT;
    let kmMin = Infinity, kmMax = 0;
    orbit.forEach((p) => { kmMin = Math.min(kmMin, p[1]); kmMax = Math.max(kmMax, p[1]); });
    const space = F.plate("sc_espacio", { x: -200, y: 0, w: 1680, h: 720 });
    const moon = F.sprite("moon", { x: 1000, y: 360, w: 150, z: 20 });
    const readout = F.stamp([fmtKm(kmMax)], { x: W / 2, y: 110, size: 44, style: "gold", kicker: "Earth to Moon, center to center" });
    const state = { u: 0 };
    F.scene([space, spacePatch(space), F.stars({ n: 160, par: 0.3, w: 2000, h: 900, x: -200, y: -100 }), moon, readout], { bg: "#000", cam: { x: 640, y: 360, z: 1 } });
    // one month of real data, played in about four seconds
    const i0 = 0, i1 = Math.min(orbit.length - 1, 4 * 30);
    await F.tw(state, { u: 1 }, 4200, EZ.inOut, (e) => {
      const i = Math.round(F.lerp(i0, i1, e)), km = orbit[i][1];
      const k = (km - kmMin) / (kmMax - kmMin);
      moon.x = 760 + k * 420;
      moon.s = 1.15 - k * 0.3;
      readout.lines = [fmtKm(km)];
    });
  }

  // why the dots sit below the line: the telescope and the mirror stand on the surfaces
  async function surfacesShot(n) {
    const E = { x: 300, y: 380, r: 210 }, Mo = { x: 1010, y: 380, r: 90 };
    const diag = F.custom(function (c) {
      if (F.ready(IM.earth)) c.drawImage(IM.earth, E.x - E.r, E.y - E.r, E.r * 2, E.r * 2);
      if (F.ready(IM.moon)) c.drawImage(IM.moon, Mo.x - Mo.r, Mo.y - Mo.r, Mo.r * 2, Mo.r * 2);
      c.setLineDash([12, 10]); c.strokeStyle = F.PAPER; c.lineWidth = 4;
      c.beginPath(); c.moveTo(E.x, E.y); c.lineTo(E.x + (Mo.x - E.x) * this.k1, Mo.y); c.stroke();
      c.setLineDash([]);
      c.fillStyle = F.PAPER; c.beginPath(); c.arc(E.x, E.y, 8, 0, 6.2832); c.fill(); c.beginPath(); c.arc(Mo.x, Mo.y, 6, 0, 6.2832); c.fill();
      if (this.k2 > 0) {
        c.strokeStyle = "#ffe07a"; c.lineWidth = 9; c.lineCap = "round";
        const x0 = E.x + E.r, x1 = x0 + (Mo.x - Mo.r - x0) * this.k2;
        c.beginPath(); c.moveTo(x0, E.y - 26); c.lineTo(x1, E.y - 26); c.stroke();
        c.fillStyle = "#ffe07a"; c.beginPath(); c.arc(x0, E.y - 26, 10, 0, 6.2832); c.fill();
      }
      c.font = "bold 24px " + F.FONT; c.textAlign = "center"; c.lineWidth = 6; c.strokeStyle = F.INK;
      c.fillStyle = F.PAPER; c.strokeText("center to center: the line", (E.x + Mo.x) / 2, E.y + 50); c.fillText("center to center: the line", (E.x + Mo.x) / 2, E.y + 50);
      if (this.k2 > 0.5) {
        c.globalAlpha = Math.min(1, (this.k2 - 0.5) * 2);
        c.fillStyle = "#ffe07a"; c.strokeText("surface to surface: the dots", (E.x + Mo.x) / 2 + 40, E.y - 62); c.fillText("surface to surface: the dots", (E.x + Mo.x) / 2 + 40, E.y - 62);
      }
    }, { par: 0, z: 10, k1: 0, k2: 0 });
    F.scene([F.stars({ n: 200, par: 0 }), diag, F.credit("Sizes and distance not to scale.")], { bg: "#05060a" });
    sfx("slideUp", 0.7);
    await tw(diag, { k1: 1 }, 1100, EZ.inOut);
    await atw(n, "surface", 0, 5.6);
    sfx("slideUp", 1.2);
    await tw(diag, { k2: 1 }, 1100, EZ.inOut);
    await atw(n, "numbers", 0, 9.4);
  }

  // ---------- 13: the neighbors ----------
  async function neighborsShot() {
    const luna = F.plate("sc_luna", { x: -40, y: -24, w: 1360, h: 765 });
    mir.x = 640; mir.y = 610; mir.s = 0.6; mir.eyes = "open"; mir.mouth = "smile";
    F.faceNow(mir, "neutral"); gesture(mir, "rest", 1);
    const mars = F.custom(function (c, t) {
      const r = 5 + Math.sin(t / 200) * 1.5;
      const g = c.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 5);
      g.addColorStop(0, "rgba(255,140,90,0.9)"); g.addColorStop(1, "rgba(255,140,90,0)");
      c.fillStyle = g; c.beginPath(); c.arc(this.x, this.y, r * 5, 0, 6.2832); c.fill();
      c.fillStyle = "#e0703c"; c.beginPath(); c.arc(this.x, this.y, r, 0, 6.2832); c.fill();
    }, { z: 5, x: 1080, y: 110 });
    F.scene([luna, F.stars({ n: 120, par: 0.2, w: W * 1.4, h: 260, y: -40 }), mars, mir], { bg: "#05060a", cam: { x: 640, y: 380, z: 1.1 } });
    await F.irisIn(W / 2, H / 2, 600);
    const v13 = speak(13, mir);
    // the team's drawn frames when they are there: it shades its eyes, grows sad, smiles bravely, looks up hopeful
    let far = null;
    if (F.hasSprites("E11_espejo_mira_lejos")) {
      far = F.spriteSet("E11_espejo_mira_lejos", { x: mir.x + 4, y: mir.y + 8, w: 320, ay: 1, z: 21, frame: 0 });
      F.add(far); mir.op = 0;
    }
    const pose = (k) => { if (!far) return; far.frame = k; wait(100).then(() => { if (far) far.frame = k + 1; }).catch(() => {}); };
    await atw(13, "neighbors", 0, 1.0);
    mir.lx = 9; mir.ly = -3; F.face(mir, "sad"); gesture(mir, "shade"); pose(2);
    await atw(13, "cannot", 0, 3.84);
    pose(4);
    await atw(13, "measurement", 0, 7.0);
    F.face(mir, "happy"); pose(6);
    await atw(13, "introduce", 0, 8.4);
    F.face(mir, "curious"); gesture(mir, "pointUp", 200); pose(8);
    sfx("whoosh");
    gesture(mir, "rest", 300);
    tw(F.cam, { x: mars.x, y: mars.y + 40, z: 2.2 }, 1500, EZ.inOut);
    await v13;
    await F.irisOut(F.toScreen(mars.x, mars.y).x, F.toScreen(mars.x, mars.y).y, 700);
    if (far) { F.remove(far); far = null; mir.op = 1; }
    mir.lx = 0; mir.ly = 0;
  }

  // =================== chapters, jumps and the start ===================
  const chaptersNav = F.$("chapters");
  function setChapter(n) {
    chaptersNav.querySelectorAll("button").forEach((b) => b.classList.toggle("current", +b.getAttribute("data-ch") === n));
  }
  F.setChapter = setChapter;
  const CHAPTERS = {};
  F.CHAPTERS = CHAPTERS;
  CHAPTERS[1] = chapter1;
  F.story = { mir, speak, atw, at, chapterCard, fx, LUNA, setChapter, fmtKm, fmtDate };

  async function playFrom(n) {
    for (let k = n; k <= 4; k++) {
      if (!CHAPTERS[k]) break;
      await CHAPTERS[k]();
    }
    if (!CHAPTERS[4]) await theEnd();
  }
  async function theEnd() {
    setChapter(4);
    F.scene([F.stamp(["The End"], { x: W / 2, y: H / 2, size: 90, style: "gold", par: 0 })], { bg: "#0b0b0b" });
    await F.irisIn(W / 2, H / 2, 700);
    F.show(F.$("again"));
  }
  function resetAll() {
    F.runId++;
    F.stopVoice();
    F.$("stage").classList.add("instant");
    requestAnimationFrame(() => requestAnimationFrame(() => F.$("stage").classList.remove("instant")));
    ["send", "greet", "again", "oppPanel"].forEach((id) => F.hide(F.$(id)));
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    F.ov.iris = 2000; F.ov.fade = 0; F.ov.flash = 0; F.ov.snapA = 0;
    scopeIdle = true;
    mir.op = 1;
    F.scene([], { bg: "#000" });
  }
  F.resetAll = resetAll;
  chaptersNav.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-ch]");
    if (!b) return;
    e.stopPropagation();
    b.blur();
    const n = +b.getAttribute("data-ch");
    resetAll();
    F.guard(playFrom(n));
  });
  F.$("again").addEventListener("click", (e) => {
    e.stopPropagation();
    resetAll();
    F.guard(playFrom(1));
  });

  // ---------- start ----------
  const goBtn = F.$("go"), startEl = F.$("start"), hint = F.$("loadHint");
  const params = new URLSearchParams(location.search);
  F.AUTOPLAY = params.has("auto");
  goBtn.disabled = true;
  hint.textContent = "Loading the pictures…";
  // the title screen has music too: browsers only allow sound after the first click or key, so that first
  // gesture "starts the projector" (a flutter of clicks and the music), and only then the Start button appears
  let gated = !F.AUTOPLAY && !F.RENDER;
  startEl.classList.toggle("gated", gated);
  function openGate(e) {
    if (!gated) return;
    gated = false;
    ["pointerdown", "keydown"].forEach((ev) => window.removeEventListener(ev, openGate, true));
    if (e) { e.preventDefault(); e.stopPropagation(); }
    F.audioInit();
    sfx("projector");
    F.music("assets/music/tierna.mp3", 0.3);
    startEl.classList.add("lit");
    setTimeout(() => startEl.classList.remove("gated"), 450);     // so the same click cannot also press Start
  }
  if (gated) ["pointerdown", "keydown"].forEach((ev) => window.addEventListener(ev, openGate, true));
  loading.then(() => {
    goBtn.disabled = false;
    hint.textContent = "Turn your sound on · about 6 minutes";
    if (F.AUTOPLAY) goBtn.click();
  });
  goBtn.addEventListener("click", () => {
    F.renderLog.t0 = performance.now();
    F.audioInit();
    goBtn.blur();
    F.hide(startEl);
    F.show(chaptersNav);
    const from = +(params.get("ch") || 0);
    F.guard((async () => {
      if (!from) { await opening(); await playFrom(1); }
      else await playFrom(from);
    })());
  });
})();
